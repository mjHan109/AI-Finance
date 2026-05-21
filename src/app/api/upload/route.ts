import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseFile } from "@/modules/files/parse"
import { fingerprint } from "@/modules/files/normalize"
import { mapBanksaladCategory } from "@/modules/categories/rules"
import { classifyTransaction, buildCorrectionMap } from "@/modules/categories/classify"
import { log } from "@/lib/logger"

const MAX_FILE_SIZE    = 10 * 1024 * 1024
const ALLOWED_EXTS     = ["xlsx", "xls", "csv"]
const XLSX_MAGIC       = Buffer.from([0x50, 0x4b])
const XLS_MAGIC        = Buffer.from([0xd0, 0xcf])
const UPLOAD_LIMIT     = 20
const UPLOAD_WINDOW_MS = 60 * 60 * 1000

function sanitizeString(s: string | null, maxLen: number): string | null {
  if (!s) return null
  return s.trim().slice(0, maxLen).replace(/[<>"'`]/g, "")
}

function validateMagicBytes(buffer: Buffer, ext: string): boolean {
  if (ext === "xlsx") return buffer.slice(0, 2).equals(XLSX_MAGIC)
  if (ext === "xls")  return buffer.slice(0, 2).equals(XLS_MAGIC)
  return !buffer.slice(0, 512).includes(0x00)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }
  const userId = session.user.id

  const since       = new Date(Date.now() - UPLOAD_WINDOW_MS)
  const recentCount = await prisma.uploadedFile.count({
    where: { userId, parsedAt: { gte: since } },
  })
  if (recentCount >= UPLOAD_LIMIT) {
    log("warn", "rate_limited", { event_detail: "upload", userId })
    return NextResponse.json(
      { error: "1시간에 최대 20회까지 업로드할 수 있습니다." },
      { status: 429 },
    )
  }

  const formData      = await req.formData()
  const file          = formData.get("file") as File | null
  const rawAccountName = formData.get("accountName") as string | null
  const rawAccountType = formData.get("accountType") as string | null

  const accountName = sanitizeString(rawAccountName, 50)
  const accountType = sanitizeString(rawAccountType, 10)

  if (!file) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 })
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9가-힣._\-\s]/g, "")
  const ext      = safeName.split(".").pop()?.toLowerCase() ?? ""
  if (!ALLOWED_EXTS.includes(ext)) {
    return NextResponse.json({ error: "xlsx, xls, csv 파일만 업로드 가능합니다." }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "파일 크기는 10MB를 초과할 수 없습니다." }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  if (!validateMagicBytes(buffer, ext)) {
    return NextResponse.json({ error: "파일 형식이 올바르지 않습니다." }, { status: 400 })
  }

  const parsed = await parseFile(buffer, file.name)
  if (parsed.transactions.length === 0) {
    log("warn", "upload", { userId, file: safeName, result: "empty_parse", errors: parsed.errors })
    return NextResponse.json({ error: "거래 내역을 파싱할 수 없습니다.", detail: parsed.errors }, { status: 422 })
  }

  let financialAccountId: string | null = null
  if (accountName && accountType) {
    const validTypes = ["BANK", "CARD", "CASH"]
    const type = validTypes.includes(accountType.toUpperCase())
      ? (accountType.toUpperCase() as "BANK" | "CARD" | "CASH")
      : "BANK"

    const account = await prisma.financialAccount.upsert({
      where: { userId_name: { userId, name: accountName } },
      update: {},
      create: { userId, name: accountName, type },
    })
    financialAccountId = account.id
  }

  const uploadedFile = await prisma.uploadedFile.create({
    data: {
      userId,
      originalName: safeName.slice(0, 255),
      fileType:     ext,
      rowCount:     parsed.rowCount,
      deletedAt:    new Date(),
    },
  })

  const categoryCache  = new Map<string, string>()
  const allCategories  = await prisma.category.findMany({ select: { id: true, name: true } })
  for (const c of allCategories) categoryCache.set(c.name, c.id)

  // Load user corrections for smart classification
  const corrections = await prisma.userCorrection.findMany({
    where: { userId },
    select: { pattern: true, categoryId: true },
  })
  const correctionMap = buildCorrectionMap(corrections)

  // Build plain catMap for classifyTransaction
  const catMap: Record<string, string> = {}
  for (const [name, id] of categoryCache) catMap[name] = id

  let savedCount = 0
  let dupCount   = 0

  for (const tx of parsed.transactions) {
    const fp = fingerprint(tx.date, tx.description, tx.amount)

    const existing = await prisma.transaction.findUnique({
      where: { userId_fingerprint: { userId, fingerprint: fp } },
    })
    if (existing) { dupCount++; continue }

    let categoryId: string | null = null
    if (tx.isIncome) {
      categoryId = categoryCache.get("금융/이체") ?? null
    } else {
      // Skip 이체/transfer type from Banksalad suggestion (not an expense)
      if (tx.suggestedCategory) {
        const mapped = mapBanksaladCategory(tx.suggestedCategory)
        if (mapped === "금융/이체") { dupCount++; continue }
      }

      const result = classifyTransaction({
        description:   tx.description,
        aiCategory:    tx.suggestedCategory,
        correctionMap,
        catMap,
      })

      // Skip transfers detected via keyword rules
      if (result.source === "keyword_rule" || result.source === "fallback") {
        const catName = Object.entries(catMap).find(([, id]) => id === result.categoryId)?.[0]
        if (catName === "금융/이체") { dupCount++; continue }
      }

      categoryId = result.categoryId
    }

    await prisma.transaction.create({
      data: {
        userId,
        fileId:            uploadedFile.id,
        financialAccountId,
        categoryId,
        classifiedBy:      "RULE",
        rawDate:           tx.rawDate,
        rawDescription:    tx.rawDescription,
        rawAmount:         tx.rawAmount,
        date:              tx.date,
        description:       tx.description,
        amount:            Math.abs(tx.amount),
        isIncome:          tx.isIncome,
        fingerprint:       fp,
      },
    })
    savedCount++
  }

  log("info", "upload", { userId, file: safeName, saved: savedCount, duplicates: dupCount })

  return NextResponse.json({
    ok: true,
    source:     parsed.source,
    total:      parsed.rowCount,
    saved:      savedCount,
    duplicates: dupCount,
    errors:     parsed.errors,
  })
}

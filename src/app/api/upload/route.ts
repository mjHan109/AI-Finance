import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { parseFile } from "@/modules/files/parse"
import { fingerprint } from "@/modules/files/normalize"
import { classifyByKeywords } from "@/modules/categories/rules"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["xlsx", "xls", "csv"]

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }
  const userId = session.user.id

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const accountName = formData.get("accountName") as string | null
  const accountType = formData.get("accountType") as string | null

  if (!file) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 })
  }

  // 확장자 검증
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  if (!ALLOWED_TYPES.includes(ext)) {
    return NextResponse.json({ error: "xlsx, xls, csv 파일만 업로드 가능합니다." }, { status: 400 })
  }

  // 크기 검증
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "파일 크기는 10MB를 초과할 수 없습니다." }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // 파싱
  const parsed = await parseFile(buffer, file.name)

  if (parsed.transactions.length === 0) {
    return NextResponse.json({
      error: "거래 내역을 파싱할 수 없습니다.",
      detail: parsed.errors,
    }, { status: 422 })
  }

  // 계좌 upsert (이름+타입 있으면)
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

  // 파일 기록 저장
  const uploadedFile = await prisma.uploadedFile.create({
    data: {
      userId,
      originalName: file.name,
      fileType: ext,
      rowCount: parsed.rowCount,
      deletedAt: new Date(), // 소스 파일은 메모리에서만 처리, 즉시 삭제 처리
    },
  })

  // 카테고리 캐시 (name → id)
  const categoryCache = new Map<string, string>()
  const allCategories = await prisma.category.findMany({ select: { id: true, name: true } })
  for (const c of allCategories) categoryCache.set(c.name, c.id)

  // 트랜잭션 저장 (중복 skip)
  let savedCount = 0
  let dupCount = 0

  for (const tx of parsed.transactions) {
    const fp = fingerprint(tx.date, tx.description, tx.amount)

    const existing = await prisma.transaction.findUnique({
      where: { userId_fingerprint: { userId, fingerprint: fp } },
    })
    if (existing) { dupCount++; continue }

    // 지출만 카테고리 분류 (수입은 금융/이체로)
    let categoryId: string | null = null
    if (!tx.isIncome) {
      const rule = classifyByKeywords(tx.description)
      categoryId = categoryCache.get(rule.name) ?? categoryCache.get("기타") ?? null
    } else {
      categoryId = categoryCache.get("금융/이체") ?? null
    }

    await prisma.transaction.create({
      data: {
        userId,
        fileId: uploadedFile.id,
        financialAccountId,
        categoryId,
        classifiedBy: "RULE",
        rawDate:        tx.rawDate,
        rawDescription: tx.rawDescription,
        rawAmount:      tx.rawAmount,
        date:           tx.date,
        description:    tx.description,
        amount:         Math.abs(tx.amount),
        isIncome:       tx.isIncome,
        fingerprint:    fp,
      },
    })
    savedCount++
  }

  return NextResponse.json({
    ok: true,
    source: parsed.source,
    total:  parsed.rowCount,
    saved:  savedCount,
    duplicates: dupCount,
    errors: parsed.errors,
  })
}

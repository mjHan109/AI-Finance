import * as XLSX from "xlsx"
import Papa from "papaparse"
import type { ParseResult, FileType } from "./types"
import { parseKB, isKBFormat } from "./parsers/kb"
import { parseBanksalad, isBanksaladFormat } from "./parsers/banksalad"

export async function parseFile(buffer: Buffer, filename: string): Promise<ParseResult> {
  const ext = filename.split(".").pop()?.toLowerCase() as FileType

  if (ext === "csv") {
    return parseCSV(buffer)
  } else {
    return parseExcel(buffer)
  }
}

function parseExcel(buffer: Buffer): ParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false })
  const sheetNames = workbook.SheetNames

  // 뱅크샐러드: "가계부 내역" 시트 우선
  const targetSheet =
    sheetNames.find(s => s.includes("가계부")) ??
    sheetNames[0]

  const sheet = workbook.Sheets[targetSheet]
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
  })

  if (rows.length === 0) {
    return { transactions: [], rowCount: 0, source: "generic", errors: ["파일이 비어 있습니다."] }
  }

  // 헤더 감지: KB는 앞 몇 줄이 메타데이터라 스캔 필요
  const firstDataHeaders = findHeaders(rows)

  if (isBanksaladFormat(sheetNames, firstDataHeaders)) {
    return parseBanksalad(rows)
  }

  if (isKBFormat(firstDataHeaders)) {
    return parseKB(rows)
  }

  // fallback: generic (첫 번째 행이 헤더라 가정하고 KB 파서 시도)
  return parseKB(rows)
}

function parseCSV(buffer: Buffer): ParseResult {
  // EUC-KR 인코딩 대응: Buffer를 latin1로 읽은 후 디코딩
  const text = buffer.toString("utf8")
  const result = Papa.parse<string[]>(text, { header: false, skipEmptyLines: true })
  const rows = result.data as string[][]

  if (rows.length === 0) {
    return { transactions: [], rowCount: 0, source: "generic", errors: ["파일이 비어 있습니다."] }
  }

  const firstDataHeaders = findHeaders(rows)

  if (isBanksaladFormat([], firstDataHeaders)) {
    return parseBanksalad(rows)
  }

  if (isKBFormat(firstDataHeaders)) {
    return parseKB(rows)
  }

  return parseKB(rows)
}

function findHeaders(rows: string[][]): string[] {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i].map(c => c?.toString().trim()).filter(Boolean)
    if (row.length >= 3) return row
  }
  return rows[0]?.map(c => c?.toString().trim()) ?? []
}

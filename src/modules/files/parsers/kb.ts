import type { RawTransaction, ParseResult } from "../types"
import { normalizeAmount, normalizeDate } from "../normalize"

const KB_DATE_COL    = ["거래일시", "거래일"]
const KB_DESC_COL    = ["적요", "내용", "거래내용"]
const KB_OUT_COL     = ["출금액(원)", "출금액", "출금", "인출금액"]
const KB_IN_COL      = ["입금액(원)", "입금액", "입금", "입금금액"]

function matchCol(headers: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.findIndex(h => h?.toString().trim() === c)
    if (idx !== -1) return idx
  }
  return -1
}

/**
 * Finds the header row by scanning for a row containing "거래일시" or "거래일".
 * KB bank prepends 3-4 metadata rows before the actual header.
 */
function findHeaderRow(rows: string[][]): number {
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i].map(c => c?.toString().trim())
    if (KB_DATE_COL.some(k => row.includes(k))) return i
  }
  return -1
}

export function parseKB(rows: string[][]): ParseResult {
  const errors: string[] = []
  const transactions: RawTransaction[] = []

  const headerIdx = findHeaderRow(rows)
  if (headerIdx === -1) {
    return { transactions: [], rowCount: 0, source: "kb", errors: ["헤더 행을 찾을 수 없습니다."] }
  }

  const headers = rows[headerIdx].map(c => c?.toString().trim())
  const dateCol = matchCol(headers, KB_DATE_COL)
  const descCol = matchCol(headers, KB_DESC_COL)
  const outCol  = matchCol(headers, KB_OUT_COL)
  const inCol   = matchCol(headers, KB_IN_COL)

  if (dateCol === -1 || descCol === -1) {
    return { transactions: [], rowCount: 0, source: "kb", errors: ["필수 컬럼(거래일시, 적요)을 찾을 수 없습니다."] }
  }

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.every(c => !c)) continue

    const rawDate = row[dateCol]?.toString().trim() ?? ""
    const rawDesc = row[descCol]?.toString().trim() ?? ""
    const rawOut  = outCol  !== -1 ? row[outCol]?.toString().trim()  ?? "" : ""
    const rawIn   = inCol   !== -1 ? row[inCol]?.toString().trim()   ?? "" : ""

    const date = normalizeDate(rawDate)
    if (!date) { errors.push(`${i + 1}행: 날짜 파싱 실패 (${rawDate})`); continue }

    const outAmt = normalizeAmount(rawOut)
    const inAmt  = normalizeAmount(rawIn)

    // KB: 출금이면 지출(-), 입금이면 수입(+)
    const isIncome = inAmt > 0
    const amount   = isIncome ? inAmt : -outAmt
    const rawAmount = isIncome ? rawIn : rawOut

    if (amount === 0) continue

    transactions.push({ rawDate, rawDescription: rawDesc, rawAmount, date, description: rawDesc, amount, isIncome })
  }

  return { transactions, rowCount: transactions.length, source: "kb", errors }
}

export function isKBFormat(headers: string[]): boolean {
  const h = headers.map(c => c?.toString().trim())
  return KB_DATE_COL.some(k => h.includes(k)) && KB_OUT_COL.some(k => h.includes(k))
}

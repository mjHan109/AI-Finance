import type { RawTransaction, ParseResult } from "../types"
import { normalizeAmount, normalizeDate } from "../normalize"

const BS_DATE_COL   = ["날짜", "거래일", "거래일시"]
const BS_DESC_COL   = ["내용", "거래처명", "사용처", "적요"]
const BS_AMT_COL    = ["금액", "거래금액"]
const BS_TYPE_COL   = ["수입/지출/이체", "수입지출이체", "구분", "유형"]
const BS_CAT_COL    = ["분류", "카테고리"]

const INCOME_LABELS  = ["수입"]
const EXPENSE_LABELS = ["지출"]

function matchCol(headers: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.findIndex(h => h?.toString().trim() === c)
    if (idx !== -1) return idx
  }
  return -1
}

export function parseBanksalad(rows: string[][]): ParseResult {
  const errors: string[] = []
  const transactions: RawTransaction[] = []

  if (rows.length < 2) {
    return { transactions: [], rowCount: 0, source: "banksalad", errors: ["데이터가 없습니다."] }
  }

  const headers = rows[0].map(c => c?.toString().trim())
  const dateCol = matchCol(headers, BS_DATE_COL)
  const descCol = matchCol(headers, BS_DESC_COL)
  const amtCol  = matchCol(headers, BS_AMT_COL)
  const typeCol = matchCol(headers, BS_TYPE_COL)

  if (dateCol === -1 || descCol === -1 || amtCol === -1) {
    return { transactions: [], rowCount: 0, source: "banksalad", errors: ["필수 컬럼(날짜, 내용, 금액)을 찾을 수 없습니다."] }
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.every(c => !c)) continue

    const rawDate = row[dateCol]?.toString().trim() ?? ""
    const rawDesc = row[descCol]?.toString().trim() ?? ""
    const rawAmt  = row[amtCol]?.toString().trim()  ?? ""
    const typeStr = typeCol !== -1 ? row[typeCol]?.toString().trim() ?? "" : ""

    const date = normalizeDate(rawDate)
    if (!date) { errors.push(`${i + 1}행: 날짜 파싱 실패 (${rawDate})`); continue }

    const absAmount = normalizeAmount(rawAmt)
    if (absAmount === 0) continue

    // 뱅크샐러드: 수입/지출 타입으로 방향 결정
    let isIncome = false
    if (INCOME_LABELS.some(l => typeStr.includes(l)))  isIncome = true
    else if (EXPENSE_LABELS.some(l => typeStr.includes(l))) isIncome = false
    else isIncome = absAmount > 0  // fallback: 양수면 수입

    const amount = isIncome ? absAmount : -Math.abs(absAmount)

    const catCol = matchCol(headers, BS_CAT_COL)
    const suggestedCategory = catCol !== -1 ? row[catCol]?.toString().trim() : undefined

    transactions.push({ rawDate, rawDescription: rawDesc, rawAmount: rawAmt, date, description: rawDesc, amount, isIncome, suggestedCategory })
  }

  return { transactions, rowCount: transactions.length, source: "banksalad", errors }
}

export function isBanksaladFormat(sheetNames: string[], headers: string[]): boolean {
  // 뱅크샐러드는 "가계부 내역" 시트 이름이 있거나
  if (sheetNames.some(s => s.includes("가계부"))) return true
  // 또는 헤더에 "분류" + "금액" 조합
  const h = headers.map(c => c?.toString().trim())
  return BS_CAT_COL.some(k => h.includes(k)) && BS_AMT_COL.some(k => h.includes(k))
}

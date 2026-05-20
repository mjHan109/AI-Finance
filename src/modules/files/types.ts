export interface RawTransaction {
  rawDate: string
  rawDescription: string
  rawAmount: string
  date: Date
  description: string
  amount: number   // positive = income, negative = expense
  isIncome: boolean
  suggestedCategory?: string  // 파서가 제공하는 카테고리 힌트 (뱅크샐러드 등)
}

export interface ParseResult {
  transactions: RawTransaction[]
  rowCount: number
  source: "kb" | "banksalad" | "generic"
  errors: string[]
}

export type FileType = "xlsx" | "xls" | "csv"

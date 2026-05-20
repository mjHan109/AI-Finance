export interface RawTransaction {
  rawDate: string
  rawDescription: string
  rawAmount: string
  date: Date
  description: string
  amount: number   // positive = income, negative = expense
  isIncome: boolean
}

export interface ParseResult {
  transactions: RawTransaction[]
  rowCount: number
  source: "kb" | "banksalad" | "generic"
  errors: string[]
}

export type FileType = "xlsx" | "xls" | "csv"

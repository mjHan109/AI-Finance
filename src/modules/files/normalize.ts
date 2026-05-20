/**
 * Normalizes Korean bank amount strings to a number.
 * Handles: "1,234,567", "1234567", "", "0", "-500"
 */
export function normalizeAmount(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined || raw === "") return 0
  const str = String(raw).replace(/,/g, "").trim()
  const num = parseFloat(str)
  return isNaN(num) ? 0 : num
}

/**
 * Parses Korean date strings to Date.
 * Handles: "2024-01-15", "2024-01-15 09:30:00", "2024.01.15", "20240115"
 */
export function normalizeDate(raw: string | number | null | undefined): Date | null {
  if (!raw) return null
  const str = String(raw).trim()

  // Excel serial number
  if (/^\d{5}$/.test(str)) {
    const excelEpoch = new Date(1899, 11, 30)
    return new Date(excelEpoch.getTime() + parseInt(str) * 86400000)
  }

  // YYYY-MM-DD HH:MM:SS or YYYY-MM-DD
  const iso = str.replace(/\./g, "-").replace(/(\d{4})-(\d{2})-(\d{2}).*/, "$1-$2-$3")
  const d = new Date(iso)
  if (!isNaN(d.getTime())) return d

  // YYYYMMDD
  if (/^\d{8}$/.test(str)) {
    return new Date(`${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`)
  }

  return null
}

/**
 * Generates a fingerprint for dedup.
 */
export function fingerprint(date: Date, description: string, amount: number): string {
  const crypto = require("crypto")
  return crypto
    .createHash("sha256")
    .update(`${date.toISOString()}|${description}|${amount}`)
    .digest("hex")
    .slice(0, 16)
}

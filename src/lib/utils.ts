import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKRW(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? "-" : ""
  if (abs >= 100000000) {
    const eok = Math.floor(abs / 100000000)
    const rem = abs % 100000000
    const man = Math.floor(rem / 10000)
    return man > 0
      ? `${sign}${eok.toLocaleString()}억 ${man.toLocaleString()}만원`
      : `${sign}${eok.toLocaleString()}억원`
  }
  if (abs >= 10000) {
    const man = Math.floor(abs / 10000)
    const rem = abs % 10000
    return rem > 0
      ? `${sign}${man.toLocaleString()}만 ${rem.toLocaleString()}원`
      : `${sign}${man.toLocaleString()}만원`
  }
  return `${sign}${abs.toLocaleString()}원`
}

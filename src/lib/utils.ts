import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKRW(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? "-" : ""
  return `${sign}${abs.toLocaleString()}원`
}

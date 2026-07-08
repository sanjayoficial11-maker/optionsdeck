import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number, opts?: Intl.NumberFormatOptions): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("en-IN", opts).format(value)
}

export function formatCurrency(value: number, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatCompact(value: number): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 2 }).format(value)
}

export function formatPercent(value: number, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—"
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`
}

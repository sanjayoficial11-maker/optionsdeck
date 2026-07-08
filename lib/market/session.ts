export type MarketSession = "pre-open" | "open" | "closed"

/**
 * NSE trading session in IST (UTC+5:30).
 * Pre-open: 09:00–09:15, Regular: 09:15–15:30, else closed. Weekends closed.
 */
export function getMarketSession(now: Date = new Date()): MarketSession {
  const istMs = now.getTime() + (5 * 60 + 30) * 60 * 1000
  const ist = new Date(istMs)
  const day = ist.getUTCDay() // 0 Sun ... 6 Sat
  if (day === 0 || day === 6) return "closed"

  const minutes = ist.getUTCHours() * 60 + ist.getUTCMinutes()
  const preOpen = 9 * 60
  const open = 9 * 60 + 15
  const close = 15 * 60 + 30

  if (minutes >= preOpen && minutes < open) return "pre-open"
  if (minutes >= open && minutes < close) return "open"
  return "closed"
}

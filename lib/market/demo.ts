import { getInstrument, type Instrument } from "@/lib/market/instruments"

/** Deterministic PRNG so demo data is stable within a trading day. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFrom(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function dayKey(now = new Date()): string {
  const ist = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000)
  return ist.toISOString().slice(0, 10)
}

export type Quote = {
  symbol: string
  name: string
  ltp: number
  prevClose: number
  open: number
  dayHigh: number
  dayLow: number
  change: number
  changePct: number
  volume: number
}

export function demoQuote(symbol: string, now = new Date()): Quote | null {
  const inst = getInstrument(symbol)
  if (!inst) return null
  const rnd = mulberry32(seedFrom(symbol + dayKey(now)))

  const prevClose = inst.refSpot
  const drift = (rnd() - 0.48) * 0.02 // -1% .. +1%
  const open = prevClose * (1 + (rnd() - 0.5) * 0.004)
  const ltp = round(prevClose * (1 + drift), inst)
  const dayHigh = round(Math.max(open, ltp) * (1 + rnd() * 0.004), inst)
  const dayLow = round(Math.min(open, ltp) * (1 - rnd() * 0.004), inst)
  const change = ltp - prevClose
  const changePct = (change / prevClose) * 100
  const volume = Math.round(rnd() * 5_000_000 + 1_000_000)

  return {
    symbol,
    name: inst.name,
    ltp,
    prevClose: round(prevClose, inst),
    open: round(open, inst),
    dayHigh,
    dayLow,
    change: round(change, inst),
    changePct,
    volume,
  }
}

function round(v: number, inst: Instrument): number {
  const dp = inst.kind === "index" ? 2 : 2
  return Number(v.toFixed(dp))
}

/** Intraday price path from open to ltp (approx 75 five-minute candles). */
export function demoIntraday(symbol: string, points = 75, now = new Date()): { t: string; price: number }[] {
  const q = demoQuote(symbol, now)
  const inst = getInstrument(symbol)
  if (!q || !inst) return []
  const rnd = mulberry32(seedFrom("intraday" + symbol + dayKey(now)))
  const series: { t: string; price: number }[] = []
  let price = q.open
  const target = q.ltp
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1)
    const pull = (target - price) * 0.06
    const noise = (rnd() - 0.5) * inst.refSpot * 0.0015
    price = price + pull + noise
    if (i === points - 1) price = target
    const mins = 9 * 60 + 15 + i * 5
    const hh = String(Math.floor(mins / 60)).padStart(2, "0")
    const mm = String(mins % 60).padStart(2, "0")
    series.push({ t: `${hh}:${mm}`, price: Number(price.toFixed(2)) })
    void progress
  }
  return series
}

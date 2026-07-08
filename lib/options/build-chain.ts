import { bsGreeks, bsPrice, impliedVol, RISK_FREE_RATE } from "./greeks"
import type { OptionChain, OptionChainRow, OptionQuote } from "./types"
import { getInstrument } from "@/lib/market/instruments"

const RISK_FREE = RISK_FREE_RATE

function round(n: number, dp = 2) {
  const f = Math.pow(10, dp)
  return Math.round(n * f) / f
}

/**
 * Deterministic pseudo-random generator so demo chains are stable within a minute
 * but drift over time (feels "live" without being noisy on every render).
 */
function seeded(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export interface BuildChainOptions {
  symbol: string
  spot: number
  expiry: string
  daysToExpiry: number
  baseIv?: number
  seed?: number
  source?: "live" | "demo"
}

export function buildDemoChain(opts: BuildChainOptions): OptionChain {
  const inst = getInstrument(opts.symbol)
  const step = inst?.strikeStep ?? 50
  const lotSize = inst?.lotSize ?? 50
  const spot = opts.spot
  const atmStrike = Math.round(spot / step) * step
  const t = Math.max(opts.daysToExpiry, 0.5) / 365
  const baseIv = opts.baseIv ?? 14
  const rng = seeded(opts.seed ?? Math.floor(Date.now() / 60000) + Math.round(spot))

  const rows: OptionChainRow[] = []
  const span = 10 // strikes each side

  for (let i = -span; i <= span; i++) {
    const strike = atmStrike + i * step
    if (strike <= 0) continue
    const moneyness = Math.abs(strike - spot) / spot

    // Volatility smile: higher IV away from ATM, put skew slightly richer
    const smile = baseIv + moneyness * 100 * 0.9
    const callIv = round(smile + (i < 0 ? 0 : 0.4) + (rng() - 0.5), 2)
    const putIv = round(smile + (i > 0 ? 0 : 1.1) + (rng() - 0.5), 2)

    const call = makeQuote("CE", strike, spot, t, callIv, rng, i)
    const put = makeQuote("PE", strike, spot, t, putIv, rng, i)
    rows.push({ strike, call, put })
  }

  return {
    symbol: opts.symbol,
    spot: round(spot),
    expiry: opts.expiry,
    atmStrike,
    lotSize,
    rows,
    updatedAt: new Date().toISOString(),
    source: opts.source ?? "demo",
  }
}

function makeQuote(
  type: "CE" | "PE",
  strike: number,
  spot: number,
  t: number,
  iv: number,
  rng: () => number,
  distance: number,
): OptionQuote {
  const bs = { S: spot, K: strike, T: t, r: RISK_FREE, iv: iv / 100, type }
  const g = bsGreeks(bs)
  const price = bsPrice(bs)
  const ltp = round(Math.max(price, 0.05))
  const spread = Math.max(ltp * 0.004, 0.05)

  // OI concentrates near ATM and round strikes; calls heavier above, puts below
  const nearness = Math.max(0, 1 - Math.abs(distance) / 11)
  const bias = type === "CE" ? (distance >= 0 ? 1.15 : 0.7) : distance <= 0 ? 1.2 : 0.7
  const oi = Math.round((30000 + rng() * 90000) * nearness * bias)
  const oiChange = Math.round((rng() - 0.45) * oi * 0.4)
  const volume = Math.round(oi * (0.3 + rng() * 0.9))

  return {
    strike,
    type,
    ltp,
    bid: round(ltp - spread),
    ask: round(ltp + spread),
    volume,
    oi,
    oiChange,
    iv,
    delta: g.delta,
    gamma: g.gamma,
    theta: g.theta,
    vega: g.vega,
  }
}

/** Re-derive IV for a live quote when the feed omits it. */
export function fillIv(type: "CE" | "PE", spot: number, strike: number, t: number, price: number) {
  return round(impliedVolFromPrice({ type, spot, strike, timeToExpiry: t, rate: RISK_FREE, price }) * 100, 2)
}

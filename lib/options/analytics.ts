import type { OptionChain, ChainAnalytics } from "./types"

/**
 * Max Pain: the strike at which total option writer payout (call + put intrinsic)
 * is minimized. Computed by summing intrinsic value across all rows for each candidate strike.
 */
export function computeMaxPain(chain: OptionChain): number {
  const strikes = chain.rows.map((r) => r.strike)
  let best = strikes[0]
  let bestPain = Number.POSITIVE_INFINITY

  for (const candidate of strikes) {
    let pain = 0
    for (const row of chain.rows) {
      // Call writers lose when spot (candidate) is above strike
      if (candidate > row.strike) pain += (candidate - row.strike) * row.call.oi
      // Put writers lose when spot (candidate) is below strike
      if (candidate < row.strike) pain += (row.strike - candidate) * row.put.oi
    }
    if (pain < bestPain) {
      bestPain = pain
      best = candidate
    }
  }
  return best
}

function percentileRank(values: number[], target: number): number {
  if (values.length === 0) return 0
  const below = values.filter((v) => v <= target).length
  return (below / values.length) * 100
}

export function computeAnalytics(chain: OptionChain, ivHistory: number[] = []): ChainAnalytics {
  let totalCallOi = 0
  let totalPutOi = 0
  let totalCallOiChange = 0
  let totalPutOiChange = 0
  let totalCallVolume = 0
  let totalPutVolume = 0

  for (const row of chain.rows) {
    totalCallOi += row.call.oi
    totalPutOi += row.put.oi
    totalCallOiChange += row.call.oiChange
    totalPutOiChange += row.put.oiChange
    totalCallVolume += row.call.volume
    totalPutVolume += row.put.volume
  }

  const pcrOi = totalCallOi > 0 ? totalPutOi / totalCallOi : 0
  const pcrVolume = totalCallVolume > 0 ? totalPutVolume / totalCallVolume : 0
  const maxPain = computeMaxPain(chain)

  const atmRow =
    chain.rows.find((r) => r.strike === chain.atmStrike) ??
    chain.rows.reduce((a, b) => (Math.abs(b.strike - chain.spot) < Math.abs(a.strike - chain.spot) ? b : a))
  const atmIv = (atmRow.call.iv + atmRow.put.iv) / 2

  // IV skew: OTM put IV minus OTM call IV (positive => downside fear)
  const otmPut = chain.rows.find((r) => r.strike < chain.spot)
  const otmCall = [...chain.rows].reverse().find((r) => r.strike > chain.spot)
  const ivSkew = otmPut && otmCall ? otmPut.put.iv - otmCall.call.iv : 0

  const history = ivHistory.length > 0 ? ivHistory : [atmIv]
  const minIv = Math.min(...history, atmIv)
  const maxIv = Math.max(...history, atmIv)
  const ivRank = maxIv > minIv ? ((atmIv - minIv) / (maxIv - minIv)) * 100 : 50
  const ivPercentile = percentileRank(history, atmIv)

  // Support = strike with max put OI below spot; Resistance = max call OI above spot
  const below = chain.rows.filter((r) => r.strike <= chain.spot)
  const above = chain.rows.filter((r) => r.strike >= chain.spot)
  const supportStrike = below.length
    ? below.reduce((a, b) => (b.put.oi > a.put.oi ? b : a)).strike
    : chain.atmStrike
  const resistanceStrike = above.length
    ? above.reduce((a, b) => (b.call.oi > a.call.oi ? b : a)).strike
    : chain.atmStrike

  let sentiment: ChainAnalytics["sentiment"] = "Neutral"
  if (pcrOi > 1.2) sentiment = "Bullish"
  else if (pcrOi < 0.8) sentiment = "Bearish"

  return {
    pcrOi: Number(pcrOi.toFixed(2)),
    pcrVolume: Number(pcrVolume.toFixed(2)),
    maxPain,
    totalCallOi,
    totalPutOi,
    totalCallOiChange,
    totalPutOiChange,
    totalCallVolume,
    totalPutVolume,
    atmIv: Number(atmIv.toFixed(2)),
    ivRank: Number(ivRank.toFixed(1)),
    ivPercentile: Number(ivPercentile.toFixed(1)),
    ivSkew: Number(ivSkew.toFixed(2)),
    sentiment,
    supportStrike,
    resistanceStrike,
  }
}

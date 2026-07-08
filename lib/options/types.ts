export type OptionType = "CE" | "PE"

export interface OptionQuote {
  strike: number
  type: OptionType
  ltp: number
  bid: number
  ask: number
  volume: number
  oi: number
  oiChange: number
  iv: number
  delta: number
  gamma: number
  theta: number
  vega: number
}

export interface OptionChainRow {
  strike: number
  call: OptionQuote
  put: OptionQuote
}

export interface OptionChain {
  symbol: string
  spot: number
  expiry: string
  atmStrike: number
  lotSize: number
  rows: OptionChainRow[]
  updatedAt: string
  source: "live" | "demo"
}

export interface ChainAnalytics {
  pcrOi: number
  pcrVolume: number
  maxPain: number
  totalCallOi: number
  totalPutOi: number
  totalCallOiChange: number
  totalPutOiChange: number
  totalCallVolume: number
  totalPutVolume: number
  atmIv: number
  ivRank: number
  ivPercentile: number
  ivSkew: number
  sentiment: "Bullish" | "Bearish" | "Neutral"
  supportStrike: number
  resistanceStrike: number
}

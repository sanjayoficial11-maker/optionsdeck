export type InstrumentKind = "index" | "equity"

export type Instrument = {
  symbol: string
  name: string
  kind: InstrumentKind
  /** Dhan security id (underlying). Filled in as needed per exchange segment. */
  dhanSecurityId?: string
  exchangeSegment: "IDX_I" | "NSE_FNO" | "NSE_EQ"
  lotSize: number
  strikeStep: number
  /** Rough reference spot used for demo data when live feed is unavailable. */
  refSpot: number
}

export const INSTRUMENTS: Instrument[] = [
  { symbol: "NIFTY", name: "Nifty 50", kind: "index", dhanSecurityId: "13", exchangeSegment: "IDX_I", lotSize: 75, strikeStep: 50, refSpot: 24150 },
  { symbol: "BANKNIFTY", name: "Nifty Bank", kind: "index", dhanSecurityId: "25", exchangeSegment: "IDX_I", lotSize: 30, strikeStep: 100, refSpot: 51800 },
  { symbol: "FINNIFTY", name: "Nifty Financial", kind: "index", dhanSecurityId: "27", exchangeSegment: "IDX_I", lotSize: 65, strikeStep: 50, refSpot: 23200 },
  { symbol: "MIDCPNIFTY", name: "Nifty Midcap Select", kind: "index", dhanSecurityId: "442", exchangeSegment: "IDX_I", lotSize: 120, strikeStep: 25, refSpot: 12600 },
  { symbol: "SENSEX", name: "BSE Sensex", kind: "index", dhanSecurityId: "51", exchangeSegment: "IDX_I", lotSize: 20, strikeStep: 100, refSpot: 79500 },
  { symbol: "RELIANCE", name: "Reliance Industries", kind: "equity", exchangeSegment: "NSE_EQ", lotSize: 500, strikeStep: 10, refSpot: 2950 },
  { symbol: "HDFCBANK", name: "HDFC Bank", kind: "equity", exchangeSegment: "NSE_EQ", lotSize: 550, strikeStep: 10, refSpot: 1680 },
  { symbol: "TCS", name: "Tata Consultancy", kind: "equity", exchangeSegment: "NSE_EQ", lotSize: 175, strikeStep: 20, refSpot: 3980 },
]

export const DEFAULT_SYMBOL = "NIFTY"

export function getInstrument(symbol: string): Instrument | undefined {
  return INSTRUMENTS.find((i) => i.symbol === symbol.toUpperCase())
}

export const INDEX_INSTRUMENTS = INSTRUMENTS.filter((i) => i.kind === "index")

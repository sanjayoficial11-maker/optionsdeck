// Simulated Indian option chain. Realistic strikes, IV smile, OI distribution.
// Live-updating via a subscription pattern so a real Kotak Neo WebSocket can be swapped in later.

import { bsPrice } from "./greeks";

export type Underlying = "NIFTY" | "BANKNIFTY" | "FINNIFTY" | "MIDCPNIFTY" | "RELIANCE" | "HDFCBANK" | "TCS";

export interface InstrumentMeta {
  symbol: Underlying;
  name: string;
  spot: number;
  lotSize: number;
  strikeStep: number;
  baseIV: number; // ATM base IV
}

export const INSTRUMENTS: Record<Underlying, InstrumentMeta> = {
  NIFTY:      { symbol: "NIFTY",      name: "NIFTY 50",     spot: 24850, lotSize: 25,  strikeStep: 50,  baseIV: 0.12 },
  BANKNIFTY:  { symbol: "BANKNIFTY",  name: "BANK NIFTY",   spot: 51420, lotSize: 15,  strikeStep: 100, baseIV: 0.14 },
  FINNIFTY:   { symbol: "FINNIFTY",   name: "FIN NIFTY",    spot: 23180, lotSize: 25,  strikeStep: 50,  baseIV: 0.13 },
  MIDCPNIFTY: { symbol: "MIDCPNIFTY", name: "MIDCAP NIFTY", spot: 12440, lotSize: 50,  strikeStep: 25,  baseIV: 0.16 },
  RELIANCE:   { symbol: "RELIANCE",   name: "Reliance",     spot: 2985,  lotSize: 250, strikeStep: 20,  baseIV: 0.22 },
  HDFCBANK:   { symbol: "HDFCBANK",   name: "HDFC Bank",    spot: 1720,  lotSize: 550, strikeStep: 10,  baseIV: 0.19 },
  TCS:        { symbol: "TCS",        name: "TCS",          spot: 4180,  lotSize: 175, strikeStep: 20,  baseIV: 0.20 },
};

export interface OptionRow {
  strike: number;
  ce: OptionLeg;
  pe: OptionLeg;
}
export interface OptionLeg {
  ltp: number;
  bid: number;
  ask: number;
  oi: number;
  oiChange: number;
  volume: number;
  iv: number;
}

export interface Expiry { label: string; date: Date; daysToExpiry: number; }

// Deterministic pseudo-random for stable-looking OI
function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

export function nextExpiries(count = 4, weekly = true): Expiry[] {
  const out: Expiry[] = [];
  const today = new Date();
  today.setHours(15, 30, 0, 0);
  const cursor = new Date(today);
  // find next Thursday
  while (cursor.getDay() !== 4) cursor.setDate(cursor.getDate() + 1);
  for (let i = 0; i < count; i++) {
    const d = new Date(cursor);
    d.setDate(d.getDate() + (weekly ? 7 * i : 30 * i));
    const days = Math.max(1, Math.round((d.getTime() - Date.now()) / 86400000));
    out.push({
      label: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }),
      date: d,
      daysToExpiry: days,
    });
  }
  return out;
}

export function ivSmile(baseIV: number, moneyness: number): number {
  // U-shape smile: higher IV for far OTM/ITM
  const skew = 0.4 * moneyness * moneyness + 0.05 * -moneyness; // slight put skew
  return Math.max(0.05, baseIV + skew);
}

export function buildChain(inst: InstrumentMeta, spot: number, expiry: Expiry, r = 0.065): OptionRow[] {
  const step = inst.strikeStep;
  const atm = Math.round(spot / step) * step;
  const rows: OptionRow[] = [];
  const rand = seeded(atm + expiry.daysToExpiry * 7);
  const T = expiry.daysToExpiry / 365;
  for (let i = -15; i <= 15; i++) {
    const K = atm + i * step;
    const m = (K - spot) / spot;
    const ivCE = ivSmile(inst.baseIV, m);
    const ivPE = ivSmile(inst.baseIV, -m);
    const ceMid = bsPrice({ S: spot, K, T, r, iv: ivCE, type: "CE" });
    const peMid = bsPrice({ S: spot, K, T, r, iv: ivPE, type: "PE" });
    const spreadC = Math.max(0.05, ceMid * 0.004);
    const spreadP = Math.max(0.05, peMid * 0.004);
    const oiBase = Math.round((1_500_000 * Math.exp(-i * i / 12)) * (0.5 + rand()));
    const oiBaseP = Math.round((1_400_000 * Math.exp(-i * i / 12)) * (0.5 + rand()));
    rows.push({
      strike: K,
      ce: {
        ltp: +ceMid.toFixed(2),
        bid: +Math.max(0, ceMid - spreadC).toFixed(2),
        ask: +(ceMid + spreadC).toFixed(2),
        oi: oiBase,
        oiChange: Math.round((rand() - 0.5) * oiBase * 0.3),
        volume: Math.round(oiBase * (0.1 + rand() * 0.3)),
        iv: +(ivCE * 100).toFixed(2),
      },
      pe: {
        ltp: +peMid.toFixed(2),
        bid: +Math.max(0, peMid - spreadP).toFixed(2),
        ask: +(peMid + spreadP).toFixed(2),
        oi: oiBaseP,
        oiChange: Math.round((rand() - 0.5) * oiBaseP * 0.3),
        volume: Math.round(oiBaseP * (0.1 + rand() * 0.3)),
        iv: +(ivPE * 100).toFixed(2),
      },
    });
  }
  return rows;
}

// Live tick simulator — mimics real WebSocket updates from Kotak Neo.
// Replace this class internals with a WS client to go live.
export class MarketTicker {
  private timers = new Map<Underlying, ReturnType<typeof setInterval>>();
  private prices = new Map<Underlying, number>();
  private subs = new Map<Underlying, Set<(p: number) => void>>();

  subscribe(sym: Underlying, cb: (price: number) => void): () => void {
    if (!this.prices.has(sym)) this.prices.set(sym, INSTRUMENTS[sym].spot);
    if (!this.subs.has(sym)) this.subs.set(sym, new Set());
    this.subs.get(sym)!.add(cb);
    cb(this.prices.get(sym)!);
    if (!this.timers.has(sym)) {
      const t = setInterval(() => this.tick(sym), 1500);
      this.timers.set(sym, t);
    }
    return () => {
      const s = this.subs.get(sym);
      s?.delete(cb);
      if (s && s.size === 0) {
        clearInterval(this.timers.get(sym)!);
        this.timers.delete(sym);
      }
    };
  }
  private tick(sym: Underlying) {
    const base = INSTRUMENTS[sym].spot;
    const cur = this.prices.get(sym)!;
    const vol = base * 0.0008;
    const drift = (base - cur) * 0.02;
    const next = cur + drift + (Math.random() - 0.5) * vol * 2;
    this.prices.set(sym, +next.toFixed(2));
    this.subs.get(sym)?.forEach((cb) => cb(this.prices.get(sym)!));
  }
}

export const ticker = new MarketTicker();

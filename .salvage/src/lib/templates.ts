import type { Leg, Side } from "./payoff";
import type { OptType } from "./greeks";
import { bsPrice } from "./greeks";
import type { InstrumentMeta } from "./optionChain";
import { ivSmile } from "./optionChain";

export interface TemplateSpec {
  id: string;
  name: string;
  category: "Neutral" | "Bullish" | "Bearish" | "Volatility" | "Income" | "Hedge";
  description: string;
  build: (ctx: TemplateCtx) => Leg[];
}
export interface TemplateCtx {
  inst: InstrumentMeta;
  spot: number;
  expiryDays: number;
  width?: number; // strike width in steps
}

function mkLeg(id: string, action: Side, type: OptType, strike: number, ctx: TemplateCtx, qty = 1): Leg {
  const m = (strike - ctx.spot) / ctx.spot;
  const iv = ivSmile(ctx.inst.baseIV, type === "CE" ? m : -m);
  const T = ctx.expiryDays / 365;
  const premium = +bsPrice({ S: ctx.spot, K: strike, T, r: 0.065, iv, type }).toFixed(2);
  return { id, action, type, strike, premium, iv, qty, lotSize: ctx.inst.lotSize, expiryDays: ctx.expiryDays };
}

const rnd = (spot: number, step: number, off = 0) => Math.round(spot / step) * step + off * step;

export const TEMPLATES: TemplateSpec[] = [
  {
    id: "iron-condor", name: "Iron Condor", category: "Neutral",
    description: "Sell OTM call + put, buy further-OTM wings. Profits from range-bound movement.",
    build: (c) => {
      const s = c.inst.strikeStep, w = c.width ?? 2;
      return [
        mkLeg("l1", "SELL", "PE", rnd(c.spot, s, -w),     c),
        mkLeg("l2", "BUY",  "PE", rnd(c.spot, s, -w - 2), c),
        mkLeg("l3", "SELL", "CE", rnd(c.spot, s,  w),     c),
        mkLeg("l4", "BUY",  "CE", rnd(c.spot, s,  w + 2), c),
      ];
    },
  },
  {
    id: "iron-fly", name: "Iron Fly", category: "Neutral",
    description: "Sell ATM straddle + buy OTM wings. Max profit at spot.",
    build: (c) => {
      const s = c.inst.strikeStep, w = c.width ?? 4;
      return [
        mkLeg("l1", "SELL", "CE", rnd(c.spot, s, 0),  c),
        mkLeg("l2", "SELL", "PE", rnd(c.spot, s, 0),  c),
        mkLeg("l3", "BUY",  "CE", rnd(c.spot, s,  w), c),
        mkLeg("l4", "BUY",  "PE", rnd(c.spot, s, -w), c),
      ];
    },
  },
  {
    id: "long-straddle", name: "Long Straddle", category: "Volatility",
    description: "Buy ATM call + put. Profits from large moves in either direction.",
    build: (c) => [
      mkLeg("l1", "BUY", "CE", rnd(c.spot, c.inst.strikeStep, 0), c),
      mkLeg("l2", "BUY", "PE", rnd(c.spot, c.inst.strikeStep, 0), c),
    ],
  },
  {
    id: "short-straddle", name: "Short Straddle", category: "Income",
    description: "Sell ATM call + put. Profits from theta and IV crush; unlimited risk.",
    build: (c) => [
      mkLeg("l1", "SELL", "CE", rnd(c.spot, c.inst.strikeStep, 0), c),
      mkLeg("l2", "SELL", "PE", rnd(c.spot, c.inst.strikeStep, 0), c),
    ],
  },
  {
    id: "bull-call", name: "Bull Call Spread", category: "Bullish",
    description: "Buy ATM call, sell OTM call. Defined risk, limited reward.",
    build: (c) => {
      const s = c.inst.strikeStep, w = c.width ?? 4;
      return [
        mkLeg("l1", "BUY",  "CE", rnd(c.spot, s, 0), c),
        mkLeg("l2", "SELL", "CE", rnd(c.spot, s, w), c),
      ];
    },
  },
  {
    id: "bear-put", name: "Bear Put Spread", category: "Bearish",
    description: "Buy ATM put, sell OTM put. Defined risk bearish view.",
    build: (c) => {
      const s = c.inst.strikeStep, w = c.width ?? 4;
      return [
        mkLeg("l1", "BUY",  "PE", rnd(c.spot, s,  0), c),
        mkLeg("l2", "SELL", "PE", rnd(c.spot, s, -w), c),
      ];
    },
  },
  {
    id: "calendar", name: "Calendar Spread", category: "Neutral",
    description: "Sell near-dated ATM, buy far-dated ATM. Profits from time decay + IV expansion.",
    build: (c) => {
      const k = rnd(c.spot, c.inst.strikeStep, 0);
      return [
        mkLeg("l1", "SELL", "CE", k, c),
        { ...mkLeg("l2", "BUY", "CE", k, { ...c, expiryDays: c.expiryDays + 30 }), expiryDays: c.expiryDays + 30 },
      ];
    },
  },
  {
    id: "diagonal", name: "Diagonal Spread", category: "Bullish",
    description: "Sell near-term OTM call, buy longer-dated ITM/ATM call.",
    build: (c) => {
      const s = c.inst.strikeStep;
      return [
        mkLeg("l1", "SELL", "CE", rnd(c.spot, s, 3), c),
        { ...mkLeg("l2", "BUY", "CE", rnd(c.spot, s, 0), { ...c, expiryDays: c.expiryDays + 30 }), expiryDays: c.expiryDays + 30 },
      ];
    },
  },
  {
    id: "butterfly", name: "Butterfly", category: "Neutral",
    description: "Symmetric 1-2-1 spread. Max profit at middle strike.",
    build: (c) => {
      const s = c.inst.strikeStep, w = c.width ?? 3;
      return [
        mkLeg("l1", "BUY",  "CE", rnd(c.spot, s, -w), c),
        mkLeg("l2", "SELL", "CE", rnd(c.spot, s,  0), c, 2),
        mkLeg("l3", "BUY",  "CE", rnd(c.spot, s,  w), c),
      ];
    },
  },
  {
    id: "broken-wing", name: "Broken Wing Butterfly", category: "Neutral",
    description: "Asymmetric butterfly for skewed payoff and often a small credit.",
    build: (c) => {
      const s = c.inst.strikeStep;
      return [
        mkLeg("l1", "BUY",  "CE", rnd(c.spot, s, -2), c),
        mkLeg("l2", "SELL", "CE", rnd(c.spot, s,  0), c, 2),
        mkLeg("l3", "BUY",  "CE", rnd(c.spot, s,  5), c),
      ];
    },
  },
  {
    id: "covered-call", name: "Covered Call", category: "Income",
    description: "Long underlying (synthetic here via long ITM call) + short OTM call.",
    build: (c) => {
      const s = c.inst.strikeStep;
      return [
        mkLeg("l1", "BUY",  "CE", rnd(c.spot, s, -6), c),
        mkLeg("l2", "SELL", "CE", rnd(c.spot, s,  3), c),
      ];
    },
  },
  {
    id: "protective-put", name: "Protective Put", category: "Hedge",
    description: "Long underlying (synthetic) + long OTM put as downside insurance.",
    build: (c) => {
      const s = c.inst.strikeStep;
      return [
        mkLeg("l1", "BUY", "CE", rnd(c.spot, s, -6), c),
        mkLeg("l2", "BUY", "PE", rnd(c.spot, s, -3), c),
      ];
    },
  },
];

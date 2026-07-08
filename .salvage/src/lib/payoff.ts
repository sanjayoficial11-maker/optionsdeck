import { bsGreeks, bsPrice, type Greeks, type OptType } from "./greeks";

export type Side = "BUY" | "SELL";
export interface Leg {
  id: string;
  action: Side;
  type: OptType;
  strike: number;
  premium: number;
  iv: number;   // decimal, entry IV
  qty: number;  // number of lots
  lotSize: number;
  expiryDays: number;
}

export interface PayoffPoint { price: number; pnl: number; }

export function legPayoffAtExpiry(l: Leg, spot: number): number {
  const intrinsic = l.type === "CE" ? Math.max(spot - l.strike, 0) : Math.max(l.strike - spot, 0);
  const perShare = l.action === "BUY" ? intrinsic - l.premium : l.premium - intrinsic;
  return perShare * l.qty * l.lotSize;
}

export function strategyPayoff(legs: Leg[], spot: number, range = 0.15, steps = 121): PayoffPoint[] {
  if (!legs.length || !spot) return [];
  const min = spot * (1 - range);
  const max = spot * (1 + range);
  const dx = (max - min) / (steps - 1);
  const out: PayoffPoint[] = [];
  for (let i = 0; i < steps; i++) {
    const price = +(min + dx * i).toFixed(2);
    let pnl = 0;
    for (const l of legs) pnl += legPayoffAtExpiry(l, price);
    out.push({ price, pnl: +pnl.toFixed(2) });
  }
  return out;
}

export interface Stats {
  maxProfit: number; maxLoss: number;
  breakevens: number[];
  netCredit: number; // negative = debit
  rr: number | null;
  marginEstimate: number;
}

export function statsFromPayoff(legs: Leg[], spot: number): Stats {
  if (!legs.length) return { maxProfit: 0, maxLoss: 0, breakevens: [], netCredit: 0, rr: null, marginEstimate: 0 };
  const pts = strategyPayoff(legs, spot, 0.4, 801);
  let maxProfit = -Infinity, maxLoss = Infinity;
  const bes: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    maxProfit = Math.max(maxProfit, pts[i].pnl);
    maxLoss = Math.min(maxLoss, pts[i].pnl);
    if (i > 0) {
      const a = pts[i - 1].pnl, b = pts[i].pnl;
      if ((a <= 0 && b >= 0) || (a >= 0 && b <= 0)) {
        const t = a === b ? 0 : -a / (b - a);
        bes.push(+(pts[i - 1].price + t * (pts[i].price - pts[i - 1].price)).toFixed(2));
      }
    }
  }
  const netCredit = legs.reduce((s, l) => s + (l.action === "SELL" ? l.premium : -l.premium) * l.qty * l.lotSize, 0);
  // Rough SPAN-lite: ~10% of notional for shorts, premium for longs
  let margin = 0;
  for (const l of legs) {
    if (l.action === "BUY") margin += l.premium * l.qty * l.lotSize;
    else margin += l.strike * 0.10 * l.qty * l.lotSize;
  }
  const rr = maxLoss < 0 && maxProfit > 0 ? +(maxProfit / -maxLoss).toFixed(2) : null;
  return {
    maxProfit: isFinite(maxProfit) ? +maxProfit.toFixed(2) : 0,
    maxLoss: isFinite(maxLoss) ? +maxLoss.toFixed(2) : 0,
    breakevens: bes,
    netCredit: +netCredit.toFixed(2),
    rr,
    marginEstimate: +margin.toFixed(2),
  };
}

export interface LegGreeks extends Greeks { legId: string; }
export function legGreeks(l: Leg, spot: number, r = 0.065): Greeks {
  const T = l.expiryDays / 365;
  const g = bsGreeks({ S: spot, K: l.strike, T, r, iv: l.iv, type: l.type });
  const sign = l.action === "BUY" ? 1 : -1;
  const units = l.qty * l.lotSize;
  return {
    delta: g.delta * sign * units,
    gamma: g.gamma * sign * units,
    theta: g.theta * sign * units,
    vega: g.vega * sign * units,
    rho: g.rho * sign * units,
  };
}
export function portfolioGreeks(legs: Leg[], spot: number, r = 0.065): Greeks {
  return legs.reduce<Greeks>((a, l) => {
    const g = legGreeks(l, spot, r);
    return { delta: a.delta + g.delta, gamma: a.gamma + g.gamma, theta: a.theta + g.theta, vega: a.vega + g.vega, rho: a.rho + g.rho };
  }, { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 });
}

// Theoretical current mark using BS with entry IV — used for MTM if user updates spot.
export function markToMarket(legs: Leg[], spot: number, r = 0.065) {
  let mtm = 0;
  for (const l of legs) {
    const T = l.expiryDays / 365;
    const p = bsPrice({ S: spot, K: l.strike, T, r, iv: l.iv, type: l.type });
    const sign = l.action === "BUY" ? 1 : -1;
    mtm += sign * (p - l.premium) * l.qty * l.lotSize;
  }
  return +mtm.toFixed(2);
}

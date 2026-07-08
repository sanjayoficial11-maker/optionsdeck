// Trade Review engine — post-trade analytics for the OptionsDeck educational module.
// Everything here is data-driven and explanatory. It NEVER produces buy/sell
// recommendations, signals, targets, stop-losses or personalised advice.

import { bsPrice, bsGreeks } from "./greeks";
import { INSTRUMENTS, ivSmile, type Underlying } from "./optionChain";
import { statsFromPayoff, portfolioGreeks, strategyPayoff, type Leg, type PayoffPoint } from "./payoff";

const R = 0.065; // risk-free rate

export type Direction = "Bullish" | "Bearish" | "Neutral" | "Volatility";
export type MarketTrend = "Uptrend" | "Downtrend" | "Sideways" | "Volatile";

export interface CompletedTrade {
  id: string;
  underlying: Underlying;
  strategyName: string;
  direction: Direction;
  entryDate: string;   // ISO date
  exitDate: string;    // ISO date
  expiryLabel: string;
  dteAtEntry: number;
  holdDays: number;
  qtyLots: number;
  lotSize: number;
  legs: Leg[];
  brokerCharges: number;
  // market context
  entrySpot: number;
  exitSpot: number;
  entryVix: number;
  exitVix: number;
  entryAtmIv: number;  // %
  exitAtmIv: number;   // %
  pcr: number;
  oiChangePct: number; // % change in total OI during trade
  avgVolume: number;   // contracts / day
  marketTrend: MarketTrend;
}

/* ------------------------------------------------------------------ *
 *  Trade catalogue (deterministic, educational sample data)
 * ------------------------------------------------------------------ */

interface LegSpec { action: "BUY" | "SELL"; type: "CE" | "PE"; off: number; qty?: number; }
interface TradeSpec {
  id: string; underlying: Underlying; strategyName: string; direction: Direction;
  entryDaysAgo: number; holdDays: number; dteAtEntry: number; qtyLots: number;
  entrySpot: number; exitSpot: number; entryVix: number; exitVix: number;
  entryAtmIv: number; exitAtmIv: number; pcr: number; oiChangePct: number;
  avgVolume: number; marketTrend: MarketTrend; legs: LegSpec[];
}

const SPECS: TradeSpec[] = [
  {
    id: "TR-1042", underlying: "NIFTY", strategyName: "Bull Call Spread", direction: "Bullish",
    entryDaysAgo: 12, holdDays: 6, dteAtEntry: 14, qtyLots: 4,
    entrySpot: 24680, exitSpot: 24835, entryVix: 12.4, exitVix: 11.8,
    entryAtmIv: 12.1, exitAtmIv: 11.4, pcr: 0.86, oiChangePct: 8.4,
    avgVolume: 182000, marketTrend: "Uptrend",
    legs: [{ action: "BUY", type: "CE", off: 0 }, { action: "SELL", type: "CE", off: 4 }],
  },
  {
    id: "TR-1039", underlying: "BANKNIFTY", strategyName: "Short Straddle", direction: "Neutral",
    entryDaysAgo: 20, holdDays: 4, dteAtEntry: 9, qtyLots: 2,
    entrySpot: 51280, exitSpot: 51190, entryVix: 14.9, exitVix: 12.1,
    entryAtmIv: 15.2, exitAtmIv: 11.8, pcr: 1.04, oiChangePct: -6.2,
    avgVolume: 96000, marketTrend: "Sideways",
    legs: [{ action: "SELL", type: "CE", off: 0 }, { action: "SELL", type: "PE", off: 0 }],
  },
  {
    id: "TR-1031", underlying: "NIFTY", strategyName: "Long Straddle", direction: "Volatility",
    entryDaysAgo: 34, holdDays: 5, dteAtEntry: 12, qtyLots: 3,
    entrySpot: 24510, exitSpot: 24560, entryVix: 11.2, exitVix: 10.6,
    entryAtmIv: 11.4, exitAtmIv: 10.2, pcr: 0.92, oiChangePct: 3.1,
    avgVolume: 154000, marketTrend: "Sideways",
    legs: [{ action: "BUY", type: "CE", off: 0 }, { action: "BUY", type: "PE", off: 0 }],
  },
  {
    id: "TR-1024", underlying: "FINNIFTY", strategyName: "Iron Condor", direction: "Neutral",
    entryDaysAgo: 41, holdDays: 8, dteAtEntry: 11, qtyLots: 5,
    entrySpot: 23090, exitSpot: 23050, entryVix: 13.1, exitVix: 11.4,
    entryAtmIv: 13.4, exitAtmIv: 11.0, pcr: 0.98, oiChangePct: -4.5,
    avgVolume: 71000, marketTrend: "Sideways",
    legs: [
      { action: "SELL", type: "PE", off: -3 }, { action: "BUY", type: "PE", off: -6 },
      { action: "SELL", type: "CE", off: 3 }, { action: "BUY", type: "CE", off: 6 },
    ],
  },
  {
    id: "TR-1018", underlying: "BANKNIFTY", strategyName: "Bear Put Spread", direction: "Bearish",
    entryDaysAgo: 55, holdDays: 7, dteAtEntry: 15, qtyLots: 3,
    entrySpot: 50120, exitSpot: 49480, entryVix: 13.8, exitVix: 15.2,
    entryAtmIv: 14.0, exitAtmIv: 16.1, pcr: 1.18, oiChangePct: 11.6,
    avgVolume: 88000, marketTrend: "Downtrend",
    legs: [{ action: "BUY", type: "PE", off: 0 }, { action: "SELL", type: "PE", off: -4 }],
  },
  {
    id: "TR-1009", underlying: "NIFTY", strategyName: "Iron Fly", direction: "Neutral",
    entryDaysAgo: 68, holdDays: 3, dteAtEntry: 6, qtyLots: 4,
    entrySpot: 24320, exitSpot: 24610, entryVix: 12.0, exitVix: 13.6,
    entryAtmIv: 12.2, exitAtmIv: 13.9, pcr: 0.79, oiChangePct: 9.9,
    avgVolume: 167000, marketTrend: "Uptrend",
    legs: [
      { action: "SELL", type: "CE", off: 0 }, { action: "SELL", type: "PE", off: 0 },
      { action: "BUY", type: "CE", off: 4 }, { action: "BUY", type: "PE", off: -4 },
    ],
  },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setHours(15, 30, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function buildTrade(spec: TradeSpec): CompletedTrade {
  const inst = INSTRUMENTS[spec.underlying];
  const atm = Math.round(spec.entrySpot / inst.strikeStep) * inst.strikeStep;
  const T = spec.dteAtEntry / 365;
  const base = spec.entryAtmIv / 100;

  const legs: Leg[] = spec.legs.map((ls, i) => {
    const strike = atm + ls.off * inst.strikeStep;
    const m = (strike - spec.entrySpot) / spec.entrySpot;
    const iv = ivSmile(base, ls.type === "CE" ? m : -m);
    const premium = +bsPrice({ S: spec.entrySpot, K: strike, T, r: R, iv, type: ls.type }).toFixed(2);
    return {
      id: `${spec.id}-l${i}`, action: ls.action, type: ls.type, strike, premium, iv,
      qty: (ls.qty ?? 1) * spec.qtyLots, lotSize: inst.lotSize, expiryDays: spec.dteAtEntry,
    };
  });

  const expiry = new Date();
  expiry.setDate(expiry.getDate() - spec.entryDaysAgo + spec.dteAtEntry);

  return {
    id: spec.id, underlying: spec.underlying, strategyName: spec.strategyName, direction: spec.direction,
    entryDate: isoDaysAgo(spec.entryDaysAgo), exitDate: isoDaysAgo(spec.entryDaysAgo - spec.holdDays),
    expiryLabel: expiry.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }),
    dteAtEntry: spec.dteAtEntry, holdDays: spec.holdDays, qtyLots: spec.qtyLots, lotSize: inst.lotSize,
    legs, brokerCharges: +(legs.length * spec.qtyLots * 42).toFixed(0),
    entrySpot: spec.entrySpot, exitSpot: spec.exitSpot, entryVix: spec.entryVix, exitVix: spec.exitVix,
    entryAtmIv: spec.entryAtmIv, exitAtmIv: spec.exitAtmIv, pcr: spec.pcr, oiChangePct: spec.oiChangePct,
    avgVolume: spec.avgVolume, marketTrend: spec.marketTrend,
  };
}

export const TRADES: CompletedTrade[] = SPECS.map(buildTrade);

/* ------------------------------------------------------------------ *
 *  Pricing helpers
 * ------------------------------------------------------------------ */

// Mark-to-market of the whole position given a spot, an absolute IV shift
// (decimal) from entry, and elapsed calendar days since entry.
export function tradeMTM(legs: Leg[], spot: number, ivShift: number, daysElapsed: number): number {
  let mtm = 0;
  for (const l of legs) {
    const T = Math.max(0, (l.expiryDays - daysElapsed) / 365);
    const iv = Math.max(0.01, l.iv + ivShift);
    const p = bsPrice({ S: spot, K: l.strike, T, r: R, iv, type: l.type });
    const sign = l.action === "BUY" ? 1 : -1;
    mtm += sign * (p - l.premium) * l.qty * l.lotSize;
  }
  return +mtm.toFixed(0);
}

export interface Summary {
  netPnl: number; grossPnl: number; returnPct: number;
  maxProfit: number; maxLoss: number; breakevens: number[];
  netCredit: number; capital: number;
  spotMovePct: number; ivChange: number; vixChange: number;
}

export function summarize(t: CompletedTrade): Summary {
  const ivShift = (t.exitAtmIv - t.entryAtmIv) / 100;
  const grossPnl = tradeMTM(t.legs, t.exitSpot, ivShift, t.holdDays);
  const netPnl = grossPnl - t.brokerCharges;
  const stats = statsFromPayoff(t.legs, t.entrySpot);
  const capital = Math.max(Math.abs(stats.netCredit), stats.marginEstimate, 1);
  return {
    netPnl, grossPnl,
    returnPct: +((netPnl / capital) * 100).toFixed(2),
    maxProfit: stats.maxProfit, maxLoss: stats.maxLoss, breakevens: stats.breakevens,
    netCredit: stats.netCredit, capital,
    spotMovePct: +(((t.exitSpot - t.entrySpot) / t.entrySpot) * 100).toFixed(2),
    ivChange: +(t.exitAtmIv - t.entryAtmIv).toFixed(1),
    vixChange: +(t.exitVix - t.entryVix).toFixed(1),
  };
}

/* ------------------------------------------------------------------ *
 *  Daily timeline
 * ------------------------------------------------------------------ */

export interface TimelinePoint {
  day: number; date: string; label: string;
  spot: number; iv: number; theta: number; pnl: number;
}

// deterministic wiggle
function wiggle(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) - 0.5;
}

export function buildTimeline(t: CompletedTrade): TimelinePoint[] {
  const out: TimelinePoint[] = [];
  const entry = new Date(t.entryDate);
  for (let d = 0; d <= t.holdDays; d++) {
    const p = d / t.holdDays;
    const drift = t.entrySpot + (t.exitSpot - t.entrySpot) * p;
    const noise = d === 0 || d === t.holdDays ? 0 : wiggle(d + t.entrySpot) * t.entrySpot * 0.004;
    const spot = +(drift + noise).toFixed(2);
    const iv = +(t.entryAtmIv + (t.exitAtmIv - t.entryAtmIv) * p).toFixed(2);
    const ivShift = (iv - t.entryAtmIv) / 100;
    const pnl = tradeMTM(t.legs, spot, ivShift, d);
    const g = portfolioGreeks(t.legs.map((l) => ({ ...l, expiryDays: l.expiryDays - d, iv: l.iv + ivShift })), spot);
    const date = new Date(entry); date.setDate(date.getDate() + d);
    out.push({
      day: d, date: date.toISOString().slice(0, 10),
      label: d === 0 ? "Entry" : d === t.holdDays ? "Exit" : `D+${d}`,
      spot, iv, theta: +g.theta.toFixed(0), pnl,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 *  Risk / P&L attribution (Greek decomposition — Taylor expansion)
 * ------------------------------------------------------------------ */

export interface Attribution {
  key: string; label: string; value: number; pct: number;
  tone: "up" | "down" | "n"; explain: string;
}

export function attribution(t: CompletedTrade): Attribution[] {
  const dS = t.exitSpot - t.entrySpot;
  const dIvPts = t.exitAtmIv - t.entryAtmIv; // in IV points (%)
  const g = portfolioGreeks(t.legs, t.entrySpot);

  const delta = g.delta * dS;
  const gamma = 0.5 * g.gamma * dS * dS;
  const theta = g.theta * t.holdDays;
  const vega = g.vega * dIvPts; // vega is per 1% IV
  const ivExpansion = dIvPts > 0 ? vega : 0;
  const ivCrush = dIvPts < 0 ? vega : 0;
  const spotMovement = delta + gamma;
  const timeDecay = theta;

  const rows: Omit<Attribution, "pct">[] = [
    { key: "delta", label: "Delta Contribution", value: +delta.toFixed(0), tone: tone(delta),
      explain: "P&L attributable to the direction of the underlying move, based on the position's net Delta at entry." },
    { key: "gamma", label: "Gamma Contribution", value: +gamma.toFixed(0), tone: tone(gamma),
      explain: "Second-order effect of the spot move. Gamma measures how Delta itself changed as the underlying moved." },
    { key: "theta", label: "Theta Contribution", value: +theta.toFixed(0), tone: tone(theta),
      explain: "P&L from time decay across the holding period. Long options lose Theta; short options collect it." },
    { key: "vega", label: "Vega Contribution", value: +vega.toFixed(0), tone: tone(vega),
      explain: "P&L from the change in implied volatility, scaled by the position's net Vega." },
    { key: "spot", label: "Spot Movement", value: +spotMovement.toFixed(0), tone: tone(spotMovement),
      explain: "Combined first- and second-order impact of the underlying price change (Delta + Gamma)." },
    { key: "time", label: "Time Decay", value: +timeDecay.toFixed(0), tone: tone(timeDecay),
      explain: "The cumulative erosion (or collection) of extrinsic value as expiry approached." },
    { key: "ivx", label: "IV Expansion", value: +ivExpansion.toFixed(0), tone: tone(ivExpansion),
      explain: "Effect of implied volatility rising during the trade. Rising IV generally lifts option premiums." },
    { key: "ivc", label: "IV Crush", value: +ivCrush.toFixed(0), tone: tone(ivCrush),
      explain: "Effect of implied volatility falling during the trade. Falling IV generally reduces option premiums." },
  ];

  const max = Math.max(1, ...rows.map((r) => Math.abs(r.value)));
  return rows.map((r) => ({ ...r, pct: +((Math.abs(r.value) / max) * 100).toFixed(0) }));
}
function tone(v: number): "up" | "down" | "n" {
  if (v > 0.5) return "up";
  if (v < -0.5) return "down";
  return "n";
}

/* ------------------------------------------------------------------ *
 *  AI educational report (rule-based, never advisory)
 * ------------------------------------------------------------------ */

export interface Insight { title: string; body: string; tone: "up" | "down" | "n"; }

export function aiReport(t: CompletedTrade): Insight[] {
  const s = summarize(t);
  const g = portfolioGreeks(t.legs, t.entrySpot);
  const out: Insight[] = [];

  // Outcome framing
  out.push({
    title: s.netPnl >= 0 ? "The position closed with a net gain" : "The position closed with a net loss",
    tone: s.netPnl >= 0 ? "up" : "down",
    body: `Over ${t.holdDays} trading session${t.holdDays === 1 ? "" : "s"}, the ${t.strategyName} on ${t.underlying} produced a net result of ₹${s.netPnl.toLocaleString("en-IN")} after ₹${t.brokerCharges.toLocaleString("en-IN")} in charges, a ${s.returnPct >= 0 ? "+" : ""}${s.returnPct}% return on the estimated capital deployed.`,
  });

  // Theta narrative
  if (g.theta < -0.5) {
    out.push({
      title: "The position carried negative Theta", tone: "n",
      body: `Net Theta was ${g.theta.toFixed(0)} per day at entry. As a net-long-premium structure, time decay worked against the position — and typically accelerates in the final trading sessions before expiry.`,
    });
  } else if (g.theta > 0.5) {
    out.push({
      title: "The position carried positive Theta", tone: "n",
      body: `Net Theta was +${g.theta.toFixed(0)} per day at entry. As a net-short-premium structure, the position was designed to benefit from the passage of time, all else equal.`,
    });
  }

  // IV narrative
  if (Math.abs(s.ivChange) >= 0.3) {
    out.push({
      title: s.ivChange > 0 ? "Implied Volatility expanded" : "Implied Volatility contracted",
      tone: "n",
      body: `ATM implied volatility moved from ${t.entryAtmIv.toFixed(1)} to ${t.exitAtmIv.toFixed(1)} (${s.ivChange > 0 ? "+" : ""}${s.ivChange} pts). Higher IV generally increases option premiums, while falling IV generally reduces them — the effect on this position depended on its net Vega.`,
    });
  }

  // Spot movement vs requirement
  out.push({
    title: `The underlying moved ${Math.abs(s.spotMovePct)}%`,
    tone: "n",
    body: `${t.underlying} moved from ${t.entrySpot.toLocaleString("en-IN")} to ${t.exitSpot.toLocaleString("en-IN")} (${s.spotMovePct >= 0 ? "+" : ""}${s.spotMovePct}%). ${describeMoveVsBreakeven(t, s)}`,
  });

  // Range / expectation
  const within = t.exitSpot >= Math.min(...s.breakevens.length ? s.breakevens : [t.entrySpot]) &&
                 t.exitSpot <= Math.max(...s.breakevens.length ? s.breakevens : [t.entrySpot]);
  if (s.breakevens.length >= 2) {
    out.push({
      title: within ? "Price stayed inside the breakeven range" : "Price finished outside the breakeven range",
      tone: "n",
      body: `The structure had breakevens near ${s.breakevens.map((b) => b.toFixed(0)).join(" and ")}. The underlying spent the trade ${within ? "largely within" : "moving beyond"} that band, which shaped how the payoff resolved at exit.`,
    });
  }

  return out;
}

function describeMoveVsBreakeven(t: CompletedTrade, s: Summary): string {
  if (!s.breakevens.length) return "The observed move was compared against the strategy's payoff profile over the holding period.";
  const nearest = s.breakevens.reduce((a, b) => Math.abs(b - t.entrySpot) < Math.abs(a - t.entrySpot) ? b : a);
  const needed = +(((nearest - t.entrySpot) / t.entrySpot) * 100).toFixed(2);
  if ((t.direction === "Bullish" || t.direction === "Bearish") && Math.abs(needed) > Math.abs(s.spotMovePct)) {
    return `A move of roughly ${Math.abs(needed)}% toward ${nearest.toFixed(0)} was required to cross breakeven, larger than the ${Math.abs(s.spotMovePct)}% move that actually occurred.`;
  }
  return `The nearest breakeven sat near ${nearest.toFixed(0)}, and the realised move is reflected in the payoff at exit.`;
}

/* ------------------------------------------------------------------ *
 *  What-if simulations
 * ------------------------------------------------------------------ */

export interface WhatIf { key: string; label: string; description: string; pnl: number; delta: number; scenarioSpot: number; }

export function whatIfs(t: CompletedTrade): WhatIf[] {
  const ivShift = (t.exitAtmIv - t.entryAtmIv) / 100;
  const actual = tradeMTM(t.legs, t.exitSpot, ivShift, t.holdDays) - t.brokerCharges;
  const tl = buildTimeline(t);
  const dayEarlier = tl[Math.max(0, t.holdDays - 1)];

  const mk = (key: string, label: string, description: string, pnl: number, scenarioSpot: number): WhatIf =>
    ({ key, label, description, pnl: +pnl.toFixed(0), delta: +(pnl - actual).toFixed(0), scenarioSpot });

  return [
    mk("actual", "Actual exit", "The trade as it was actually closed.", actual, t.exitSpot),
    mk("earlier", "Closed one day earlier",
      "The position marked to market using the prior session's spot and IV.",
      (dayEarlier.pnl) - t.brokerCharges, dayEarlier.spot),
    mk("flativ", "If IV had stayed unchanged",
      "Re-priced holding implied volatility at its entry level throughout.",
      tradeMTM(t.legs, t.exitSpot, 0, t.holdDays) - t.brokerCharges, t.exitSpot),
    mk("up2", "If spot had moved +2%",
      "Re-priced with the underlying 2% higher at exit, other factors unchanged.",
      tradeMTM(t.legs, t.exitSpot * 1.02, ivShift, t.holdDays) - t.brokerCharges, +(t.exitSpot * 1.02).toFixed(0)),
    mk("dn2", "If spot had moved -2%",
      "Re-priced with the underlying 2% lower at exit, other factors unchanged.",
      tradeMTM(t.legs, t.exitSpot * 0.98, ivShift, t.holdDays) - t.brokerCharges, +(t.exitSpot * 0.98).toFixed(0)),
  ];
}

export function payoffCurve(t: CompletedTrade): PayoffPoint[] {
  return strategyPayoff(t.legs, t.entrySpot, 0.08, 121);
}

/* ------------------------------------------------------------------ *
 *  Learning cards
 * ------------------------------------------------------------------ */

export interface LearnCard { concept: string; summary: string; href: string; }

export function learningCards(t: CompletedTrade): LearnCard[] {
  const g = portfolioGreeks(t.legs, t.entrySpot);
  const s = summarize(t);
  const cards: LearnCard[] = [];

  cards.push({
    concept: "Theta Decay",
    summary: "How the extrinsic value of an option erodes as expiry approaches, and why decay accelerates in the final sessions.",
    href: "https://www.investopedia.com/terms/t/theta.asp",
  });
  if (s.ivChange >= 0.3) cards.push({
    concept: "IV Expansion",
    summary: "Why rising implied volatility inflates option premiums and how Vega quantifies that sensitivity.",
    href: "https://www.investopedia.com/terms/v/vega.asp",
  });
  if (s.ivChange <= -0.3) cards.push({
    concept: "IV Crush",
    summary: "How a fall in implied volatility deflates premiums — often seen after events resolve.",
    href: "https://www.investopedia.com/terms/i/iv-crush.asp",
  });
  if (isFinite(s.maxLoss) && s.maxLoss > -1e9 && s.breakevens.length >= 2) cards.push({
    concept: "Risk-Defined Strategy",
    summary: "How spreads cap both maximum profit and maximum loss, trading upside for a known worst case.",
    href: "https://www.investopedia.com/terms/c/creditspread.asp",
  });
  cards.push({
    concept: "Probability Range",
    summary: "Reading breakeven points as an implied range and understanding the odds priced into the option chain.",
    href: "https://www.investopedia.com/terms/b/breakevenpoint.asp",
  });
  cards.push({
    concept: "Greeks & Attribution",
    summary: "Decomposing P&L into Delta, Gamma, Theta and Vega to understand what actually drove the result.",
    href: "https://www.investopedia.com/trading/using-the-greeks-to-understand-options/",
  });
  return cards.slice(0, 4);
}

/* ------------------------------------------------------------------ *
 *  Aggregate statistics across all completed trades
 * ------------------------------------------------------------------ */

export interface AggregateStats {
  total: number; winRate: number; avgHold: number;
  avgWinner: number; avgLoser: number;
  avgTheta: number; avgVega: number;
  bestStrategy: string; worstStrategy: string;
  monthly: { month: string; pnl: number }[];
}

export function aggregate(trades = TRADES): AggregateStats {
  const perTrade = trades.map((t) => {
    const s = summarize(t);
    const g = portfolioGreeks(t.legs, t.entrySpot);
    return { t, pnl: s.netPnl, hold: t.holdDays, theta: g.theta, vega: g.vega };
  });
  const wins = perTrade.filter((p) => p.pnl > 0);
  const losses = perTrade.filter((p) => p.pnl <= 0);

  const byStrat = new Map<string, number>();
  perTrade.forEach((p) => byStrat.set(p.t.strategyName, (byStrat.get(p.t.strategyName) ?? 0) + p.pnl));
  const sorted = [...byStrat.entries()].sort((a, b) => b[1] - a[1]);

  const byMonth = new Map<string, number>();
  perTrade.forEach((p) => {
    const m = new Date(p.t.exitDate).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    byMonth.set(m, (byMonth.get(m) ?? 0) + p.pnl);
  });

  return {
    total: perTrade.length,
    winRate: +((wins.length / Math.max(1, perTrade.length)) * 100).toFixed(0),
    avgHold: +(perTrade.reduce((a, p) => a + p.hold, 0) / Math.max(1, perTrade.length)).toFixed(1),
    avgWinner: +(wins.reduce((a, p) => a + p.pnl, 0) / Math.max(1, wins.length)).toFixed(0),
    avgLoser: +(losses.reduce((a, p) => a + p.pnl, 0) / Math.max(1, losses.length)).toFixed(0),
    avgTheta: +(perTrade.reduce((a, p) => a + p.theta, 0) / Math.max(1, perTrade.length)).toFixed(0),
    avgVega: +(perTrade.reduce((a, p) => a + p.vega, 0) / Math.max(1, perTrade.length)).toFixed(0),
    bestStrategy: sorted[0]?.[0] ?? "—",
    worstStrategy: sorted[sorted.length - 1]?.[0] ?? "—",
    monthly: [...byMonth.entries()].reverse().map(([month, pnl]) => ({ month, pnl: +pnl.toFixed(0) })),
  };
}

export function fmtInr(n: number): string {
  const sign = n < 0 ? "-" : "";
  return sign + "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

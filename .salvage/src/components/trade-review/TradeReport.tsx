import { useMemo, useState } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, ReferenceLine, ReferenceDot,
  ResponsiveContainer, Tooltip as RTooltip,
} from "recharts";
import {
  Activity, Brain, Gauge, CalendarClock, FlaskConical, GraduationCap, ArrowUpRight, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard, SectionTitle, Metric, InfoTip, toneOf } from "./primitives";
import {
  summarize, attribution, aiReport, buildTimeline, whatIfs, payoffCurve, learningCards,
  fmtInr, type CompletedTrade,
} from "@/lib/tradeReview";

export function TradeReport({ trade }: { trade: CompletedTrade }) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <TradeMeta trade={trade} />
      <PnLSummary trade={trade} />
      <MarketSnapshot trade={trade} />
      <AIAnalysis trade={trade} />
      <RiskBreakdown trade={trade} />
      <Timeline trade={trade} />
      <WhatIfAnalysis trade={trade} />
      <LearningSection trade={trade} />
      <Disclaimer />
    </div>
  );
}

/* ---------- Trade meta / inputs ---------- */
function TradeMeta({ trade }: { trade: CompletedTrade }) {
  const rows: [string, string][] = [
    ["Underlying", trade.underlying],
    ["Strategy", trade.strategyName],
    ["Direction", trade.direction],
    ["Expiry", trade.expiryLabel],
    ["Entry Date", trade.entryDate],
    ["Exit Date", trade.exitDate],
    ["Strike(s)", [...new Set(trade.legs.map((l) => l.strike))].sort((a, b) => a - b).join(" / ")],
    ["Quantity", `${trade.qtyLots} lot${trade.qtyLots > 1 ? "s" : ""} × ${trade.lotSize}`],
    ["Entry Spot", trade.entrySpot.toLocaleString("en-IN")],
    ["Exit Spot", trade.exitSpot.toLocaleString("en-IN")],
    ["Net Premium", fmtInr(trade.legs.reduce((a, l) => a + (l.action === "SELL" ? 1 : -1) * l.premium * l.qty * l.lotSize, 0))],
    ["Broker Charges", fmtInr(trade.brokerCharges)],
  ];
  return (
    <GlassCard glow="primary" className="col-span-12">
      <SectionTitle icon={Sparkles}>Trade Details</SectionTitle>
      <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-3">
        {rows.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
            <div className="mono text-sm mt-0.5 truncate" title={v}>{v}</div>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4">
        <div className="rounded-lg border border-border/60 bg-surface-2/40 overflow-x-auto">
          <table className="w-full text-xs mono min-w-[520px]">
            <thead className="text-muted-foreground">
              <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left border-b border-border/60">
                <th>Leg</th><th>Action</th><th>Type</th><th>Strike</th><th>Qty</th><th>Entry Premium</th>
              </tr>
            </thead>
            <tbody>
              {trade.legs.map((l, i) => (
                <tr key={l.id} className="[&>td]:px-3 [&>td]:py-1.5 border-b border-border/30 last:border-0">
                  <td className="text-muted-foreground">#{i + 1}</td>
                  <td><span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", l.action === "BUY" ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear")}>{l.action}</span></td>
                  <td>{l.type}</td><td>{l.strike}</td><td>{l.qty}</td><td>{l.premium.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </GlassCard>
  );
}

/* ---------- P&L summary ---------- */
function PnLSummary({ trade }: { trade: CompletedTrade }) {
  const s = summarize(trade);
  return (
    <GlassCard glow={s.netPnl >= 0 ? "bull" : "bear"} className="col-span-12">
      <SectionTitle icon={Gauge}>Performance Summary</SectionTitle>
      <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <Metric label="Net P&L" value={fmtInr(s.netPnl)} tone={toneOf(s.netPnl)} />
        <Metric label="Gross P&L" value={fmtInr(s.grossPnl)} tone={toneOf(s.grossPnl)} />
        <Metric label="Return %" value={`${s.returnPct >= 0 ? "+" : ""}${s.returnPct}%`} tone={toneOf(s.returnPct)} />
        <Metric label="Max Profit" value={isFinite(s.maxProfit) ? fmtInr(s.maxProfit) : "Unlimited"} tone="up" />
        <Metric label="Max Loss" value={fmtInr(s.maxLoss)} tone="down" />
        <Metric label="Breakeven" value={s.breakevens.length ? s.breakevens.map((b) => b.toFixed(0)).join(" / ") : "—"} />
        <Metric label="Days Held" value={trade.holdDays} />
      </div>
    </GlassCard>
  );
}

/* ---------- Market snapshot ---------- */
function MarketSnapshot({ trade }: { trade: CompletedTrade }) {
  const s = summarize(trade);
  const items: { l: string; v: string; tone?: "up" | "down" | "n"; hint: string }[] = [
    { l: "Spot Movement", v: `${s.spotMovePct >= 0 ? "+" : ""}${s.spotMovePct}%`, tone: toneOf(s.spotMovePct), hint: "Percentage change in the underlying from entry to exit." },
    { l: "VIX Movement", v: `${trade.entryVix} → ${trade.exitVix}`, tone: toneOf(s.vixChange), hint: "India VIX at entry versus exit — a gauge of expected volatility." },
    { l: "ATM IV", v: `${trade.exitAtmIv.toFixed(1)}%`, hint: "At-the-money implied volatility at exit." },
    { l: "IV Change", v: `${s.ivChange >= 0 ? "+" : ""}${s.ivChange} pts`, tone: toneOf(s.ivChange), hint: "Change in ATM implied volatility over the holding period." },
    { l: "PCR", v: trade.pcr.toFixed(2), tone: trade.pcr > 1 ? "up" : "down", hint: "Put-Call Ratio by open interest during the trade." },
    { l: "OI Change", v: `${trade.oiChangePct >= 0 ? "+" : ""}${trade.oiChangePct}%`, tone: toneOf(trade.oiChangePct), hint: "Net change in total open interest across the chain." },
    { l: "Avg Volume", v: `${(trade.avgVolume / 1000).toFixed(0)}k`, hint: "Average daily traded contracts during the trade." },
    { l: "Market Trend", v: trade.marketTrend, hint: "Observed regime of the underlying over the period." },
  ];
  return (
    <GlassCard glow="info" className="col-span-12">
      <SectionTitle icon={Activity} hint="Market conditions observed during the trade window.">Market Snapshot</SectionTitle>
      <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {items.map((it) => (
          <div key={it.l} className="rounded-lg border border-border/60 bg-surface-2/50 px-3 py-2.5">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              {it.l}<InfoTip text={it.hint} />
            </div>
            <div className={cn("mono text-sm mt-1", it.tone === "up" && "text-bull", it.tone === "down" && "text-bear")}>{it.v}</div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

/* ---------- AI analysis ---------- */
function AIAnalysis({ trade }: { trade: CompletedTrade }) {
  const insights = useMemo(() => aiReport(trade), [trade]);
  return (
    <GlassCard glow="primary" className="col-span-12 lg:col-span-7">
      <SectionTitle icon={Brain} right={<span className="text-[10px] uppercase tracking-widest text-primary/80">Educational</span>}>
        AI Trade Analysis
      </SectionTitle>
      <div className="px-4 pb-4 space-y-3">
        {insights.map((ins, i) => (
          <div
            key={i}
            className="rounded-lg border border-border/60 bg-surface-2/40 p-3.5 animate-in fade-in-0 slide-in-from-bottom-2"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("w-1.5 h-1.5 rounded-full", ins.tone === "up" ? "bg-bull" : ins.tone === "down" ? "bg-bear" : "bg-info")} />
              <div className="text-sm font-medium">{ins.title}</div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{ins.body}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

/* ---------- Risk breakdown ---------- */
function RiskBreakdown({ trade }: { trade: CompletedTrade }) {
  const rows = useMemo(() => attribution(trade), [trade]);
  return (
    <GlassCard glow="warn" className="col-span-12 lg:col-span-5">
      <SectionTitle icon={Gauge} hint="Decomposition of the result into its underlying drivers, using the position's Greeks at entry.">
        Risk Breakdown
      </SectionTitle>
      <div className="px-4 pb-4 space-y-2.5">
        {rows.map((r) => (
          <div key={r.key}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">{r.label}<InfoTip text={r.explain} /></div>
              <div className="flex items-center gap-2">
                <span className={cn("mono text-xs", r.tone === "up" && "text-bull", r.tone === "down" && "text-bear")}>
                  {r.value >= 0 ? "+" : ""}{fmtInr(r.value)}
                </span>
                <span className="mono text-[10px] text-muted-foreground w-8 text-right">{r.pct}%</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700",
                  r.tone === "up" ? "bg-bull" : r.tone === "down" ? "bg-bear" : "bg-muted-foreground/40")}
                style={{ width: `${r.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

/* ---------- Timeline ---------- */
type Series = "pnl" | "spot" | "iv" | "theta";
const SERIES: { key: Series; label: string; color: string; fmt: (n: number) => string }[] = [
  { key: "pnl", label: "Daily P&L", color: "var(--primary)", fmt: (n) => fmtInr(n) },
  { key: "spot", label: "Spot", color: "var(--info)", fmt: (n) => n.toLocaleString("en-IN") },
  { key: "iv", label: "IV %", color: "var(--warn)", fmt: (n) => `${n.toFixed(1)}%` },
  { key: "theta", label: "Theta", color: "var(--bear)", fmt: (n) => n.toFixed(0) },
];
function Timeline({ trade }: { trade: CompletedTrade }) {
  const data = useMemo(() => buildTimeline(trade), [trade]);
  const [series, setSeries] = useState<Series>("pnl");
  const cfg = SERIES.find((x) => x.key === series)!;
  return (
    <GlassCard className="col-span-12">
      <SectionTitle icon={CalendarClock} right={
        <div className="flex gap-1">
          {SERIES.map((sx) => (
            <button key={sx.key} onClick={() => setSeries(sx.key)}
              className={cn("text-[11px] px-2 py-1 rounded-md border transition-colors",
                series === sx.key ? "border-primary/60 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
              {sx.label}
            </button>
          ))}
        </div>
      }>Trade Timeline</SectionTitle>
      <div className="px-2 pb-4">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 16, left: 8, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" width={56}
                domain={["auto", "auto"]} tickFormatter={(v) => series === "pnl" ? `${(v / 1000).toFixed(0)}k` : series === "spot" ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)} />
              <RTooltip content={<TLTip cfg={cfg} />} />
              {series === "pnl" && <ReferenceLine y={0} stroke="var(--border)" />}
              <Line type="monotone" dataKey={series} stroke={cfg.color} strokeWidth={2} dot={{ r: 3, fill: cfg.color }} activeDot={{ r: 5 }} isAnimationActive />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </GlassCard>
  );
}
function TLTip({ active, payload, cfg }: { active?: boolean; payload?: Array<{ payload: Record<Series | "label", number | string> }>; cfg: typeof SERIES[number] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md bg-popover border border-border px-2.5 py-1.5 text-xs mono">
      <div className="text-muted-foreground">{String(p.label)}</div>
      <div style={{ color: cfg.color }}>{cfg.label}: {cfg.fmt(p[cfg.key] as number)}</div>
    </div>
  );
}

/* ---------- What-if ---------- */
function WhatIfAnalysis({ trade }: { trade: CompletedTrade }) {
  const scenarios = useMemo(() => whatIfs(trade), [trade]);
  const curve = useMemo(() => payoffCurve(trade), [trade]);
  const [sel, setSel] = useState(scenarios[0].key);
  const active = scenarios.find((x) => x.key === sel)!;
  return (
    <GlassCard glow="info" className="col-span-12">
      <SectionTitle icon={FlaskConical} hint="Hypothetical re-pricing of the same position under altered conditions. Illustrative only.">
        What-If Analysis
      </SectionTitle>
      <div className="px-4 pb-4 grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-5 space-y-2">
          {scenarios.map((sc) => {
            const on = sc.key === sel;
            return (
              <button key={sc.key} onClick={() => setSel(sc.key)}
                className={cn("w-full text-left rounded-lg border p-3 transition-colors",
                  on ? "border-primary/60 bg-primary/5" : "border-border/60 bg-surface-2/40 hover:border-border")}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{sc.label}</span>
                  <span className={cn("mono text-sm", sc.pnl >= 0 ? "text-bull" : "text-bear")}>{sc.pnl >= 0 ? "+" : ""}{fmtInr(sc.pnl)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px] text-muted-foreground leading-relaxed pr-2">{sc.description}</span>
                  {sc.key !== "actual" && (
                    <span className={cn("mono text-[11px] shrink-0", sc.delta >= 0 ? "text-bull" : "text-bear")}>
                      {sc.delta >= 0 ? "+" : ""}{fmtInr(sc.delta)} vs actual
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <div className="col-span-12 lg:col-span-7">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 px-1">Payoff at expiry · scenario spot marked</div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curve}>
                <defs>
                  <linearGradient id="wiUp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--bull)" stopOpacity="0.35" /><stop offset="100%" stopColor="var(--bull)" stopOpacity="0" /></linearGradient>
                  <linearGradient id="wiDn" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="var(--bear)" stopOpacity="0.35" /><stop offset="100%" stopColor="var(--bear)" stopOpacity="0" /></linearGradient>
                </defs>
                <XAxis dataKey="price" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" tickFormatter={(v) => v.toFixed(0)} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" width={56} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <RTooltip content={({ active: a, payload }) => a && payload?.length ? (
                  <div className="rounded-md bg-popover border border-border px-2 py-1 text-xs mono">
                    <div>Spot: {(payload[0].payload as { price: number }).price.toFixed(0)}</div>
                    <div className={(payload[0].payload as { pnl: number }).pnl >= 0 ? "text-bull" : "text-bear"}>P&L: {fmtInr((payload[0].payload as { pnl: number }).pnl)}</div>
                  </div>
                ) : null} />
                <ReferenceLine y={0} stroke="var(--border)" />
                <ReferenceLine x={trade.entrySpot} stroke="var(--muted-foreground)" strokeDasharray="2 3" label={{ value: "Entry", fill: "var(--muted-foreground)", fontSize: 9, position: "insideTopLeft" }} />
                <ReferenceLine x={active.scenarioSpot} stroke="var(--primary)" strokeDasharray="4 3" label={{ value: active.label, fill: "var(--primary)", fontSize: 9, position: "top" }} />
                <ReferenceDot x={active.scenarioSpot} y={0} r={4} fill="var(--primary)" stroke="none" />
                <Area type="monotone" dataKey={(d: { pnl: number }) => d.pnl >= 0 ? d.pnl : 0} stroke="var(--bull)" fill="url(#wiUp)" isAnimationActive={false} strokeWidth={1.5} />
                <Area type="monotone" dataKey={(d: { pnl: number }) => d.pnl < 0 ? d.pnl : 0} stroke="var(--bear)" fill="url(#wiDn)" isAnimationActive={false} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

/* ---------- Learning ---------- */
function LearningSection({ trade }: { trade: CompletedTrade }) {
  const cards = useMemo(() => learningCards(trade), [trade]);
  return (
    <GlassCard glow="primary" className="col-span-12">
      <SectionTitle icon={GraduationCap}>Learning</SectionTitle>
      <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <a key={c.concept} href={c.href} target="_blank" rel="noopener noreferrer"
            className="group rounded-lg border border-border/60 bg-surface-2/40 p-3.5 hover:border-primary/60 transition-colors">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-primary/80">Concept</div>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="text-sm font-medium mt-1">{c.concept}</div>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">{c.summary}</p>
          </a>
        ))}
      </div>
    </GlassCard>
  );
}

/* ---------- Disclaimer ---------- */
export function Disclaimer() {
  return (
    <div className="col-span-12 rounded-lg border border-border/60 bg-surface-2/30 px-4 py-3 text-[11px] text-muted-foreground leading-relaxed">
      This report is generated for educational and analytical purposes only and does not constitute investment advice or a recommendation to trade.
    </div>
  );
}

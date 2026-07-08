import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine, Tooltip as RTooltip } from "recharts";
import { BarChart3 } from "lucide-react";
import { GlassCard, SectionTitle, Metric } from "./primitives";
import { aggregate, fmtInr } from "@/lib/tradeReview";

export function Statistics() {
  const a = useMemo(() => aggregate(), []);
  return (
    <GlassCard glow="info" className="col-span-12">
      <SectionTitle icon={BarChart3} hint="Aggregated across all completed trades in this account.">Statistics · All Trades</SectionTitle>
      <div className="px-4 pb-4 grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Metric label="Win Rate" value={`${a.winRate}%`} tone={a.winRate >= 50 ? "up" : "down"} />
          <Metric label="Avg Holding" value={`${a.avgHold}d`} />
          <Metric label="Avg Winner" value={fmtInr(a.avgWinner)} tone="up" />
          <Metric label="Avg Loser" value={fmtInr(a.avgLoser)} tone="down" />
          <Metric label="Avg Theta" value={a.avgTheta} sub="per day, at entry" />
          <Metric label="Avg Vega" value={a.avgVega} sub="per 1% IV" />
          <Metric label="Best Strategy" value={<span className="text-sm">{a.bestStrategy}</span>} tone="up" />
          <Metric label="Weakest Strategy" value={<span className="text-sm">{a.worstStrategy}</span>} tone="down" />
        </div>
        <div className="col-span-12 lg:col-span-5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 px-1">Monthly Performance</div>
          <div className="h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.monthly} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" width={44} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <RTooltip content={({ active, payload }) => active && payload?.length ? (
                  <div className="rounded-md bg-popover border border-border px-2 py-1 text-xs mono">
                    <div className="text-muted-foreground">{(payload[0].payload as { month: string }).month}</div>
                    <div className={(payload[0].payload as { pnl: number }).pnl >= 0 ? "text-bull" : "text-bear"}>{fmtInr((payload[0].payload as { pnl: number }).pnl)}</div>
                  </div>
                ) : null} />
                <ReferenceLine y={0} stroke="var(--border)" />
                <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                  {a.monthly.map((m, i) => <Cell key={i} fill={m.pnl >= 0 ? "var(--bull)" : "var(--bear)"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

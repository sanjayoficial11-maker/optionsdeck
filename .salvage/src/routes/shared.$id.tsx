import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip } from "recharts";
import { strategyPayoff, statsFromPayoff, portfolioGreeks, type Leg } from "@/lib/payoff";
import { Sigma } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shared/$id")({ component: SharedView });

interface StrategyRow { id: string; name: string; underlying: string; spot: number; expiry: string; legs: Leg[]; is_public: boolean; }

function SharedView() {
  const { id } = Route.useParams();
  const [row, setRow] = useState<StrategyRow | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    supabase.from("strategies").select("id,name,underlying,spot,expiry,legs,is_public").eq("id", id).maybeSingle()
      .then(({ data, error }) => {
        if (error) setErr(error.message);
        else if (!data) setErr("Strategy not found or not public.");
        else setRow(data as unknown as StrategyRow);
      });
  }, [id]);

  const legs = row?.legs ?? [];
  const spot = row?.spot ?? 0;
  const payoff = useMemo(() => strategyPayoff(legs, spot), [legs, spot]);
  const stats = useMemo(() => statsFromPayoff(legs, spot), [legs, spot]);
  const greeks = useMemo(() => portfolioGreeks(legs, spot), [legs, spot]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface-1 h-14 px-4 flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-primary/15 grid place-items-center"><Sigma className="w-4 h-4 text-primary" /></div>
        <span className="font-semibold">OptionsDeck<span className="text-primary">.</span></span>
        <Link to="/" className="ml-auto text-xs text-muted-foreground hover:text-foreground">Home →</Link>
      </header>
      <div className="max-w-6xl mx-auto p-6">
        {err && <div className="rounded-lg border border-border bg-surface-1 p-6 text-sm text-muted-foreground">{err}</div>}
        {row && (
          <>
            <div className="flex items-baseline gap-3 mb-4">
              <h1 className="text-2xl font-semibold">{row.name}</h1>
              <span className="text-xs mono text-muted-foreground">{row.underlying} · Spot {row.spot} · Exp {row.expiry}</span>
            </div>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-7 rounded-lg border border-border bg-surface-1 p-4">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Payoff at expiry</div>
                <div className="h-[320px]">
                  <ResponsiveContainer>
                    <AreaChart data={payoff}>
                      <defs>
                        <linearGradient id="u" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--bull)" stopOpacity="0.35" /><stop offset="100%" stopColor="var(--bull)" stopOpacity="0" /></linearGradient>
                        <linearGradient id="d" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="var(--bear)" stopOpacity="0.35" /><stop offset="100%" stopColor="var(--bear)" stopOpacity="0" /></linearGradient>
                      </defs>
                      <XAxis dataKey="price" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" />
                      <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" width={60} />
                      <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 11 }} />
                      <ReferenceLine y={0} stroke="var(--border)" />
                      <ReferenceLine x={row.spot} stroke="var(--primary)" strokeDasharray="3 3" />
                      <Area type="monotone" dataKey={(d: {pnl:number}) => d.pnl >= 0 ? d.pnl : 0} stroke="var(--bull)" fill="url(#u)" isAnimationActive={false} />
                      <Area type="monotone" dataKey={(d: {pnl:number}) => d.pnl < 0 ? d.pnl : 0} stroke="var(--bear)" fill="url(#d)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
                  <Stat label="Max profit" value={"₹" + stats.maxProfit.toLocaleString("en-IN")} tone={stats.maxProfit > 0 ? "up" : "n"} />
                  <Stat label="Max loss"   value={"₹" + stats.maxLoss.toLocaleString("en-IN")}   tone={stats.maxLoss < 0 ? "down" : "n"} />
                  <Stat label="R : R"      value={stats.rr ? `1 : ${stats.rr}` : "—"} />
                  <Stat label="Margin"     value={"₹" + stats.marginEstimate.toLocaleString("en-IN")} />
                </div>
              </div>
              <div className="col-span-12 lg:col-span-5 rounded-lg border border-border bg-surface-1 p-4">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Legs</div>
                <table className="w-full text-xs mono">
                  <tbody>
                    {legs.map((l, i) => (
                      <tr key={i} className="border-b border-border/40 [&>td]:py-1.5">
                        <td><span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold", l.action === "BUY" ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear")}>{l.action}</span></td>
                        <td>{l.qty}x {l.type}</td>
                        <td>{l.strike}</td>
                        <td className="text-right">@ {l.premium.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-xs uppercase tracking-widest text-muted-foreground mt-4 mb-2">Portfolio Greeks</div>
                <div className="grid grid-cols-5 gap-2 text-xs mono">
                  <G l="Δ" v={greeks.delta} /><G l="Γ" v={greeks.gamma} p={4} /><G l="Θ" v={greeks.theta} /><G l="ν" v={greeks.vega} /><G l="ρ" v={greeks.rho} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
function Stat({ label, value, tone }: { label: string; value: string; tone?: "up"|"down"|"n" }) {
  return (
    <div className="rounded-md bg-surface-2 border border-border px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("mono text-sm mt-0.5", tone === "up" && "text-bull", tone === "down" && "text-bear")}>{value}</div>
    </div>
  );
}
function G({ l, v, p = 2 }: { l: string; v: number; p?: number }) {
  return (
    <div className="rounded bg-surface-2 border border-border p-2 text-center">
      <div className="text-[10px] uppercase text-muted-foreground">{l}</div>
      <div className={v >= 0 ? "text-bull" : "text-bear"}>{v.toFixed(p)}</div>
    </div>
  );
}

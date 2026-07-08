import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, Wand2, Copy, Share2 } from "lucide-react";
import { LineChart as RLine, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip, ReferenceDot, Area, AreaChart } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { INSTRUMENTS, type Underlying, buildChain, ivSmile } from "@/lib/optionChain";
import { useExpiries, useSpot } from "@/hooks/useMarket";
import { bsPrice } from "@/lib/greeks";
import { strategyPayoff, statsFromPayoff, portfolioGreeks, legGreeks, type Leg } from "@/lib/payoff";
import { TEMPLATES } from "@/lib/templates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/builder")({ component: Builder });

const uid = () => Math.random().toString(36).slice(2, 10);

function Builder() {
  const { user } = useAuth();
  const [sym, setSym] = useState<Underlying>("NIFTY");
  const inst = INSTRUMENTS[sym];
  const spot = useSpot(sym);
  const expiries = useExpiries(sym);
  const [expIdx, setExpIdx] = useState(0);
  const expiry = expiries[expIdx];
  const [legs, setLegs] = useState<Leg[]>([]);
  const [name, setName] = useState("Untitled strategy");
  const [saving, setSaving] = useState(false);

  const chain = useMemo(() => (expiry ? buildChain(inst, spot, expiry) : []), [inst, spot, expiry]);
  const atmStrike = Math.round(spot / inst.strikeStep) * inst.strikeStep;

  const payoff = useMemo(() => strategyPayoff(legs, spot), [legs, spot]);
  const stats = useMemo(() => statsFromPayoff(legs, spot), [legs, spot]);
  const pGreeks = useMemo(() => portfolioGreeks(legs, spot), [legs, spot]);

  function addLegAt(strike: number, type: "CE" | "PE", action: "BUY" | "SELL") {
    const m = (strike - spot) / spot;
    const iv = ivSmile(inst.baseIV, type === "CE" ? m : -m);
    const T = (expiry?.daysToExpiry ?? 7) / 365;
    const premium = +bsPrice({ S: spot, K: strike, T, r: 0.065, iv, type }).toFixed(2);
    setLegs((prev) => [...prev, {
      id: uid(), action, type, strike, premium, iv, qty: 1,
      lotSize: inst.lotSize, expiryDays: expiry?.daysToExpiry ?? 7,
    }]);
  }
  function applyTemplate(id: string) {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t || !expiry) return;
    const built = t.build({ inst, spot, expiryDays: expiry.daysToExpiry });
    setLegs(built.map((l) => ({ ...l, id: uid() })));
    setName(t.name);
    toast.success(`Loaded ${t.name}`);
  }
  function updateLeg(id: string, patch: Partial<Leg>) {
    setLegs((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  function removeLeg(id: string) { setLegs((prev) => prev.filter((l) => l.id !== id)); }

  async function save(makePublic = false) {
    if (!user) return toast.error("Sign in required");
    if (!legs.length) return toast.error("Add at least one leg");
    setSaving(true);
    const { data, error } = await supabase.from("strategies").insert({
      user_id: user.id,
      name, underlying: sym, spot,
      expiry: expiry?.date.toISOString().slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      legs: JSON.parse(JSON.stringify(legs)),
      is_public: makePublic,
    }).select("id").single();
    setSaving(false);
    if (error) return toast.error(error.message);
    if (makePublic && data) {
      const url = `${window.location.origin}/shared/${data.id}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Public link copied to clipboard");
    } else {
      toast.success("Strategy saved");
    }
  }

  return (
    <div className="p-3 sm:p-4 grid grid-cols-12 gap-3 sm:gap-4">
      {/* Header */}
      <div className="col-span-12 flex flex-wrap items-center gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="bg-transparent text-lg font-semibold outline-none border-b border-transparent hover:border-border focus:border-primary py-1" />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select value={sym} onChange={(v) => { setSym(v as Underlying); setLegs([]); }}
            options={Object.keys(INSTRUMENTS).map((k) => ({ value: k, label: k }))} />
          <Select value={String(expIdx)} onChange={(v) => setExpIdx(+v)}
            options={expiries.map((e, i) => ({ value: String(i), label: `${e.label} (${e.daysToExpiry}d)` }))} />
          <div className="mono text-sm px-3 py-1.5 rounded-md bg-surface-2 border border-border">
            <span className="text-muted-foreground text-xs mr-1.5">SPOT</span>
            {spot.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </div>
          <button onClick={() => save(false)} disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-50">
            <Save className="w-3.5 h-3.5" />Save
          </button>
          <button onClick={() => save(true)} disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface-2">
            <Share2 className="w-3.5 h-3.5" />Share
          </button>
        </div>
      </div>

      {/* Templates strip */}
      <div className="col-span-12 flex items-center gap-2 overflow-x-auto pb-1">
        <Wand2 className="w-4 h-4 text-primary shrink-0" />
        {TEMPLATES.map((t) => (
          <button key={t.id} onClick={() => applyTemplate(t.id)}
            title={t.description}
            className="shrink-0 text-xs px-2.5 py-1.5 rounded-md border border-border bg-surface-1 hover:border-primary hover:text-primary transition-colors">
            {t.name}
          </button>
        ))}
      </div>

      {/* Option chain */}
      <div className="col-span-12 xl:col-span-7 rounded-lg border border-border bg-surface-1 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border text-xs uppercase tracking-widest text-muted-foreground flex items-center justify-between">
          <span>Option chain · {sym}</span>
          <span className="mono">ATM {atmStrike}</span>
        </div>
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full text-xs mono">
            <thead className="sticky top-0 bg-surface-1 text-muted-foreground">
              <tr className="[&>th]:px-2 [&>th]:py-2 [&>th]:text-right border-b border-border">
                <th className="text-left">OI</th><th>IV</th><th>LTP</th>
                <th className="text-center bg-surface-2">STRIKE</th>
                <th className="text-left">LTP</th><th>IV</th><th className="text-left">OI</th>
              </tr>
            </thead>
            <tbody>
              {chain.map((r) => {
                const isATM = r.strike === atmStrike;
                return (
                  <tr key={r.strike} className={cn("[&>td]:px-2 [&>td]:py-1.5 border-b border-border/40", isATM && "bg-primary/5")}>
                    <td className="text-right text-muted-foreground">{(r.ce.oi / 1000).toFixed(0)}k</td>
                    <td className="text-right text-muted-foreground">{r.ce.iv.toFixed(1)}</td>
                    <td className="text-right">
                      <ClickCell v={r.ce.ltp} onBuy={() => addLegAt(r.strike, "CE", "BUY")} onSell={() => addLegAt(r.strike, "CE", "SELL")} />
                    </td>
                    <td className={cn("text-center font-semibold bg-surface-2", isATM && "text-primary")}>{r.strike}</td>
                    <td className="text-left">
                      <ClickCell v={r.pe.ltp} onBuy={() => addLegAt(r.strike, "PE", "BUY")} onSell={() => addLegAt(r.strike, "PE", "SELL")} />
                    </td>
                    <td className="text-right text-muted-foreground">{r.pe.iv.toFixed(1)}</td>
                    <td className="text-left text-muted-foreground">{(r.pe.oi / 1000).toFixed(0)}k</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payoff */}
      <div className="col-span-12 xl:col-span-5 rounded-lg border border-border bg-surface-1 p-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground mb-2">
          <span>Payoff at expiry</span>
          <span className="mono text-foreground/70">₹ per lot-set</span>
        </div>
        <div className="h-[280px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={payoff}>
              <defs>
                <linearGradient id="upG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--bull)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--bull)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="dnG" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="var(--bear)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--bear)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <XAxis dataKey="price" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" width={60} />
              <Tooltip content={<PayTip />} />
              <ReferenceLine y={0} stroke="var(--border)" />
              <ReferenceLine x={spot} stroke="var(--primary)" strokeDasharray="3 3" label={{ value: "Spot", fill: "var(--primary)", fontSize: 10, position: "top" }} />
              {stats.breakevens.map((be) => (
                <ReferenceLine key={be} x={be} stroke="var(--warn)" strokeDasharray="2 4" />
              ))}
              <Area type="monotone" dataKey={(d: {pnl: number}) => d.pnl >= 0 ? d.pnl : 0} stroke="var(--bull)" fill="url(#upG)" isAnimationActive={false} strokeWidth={1.5} />
              <Area type="monotone" dataKey={(d: {pnl: number}) => d.pnl < 0 ? d.pnl : 0} stroke="var(--bear)" fill="url(#dnG)" isAnimationActive={false} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
          <Stat label="Max profit" value={fmtInr(stats.maxProfit)} tone={stats.maxProfit > 0 ? "up" : "n"} />
          <Stat label="Max loss" value={fmtInr(stats.maxLoss)} tone={stats.maxLoss < 0 ? "down" : "n"} />
          <Stat label="R : R" value={stats.rr ? `1 : ${stats.rr}` : "—"} />
          <Stat label="Margin (est.)" value={fmtInr(stats.marginEstimate)} />
          <Stat label={stats.netCredit >= 0 ? "Net credit" : "Net debit"} value={fmtInr(Math.abs(stats.netCredit))} tone={stats.netCredit >= 0 ? "up" : "down"} />
          <Stat label="Breakevens" value={stats.breakevens.length ? stats.breakevens.map((b) => b.toFixed(0)).join(" / ") : "—"} className="col-span-1 sm:col-span-3" />
        </div>
      </div>

      {/* Legs table */}
      <div className="col-span-12 xl:col-span-8 rounded-lg border border-border bg-surface-1 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border text-xs uppercase tracking-widest text-muted-foreground flex items-center justify-between">
          <span>Legs ({legs.length})</span>
          <button onClick={() => addLegAt(atmStrike, "CE", "BUY")}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
            <Plus className="w-3 h-3" />Add leg
          </button>
        </div>
        {legs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Click a premium in the chain, or pick a template above.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-xs mono">
              <thead className="text-muted-foreground">
                <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left border-b border-border">
                  <th>Action</th><th>Type</th><th>Strike</th><th>Qty (lots)</th><th>Premium</th><th>IV %</th><th>DTE</th>
                  <th>Δ</th><th>Θ</th><th>ν</th><th></th>
                </tr>
              </thead>
              <tbody>
                {legs.map((l) => {
                  const g = legGreeks(l, spot);
                  return (
                    <tr key={l.id} className="[&>td]:px-3 [&>td]:py-1.5 border-b border-border/40">
                      <td>
                        <button onClick={() => updateLeg(l.id, { action: l.action === "BUY" ? "SELL" : "BUY" })}
                          className={cn("px-2 py-0.5 rounded text-[10px] font-semibold",
                            l.action === "BUY" ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear")}>
                          {l.action}
                        </button>
                      </td>
                      <td>
                        <button onClick={() => updateLeg(l.id, { type: l.type === "CE" ? "PE" : "CE" })}
                          className="px-2 py-0.5 rounded bg-surface-2 text-[10px] font-semibold">
                          {l.type}
                        </button>
                      </td>
                      <td><NumIn v={l.strike} step={inst.strikeStep} onChange={(v) => updateLeg(l.id, { strike: v })} /></td>
                      <td><NumIn v={l.qty} step={1} onChange={(v) => updateLeg(l.id, { qty: Math.max(1, v) })} /></td>
                      <td><NumIn v={l.premium} step={0.5} onChange={(v) => updateLeg(l.id, { premium: v })} /></td>
                      <td><NumIn v={+(l.iv * 100).toFixed(2)} step={0.5} onChange={(v) => updateLeg(l.id, { iv: v / 100 })} /></td>
                      <td><NumIn v={l.expiryDays} step={1} onChange={(v) => updateLeg(l.id, { expiryDays: Math.max(1, v) })} /></td>
                      <td className={g.delta >= 0 ? "ticker-up" : "ticker-down"}>{g.delta.toFixed(1)}</td>
                      <td className={g.theta >= 0 ? "ticker-up" : "ticker-down"}>{g.theta.toFixed(1)}</td>
                      <td>{g.vega.toFixed(1)}</td>
                      <td>
                        <div className="flex gap-1">
                          <IconBtn onClick={() => setLegs((p) => [...p, { ...l, id: uid() }])} title="Duplicate"><Copy className="w-3 h-3" /></IconBtn>
                          <IconBtn onClick={() => removeLeg(l.id)} title="Remove"><Trash2 className="w-3 h-3" /></IconBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Portfolio Greeks */}
      <div className="col-span-12 xl:col-span-4 rounded-lg border border-border bg-surface-1 p-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Portfolio Greeks</div>
        <div className="space-y-2">
          <GreekRow label="Delta" v={pGreeks.delta} hint="Directional exposure" />
          <GreekRow label="Gamma" v={pGreeks.gamma} hint="Δ change per ₹1 in spot" precision={4} />
          <GreekRow label="Theta" v={pGreeks.theta} hint="Daily time decay (₹)" />
          <GreekRow label="Vega"  v={pGreeks.vega}  hint="P&L per 1% IV move (₹)" />
          <GreekRow label="Rho"   v={pGreeks.rho}   hint="P&L per 1% rate move (₹)" />
        </div>
      </div>
    </div>
  );
}

/* ---------- small primitives ---------- */

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="rounded-md bg-surface-2 border border-border px-2.5 py-1.5 text-sm outline-none focus:border-primary">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
function NumIn({ v, step, onChange }: { v: number; step: number; onChange: (n: number) => void }) {
  return (
    <input type="number" step={step} value={v} onChange={(e) => onChange(+e.target.value)}
      className="w-20 rounded bg-surface-2 border border-border px-1.5 py-0.5 text-xs mono outline-none focus:border-primary" />
  );
}
function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return <button onClick={onClick} title={title} className="p-1 rounded hover:bg-surface-2 text-muted-foreground hover:text-foreground">{children}</button>;
}
function ClickCell({ v, onBuy, onSell }: { v: number; onBuy: () => void; onSell: () => void }) {
  return (
    <div className="inline-flex items-center gap-1">
      <button onClick={onBuy}  className="px-1.5 py-0.5 rounded hover:bg-bull/15 hover:text-bull">B</button>
      <span>{v.toFixed(2)}</span>
      <button onClick={onSell} className="px-1.5 py-0.5 rounded hover:bg-bear/15 hover:text-bear">S</button>
    </div>
  );
}
function Stat({ label, value, tone, className }: { label: string; value: string; tone?: "up" | "down" | "n"; className?: string }) {
  return (
    <div className={cn("rounded-md bg-surface-2 border border-border px-2.5 py-2", className)}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("mono text-sm mt-0.5", tone === "up" && "text-bull", tone === "down" && "text-bear")}>{value}</div>
    </div>
  );
}
function GreekRow({ label, v, hint, precision = 2 }: { label: string; v: number; hint: string; precision?: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <div>
        <div className="text-sm">{label}</div>
        <div className="text-[10px] text-muted-foreground">{hint}</div>
      </div>
      <div className={cn("mono text-base", v >= 0 ? "text-bull" : "text-bear")}>
        {v >= 0 ? "+" : ""}{v.toFixed(precision)}
      </div>
    </div>
  );
}
function PayTip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { price: number; pnl: number } }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md bg-popover border border-border px-2 py-1 text-xs mono">
      <div>Spot: {p.price.toFixed(2)}</div>
      <div className={p.pnl >= 0 ? "text-bull" : "text-bear"}>P&L: {fmtInr(p.pnl)}</div>
    </div>
  );
}
function fmtInr(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

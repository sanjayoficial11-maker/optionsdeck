import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { INSTRUMENTS, type Underlying, buildChain } from "@/lib/optionChain";
import { useExpiries, useSpot } from "@/hooks/useMarket";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chain")({ component: ChainPage });

function ChainPage() {
  const [sym, setSym] = useState<Underlying>("NIFTY");
  const inst = INSTRUMENTS[sym];
  const spot = useSpot(sym);
  const expiries = useExpiries(sym);
  const [expIdx, setExpIdx] = useState(0);
  const expiry = expiries[expIdx];
  const chain = useMemo(() => (expiry ? buildChain(inst, spot, expiry) : []), [inst, spot, expiry]);
  const atm = Math.round(spot / inst.strikeStep) * inst.strikeStep;

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={sym} onChange={(e) => setSym(e.target.value as Underlying)}
          className="rounded-md bg-surface-2 border border-border px-2.5 py-1.5 text-sm">
          {Object.keys(INSTRUMENTS).map((k) => <option key={k}>{k}</option>)}
        </select>
        <select value={expIdx} onChange={(e) => setExpIdx(+e.target.value)}
          className="rounded-md bg-surface-2 border border-border px-2.5 py-1.5 text-sm">
          {expiries.map((e, i) => <option key={i} value={i}>{e.label} ({e.daysToExpiry}d)</option>)}
        </select>
        <div className="mono text-sm px-3 py-1.5 rounded-md bg-surface-2 border border-border">
          <span className="text-muted-foreground text-xs mr-1.5">SPOT</span>
          {spot.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface-1 overflow-hidden">
        <div className="grid grid-cols-2 text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
          <div className="p-2 text-center border-r border-border bg-bull/10 text-bull">CALLS</div>
          <div className="p-2 text-center bg-bear/10 text-bear">PUTS</div>
        </div>
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-xs mono">
            <thead className="sticky top-0 bg-surface-1 text-muted-foreground">
              <tr className="[&>th]:px-2 [&>th]:py-2 [&>th]:text-right border-b border-border">
                <th>OI</th><th>Chg OI</th><th>Vol</th><th>IV</th><th>Bid</th><th>Ask</th><th>LTP</th>
                <th className="text-center bg-surface-2">STRIKE</th>
                <th className="text-left">LTP</th><th className="text-left">Bid</th><th className="text-left">Ask</th><th>IV</th><th className="text-left">Vol</th><th className="text-left">Chg OI</th><th className="text-left">OI</th>
              </tr>
            </thead>
            <tbody>
              {chain.map((r) => {
                const isATM = r.strike === atm;
                return (
                  <tr key={r.strike} className={cn("[&>td]:px-2 [&>td]:py-1.5 border-b border-border/40", isATM && "bg-primary/5")}>
                    <td className="text-right text-muted-foreground">{fmtK(r.ce.oi)}</td>
                    <td className={cn("text-right", r.ce.oiChange >= 0 ? "ticker-up" : "ticker-down")}>{fmtK(r.ce.oiChange)}</td>
                    <td className="text-right text-muted-foreground">{fmtK(r.ce.volume)}</td>
                    <td className="text-right">{r.ce.iv.toFixed(2)}</td>
                    <td className="text-right text-muted-foreground">{r.ce.bid.toFixed(2)}</td>
                    <td className="text-right text-muted-foreground">{r.ce.ask.toFixed(2)}</td>
                    <td className="text-right font-medium">{r.ce.ltp.toFixed(2)}</td>
                    <td className={cn("text-center font-semibold bg-surface-2", isATM && "text-primary")}>{r.strike}</td>
                    <td className="font-medium">{r.pe.ltp.toFixed(2)}</td>
                    <td className="text-muted-foreground">{r.pe.bid.toFixed(2)}</td>
                    <td className="text-muted-foreground">{r.pe.ask.toFixed(2)}</td>
                    <td className="text-right">{r.pe.iv.toFixed(2)}</td>
                    <td className="text-muted-foreground">{fmtK(r.pe.volume)}</td>
                    <td className={cn(r.pe.oiChange >= 0 ? "ticker-up" : "ticker-down")}>{fmtK(r.pe.oiChange)}</td>
                    <td className="text-muted-foreground">{fmtK(r.pe.oi)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function fmtK(n: number) {
  const s = n < 0 ? "-" : "";
  const a = Math.abs(n);
  if (a >= 1e7) return s + (a / 1e7).toFixed(1) + "Cr";
  if (a >= 1e5) return s + (a / 1e5).toFixed(1) + "L";
  if (a >= 1e3) return s + (a / 1e3).toFixed(1) + "k";
  return s + a.toString();
}

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, ReferenceLine, Tooltip } from "recharts";
import { INSTRUMENTS, type Underlying, buildChain } from "@/lib/optionChain";
import { useExpiries, useSpot } from "@/hooks/useMarket";

export const Route = createFileRoute("/_authenticated/analytics")({ component: AnalyticsPage });

function AnalyticsPage() {
  const [sym, setSym] = useState<Underlying>("NIFTY");
  const inst = INSTRUMENTS[sym];
  const spot = useSpot(sym);
  const expiries = useExpiries(sym);
  const [expIdx, setExpIdx] = useState(0);
  const expiry = expiries[expIdx];
  const rows = useMemo(() => (expiry ? buildChain(inst, spot, expiry) : []), [inst, spot, expiry]);

  const totals = useMemo(() => {
    const ceOI = rows.reduce((s, r) => s + r.ce.oi, 0);
    const peOI = rows.reduce((s, r) => s + r.pe.oi, 0);
    const ceAdd = rows.reduce((s, r) => s + Math.max(0, r.ce.oiChange), 0);
    const peAdd = rows.reduce((s, r) => s + Math.max(0, r.pe.oiChange), 0);
    const ceUnw = rows.reduce((s, r) => s + Math.max(0, -r.ce.oiChange), 0);
    const peUnw = rows.reduce((s, r) => s + Math.max(0, -r.pe.oiChange), 0);
    const pcr = ceOI ? peOI / ceOI : 0;
    const topCE = [...rows].sort((a, b) => b.ce.oi - a.ce.oi).slice(0, 5);
    const topPE = [...rows].sort((a, b) => b.pe.oi - a.pe.oi).slice(0, 5);
    // Max Pain = strike minimizing total pain
    let mp = rows[0]?.strike, mpVal = Infinity;
    for (const test of rows) {
      let pain = 0;
      for (const r of rows) {
        pain += Math.max(0, test.strike - r.strike) * r.ce.oi;
        pain += Math.max(0, r.strike - test.strike) * r.pe.oi;
      }
      if (pain < mpVal) { mpVal = pain; mp = test.strike; }
    }
    return { ceOI, peOI, ceAdd, peAdd, ceUnw, peUnw, pcr, topCE, topPE, maxPain: mp };
  }, [rows]);

  const atmIdx = rows.findIndex((r) => Math.abs(r.strike - spot) === Math.min(...rows.map((rr) => Math.abs(rr.strike - spot))));
  const atmIV = rows[atmIdx] ? (rows[atmIdx].ce.iv + rows[atmIdx].pe.iv) / 2 : 0;
  const ivSmile = rows.map((r) => ({ strike: r.strike, ce: r.ce.iv, pe: r.pe.iv, avg: (r.ce.iv + r.pe.iv) / 2 }));
  const oiBars = rows.map((r) => ({ strike: r.strike, ce: r.ce.oi / 1000, pe: -r.pe.oi / 1000 }));

  return (
    <div className="p-4 grid grid-cols-12 gap-4">
      <div className="col-span-12 flex items-center gap-2">
        <select value={sym} onChange={(e) => setSym(e.target.value as Underlying)}
          className="rounded-md bg-surface-2 border border-border px-2.5 py-1.5 text-sm">
          {Object.keys(INSTRUMENTS).map((k) => <option key={k}>{k}</option>)}
        </select>
        <select value={expIdx} onChange={(e) => setExpIdx(+e.target.value)}
          className="rounded-md bg-surface-2 border border-border px-2.5 py-1.5 text-sm">
          {expiries.map((e, i) => <option key={i} value={i}>{e.label} ({e.daysToExpiry}d)</option>)}
        </select>
      </div>

      {[
        { l: "Spot", v: spot.toLocaleString("en-IN", { maximumFractionDigits: 2 }) },
        { l: "PCR (OI)", v: totals.pcr.toFixed(2), tone: totals.pcr > 1 ? "up" : "down" as const },
        { l: "Max pain", v: totals.maxPain },
        { l: "ATM IV", v: atmIV.toFixed(2) + "%" },
        { l: "CE OI added", v: fmtK(totals.ceAdd), tone: "up" as const },
        { l: "PE OI added", v: fmtK(totals.peAdd), tone: "up" as const },
      ].map((k) => (
        <div key={k.l} className="col-span-6 md:col-span-4 lg:col-span-2 rounded-lg border border-border bg-surface-1 p-3">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k.l}</div>
          <div className={"mono text-lg mt-1 " + (k.tone === "up" ? "text-bull" : k.tone === "down" ? "text-bear" : "")}>{k.v}</div>
        </div>
      ))}

      <div className="col-span-12 lg:col-span-7 rounded-lg border border-border bg-surface-1 p-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Open Interest by Strike (CE ▲ / PE ▼)</div>
        <div className="h-[300px]">
          <ResponsiveContainer>
            <BarChart data={oiBars} stackOffset="sign">
              <XAxis dataKey="strike" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" width={50}
                tickFormatter={(v) => `${Math.abs(v).toFixed(0)}k`} />
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div className="rounded-md bg-popover border border-border px-2 py-1 text-xs mono">
                  <div>Strike: {payload[0].payload.strike}</div>
                  <div className="text-bull">CE: {payload[0].payload.ce.toFixed(1)}k</div>
                  <div className="text-bear">PE: {Math.abs(payload[0].payload.pe).toFixed(1)}k</div>
                </div>
              ) : null} />
              <ReferenceLine x={spot} stroke="var(--primary)" strokeDasharray="3 3" />
              <ReferenceLine y={0} stroke="var(--border)" />
              <Bar dataKey="ce" fill="var(--bull)" />
              <Bar dataKey="pe" fill="var(--bear)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-5 rounded-lg border border-border bg-surface-1 p-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">IV Smile</div>
        <div className="h-[300px]">
          <ResponsiveContainer>
            <LineChart data={ivSmile}>
              <XAxis dataKey="strike" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" domain={["auto","auto"]} width={40} tickFormatter={(v) => v.toFixed(0)} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontSize: 11 }} />
              <ReferenceLine x={spot} stroke="var(--primary)" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="ce" stroke="var(--bull)" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="pe" stroke="var(--bear)" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="avg" stroke="var(--primary)" dot={false} strokeWidth={1.5} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-6 rounded-lg border border-border bg-surface-1 p-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Top CE OI · Resistance</div>
        <ol className="text-sm space-y-1 mono">
          {totals.topCE.map((r, i) => (
            <li key={r.strike} className="flex justify-between border-b border-border/40 py-1">
              <span><span className="text-muted-foreground mr-2">#{i+1}</span>{r.strike}</span>
              <span className="text-bear">{fmtK(r.ce.oi)}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="col-span-12 lg:col-span-6 rounded-lg border border-border bg-surface-1 p-4">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Top PE OI · Support</div>
        <ol className="text-sm space-y-1 mono">
          {totals.topPE.map((r, i) => (
            <li key={r.strike} className="flex justify-between border-b border-border/40 py-1">
              <span><span className="text-muted-foreground mr-2">#{i+1}</span>{r.strike}</span>
              <span className="text-bull">{fmtK(r.pe.oi)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
function fmtK(n: number) {
  const s = n < 0 ? "-" : "";
  const a = Math.abs(n);
  if (a >= 1e7) return s + (a / 1e7).toFixed(2) + "Cr";
  if (a >= 1e5) return s + (a / 1e5).toFixed(1) + "L";
  if (a >= 1e3) return s + (a / 1e3).toFixed(1) + "k";
  return s + a.toString();
}

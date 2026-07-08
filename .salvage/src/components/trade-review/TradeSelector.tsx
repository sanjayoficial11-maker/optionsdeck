import { ChevronDown, TrendingUp, TrendingDown, Minus, Waves } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { TRADES, summarize, fmtInr, type CompletedTrade, type Direction } from "@/lib/tradeReview";

const DIR_ICON: Record<Direction, React.ComponentType<{ className?: string }>> = {
  Bullish: TrendingUp, Bearish: TrendingDown, Neutral: Minus, Volatility: Waves,
};

export function TradeSelector({ value, onChange }: { value: CompletedTrade; onChange: (t: CompletedTrade) => void }) {
  const [open, setOpen] = useState(false);
  const Icon = DIR_ICON[value.direction];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 rounded-lg border border-border bg-surface-1/70 backdrop-blur px-3 py-2 hover:border-primary/60 transition-colors min-w-[280px] text-left"
        aria-haspopup="listbox" aria-expanded={open}
      >
        <span className="grid place-items-center w-8 h-8 rounded-md bg-primary/12 text-primary shrink-0"><Icon className="w-4 h-4" /></span>
        <span className="min-w-0">
          <span className="block text-sm font-medium truncate">{value.strategyName} · {value.underlying}</span>
          <span className="block text-[11px] text-muted-foreground mono truncate">{value.id} · {value.entryDate} → {value.exitDate}</span>
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground ml-auto transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <ul
            role="listbox"
            className="absolute z-50 mt-2 w-[360px] max-w-[90vw] max-h-[60vh] overflow-auto rounded-xl border border-border bg-popover/95 backdrop-blur-xl p-1.5 shadow-2xl animate-in fade-in-0 zoom-in-95"
          >
            {TRADES.map((t) => {
              const s = summarize(t);
              const I = DIR_ICON[t.direction];
              const active = t.id === value.id;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => { onChange(t); setOpen(false); }}
                    className={cn("w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-surface-2/70 transition-colors",
                      active && "bg-primary/10")}
                  >
                    <span className="grid place-items-center w-7 h-7 rounded-md bg-surface-2 text-muted-foreground shrink-0"><I className="w-3.5 h-3.5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm truncate">{t.strategyName} · {t.underlying}</span>
                      <span className="block text-[10px] text-muted-foreground mono">{t.id} · {t.holdDays}d hold</span>
                    </span>
                    <span className={cn("mono text-sm shrink-0", s.netPnl >= 0 ? "text-bull" : "text-bear")}>
                      {s.netPnl >= 0 ? "+" : ""}{fmtInr(s.netPnl)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

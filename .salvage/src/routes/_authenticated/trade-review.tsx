import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Share2, ScrollText } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { TradeSelector } from "@/components/trade-review/TradeSelector";
import { TradeReport } from "@/components/trade-review/TradeReport";
import { Statistics } from "@/components/trade-review/Statistics";
import { TRADES, type CompletedTrade } from "@/lib/tradeReview";

export const Route = createFileRoute("/_authenticated/trade-review")({ component: TradeReviewPage });

function initialTrade(): CompletedTrade {
  if (typeof window !== "undefined") {
    const id = new URLSearchParams(window.location.search).get("trade");
    const found = TRADES.find((t) => t.id === id);
    if (found) return found;
  }
  return TRADES[0];
}

function TradeReviewPage() {
  const [trade, setTrade] = useState<CompletedTrade>(initialTrade);
  const [loading, setLoading] = useState(true);

  // Simulate report generation whenever the trade changes.
  useEffect(() => {
    setLoading(true);
    const id = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(id);
  }, [trade.id]);

  function selectTrade(t: CompletedTrade) {
    setTrade(t);
    const url = new URL(window.location.href);
    url.searchParams.set("trade", t.id);
    window.history.replaceState({}, "", url.toString());
  }

  function share() {
    const url = new URL(window.location.href);
    url.searchParams.set("trade", trade.id);
    navigator.clipboard.writeText(url.toString())
      .then(() => toast.success("Report link copied to clipboard"))
      .catch(() => toast.error("Could not copy link"));
  }

  function exportPdf() {
    toast.message("Opening print dialog", { description: "Choose “Save as PDF” to export the report." });
    setTimeout(() => window.print(), 300);
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="p-3 sm:p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center w-9 h-9 rounded-lg bg-primary/12 text-primary"><ScrollText className="w-5 h-5" /></span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight leading-none">Trade Review</h1>
              <p className="text-[11px] text-muted-foreground mt-1">Data-driven, educational post-trade analysis</p>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <TradeSelector value={trade} onChange={selectTrade} />
            <button onClick={exportPdf}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-1/70 px-3 py-2 text-sm hover:bg-surface-2 transition-colors">
              <Download className="w-3.5 h-3.5" />Export PDF
            </button>
            <button onClick={share}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity">
              <Share2 className="w-3.5 h-3.5" />Share
            </button>
          </div>
        </div>

        {loading ? <ReportSkeleton /> : <TradeReport trade={trade} />}

        <Statistics />
      </div>
    </TooltipProvider>
  );
}

function ReportSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4" aria-busy="true" aria-label="Generating report">
      <div className="col-span-12 rounded-xl border border-border/70 bg-surface-1/60 p-4">
        <Skeleton className="h-3 w-32 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i}><Skeleton className="h-2.5 w-16 mb-2" /><Skeleton className="h-4 w-20" /></div>
          ))}
        </div>
      </div>
      <div className="col-span-12 rounded-xl border border-border/70 bg-surface-1/60 p-4">
        <Skeleton className="h-3 w-40 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2.5">
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      </div>
      <div className="col-span-12 lg:col-span-7 rounded-xl border border-border/70 bg-surface-1/60 p-4 space-y-3">
        <Skeleton className="h-3 w-40" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
      </div>
      <div className="col-span-12 lg:col-span-5 rounded-xl border border-border/70 bg-surface-1/60 p-4 space-y-3">
        <Skeleton className="h-3 w-32" />
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-6 rounded" />)}
      </div>
      <div className="col-span-12 rounded-xl border border-border/70 bg-surface-1/60 p-4">
        <Skeleton className="h-3 w-32 mb-4" /><Skeleton className="h-[260px] rounded-lg" />
      </div>
    </div>
  );
}

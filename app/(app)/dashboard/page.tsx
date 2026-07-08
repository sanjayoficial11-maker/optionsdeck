import Link from "next/link"
import { Activity, Gauge, Scale, Target, Sparkles, ArrowRight, Layers } from "lucide-react"
import { INDEX_INSTRUMENTS } from "@/lib/market/instruments"
import { demoQuote, demoIntraday, type Quote } from "@/lib/market/demo"
import { isDhanConfigured } from "@/lib/market/dhan-config"
import { getMarketSession } from "@/lib/market/session"
import { StatCard } from "@/components/dashboard/stat-card"
import { MarketOverview } from "@/components/dashboard/market-overview"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCompact, formatNumber } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default function DashboardPage() {
  const configured = isDhanConfigured()
  const session = getMarketSession()

  const quotes: Quote[] = INDEX_INSTRUMENTS.map((i) => demoQuote(i.symbol)!).filter(Boolean)
  const intraday = Object.fromEntries(INDEX_INSTRUMENTS.map((i) => [i.symbol, demoIntraday(i.symbol)]))

  const nifty = quotes.find((q) => q.symbol === "NIFTY")
  const advancers = quotes.filter((q) => q.change >= 0).length
  const decliners = quotes.length - advancers
  // Illustrative sentiment metrics (real values arrive with the options engine).
  const pcr = 0.92 + (nifty ? (nifty.changePct / 100) * -2 : 0)
  const maxPain = nifty ? Math.round(nifty.ltp / 50) * 50 : 0

  return (
    <div className="flex flex-col gap-5">
      {!configured && (
        <div className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/20 text-primary">
              <Activity className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium">You&apos;re viewing demo market data</p>
              <p className="text-xs text-muted-foreground">
                Add <code className="rounded bg-muted px-1">DHAN_CLIENT_ID</code> and{" "}
                <code className="rounded bg-muted px-1">DHAN_API_KEY</code> in project settings to stream live NSE data.
              </p>
            </div>
          </div>
          <Badge variant="muted" className="w-fit">Demo mode</Badge>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Market Session"
          value={session === "open" ? "Open" : session === "pre-open" ? "Pre-open" : "Closed"}
          sub="NSE • IST"
          icon={Activity}
          tone={session === "open" ? "bull" : "default"}
        />
        <StatCard
          label="Nifty PCR"
          value={pcr.toFixed(2)}
          sub={pcr > 1 ? "Bullish tilt" : "Bearish tilt"}
          icon={Scale}
          tone={pcr > 1 ? "bull" : "bear"}
        />
        <StatCard label="Nifty Max Pain" value={formatNumber(maxPain)} sub="Nearest expiry" icon={Target} />
        <StatCard
          label="Breadth"
          value={`${advancers}/${decliners}`}
          sub="Advancers / Decliners"
          icon={Gauge}
          tone={advancers >= decliners ? "bull" : "bear"}
        />
      </section>

      <MarketOverview quotes={quotes} intraday={intraday} />

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Index snapshot</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/option-chain">
                Option chain <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Index</th>
                    <th className="pb-2 text-right font-medium">LTP</th>
                    <th className="pb-2 text-right font-medium">Chg%</th>
                    <th className="hidden pb-2 text-right font-medium sm:table-cell">High</th>
                    <th className="hidden pb-2 text-right font-medium sm:table-cell">Low</th>
                    <th className="pb-2 text-right font-medium">Volume</th>
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums">
                  {quotes.map((q) => (
                    <tr key={q.symbol} className="border-b border-border/50 last:border-0">
                      <td className="py-2 font-sans font-medium">{q.symbol}</td>
                      <td className="py-2 text-right">{formatNumber(q.ltp)}</td>
                      <td className={`py-2 text-right ${q.change >= 0 ? "text-bull" : "text-bear"}`}>
                        {q.changePct >= 0 ? "+" : ""}
                        {q.changePct.toFixed(2)}%
                      </td>
                      <td className="hidden py-2 text-right text-bull sm:table-cell">{formatNumber(q.dayHigh)}</td>
                      <td className="hidden py-2 text-right text-bear sm:table-cell">{formatNumber(q.dayLow)}</td>
                      <td className="py-2 text-right text-muted-foreground">{formatCompact(q.volume)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" /> AI Market Pulse
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col">
            <p className="text-sm text-muted-foreground">
              Get a Claude-generated read of today&apos;s market: trend, key levels, OI shifts, and what to watch — grounded
              only in live data, never guesses.
            </p>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {[
                { icon: Layers, label: "OI buildup interpretation" },
                { icon: Scale, label: "PCR & sentiment context" },
                { icon: Target, label: "Support / resistance from Max Pain" },
              ].map(({ icon: I, label }) => (
                <li key={label} className="flex items-center gap-2 text-muted-foreground">
                  <I className="size-4 text-primary" /> {label}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-4">
              <Button asChild className="w-full">
                <Link href="/ai/market-summary">
                  <Sparkles className="size-4" /> Generate market summary
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

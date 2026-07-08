"use client"

import * as React from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import { cn, formatNumber, formatPercent } from "@/lib/utils"
import type { Quote } from "@/lib/market/demo"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IndexChart } from "@/components/dashboard/index-chart"

type IntradayMap = Record<string, { t: string; price: number }[]>

export function MarketOverview({
  quotes,
  intraday,
}: {
  quotes: Quote[]
  intraday: IntradayMap
}) {
  const [selected, setSelected] = React.useState(quotes[0]?.symbol ?? "NIFTY")
  const active = quotes.find((q) => q.symbol === selected) ?? quotes[0]

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Ticker strip */}
      <div className="flex flex-col gap-2 lg:col-span-1">
        {quotes.map((q) => {
          const up = q.change >= 0
          const isActive = q.symbol === selected
          return (
            <button
              key={q.symbol}
              onClick={() => setSelected(q.symbol)}
              className={cn(
                "flex items-center justify-between rounded-lg border p-3 text-left transition-colors",
                isActive ? "border-primary/50 bg-primary/10" : "border-border bg-card hover:bg-accent",
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{q.symbol}</p>
                <p className="truncate text-xs text-muted-foreground">{q.name}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-semibold tabular-nums">{formatNumber(q.ltp)}</p>
                <p className={cn("font-mono text-xs tabular-nums", up ? "text-bull" : "text-bear")}>
                  {formatPercent(q.changePct)}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Chart */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {active?.symbol}
              <Badge variant={active && active.change >= 0 ? "bull" : "bear"}>
                {active && active.change >= 0 ? (
                  <TrendingUp className="mr-1 size-3" />
                ) : (
                  <TrendingDown className="mr-1 size-3" />
                )}
                {active && formatPercent(active.changePct)}
              </Badge>
            </CardTitle>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
              {active && formatNumber(active.ltp)}
              <span className={cn("ml-2 text-sm", active && active.change >= 0 ? "text-bull" : "text-bear")}>
                {active && `${active.change >= 0 ? "+" : ""}${formatNumber(active.change)}`}
              </span>
            </p>
          </div>
          <div className="hidden gap-4 text-right text-xs text-muted-foreground sm:flex">
            <div>
              <p>Open</p>
              <p className="font-mono text-foreground">{active && formatNumber(active.open)}</p>
            </div>
            <div>
              <p>High</p>
              <p className="font-mono text-bull">{active && formatNumber(active.dayHigh)}</p>
            </div>
            <div>
              <p>Low</p>
              <p className="font-mono text-bear">{active && formatNumber(active.dayLow)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <IndexChart data={intraday[selected] ?? []} positive={(active?.change ?? 0) >= 0} />
        </CardContent>
      </Card>
    </div>
  )
}

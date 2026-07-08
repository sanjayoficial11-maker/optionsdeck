"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type Status = {
  mode: "live" | "demo"
  session: "pre-open" | "open" | "closed"
}

const sessionLabel: Record<Status["session"], string> = {
  "pre-open": "Pre-open",
  open: "Market open",
  closed: "Market closed",
}

export function DataStatus() {
  const [status, setStatus] = React.useState<Status | null>(null)

  React.useEffect(() => {
    let active = true
    const load = () =>
      fetch("/api/market/status")
        .then((r) => r.json())
        .then((d) => active && setStatus({ mode: d.mode, session: d.session }))
        .catch(() => {})
    load()
    const id = setInterval(load, 30_000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  const isLive = status?.mode === "live"
  const isOpen = status?.session === "open"

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs">
      <span className="relative flex size-2">
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75",
            isOpen && "animate-ping",
            isLive ? "bg-bull" : "bg-muted-foreground",
          )}
        />
        <span className={cn("relative inline-flex size-2 rounded-full", isLive ? "bg-bull" : "bg-muted-foreground")} />
      </span>
      <span className="hidden font-medium sm:inline">{isLive ? "Live data" : "Demo data"}</span>
      <span className="text-muted-foreground">{status ? sessionLabel[status.session] : "…"}</span>
    </div>
  )
}

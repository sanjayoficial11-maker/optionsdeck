"use client"

import * as React from "react"
import { ChevronDown, Check, Crown } from "lucide-react"
import { PLAN_ORDER, PLANS, type PlanId } from "@/lib/plans"
import { useSubscription } from "@/components/providers/subscription-provider"
import { cn } from "@/lib/utils"

/**
 * Demo plan switcher. Lets you preview gated features before billing exists.
 * Remove once subscriptions are driven by the server.
 */
export function PlanSwitcher() {
  const { plan, setPlan } = useSubscription()
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
      >
        <Crown className="size-3.5 text-primary" />
        <span className="hidden sm:inline">{PLANS[plan].name} plan</span>
        <span className="sm:hidden">{PLANS[plan].name}</span>
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-56 rounded-md border border-border bg-popover p-1 shadow-lg">
          <p className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            Preview plan (demo)
          </p>
          {PLAN_ORDER.map((id: PlanId) => (
            <button
              key={id}
              onClick={() => {
                setPlan(id)
                setOpen(false)
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
                plan === id && "text-primary",
              )}
            >
              <span className="flex flex-col items-start">
                <span className="font-medium">{PLANS[id].name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {PLANS[id].price === 0 ? "Free" : `₹${PLANS[id].price}/mo`}
                </span>
              </span>
              {plan === id && <Check className="size-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import * as React from "react"
import { type PlanId, hasPlanAccess } from "@/lib/plans"

type SubscriptionContextValue = {
  plan: PlanId
  setPlan: (plan: PlanId) => void
  canAccess: (required: PlanId) => boolean
}

const SubscriptionContext = React.createContext<SubscriptionContextValue | null>(null)

const STORAGE_KEY = "optionsdeck.demo-plan"

/**
 * Holds the current user's effective plan for UI gating.
 *
 * Until auth + billing are wired in, the plan is a client-side "demo" value so
 * you can preview premium features. Once a real subscription source exists,
 * initialize `plan` from the server and remove `setPlan`.
 */
export function SubscriptionProvider({
  children,
  initialPlan = "free",
}: {
  children: React.ReactNode
  initialPlan?: PlanId
}) {
  const [plan, setPlanState] = React.useState<PlanId>(initialPlan)

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as PlanId | null
    if (stored === "free" || stored === "pro" || stored === "enterprise") {
      setPlanState(stored)
    }
  }, [])

  const setPlan = React.useCallback((next: PlanId) => {
    setPlanState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const value = React.useMemo<SubscriptionContextValue>(
    () => ({ plan, setPlan, canAccess: (required) => hasPlanAccess(plan, required) }),
    [plan, setPlan],
  )

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = React.useContext(SubscriptionContext)
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider")
  return ctx
}

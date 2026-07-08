export type PlanId = "free" | "pro" | "enterprise"

export type Plan = {
  id: PlanId
  name: string
  price: number // monthly, INR
  tagline: string
  features: string[]
  highlighted?: boolean
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    tagline: "For getting started with options analytics",
    features: [
      "Live option chain (15-min delayed)",
      "Open Interest & PCR",
      "Max Pain",
      "Strategy builder",
      "Trade journal (up to 25 trades)",
      "AI market summary (3/day)",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 1499,
    tagline: "For active retail options traders",
    highlighted: true,
    features: [
      "Everything in Free",
      "Real-time option chain",
      "OI change & buildup",
      "Volume analysis",
      "IV, IV Rank & Percentile",
      "Full Greeks suite",
      "Strategy analyzer",
      "Historical data",
      "Price & OI alerts",
      "AI trade review (unlimited)",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 4999,
    tagline: "For desks, funds & serious traders",
    features: [
      "Everything in Pro",
      "Backtesting engine",
      "AI trade coach (1:1 mentorship)",
      "Multi-account portfolios",
      "Priority data feeds",
      "API access",
      "Dedicated support",
    ],
  },
}

export const PLAN_ORDER: PlanId[] = ["free", "pro", "enterprise"]

export function planRank(plan: PlanId): number {
  return PLAN_ORDER.indexOf(plan)
}

/** Returns true if `userPlan` is sufficient to access something requiring `requiredPlan`. */
export function hasPlanAccess(userPlan: PlanId, requiredPlan: PlanId): boolean {
  return planRank(userPlan) >= planRank(requiredPlan)
}

export function planLabel(plan: PlanId): string {
  return PLANS[plan].name
}

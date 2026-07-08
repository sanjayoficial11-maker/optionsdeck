import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  ListOrdered,
  Layers,
  Activity,
  BarChart3,
  Gauge,
  Scale,
  Target,
  Wrench,
  Microscope,
  NotebookPen,
  Briefcase,
  Star,
  Sparkles,
  MessageSquareText,
  GraduationCap,
  BellRing,
  History,
  FlaskConical,
} from "lucide-react"
import type { PlanId } from "@/lib/plans"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  plan: PlanId
  description: string
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, plan: "free", description: "Market pulse & key metrics" },
      { title: "Watchlist", href: "/watchlist", icon: Star, plan: "free", description: "Track your instruments" },
    ],
  },
  {
    label: "Options Analytics",
    items: [
      { title: "Option Chain", href: "/option-chain", icon: ListOrdered, plan: "free", description: "Live option chain" },
      { title: "Open Interest", href: "/open-interest", icon: Layers, plan: "free", description: "OI distribution" },
      { title: "OI Change", href: "/oi-change", icon: Activity, plan: "pro", description: "Intraday OI buildup" },
      { title: "Volume Analysis", href: "/volume", icon: BarChart3, plan: "pro", description: "Volume by strike" },
      { title: "IV Analysis", href: "/iv-analysis", icon: Gauge, plan: "pro", description: "IV, IV Rank & Percentile" },
      { title: "Greeks", href: "/greeks", icon: Scale, plan: "pro", description: "Delta, Gamma, Theta, Vega" },
      { title: "PCR & Max Pain", href: "/pcr-maxpain", icon: Target, plan: "free", description: "Sentiment gauges" },
    ],
  },
  {
    label: "Strategy",
    items: [
      { title: "Strategy Builder", href: "/strategy-builder", icon: Wrench, plan: "free", description: "Construct multi-leg trades" },
      { title: "Strategy Analyzer", href: "/strategy-analyzer", icon: Microscope, plan: "pro", description: "Payoff, Greeks & risk" },
      { title: "Backtesting", href: "/backtesting", icon: FlaskConical, plan: "enterprise", description: "Test strategies historically" },
      { title: "Historical Data", href: "/historical", icon: History, plan: "pro", description: "Past chains & prices" },
    ],
  },
  {
    label: "Trading Desk",
    items: [
      { title: "Trade Journal", href: "/journal", icon: NotebookPen, plan: "free", description: "Log & review trades" },
      { title: "Portfolio", href: "/portfolio", icon: Briefcase, plan: "free", description: "Positions & P&L" },
      { title: "Alerts", href: "/alerts", icon: BellRing, plan: "pro", description: "Price & OI alerts" },
    ],
  },
  {
    label: "AI Mentor",
    items: [
      { title: "Market Summary", href: "/ai/market-summary", icon: Sparkles, plan: "free", description: "AI market read" },
      { title: "Trade Review", href: "/ai/trade-review", icon: MessageSquareText, plan: "pro", description: "AI critique of a trade" },
      { title: "Trade Coach", href: "/ai/trade-coach", icon: GraduationCap, plan: "enterprise", description: "1:1 AI mentorship" },
    ],
  },
]

export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items)

export function findNavItem(href: string): NavItem | undefined {
  return allNavItems.find((i) => i.href === href)
}

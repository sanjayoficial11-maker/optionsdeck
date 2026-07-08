"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CandlestickChart, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { navGroups } from "@/lib/nav"
import { useSubscription } from "@/components/providers/subscription-provider"
import { Badge } from "@/components/ui/badge"

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { canAccess } = useSubscription()

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <CandlestickChart className="size-5" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight">OptionsDeck</span>
          <span className="text-[10px] text-muted-foreground">AI Options Analytics</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href
                const locked = !canAccess(item.plan)
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-sidebar-foreground/80 hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                      <span className="flex-1 truncate">{item.title}</span>
                      {locked && item.plan === "pro" && (
                        <Badge variant="muted" className="gap-1 px-1.5 py-0 text-[9px]">
                          <Lock className="size-2.5" /> Pro
                        </Badge>
                      )}
                      {locked && item.plan === "enterprise" && (
                        <Badge variant="muted" className="gap-1 px-1.5 py-0 text-[9px]">
                          <Lock className="size-2.5" /> Ent
                        </Badge>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
}

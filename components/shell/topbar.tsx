"use client"

import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { findNavItem } from "@/lib/nav"
import { Button } from "@/components/ui/button"
import { DataStatus } from "@/components/shell/data-status"
import { PlanSwitcher } from "@/components/shell/plan-switcher"

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname()
  const item = findNavItem(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu />
      </Button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold tracking-tight">{item?.title ?? "OptionsDeck"}</h1>
        {item?.description && (
          <p className="truncate text-xs text-muted-foreground">{item.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <DataStatus />
        <PlanSwitcher />
      </div>
    </header>
  )
}

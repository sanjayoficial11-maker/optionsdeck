"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Sidebar } from "@/components/shell/sidebar"
import { Topbar } from "@/components/shell/topbar"
import { cn } from "@/lib/utils"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", mobileOpen ? "pointer-events-auto" : "pointer-events-none")}>
        <div
          className={cn(
            "absolute inset-0 bg-background/70 backdrop-blur-sm transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-72 border-r border-sidebar-border transition-transform",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute right-3 top-3 z-10 rounded-md p-1 text-muted-foreground hover:bg-accent"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

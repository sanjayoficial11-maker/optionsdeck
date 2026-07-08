import { Link, useRouter, useLocation } from "@tanstack/react-router";
import { LineChart, Sigma, BookMarked, Layers, LogOut, Activity, Menu, X, ScrollText } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";


const NAV = [
  { to: "/builder",    label: "Strategy Builder", icon: Layers },
  { to: "/chain",      label: "Option Chain",     icon: LineChart },
  { to: "/analytics",  label: "OI / IV Analytics",icon: Activity },
  { to: "/trade-review", label: "Trade Review",    icon: ScrollText },
  { to: "/strategies", label: "Saved Strategies", icon: BookMarked },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const loc = useLocation();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [loc.pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <>
      <div className="h-14 px-4 flex items-center gap-2 border-b border-border shrink-0">
        <div className="w-7 h-7 rounded-md bg-primary/15 grid place-items-center">
          <Sigma className="w-4 h-4 text-primary" />
        </div>
        <div className="font-semibold tracking-tight">OptionsDeck<span className="text-primary">.</span></div>
        <button
          onClick={() => setOpen(false)}
          className="ml-auto md:hidden p-1.5 rounded hover:bg-surface-2 text-muted-foreground"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        <SectionLabel>Trading</SectionLabel>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = loc.pathname.startsWith(n.to);
          return (
            <Link
              key={n.to} to={n.to}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{n.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border shrink-0">
        <div className="text-xs text-muted-foreground truncate mb-2">
          {user?.email ?? "Signed in"}
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 justify-center text-xs text-muted-foreground hover:text-foreground py-2 rounded-md hover:bg-surface-2 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 border-r border-border bg-surface-1 flex-col">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 max-w-[80vw] bg-surface-1 border-r border-border flex flex-col shadow-xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar onMenu={() => setOpen(true)} />
        <main className="flex-1 min-w-0 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="px-3 pt-3 pb-1 text-[10px] font-medium tracking-widest uppercase text-muted-foreground/70">{children}</div>;
}

import { useSpot } from "@/hooks/useMarket";
function TopBar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="h-14 border-b border-border bg-surface-1 px-3 sm:px-4 flex items-center gap-3 sm:gap-6">
      <button
        onClick={onMenu}
        className="md:hidden p-1.5 -ml-1 rounded hover:bg-surface-2 text-muted-foreground"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="hidden lg:block text-xs uppercase tracking-widest text-muted-foreground shrink-0">Live Indices</div>
      <div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar">
        <MiniTick sym="NIFTY" />
        <MiniTick sym="BANKNIFTY" />
        <MiniTick sym="FINNIFTY" />
        <MiniTick sym="MIDCPNIFTY" />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse" />
          <span className="text-muted-foreground hidden md:inline">Simulated feed · WS-ready</span>
          <span className="text-muted-foreground md:hidden">Live</span>
        </div>
        <ThemeToggle />
      </div>

    </header>
  );
}
function MiniTick({ sym }: { sym: "NIFTY"|"BANKNIFTY"|"FINNIFTY"|"MIDCPNIFTY" }) {
  const p = useSpot(sym);
  return (
    <div className="flex items-baseline gap-1.5 shrink-0">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{sym}</span>
      <span className="mono text-sm">{p.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
    </div>
  );
}

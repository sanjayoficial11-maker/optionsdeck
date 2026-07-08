import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LineChart, Sigma, Activity, Layers } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";


export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-surface-1/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary/15 grid place-items-center">
              <Sigma className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold tracking-tight">OptionsDeck<span className="text-primary">.</span></span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">Sign in →</Link>
          </div>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-24">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-[0.2em] text-primary mb-4">Indian Options · Strategy Builder</div>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            Build, price and de-risk<br />
            <span className="text-primary">multi-leg</span> option strategies.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
            Live option chains for NIFTY, BANKNIFTY, FINNIFTY, MIDCPNIFTY and stocks. Real-time payoff, Black-Scholes Greeks,
            OI/IV analytics and 12 pre-built templates — from Iron Condors to Broken-Wing Butterflies.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90">
              Launch builder <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground">See features</a>
          </div>
        </div>

        <div id="features" className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { i: LineChart, t: "Live Option Chain", d: "CE/PE, OI, IV, bid/ask across weekly and monthly expiries." },
            { i: Layers, t: "Unlimited Legs", d: "Compose any combination of long/short calls and puts." },
            { i: Sigma, t: "Greeks by Leg", d: "Delta, Gamma, Theta, Vega, Rho via Black-Scholes." },
            { i: Activity, t: "OI & IV Analytics", d: "PCR, max-pain, support/resistance from open interest." },
          ].map((f) => (
            <div key={f.t} className="rounded-lg border border-border bg-surface-1 p-5">
              <f.i className="w-5 h-5 text-primary" />
              <div className="mt-3 font-medium">{f.t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{f.d}</div>
            </div>
          ))}
        </div>
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Simulated market feed for education. Not investment advice.
      </footer>
    </div>
  );
}

"use client"

import { Check, Crown } from "lucide-react"
import { PLAN_ORDER, PLANS } from "@/lib/plans"
import { useSubscription } from "@/components/providers/subscription-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function PricingPage() {
  const { plan, setPlan } = useSubscription()

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Plans built for every options trader</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground text-pretty">
          Start free, upgrade when you need real-time data and the AI mentor. Billing isn&apos;t live yet — use the buttons
          below to preview each plan&apos;s features.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id]
          const current = plan === id
          return (
            <Card
              key={id}
              className={cn("relative flex flex-col", p.highlighted && "border-primary/60 ring-1 ring-primary/40")}
            >
              {p.highlighted && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">Most popular</Badge>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {p.name}
                  {id === "enterprise" && <Crown className="size-4 text-primary" />}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{p.tagline}</p>
                <p className="mt-2">
                  <span className="font-mono text-3xl font-semibold">₹{p.price.toLocaleString("en-IN")}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="flex flex-1 flex-col gap-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={current ? "outline" : p.highlighted ? "default" : "secondary"}
                  disabled={current}
                  onClick={() => setPlan(id)}
                >
                  {current ? "Current plan" : `Preview ${p.name}`}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Billing integration (Stripe / Razorpay) plugs into the existing modular payment layer without code changes.
      </p>
    </div>
  )
}

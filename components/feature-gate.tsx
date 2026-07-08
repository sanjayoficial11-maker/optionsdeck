"use client"

import Link from "next/link"
import { Lock, Sparkles } from "lucide-react"
import { type PlanId, PLANS } from "@/lib/plans"
import { useSubscription } from "@/components/providers/subscription-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

/**
 * Wrap premium module content. If the current plan lacks access, an upgrade
 * prompt is shown instead of the children.
 */
export function FeatureGate({
  required,
  title,
  children,
}: {
  required: PlanId
  title: string
  children: React.ReactNode
}) {
  const { canAccess } = useSubscription()
  if (canAccess(required)) return <>{children}</>

  const plan = PLANS[required]
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Lock className="size-6" />
        </div>
        <h2 className="text-lg font-semibold">{title} is a {plan.name} feature</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Upgrade to the {plan.name} plan (₹{plan.price}/mo) to unlock {title.toLowerCase()} and the rest of the{" "}
          {plan.name} toolkit.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild>
            <Link href="/pricing">
              <Sparkles className="size-4" /> View plans
            </Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Tip: use the plan switcher in the top bar to preview premium features.
        </p>
      </Card>
    </div>
  )
}

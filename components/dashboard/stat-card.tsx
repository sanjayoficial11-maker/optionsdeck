import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "default",
}: {
  label: string
  value: string
  sub?: string
  icon?: LucideIcon
  tone?: "default" | "bull" | "bear"
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </div>
      <p
        className={cn(
          "mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight",
          tone === "bull" && "text-bull",
          tone === "bear" && "text-bear",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </Card>
  )
}

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

/** Glassmorphism card — translucent surface with backdrop blur + hairline border. */
export function GlassCard({
  children, className, glow,
}: { children: ReactNode; className?: string; glow?: "primary" | "info" | "bull" | "bear" | "warn" | "none" }) {
  const glows: Record<string, string> = {
    primary: "before:bg-primary/10",
    info: "before:bg-info/10",
    bull: "before:bg-bull/10",
    bear: "before:bg-bear/10",
    warn: "before:bg-warn/10",
    none: "before:hidden",
  };
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border/70 bg-surface-1/60 backdrop-blur-xl",
        "shadow-[0_1px_0_0_color-mix(in_oklch,var(--foreground)_5%,transparent)_inset]",
        "before:absolute before:-top-16 before:-right-10 before:h-40 before:w-40 before:rounded-full before:blur-3xl before:content-['']",
        glows[glow ?? "none"],
        className,
      )}
    >
      <div className="relative">{children}</div>
    </div>
  );
}

export function SectionTitle({
  children, hint, right, icon: Icon,
}: { children: ReactNode; hint?: string; right?: ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-3.5 pb-3">
      {Icon && <Icon className="w-4 h-4 text-primary shrink-0" />}
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{children}</div>
      {hint && <InfoTip text={hint} />}
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}

export function InfoTip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="text-muted-foreground/60 hover:text-primary transition-colors" aria-label="More info">
          <Info className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-popover text-popover-foreground border border-border font-normal leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

/** Compact stat used across the report. */
export function Metric({
  label, value, tone, sub, className,
}: { label: string; value: ReactNode; tone?: "up" | "down" | "n"; sub?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border/60 bg-surface-2/50 px-3 py-2.5", className)}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("mono text-lg mt-1 leading-none tabular-nums",
        tone === "up" && "text-bull", tone === "down" && "text-bear")}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export function toneOf(n: number): "up" | "down" | "n" {
  if (n > 0) return "up";
  if (n < 0) return "down";
  return "n";
}

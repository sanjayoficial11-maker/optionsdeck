import { SubscriptionProvider } from "@/components/providers/subscription-provider"
import { AppShell } from "@/components/shell/app-shell"

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionProvider>
      <AppShell>{children}</AppShell>
    </SubscriptionProvider>
  )
}

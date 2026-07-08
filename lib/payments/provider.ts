import type { PlanId } from "@/lib/plans"

/**
 * Modular billing layer.
 *
 * The rest of the app depends ONLY on this interface, never on a concrete
 * provider. To add Stripe or Razorpay later, implement `PaymentProvider`
 * and register it in `getPaymentProvider()` — no other code needs to change.
 */
export type CheckoutSession = {
  url: string
  sessionId: string
}

export type SubscriptionStatus = {
  plan: PlanId
  status: "active" | "trialing" | "canceled" | "none"
  currentPeriodEnd?: string | null
  provider: string
}

export interface PaymentProvider {
  readonly id: string
  /** Create a checkout/subscription session for a plan. */
  createCheckoutSession(input: {
    userId: string
    plan: PlanId
    successUrl: string
    cancelUrl: string
  }): Promise<CheckoutSession>
  /** Fetch the current subscription status for a user. */
  getSubscription(userId: string): Promise<SubscriptionStatus>
  /** Cancel an active subscription. */
  cancelSubscription(userId: string): Promise<void>
  /** Verify & parse an incoming provider webhook. */
  handleWebhook(payload: string, signature: string | null): Promise<void>
}

/**
 * Default no-op provider. Billing is intentionally NOT implemented yet.
 * It reports the "free" plan and throws on checkout so premium flows can
 * gracefully show an "upgrade" prompt until a real provider is wired in.
 */
class NoopPaymentProvider implements PaymentProvider {
  readonly id = "none"

  async createCheckoutSession(): Promise<CheckoutSession> {
    throw new Error(
      "Billing is not configured yet. Register a provider (Stripe/Razorpay) in getPaymentProvider().",
    )
  }

  async getSubscription(): Promise<SubscriptionStatus> {
    return { plan: "free", status: "none", provider: this.id }
  }

  async cancelSubscription(): Promise<void> {
    /* no-op */
  }

  async handleWebhook(): Promise<void> {
    /* no-op */
  }
}

let cached: PaymentProvider | null = null

/**
 * Returns the active payment provider. Swap the implementation here when a
 * billing provider is connected. Selection can key off an env var, e.g.
 * `PAYMENTS_PROVIDER=stripe`.
 */
export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached

  const which = process.env.PAYMENTS_PROVIDER?.toLowerCase() ?? "none"
  switch (which) {
    // case "stripe":
    //   cached = new StripePaymentProvider()
    //   break
    // case "razorpay":
    //   cached = new RazorpayPaymentProvider()
    //   break
    default:
      cached = new NoopPaymentProvider()
  }
  return cached
}

export const isBillingEnabled = (): boolean =>
  (process.env.PAYMENTS_PROVIDER?.toLowerCase() ?? "none") !== "none"

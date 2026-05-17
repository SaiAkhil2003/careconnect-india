import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getStripeClient,
  STRIPE_BILLING_SETUP_ERROR,
} from "@/lib/payments/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isE2eMockMode,
  updateE2eProviderTier,
} from "@/lib/testing/e2e-mocks";
import type { ListingTier, Provider } from "@/lib/types";

export const dynamic = "force-dynamic";

type PaidListingTier = Extract<ListingTier, "standard" | "premium">;

const PAID_LISTING_TIERS: PaidListingTier[] = ["standard", "premium"];
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);
const DOWNGRADE_SUBSCRIPTION_STATUSES = new Set([
  "canceled",
  "unpaid",
  "incomplete_expired",
]);

function jsonResponse<T>(
  body: { success: true; data: T } | { success: false; error: string },
  status = 200,
) {
  return NextResponse.json(body, { status });
}

function isPaidListingTier(value: unknown): value is PaidListingTier {
  return (
    typeof value === "string" &&
    PAID_LISTING_TIERS.includes(value as PaidListingTier)
  );
}

function getStripeId(value: string | { id: string } | null) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

function getTierForPriceId(priceId: string | undefined) {
  if (!priceId) {
    return null;
  }

  if (priceId === process.env.STRIPE_STANDARD_PRICE_ID) {
    return "standard" as const;
  }

  if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
    return "premium" as const;
  }

  return null;
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
) {
  const providerId = session.metadata?.provider_id;
  const targetTier = session.metadata?.plan ?? session.metadata?.target_tier;

  if (!providerId || !isPaidListingTier(targetTier)) {
    console.error("Stripe checkout session missing provider billing metadata");
    return;
  }

  if (isE2eMockMode()) {
    updateE2eProviderTier(targetTier);
    return;
  }

  const stripeCustomerId = getStripeId(session.customer);
  const stripeSubscriptionId = getStripeId(session.subscription);
  const updates: Partial<Provider> = {
    listing_tier: targetTier,
  };

  if (stripeCustomerId) {
    updates.stripe_customer_id = stripeCustomerId;
  }

  if (stripeSubscriptionId) {
    updates.stripe_subscription_id = stripeSubscriptionId;
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("providers")
    .update(updates)
    .eq("id", providerId);

  if (error) {
    console.error("Stripe checkout provider update failed", error.message);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id;
  const updates: Partial<Provider> = {};

  if (ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
    const tier = getTierForPriceId(priceId) ?? subscription.metadata.plan;

    if (!tier) {
      console.error("Stripe subscription price did not match a listing plan");
      return;
    }

    if (!isPaidListingTier(tier)) {
      console.error("Stripe subscription metadata did not match a listing plan");
      return;
    }

    updates.listing_tier = tier;
  } else if (DOWNGRADE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
    updates.listing_tier = "free";
  } else {
    return;
  }

  if (isE2eMockMode()) {
    updateE2eProviderTier(updates.listing_tier ?? "free");
    return;
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("providers")
    .update(updates)
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Stripe subscription provider update failed", error.message);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  if (isE2eMockMode()) {
    updateE2eProviderTier("free");
    return;
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("providers")
    .update({
      listing_tier: "free",
      stripe_subscription_id: null,
    })
    .eq("stripe_subscription_id", subscription.id);

  if (error) {
    console.error("Stripe subscription deletion update failed", error.message);
  }
}

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!stripe || !webhookSecret || !signature) {
    return jsonResponse(
      { success: false, error: STRIPE_BILLING_SETUP_ERROR },
      503,
    );
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    console.error("Stripe webhook signature verification failed");
    return jsonResponse(
      { success: false, error: "Invalid Stripe webhook signature." },
      400,
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }

    return jsonResponse<{ received: true }>({
      success: true,
      data: { received: true },
    });
  } catch (error) {
    console.error(
      "POST /api/webhooks/stripe failed",
      error instanceof Error ? error.message : "Unknown error",
    );

    return jsonResponse(
      { success: false, error: "Unable to process Stripe webhook." },
      500,
    );
  }
}

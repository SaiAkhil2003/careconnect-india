import { NextRequest, NextResponse } from "next/server";
import {
  RAZORPAY_BILLING_SETUP_ERROR,
  verifyRazorpayWebhookSignature,
} from "@/lib/payments/razorpay";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ListingTier, Provider } from "@/lib/types";

export const dynamic = "force-dynamic";

type PaidListingTier = Extract<ListingTier, "standard" | "premium">;

type RazorpaySubscriptionEntity = {
  id?: unknown;
  plan_id?: unknown;
  customer_id?: unknown;
  status?: unknown;
  notes?: unknown;
};

type RazorpayWebhookEvent = {
  event?: unknown;
  payload?: {
    subscription?: {
      entity?: RazorpaySubscriptionEntity;
    };
    payment?: {
      entity?: {
        id?: unknown;
      };
    };
  };
};

const PAID_LISTING_TIERS: PaidListingTier[] = ["standard", "premium"];
const ACTIVATE_EVENTS = new Set([
  "subscription.activated",
  "subscription.charged",
  "subscription.resumed",
]);
const DOWNGRADE_EVENTS = new Set([
  "subscription.cancelled",
  "subscription.completed",
  "subscription.halted",
  "subscription.paused",
]);
const ACTIVE_STATUSES = new Set(["active", "authenticated"]);
const DOWNGRADE_STATUSES = new Set([
  "cancelled",
  "completed",
  "halted",
  "paused",
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

function getNotes(subscription: RazorpaySubscriptionEntity) {
  if (
    subscription.notes &&
    typeof subscription.notes === "object" &&
    !Array.isArray(subscription.notes)
  ) {
    return subscription.notes as Record<string, unknown>;
  }

  return {};
}

function getPlanForRazorpayPlanId(planId: unknown) {
  if (typeof planId !== "string") {
    return null;
  }

  if (planId === process.env.RAZORPAY_STANDARD_PLAN_ID) {
    return "standard" as const;
  }

  if (planId === process.env.RAZORPAY_PREMIUM_PLAN_ID) {
    return "premium" as const;
  }

  return null;
}

function getTargetTier(subscription: RazorpaySubscriptionEntity) {
  const notes = getNotes(subscription);
  const tier = notes.plan;

  if (isPaidListingTier(tier)) {
    return tier;
  }

  return getPlanForRazorpayPlanId(subscription.plan_id);
}

function getProviderId(subscription: RazorpaySubscriptionEntity) {
  const notes = getNotes(subscription);

  return typeof notes.provider_id === "string" ? notes.provider_id : null;
}

async function updateProviderTier({
  providerId,
  tier,
}: {
  providerId: string;
  tier: ListingTier;
}) {
  const updates: Partial<Provider> = {
    listing_tier: tier,
  };
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("providers")
    .update(updates)
    .eq("id", providerId);

  if (error) {
    console.error("Razorpay provider billing update failed", error.message);
  }
}

async function handleActivation(subscription: RazorpaySubscriptionEntity) {
  const providerId = getProviderId(subscription);
  const tier = getTargetTier(subscription);

  if (!providerId || !tier) {
    console.error("Razorpay subscription missing provider billing metadata");
    return;
  }

  await updateProviderTier({ providerId, tier });
}

async function handleDowngrade(subscription: RazorpaySubscriptionEntity) {
  const providerId = getProviderId(subscription);

  if (!providerId) {
    console.error("Razorpay subscription missing provider billing metadata");
    return;
  }

  await updateProviderTier({ providerId, tier: "free" });
}

async function handleSubscriptionUpdated(
  subscription: RazorpaySubscriptionEntity,
) {
  const status = subscription.status;

  if (typeof status !== "string") {
    return;
  }

  if (ACTIVE_STATUSES.has(status)) {
    await handleActivation(subscription);
    return;
  }

  if (DOWNGRADE_STATUSES.has(status)) {
    await handleDowngrade(subscription);
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  const signature = request.headers.get("x-razorpay-signature");

  if (!webhookSecret || !signature) {
    return jsonResponse(
      { success: false, error: RAZORPAY_BILLING_SETUP_ERROR },
      503,
    );
  }

  const rawBody = await request.text();

  if (
    !verifyRazorpayWebhookSignature({
      rawBody,
      signature,
      webhookSecret,
    })
  ) {
    console.error("Razorpay webhook signature verification failed");
    return jsonResponse(
      { success: false, error: "Invalid Razorpay webhook signature." },
      400,
    );
  }

  let event: RazorpayWebhookEvent;

  try {
    event = JSON.parse(rawBody) as RazorpayWebhookEvent;
  } catch {
    return jsonResponse(
      { success: false, error: "Invalid Razorpay webhook payload." },
      400,
    );
  }

  try {
    const eventName = typeof event.event === "string" ? event.event : "";
    const subscription = event.payload?.subscription?.entity;

    if (!subscription) {
      return jsonResponse<{ received: true }>({
        success: true,
        data: { received: true },
      });
    }

    if (ACTIVATE_EVENTS.has(eventName)) {
      await handleActivation(subscription);
    } else if (DOWNGRADE_EVENTS.has(eventName)) {
      await handleDowngrade(subscription);
    } else if (eventName === "subscription.updated") {
      await handleSubscriptionUpdated(subscription);
    }

    return jsonResponse<{ received: true }>({
      success: true,
      data: { received: true },
    });
  } catch (error) {
    console.error(
      "POST /api/webhooks/razorpay failed",
      error instanceof Error ? error.message : "Unknown error",
    );

    return jsonResponse(
      { success: false, error: "Unable to process Razorpay webhook." },
      500,
    );
  }
}

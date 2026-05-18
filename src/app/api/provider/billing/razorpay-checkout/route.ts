import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { LISTING_PLANS } from "@/lib/payments/plans";
import {
  createRazorpaySubscription,
  getRazorpayKeyId,
  RAZORPAY_BILLING_SETUP_ERROR,
} from "@/lib/payments/razorpay";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ListingTier } from "@/lib/types";

export const dynamic = "force-dynamic";

type CheckoutTier = Extract<ListingTier, "standard" | "premium">;
type CheckoutResponseData = {
  key_id: string;
  subscription_id: string;
  plan: CheckoutTier;
  provider_name: string;
};

const CHECKOUT_TIERS: CheckoutTier[] = ["standard", "premium"];

function jsonResponse<T>(
  body: { success: true; data: T } | { success: false; error: string },
  status = 200,
) {
  return NextResponse.json(body, { status });
}

function isCheckoutTier(value: unknown): value is CheckoutTier {
  return (
    typeof value === "string" &&
    CHECKOUT_TIERS.includes(value as CheckoutTier)
  );
}

function getRazorpayPlanId(tier: CheckoutTier) {
  const razorpayPlanEnvKey = LISTING_PLANS[tier].razorpayPlanEnvKey;

  if (!razorpayPlanEnvKey) {
    return null;
  }

  return process.env[razorpayPlanEnvKey]?.trim() || null;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return jsonResponse({ success: false, error: "Unauthenticated." }, 401);
    }

    let payload: { tier?: unknown };

    try {
      payload = (await request.json()) as { tier?: unknown };
    } catch {
      return jsonResponse(
        { success: false, error: "Request body must be valid JSON." },
        400,
      );
    }

    if (!isCheckoutTier(payload.tier)) {
      return jsonResponse(
        { success: false, error: "Select Standard or Premium to upgrade." },
        400,
      );
    }

    const tier = payload.tier;
    const keyId = getRazorpayKeyId();
    const planId = getRazorpayPlanId(tier);

    if (!keyId || !planId) {
      return jsonResponse(
        { success: false, error: RAZORPAY_BILLING_SETUP_ERROR },
        500,
      );
    }

    const supabase = createSupabaseServerClient();
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id, clerk_user_id, provider_name")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (providerError) {
      return jsonResponse(
        { success: false, error: "Unable to fetch provider profile." },
        500,
      );
    }

    if (!provider) {
      return jsonResponse(
        {
          success: false,
          error: "Please register your provider profile first.",
        },
        404,
      );
    }

    const subscription = await createRazorpaySubscription({
      planId,
      notes: {
        provider_id: provider.id,
        clerk_user_id: provider.clerk_user_id ?? userId,
        plan: tier,
      },
    });

    return jsonResponse<CheckoutResponseData>({
      success: true,
      data: {
        key_id: keyId,
        subscription_id: subscription.id,
        plan: tier,
        provider_name: provider.provider_name,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/provider/billing/razorpay-checkout failed",
      error instanceof Error ? error.message : "Unknown error",
    );

    if (
      error instanceof Error &&
      error.message === RAZORPAY_BILLING_SETUP_ERROR
    ) {
      return jsonResponse(
        { success: false, error: RAZORPAY_BILLING_SETUP_ERROR },
        500,
      );
    }

    return jsonResponse(
      { success: false, error: "Unable to start Razorpay checkout." },
      500,
    );
  }
}

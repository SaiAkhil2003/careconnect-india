import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { LISTING_PLANS } from "@/lib/payments/plans";
import {
  getStripeClient,
  STRIPE_BILLING_SETUP_ERROR,
} from "@/lib/payments/stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getE2eAuthenticatedProvider,
  getE2eCheckoutUrl,
  isE2eMockMode,
} from "@/lib/testing/e2e-mocks";
import type { ListingTier } from "@/lib/types";

export const dynamic = "force-dynamic";

type CheckoutTier = Extract<ListingTier, "standard" | "premium">;

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

function getConfiguredAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (!appUrl) {
    return null;
  }

  return appUrl.replace(/\/+$/, "");
}

function getPriceId(tier: CheckoutTier) {
  const stripePriceEnvKey = LISTING_PLANS[tier].stripePriceEnvKey;

  if (!stripePriceEnvKey) {
    return null;
  }

  return process.env[stripePriceEnvKey]?.trim() || null;
}

export async function POST(request: NextRequest) {
  if (isE2eMockMode()) {
    const { authenticated, provider } = getE2eAuthenticatedProvider(request);

    if (!authenticated) {
      return jsonResponse({ success: false, error: "Unauthenticated." }, 401);
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

    const payload = (await request.json()) as { tier?: unknown };

    if (!isCheckoutTier(payload.tier)) {
      return jsonResponse(
        { success: false, error: "Select Standard or Premium to upgrade." },
        400,
      );
    }

    return jsonResponse<{ checkout_url: string }>({
      success: true,
      data: { checkout_url: getE2eCheckoutUrl(payload.tier) },
    });
  }

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
    const stripe = getStripeClient();
    const priceId = getPriceId(tier);
    const appUrl = getConfiguredAppUrl();

    if (!stripe || !priceId || !appUrl) {
      return jsonResponse(
        { success: false, error: STRIPE_BILLING_SETUP_ERROR },
        503,
      );
    }

    const supabase = createSupabaseServerClient();
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id, clerk_user_id, provider_name, email, lead_email")
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

    const metadata = {
      provider_id: provider.id,
      clerk_user_id: provider.clerk_user_id ?? userId,
      target_tier: tier,
    };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: provider.email ?? provider.lead_email ?? undefined,
      client_reference_id: provider.id,
      success_url: `${appUrl}/dashboard/billing?success=true`,
      cancel_url: `${appUrl}/dashboard/billing?canceled=true`,
      metadata,
      subscription_data: {
        metadata,
      },
    });

    if (!session.url) {
      return jsonResponse(
        { success: false, error: "Unable to start checkout." },
        500,
      );
    }

    return jsonResponse<{ checkout_url: string }>({
      success: true,
      data: { checkout_url: session.url },
    });
  } catch (error) {
    console.error(
      "POST /api/provider/billing/checkout failed",
      error instanceof Error ? error.message : "Unknown error",
    );

    return jsonResponse(
      { success: false, error: "Unable to start checkout." },
      500,
    );
  }
}

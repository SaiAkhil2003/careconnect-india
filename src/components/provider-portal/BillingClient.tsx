"use client";

import Link from "next/link";
import { useState } from "react";
import { LISTING_PLANS } from "@/lib/payments/plans";
import type { ListingTier, Provider } from "@/lib/types";
import { formatListingTier } from "@/lib/utils/format";
import { PlanCard } from "@/components/provider-portal/PlanCard";

type BillingClientProps = {
  provider: Provider | null;
  checkoutStatus: "success" | "canceled" | null;
};

type RazorpayCheckoutData = {
  key_id: string;
  subscription_id: string;
  plan: Extract<ListingTier, "standard" | "premium">;
  provider_name: string;
};

type CheckoutResponse =
  | { success: true; data: RazorpayCheckoutData }
  | { success: false; error: string };

type RazorpayCheckoutOptions = {
  key: string;
  name: string;
  description: string;
  subscription_id: string;
  handler: () => void;
  notes: {
    plan: string;
  };
  modal: {
    ondismiss: () => void;
  };
  theme: {
    color: string;
  };
};

type RazorpayConstructor = new (
  options: RazorpayCheckoutOptions,
) => {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const RAZORPAY_CHECKOUT_SCRIPT_URL =
  "https://checkout.razorpay.com/v1/checkout.js";
const RAZORPAY_SCRIPT_ID = "razorpay-checkout-js";
const RAZORPAY_SETUP_ERROR = "Razorpay billing is not configured.";
const PUBLIC_RAZORPAY_KEY_ID =
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() ?? "";

function loadRazorpayCheckoutScript() {
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  const existingScript = document.getElementById(RAZORPAY_SCRIPT_ID);

  if (existingScript) {
    return new Promise<boolean>((resolve) => {
      existingScript.addEventListener("load", () => resolve(true), {
        once: true,
      });
      existingScript.addEventListener("error", () => resolve(false), {
        once: true,
      });
    });
  }

  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.id = RAZORPAY_SCRIPT_ID;
    script.src = RAZORPAY_CHECKOUT_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function getSafeCheckoutError(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unable to start Razorpay checkout. Please try again.";
  }

  if (
    error.message === RAZORPAY_SETUP_ERROR ||
    error.message === "Please register your provider profile first." ||
    error.message === "Unauthenticated." ||
    error.message === "Select Standard or Premium to upgrade."
  ) {
    return error.message;
  }

  return "Unable to start Razorpay checkout. Please try again.";
}

export function BillingClient({
  provider,
  checkoutStatus,
}: BillingClientProps) {
  const [pendingTier, setPendingTier] = useState<ListingTier | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  if (!provider) {
    return (
      <div className="card max-w-3xl">
        <h2 className="text-xl font-bold leading-tight tracking-normal text-neutral-950 sm:text-2xl">
          Please register your provider profile first.
        </h2>
        <p className="mt-4 text-sm leading-6 text-neutral-700">
          Billing is available after your provider profile has been created.
        </p>
        <Link
          className="btn-primary mt-6 w-full sm:w-auto"
          href="/register-provider"
          prefetch={false}
        >
          Register provider
        </Link>
      </div>
    );
  }

  const currentTier = provider.listing_tier ?? "free";

  async function handleUpgrade(tier: ListingTier) {
    if (tier === "free") {
      return;
    }

    setPendingTier(tier);
    setErrorMessage("");

    try {
      if (!PUBLIC_RAZORPAY_KEY_ID) {
        throw new Error(RAZORPAY_SETUP_ERROR);
      }

      const response = await fetch(
        "/api/provider/billing/razorpay-checkout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tier }),
        },
      );
      const result = (await response.json()) as CheckoutResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.success ? "Unable to start Razorpay checkout." : result.error,
        );
      }

      const isScriptLoaded = await loadRazorpayCheckoutScript();

      if (!isScriptLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout.");
      }

      const checkout = new window.Razorpay({
        key: PUBLIC_RAZORPAY_KEY_ID,
        name: "CareConnect India",
        description: `${LISTING_PLANS[result.data.plan].label} listing plan`,
        subscription_id: result.data.subscription_id,
        handler: () => {
          window.location.assign("/dashboard/billing?success=true");
        },
        notes: {
          plan: result.data.plan,
        },
        modal: {
          ondismiss: () => {
            setPendingTier(null);
          },
        },
        theme: {
          color: "#2563eb",
        },
      });

      checkout.open();
    } catch (error) {
      setErrorMessage(getSafeCheckoutError(error));
      setPendingTier(null);
    }
  }

  return (
    <div className="space-y-8">
      {checkoutStatus === "success" ? (
        <div className="rounded-md border border-primary-light bg-primary-light p-4 text-sm font-medium text-primary-dark">
          Checkout completed. Your plan will update after Razorpay confirms the
          subscription webhook.
        </div>
      ) : null}

      {checkoutStatus === "canceled" ? (
        <div className="rounded-md border border-neutral-200 bg-white p-4 text-sm font-medium text-neutral-700">
          Checkout was canceled. Your current plan is unchanged.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {errorMessage}
        </div>
      ) : null}

      <section className="card">
        <p className="text-sm font-medium text-neutral-600">Current provider</p>
        <h2 className="mt-2 break-words text-xl font-bold leading-tight tracking-normal text-neutral-950 sm:text-2xl">
          {provider.provider_name}
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-700">
          Current listing tier:{" "}
          <span className="font-semibold">
            {formatListingTier(currentTier)}
          </span>
        </p>
        <p className="mt-3 text-sm leading-6 text-neutral-700">
          India MVP billing is processed through Razorpay test mode. Stripe
          support remains available for future/global billing.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-neutral-950">
          Listing plans
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {Object.values(LISTING_PLANS).map((plan) => (
            <PlanCard
              checkoutProviderLabel="Razorpay"
              currentTier={currentTier}
              key={plan.tier}
              onUpgrade={handleUpgrade}
              pendingTier={pendingTier}
              plan={plan}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

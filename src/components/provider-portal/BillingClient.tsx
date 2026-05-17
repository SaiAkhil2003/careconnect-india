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

type CheckoutResponse =
  | { success: true; data: { url: string } }
  | { success: false; error: string };

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
      const response = await fetch("/api/provider/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier }),
      });
      const result = (await response.json()) as CheckoutResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.success ? "Unable to start checkout." : result.error,
        );
      }

      window.location.assign(result.data.url);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to start checkout.",
      );
      setPendingTier(null);
    }
  }

  return (
    <div className="space-y-8">
      {checkoutStatus === "success" ? (
        <div className="rounded-md border border-primary-light bg-primary-light p-4 text-sm font-medium text-primary-dark">
          Checkout completed. Your plan will update after Stripe confirms the
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
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-neutral-950">
          Listing plans
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {Object.values(LISTING_PLANS).map((plan) => (
            <PlanCard
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

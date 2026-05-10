"use client";

import type { ListingPlan } from "@/lib/payments/plans";
import type { ListingTier } from "@/lib/types";

type PlanCardProps = {
  plan: ListingPlan;
  currentTier: ListingTier;
  pendingTier: ListingTier | null;
  onUpgrade: (tier: ListingTier) => void;
};

export function PlanCard({
  plan,
  currentTier,
  pendingTier,
  onUpgrade,
}: PlanCardProps) {
  const isCurrent = currentTier === plan.tier;
  const isPaidPlan = plan.tier !== "free";
  const isSubmitting = pendingTier === plan.tier;
  const isPremiumCurrent = currentTier === "premium" && plan.tier === "standard";
  const cardClassName =
    plan.tier === "premium"
      ? "card border-secondary bg-secondary-light/30"
      : "card";

  return (
    <article className={cardClassName}>
      <div className="flex h-full flex-col">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-neutral-950">
                {plan.label}
              </h2>
              <p className="mt-2 text-2xl font-bold text-neutral-950">
                {plan.priceLabel}
              </p>
            </div>
            {isCurrent ? (
              <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary-dark">
                Current
              </span>
            ) : null}
          </div>

          <p className="mt-4 text-sm leading-6 text-neutral-700">
            {plan.leadDeliveryDescription}
          </p>

          <ul className="mt-5 space-y-3 text-sm leading-6 text-neutral-700">
            {plan.features.map((feature) => (
              <li className="flex gap-2" key={feature}>
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          {isPaidPlan ? (
            <button
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isCurrent || isSubmitting || isPremiumCurrent}
              onClick={() => onUpgrade(plan.tier)}
              type="button"
            >
              {isCurrent
                ? "Current plan"
                : isSubmitting
                  ? "Starting checkout..."
                  : isPremiumCurrent
                    ? "Included in Premium"
                    : `Upgrade to ${plan.label}`}
            </button>
          ) : (
            <button
              className="btn-secondary w-full cursor-default opacity-70"
              disabled
              type="button"
            >
              {isCurrent ? "Current plan" : "Default plan"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

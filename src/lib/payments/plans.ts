import type { ListingTier } from "@/lib/types";

export type ListingPlan = {
  tier: ListingTier;
  label: string;
  priceLabel: string;
  monthlyPrice: number;
  features: string[];
  stripePriceEnvKey: string | null;
  razorpayPlanEnvKey: string | null;
  leadDeliveryDescription: string;
  searchPriority: number;
};

export const LISTING_PLANS = {
  free: {
    tier: "free",
    label: "Free",
    priceLabel: "₹0/month",
    monthlyPrice: 0,
    features: [
      "Public profile after admin approval",
      "Appears in family search",
      "Leads stored in provider dashboard",
    ],
    stripePriceEnvKey: null,
    razorpayPlanEnvKey: null,
    leadDeliveryDescription: "Leads are stored in your dashboard only.",
    searchPriority: 1,
  },
  standard: {
    tier: "standard",
    label: "Standard",
    priceLabel: "₹1,999/month",
    monthlyPrice: 1999,
    features: [
      "Better listing priority than Free",
      "Provider lead alert by email",
      "Basic analytics included",
    ],
    stripePriceEnvKey: "STRIPE_STANDARD_PRICE_ID",
    razorpayPlanEnvKey: "RAZORPAY_STANDARD_PLAN_ID",
    leadDeliveryDescription: "Email lead alerts are enabled when configured.",
    searchPriority: 2,
  },
  premium: {
    tier: "premium",
    label: "Premium",
    priceLabel: "₹4,999/month",
    monthlyPrice: 4999,
    features: [
      "Highest search priority",
      "Highlighted listing in search",
      "Email lead alerts",
      "WhatsApp lead alerts when configured",
      "Basic analytics included",
    ],
    stripePriceEnvKey: "STRIPE_PREMIUM_PRICE_ID",
    razorpayPlanEnvKey: "RAZORPAY_PREMIUM_PLAN_ID",
    leadDeliveryDescription:
      "Email and WhatsApp lead alerts are enabled when configured.",
    searchPriority: 3,
  },
} as const satisfies Record<ListingTier, ListingPlan>;

export function getListingPlan(tier: ListingTier | null | undefined) {
  return LISTING_PLANS[tier ?? "free"];
}

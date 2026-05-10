import {
  LISTING_TIERS,
  PRICING_RANGES,
  SERVICE_TYPES,
} from "@/lib/constants";
import type { ListingTier, PricingRange, ServiceType } from "@/lib/types";

const serviceTypeLabels = new Map(
  SERVICE_TYPES.map((serviceType) => [serviceType.value, serviceType.label]),
);

const pricingSymbols = {
  budget: "₹",
  mid: "₹₹",
  premium: "₹₹₹",
} satisfies Record<PricingRange, string>;

const pricingLabels = new Map(
  PRICING_RANGES.map((pricingRange) => [
    pricingRange.value,
    pricingRange.label,
  ]),
);

const listingTierLabels = new Map(
  LISTING_TIERS.map((listingTier) => [listingTier.value, listingTier.label]),
);

export function formatServiceType(serviceType: ServiceType | string) {
  return serviceTypeLabels.get(serviceType as ServiceType) ?? serviceType;
}

export function formatPricingRange(pricingRange: PricingRange | null) {
  if (!pricingRange) {
    return "Pricing not listed";
  }

  return pricingSymbols[pricingRange];
}

export function formatPricingRangeLabel(pricingRange: PricingRange | null) {
  if (!pricingRange) {
    return "Pricing not listed";
  }

  return pricingLabels.get(pricingRange) ?? pricingRange;
}

export function formatListingTier(listingTier: ListingTier | null) {
  if (!listingTier) {
    return "Free";
  }

  return listingTierLabels.get(listingTier) ?? listingTier;
}

export function formatArrayPreview(items: string[] | null, limit = 3) {
  if (!items?.length) {
    return "Not listed";
  }

  const visibleItems = items.slice(0, limit);
  const remainingCount = items.length - visibleItems.length;

  if (remainingCount <= 0) {
    return visibleItems.join(", ");
  }

  return `${visibleItems.join(", ")} +${remainingCount} more`;
}

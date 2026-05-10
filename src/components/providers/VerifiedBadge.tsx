import type { ListingTier } from "@/lib/types";

type VerifiedBadgeProps = {
  isVerified: boolean | null;
  listingTier: ListingTier | null;
};

export function canDisplayVerifiedBadge({
  isVerified,
  listingTier,
}: VerifiedBadgeProps) {
  return Boolean(
    isVerified && (listingTier === "standard" || listingTier === "premium"),
  );
}

export function VerifiedBadge({ isVerified, listingTier }: VerifiedBadgeProps) {
  if (!canDisplayVerifiedBadge({ isVerified, listingTier })) {
    return null;
  }

  return (
    <span className="inline-flex items-center rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary-dark">
      Verified
    </span>
  );
}

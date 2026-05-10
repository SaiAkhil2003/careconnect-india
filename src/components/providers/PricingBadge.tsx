import type { PricingRange } from "@/lib/types";
import {
  formatPricingRange,
  formatPricingRangeLabel,
} from "@/lib/utils/format";

type PricingBadgeProps = {
  value: PricingRange | null;
};

export function PricingBadge({ value }: PricingBadgeProps) {
  if (!value) {
    return (
      <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-secondary bg-secondary-light px-3 py-1 text-xs font-semibold text-secondary-dark">
        Pricing not listed
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-secondary bg-secondary-light px-3 py-1 text-xs font-semibold text-secondary-dark">
      <span>{formatPricingRange(value)}</span>
      <span className="font-medium">{formatPricingRangeLabel(value)}</span>
    </span>
  );
}

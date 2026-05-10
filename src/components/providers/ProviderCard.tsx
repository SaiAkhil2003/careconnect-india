import Link from "next/link";
import type { Provider } from "@/lib/types";
import {
  formatArrayPreview,
  formatServiceType,
} from "@/lib/utils/format";
import { PricingBadge } from "@/components/providers/PricingBadge";
import { VerifiedBadge } from "@/components/providers/VerifiedBadge";

type ProviderCardProps = {
  provider: Provider;
};

function getPlacementLabel(provider: Provider) {
  if (provider.listing_tier === "premium") {
    return "Premium placement";
  }

  if (provider.listing_tier === "standard") {
    return "Standard listing";
  }

  return "Free listing";
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const isPremium = provider.listing_tier === "premium";

  return (
    <article
      className={
        isPremium ? "card border-secondary bg-secondary-light/30" : "card"
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-neutral-950">
              {provider.provider_name}
            </h2>
            <VerifiedBadge isVerified={provider.is_verified} />
          </div>
          <p
            className={
              isPremium
                ? "mt-2 text-sm font-medium text-secondary-dark"
                : "mt-2 text-sm font-medium text-primary-dark"
            }
          >
            {getPlacementLabel(provider)}
          </p>
        </div>

        <PricingBadge value={provider.pricing_range} />
      </div>

      {provider.description ? (
        <p className="mt-4 text-sm leading-6 text-neutral-700">
          {provider.description}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 text-sm text-neutral-700 md:grid-cols-3">
        <div>
          <p className="font-semibold text-neutral-950">Services</p>
          <p className="mt-1 leading-6">
            {provider.service_types.map(formatServiceType).join(", ")}
          </p>
        </div>
        <div>
          <p className="font-semibold text-neutral-950">Areas</p>
          <p className="mt-1 leading-6">
            {formatArrayPreview(provider.areas_covered)}
          </p>
        </div>
        <div>
          <p className="font-semibold text-neutral-950">Languages</p>
          <p className="mt-1 leading-6">
            {formatArrayPreview(provider.languages_spoken)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <Link className="btn-primary" href={`/providers/${provider.slug}`}>
          View profile
        </Link>
      </div>
    </article>
  );
}

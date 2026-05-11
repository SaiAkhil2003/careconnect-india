import Link from "next/link";
import type { Provider } from "@/lib/types";
import {
  formatArrayPreview,
  formatPricingRangeLabel,
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
  const canShowLogo =
    Boolean(provider.logo_url) &&
    (provider.listing_tier === "standard" ||
      provider.listing_tier === "premium");

  return (
    <article
      className={
        isPremium ? "card border-secondary bg-secondary-light/30" : "card"
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3 sm:gap-4">
          {canShowLogo ? (
            <div
              aria-label={`${provider.provider_name} logo`}
              className="h-12 w-12 shrink-0 rounded-md border border-neutral-200 bg-white bg-cover bg-center sm:h-14 sm:w-14"
              role="img"
              style={{ backgroundImage: `url("${provider.logo_url}")` }}
            />
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="break-words text-lg font-semibold leading-snug text-neutral-950 sm:text-xl">
                {provider.provider_name}
              </h2>
              <VerifiedBadge
                isVerified={provider.is_verified}
                listingTier={provider.listing_tier}
              />
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
        </div>

        <div className="self-start">
          <PricingBadge value={provider.pricing_range} />
        </div>
      </div>

      {provider.description ? (
        <p className="mt-4 break-words text-sm leading-6 text-neutral-700">
          {provider.description}
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 text-sm text-neutral-700 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="font-semibold text-neutral-950">City</p>
          <p className="mt-1 leading-6">{provider.city ?? "Not listed"}</p>
        </div>
        <div>
          <p className="font-semibold text-neutral-950">Services</p>
          <p className="mt-1 leading-6">
            {provider.service_types.map(formatServiceType).join(", ")}
          </p>
        </div>
        <div>
          <p className="font-semibold text-neutral-950">Areas covered</p>
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
        <div>
          <p className="font-semibold text-neutral-950">Pricing</p>
          <p className="mt-1 leading-6">
            {formatPricingRangeLabel(provider.pricing_range)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <Link
          className="btn-primary w-full sm:w-auto"
          href={`/providers/${provider.slug}`}
        >
          View profile
        </Link>
      </div>
    </article>
  );
}

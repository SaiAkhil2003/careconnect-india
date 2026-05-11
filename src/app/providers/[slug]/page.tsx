import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiries/EnquiryForm";
import { PricingBadge } from "@/components/providers/PricingBadge";
import { VerifiedBadge } from "@/components/providers/VerifiedBadge";
import { ErrorState } from "@/components/ui/ErrorState";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Provider } from "@/lib/types";
import {
  formatListingTier,
  formatPricingRangeLabel,
  formatServiceType,
} from "@/lib/utils/format";

export const dynamic = "force-dynamic";

type ProviderPageProps = {
  params: {
    slug: string;
  };
};

type ProviderProfileApiResponse =
  | {
      success: true;
      data: {
        provider: Provider;
      };
    }
  | {
      success: false;
      error: string;
    };

const providerDescriptionFallback =
  "View aged care provider services, areas covered, languages, and enquiry details on CareConnect India.";

function getBaseUrl() {
  const requestHeaders = headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

async function getProvider(slug: string) {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/providers/${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    );
    const result = (await response.json()) as ProviderProfileApiResponse;

    if (response.status === 404) {
      return {
        provider: null,
        error: "",
        notFound: true,
      };
    }

    if (!response.ok || !result.success) {
      return {
        provider: null,
        error: result.success
          ? "Unable to load provider profile."
          : result.error,
        notFound: false,
      };
    }

    return {
      provider: result.data.provider,
      error: "",
      notFound: false,
    };
  } catch {
    return {
      provider: null,
      error: "Unable to load provider profile right now.",
      notFound: false,
    };
  }
}

async function getProviderForMetadata(slug: string) {
  try {
    const supabase = createSupabaseServerClient();
    const { data: provider } = await supabase
      .from("providers")
      .select("provider_name, description")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    return provider;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: ProviderPageProps): Promise<Metadata> {
  const provider = await getProviderForMetadata(params.slug);

  if (!provider) {
    return {
      title: {
        absolute: "Provider Not Found | CareConnect India",
      },
      description: "This provider is not available or is no longer active.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    provider.description?.trim() || providerDescriptionFallback;

  return {
    title: {
      absolute: `${provider.provider_name} | CareConnect India`,
    },
    description,
    openGraph: {
      title: `${provider.provider_name} | CareConnect India`,
      description,
      type: "website",
    },
  };
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <dt className="text-sm font-semibold text-neutral-950">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-neutral-700">{value}</dd>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="text-sm text-neutral-700">Not listed</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700"
          key={item}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export default async function ProviderPage({ params }: ProviderPageProps) {
  const { provider, error, notFound } = await getProvider(params.slug);

  if (notFound) {
    return (
      <section className="section-container py-8 sm:py-10 md:py-16">
        <ErrorState
          message="This provider is not available or is no longer active."
          title="Provider not found"
        />
        <Link className="btn-primary mt-6 w-full sm:w-auto" href="/search">
          Back to search
        </Link>
      </section>
    );
  }

  if (error || !provider) {
    return (
      <section className="section-container py-8 sm:py-10 md:py-16">
        <ErrorState
          message="We could not load this provider profile. Please try again."
          title="Profile unavailable"
        />
      </section>
    );
  }

  const canShowLogo =
    Boolean(provider.logo_url) &&
    (provider.listing_tier === "standard" ||
      provider.listing_tier === "premium");

  return (
    <section className="section-container py-8 sm:py-10 md:py-14">
      <Link
        className="text-sm font-semibold text-primary hover:text-primary-dark"
        href="/search"
      >
        Back to search
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3 sm:gap-4">
                {canShowLogo ? (
                  <div
                    aria-label={`${provider.provider_name} logo`}
                    className="h-14 w-14 shrink-0 rounded-md border border-neutral-200 bg-white bg-cover bg-center sm:h-16 sm:w-16"
                    role="img"
                    style={{ backgroundImage: `url("${provider.logo_url}")` }}
                  />
                ) : null}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="break-words text-2xl font-bold leading-tight tracking-normal text-neutral-950 sm:text-3xl">
                      {provider.provider_name}
                    </h1>
                    <VerifiedBadge
                      isVerified={provider.is_verified}
                      listingTier={provider.listing_tier}
                    />
                  </div>
                  <p className="mt-3 text-sm font-medium text-primary-dark">
                    {formatListingTier(provider.listing_tier)} listing
                  </p>
                </div>
              </div>
              <div className="self-start">
                <PricingBadge value={provider.pricing_range} />
              </div>
            </div>

            {provider.description ? (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-neutral-950">
                  Overview
                </h2>
                <p className="mt-3 break-words text-sm leading-7 text-neutral-700">
                  {provider.description}
                </p>
              </div>
            ) : null}
          </section>

          <section className="card">
            <h2 className="text-lg font-semibold text-neutral-950">Services</h2>
            <div className="mt-4">
              <TagList
                items={provider.service_types.map((serviceType) =>
                  formatServiceType(serviceType),
                )}
              />
            </div>
          </section>

          <section className="card">
            <h2 className="text-lg font-semibold text-neutral-950">
              Areas Covered
            </h2>
            <div className="mt-4">
              <TagList items={provider.areas_covered} />
            </div>
          </section>

          <section className="card">
            <h2 className="text-lg font-semibold text-neutral-950">
              Languages
            </h2>
            <div className="mt-4">
              <TagList items={provider.languages_spoken} />
            </div>
          </section>

          <section className="card">
            <h2 className="text-lg font-semibold text-neutral-950">
              Contact Details
            </h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <DetailItem label="Phone" value={provider.phone} />
              <DetailItem label="Email" value={provider.email} />
              <DetailItem label="Website" value={provider.website_url} />
              <DetailItem label="Address" value={provider.address_line} />
              <DetailItem label="City" value={provider.city} />
              <DetailItem
                label="Pricing range"
                value={formatPricingRangeLabel(provider.pricing_range)}
              />
              <DetailItem
                label="Established"
                value={provider.established_year}
              />
              <DetailItem
                label="Staff count"
                value={provider.staff_count_range}
              />
            </dl>
          </section>
        </div>

        <section className="card h-fit lg:sticky lg:top-6">
          <h2 className="text-lg font-semibold text-neutral-950">
            Send Enquiry
          </h2>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            Share your care need and contact details. The provider can contact
            you directly.
          </p>
          <div className="mt-5">
            <EnquiryForm
              providerId={provider.id}
              providerServiceTypes={provider.service_types}
            />
          </div>
        </section>
      </div>
    </section>
  );
}

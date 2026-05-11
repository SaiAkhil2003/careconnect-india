import Link from "next/link";
import { headers } from "next/headers";
import {
  ProviderFilters,
  type ProviderFilterValues,
} from "@/components/providers/ProviderFilters";
import { ProviderList } from "@/components/providers/ProviderList";
import { ErrorState } from "@/components/ui/ErrorState";
import type { ListingTier, Provider, ServiceType } from "@/lib/types";
import {
  formatListingTier,
  formatServiceType,
} from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search Aged Care Providers",
  description:
    "Search and filter aged care providers in Visakhapatnam by service, area, language, verified status, and listing tier.",
};

type SearchPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

type ProvidersApiResponse =
  | {
      success: true;
      data: {
        providers: Provider[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          total_pages: number;
        };
      };
    }
  | {
      success: false;
      error: string;
    };

function getSearchParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

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

function getFilters(searchParams: SearchPageProps["searchParams"]) {
  return {
    service_type: getSearchParamValue(searchParams?.service_type) ?? "",
    area: getSearchParamValue(searchParams?.area) ?? "",
    language: getSearchParamValue(searchParams?.language) ?? "",
    tier: getSearchParamValue(searchParams?.tier) ?? "",
    verified: getSearchParamValue(searchParams?.verified) === "true" ? "true" : "",
    page: getSearchParamValue(searchParams?.page) ?? "1",
  };
}

function buildApiQuery(filters: ReturnType<typeof getFilters>) {
  const query = new URLSearchParams();

  if (filters.service_type) {
    query.set("service_type", filters.service_type);
  }

  if (filters.area) {
    query.set("area", filters.area);
  }

  if (filters.language) {
    query.set("language", filters.language);
  }

  if (filters.tier) {
    query.set("tier", filters.tier);
  }

  if (filters.verified === "true") {
    query.set("verified", "true");
  }

  if (filters.page) {
    query.set("page", filters.page);
  }

  return query;
}

function buildSearchHref(filters: ReturnType<typeof getFilters>, page: number) {
  const query = buildApiQuery({ ...filters, page: String(page) });

  if (page <= 1) {
    query.delete("page");
  }

  const queryString = query.toString();
  return queryString ? `/search?${queryString}` : "/search";
}

async function getProviders(filters: ReturnType<typeof getFilters>) {
  const query = buildApiQuery(filters);
  const queryString = query.toString();
  const url = `${getBaseUrl()}/api/providers${queryString ? `?${queryString}` : ""}`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    const result = (await response.json()) as ProvidersApiResponse;

    if (!response.ok || !result.success) {
      return {
        providers: [],
        pagination: { page: 1, limit: 10, total: 0, total_pages: 0 },
        error: result.success ? "Unable to load providers." : result.error,
      };
    }

    return {
      providers: result.data.providers,
      pagination: result.data.pagination,
      error: "",
    };
  } catch {
    return {
      providers: [],
      pagination: { page: 1, limit: 10, total: 0, total_pages: 0 },
      error: "Unable to load providers right now.",
    };
  }
}

function AppliedFilters({ filters }: { filters: ReturnType<typeof getFilters> }) {
  const appliedFilters = [
    filters.service_type
      ? formatServiceType(filters.service_type as ServiceType)
      : "",
    filters.area,
    filters.language,
    filters.tier ? `${formatListingTier(filters.tier as ListingTier)} tier` : "",
    filters.verified === "true" ? "Verified providers" : "",
  ].filter(Boolean);

  if (appliedFilters.length === 0) {
    return (
      <p className="mt-3 text-sm leading-6 text-neutral-700">
        Showing all active providers in Visakhapatnam.
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {appliedFilters.map((filter) => (
        <span
          className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary-dark"
          key={filter}
        >
          {filter}
        </span>
      ))}
    </div>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const filters = getFilters(searchParams);
  const { providers, pagination, error } = await getProviders(filters);
  const filterValues: ProviderFilterValues = {
    service_type: filters.service_type,
    area: filters.area,
    language: filters.language,
    tier: filters.tier,
    verified: filters.verified,
  };

  return (
    <section className="section-container py-8 sm:py-10 md:py-14">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">Search providers</p>
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-normal text-neutral-950 sm:text-3xl">
            Aged care providers in Visakhapatnam
          </h1>
          <AppliedFilters filters={filters} />
        </div>
        <p className="shrink-0 text-sm font-medium text-neutral-700">
          {pagination.total} provider{pagination.total === 1 ? "" : "s"} found
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <ProviderFilters filters={filterValues} />

        <div className="space-y-6">
          {error ? (
            <ErrorState
              message="We could not load providers. Please try again."
              title="Provider search failed"
            />
          ) : (
            <ProviderList providers={providers} />
          )}

          {!error && pagination.total_pages > 1 ? (
            <nav
              aria-label="Provider results pagination"
              className="flex flex-wrap items-center justify-between gap-3"
            >
              {pagination.page > 1 ? (
                <Link
                  className="btn-secondary"
                  href={buildSearchHref(filters, pagination.page - 1)}
                >
                  Previous
                </Link>
              ) : (
                <span className="btn-secondary pointer-events-none opacity-50">
                  Previous
                </span>
              )}

              <span className="text-sm font-medium text-neutral-700">
                Page {pagination.page} of {pagination.total_pages}
              </span>

              {pagination.page < pagination.total_pages ? (
                <Link
                  className="btn-secondary"
                  href={buildSearchHref(filters, pagination.page + 1)}
                >
                  Next
                </Link>
              ) : (
                <span className="btn-secondary pointer-events-none opacity-50">
                  Next
                </span>
              )}
            </nav>
          ) : null}
        </div>
      </div>
    </section>
  );
}

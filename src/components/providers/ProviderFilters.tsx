import Link from "next/link";
import { LANGUAGES, LISTING_TIERS, SERVICE_TYPES } from "@/lib/constants";

export type ProviderFilterValues = {
  service_type?: string;
  city?: string;
  area?: string;
  language?: string;
  tier?: string;
  verified?: string;
};

type ProviderFiltersProps = {
  areaOptions: string[];
  filters: ProviderFilterValues;
};

export function ProviderFilters({ areaOptions, filters }: ProviderFiltersProps) {
  const clearHref = filters.city ? `/search?city=${filters.city}` : "/search";

  return (
    <aside className="card lg:self-start">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-neutral-950">Filters</h2>
        <Link
          className="text-sm font-semibold text-primary hover:text-primary-dark"
          href={clearHref}
        >
          Clear
        </Link>
      </div>

      <form action="/search" className="mt-5 space-y-4" method="get">
        <input name="city" type="hidden" value={filters.city ?? ""} />

        <label className="block">
          <span className="text-sm font-medium text-neutral-800">
            Service type
          </span>
          <select
            className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
            defaultValue={filters.service_type ?? ""}
            name="service_type"
          >
            <option value="">All services</option>
            {SERVICE_TYPES.map((serviceType) => (
              <option key={serviceType.value} value={serviceType.value}>
                {serviceType.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-neutral-800">
            Area/suburb
          </span>
          <select
            className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
            defaultValue={filters.area ?? ""}
            name="area"
          >
            <option value="">All areas</option>
            {areaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-neutral-800">Language</span>
          <select
            className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
            defaultValue={filters.language ?? ""}
            name="language"
          >
            <option value="">All languages</option>
            {LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-neutral-800">
            Listing tier
          </span>
          <select
            className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
            defaultValue={filters.tier ?? ""}
            name="tier"
          >
            <option value="">All tiers</option>
            {LISTING_TIERS.map((tier) => (
              <option key={tier.value} value={tier.value}>
                {tier.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-start gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <input
            className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
            defaultChecked={filters.verified === "true"}
            name="verified"
            type="checkbox"
            value="true"
          />
          <span className="text-sm font-medium text-neutral-800">
            Verified providers only
          </span>
        </label>

        <button className="btn-primary w-full" type="submit">
          Apply filters
        </button>
      </form>
    </aside>
  );
}

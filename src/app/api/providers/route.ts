import { NextRequest, NextResponse } from "next/server";
import {
  LISTING_TIER_VALUES,
  resolveCityFromList,
  resolveCityFromLocationAlias,
  SERVICE_TYPE_VALUES,
} from "@/lib/constants";
import { getListingPlan } from "@/lib/payments/plans";
import { PUBLIC_PROVIDER_COLUMNS } from "@/lib/providers/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getE2eMockProviderSearchResponse,
  isE2eMockMode,
} from "@/lib/testing/e2e-mocks";
import type { PublicCity } from "@/lib/constants";
import type {
  ListingTier,
  PublicProvider,
  ServiceType,
} from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Expires: "0",
  Pragma: "no-cache",
  "Surrogate-Control": "no-store",
};

const ACTIVE_CITIES_PAGE_SIZE = 1000;
const ACTIVE_CITY_COLUMNS =
  "id, name, slug, state, provider_count, latitude, longitude";

type ProvidersResponse = {
  providers: PublicProvider[];
  city?: PublicCity;
  message?: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

function jsonResponse<T>(
  body: { success: true; data: T } | { success: false; error: string },
  status = 200,
) {
  return NextResponse.json(body, { headers: NO_STORE_HEADERS, status });
}

function getPositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function normalizeSearchValue(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function equalsSearchValue(
  value: string | null | undefined,
  searchValue: string,
) {
  return normalizeSearchValue(value) === normalizeSearchValue(searchValue);
}

function arrayIncludesSearchValue(items: string[] | null, searchValue: string) {
  return Boolean(
    items?.some((item) => equalsSearchValue(item, searchValue)),
  );
}

function providerMatchesCity(provider: PublicProvider, city: string) {
  return !city.trim() || equalsSearchValue(provider.city, city);
}

function providerMatchesArea(provider: PublicProvider, area: string) {
  return !area.trim() || arrayIncludesSearchValue(provider.areas_covered, area);
}

function isMissingCitiesTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const supabaseError = error as { code?: string; message?: string };
  const message = supabaseError.message?.toLowerCase() ?? "";

  return (
    supabaseError.code === "42P01" ||
    supabaseError.code === "PGRST205" ||
    (message.includes("relation") &&
      message.includes("cities") &&
      message.includes("does not exist")) ||
    (message.includes("table") &&
      message.includes("cities") &&
      message.includes("schema cache"))
  );
}

function sortProvidersForSearch(providers: PublicProvider[]) {
  return [...providers].sort((firstProvider, secondProvider) => {
    const priorityDifference =
      getListingPlan(secondProvider.listing_tier).searchPriority -
      getListingPlan(firstProvider.listing_tier).searchPriority;

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    const verifiedDifference =
      Number(Boolean(secondProvider.is_verified)) -
      Number(Boolean(firstProvider.is_verified));

    if (verifiedDifference !== 0) {
      return verifiedDifference;
    }

    return firstProvider.provider_name.localeCompare(
      secondProvider.provider_name,
    );
  });
}

function emptyProvidersResponse(message: string): ProvidersResponse {
  return {
    providers: [],
    message,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      total_pages: 0,
    },
  };
}

async function getActiveCities() {
  const supabase = createSupabaseServerClient();
  const cities: PublicCity[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("cities")
      .select(ACTIVE_CITY_COLUMNS)
      .eq("is_active", true)
      .order("provider_count", { ascending: false })
      .order("name", { ascending: true })
      .range(from, from + ACTIVE_CITIES_PAGE_SIZE - 1);

    if (error) {
      throw error;
    }

    const page = data ?? [];
    cities.push(...page);

    if (page.length < ACTIVE_CITIES_PAGE_SIZE) {
      break;
    }

    from += ACTIVE_CITIES_PAGE_SIZE;
  }

  return cities;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serviceType = searchParams.get("service_type")?.trim();
    const requestedCity = searchParams.get("city")?.trim();
    const location = searchParams.get("location")?.trim();
    const area = searchParams.get("area")?.trim();
    const language = searchParams.get("language")?.trim();
    const tier = searchParams.get("tier")?.trim();
    const verified = searchParams.get("verified") === "true";
    const page = getPositiveInteger(searchParams.get("page"), 1);
    const limit = Math.min(getPositiveInteger(searchParams.get("limit"), 10), 50);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    if (
      serviceType &&
      !SERVICE_TYPE_VALUES.includes(serviceType as ServiceType)
    ) {
      return jsonResponse(
        { success: false, error: "Invalid service_type filter." },
        400,
      );
    }

    if (tier && !LISTING_TIER_VALUES.includes(tier as ListingTier)) {
      return jsonResponse(
        { success: false, error: "Invalid tier filter." },
        400,
      );
    }

    if (!requestedCity && !location) {
      return jsonResponse<ProvidersResponse>({
        success: true,
        data: emptyProvidersResponse("City is required for provider search."),
      });
    }

    if (isE2eMockMode()) {
      return jsonResponse<ProvidersResponse>({
        success: true,
        data: getE2eMockProviderSearchResponse(searchParams),
      });
    }

    const activeCities = await getActiveCities();
    const selectedCity = requestedCity
      ? resolveCityFromList(requestedCity, activeCities)
      : resolveCityFromLocationAlias(location, activeCities);

    if (!selectedCity) {
      if (process.env.NODE_ENV === "development") {
        console.info("GET /api/providers city not active", {
          activeCityCount: activeCities.length,
          providerCount: 0,
          requestedCity: requestedCity ?? location ?? "",
        });
      }

      return jsonResponse<ProvidersResponse>({
        success: true,
        data: emptyProvidersResponse("This city is not active yet."),
      });
    }

    const supabase = createSupabaseServerClient();
    let query = supabase
      .from("providers")
      .select(PUBLIC_PROVIDER_COLUMNS)
      .eq("is_active", true)
      .ilike("city", selectedCity.name);

    if (serviceType) {
      query = query.contains("service_types", [serviceType]);
    }

    if (language) {
      query = query.contains("languages_spoken", [language]);
    }

    if (tier) {
      query = query.eq("listing_tier", tier as ListingTier);
    }

    if (verified) {
      query = query.eq("is_verified", true);
    }

    const { data, error } = await query;

    if (error) {
      return jsonResponse(
        { success: false, error: "Unable to fetch providers." },
        500,
      );
    }

    const providerRows = (data ?? []) as unknown as PublicProvider[];
    const filteredProviders = providerRows.filter(
      (provider) =>
        providerMatchesCity(provider, selectedCity.name) &&
        providerMatchesArea(provider, area ?? ""),
    );
    const sortedProviders = sortProvidersForSearch(filteredProviders);
    const paginatedProviders = sortedProviders.slice(from, to + 1);
    const total = sortedProviders.length;

    if (process.env.NODE_ENV === "development") {
      console.info("GET /api/providers providers returned", {
        activeCityCount: activeCities.length,
        providerCount: total,
        requestedCity: requestedCity ?? location ?? "",
      });
    }

    return jsonResponse<ProvidersResponse>({
      success: true,
      data: {
        providers: paginatedProviders,
        city: selectedCity,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("GET /api/providers failed", error);

    if (isMissingCitiesTableError(error)) {
      return jsonResponse(
        {
          success: false,
          error:
            "Database migration is pending. Run supabase/migrations/202605111700_create_cities_table.sql.",
        },
        503,
      );
    }

    return jsonResponse(
      { success: false, error: "Unexpected server error." },
      500,
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  LISTING_TIER_VALUES,
  resolveCityFromList,
  resolveCityFromLocationAlias,
  SERVICE_TYPE_VALUES,
} from "@/lib/constants";
import { getListingPlan } from "@/lib/payments/plans";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PublicCity } from "@/lib/constants";
import type { ListingTier, Provider, ServiceType } from "@/lib/types";

export const dynamic = "force-dynamic";

type ProvidersResponse = {
  providers: Provider[];
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
  return NextResponse.json(body, { status });
}

function getPositiveInteger(value: string | null, fallback: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function getCreatedAtTime(provider: Provider) {
  if (!provider.created_at) {
    return 0;
  }

  return new Date(provider.created_at).getTime();
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

function providerMatchesCity(provider: Provider, city: string) {
  return !city.trim() || equalsSearchValue(provider.city, city);
}

function providerMatchesArea(provider: Provider, area: string) {
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

function sortProvidersForSearch(providers: Provider[]) {
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

    const createdAtDifference =
      getCreatedAtTime(secondProvider) - getCreatedAtTime(firstProvider);

    if (createdAtDifference !== 0) {
      return createdAtDifference;
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
  const { data, error } = await supabase
    .from("cities")
    .select("id, name, slug, state, provider_count, latitude, longitude")
    .eq("is_active", true)
    .order("provider_count", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
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

    const activeCities = await getActiveCities();
    const selectedCity = requestedCity
      ? resolveCityFromList(requestedCity, activeCities)
      : resolveCityFromLocationAlias(location, activeCities);

    if (!selectedCity) {
      return jsonResponse<ProvidersResponse>({
        success: true,
        data: emptyProvidersResponse("This city is not active yet."),
      });
    }

    const supabase = createSupabaseServerClient();
    let query = supabase
      .from("providers")
      .select("*")
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

    const filteredProviders = (data ?? []).filter(
      (provider) =>
        providerMatchesCity(provider, selectedCity.name) &&
        providerMatchesArea(provider, area ?? ""),
    );
    const sortedProviders = sortProvidersForSearch(filteredProviders);
    const paginatedProviders = sortedProviders.slice(from, to + 1);
    const total = sortedProviders.length;

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

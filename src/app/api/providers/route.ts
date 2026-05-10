import { NextRequest, NextResponse } from "next/server";
import {
  LISTING_TIER_VALUES,
  SERVICE_TYPE_VALUES,
} from "@/lib/constants";
import { getListingPlan } from "@/lib/payments/plans";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ListingTier, Provider, ServiceType } from "@/lib/types";

export const dynamic = "force-dynamic";

type ProvidersResponse = {
  providers: Provider[];
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serviceType = searchParams.get("service_type")?.trim();
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

    const supabase = createSupabaseServerClient();
    let query = supabase
      .from("providers")
      .select("*", { count: "exact" })
      .eq("is_active", true);

    if (serviceType) {
      query = query.contains("service_types", [serviceType]);
    }

    if (area) {
      query = query.contains("areas_covered", [area]);
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

    const { data, error, count } = await query;

    if (error) {
      return jsonResponse(
        { success: false, error: "Unable to fetch providers." },
        500,
      );
    }

    const sortedProviders = sortProvidersForSearch(data ?? []);
    const paginatedProviders = sortedProviders.slice(from, to + 1);
    const total = count ?? sortedProviders.length;

    return jsonResponse<ProvidersResponse>({
      success: true,
      data: {
        providers: paginatedProviders,
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

    return jsonResponse(
      { success: false, error: "Unexpected server error." },
      500,
    );
  }
}

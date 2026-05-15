import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getAreasForCity,
  PRICING_RANGES,
  resolveCityFromList,
  SERVICE_TYPE_VALUES,
  STAFF_COUNT_RANGES,
} from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  isE2eAuthenticatedProvider,
  isE2eMockMode,
  registerE2eProvider,
} from "@/lib/testing/e2e-mocks";
import type { PublicCity } from "@/lib/constants";
import type {
  PricingRange,
  Provider,
  ServiceType,
  StaffCountRange,
} from "@/lib/types";
import { generateSlug } from "@/lib/utils/slug";

export const dynamic = "force-dynamic";

function jsonResponse<T>(
  body: { success: true; data: T } | { success: false; error: string },
  status = 200,
) {
  return NextResponse.json(body, { status });
}

function optionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredString(value: unknown) {
  return optionalString(value);
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

function isValidServiceTypes(value: string[]) {
  return value.every((serviceType) =>
    SERVICE_TYPE_VALUES.includes(serviceType as ServiceType),
  );
}

function isValidPricingRange(value: string | null) {
  return (
    value === null ||
    PRICING_RANGES.some((pricingRange) => pricingRange.value === value)
  );
}

function isValidStaffCountRange(value: string | null) {
  return (
    value === null ||
    STAFF_COUNT_RANGES.some((staffCountRange) => staffCountRange.value === value)
  );
}

async function createUniqueSlug(providerName: string) {
  const supabase = createSupabaseServerClient();
  const baseSlug = generateSlug(providerName) || "provider";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${Math.random().toString(36).slice(2, 8)}`;
    const slug = `${baseSlug}${suffix}`;
    const { data, error } = await supabase
      .from("providers")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return slug;
    }
  }

  return `${baseSlug}-${Date.now().toString(36)}`;
}

async function getActiveCities() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("cities")
    .select("id, name, slug, state, provider_count, latitude, longitude")
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  return data ?? [];
}

function hasOnlyCityAreas(city: PublicCity, areas: string[]) {
  const cityAreas = getAreasForCity(city.name);

  if (!cityAreas.length) {
    return true;
  }

  const normalizedCityAreas = cityAreas.map((area) => area.toLowerCase());

  return areas.every((area) => normalizedCityAreas.includes(area.toLowerCase()));
}

export async function POST(request: NextRequest) {
  if (isE2eMockMode()) {
    if (!isE2eAuthenticatedProvider(request)) {
      return jsonResponse({ success: false, error: "Unauthenticated." }, 401);
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const provider = registerE2eProvider(payload);

    return jsonResponse<{ provider: Provider }>({
      success: true,
      data: { provider },
    });
  }

  try {
    const { userId } = await auth();

    if (!userId) {
      return jsonResponse({ success: false, error: "Unauthenticated." }, 401);
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const providerName = requiredString(payload.provider_name);
    const requestedCity = requiredString(payload.city);
    const serviceTypes = stringArray(payload.service_types);
    const areasCovered = stringArray(payload.areas_covered);
    const languagesSpoken = stringArray(payload.languages_spoken);
    const phone = requiredString(payload.phone);
    const email = optionalString(payload.email);
    const leadEmail = optionalString(payload.lead_email) ?? email;
    const pricingRange = optionalString(payload.pricing_range);
    const staffCountRange = optionalString(payload.staff_count_range);
    const establishedYear = optionalNumber(payload.established_year);

    if (!providerName) {
      return jsonResponse(
        { success: false, error: "Provider name is required." },
        400,
      );
    }

    const activeCities = await getActiveCities();
    const selectedCity = resolveCityFromList(requestedCity, activeCities);

    if (!selectedCity) {
      return jsonResponse(
        { success: false, error: "Select an active provider city." },
        400,
      );
    }

    if (!serviceTypes.length || !isValidServiceTypes(serviceTypes)) {
      return jsonResponse(
        { success: false, error: "Select at least one valid service type." },
        400,
      );
    }

    if (!areasCovered.length) {
      return jsonResponse(
        { success: false, error: "Select at least one area covered." },
        400,
      );
    }

    if (!hasOnlyCityAreas(selectedCity, areasCovered)) {
      return jsonResponse(
        {
          success: false,
          error: "Areas covered must belong to the selected city.",
        },
        400,
      );
    }

    if (!languagesSpoken.length) {
      return jsonResponse(
        { success: false, error: "Select at least one language spoken." },
        400,
      );
    }

    if (!phone) {
      return jsonResponse(
        { success: false, error: "Phone number is required." },
        400,
      );
    }

    if (!leadEmail) {
      return jsonResponse(
        { success: false, error: "Lead email is required when email is empty." },
        400,
      );
    }

    if (!isValidPricingRange(pricingRange)) {
      return jsonResponse(
        { success: false, error: "Invalid pricing range." },
        400,
      );
    }

    if (!isValidStaffCountRange(staffCountRange)) {
      return jsonResponse(
        { success: false, error: "Invalid staff count range." },
        400,
      );
    }

    if (establishedYear === undefined) {
      return jsonResponse(
        { success: false, error: "Established year must be a number." },
        400,
      );
    }

    const supabase = createSupabaseServerClient();
    const { data: existingProvider, error: existingProviderError } =
      await supabase
        .from("providers")
        .select("id")
        .eq("clerk_user_id", userId)
        .maybeSingle();

    if (existingProviderError) {
      return jsonResponse(
        { success: false, error: "Unable to check existing provider profile." },
        500,
      );
    }

    if (existingProvider) {
      return jsonResponse(
        { success: false, error: "Provider profile already exists." },
        409,
      );
    }

    const slug = await createUniqueSlug(providerName);
    const { data: provider, error } = await supabase
      .from("providers")
      .insert({
        clerk_user_id: userId,
        provider_name: providerName,
        slug,
        service_types: serviceTypes as ServiceType[],
        description: optionalString(payload.description),
        areas_covered: areasCovered,
        languages_spoken: languagesSpoken,
        phone,
        email,
        website_url: optionalString(payload.website_url),
        address_line: optionalString(payload.address_line),
        city: selectedCity.name,
        pricing_range: pricingRange as PricingRange | null,
        established_year: establishedYear,
        staff_count_range: staffCountRange as StaffCountRange | null,
        is_verified: false,
        listing_tier: "free",
        is_active: false,
        lead_email: leadEmail,
        lead_whatsapp: optionalString(payload.lead_whatsapp),
      })
      .select("*")
      .single();

    if (error) {
      return jsonResponse(
        { success: false, error: "Unable to create provider profile." },
        500,
      );
    }

    return jsonResponse<{ provider: Provider }>({
      success: true,
      data: { provider },
    });
  } catch (error) {
    console.error("POST /api/provider/register failed", error);

    return jsonResponse(
      { success: false, error: "Unexpected server error." },
      500,
    );
  }
}

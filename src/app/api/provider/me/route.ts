import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  PRICING_RANGES,
  SERVICE_TYPE_VALUES,
  STAFF_COUNT_RANGES,
} from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getE2eAuthenticatedProvider,
  isE2eMockMode,
  updateE2eAuthenticatedProvider,
} from "@/lib/testing/e2e-mocks";
import type {
  PricingRange,
  Provider,
  ServiceType,
  StaffCountRange,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const editableProviderFields = [
  "provider_name",
  "service_types",
  "description",
  "areas_covered",
  "languages_spoken",
  "phone",
  "email",
  "website_url",
  "address_line",
  "pricing_range",
  "established_year",
  "staff_count_range",
  "lead_email",
  "lead_whatsapp",
  "logo_url",
] as const;

type EditableProviderField = (typeof editableProviderFields)[number];

function jsonResponse<T>(
  body: { success: true; data: T } | { success: false; error: string },
  status = 200,
) {
  return NextResponse.json(body, { status });
}

function requiredUserId(userId: string | null) {
  if (!userId) {
    return null;
  }

  return userId;
}

function optionalString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
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

export async function GET(request: NextRequest) {
  if (isE2eMockMode()) {
    const { authenticated, provider } = getE2eAuthenticatedProvider(request);

    if (!authenticated) {
      return jsonResponse({ success: false, error: "Unauthenticated." }, 401);
    }

    return jsonResponse<{ provider: Provider | null }>({
      success: true,
      data: { provider },
    });
  }

  try {
    const { userId } = await auth();
    const clerkUserId = requiredUserId(userId);

    if (!clerkUserId) {
      return jsonResponse({ success: false, error: "Unauthenticated." }, 401);
    }

    const supabase = createSupabaseServerClient();
    const { data: provider, error } = await supabase
      .from("providers")
      .select("*")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();

    if (error) {
      return jsonResponse(
        { success: false, error: "Unable to fetch provider profile." },
        500,
      );
    }

    return jsonResponse<{ provider: Provider | null }>({
      success: true,
      data: { provider },
    });
  } catch (error) {
    console.error("GET /api/provider/me failed", error);

    return jsonResponse(
      { success: false, error: "Unexpected server error." },
      500,
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (isE2eMockMode()) {
    const { authenticated, provider } = getE2eAuthenticatedProvider(request);

    if (!authenticated) {
      return jsonResponse({ success: false, error: "Unauthenticated." }, 401);
    }

    if (!provider) {
      return jsonResponse(
        { success: false, error: "Provider profile not found." },
        404,
      );
    }

    const payload = (await request.json()) as Partial<Provider>;
    const updatedProvider = updateE2eAuthenticatedProvider(payload);

    return jsonResponse<{ provider: Provider }>({
      success: true,
      data: { provider: updatedProvider },
    });
  }

  try {
    const { userId } = await auth();
    const clerkUserId = requiredUserId(userId);

    if (!clerkUserId) {
      return jsonResponse({ success: false, error: "Unauthenticated." }, 401);
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const updates: Partial<Provider> = {};

    for (const field of editableProviderFields) {
      if (!(field in payload)) {
        continue;
      }

      const value = payload[field];

      if (field === "service_types") {
        const serviceTypes = stringArray(value);

        if (!serviceTypes?.length || !isValidServiceTypes(serviceTypes)) {
          return jsonResponse(
            { success: false, error: "Select at least one valid service type." },
            400,
          );
        }

        updates.service_types = serviceTypes as ServiceType[];
        continue;
      }

      if (field === "areas_covered" || field === "languages_spoken") {
        const list = stringArray(value);

        if (!list?.length) {
          return jsonResponse(
            { success: false, error: `${field} must include at least one value.` },
            400,
          );
        }

        updates[field] = list;
        continue;
      }

      if (field === "pricing_range") {
        const pricingRange = optionalString(value);

        if (!isValidPricingRange(pricingRange)) {
          return jsonResponse(
            { success: false, error: "Invalid pricing range." },
            400,
          );
        }

        updates.pricing_range = pricingRange as PricingRange | null;
        continue;
      }

      if (field === "staff_count_range") {
        const staffCountRange = optionalString(value);

        if (!isValidStaffCountRange(staffCountRange)) {
          return jsonResponse(
            { success: false, error: "Invalid staff count range." },
            400,
          );
        }

        updates.staff_count_range = staffCountRange as StaffCountRange | null;
        continue;
      }

      if (field === "established_year") {
        const establishedYear = optionalNumber(value);

        if (establishedYear === undefined) {
          return jsonResponse(
            { success: false, error: "Established year must be a number." },
            400,
          );
        }

        updates.established_year = establishedYear;
        continue;
      }

      if (field === "provider_name" || field === "phone") {
        const textValue = optionalString(value);

        if (!textValue) {
          return jsonResponse(
            { success: false, error: `${field} is required.` },
            400,
          );
        }

        updates[field] = textValue;
        continue;
      }

      updates[field as EditableProviderField] = optionalString(value) as never;
    }

    const supabase = createSupabaseServerClient();
    const { data: provider, error } = await supabase
      .from("providers")
      .update(updates)
      .eq("clerk_user_id", clerkUserId)
      .select("*")
      .maybeSingle();

    if (error) {
      return jsonResponse(
        { success: false, error: "Unable to update provider profile." },
        500,
      );
    }

    if (!provider) {
      return jsonResponse(
        { success: false, error: "Provider profile not found." },
        404,
      );
    }

    return jsonResponse<{ provider: Provider }>({
      success: true,
      data: { provider },
    });
  } catch (error) {
    console.error("PATCH /api/provider/me failed", error);

    return jsonResponse(
      { success: false, error: "Unexpected server error." },
      500,
    );
  }
}

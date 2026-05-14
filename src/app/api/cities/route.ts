import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PublicCity } from "@/lib/constants";

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

type CitiesResponse = {
  cities: PublicCity[];
  message?: string;
};

function jsonResponse<T>(
  body: { success: true; data: T } | { success: false; error: string },
  status = 200,
) {
  return NextResponse.json(body, { headers: NO_STORE_HEADERS, status });
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

async function getAllActiveCities() {
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

export async function GET() {
  try {
    const cities = await getAllActiveCities();

    if (process.env.NODE_ENV === "development") {
      console.info("GET /api/cities active cities returned", cities.length);
    }

    return jsonResponse<CitiesResponse>({
      success: true,
      data: { cities },
    });
  } catch (error) {
    console.error("GET /api/cities failed", error);

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

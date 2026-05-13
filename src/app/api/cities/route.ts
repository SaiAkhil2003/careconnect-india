import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PublicCity } from "@/lib/constants";

export const dynamic = "force-dynamic";

type CitiesResponse = {
  cities: PublicCity[];
  message?: string;
};

function jsonResponse<T>(
  body: { success: true; data: T } | { success: false; error: string },
  status = 200,
) {
  return NextResponse.json(body, { status });
}

function isMissingCitiesTableError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes("relation") &&
      message.includes("cities") &&
      message.includes("does not exist")) ||
    (message.includes("table") &&
      message.includes("cities") &&
      message.includes("schema cache"))
  );
}

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("cities")
      .select("id, name, slug, state, provider_count, latitude, longitude")
      .eq("is_active", true)
      .order("provider_count", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("GET /api/cities Supabase query failed", error);

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
        { success: false, error: "Unable to fetch active cities." },
        500,
      );
    }

    return jsonResponse<CitiesResponse>({
      success: true,
      data: { cities: data ?? [] },
    });
  } catch (error) {
    console.error("GET /api/cities failed", error);

    return jsonResponse(
      { success: false, error: "Unexpected server error." },
      500,
    );
  }
}

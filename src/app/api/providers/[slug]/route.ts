import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Provider } from "@/lib/types";

export const dynamic = "force-dynamic";

function jsonResponse<T>(
  body: { success: true; data: T } | { success: false; error: string },
  status = 200,
) {
  return NextResponse.json(body, { status });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const slug = params.slug?.trim();

    if (!slug) {
      return jsonResponse(
        { success: false, error: "Provider slug is required." },
        400,
      );
    }

    const supabase = createSupabaseServerClient();
    const { data: provider, error } = await supabase
      .from("providers")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      return jsonResponse(
        { success: false, error: "Unable to fetch provider profile." },
        500,
      );
    }

    if (!provider) {
      return jsonResponse(
        { success: false, error: "Provider not found." },
        404,
      );
    }

    const { error: analyticsError } = await supabase.rpc(
      "increment_provider_analytics",
      {
        target_provider_id: provider.id,
        metric: "profile_views",
      },
    );

    if (analyticsError) {
      console.error("Failed to increment profile view count", analyticsError);
    }

    return jsonResponse<{ provider: Provider }>({
      success: true,
      data: { provider },
    });
  } catch (error) {
    console.error("GET /api/providers/[slug] failed", error);

    return jsonResponse(
      { success: false, error: "Unexpected server error." },
      500,
    );
  }
}

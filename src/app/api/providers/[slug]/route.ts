import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_PROVIDER_COLUMNS } from "@/lib/providers/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getE2eMockProviderBySlug,
  isE2eMockMode,
} from "@/lib/testing/e2e-mocks";
import type { PublicProvider } from "@/lib/types";

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

    if (isE2eMockMode()) {
      const provider = getE2eMockProviderBySlug(slug);

      if (!provider) {
        return jsonResponse(
          { success: false, error: "Provider not found." },
          404,
        );
      }

      return jsonResponse<{ provider: PublicProvider }>({
        success: true,
        data: { provider },
      });
    }

    const supabase = createSupabaseServerClient();
    const { data: providerResult, error } = await supabase
      .from("providers")
      .select(PUBLIC_PROVIDER_COLUMNS)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      return jsonResponse(
        { success: false, error: "Unable to fetch provider profile." },
        500,
      );
    }

    const provider = providerResult as unknown as PublicProvider | null;

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

    return jsonResponse<{ provider: PublicProvider }>({
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

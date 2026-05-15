import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getE2eAuthenticatedProvider,
  getE2eProviderAnalytics,
  isE2eMockMode,
} from "@/lib/testing/e2e-mocks";
import type { ProviderAnalytics } from "@/lib/types";

export const dynamic = "force-dynamic";

function jsonResponse<T>(
  body: { success: true; data: T } | { success: false; error: string },
  status = 200,
) {
  return NextResponse.json(body, { status });
}

export async function GET(request: NextRequest) {
  if (isE2eMockMode()) {
    const { authenticated, provider } = getE2eAuthenticatedProvider(request);

    if (!authenticated) {
      return jsonResponse({ success: false, error: "Unauthenticated." }, 401);
    }

    if (!provider) {
      return jsonResponse<{
        total_profile_views: number;
        total_enquiries: number;
        daily_rows: ProviderAnalytics[];
      }>({
        success: true,
        data: {
          total_profile_views: 0,
          total_enquiries: 0,
          daily_rows: [],
        },
      });
    }

    return jsonResponse<{
      total_profile_views: number;
      total_enquiries: number;
      daily_rows: ProviderAnalytics[];
    }>({
      success: true,
      data: getE2eProviderAnalytics(),
    });
  }

  try {
    const { userId } = await auth();

    if (!userId) {
      return jsonResponse({ success: false, error: "Unauthenticated." }, 401);
    }

    const supabase = createSupabaseServerClient();
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (providerError) {
      return jsonResponse(
        { success: false, error: "Unable to fetch provider profile." },
        500,
      );
    }

    if (!provider) {
      return jsonResponse<{
        total_profile_views: number;
        total_enquiries: number;
        daily_rows: ProviderAnalytics[];
      }>({
        success: true,
        data: {
          total_profile_views: 0,
          total_enquiries: 0,
          daily_rows: [],
        },
      });
    }

    const { data: dailyRows, error: analyticsError } = await supabase
      .from("provider_analytics")
      .select("*")
      .eq("provider_id", provider.id)
      .order("date", { ascending: false })
      .limit(30);

    if (analyticsError) {
      return jsonResponse(
        { success: false, error: "Unable to fetch analytics." },
        500,
      );
    }

    const totalProfileViews = (dailyRows ?? []).reduce(
      (total, row) => total + (row.profile_views ?? 0),
      0,
    );
    const totalEnquiries = (dailyRows ?? []).reduce(
      (total, row) => total + (row.enquiry_count ?? 0),
      0,
    );

    return jsonResponse<{
      total_profile_views: number;
      total_enquiries: number;
      daily_rows: ProviderAnalytics[];
    }>({
      success: true,
      data: {
        total_profile_views: totalProfileViews,
        total_enquiries: totalEnquiries,
        daily_rows: dailyRows ?? [],
      },
    });
  } catch (error) {
    console.error("GET /api/provider/analytics failed", error);

    return jsonResponse(
      { success: false, error: "Unexpected server error." },
      500,
    );
  }
}

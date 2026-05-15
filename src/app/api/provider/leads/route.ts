import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getE2eAuthenticatedProvider,
  getE2eProviderLeads,
  isE2eMockMode,
} from "@/lib/testing/e2e-mocks";
import type { Enquiry, Provider } from "@/lib/types";

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
        provider: Provider | null;
        leads: Enquiry[];
        message: string;
      }>({
        success: true,
        data: {
          provider: null,
          leads: [],
          message: "Provider profile has not been created yet.",
        },
      });
    }

    return jsonResponse<{ provider: Provider; leads: Enquiry[] }>({
      success: true,
      data: {
        provider,
        leads: getE2eProviderLeads(provider.id),
      },
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
      .select("*")
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
        provider: Provider | null;
        leads: Enquiry[];
        message: string;
      }>({
        success: true,
        data: {
          provider: null,
          leads: [],
          message: "Provider profile has not been created yet.",
        },
      });
    }

    const { data: leads, error: leadsError } = await supabase
      .from("enquiries")
      .select("*")
      .eq("provider_id", provider.id)
      .order("created_at", { ascending: false });

    if (leadsError) {
      return jsonResponse(
        { success: false, error: "Unable to fetch leads." },
        500,
      );
    }

    return jsonResponse<{ provider: Provider; leads: Enquiry[] }>({
      success: true,
      data: {
        provider,
        leads: leads ?? [],
      },
    });
  } catch (error) {
    console.error("GET /api/provider/leads failed", error);

    return jsonResponse(
      { success: false, error: "Unexpected server error." },
      500,
    );
  }
}

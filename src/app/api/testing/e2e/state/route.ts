import { NextRequest, NextResponse } from "next/server";
import {
  isE2eMockMode,
  resetE2eProviderState,
} from "@/lib/testing/e2e-mocks";
import type { ListingTier } from "@/lib/types";

export const dynamic = "force-dynamic";

const LISTING_TIERS = new Set<ListingTier>(["free", "standard", "premium"]);

function jsonResponse<T>(
  body: { success: true; data: T } | { success: false; error: string },
  status = 200,
) {
  return NextResponse.json(body, { status });
}

export async function POST(request: NextRequest) {
  if (!isE2eMockMode()) {
    return jsonResponse({ success: false, error: "Not found." }, 404);
  }

  const payload = (await request.json().catch(() => ({}))) as {
    has_profile?: unknown;
    listing_tier?: unknown;
  };
  const requestedTier =
    typeof payload.listing_tier === "string" &&
    LISTING_TIERS.has(payload.listing_tier as ListingTier)
      ? (payload.listing_tier as ListingTier)
      : undefined;

  resetE2eProviderState({
    hasProfile:
      typeof payload.has_profile === "boolean"
        ? payload.has_profile
        : undefined,
    listingTier: requestedTier,
  });

  return jsonResponse<{ reset: true }>({
    success: true,
    data: { reset: true },
  });
}

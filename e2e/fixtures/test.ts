import { expect, test } from "@playwright/test";
import {
  E2E_AUTH_COOKIE,
  E2E_AUTH_PROVIDER_VALUE,
  E2E_PROVIDER_STATE_COOKIE,
  E2E_PROVIDER_TIER_COOKIE,
  E2E_UNREGISTERED_PROVIDER_VALUE,
} from "../../src/lib/testing/e2e-mocks";
import type { ListingTier } from "../../src/lib/types";

export { expect, test };

export const responsiveViewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 },
] as const;

export async function expectNoHorizontalOverflow(page: {
  evaluate: <T>(pageFunction: () => T | Promise<T>) => Promise<T>;
}) {
  const overflowPixels = await page.evaluate(() => {
    const scrollWidth = Math.max(
      document.body.scrollWidth,
      document.documentElement.scrollWidth,
    );

    return scrollWidth - window.innerWidth;
  });

  expect(overflowPixels).toBeLessThanOrEqual(2);
}

export function isLocalMockE2eRun() {
  return !process.env.E2E_BASE_URL;
}

export function e2eAuthCookieHeader() {
  return `${E2E_AUTH_COOKIE}=${E2E_AUTH_PROVIDER_VALUE}`;
}

export async function authenticateProviderContext(
  context: {
    addCookies: (cookies: Array<{
      name: string;
      value: string;
      domain: string;
      path: string;
      httpOnly: boolean;
      secure: boolean;
      sameSite: "Lax";
    }>) => Promise<void>;
  },
  baseURL: string | undefined,
  options?: { unregistered?: boolean; listingTier?: ListingTier },
) {
  const url = new URL(baseURL ?? "http://127.0.0.1:3000");
  const cookies = [
    {
      name: E2E_AUTH_COOKIE,
      value: E2E_AUTH_PROVIDER_VALUE,
      domain: url.hostname,
      path: "/",
      httpOnly: true,
      secure: url.protocol === "https:",
      sameSite: "Lax" as const,
    },
  ];

  if (options?.unregistered) {
    cookies.push({
      name: E2E_PROVIDER_STATE_COOKIE,
      value: E2E_UNREGISTERED_PROVIDER_VALUE,
      domain: url.hostname,
      path: "/",
      httpOnly: true,
      secure: url.protocol === "https:",
      sameSite: "Lax" as const,
    });
  }

  if (options?.listingTier) {
    cookies.push({
      name: E2E_PROVIDER_TIER_COOKIE,
      value: options.listingTier,
      domain: url.hostname,
      path: "/",
      httpOnly: true,
      secure: url.protocol === "https:",
      sameSite: "Lax" as const,
    });
  }

  await context.addCookies(cookies);
}

export async function resetE2eProviderState(
  request: {
    post: (
      url: string,
      options: { data: { has_profile?: boolean; listing_tier?: ListingTier } },
    ) => Promise<{ ok: () => boolean }>;
  },
  options?: { hasProfile?: boolean; listingTier?: ListingTier },
) {
  if (!isLocalMockE2eRun()) {
    return;
  }

  const response = await request.post("/api/testing/e2e/state", {
    data: {
      has_profile: options?.hasProfile,
      listing_tier: options?.listingTier,
    },
  });

  expect(response.ok()).toBe(true);
}

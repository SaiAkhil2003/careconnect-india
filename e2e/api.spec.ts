import Stripe from "stripe";
import { PRIVATE_PROVIDER_FIELDS } from "../src/lib/providers/public";
import {
  E2E_PROVIDER_ID,
  E2E_VISAKHAPATNAM_CITY,
} from "../src/lib/testing/e2e-mocks";
import { expect, test } from "./fixtures/test";

const localMockServer = !process.env.E2E_BASE_URL;
const webhookSecret = "whsec_careconnect_e2e";

function expectNoPrivateProviderFields(provider: Record<string, unknown>) {
  for (const field of PRIVATE_PROVIDER_FIELDS) {
    expect(provider).not.toHaveProperty(field);
  }
}

function stripeSignature(payload: string) {
  const stripe = new Stripe("sk_test_careconnect_e2e");

  return stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });
}

test.describe("public API routes", () => {
  test("GET /api/cities returns active cities only", async ({ request }) => {
    const response = await request.get("/api/cities");
    expect(response.ok()).toBe(true);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.cities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: E2E_VISAKHAPATNAM_CITY.slug,
          name: E2E_VISAKHAPATNAM_CITY.name,
        }),
      ]),
    );
    expect(
      body.data.cities.some((city: { slug: string }) => city.slug === "hyderabad"),
    ).toBe(false);
  });

  test("GET /api/providers returns city-scoped active providers and public fields", async ({
    request,
  }) => {
    const response = await request.get("/api/providers?city=visakhapatnam");
    expect(response.ok()).toBe(true);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.city.slug).toBe("visakhapatnam");
    expect(body.data.providers).toHaveLength(2);

    for (const provider of body.data.providers) {
      expect(provider.city).toBe("Visakhapatnam");
      expectNoPrivateProviderFields(provider);
    }

    expect(
      body.data.providers.some(
        (provider: { provider_name: string }) =>
          provider.provider_name === "Inactive Vizag Care",
      ),
    ).toBe(false);
  });

  test("GET /api/providers validates missing city and malformed filters", async ({
    request,
  }) => {
    const missingCity = await request.get("/api/providers");
    expect(missingCity.ok()).toBe(true);
    const missingCityBody = await missingCity.json();
    expect(missingCityBody.data.providers).toEqual([]);
    expect(missingCityBody.data.message).toMatch(/City is required/i);

    const invalidService = await request.get(
      "/api/providers?city=visakhapatnam&service_type=bad",
    );
    expect(invalidService.status()).toBe(400);

    const invalidTier = await request.get(
      "/api/providers?city=visakhapatnam&tier=enterprise",
    );
    expect(invalidTier.status()).toBe(400);
  });

  test("GET /api/providers applies service, area, language, verified, and tier filters", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/providers?city=visakhapatnam&service_type=home_care&area=MVP%20Colony&language=English&verified=true&tier=premium",
    );
    expect(response.ok()).toBe(true);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.providers).toHaveLength(1);
    expect(body.data.providers[0]).toMatchObject({
      provider_name: "Seaside Elder Care",
      slug: "seaside-elder-care",
      city: "Visakhapatnam",
      is_verified: true,
      listing_tier: "premium",
    });
    expectNoPrivateProviderFields(body.data.providers[0]);
  });

  test("GET /api/providers/[slug] returns active profile and excludes inactive slug", async ({
    request,
  }) => {
    const response = await request.get("/api/providers/seaside-elder-care");
    expect(response.ok()).toBe(true);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.provider.provider_name).toBe("Seaside Elder Care");
    expectNoPrivateProviderFields(body.data.provider);

    const inactive = await request.get("/api/providers/inactive-vizag-care");
    expect(inactive.status()).toBe(404);
  });

  test("POST /api/enquiries rejects malformed submissions and accepts valid enquiry in mock mode", async ({
    request,
  }) => {
    const malformedJson = await request.post("/api/enquiries", {
      data: "{not-json",
      headers: { "Content-Type": "application/json" },
    });
    expect(malformedJson.status()).toBe(400);

    const missingFields = await request.post("/api/enquiries", {
      data: { provider_id: E2E_PROVIDER_ID },
    });
    expect(missingFields.status()).toBe(400);

    const invalidProvider = await request.post("/api/enquiries", {
      data: {
        provider_id: "not-a-uuid",
        family_name: "Anita Rao",
        family_phone: "+91 98888 77777",
        service_needed: "home_care",
      },
    });
    expect(invalidProvider.status()).toBe(400);

    const valid = await request.post("/api/enquiries", {
      data: {
        provider_id: E2E_PROVIDER_ID,
        family_name: "Anita Rao",
        family_phone: "+91 98888 77777",
        family_email: "anita@example.com",
        service_needed: "home_care",
        message: "Need home care support.",
      },
    });
    expect(valid.ok()).toBe(true);
    const body = await valid.json();
    expect(body.success).toBe(true);
    expect(body.data.enquiry.family_name).toBe("Anita Rao");
    expect(body.data.delivery_summary.provider_delivery_success).toBe(false);
  });
});

test.describe("authenticated provider API routes", () => {
  test("anonymous provider dashboard APIs are rejected", async ({ request }) => {
    const routes = [
      "/api/provider/me",
      "/api/provider/leads",
      "/api/provider/analytics",
    ];

    for (const route of routes) {
      const response = await request.get(route);
      expect(response.status(), route).toBe(401);
    }

    const patchProfile = await request.patch("/api/provider/me", {
      data: { provider_name: "Blocked" },
    });
    expect(patchProfile.status()).toBe(401);

    const register = await request.post("/api/provider/register", {
      data: { provider_name: "Blocked" },
    });
    expect(register.status()).toBe(401);
  });
});

test.describe("Stripe webhook route", () => {
  test.skip(!localMockServer, "Stripe webhook mock tests run only on local mock server.");

  test("rejects invalid signatures", async ({ request }) => {
    const response = await request.post("/api/webhooks/stripe", {
      data: "{}",
      headers: { "stripe-signature": "invalid" },
    });

    expect(response.status()).toBe(400);
  });

  test("handles checkout completion, missing metadata, subscription update, and deletion", async ({
    request,
  }) => {
    const events = [
      {
        id: "evt_checkout_completed",
        object: "event",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_completed",
            object: "checkout.session",
            customer: "cus_e2e",
            subscription: "sub_e2e",
            metadata: {
              provider_id: E2E_PROVIDER_ID,
              target_tier: "premium",
            },
          },
        },
      },
      {
        id: "evt_checkout_missing_metadata",
        object: "event",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_missing_metadata",
            object: "checkout.session",
            metadata: {},
          },
        },
      },
      {
        id: "evt_subscription_updated",
        object: "event",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_e2e",
            object: "subscription",
            status: "active",
            items: {
              object: "list",
              data: [{ price: { id: "price_standard_e2e" } }],
            },
          },
        },
      },
      {
        id: "evt_subscription_deleted",
        object: "event",
        type: "customer.subscription.deleted",
        data: {
          object: {
            id: "sub_e2e",
            object: "subscription",
            status: "canceled",
            items: { object: "list", data: [] },
          },
        },
      },
    ];

    for (const event of events) {
      const payload = JSON.stringify(event);
      const response = await request.post("/api/webhooks/stripe", {
        data: payload,
        headers: {
          "content-type": "application/json",
          "stripe-signature": stripeSignature(payload),
        },
      });

      expect(response.ok(), event.type).toBe(true);
      const body = await response.json();
      expect(body).toMatchObject({
        success: true,
        data: { received: true },
      });
    }
  });
});

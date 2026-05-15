import Stripe from "stripe";
import {
  E2E_AUTH_PROVIDER_ID,
  E2E_PROVIDER_STATE_COOKIE,
  E2E_UNREGISTERED_PROVIDER_VALUE,
} from "../src/lib/testing/e2e-mocks";
import {
  authenticateProviderContext,
  e2eAuthCookieHeader,
  expect,
  isLocalMockE2eRun,
  resetE2eProviderState,
  test,
} from "./fixtures/test";

const webhookSecret = "whsec_careconnect_e2e";

function stripeSignature(payload: string) {
  const stripe = new Stripe("sk_test_careconnect_e2e");

  return stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });
}

test.describe("authenticated provider E2E", () => {
  test.skip(
    !isLocalMockE2eRun(),
    "Authenticated provider mock tests run locally with E2E_TEST_MODE=true. Staging requires a real Clerk test session and seeded Supabase data.",
  );

  test.describe.configure({ mode: "serial" });

  test("provider registration validates required fields and submits on the Free plan", async ({
    baseURL,
    context,
    page,
    request,
  }) => {
    await resetE2eProviderState(request, { hasProfile: false });
    await authenticateProviderContext(context, baseURL, { unregistered: true });

    await page.goto("/register-provider");
    await expect(
      page.getByRole("heading", { name: "Provider registration" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Submit provider profile" }).click();
    const validationMessage = await page
      .getByLabel(/Provider name/)
      .evaluate((input: HTMLInputElement) => input.validationMessage);
    expect(validationMessage.length).toBeGreaterThan(0);

    await page.getByLabel(/Provider name/).fill("CareConnect Registered E2E Provider");
    await page.getByRole("combobox", { name: /Provider city/ }).fill("Visakhapatnam");
    await page
      .getByRole("button", { name: /Visakhapatnam, Andhra Pradesh/ })
      .click();
    await page.getByRole("checkbox", { name: "Home Care" }).check();
    await page.getByRole("checkbox", { name: "Physiotherapy" }).check();
    await page.getByRole("checkbox", { name: "MVP Colony" }).check();
    await page.getByRole("checkbox", { name: "Dwaraka Nagar" }).check();
    await page.getByRole("checkbox", { name: "English" }).check();
    await page.getByRole("checkbox", { name: "Telugu" }).check();
    await page.getByLabel("Phone *").fill("+91 94444 33333");
    await page
      .getByRole("textbox", { name: "Email", exact: true })
      .fill("registered-e2e@example.com");
    await page.getByLabel("Pricing range").selectOption("mid");

    await page.getByRole("button", { name: "Submit provider profile" }).click();

    await expect(
      page.getByRole("heading", {
        name: "Provider profile submitted successfully.",
      }),
    ).toBeVisible();
    await expect(page.getByText(/submitted on the Free plan/i)).toBeVisible();
  });

  test("billing shows Free as the default tier without starting checkout", async ({
    baseURL,
    context,
    page,
    request,
  }) => {
    await resetE2eProviderState(request, {
      hasProfile: true,
      listingTier: "free",
    });
    await authenticateProviderContext(context, baseURL, { listingTier: "free" });

    await page.goto("/dashboard/billing");

    await expect(page.getByRole("heading", { name: "Billing" })).toBeVisible();
    await expect(page.getByText(/Current listing tier:\s*Free/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Current plan" })).toBeDisabled();
  });

  test("Standard tier starts Stripe test checkout without real charges", async ({
    baseURL,
    context,
    page,
    request,
  }) => {
    await resetE2eProviderState(request, {
      hasProfile: true,
      listingTier: "free",
    });
    await authenticateProviderContext(context, baseURL, { listingTier: "free" });

    await page.goto("/dashboard/billing");
    const checkoutResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/provider/billing/checkout") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Upgrade to Standard" }).click();

    expect((await checkoutResponse).ok()).toBe(true);
    await expect(page).toHaveURL(/\/dashboard\/billing\?success=true&e2e_tier=standard/);
    await expect(page.getByText(/Checkout completed/i)).toBeVisible();
  });

  test("Premium tier starts Stripe test checkout without real charges", async ({
    baseURL,
    context,
    page,
    request,
  }) => {
    await resetE2eProviderState(request, {
      hasProfile: true,
      listingTier: "free",
    });
    await authenticateProviderContext(context, baseURL, { listingTier: "free" });

    await page.goto("/dashboard/billing");
    const checkoutResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/provider/billing/checkout") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Upgrade to Premium" }).click();

    expect((await checkoutResponse).ok()).toBe(true);
    await expect(page).toHaveURL(/\/dashboard\/billing\?success=true&e2e_tier=premium/);
    await expect(page.getByText(/Checkout completed/i)).toBeVisible();
  });

  test("Stripe webhook mock updates listing tier behavior", async ({
    request,
  }) => {
    await resetE2eProviderState(request, {
      hasProfile: true,
      listingTier: "free",
    });

    const checkoutCompletedPayload = JSON.stringify({
      id: "evt_auth_checkout_completed",
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_auth_completed",
          object: "checkout.session",
          customer: "cus_e2e_provider",
          subscription: "sub_e2e_provider",
          metadata: {
            provider_id: E2E_AUTH_PROVIDER_ID,
            target_tier: "premium",
          },
        },
      },
    });

    const checkoutCompleted = await request.post("/api/webhooks/stripe", {
      data: checkoutCompletedPayload,
      headers: {
        "content-type": "application/json",
        "stripe-signature": stripeSignature(checkoutCompletedPayload),
      },
    });
    expect(checkoutCompleted.ok()).toBe(true);

    const afterCheckout = await request.get("/api/provider/me", {
      headers: { cookie: e2eAuthCookieHeader() },
    });
    expect((await afterCheckout.json()).data.provider.listing_tier).toBe("premium");

    const subscriptionUpdatedPayload = JSON.stringify({
      id: "evt_auth_subscription_updated",
      object: "event",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_e2e_provider",
          object: "subscription",
          status: "active",
          items: {
            object: "list",
            data: [{ price: { id: "price_standard_e2e" } }],
          },
        },
      },
    });

    const subscriptionUpdated = await request.post("/api/webhooks/stripe", {
      data: subscriptionUpdatedPayload,
      headers: {
        "content-type": "application/json",
        "stripe-signature": stripeSignature(subscriptionUpdatedPayload),
      },
    });
    expect(subscriptionUpdated.ok()).toBe(true);

    const afterUpdate = await request.get("/api/provider/me", {
      headers: { cookie: e2eAuthCookieHeader() },
    });
    expect((await afterUpdate.json()).data.provider.listing_tier).toBe("standard");

    const subscriptionDeletedPayload = JSON.stringify({
      id: "evt_auth_subscription_deleted",
      object: "event",
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_e2e_provider",
          object: "subscription",
          status: "canceled",
          items: { object: "list", data: [] },
        },
      },
    });

    const subscriptionDeleted = await request.post("/api/webhooks/stripe", {
      data: subscriptionDeletedPayload,
      headers: {
        "content-type": "application/json",
        "stripe-signature": stripeSignature(subscriptionDeletedPayload),
      },
    });
    expect(subscriptionDeleted.ok()).toBe(true);

    const afterDelete = await request.get("/api/provider/me", {
      headers: { cookie: e2eAuthCookieHeader() },
    });
    expect((await afterDelete.json()).data.provider.listing_tier).toBe("free");
  });

  test("provider dashboard, profile edit, leads, and analytics load for authenticated provider", async ({
    baseURL,
    context,
    page,
    request,
  }) => {
    await resetE2eProviderState(request, {
      hasProfile: true,
      listingTier: "premium",
    });
    await authenticateProviderContext(context, baseURL, { listingTier: "premium" });

    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", { name: "CareConnect E2E Provider" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Provider summary" })).toBeVisible();
    await expect(page.getByText("Active", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Verified", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Premium", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Total leads").first()).toBeVisible();
    await expect(page.getByText("2", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Total profile views").first()).toBeVisible();
    await expect(page.getByText("42", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Anita Rao")).toBeVisible();
    await expect(page.getByText("+91 98888 77777")).toBeVisible();

    await page.goto("/dashboard/profile");
    await expect(
      page.getByRole("heading", { name: "Edit provider profile" }),
    ).toBeVisible();
    await page.getByLabel(/Provider name/).fill("CareConnect E2E Provider Updated");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Profile updated successfully.")).toBeVisible();

    await page.goto("/dashboard/leads");
    await expect(page.getByRole("heading", { name: "Leads" })).toBeVisible();
    await expect(page.getByText("Anita Rao")).toBeVisible();
    await expect(page.getByText("+91 98888 77777")).toBeVisible();
    await expect(page.getByText(/15 May 2026/)).toBeVisible();
    await expect(page.getByText("Rahul Menon")).toBeVisible();
    await expect(page.getByText("Other Provider Family")).toHaveCount(0);

    await page.goto("/dashboard/analytics");
    await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible();
    await expect(page.getByText("Total profile views").first()).toBeVisible();
    await expect(page.getByText("42", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Total enquiries").first()).toBeVisible();
    await expect(page.getByText("3", { exact: true }).first()).toBeVisible();
  });

  test("provider leads API returns only the authenticated provider's leads", async ({
    request,
  }) => {
    await resetE2eProviderState(request, {
      hasProfile: true,
      listingTier: "premium",
    });

    const anonymous = await request.get("/api/provider/leads");
    expect(anonymous.status()).toBe(401);

    const response = await request.get("/api/provider/leads", {
      headers: { cookie: e2eAuthCookieHeader() },
    });
    expect(response.ok()).toBe(true);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.provider.id).toBe(E2E_AUTH_PROVIDER_ID);
    expect(body.data.leads).toHaveLength(2);
    expect(
      body.data.leads.every(
        (lead: { provider_id: string }) => lead.provider_id === E2E_AUTH_PROVIDER_ID,
      ),
    ).toBe(true);
    expect(
      body.data.leads.some(
        (lead: { family_name: string }) =>
          lead.family_name === "Other Provider Family",
      ),
    ).toBe(false);
  });

  test("unregistered provider cookie is scoped to the current context only", async ({
    baseURL,
    context,
    page,
    request,
  }) => {
    await resetE2eProviderState(request, { hasProfile: true });
    await authenticateProviderContext(context, baseURL, { unregistered: true });

    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", {
        name: "You have not created a provider profile yet.",
      }),
    ).toBeVisible();

    const cookies = await context.cookies();
    expect(
      cookies.some(
        (cookie) =>
          cookie.name === E2E_PROVIDER_STATE_COOKIE &&
          cookie.value === E2E_UNREGISTERED_PROVIDER_VALUE,
      ),
    ).toBe(true);
  });
});

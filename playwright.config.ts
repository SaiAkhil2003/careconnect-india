import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3000);
const localBaseUrl = `http://127.0.0.1:${port}`;
const baseURL = process.env.E2E_BASE_URL ?? localBaseUrl;
const useExternalServer = Boolean(process.env.E2E_BASE_URL);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: useExternalServer
    ? undefined
    : {
        command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
        url: localBaseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          E2E_TEST_MODE: "true",
          NEXT_PUBLIC_APP_URL: localBaseUrl,
          STRIPE_SECRET_KEY: "sk_test_careconnect_e2e",
          STRIPE_WEBHOOK_SECRET: "whsec_careconnect_e2e",
          STRIPE_STANDARD_PRICE_ID: "price_standard_e2e",
          STRIPE_PREMIUM_PRICE_ID: "price_premium_e2e",
        },
      },
});

import {
  authenticateProviderContext,
  expect,
  expectNoHorizontalOverflow,
  isLocalMockE2eRun,
  responsiveViewports,
  test,
} from "./fixtures/test";

const publicPages = [
  {
    path: "/",
    heading: /find trusted aged care support across india/i,
  },
  {
    path: "/search?city=visakhapatnam",
    heading: /Aged care providers in Visakhapatnam/i,
  },
  {
    path: "/providers/seaside-elder-care",
    heading: /Seaside Elder Care/i,
  },
] as const;

test.describe("responsive public smoke tests", () => {
  for (const viewport of responsiveViewports) {
    for (const pageCase of publicPages) {
      test(`${pageCase.path} renders at ${viewport.name} width`, async ({
        page,
      }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await page.goto(pageCase.path);

        await expect(page.getByRole("heading", { name: pageCase.heading }).first()).toBeVisible();
        await expectNoHorizontalOverflow(page);
      });
    }
  }
});

test.describe("responsive authenticated provider smoke tests", () => {
  test.skip(
    !isLocalMockE2eRun() && !process.env.CLERK_E2E_SESSION_COOKIE,
    "Authenticated provider responsive smoke tests require local E2E_TEST_MODE or CLERK_E2E_SESSION_COOKIE.",
  );

  test.beforeEach(async ({ baseURL, context }) => {
    if (isLocalMockE2eRun()) {
      await authenticateProviderContext(context, baseURL, {
        listingTier: "premium",
      });
      return;
    }

    const url = new URL(baseURL ?? "http://127.0.0.1:3000");
    await context.addCookies([
      {
        name: "__session",
        value: process.env.CLERK_E2E_SESSION_COOKIE ?? "",
        domain: url.hostname,
        path: "/",
        httpOnly: true,
        secure: url.protocol === "https:",
        sameSite: "Lax",
      },
    ]);
  });

  for (const viewport of responsiveViewports) {
    test(`provider registration and dashboard render at ${viewport.name} width`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      await page.goto("/register-provider");
      await expect(
        page.getByRole("heading", { name: /Provider registration/i }),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);

      await page.goto("/dashboard");
      await expect(
        page.getByRole("heading", { name: /Provider dashboard|created a provider profile|CareConnect E2E Provider/i }),
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }
});

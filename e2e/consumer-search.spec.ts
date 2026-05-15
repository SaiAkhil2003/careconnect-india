import { expect, test } from "./fixtures/test";

test.describe("consumer homepage and city-scoped search", () => {
  test("homepage supports manual city selection and service search", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: /find trusted aged care support across india/i,
      }),
    ).toBeVisible();

    await page.getByRole("combobox", { name: "City" }).fill("Visakhapatnam");
    await page
      .getByRole("button", { name: /Visakhapatnam, Andhra Pradesh/i })
      .click();
    await page.getByLabel("Service type").selectOption("home_care");
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page).toHaveURL(/\/search\?.*city=visakhapatnam/);
    await expect(page).toHaveURL(/\/search\?.*service_type=home_care/);
    await expect(
      page.getByRole("heading", {
        name: /Home care providers in Visakhapatnam/i,
      }),
    ).toBeVisible();
    await expect(page.getByText("Seaside Elder Care")).toBeVisible();
    await expect(page.getByText("Bengaluru Senior Living")).toHaveCount(0);
  });

  test("city selector only exposes active cities and shows unsupported city messaging", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("combobox", { name: "City" }).fill("Hyderabad");

    await expect(
      page.getByText("CareConnect is not active in this city yet."),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Hyderabad, Telangana/i }),
    ).toHaveCount(0);
  });

  test("search results are scoped to selected city and exclude inactive providers", async ({
    page,
  }) => {
    await page.goto("/search?city=visakhapatnam");

    await expect(
      page.getByRole("heading", {
        name: /Aged care providers in Visakhapatnam/i,
      }),
    ).toBeVisible();
    await expect(page.getByText("2 providers found")).toBeVisible();
    await expect(page.getByText("Seaside Elder Care")).toBeVisible();
    await expect(page.getByText("Vizag Companion Care")).toBeVisible();
    await expect(page.getByText("Bengaluru Senior Living")).toHaveCount(0);
    await expect(page.getByText("Inactive Vizag Care")).toHaveCount(0);
  });

  test("search filters work for service, area, language, verified status, and tier", async ({
    page,
  }) => {
    await page.goto("/search?city=visakhapatnam");

    await page.getByLabel("Service type").selectOption("home_care");
    await page.getByLabel("Area/suburb").selectOption("MVP Colony");
    await page.getByLabel("Language").selectOption("English");
    await page.getByLabel("Listing tier").selectOption("premium");
    await page.getByLabel("Verified providers only").check();
    await page.getByRole("button", { name: "Apply filters" }).click();

    await expect(page).toHaveURL(/service_type=home_care/);
    await expect(page).toHaveURL(/area=MVP\+Colony|area=MVP%20Colony/);
    await expect(page).toHaveURL(/language=English/);
    await expect(page).toHaveURL(/tier=premium/);
    await expect(page).toHaveURL(/verified=true/);
    await expect(page.getByText("1 provider found")).toBeVisible();
    await expect(page.getByText("Seaside Elder Care")).toBeVisible();
    await expect(page.getByText("Vizag Companion Care")).toHaveCount(0);
  });

  test("unsupported direct city search shows waitlist path", async ({ page }) => {
    await page.goto("/search?city=hyderabad");

    await expect(
      page.getByRole("heading", {
        name: /CareConnect is not active in this city yet/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Join waitlist" })).toBeVisible();
  });
});

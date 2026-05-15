import { expect, test } from "./fixtures/test";

test.describe("provider profile and enquiry flow", () => {
  test("provider profile loads by slug with SSR content and SEO metadata", async ({
    page,
    request,
  }) => {
    const response = await request.get("/providers/seaside-elder-care");
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html).toContain("Seaside Elder Care");
    expect(html).toContain("Send Enquiry");

    await page.goto("/providers/seaside-elder-care");

    await expect(page).toHaveTitle(/Seaside Elder Care.*Visakhapatnam/i);
    await expect(
      page.getByRole("heading", { name: "Seaside Elder Care" }),
    ).toBeVisible();
    const servicesSection = page
      .getByRole("heading", { name: "Services" })
      .locator("xpath=ancestor::section[1]");
    const areasSection = page
      .getByRole("heading", { name: "Areas Covered" })
      .locator("xpath=ancestor::section[1]");
    const languagesSection = page
      .getByRole("heading", { name: "Languages" })
      .locator("xpath=ancestor::section[1]");
    const contactSection = page
      .getByRole("heading", { name: "Contact Details" })
      .locator("xpath=ancestor::section[1]");

    await expect(page.getByText("Verified", { exact: true })).toBeVisible();
    await expect(page.getByText("Premium listing")).toBeVisible();
    await expect(servicesSection.getByText("Home Care", { exact: true })).toBeVisible();
    await expect(servicesSection.getByText("Physiotherapy", { exact: true })).toBeVisible();
    await expect(areasSection.getByText("MVP Colony", { exact: true })).toBeVisible();
    await expect(languagesSection.getByText("English", { exact: true })).toBeVisible();
    await expect(languagesSection.getByText("Telugu", { exact: true })).toBeVisible();
    await expect(contactSection.getByText("+91 98765 43210")).toBeVisible();
    await expect(contactSection.getByText("care@seaside.example")).toBeVisible();
    await expect(contactSection.getByText("10 Beach Road, MVP Colony")).toBeVisible();
    await expect(contactSection.getByText("Mid Range", { exact: true })).toBeVisible();
  });

  test("family can submit an enquiry without sending real notifications", async ({
    page,
  }) => {
    await page.goto("/providers/seaside-elder-care");

    await page.getByLabel("Family name").fill("Anita Rao");
    await page.getByLabel("Phone number").fill("+91 98888 77777");
    await page.getByLabel("Email (optional)").fill("anita@example.com");
    await page.getByLabel("Service needed").selectOption("home_care");
    await page
      .getByLabel("Message (optional)")
      .fill("Need home care support for my father next week.");
    await page.getByRole("button", { name: "Submit enquiry" }).click();

    await expect(
      page.getByText(
        "Your enquiry has been submitted. The provider will contact you directly.",
      ),
    ).toBeVisible();
  });
});

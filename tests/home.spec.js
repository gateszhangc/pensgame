const { test, expect } = require("@playwright/test");

test.describe("Pens Game site", () => {
  test("desktop homepage renders metadata, featured game, and schedule groups", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Pens Game Schedule/i);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://pensgame.lol/");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Pittsburgh Penguins game hub/i);
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "Pens Game");
    await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute("content", /black and gold social card/i);
    await expect(page.getByRole("heading", { name: /Pens Game Schedule, Time, and Official Penguins Links/i })).toBeVisible();
    await expect(page.locator("body")).toHaveAttribute("data-state", "ready");
    await expect(page.locator("[data-featured-card]")).toContainText(/Next game|Latest result/);
    await expect(page.getByText(/Independent, unofficial fan-made guide/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Common Pens Game questions/i })).toBeVisible();

    const scheduleCards = page.locator(".schedule-card");
    await expect(scheduleCards.first()).toBeVisible();
    expect(await scheduleCards.count()).toBeGreaterThan(10);

    const monthGroups = page.locator(".month-group");
    expect(await monthGroups.count()).toBeGreaterThan(1);

    const structuredDataTags = page.locator('script[type="application/ld+json"]');
    expect(await structuredDataTags.count()).toBeGreaterThanOrEqual(3);
  });

  test("mobile layout stays within viewport and keeps official links reachable", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true
    });
    const page = await context.newPage();

    await page.goto("/");
    await expect(page.locator("body")).toHaveAttribute("data-state", "ready");
    await page.getByRole("link", { name: "Official Links" }).click();
    await expect(page.locator("#watch")).toBeInViewport();

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - window.innerWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);

    await expect(page.getByRole("link", { name: "Official schedule" }).first()).toBeVisible();
    await expect(page.locator(".schedule-card").first()).toBeVisible();
    await context.close();
  });
});

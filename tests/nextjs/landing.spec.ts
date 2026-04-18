import { test, expect } from "@playwright/test";

test.describe("Next.js Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("page loads with OwnRadio title", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("OwnRadio");
  });

  test("hero section shows station, listener and DJ counts", async ({
    page,
  }) => {
    // Stats row: "Stations", "Listeners", "DJs" labels
    await expect(page.getByText("Stations", { exact: true })).toBeVisible();
    await expect(page.getByText("Listeners", { exact: true })).toBeVisible();
    await expect(page.getByText("DJs", { exact: true })).toBeVisible();

    // Each stat has a numeric value rendered above its label
    const statValues = page.locator("span.text-brand-pink.text-2xl");
    await expect(statValues).toHaveCount(3);
  });

  test("Featured Stations section is visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Featured Stations" })
    ).toBeVisible();
  });

  test("at least one station card is visible", async ({ page }) => {
    // FeaturedStations renders a Link per station with the station name in it
    const stationCards = page.getByRole("link").filter({
      has: page.locator("p.text-sm.font-bold"),
    });
    await expect(stationCards.first()).toBeVisible();
  });

  test("Top DJs section is visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Top DJs" })
    ).toBeVisible();
  });

  test("Trending Songs section is visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Trending Songs" })
    ).toBeVisible();
  });

  test("login section shows Join the crowd", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Join the crowd" })
    ).toBeVisible();
  });

  test("Continue with Email link navigates to /login", async ({ page }) => {
    await page.getByRole("link", { name: /continue with email/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("clicking a station card navigates to /station/[slug]", async ({
    page,
  }) => {
    // Click the first station card link (Rock Haven is first in mock data)
    const firstCard = page
      .locator("a[href^='/station/']")
      .first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/station\//);
  });
});

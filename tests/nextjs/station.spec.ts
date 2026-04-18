import { test, expect } from "@playwright/test";

test.describe("Next.js Station Page — Rock Haven", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/station/rock-haven");
  });

  test("page loads without crashing", async ({ page }) => {
    await expect(page.locator("body")).not.toContainText("Application error");
  });

  test("station name Rock Haven is visible", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Rock Haven" })).toBeVisible();
  });

  test("audio element exists in the DOM", async ({ page }) => {
    await expect(page.locator("audio")).toBeAttached();
  });

  test("reaction buttons are visible", async ({ page }) => {
    // ReactionBar renders 4 buttons with aria-labels matching "<Type> reaction"
    await expect(page.getByRole("button", { name: /rock reaction/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /heart reaction/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /broken heart reaction/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /party reaction/i })).toBeVisible();
  });

  test("reaction counts are visible numbers", async ({ page }) => {
    // Each reaction button contains a count in a tabular-nums span
    const reactionButtons = page.locator("button[aria-label$=' reaction']");
    await expect(reactionButtons).toHaveCount(4);

    for (let i = 0; i < 4; i++) {
      const countSpan = reactionButtons.nth(i).locator("span.tabular-nums");
      const text = await countSpan.textContent();
      expect(Number(text)).not.toBeNaN();
    }
  });

  test("chat input is disabled for guest with placeholder Log in to chat", async ({
    page,
  }) => {
    const chatInput = page.locator("input[placeholder='Log in to chat']");
    await expect(chatInput).toBeVisible();
    await expect(chatInput).toBeDisabled();
  });

  test("DJ section is visible with DJ name", async ({ page }) => {
    // DJSection renders the DJ name as a <p> element
    await expect(page.getByText("Max Thunder")).toBeVisible();
  });

  test("dot indicators — 4 dots for 4 stations", async ({ page }) => {
    // StationCarousel renders one <span class="rounded-full ..."> per station
    const dots = page.locator("div.absolute.top-3 span.rounded-full");
    await expect(dots).toHaveCount(4);
  });

  test("edge tap right shows Beat Lounge (the next station)", async ({
    page,
  }) => {
    // Rock Haven is index 0 in the carousel (first station).
    // Clicking the "Next station" button moves to Beat Lounge (index 1).
    // The carousel uses local state — URL stays at /station/rock-haven.
    // The button is opacity-0 by default, so we force-click it.
    const nextBtn = page.getByRole("button", { name: "Next station" });
    await nextBtn.click({ force: true });

    // Beat Lounge heading becomes visible (current card)
    await expect(
      page.getByRole("heading", { name: "Beat Lounge" })
    ).toBeVisible({ timeout: 5000 });
  });

  test("edge tap left on Beat Lounge shows Rock Haven again", async ({
    page,
  }) => {
    // Go forward to Beat Lounge first
    await page.getByRole("button", { name: "Next station" }).click({ force: true });
    await expect(page.getByRole("heading", { name: "Beat Lounge" })).toBeVisible();

    // Now go back — Previous station button appears only when index > 0
    const prevBtn = page.getByRole("button", { name: "Previous station" });
    await prevBtn.click({ force: true });

    await expect(
      page.getByRole("heading", { name: "Rock Haven" })
    ).toBeVisible({ timeout: 5000 });
  });
});

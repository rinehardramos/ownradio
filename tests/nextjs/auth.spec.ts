import { test, expect } from "@playwright/test";

test.describe("Next.js Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("login page loads with OwnRadio title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "OwnRadio" })).toBeVisible();
  });

  test("email and password inputs are visible", async ({ page }) => {
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("Sign In button is visible", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /sign in/i })
    ).toBeVisible();
  });

  test("submitting with empty fields triggers native validation", async ({
    page,
  }) => {
    // Both inputs have `required` — browser will prevent submit.
    // Playwright on Chromium: clicking submit with empty required fields
    // does not navigate and no JS error message is shown, but the form
    // stays on the same page (native browser validation fires).
    await page.getByRole("button", { name: /sign in/i }).click();
    // Page should remain on /login (no navigation occurred)
    await expect(page).toHaveURL(/\/login/);
  });

  test("submitting with invalid credentials shows an error message", async ({
    page,
  }) => {
    await page.locator("input[type='email']").fill("baduser@example.com");
    await page.locator("input[type='password']").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Login throws and the error state renders a <p> with the error text
    await expect(page.locator("p.text-red-400")).toBeVisible({ timeout: 8000 });
  });

  test("back button is visible with arrow character", async ({ page }) => {
    // LoginPage renders a button that contains "← Back"
    await expect(page.getByRole("button", { name: /back/i })).toBeVisible();
  });
});

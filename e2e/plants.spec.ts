import { expect, test } from "@playwright/test";

test.describe("Plant list page", () => {
  test("shows the Shui title", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Shui")).toBeVisible();
  });

  test("shows empty state when no plants exist", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("No plants yet. Add your first plant below!")).toBeVisible();
  });

  test("has a menu button", async ({ page }) => {
    await page.goto("/");
    // The hamburger menu button
    const menuButton = page
      .getByRole("button")
      .filter({ has: page.locator("svg") })
      .first();
    await expect(menuButton).toBeVisible();
  });

  test("menu button has correct ARIA attributes for accessibility", async ({ page }) => {
    await page.goto("/");
    const menuButton = page.locator('button[aria-haspopup="menu"]');
    await expect(menuButton).toBeVisible();
    await expect(menuButton).toHaveAttribute("data-state", "closed");
  });
});

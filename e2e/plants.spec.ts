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

test.describe("Plant watering", () => {
  let plantId: number;

  test.afterEach(async ({ request }) => {
    if (plantId) {
      await request.delete(`/api/plants/${plantId}`);
      plantId = 0;
    }
  });

  test("add a plant, water it, and verify it was watered today", async ({ page }) => {
    await page.goto("/");

    // Intercept the POST /api/plants response to capture the new plant's ID for cleanup
    let capturedId = 0;
    page.on("response", async (response) => {
      if (response.url().includes("/api/plants") && response.request().method() === "POST") {
        const body = await response.json().catch(() => null);
        if (body?.id) capturedId = body.id;
      }
    });

    // Open the dropdown menu and add a new plant via the form
    const menuButton = page.locator('button[aria-haspopup="menu"]');
    await menuButton.click();
    const nameInput = page.getByPlaceholder("Add a new plant");
    await nameInput.fill("E2E Test Plant");
    await page.locator('form button[type="submit"]').click();

    // Wait for the plant to appear in the list, then close the dropdown
    await expect(page.getByText("E2E Test Plant")).toBeVisible();
    plantId = capturedId;
    await page.keyboard.press("Escape");

    // Click the plant name to open the actions dialog
    const plantButton = page.getByRole("listitem").getByRole("button", { name: "E2E Test Plant" });
    await plantButton.click();

    // Click the water button
    const waterButton = page.getByRole("button", { name: "Water plant" });
    await expect(waterButton).toBeEnabled();
    await waterButton.click();

    // Dialog closes and page reloads after watering
    await expect(waterButton).not.toBeVisible();
    await page.waitForLoadState("networkidle");

    // The plant row should now show "Today" as the last watered timestamp
    await expect(page.getByText("Today")).toBeVisible();
  });
});

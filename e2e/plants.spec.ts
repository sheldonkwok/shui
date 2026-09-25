import { expect, test } from "@playwright/test";

test.describe("Plant list page", () => {
  test("shows the Shui brand mark", async ({ page, request }) => {
    // The brand mark sits inside the paper panel, which only renders when there's
    // at least one plant, so seed one before asserting.
    const res = await request.post("/api/plants", { data: { name: "E2E Brand Mark Plant" } });
    const { id } = await res.json();
    try {
      await page.goto("/");
      await expect(page.getByAltText("Shui")).toBeVisible();
    } finally {
      await request.delete(`/api/plants/${id}`);
    }
  });

  test("shows empty state when no plants exist", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("No plants yet. Add your first plant above!")).toBeVisible();
  });

  test("has an add-plant sprout button", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Add a new plant" })).toBeVisible();
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

  test("last watered in action dialog shows 0d after watering today", async ({ page, request }) => {
    const res = await request.post("/api/plants", { data: { name: "E2E Dialog Watered Plant" } });
    const { id } = await res.json();
    plantId = id;

    await request.post(`/api/plants/${id}/water`, { data: { fertilized: false } });

    await page.goto("/");

    // Plant list shows "Today"
    const plantRow = page.getByRole("listitem").filter({ hasText: "E2E Dialog Watered Plant" });
    await expect(plantRow.getByText("Today")).toBeVisible();

    // Open the action dialog
    await plantRow.getByRole("button", { name: "E2E Dialog Watered Plant" }).click();

    // Dialog should show "0d" for last watered (above the Water plant button)
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("0d")).toBeVisible();
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

    // Click the sprout button to reveal the inline add-plant field, then submit with Enter
    const sproutButton = page.getByRole("button", { name: "Add a new plant" });
    await sproutButton.click();
    const nameInput = page.getByPlaceholder("Add a new plant");
    await nameInput.fill("E2E Test Plant");
    await nameInput.press("Enter");

    // Wait for the plant to appear in the list, then close the (still open) inline field
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

test.describe("Watering editing", () => {
  let plantId: number;

  test.afterEach(async ({ request }) => {
    if (plantId) {
      await request.delete(`/api/plants/${plantId}`);
      plantId = 0;
    }
  });

  test("edit and delete a watering from the calendar rail", async ({ page, request }) => {
    const res = await request.post("/api/plants", { data: { name: "E2E Watering Edit Plant" } });
    const { id } = await res.json();
    plantId = id;

    await request.post(`/api/plants/${id}/water`, { data: { fertilized: false } });

    await page.goto("/");

    const plantRow = page.getByRole("listitem").filter({ hasText: "E2E Watering Edit Plant" });
    await plantRow.getByRole("button", { name: "E2E Watering Edit Plant" }).click();

    const dialog = page.getByRole("dialog");
    const wateringCell = dialog.getByRole("button", { name: /^Edit watering on / });
    await expect(wateringCell).toHaveCount(1);
    await wateringCell.click();

    // The dialog becomes an edit window: the plant actions are gone and the
    // watering's own stats are shown.
    const backButton = dialog.getByRole("button", { name: "Back to plant actions" });
    await expect(backButton).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Water plant" })).toHaveCount(0);
    await expect(dialog.getByText("Today")).toBeVisible();
    const fertilizeToggle = dialog.getByRole("button", { name: "Toggle fertilize" });
    await expect(fertilizeToggle).toHaveAttribute("aria-pressed", "false");

    // Fertilizer can be toggled on the watering itself.
    await fertilizeToggle.click();
    await expect(fertilizeToggle).toHaveAttribute("aria-pressed", "true");

    // Back returns to the original modal.
    await backButton.click();
    await expect(dialog.getByRole("button", { name: "Water plant" })).toBeVisible();

    // Deleting the watering empties the rail and returns to the actions view.
    await dialog.getByRole("button", { name: /^Edit watering on / }).click();
    await dialog.getByRole("button", { name: "Delete watering" }).click();
    await expect(dialog.getByRole("button", { name: "Water plant" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /^Edit watering on / })).toHaveCount(0);
  });

  test("repot toggles independently of fertilizer", async ({ page, request }) => {
    const res = await request.post("/api/plants", { data: { name: "E2E Repot Plant" } });
    const { id } = await res.json();
    plantId = id;

    await request.post(`/api/plants/${id}/water`, { data: { fertilized: true } });

    await page.goto("/");

    const plantRow = page.getByRole("listitem").filter({ hasText: "E2E Repot Plant" });
    await plantRow.getByRole("button", { name: "E2E Repot Plant" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /^Edit watering on / }).click();

    const fertilizeToggle = dialog.getByRole("button", { name: "Toggle fertilize" });
    const repotToggle = dialog.getByRole("button", { name: "Toggle repot" });
    await expect(fertilizeToggle).toHaveAttribute("aria-pressed", "true");
    await expect(repotToggle).toHaveAttribute("aria-pressed", "false");

    await repotToggle.click();
    await expect(repotToggle).toHaveAttribute("aria-pressed", "true");
    // Independent flags: fertilizer stays on.
    await expect(fertilizeToggle).toHaveAttribute("aria-pressed", "true");

    await dialog.getByRole("button", { name: "Back to plant actions" }).click();
    await expect(dialog.getByRole("img", { name: "Last repotted" })).toContainText("0d");
  });

  test("clicking outside the edit view returns to the plant list", async ({ page, request }) => {
    const res = await request.post("/api/plants", { data: { name: "E2E Watering Dismiss Plant" } });
    const { id } = await res.json();
    plantId = id;

    await request.post(`/api/plants/${id}/water`, { data: { fertilized: false } });

    await page.goto("/");

    const plantRow = page.getByRole("listitem").filter({ hasText: "E2E Watering Dismiss Plant" });
    await plantRow.getByRole("button", { name: "E2E Watering Dismiss Plant" }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /^Edit watering on / }).click();
    await expect(dialog.getByRole("button", { name: "Back to plant actions" })).toBeVisible();

    // Clicking the overlay dismisses the whole dialog, not just the edit view.
    await page.mouse.click(5, 5);
    await expect(dialog).not.toBeVisible();
    await expect(plantRow).toBeVisible();

    // Reopening starts back on the plant actions view.
    await plantRow.getByRole("button", { name: "E2E Watering Dismiss Plant" }).click();
    await expect(dialog.getByRole("button", { name: "Water plant" })).toBeVisible();
  });
});

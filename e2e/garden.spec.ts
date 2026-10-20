import { expect, test } from "@playwright/test";

test.describe("Outdoor garden", () => {
  let plantId = 0;
  let choreId = 0;

  test.afterEach(async ({ request }) => {
    if (choreId) await request.delete(`/api/garden/chores/${choreId}`);
    if (plantId) await request.delete(`/api/plants/${plantId}`);
    choreId = 0;
    plantId = 0;
  });

  test("toggles between indoor and outdoor plants", async ({ page, request }) => {
    const res = await request.post("/api/plants", {
      data: { name: "E2E Outdoor Rose", location: "outdoor" },
    });
    plantId = (await res.json()).id;

    await page.goto("/");
    await expect(page.getByText("E2E Outdoor Rose")).toHaveCount(0);

    await page.getByRole("button", { name: "Outdoor garden" }).click();
    await expect(page.getByText("E2E Outdoor Rose")).toBeVisible();
    await expect(page.getByText("Irrigation")).toBeVisible();

    // The chosen view survives a full page load.
    await page.reload();
    await expect(page.getByText("E2E Outdoor Rose")).toBeVisible();

    // Moving the plant indoors takes it off the garden list.
    await page.getByRole("listitem").getByRole("button", { name: "E2E Outdoor Rose" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Move indoors" }).click();
    await expect(page.getByText("E2E Outdoor Rose")).toHaveCount(0);
    await page.getByRole("button", { name: "Indoor plants" }).click();
    await expect(page.getByText("E2E Outdoor Rose")).toBeVisible();
  });

  test("logs an irrigation run for the whole garden", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Outdoor garden" }).click();

    await page.getByRole("button", { name: "Log irrigation run" }).click();

    const garden = page.getByRole("button", { name: "Log irrigation run" }).locator("..");
    await expect(garden.getByText("Today")).toBeVisible();
  });

  test("adds a seasonal chore and checks it off", async ({ page }) => {
    let capturedId = 0;
    page.on("response", async (response) => {
      if (response.url().endsWith("/api/garden/chores") && response.request().method() === "POST") {
        const body = await response.json().catch(() => null);
        if (body?.id) capturedId = body.id;
      }
    });

    await page.goto("/");
    await page.getByRole("button", { name: "Outdoor garden" }).click();

    // The month pickers default to this month, so the new chore is due now.
    await page.getByRole("button", { name: "Add a chore" }).click();
    await page.getByRole("textbox", { name: "Chore" }).fill("E2E Mulch beds");
    await page.getByRole("button", { name: "Add", exact: true }).click();

    const chores = page.getByRole("region", { name: "Seasonal chores" });
    await expect(chores.getByText("E2E Mulch beds")).toBeVisible();
    choreId = capturedId;

    await chores.getByRole("button", { name: "Mark E2E Mulch beds done" }).click();
    await expect(chores.getByRole("button", { name: "Mark E2E Mulch beds not done" })).toBeVisible();
  });
});

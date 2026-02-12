/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { Plant } from "./Plant.tsx";
import { cleanupTestDB, seedPlant, seedWatering } from "../test-utils.ts";
import { getPlants } from "../actions/plants.ts";
import { execaCommand } from "execa";

// Mock waku router
vi.mock("waku", () => ({
  useRouter: () => ({
    reload: vi.fn(),
  }),
}));

describe("Plant component rendering", () => {
  beforeAll(async () => {
    await execaCommand("pnpm drizzle-kit push", { stdio: "inherit" });
  });

  beforeEach(async () => {
    await cleanupTestDB();
  });

  it("should display 'Never watered' for a new plant", async () => {
    await seedPlant("Test Fern");

    const plants = await getPlants();
    const plant = plants[0]!;

    render(<Plant plant={plant} />);

    expect(screen.getByText("Test Fern")).toBeInTheDocument();
    expect(screen.getByText("Never watered")).toBeInTheDocument();
  });

  it("should display 'Today' for a plant watered today", async () => {
    const plantId = await seedPlant("Watered Today Plant");
    await seedWatering(plantId, new Date());

    const plants = await getPlants();
    const plant = plants[0]!;

    render(<Plant plant={plant} />);

    expect(screen.getByText("Watered Today Plant")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("should display 'Yesterday' for a plant watered yesterday", async () => {
    const plantId = await seedPlant("Watered Yesterday Plant");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await seedWatering(plantId, yesterday);

    const plants = await getPlants();
    const plant = plants[0]!;

    render(<Plant plant={plant} />);

    expect(screen.getByText("Watered Yesterday Plant")).toBeInTheDocument();
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
  });

  it("should display 'Yesterday' for a plant watered late yesterday even if less than 24 hours ago", async () => {
    const plantId = await seedPlant("Late Yesterday Plant");
    const lateYesterday = new Date();
    lateYesterday.setDate(lateYesterday.getDate() - 1);
    lateYesterday.setHours(23, 59, 0, 0);
    await seedWatering(plantId, lateYesterday);

    const plants = await getPlants();
    const plant = plants[0]!;

    render(<Plant plant={plant} />);

    expect(screen.getByText("Late Yesterday Plant")).toBeInTheDocument();
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
  });

  it("should display days ago for a plant watered multiple days ago", async () => {
    const plantId = await seedPlant("Old Watering Plant");
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    await seedWatering(plantId, fiveDaysAgo);

    const plants = await getPlants();
    const plant = plants[0]!;

    render(<Plant plant={plant} />);

    expect(screen.getByText("Old Watering Plant")).toBeInTheDocument();
    expect(screen.getByText("5 days ago")).toBeInTheDocument();
  });
});

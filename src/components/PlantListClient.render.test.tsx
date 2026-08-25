/**
 * @vitest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { PlantListClient } from "./PlantListClient.tsx";

// Mock waku router
vi.mock("waku", () => ({
  useRouter: () => ({
    reload: vi.fn(),
  }),
}));

describe("PlantListClient sprout control", () => {
  it("links to the Google login when logged out", async () => {
    render(<PlantListClient plants={[]} loggedIn={false} />);

    const link = await screen.findByRole("link", { name: "Log in to add a plant" });
    expect(link).toHaveAttribute("href", "/auth/google");
    expect(screen.queryByRole("button", { name: "Add a new plant" })).not.toBeInTheDocument();
  });

  it("shows the add-plant button when logged in", async () => {
    render(<PlantListClient plants={[]} loggedIn />);

    expect(await screen.findByRole("button", { name: "Add a new plant" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Log in to add a plant" })).not.toBeInTheDocument();
  });
});

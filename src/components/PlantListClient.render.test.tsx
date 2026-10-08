/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { PlantListClient } from "./PlantListClient.tsx";

// Mock waku router
const reload = vi.fn();
vi.mock("waku", () => ({
  useRouter: () => ({
    reload,
  }),
}));

// jsdom does not provide a canvas renderer; browser checks cover the artwork.
beforeEach(() => {
  reload.mockClear();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

afterEach(() => {
  vi.restoreAllMocks();
  document.cookie = "is_authenticated=; max-age=0";
});

describe("PlantListClient sprout control", () => {
  it("links to the Google login when logged out", async () => {
    render(<PlantListClient plants={[]} />);

    const link = await screen.findByRole("link", { name: "Log in to add a plant" });
    expect(link).toHaveAttribute("href", "/auth/google");
    expect(screen.queryByRole("button", { name: "Add a new plant" })).not.toBeInTheDocument();
  });

  it("shows the add-plant button when logged in", async () => {
    document.cookie = "is_authenticated=1";

    render(<PlantListClient plants={[]} />);

    expect(await screen.findByRole("button", { name: "Add a new plant" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Log in to add a plant" })).not.toBeInTheDocument();
  });
});

describe("PlantListClient add plant failure", () => {
  it("keeps the draft and shows an error when the create request fails", async () => {
    document.cookie = "is_authenticated=1";
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ error: "boom" }), { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<PlantListClient plants={[]} />);

    fireEvent.click(await screen.findByRole("button", { name: "Add a new plant" }));
    const input = screen.getByPlaceholderText("Add a new plant");
    fireEvent.change(input, { target: { value: "Fern" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't add plant");
    await waitFor(() => expect(screen.getByPlaceholderText("Add a new plant")).toBeEnabled());
    expect(screen.getByPlaceholderText("Add a new plant")).toHaveValue("Fern");
    expect(reload).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});

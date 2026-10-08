/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { ButtonContainer } from "./ButtonContainer.tsx";

const reload = vi.fn();

vi.mock("waku", () => ({
  useRouter: () => ({ reload }),
}));

const fetchMock = vi.fn();

beforeEach(() => {
  reload.mockClear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderContainer() {
  const onOpenChange = vi.fn();
  render(<ButtonContainer plantId={1} loggedIn open onOpenChange={onOpenChange} />);
  return onOpenChange;
}

describe("ButtonContainer failed requests", () => {
  it("closes the dialog and reloads when watering succeeds", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    const onOpenChange = renderContainer();

    fireEvent.click(screen.getByRole("button", { name: "Water plant" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("keeps the dialog open, re-enables the button and shows an error on a non-ok water response", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: "boom" }), { status: 500 }));
    const onOpenChange = renderContainer();

    fireEvent.click(screen.getByRole("button", { name: "Water plant" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't water");
    expect(screen.getByRole("button", { name: "Water plant" })).toBeEnabled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it("re-enables the button and shows an error when the water request throws", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const onOpenChange = renderContainer();

    fireEvent.click(screen.getByRole("button", { name: "Water plant" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't water");
    expect(screen.getByRole("button", { name: "Water plant" })).toBeEnabled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it("shows an error and stays open when the delay request throws", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const onOpenChange = renderContainer();

    fireEvent.click(screen.getByRole("button", { name: "Delay watering" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't delay");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });
});

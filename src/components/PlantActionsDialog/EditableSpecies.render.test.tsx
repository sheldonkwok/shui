/**
 * @vitest-environment jsdom
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { EditableSpecies } from "./EditableSpecies.tsx";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderSpecies() {
  const onClassified = vi.fn();
  render(<EditableSpecies plantId={1} species="Ficus lyrata" onClassified={onClassified} canEdit />);
  const input = screen.getByDisplayValue("Ficus lyrata");
  return { input, onClassified };
}

function commit(input: HTMLElement, value: string) {
  fireEvent.click(input);
  fireEvent.change(input, { target: { value } });
  fireEvent.keyDown(input, { key: "Enter" });
}

describe("EditableSpecies classify", () => {
  it("calls the classify endpoint and notifies on success", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    const { input, onClassified } = renderSpecies();

    commit(input, "Ficus");

    await waitFor(() => expect(onClassified).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("/api/plants/1/classify");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ species: "Ficus" });
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows 'Species not found' and reverts the value on a 422", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: "not found" }), { status: 422 }));
    const { input, onClassified } = renderSpecies();

    commit(input, "Notaplant");

    expect(await screen.findByRole("alert")).toHaveTextContent("Species not found");
    expect(input).toHaveValue("Ficus lyrata");
    expect(onClassified).not.toHaveBeenCalled();
  });

  it("shows a generic error and reverts the value on a 500", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: "boom" }), { status: 500 }));
    const { input, onClassified } = renderSpecies();

    commit(input, "Notaplant");

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't save species");
    expect(input).toHaveValue("Ficus lyrata");
    expect(onClassified).not.toHaveBeenCalled();
  });

  it("shows a generic error and reverts the value when the request throws", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const { input, onClassified } = renderSpecies();

    commit(input, "Notaplant");

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't save species");
    expect(input).toHaveValue("Ficus lyrata");
    expect(onClassified).not.toHaveBeenCalled();
  });
});

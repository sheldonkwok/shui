/**
 * @vitest-environment jsdom
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { ButtonContainer } from "./ButtonContainer.tsx";

vi.mock("waku", () => ({
  useRouter: () => ({ reload: vi.fn() }),
}));

const waterPost = vi.fn(async () => new Response(null, { status: 200 }));
vi.mock("../../api/client.ts", () => ({
  apiClient: {
    api: {
      plants: {
        ":id": {
          water: {
            $post: (...args: unknown[]) => waterPost(...(args as [])),
          },
          delay: { $post: vi.fn() },
        },
      },
    },
  },
}));

function renderButtons(loggedIn: boolean) {
  return render(<ButtonContainer plantId={1} loggedIn={loggedIn} open={true} onOpenChange={vi.fn()} />);
}

describe("ButtonContainer water button", () => {
  beforeEach(() => {
    waterPost.mockClear();
    // jsdom throws on real navigation, so stand in for window.location.
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { href: "http://localhost/" },
    });
  });

  it("sends a logged out user to the login page instead of watering", () => {
    renderButtons(false);

    const button = screen.getByRole("button", { name: "Log in to water plant" });
    expect(button).not.toBeDisabled();

    fireEvent.click(button);

    expect(window.location.href).toBe("/auth/google");
    expect(waterPost).not.toHaveBeenCalled();
  });

  it("still looks greyed out when logged out", () => {
    renderButtons(false);

    expect(screen.getByRole("button", { name: "Log in to water plant" }).className).toContain("opacity-40");
  });

  it("waters the plant when logged in", async () => {
    renderButtons(true);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Water plant" }));
    });

    expect(waterPost).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe("http://localhost/");
  });
});

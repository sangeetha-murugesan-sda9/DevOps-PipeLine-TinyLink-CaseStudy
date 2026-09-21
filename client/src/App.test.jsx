import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App.jsx";

beforeEach(() => {
  global.fetch = vi.fn((url, opts) => {
    if (opts?.method === "POST") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ code: "abc1234", url: "https://kth.se" }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([{ code: "abc1234", url: "https://kth.se", created_at: new Date().toISOString() }]),
    });
  });
});

describe("App", () => {
  it("renders the heading and loads existing links", async () => {
    render(<App />);
    expect(screen.getByText("TinyLink")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/kth.se/)).toBeInTheDocument());
  });

  it("submits a new URL", async () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/https:\/\/example.com/i);
    fireEvent.change(input, { target: { value: "https://kth.se" } });
    fireEvent.click(screen.getByText("Shorten"));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      "/api/links",
      expect.objectContaining({ method: "POST" })
    ));
  });
});
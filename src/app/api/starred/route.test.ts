import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("auth/server", () => ({ getSession: vi.fn() }));
vi.mock("lib/db/repository", () => ({
  bookmarkRepository: {
    selectStarredThreads: vi.fn(),
    selectStarredProjects: vi.fn(),
  },
}));

describe("GET /api/starred", () => {
  it("exports a GET handler", async () => {
    const mod = await import("./route");
    expect(typeof mod.GET).toBe("function");
  });
});

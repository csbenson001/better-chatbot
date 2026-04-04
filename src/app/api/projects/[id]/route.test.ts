import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("auth/server", () => ({
  getSession: () => ({ user: { id: "user-1" } }),
}));
vi.mock("lib/db/repository", () => ({
  projectRepository: {
    selectProjectById: () => ({ id: "proj-1", userId: "user-1" }),
    updateProject: vi.fn(() => ({ id: "proj-1" })),
  },
}));

describe("PUT /api/projects/[id]", () => {
  it("rejects instructions longer than 6000 chars", async () => {
    const { PUT } = await import("./route");
    const longText = "a".repeat(6001);
    const req = new Request("http://localhost/api/projects/proj-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instructions: longText }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "proj-1" }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("6,000");
  });
});

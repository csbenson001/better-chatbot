import { describe, it, expect, vi } from "vitest";

vi.mock("auth/server", () => ({
  getSession: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
}));

vi.mock("lib/db/repository", () => ({
  userRepository: {
    updatePreferredModel: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("PATCH /api/user/preferred-model", () => {
  it("saves preferred model for authenticated user", async () => {
    const { userRepository } = await import("lib/db/repository");
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/user/preferred-model", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider: "anthropic", model: "sonnet-4.5" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(userRepository.updatePreferredModel).toHaveBeenCalledWith("user-1", {
      provider: "anthropic",
      model: "sonnet-4.5",
    });
  });

  it("clears preferred model when clear:true sent", async () => {
    const { userRepository } = await import("lib/db/repository");
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/user/preferred-model", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clear: true }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(userRepository.updatePreferredModel).toHaveBeenCalledWith(
      "user-1",
      null,
    );
  });

  it("returns 401 when unauthenticated", async () => {
    const { getSession } = await import("auth/server");
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/user/preferred-model", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ provider: "anthropic", model: "sonnet-4.5" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });
});

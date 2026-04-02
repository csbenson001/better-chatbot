import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("lib/ai/tenant-model-provider", () => ({
  getTenantModelProvider: vi.fn().mockResolvedValue({
    modelsInfo: [
      {
        provider: "anthropic", hasAPIKey: true,
        models: [{ name: "sonnet-4.5", isToolCallUnsupported: false, isImageInputUnsupported: false, supportedFileMimeTypes: [] }],
      },
    ],
    defaultModel: { provider: "anthropic", model: "sonnet-4.5" },
    getModel: vi.fn(),
  }),
}));

vi.mock("auth/server", () => ({
  getSession: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
}));

vi.mock("lib/db/repository", () => ({
  userRepository: {
    getPreferredModel: vi.fn().mockResolvedValue({ provider: "anthropic", model: "haiku-4.5" }),
  },
}));

describe("GET /api/chat/models", () => {
  it("returns models array, defaultModel, and userPreferred", async () => {
    const { GET } = await import("./route");
    const req = new Request("http://localhost/api/chat/models", {
      headers: { "x-tenant-id": "tenant-1" },
    });
    const res = await GET(req);
    const body = await res.json();

    expect(body).toHaveProperty("models");
    expect(body).toHaveProperty("defaultModel");
    expect(body).toHaveProperty("userPreferred");
    expect(Array.isArray(body.models)).toBe(true);
    expect(body.userPreferred).toEqual({ provider: "anthropic", model: "haiku-4.5" });
  });
});

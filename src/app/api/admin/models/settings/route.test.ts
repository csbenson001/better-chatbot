import { describe, it, expect, vi } from "vitest";

vi.mock("auth/server", () => ({
  getSession: vi.fn().mockResolvedValue({
    user: { id: "user-1", role: "admin" },
  }),
}));

vi.mock("lib/db/repository", () => ({
  tenantModelConfigRepository: {
    getModelSettings: vi.fn().mockResolvedValue([
      {
        id: "1", tenantId: "t1", provider: "anthropic",
        modelName: "sonnet-4.5", enabled: true, isDefault: true,
        createdAt: new Date(), updatedAt: new Date(),
      },
    ]),
    bulkUpsertModelSettings: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("lib/ai/models", () => ({
  customModelProvider: {
    modelsInfo: [
      {
        provider: "anthropic", hasAPIKey: false,
        models: [
          { name: "sonnet-4.5", isToolCallUnsupported: false },
          { name: "haiku-4.5", isToolCallUnsupported: false },
        ],
      },
    ],
  },
}));

describe("GET /api/admin/models/settings", () => {
  it("merges static model list with DB overrides", async () => {
    const { GET } = await import("./route");
    const req = new Request("http://localhost/api/admin/models/settings", {
      headers: { "x-tenant-id": "t1" },
    });
    const res = await GET(req);
    const body = await res.json();

    expect(body.settings).toBeDefined();
    const sonnet = body.settings.find(
      (s: { modelName: string }) => s.modelName === "sonnet-4.5",
    );
    expect(sonnet?.isDefault).toBe(true);
    expect(sonnet?.enabled).toBe(true);

    // haiku has no DB row — should default to enabled:true
    const haiku = body.settings.find(
      (s: { modelName: string }) => s.modelName === "haiku-4.5",
    );
    expect(haiku?.enabled).toBe(true);
    expect(haiku?.isDefault).toBe(false);
  });
});

describe("PATCH /api/admin/models/settings", () => {
  it("calls bulkUpsertModelSettings with provided updates", async () => {
    const { tenantModelConfigRepository } = await import("lib/db/repository");
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/admin/models/settings", {
      method: "PATCH",
      headers: { "x-tenant-id": "t1", "content-type": "application/json" },
      body: JSON.stringify({
        updates: [{ provider: "anthropic", modelName: "haiku-4.5", enabled: false }],
      }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(tenantModelConfigRepository.bulkUpsertModelSettings).toHaveBeenCalledWith(
      "t1",
      [{ provider: "anthropic", modelName: "haiku-4.5", enabled: false }],
    );
  });
});

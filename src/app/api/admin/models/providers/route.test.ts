import { describe, it, expect, vi } from "vitest";

vi.mock("lib/db/repository", () => ({
  tenantModelConfigRepository: {
    getProviderKeys: vi.fn().mockResolvedValue([
      {
        id: "1", tenantId: "t1", provider: "anthropic",
        apiKey: "sk-ant-api03-supersecretkey1234",
        enabled: true, azureEndpoint: null, azureDeploymentName: null,
        azureApiVersion: null, createdAt: new Date(), updatedAt: new Date(),
      },
    ]),
    upsertProviderKey: vi.fn().mockResolvedValue({
      id: "2", tenantId: "t1", provider: "openai",
      apiKey: "sk-openai-test-key-5678",
      enabled: true, azureEndpoint: null, azureDeploymentName: null,
      azureApiVersion: null, createdAt: new Date(), updatedAt: new Date(),
    }),
    deleteProviderKey: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("lib/db/pg/repositories/tenant-model-config-repository.pg", () => ({
  maskApiKey: (key: string) => "•".repeat(Math.max(0, key.length - 4)) + key.slice(-4),
}));

describe("GET /api/admin/models/providers", () => {
  it("returns masked keys and no raw apiKey", async () => {
    const { GET } = await import("./route");
    const req = new Request("http://localhost/api/admin/models/providers", {
      headers: { "x-tenant-id": "t1" },
    });
    const res = await GET(req);
    const body = await res.json();

    expect(body.providers).toHaveLength(1);
    expect(body.providers[0]).toHaveProperty("apiKeyMasked");
    expect(body.providers[0]).not.toHaveProperty("apiKey");
    expect(body.providers[0].apiKeyMasked).toContain("•");
    expect(body.providers[0].apiKeyMasked).toMatch(/1234$/);
  });
});

describe("PUT /api/admin/models/providers", () => {
  it("calls upsertProviderKey and returns masked result", async () => {
    const { PUT } = await import("./route");
    const req = new Request("http://localhost/api/admin/models/providers", {
      method: "PUT",
      headers: { "x-tenant-id": "t1", "content-type": "application/json" },
      body: JSON.stringify({ provider: "openai", apiKey: "sk-new-key", enabled: true }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.provider).toHaveProperty("apiKeyMasked");
    expect(body.provider).not.toHaveProperty("apiKey");
  });
});

describe("DELETE /api/admin/models/providers", () => {
  it("deletes provider key and returns success", async () => {
    const { DELETE } = await import("./route");
    const req = new Request(
      "http://localhost/api/admin/models/providers?provider=anthropic",
      { method: "DELETE", headers: { "x-tenant-id": "t1" } },
    );
    const res = await DELETE(req);
    expect(res.status).toBe(200);
  });

  it("returns 400 when provider param missing", async () => {
    const { DELETE } = await import("./route");
    const req = new Request(
      "http://localhost/api/admin/models/providers",
      { method: "DELETE", headers: { "x-tenant-id": "t1" } },
    );
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });
});

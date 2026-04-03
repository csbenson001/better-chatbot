import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("lib/db/repository", () => ({
  tenantModelConfigRepository: {
    getProviderKeys: vi.fn(),
    getModelSettings: vi.fn(),
  },
}));

vi.mock("lib/ai/models", () => ({
  customModelProvider: {
    modelsInfo: [
      {
        provider: "anthropic",
        hasAPIKey: false,
        models: [
          {
            name: "sonnet-4.5",
            isToolCallUnsupported: false,
            isImageInputUnsupported: false,
            supportedFileMimeTypes: [],
          },
          {
            name: "haiku-4.5",
            isToolCallUnsupported: false,
            isImageInputUnsupported: false,
            supportedFileMimeTypes: [],
          },
        ],
      },
      {
        provider: "openai",
        hasAPIKey: false,
        models: [
          {
            name: "gpt-4.1",
            isToolCallUnsupported: false,
            isImageInputUnsupported: false,
            supportedFileMimeTypes: [],
          },
        ],
      },
    ],
    getModel: vi.fn().mockReturnValue({ id: "fallback-model" }),
  },
}));

vi.mock("@ai-sdk/anthropic", () => ({
  createAnthropic: vi.fn().mockReturnValue(() => ({ id: "anthropic-model" })),
}));
vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn().mockReturnValue(() => ({ id: "openai-model" })),
}));
vi.mock("@ai-sdk/google", () => ({
  createGoogleGenerativeAI: vi
    .fn()
    .mockReturnValue(() => ({ id: "google-model" })),
}));
vi.mock("@ai-sdk/azure", () => ({
  createAzure: vi.fn().mockReturnValue(() => ({ id: "azure-model" })),
}));

describe("getTenantModelProvider", () => {
  beforeEach(() => vi.clearAllMocks());

  it("falls back to static provider when no DB config exists", async () => {
    const { tenantModelConfigRepository } = await import("lib/db/repository");
    vi.mocked(tenantModelConfigRepository.getProviderKeys).mockResolvedValue(
      [],
    );
    vi.mocked(tenantModelConfigRepository.getModelSettings).mockResolvedValue(
      [],
    );

    const { getTenantModelProvider } = await import("./tenant-model-provider");
    const provider = await getTenantModelProvider("tenant-1");

    expect(provider.defaultModel).toBeNull();
    expect(provider.modelsInfo.length).toBeGreaterThan(0);
  });

  it("returns only the configured provider when DB config exists", async () => {
    const { tenantModelConfigRepository } = await import("lib/db/repository");
    vi.mocked(tenantModelConfigRepository.getProviderKeys).mockResolvedValue([
      {
        id: "1",
        tenantId: "t1",
        provider: "anthropic" as const,
        apiKey: "sk-ant-test",
        enabled: true,
        azureEndpoint: null,
        azureDeploymentName: null,
        azureApiVersion: "2024-02-01",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    vi.mocked(tenantModelConfigRepository.getModelSettings).mockResolvedValue([
      {
        id: "1",
        tenantId: "t1",
        provider: "anthropic" as const,
        modelName: "sonnet-4.5",
        enabled: true,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const { getTenantModelProvider } = await import("./tenant-model-provider");
    const provider = await getTenantModelProvider("t1");

    expect(provider.modelsInfo.some((p) => p.provider === "anthropic")).toBe(
      true,
    );
    expect(provider.modelsInfo.some((p) => p.provider === "openai")).toBe(
      false,
    );
    expect(provider.defaultModel).toEqual({
      provider: "anthropic",
      model: "sonnet-4.5",
    });
  });

  it("adds azure as a dynamic provider when configured", async () => {
    const { tenantModelConfigRepository } = await import("lib/db/repository");
    vi.mocked(tenantModelConfigRepository.getProviderKeys).mockResolvedValue([
      {
        id: "2",
        tenantId: "t2",
        provider: "azure" as const,
        apiKey: "azure-key",
        enabled: true,
        azureEndpoint: "https://my-resource.openai.azure.com",
        azureDeploymentName: "gpt4-deploy",
        azureApiVersion: "2024-02-01",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    vi.mocked(tenantModelConfigRepository.getModelSettings).mockResolvedValue(
      [],
    );

    const { getTenantModelProvider } = await import("./tenant-model-provider");
    const provider = await getTenantModelProvider("t2");

    const azureEntry = provider.modelsInfo.find((p) => p.provider === "azure");
    expect(azureEntry).toBeDefined();
    expect(azureEntry?.models[0].name).toBe("gpt4-deploy");
  });
});

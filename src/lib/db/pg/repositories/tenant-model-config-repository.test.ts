import { describe, it, expect } from "vitest";
import type { TenantModelConfigRepository } from "app-types/model-config";

describe("TenantModelConfigRepository interface shape", () => {
  it("defines all 8 required methods", () => {
    const methods: (keyof TenantModelConfigRepository)[] = [
      "getProviderKeys",
      "getProviderKey",
      "upsertProviderKey",
      "deleteProviderKey",
      "getModelSettings",
      "upsertModelSetting",
      "setDefaultModel",
      "bulkUpsertModelSettings",
    ];
    expect(methods).toHaveLength(8);
  });
});

describe("maskApiKey", () => {
  it("masks all but the last 4 chars", async () => {
    const { maskApiKey } = await import("./tenant-model-config-repository.pg");
    expect(maskApiKey("sk-ant-api03-abc1234")).toBe("••••••••••••••••1234");
    expect(maskApiKey("ab")).toBe("••");
    expect(maskApiKey("abcd")).toBe("abcd"); // 4 chars — nothing to mask
  });
});

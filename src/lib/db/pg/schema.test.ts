import { describe, it, expect } from "vitest";
import {
  TenantProviderKeySchema,
  TenantModelSettingSchema,
  UserTable,
} from "./schema.pg";
import { getTableColumns } from "drizzle-orm";

describe("TenantProviderKeySchema", () => {
  it("has required columns", () => {
    const cols = getTableColumns(TenantProviderKeySchema);
    expect(cols).toHaveProperty("id");
    expect(cols).toHaveProperty("tenantId");
    expect(cols).toHaveProperty("provider");
    expect(cols).toHaveProperty("apiKey");
    expect(cols).toHaveProperty("enabled");
    expect(cols).toHaveProperty("azureEndpoint");
    expect(cols).toHaveProperty("azureDeploymentName");
    expect(cols).toHaveProperty("azureApiVersion");
  });
});

describe("TenantModelSettingSchema", () => {
  it("has required columns", () => {
    const cols = getTableColumns(TenantModelSettingSchema);
    expect(cols).toHaveProperty("id");
    expect(cols).toHaveProperty("tenantId");
    expect(cols).toHaveProperty("provider");
    expect(cols).toHaveProperty("modelName");
    expect(cols).toHaveProperty("enabled");
    expect(cols).toHaveProperty("isDefault");
  });
});

describe("UserTable", () => {
  it("has preferredModel column", () => {
    const cols = getTableColumns(UserTable);
    expect(cols).toHaveProperty("preferredModel");
  });
});

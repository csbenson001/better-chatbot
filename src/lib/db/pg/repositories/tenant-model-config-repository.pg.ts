import { pgDb as db } from "../db.pg";
import {
  TenantProviderKeySchema,
  TenantModelSettingSchema,
} from "../schema.pg";
import { eq, and } from "drizzle-orm";
import type {
  TenantModelConfigRepository,
  TenantProviderKey,
  TenantModelSetting,
} from "app-types/model-config";

export function maskApiKey(apiKey: string): string {
  if (apiKey.length < 4) return "•".repeat(apiKey.length);
  return "•".repeat(apiKey.length - 4) + apiKey.slice(-4);
}

export const pgTenantModelConfigRepository: TenantModelConfigRepository = {
  // ─── Provider Keys ──────────────────────────────────────────────────────────

  async getProviderKeys(tenantId) {
    const results = await db
      .select()
      .from(TenantProviderKeySchema)
      .where(eq(TenantProviderKeySchema.tenantId, tenantId));
    return results as TenantProviderKey[];
  },

  async getProviderKey(tenantId, provider) {
    const [result] = await db
      .select()
      .from(TenantProviderKeySchema)
      .where(
        and(
          eq(TenantProviderKeySchema.tenantId, tenantId),
          eq(TenantProviderKeySchema.provider, provider),
        ),
      );
    return (result as TenantProviderKey) ?? null;
  },

  async upsertProviderKey(tenantId, provider, data) {
    const [result] = await db
      .insert(TenantProviderKeySchema)
      .values({
        tenantId,
        provider,
        apiKey: data.apiKey,
        enabled: data.enabled,
        azureEndpoint: data.azureEndpoint ?? null,
        azureDeploymentName: data.azureDeploymentName ?? null,
        azureApiVersion: data.azureApiVersion ?? "2024-02-01",
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          TenantProviderKeySchema.tenantId,
          TenantProviderKeySchema.provider,
        ],
        set: {
          apiKey: data.apiKey,
          enabled: data.enabled,
          azureEndpoint: data.azureEndpoint ?? null,
          azureDeploymentName: data.azureDeploymentName ?? null,
          azureApiVersion: data.azureApiVersion ?? "2024-02-01",
          updatedAt: new Date(),
        },
      })
      .returning();
    return result as TenantProviderKey;
  },

  async deleteProviderKey(tenantId, provider) {
    await db
      .delete(TenantProviderKeySchema)
      .where(
        and(
          eq(TenantProviderKeySchema.tenantId, tenantId),
          eq(TenantProviderKeySchema.provider, provider),
        ),
      );
  },

  // ─── Model Settings ─────────────────────────────────────────────────────────

  async getModelSettings(tenantId) {
    const results = await db
      .select()
      .from(TenantModelSettingSchema)
      .where(eq(TenantModelSettingSchema.tenantId, tenantId));
    return results as TenantModelSetting[];
  },

  async upsertModelSetting(tenantId, provider, modelName, data) {
    const [result] = await db
      .insert(TenantModelSettingSchema)
      .values({
        tenantId,
        provider,
        modelName,
        enabled: data.enabled,
        isDefault: data.isDefault ?? false,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          TenantModelSettingSchema.tenantId,
          TenantModelSettingSchema.provider,
          TenantModelSettingSchema.modelName,
        ],
        set: {
          enabled: data.enabled,
          ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
          updatedAt: new Date(),
        },
      })
      .returning();
    return result as TenantModelSetting;
  },

  async setDefaultModel(tenantId, provider, modelName) {
    await db
      .update(TenantModelSettingSchema)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(TenantModelSettingSchema.tenantId, tenantId));

    await db
      .insert(TenantModelSettingSchema)
      .values({
        tenantId,
        provider,
        modelName,
        enabled: true,
        isDefault: true,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          TenantModelSettingSchema.tenantId,
          TenantModelSettingSchema.provider,
          TenantModelSettingSchema.modelName,
        ],
        set: { isDefault: true, enabled: true, updatedAt: new Date() },
      });
  },

  async bulkUpsertModelSettings(tenantId, settings) {
    if (settings.length === 0) return;

    const hasNewDefault = settings.some((s) => s.isDefault === true);
    if (hasNewDefault) {
      await db
        .update(TenantModelSettingSchema)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(TenantModelSettingSchema.tenantId, tenantId));
    }

    for (const s of settings) {
      await db
        .insert(TenantModelSettingSchema)
        .values({
          tenantId,
          provider: s.provider,
          modelName: s.modelName,
          enabled: s.enabled ?? true,
          isDefault: s.isDefault ?? false,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [
            TenantModelSettingSchema.tenantId,
            TenantModelSettingSchema.provider,
            TenantModelSettingSchema.modelName,
          ],
          set: {
            ...(s.enabled !== undefined && { enabled: s.enabled }),
            ...(s.isDefault !== undefined && { isDefault: s.isDefault }),
            updatedAt: new Date(),
          },
        });
    }
  },
};

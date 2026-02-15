import type {
  RBACRepository,
  Permission,
  Role,
  RolePermission,
  UserRole,
  Trial,
  TokenUsage,
  ApiKey,
} from "app-types/rbac";
import { pgDb as db } from "../db.pg";
import {
  PermissionSchema,
  RoleSchema,
  RolePermissionSchema,
  UserRoleSchema,
  TrialSchema,
  TokenUsageSchema,
  ApiKeySchema,
} from "../schema.pg";
import { eq, and, desc, gte, lte, sql, inArray } from "drizzle-orm";

export const pgRBACRepository: RBACRepository = {
  // ─── Permissions ───────────────────────────────────────────────────────────

  async selectAllPermissions() {
    const results = await db.select().from(PermissionSchema);
    return results as Permission[];
  },

  async selectPermissionsByIds(ids) {
    if (ids.length === 0) return [];
    const results = await db
      .select()
      .from(PermissionSchema)
      .where(inArray(PermissionSchema.id, ids));
    return results as Permission[];
  },

  // ─── Roles ─────────────────────────────────────────────────────────────────

  async insertRole(role) {
    const [result] = await db
      .insert(RoleSchema)
      .values({
        tenantId: role.tenantId,
        name: role.name,
        type: role.type,
        description: role.description ?? null,
        isDefault: role.isDefault ?? false,
      })
      .returning();
    return result as Role;
  },

  async selectRolesByTenantId(tenantId) {
    const results = await db
      .select()
      .from(RoleSchema)
      .where(eq(RoleSchema.tenantId, tenantId))
      .orderBy(RoleSchema.createdAt);
    return results as Role[];
  },

  async selectRoleById(id, tenantId) {
    const [result] = await db
      .select()
      .from(RoleSchema)
      .where(and(eq(RoleSchema.id, id), eq(RoleSchema.tenantId, tenantId)));
    return (result as Role) ?? null;
  },

  async updateRole(id, tenantId, data) {
    const [result] = await db
      .update(RoleSchema)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(RoleSchema.id, id), eq(RoleSchema.tenantId, tenantId)))
      .returning();
    return result as Role;
  },

  async deleteRole(id, tenantId) {
    await db
      .delete(RoleSchema)
      .where(and(eq(RoleSchema.id, id), eq(RoleSchema.tenantId, tenantId)));
  },

  // ─── Role-Permission Mapping ───────────────────────────────────────────────

  async insertRolePermission(roleId, permissionId) {
    const [result] = await db
      .insert(RolePermissionSchema)
      .values({ roleId, permissionId })
      .returning();
    return result as RolePermission;
  },

  async deleteRolePermissions(roleId) {
    await db
      .delete(RolePermissionSchema)
      .where(eq(RolePermissionSchema.roleId, roleId));
  },

  async selectPermissionsByRoleId(roleId) {
    const results = await db
      .select({
        id: PermissionSchema.id,
        resource: PermissionSchema.resource,
        action: PermissionSchema.action,
        description: PermissionSchema.description,
        createdAt: PermissionSchema.createdAt,
      })
      .from(RolePermissionSchema)
      .innerJoin(
        PermissionSchema,
        eq(RolePermissionSchema.permissionId, PermissionSchema.id),
      )
      .where(eq(RolePermissionSchema.roleId, roleId));
    return results as Permission[];
  },

  // ─── User-Role Mapping ─────────────────────────────────────────────────────

  async insertUserRole(userId, roleId, tenantId, assignedBy?) {
    const [result] = await db
      .insert(UserRoleSchema)
      .values({
        userId,
        roleId,
        tenantId,
        assignedBy: assignedBy ?? null,
      })
      .returning();
    return result as UserRole;
  },

  async deleteUserRole(userId, roleId, tenantId) {
    await db
      .delete(UserRoleSchema)
      .where(
        and(
          eq(UserRoleSchema.userId, userId),
          eq(UserRoleSchema.roleId, roleId),
          eq(UserRoleSchema.tenantId, tenantId),
        ),
      );
  },

  async selectRolesByUserId(userId, tenantId) {
    const results = await db
      .select({
        id: RoleSchema.id,
        tenantId: RoleSchema.tenantId,
        name: RoleSchema.name,
        type: RoleSchema.type,
        description: RoleSchema.description,
        isDefault: RoleSchema.isDefault,
        createdAt: RoleSchema.createdAt,
        updatedAt: RoleSchema.updatedAt,
      })
      .from(UserRoleSchema)
      .innerJoin(RoleSchema, eq(UserRoleSchema.roleId, RoleSchema.id))
      .where(
        and(
          eq(UserRoleSchema.userId, userId),
          eq(UserRoleSchema.tenantId, tenantId),
        ),
      );
    return results as Role[];
  },

  async selectUsersByRoleId(roleId, tenantId) {
    const results = await db
      .select({
        userId: UserRoleSchema.userId,
        assignedAt: UserRoleSchema.createdAt,
      })
      .from(UserRoleSchema)
      .where(
        and(
          eq(UserRoleSchema.roleId, roleId),
          eq(UserRoleSchema.tenantId, tenantId),
        ),
      );
    return results as { userId: string; assignedAt: Date }[];
  },

  // ─── Trials ────────────────────────────────────────────────────────────────

  async insertTrial(trial) {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (trial.durationDays ?? 14));

    const [result] = await db
      .insert(TrialSchema)
      .values({
        tenantId: trial.tenantId,
        plan: trial.plan,
        status: "active",
        startDate,
        endDate,
        features: trial.features ?? {},
        maxUsers: trial.maxUsers ?? 5,
        maxAiRequests: trial.maxAiRequests ?? 1000,
      })
      .returning();
    return result as Trial;
  },

  async selectTrialByTenantId(tenantId) {
    const [result] = await db
      .select()
      .from(TrialSchema)
      .where(eq(TrialSchema.tenantId, tenantId))
      .orderBy(desc(TrialSchema.createdAt))
      .limit(1);
    return (result as Trial) ?? null;
  },

  async selectAllTrials() {
    const results = await db
      .select()
      .from(TrialSchema)
      .orderBy(desc(TrialSchema.createdAt));
    return results as Trial[];
  },

  async updateTrialStatus(id, status) {
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };
    if (status === "converted") {
      updateData.convertedAt = new Date();
    }
    const [result] = await db
      .update(TrialSchema)
      .set(updateData)
      .where(eq(TrialSchema.id, id))
      .returning();
    return result as Trial;
  },

  // ─── Token Usage ───────────────────────────────────────────────────────────

  async insertTokenUsage(usage) {
    const [result] = await db
      .insert(TokenUsageSchema)
      .values({
        tenantId: usage.tenantId,
        userId: usage.userId ?? null,
        model: usage.model,
        provider: usage.provider,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
        costCents: usage.costCents != null ? String(usage.costCents) : null,
        sessionId: usage.sessionId ?? null,
        agentType: usage.agentType ?? null,
        vertical: usage.vertical ?? null,
      })
      .returning();

    return {
      ...result,
      costCents: result.costCents != null ? Number(result.costCents) : null,
    } as TokenUsage;
  },

  async selectTokenUsageSummary(tenantId, periodStart, periodEnd) {
    const results = await db
      .select({
        model: TokenUsageSchema.model,
        provider: TokenUsageSchema.provider,
        totalInput: sql<number>`COALESCE(SUM(${TokenUsageSchema.inputTokens}), 0)`,
        totalOutput: sql<number>`COALESCE(SUM(${TokenUsageSchema.outputTokens}), 0)`,
        totalTokens: sql<number>`COALESCE(SUM(${TokenUsageSchema.totalTokens}), 0)`,
        totalCostCents: sql<number>`COALESCE(SUM(${TokenUsageSchema.costCents}::numeric), 0)`,
        requestCount: sql<number>`COUNT(*)`,
      })
      .from(TokenUsageSchema)
      .where(
        and(
          eq(TokenUsageSchema.tenantId, tenantId),
          gte(TokenUsageSchema.createdAt, periodStart),
          lte(TokenUsageSchema.createdAt, periodEnd),
        ),
      )
      .groupBy(TokenUsageSchema.model, TokenUsageSchema.provider);

    return results.map((r) => ({
      model: r.model,
      provider: r.provider,
      totalInput: Number(r.totalInput),
      totalOutput: Number(r.totalOutput),
      totalTokens: Number(r.totalTokens),
      totalCostCents: Number(r.totalCostCents),
      requestCount: Number(r.requestCount),
    }));
  },

  async selectTokenUsageByUser(tenantId, userId, periodStart, periodEnd) {
    const results = await db
      .select()
      .from(TokenUsageSchema)
      .where(
        and(
          eq(TokenUsageSchema.tenantId, tenantId),
          eq(TokenUsageSchema.userId, userId),
          gte(TokenUsageSchema.createdAt, periodStart),
          lte(TokenUsageSchema.createdAt, periodEnd),
        ),
      )
      .orderBy(desc(TokenUsageSchema.createdAt));

    return results.map((r) => ({
      ...r,
      costCents: r.costCents != null ? Number(r.costCents) : null,
    })) as TokenUsage[];
  },

  // ─── API Keys ──────────────────────────────────────────────────────────────

  async insertApiKey(key) {
    const [result] = await db
      .insert(ApiKeySchema)
      .values({
        tenantId: key.tenantId,
        userId: key.userId,
        name: key.name,
        keyHash: key.keyHash,
        keyPrefix: key.keyPrefix,
        scopes: key.scopes ?? ["read"],
        expiresAt: key.expiresAt ? new Date(key.expiresAt) : null,
      })
      .returning();
    return result as ApiKey;
  },

  async selectApiKeysByTenantId(tenantId) {
    const results = await db
      .select()
      .from(ApiKeySchema)
      .where(
        and(
          eq(ApiKeySchema.tenantId, tenantId),
          sql`${ApiKeySchema.revokedAt} IS NULL`,
        ),
      )
      .orderBy(desc(ApiKeySchema.createdAt));
    return results as ApiKey[];
  },

  async selectApiKeyByHash(keyHash) {
    const [result] = await db
      .select()
      .from(ApiKeySchema)
      .where(eq(ApiKeySchema.keyHash, keyHash));
    return (result as ApiKey) ?? null;
  },

  async revokeApiKey(id, tenantId) {
    await db
      .update(ApiKeySchema)
      .set({ revokedAt: new Date() })
      .where(and(eq(ApiKeySchema.id, id), eq(ApiKeySchema.tenantId, tenantId)));
  },
};

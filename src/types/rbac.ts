import z from "zod";

// ============================================================================
// ROLES & PERMISSIONS
// ============================================================================

export const RoleTypeSchema = z.enum([
  "super-admin",
  "tenant-admin",
  "manager",
  "user",
  "viewer",
  "custom",
]);
export type RoleType = z.infer<typeof RoleTypeSchema>;

export const PermissionActionSchema = z.enum([
  "create",
  "read",
  "update",
  "delete",
  "execute",
  "manage",
]);
export type PermissionAction = z.infer<typeof PermissionActionSchema>;

export const PermissionResourceSchema = z.enum([
  "users",
  "roles",
  "tenants",
  "connectors",
  "agents",
  "leads",
  "prospects",
  "contacts",
  "knowledge",
  "company-profiles",
  "industries",
  "billing",
  "subscriptions",
  "analytics",
  "workflows",
  "admin",
  "settings",
  "api-keys",
]);
export type PermissionResource = z.infer<typeof PermissionResourceSchema>;

export type Permission = {
  id: string;
  resource: PermissionResource;
  action: PermissionAction;
  description: string;
  createdAt: Date;
};

export const RoleCreateSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: RoleTypeSchema,
  description: z.string().max(500).optional(),
  permissions: z.array(z.string().uuid()).default([]),
  isDefault: z.boolean().default(false),
});

export const RoleUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: z.array(z.string().uuid()).optional(),
  isDefault: z.boolean().optional(),
});

export type Role = {
  id: string;
  tenantId: string;
  name: string;
  type: RoleType;
  description: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RolePermission = {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: Date;
};

export type UserRole = {
  id: string;
  userId: string;
  roleId: string;
  tenantId: string;
  assignedBy: string | null;
  createdAt: Date;
};

// ============================================================================
// TRIALS
// ============================================================================

export const TrialStatusSchema = z.enum([
  "active",
  "expired",
  "converted",
  "canceled",
]);
export type TrialStatus = z.infer<typeof TrialStatusSchema>;

export const TrialCreateSchema = z.object({
  tenantId: z.string().uuid(),
  plan: z.string().min(1),
  durationDays: z.number().int().min(1).max(90).default(14),
  features: z.record(z.string(), z.boolean()).default({}),
  maxUsers: z.number().int().min(1).default(5),
  maxAiRequests: z.number().int().min(1).default(1000),
});

export type Trial = {
  id: string;
  tenantId: string;
  plan: string;
  status: TrialStatus;
  startDate: Date;
  endDate: Date;
  features: Record<string, boolean>;
  maxUsers: number;
  maxAiRequests: number;
  convertedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// TOKEN TRACKING
// ============================================================================

export const TokenUsageCreateSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  model: z.string().min(1),
  provider: z.string().min(1),
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  totalTokens: z.number().int().min(0),
  costCents: z.number().min(0).optional(),
  sessionId: z.string().optional(),
  agentType: z.string().optional(),
  vertical: z.string().optional(),
});

export type TokenUsage = {
  id: string;
  tenantId: string;
  userId: string | null;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costCents: number | null;
  sessionId: string | null;
  agentType: string | null;
  vertical: string | null;
  createdAt: Date;
};

// ============================================================================
// API KEYS
// ============================================================================

export const ApiKeyCreateSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(200),
  scopes: z.array(z.string()).default(["read"]),
  expiresAt: z.string().datetime().optional(),
});

export type ApiKey = {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
};

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export type RBACRepository = {
  // Permissions
  selectAllPermissions(): Promise<Permission[]>;
  selectPermissionsByIds(ids: string[]): Promise<Permission[]>;

  // Roles
  insertRole(role: z.infer<typeof RoleCreateSchema>): Promise<Role>;
  selectRolesByTenantId(tenantId: string): Promise<Role[]>;
  selectRoleById(id: string, tenantId: string): Promise<Role | null>;
  updateRole(
    id: string,
    tenantId: string,
    data: z.infer<typeof RoleUpdateSchema>,
  ): Promise<Role>;
  deleteRole(id: string, tenantId: string): Promise<void>;

  // Role-Permission mapping
  insertRolePermission(
    roleId: string,
    permissionId: string,
  ): Promise<RolePermission>;
  deleteRolePermissions(roleId: string): Promise<void>;
  selectPermissionsByRoleId(roleId: string): Promise<Permission[]>;

  // User-Role mapping
  insertUserRole(
    userId: string,
    roleId: string,
    tenantId: string,
    assignedBy?: string,
  ): Promise<UserRole>;
  deleteUserRole(
    userId: string,
    roleId: string,
    tenantId: string,
  ): Promise<void>;
  selectRolesByUserId(userId: string, tenantId: string): Promise<Role[]>;
  selectUsersByRoleId(
    roleId: string,
    tenantId: string,
  ): Promise<{ userId: string; assignedAt: Date }[]>;

  // Trials
  insertTrial(trial: z.infer<typeof TrialCreateSchema>): Promise<Trial>;
  selectTrialByTenantId(tenantId: string): Promise<Trial | null>;
  selectAllTrials(): Promise<Trial[]>;
  updateTrialStatus(
    id: string,
    status: z.infer<typeof TrialStatusSchema>,
  ): Promise<Trial>;

  // Token Usage
  insertTokenUsage(
    usage: z.infer<typeof TokenUsageCreateSchema>,
  ): Promise<TokenUsage>;
  selectTokenUsageSummary(
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<
    {
      model: string;
      provider: string;
      totalInput: number;
      totalOutput: number;
      totalTokens: number;
      totalCostCents: number;
      requestCount: number;
    }[]
  >;
  selectTokenUsageByUser(
    tenantId: string,
    userId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<TokenUsage[]>;

  // API Keys
  insertApiKey(
    key: z.infer<typeof ApiKeyCreateSchema> & {
      keyHash: string;
      keyPrefix: string;
    },
  ): Promise<ApiKey>;
  selectApiKeysByTenantId(tenantId: string): Promise<ApiKey[]>;
  selectApiKeyByHash(keyHash: string): Promise<ApiKey | null>;
  revokeApiKey(id: string, tenantId: string): Promise<void>;
};

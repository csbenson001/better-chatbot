import z from "zod";

// ============================================================================
// STATE REGULATORY SOURCES
// ============================================================================

export const StateSourceTypeSchema = z.enum([
  "oil-gas-commission",
  "environmental-agency",
  "air-quality",
  "water-quality",
  "waste-management",
  "permits-registry",
  "enforcement-actions",
  "emissions-inventory",
  "compliance-monitoring",
  "well-registry",
  "production-data",
  "general-regulatory",
]);
export type StateSourceType = z.infer<typeof StateSourceTypeSchema>;

export const StateSourceCreateSchema = z.object({
  tenantId: z.string().uuid(),
  state: z.string().min(2).max(2),
  name: z.string().min(1).max(300),
  sourceType: StateSourceTypeSchema,
  agencyName: z.string().max(300).optional(),
  url: z.string().url(),
  apiEndpoint: z.string().optional(),
  searchUrl: z.string().url().optional(),
  dataFormat: z
    .enum(["html", "json", "xml", "csv", "pdf", "api"])
    .default("html"),
  capabilities: z.array(z.string()).default([]),
  scrapingConfig: z.record(z.string(), z.unknown()).default({}),
  schedule: z.string().optional(),
  enabled: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type StateSource = {
  id: string;
  tenantId: string;
  state: string;
  name: string;
  sourceType: StateSourceType;
  agencyName: string | null;
  url: string;
  apiEndpoint: string | null;
  searchUrl: string | null;
  dataFormat: string;
  capabilities: string[];
  scrapingConfig: Record<string, unknown>;
  schedule: string | null;
  enabled: boolean;
  lastScanAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// RESEARCH TASKS
// ============================================================================

export const ResearchTaskStatusSchema = z.enum([
  "pending",
  "in-progress",
  "completed",
  "failed",
  "canceled",
]);
export type ResearchTaskStatus = z.infer<typeof ResearchTaskStatusSchema>;

export const ResearchTaskTypeSchema = z.enum([
  "company-deep-dive",
  "facility-compliance",
  "state-permit-scan",
  "enforcement-scan",
  "emissions-analysis",
  "competitor-analysis",
  "market-opportunity",
  "regulatory-change-scan",
  "contact-discovery",
  "prospect-qualification",
]);
export type ResearchTaskType = z.infer<typeof ResearchTaskTypeSchema>;

export const ResearchTaskCreateSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  taskType: ResearchTaskTypeSchema,
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  targetCompany: z.string().optional(),
  targetState: z.string().max(2).optional(),
  targetFacilityId: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).default({}),
  sourceIds: z.array(z.string().uuid()).default([]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

export type ResearchTask = {
  id: string;
  tenantId: string;
  userId: string | null;
  taskType: ResearchTaskType;
  title: string;
  description: string | null;
  targetCompany: string | null;
  targetState: string | null;
  targetFacilityId: string | null;
  parameters: Record<string, unknown>;
  sourceIds: string[];
  priority: string;
  status: ResearchTaskStatus;
  results: Record<string, unknown> | null;
  findings: ResearchFinding[];
  agentLog: AgentLogEntry[];
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ResearchFinding = {
  type: string;
  title: string;
  summary: string;
  confidence: number;
  sourceUrl?: string;
  data: Record<string, unknown>;
  actionable: boolean;
  suggestedAction?: string;
};

export type AgentLogEntry = {
  timestamp: string;
  agent: string;
  action: string;
  message: string;
  data?: Record<string, unknown>;
};

// ============================================================================
// RESEARCH AGENT CONFIGS (per-tenant customizable)
// ============================================================================

export const ResearchAgentConfigCreateSchema = z.object({
  tenantId: z.string().uuid(),
  agentType: ResearchTaskTypeSchema,
  name: z.string().min(1).max(200),
  systemPrompt: z.string(),
  targetStates: z.array(z.string()).default([]),
  targetIndustries: z.array(z.string()).default([]),
  enabledSources: z.array(z.string().uuid()).default([]),
  searchKeywords: z.array(z.string()).default([]),
  filters: z.record(z.string(), z.unknown()).default({}),
  schedule: z.string().optional(),
  enabled: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type ResearchAgentConfig = {
  id: string;
  tenantId: string;
  agentType: ResearchTaskType;
  name: string;
  systemPrompt: string;
  targetStates: string[];
  targetIndustries: string[];
  enabledSources: string[];
  searchKeywords: string[];
  filters: Record<string, unknown>;
  schedule: string | null;
  enabled: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export type StateResearchRepository = {
  // State Sources
  insertStateSource(
    source: z.infer<typeof StateSourceCreateSchema>,
  ): Promise<StateSource>;
  selectStateSourcesByTenantId(
    tenantId: string,
    options?: {
      state?: string;
      sourceType?: StateSourceType;
      enabled?: boolean;
    },
  ): Promise<StateSource[]>;
  selectStateSourceById(
    id: string,
    tenantId: string,
  ): Promise<StateSource | null>;
  updateStateSource(
    id: string,
    tenantId: string,
    data: Partial<z.infer<typeof StateSourceCreateSchema>> & {
      lastScanAt?: Date;
    },
  ): Promise<StateSource>;
  deleteStateSource(id: string, tenantId: string): Promise<void>;
  selectStateSourcesByState(
    state: string,
    tenantId: string,
  ): Promise<StateSource[]>;

  // Research Tasks
  insertResearchTask(
    task: z.infer<typeof ResearchTaskCreateSchema>,
  ): Promise<ResearchTask>;
  selectResearchTasksByTenantId(
    tenantId: string,
    options?: {
      status?: ResearchTaskStatus;
      taskType?: ResearchTaskType;
      targetState?: string;
      userId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<ResearchTask[]>;
  selectResearchTaskById(
    id: string,
    tenantId: string,
  ): Promise<ResearchTask | null>;
  updateResearchTask(
    id: string,
    tenantId: string,
    data: {
      status?: ResearchTaskStatus;
      results?: Record<string, unknown>;
      findings?: ResearchFinding[];
      agentLog?: AgentLogEntry[];
      startedAt?: Date;
      completedAt?: Date;
      errorMessage?: string | null;
    },
  ): Promise<ResearchTask>;

  // Research Agent Configs
  insertResearchAgentConfig(
    config: z.infer<typeof ResearchAgentConfigCreateSchema>,
  ): Promise<ResearchAgentConfig>;
  selectResearchAgentConfigsByTenantId(
    tenantId: string,
    options?: {
      agentType?: ResearchTaskType;
      enabled?: boolean;
    },
  ): Promise<ResearchAgentConfig[]>;
  selectResearchAgentConfigById(
    id: string,
    tenantId: string,
  ): Promise<ResearchAgentConfig | null>;
  updateResearchAgentConfig(
    id: string,
    tenantId: string,
    data: Partial<z.infer<typeof ResearchAgentConfigCreateSchema>>,
  ): Promise<ResearchAgentConfig>;
  deleteResearchAgentConfig(id: string, tenantId: string): Promise<void>;
};

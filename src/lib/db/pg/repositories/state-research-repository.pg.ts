import type {
  StateResearchRepository,
  StateSource,
  ResearchTask,
  ResearchAgentConfig,
  AgentLogEntry,
} from "app-types/state-research";
import { pgDb as db } from "../db.pg";
import {
  StateSourceSchema,
  ResearchTaskSchema,
  ResearchAgentConfigSchema,
} from "../schema.pg";
import { eq, and, desc } from "drizzle-orm";

export const pgStateResearchRepository: StateResearchRepository = {
  // ─── State Sources ────────────────────────────────────────────────────────────

  async insertStateSource(source) {
    const [result] = await db
      .insert(StateSourceSchema)
      .values(source)
      .returning();
    return result as unknown as StateSource;
  },

  async selectStateSourcesByTenantId(tenantId, options) {
    const conditions = [eq(StateSourceSchema.tenantId, tenantId)];

    if (options?.state) {
      conditions.push(eq(StateSourceSchema.state, options.state));
    }
    if (options?.sourceType) {
      conditions.push(eq(StateSourceSchema.sourceType, options.sourceType));
    }
    if (options?.enabled !== undefined) {
      conditions.push(eq(StateSourceSchema.enabled, options.enabled));
    }

    const results = await db
      .select()
      .from(StateSourceSchema)
      .where(and(...conditions))
      .orderBy(desc(StateSourceSchema.createdAt));

    return results as unknown as StateSource[];
  },

  async selectStateSourceById(id, tenantId) {
    const [result] = await db
      .select()
      .from(StateSourceSchema)
      .where(
        and(
          eq(StateSourceSchema.id, id),
          eq(StateSourceSchema.tenantId, tenantId),
        ),
      );
    return (result as unknown as StateSource) ?? null;
  },

  async updateStateSource(id, tenantId, data) {
    const [result] = await db
      .update(StateSourceSchema)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(StateSourceSchema.id, id),
          eq(StateSourceSchema.tenantId, tenantId),
        ),
      )
      .returning();
    return result as unknown as StateSource;
  },

  async deleteStateSource(id, tenantId) {
    await db
      .delete(StateSourceSchema)
      .where(
        and(
          eq(StateSourceSchema.id, id),
          eq(StateSourceSchema.tenantId, tenantId),
        ),
      );
  },

  async selectStateSourcesByState(state, tenantId) {
    const results = await db
      .select()
      .from(StateSourceSchema)
      .where(
        and(
          eq(StateSourceSchema.tenantId, tenantId),
          eq(StateSourceSchema.state, state),
        ),
      )
      .orderBy(desc(StateSourceSchema.createdAt));

    return results as unknown as StateSource[];
  },

  // ─── Research Tasks ───────────────────────────────────────────────────────────

  async insertResearchTask(task) {
    const [result] = await db
      .insert(ResearchTaskSchema)
      .values(task)
      .returning();
    return result as unknown as ResearchTask;
  },

  async selectResearchTasksByTenantId(tenantId, options) {
    const conditions = [eq(ResearchTaskSchema.tenantId, tenantId)];

    if (options?.status) {
      conditions.push(eq(ResearchTaskSchema.status, options.status));
    }
    if (options?.taskType) {
      conditions.push(eq(ResearchTaskSchema.taskType, options.taskType));
    }
    if (options?.targetState) {
      conditions.push(eq(ResearchTaskSchema.targetState, options.targetState));
    }
    if (options?.userId) {
      conditions.push(eq(ResearchTaskSchema.userId, options.userId));
    }

    const query = db
      .select()
      .from(ResearchTaskSchema)
      .where(and(...conditions))
      .orderBy(desc(ResearchTaskSchema.createdAt))
      .limit(options?.limit ?? 50)
      .offset(options?.offset ?? 0);

    const results = await query;
    return results as unknown as ResearchTask[];
  },

  async selectResearchTaskById(id, tenantId) {
    const [result] = await db
      .select()
      .from(ResearchTaskSchema)
      .where(
        and(
          eq(ResearchTaskSchema.id, id),
          eq(ResearchTaskSchema.tenantId, tenantId),
        ),
      );
    return (result as unknown as ResearchTask) ?? null;
  },

  async updateResearchTask(id, tenantId, data) {
    // If agentLog is provided, merge with existing entries (append, don't replace)
    let mergedAgentLog: AgentLogEntry[] | undefined;

    if (data.agentLog) {
      const existing = await db
        .select({ agentLog: ResearchTaskSchema.agentLog })
        .from(ResearchTaskSchema)
        .where(
          and(
            eq(ResearchTaskSchema.id, id),
            eq(ResearchTaskSchema.tenantId, tenantId),
          ),
        );

      const existingLog = (existing[0]?.agentLog ?? []) as AgentLogEntry[];
      mergedAgentLog = [...existingLog, ...data.agentLog];
    }

    const setData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.status !== undefined) setData.status = data.status;
    if (data.results !== undefined) setData.results = data.results;
    if (data.findings !== undefined) setData.findings = data.findings;
    if (mergedAgentLog !== undefined) setData.agentLog = mergedAgentLog;
    if (data.startedAt !== undefined) setData.startedAt = data.startedAt;
    if (data.completedAt !== undefined) setData.completedAt = data.completedAt;
    if (data.errorMessage !== undefined)
      setData.errorMessage = data.errorMessage;

    const [result] = await db
      .update(ResearchTaskSchema)
      .set(setData)
      .where(
        and(
          eq(ResearchTaskSchema.id, id),
          eq(ResearchTaskSchema.tenantId, tenantId),
        ),
      )
      .returning();

    return result as unknown as ResearchTask;
  },

  // ─── Research Agent Configs ───────────────────────────────────────────────────

  async insertResearchAgentConfig(config) {
    const [result] = await db
      .insert(ResearchAgentConfigSchema)
      .values(config)
      .returning();
    return result as unknown as ResearchAgentConfig;
  },

  async selectResearchAgentConfigsByTenantId(tenantId, options) {
    const conditions = [eq(ResearchAgentConfigSchema.tenantId, tenantId)];

    if (options?.agentType) {
      conditions.push(
        eq(ResearchAgentConfigSchema.agentType, options.agentType),
      );
    }
    if (options?.enabled !== undefined) {
      conditions.push(eq(ResearchAgentConfigSchema.enabled, options.enabled));
    }

    const results = await db
      .select()
      .from(ResearchAgentConfigSchema)
      .where(and(...conditions))
      .orderBy(desc(ResearchAgentConfigSchema.createdAt));

    return results as unknown as ResearchAgentConfig[];
  },

  async selectResearchAgentConfigById(id, tenantId) {
    const [result] = await db
      .select()
      .from(ResearchAgentConfigSchema)
      .where(
        and(
          eq(ResearchAgentConfigSchema.id, id),
          eq(ResearchAgentConfigSchema.tenantId, tenantId),
        ),
      );
    return (result as unknown as ResearchAgentConfig) ?? null;
  },

  async updateResearchAgentConfig(id, tenantId, data) {
    const [result] = await db
      .update(ResearchAgentConfigSchema)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(ResearchAgentConfigSchema.id, id),
          eq(ResearchAgentConfigSchema.tenantId, tenantId),
        ),
      )
      .returning();
    return result as unknown as ResearchAgentConfig;
  },

  async deleteResearchAgentConfig(id, tenantId) {
    await db
      .delete(ResearchAgentConfigSchema)
      .where(
        and(
          eq(ResearchAgentConfigSchema.id, id),
          eq(ResearchAgentConfigSchema.tenantId, tenantId),
        ),
      );
  },
};

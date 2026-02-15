import { pgDb as db } from "../db.pg";
import {
  SalesBriefSchema,
  AlertSchema,
  AlertRuleSchema,
  ResearchWorkflowSchema,
  WorkflowRunSchema,
  RelationshipMapSchema,
  SalesPlaybookSchema,
  BuyingSignalSchema,
  ComplianceBurdenSchema,
  OutreachSequenceSchema,
  CustomerHealthSchema,
  DealAnalysisSchema,
} from "../schema.pg";
import { eq, and, desc, count, gte } from "drizzle-orm";
import type {
  BriefStatus,
  BriefType,
  AlertStatus,
  AlertCategory,
  AlertSeverity,
  PlaybookType,
  PlaybookStatus,
  CompositeSignalType,
  SequenceStatus,
  HealthStatus,
  DealOutcome,
} from "app-types/sales-intelligence";

export const pgSalesIntelligenceRepository = {
  // ─── Sales Briefs ───────────────────────────────────────────────────────────────

  async insertBrief(data: {
    tenantId: string;
    prospectId?: string | null;
    leadId?: string | null;
    companyId?: string | null;
    briefType: string;
    title: string;
  }) {
    const [result] = await db
      .insert(SalesBriefSchema)
      .values({
        tenantId: data.tenantId,
        prospectId: data.prospectId,
        leadId: data.leadId,
        companyId: data.companyId,
        briefType: data.briefType as BriefType,
        title: data.title,
      })
      .returning();
    return result;
  },

  async selectBriefsByTenantId(
    tenantId: string,
    options?: {
      status?: string;
      briefType?: string;
      prospectId?: string;
      limit?: number;
    },
  ) {
    const conditions = [eq(SalesBriefSchema.tenantId, tenantId)];

    if (options?.status) {
      conditions.push(
        eq(SalesBriefSchema.status, options.status as BriefStatus),
      );
    }
    if (options?.briefType) {
      conditions.push(
        eq(SalesBriefSchema.briefType, options.briefType as BriefType),
      );
    }
    if (options?.prospectId) {
      conditions.push(eq(SalesBriefSchema.prospectId, options.prospectId));
    }

    const results = await db
      .select()
      .from(SalesBriefSchema)
      .where(and(...conditions))
      .orderBy(desc(SalesBriefSchema.createdAt))
      .limit(options?.limit ?? 50);

    return results;
  },

  async selectBriefById(id: string, tenantId: string) {
    const [result] = await db
      .select()
      .from(SalesBriefSchema)
      .where(
        and(
          eq(SalesBriefSchema.id, id),
          eq(SalesBriefSchema.tenantId, tenantId),
        ),
      );
    return result ?? null;
  },

  async updateBrief(
    id: string,
    tenantId: string,
    data: Partial<{
      title: string;
      content: string;
      sections: unknown[];
      status: string;
      generatedBy: string;
      metadata: Record<string, unknown>;
    }>,
  ) {
    const [result] = await db
      .update(SalesBriefSchema)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(
        and(
          eq(SalesBriefSchema.id, id),
          eq(SalesBriefSchema.tenantId, tenantId),
        ),
      )
      .returning();
    return result;
  },

  // ─── Alerts ─────────────────────────────────────────────────────────────────────

  async insertAlert(data: {
    tenantId: string;
    prospectId?: string | null;
    leadId?: string | null;
    category: string;
    severity: string;
    title: string;
    description: string;
    sourceUrl?: string;
    sourceType?: string;
    actionItems?: string[];
    metadata?: Record<string, unknown>;
  }) {
    const [result] = await db
      .insert(AlertSchema)
      .values({
        tenantId: data.tenantId,
        prospectId: data.prospectId,
        leadId: data.leadId,
        category: data.category as AlertCategory,
        severity: data.severity as AlertSeverity,
        title: data.title,
        description: data.description,
        sourceUrl: data.sourceUrl,
        sourceType: data.sourceType,
        actionItems: data.actionItems ?? [],
        metadata: data.metadata ?? {},
      })
      .returning();
    return result;
  },

  async selectAlertsByTenantId(
    tenantId: string,
    options?: {
      status?: string;
      category?: string;
      severity?: string;
      limit?: number;
    },
  ) {
    const conditions = [eq(AlertSchema.tenantId, tenantId)];

    if (options?.status) {
      conditions.push(eq(AlertSchema.status, options.status as AlertStatus));
    }
    if (options?.category) {
      conditions.push(
        eq(AlertSchema.category, options.category as AlertCategory),
      );
    }
    if (options?.severity) {
      conditions.push(
        eq(AlertSchema.severity, options.severity as AlertSeverity),
      );
    }

    const results = await db
      .select()
      .from(AlertSchema)
      .where(and(...conditions))
      .orderBy(desc(AlertSchema.createdAt))
      .limit(options?.limit ?? 50);

    return results;
  },

  async selectAlertById(id: string, tenantId: string) {
    const [result] = await db
      .select()
      .from(AlertSchema)
      .where(and(eq(AlertSchema.id, id), eq(AlertSchema.tenantId, tenantId)));
    return result ?? null;
  },

  async updateAlertStatus(
    id: string,
    tenantId: string,
    status: string,
    acknowledgedBy?: string,
  ) {
    const setData: Record<string, unknown> = { status: status as AlertStatus };
    if (acknowledgedBy) {
      setData.acknowledgedBy = acknowledgedBy;
      setData.acknowledgedAt = new Date();
    }

    const [result] = await db
      .update(AlertSchema)
      .set(setData as any)
      .where(and(eq(AlertSchema.id, id), eq(AlertSchema.tenantId, tenantId)))
      .returning();
    return result;
  },

  async countAlertsByTenantId(
    tenantId: string,
    options?: { status?: string; category?: string },
  ) {
    const conditions = [eq(AlertSchema.tenantId, tenantId)];

    if (options?.status) {
      conditions.push(eq(AlertSchema.status, options.status as AlertStatus));
    }
    if (options?.category) {
      conditions.push(
        eq(AlertSchema.category, options.category as AlertCategory),
      );
    }

    const [result] = await db
      .select({ count: count() })
      .from(AlertSchema)
      .where(and(...conditions));

    return result.count;
  },

  // ─── Alert Rules ────────────────────────────────────────────────────────────────

  async insertAlertRule(data: {
    tenantId: string;
    name: string;
    description?: string;
    category: string;
    conditions?: unknown[];
    severity?: string;
    notifyChannels?: string[];
  }) {
    const [result] = await db
      .insert(AlertRuleSchema)
      .values({
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        category: data.category as AlertCategory,
        conditions: (data.conditions ?? []) as any,
        severity: (data.severity ?? "medium") as AlertSeverity,
        notifyChannels: (data.notifyChannels ?? []) as any,
      })
      .returning();
    return result;
  },

  async selectAlertRulesByTenantId(tenantId: string) {
    const results = await db
      .select()
      .from(AlertRuleSchema)
      .where(eq(AlertRuleSchema.tenantId, tenantId))
      .orderBy(desc(AlertRuleSchema.createdAt));

    return results;
  },

  async updateAlertRule(
    id: string,
    tenantId: string,
    data: Partial<{
      name: string;
      description: string;
      category: string;
      conditions: unknown[];
      severity: string;
      notifyChannels: string[];
      enabled: boolean;
      metadata: Record<string, unknown>;
    }>,
  ) {
    const [result] = await db
      .update(AlertRuleSchema)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(
        and(eq(AlertRuleSchema.id, id), eq(AlertRuleSchema.tenantId, tenantId)),
      )
      .returning();
    return result;
  },

  async deleteAlertRule(id: string, tenantId: string) {
    await db
      .delete(AlertRuleSchema)
      .where(
        and(eq(AlertRuleSchema.id, id), eq(AlertRuleSchema.tenantId, tenantId)),
      );
  },

  // ─── Research Workflows ─────────────────────────────────────────────────────────

  async insertWorkflow(data: {
    tenantId: string;
    name: string;
    description?: string;
    steps?: unknown[];
    schedule?: string;
  }) {
    const [result] = await db
      .insert(ResearchWorkflowSchema)
      .values({
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        steps: (data.steps ?? []) as any,
        schedule: data.schedule,
      })
      .returning();
    return result;
  },

  async selectWorkflowsByTenantId(tenantId: string) {
    const results = await db
      .select()
      .from(ResearchWorkflowSchema)
      .where(eq(ResearchWorkflowSchema.tenantId, tenantId))
      .orderBy(desc(ResearchWorkflowSchema.createdAt));

    return results;
  },

  async selectWorkflowById(id: string, tenantId: string) {
    const [result] = await db
      .select()
      .from(ResearchWorkflowSchema)
      .where(
        and(
          eq(ResearchWorkflowSchema.id, id),
          eq(ResearchWorkflowSchema.tenantId, tenantId),
        ),
      );
    return result ?? null;
  },

  async updateWorkflow(
    id: string,
    tenantId: string,
    data: Partial<{
      name: string;
      description: string;
      steps: unknown[];
      schedule: string;
      enabled: boolean;
      lastRunId: string;
      metadata: Record<string, unknown>;
    }>,
  ) {
    const [result] = await db
      .update(ResearchWorkflowSchema)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(
        and(
          eq(ResearchWorkflowSchema.id, id),
          eq(ResearchWorkflowSchema.tenantId, tenantId),
        ),
      )
      .returning();
    return result;
  },

  async deleteWorkflow(id: string, tenantId: string) {
    await db
      .delete(ResearchWorkflowSchema)
      .where(
        and(
          eq(ResearchWorkflowSchema.id, id),
          eq(ResearchWorkflowSchema.tenantId, tenantId),
        ),
      );
  },

  // ─── Workflow Runs ──────────────────────────────────────────────────────────────

  async insertWorkflowRun(data: {
    workflowId: string;
    tenantId: string;
  }) {
    const [result] = await db
      .insert(WorkflowRunSchema)
      .values({
        workflowId: data.workflowId,
        tenantId: data.tenantId,
      })
      .returning();
    return result;
  },

  async selectWorkflowRunsByWorkflowId(
    workflowId: string,
    tenantId: string,
    limit?: number,
  ) {
    const results = await db
      .select()
      .from(WorkflowRunSchema)
      .where(
        and(
          eq(WorkflowRunSchema.workflowId, workflowId),
          eq(WorkflowRunSchema.tenantId, tenantId),
        ),
      )
      .orderBy(desc(WorkflowRunSchema.createdAt))
      .limit(limit ?? 50);

    return results;
  },

  async selectWorkflowRunById(id: string, tenantId: string) {
    const [result] = await db
      .select()
      .from(WorkflowRunSchema)
      .where(
        and(
          eq(WorkflowRunSchema.id, id),
          eq(WorkflowRunSchema.tenantId, tenantId),
        ),
      );
    return result ?? null;
  },

  async updateWorkflowRun(
    id: string,
    tenantId: string,
    data: Partial<{
      status: string;
      currentStep: number;
      stepResults: unknown[];
      startedAt: Date;
      completedAt: Date;
      errorMessage: string;
      metadata: Record<string, unknown>;
    }>,
  ) {
    const [result] = await db
      .update(WorkflowRunSchema)
      .set(data as any)
      .where(
        and(
          eq(WorkflowRunSchema.id, id),
          eq(WorkflowRunSchema.tenantId, tenantId),
        ),
      )
      .returning();
    return result;
  },

  // ─── Relationship Maps ──────────────────────────────────────────────────────────

  async insertRelationshipMap(data: {
    tenantId: string;
    prospectId?: string | null;
    leadId?: string | null;
    companyName: string;
    contacts?: unknown[];
    relationships?: unknown[];
    dealStrategy?: string;
  }) {
    const [result] = await db
      .insert(RelationshipMapSchema)
      .values({
        tenantId: data.tenantId,
        prospectId: data.prospectId,
        leadId: data.leadId,
        companyName: data.companyName,
        contacts: (data.contacts ?? []) as any,
        relationships: (data.relationships ?? []) as any,
        dealStrategy: data.dealStrategy,
      })
      .returning();
    return result;
  },

  async selectRelationshipMapsByTenantId(
    tenantId: string,
    options?: { prospectId?: string; leadId?: string; limit?: number },
  ) {
    const conditions = [eq(RelationshipMapSchema.tenantId, tenantId)];

    if (options?.prospectId) {
      conditions.push(eq(RelationshipMapSchema.prospectId, options.prospectId));
    }
    if (options?.leadId) {
      conditions.push(eq(RelationshipMapSchema.leadId, options.leadId));
    }

    const results = await db
      .select()
      .from(RelationshipMapSchema)
      .where(and(...conditions))
      .orderBy(desc(RelationshipMapSchema.createdAt))
      .limit(options?.limit ?? 50);

    return results;
  },

  async selectRelationshipMapById(id: string, tenantId: string) {
    const [result] = await db
      .select()
      .from(RelationshipMapSchema)
      .where(
        and(
          eq(RelationshipMapSchema.id, id),
          eq(RelationshipMapSchema.tenantId, tenantId),
        ),
      );
    return result ?? null;
  },

  async updateRelationshipMap(
    id: string,
    tenantId: string,
    data: Partial<{
      companyName: string;
      contacts: unknown[];
      relationships: unknown[];
      dealStrategy: string;
      metadata: Record<string, unknown>;
    }>,
  ) {
    const [result] = await db
      .update(RelationshipMapSchema)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(
        and(
          eq(RelationshipMapSchema.id, id),
          eq(RelationshipMapSchema.tenantId, tenantId),
        ),
      )
      .returning();
    return result;
  },

  // ─── Sales Playbooks ───────────────────────────────────────────────────────────

  async insertPlaybook(data: {
    tenantId: string;
    industryId?: string | null;
    type: string;
    title: string;
    content?: string;
    sections?: unknown[];
    targetPersona?: string;
    tags?: string[];
  }) {
    const [result] = await db
      .insert(SalesPlaybookSchema)
      .values({
        tenantId: data.tenantId,
        industryId: data.industryId,
        type: data.type as PlaybookType,
        title: data.title,
        content: data.content ?? "",
        sections: (data.sections ?? []) as any,
        targetPersona: data.targetPersona,
        tags: (data.tags ?? []) as any,
      })
      .returning();
    return result;
  },

  async selectPlaybooksByTenantId(
    tenantId: string,
    options?: {
      type?: string;
      status?: string;
      industryId?: string;
      limit?: number;
    },
  ) {
    const conditions = [eq(SalesPlaybookSchema.tenantId, tenantId)];

    if (options?.type) {
      conditions.push(
        eq(SalesPlaybookSchema.type, options.type as PlaybookType),
      );
    }
    if (options?.status) {
      conditions.push(
        eq(SalesPlaybookSchema.status, options.status as PlaybookStatus),
      );
    }
    if (options?.industryId) {
      conditions.push(eq(SalesPlaybookSchema.industryId, options.industryId));
    }

    const results = await db
      .select()
      .from(SalesPlaybookSchema)
      .where(and(...conditions))
      .orderBy(desc(SalesPlaybookSchema.createdAt))
      .limit(options?.limit ?? 50);

    return results;
  },

  async selectPlaybookById(id: string, tenantId: string) {
    const [result] = await db
      .select()
      .from(SalesPlaybookSchema)
      .where(
        and(
          eq(SalesPlaybookSchema.id, id),
          eq(SalesPlaybookSchema.tenantId, tenantId),
        ),
      );
    return result ?? null;
  },

  async updatePlaybook(
    id: string,
    tenantId: string,
    data: Partial<{
      title: string;
      content: string;
      sections: unknown[];
      targetPersona: string;
      status: string;
      version: number;
      tags: string[];
      metadata: Record<string, unknown>;
    }>,
  ) {
    const [result] = await db
      .update(SalesPlaybookSchema)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(
        and(
          eq(SalesPlaybookSchema.id, id),
          eq(SalesPlaybookSchema.tenantId, tenantId),
        ),
      )
      .returning();
    return result;
  },

  async deletePlaybook(id: string, tenantId: string) {
    await db
      .delete(SalesPlaybookSchema)
      .where(
        and(
          eq(SalesPlaybookSchema.id, id),
          eq(SalesPlaybookSchema.tenantId, tenantId),
        ),
      );
  },

  // ─── Buying Signals ─────────────────────────────────────────────────────────────

  async insertBuyingSignal(data: {
    tenantId: string;
    prospectId: string;
    signalType: string;
    title: string;
    description: string;
    compositeScore?: number;
    componentSignals?: unknown[];
    recommendedAction: string;
    optimalTiming?: string;
    expiresAt?: Date;
  }) {
    const [result] = await db
      .insert(BuyingSignalSchema)
      .values({
        tenantId: data.tenantId,
        prospectId: data.prospectId,
        signalType: data.signalType as CompositeSignalType,
        title: data.title,
        description: data.description,
        compositeScore: data.compositeScore ?? 50,
        componentSignals: (data.componentSignals ?? []) as any,
        recommendedAction: data.recommendedAction,
        optimalTiming: data.optimalTiming,
        expiresAt: data.expiresAt,
      })
      .returning();
    return result;
  },

  async selectBuyingSignalsByTenantId(
    tenantId: string,
    options?: {
      prospectId?: string;
      signalType?: string;
      minScore?: number;
      limit?: number;
    },
  ) {
    const conditions = [eq(BuyingSignalSchema.tenantId, tenantId)];

    if (options?.prospectId) {
      conditions.push(eq(BuyingSignalSchema.prospectId, options.prospectId));
    }
    if (options?.signalType) {
      conditions.push(
        eq(
          BuyingSignalSchema.signalType,
          options.signalType as CompositeSignalType,
        ),
      );
    }
    if (options?.minScore != null) {
      conditions.push(gte(BuyingSignalSchema.compositeScore, options.minScore));
    }

    const results = await db
      .select()
      .from(BuyingSignalSchema)
      .where(and(...conditions))
      .orderBy(desc(BuyingSignalSchema.detectedAt))
      .limit(options?.limit ?? 50);

    return results;
  },

  async selectBuyingSignalsByProspectId(prospectId: string, tenantId: string) {
    const results = await db
      .select()
      .from(BuyingSignalSchema)
      .where(
        and(
          eq(BuyingSignalSchema.prospectId, prospectId),
          eq(BuyingSignalSchema.tenantId, tenantId),
        ),
      )
      .orderBy(desc(BuyingSignalSchema.detectedAt));

    return results;
  },

  // ─── Compliance Burden ──────────────────────────────────────────────────────────

  async insertComplianceBurden(data: {
    tenantId: string;
    prospectId: string;
    facilityCount: number;
    regulatoryPrograms: string[];
    estimatedAnnualCost: number;
    costBreakdown?: unknown[];
    riskLevel?: string;
    savingsOpportunity?: number;
    roiProjection?: unknown;
  }) {
    const [result] = await db
      .insert(ComplianceBurdenSchema)
      .values({
        tenantId: data.tenantId,
        prospectId: data.prospectId,
        facilityCount: data.facilityCount,
        regulatoryPrograms: data.regulatoryPrograms as any,
        estimatedAnnualCost: String(data.estimatedAnnualCost),
        costBreakdown: (data.costBreakdown ?? []) as any,
        riskLevel: (data.riskLevel ?? "medium") as
          | "low"
          | "medium"
          | "high"
          | "critical",
        savingsOpportunity:
          data.savingsOpportunity != null
            ? String(data.savingsOpportunity)
            : "0",
        roiProjection: (data.roiProjection ?? {}) as any,
      })
      .returning();
    return {
      ...result,
      estimatedAnnualCost: Number(result.estimatedAnnualCost),
      savingsOpportunity: Number(result.savingsOpportunity),
    };
  },

  async selectComplianceBurdenByProspectId(
    prospectId: string,
    tenantId: string,
  ) {
    const results = await db
      .select()
      .from(ComplianceBurdenSchema)
      .where(
        and(
          eq(ComplianceBurdenSchema.prospectId, prospectId),
          eq(ComplianceBurdenSchema.tenantId, tenantId),
        ),
      )
      .orderBy(desc(ComplianceBurdenSchema.createdAt));

    return results.map((r) => ({
      ...r,
      estimatedAnnualCost: Number(r.estimatedAnnualCost),
      savingsOpportunity: Number(r.savingsOpportunity),
    }));
  },

  async updateComplianceBurden(
    id: string,
    tenantId: string,
    data: Partial<{
      facilityCount: number;
      regulatoryPrograms: string[];
      estimatedAnnualCost: number;
      costBreakdown: unknown[];
      riskLevel: string;
      savingsOpportunity: number;
      roiProjection: unknown;
      metadata: Record<string, unknown>;
    }>,
  ) {
    const setData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };
    if (data.estimatedAnnualCost != null) {
      setData.estimatedAnnualCost = String(data.estimatedAnnualCost);
    }
    if (data.savingsOpportunity != null) {
      setData.savingsOpportunity = String(data.savingsOpportunity);
    }

    const [result] = await db
      .update(ComplianceBurdenSchema)
      .set(setData as any)
      .where(
        and(
          eq(ComplianceBurdenSchema.id, id),
          eq(ComplianceBurdenSchema.tenantId, tenantId),
        ),
      )
      .returning();
    return {
      ...result,
      estimatedAnnualCost: Number(result.estimatedAnnualCost),
      savingsOpportunity: Number(result.savingsOpportunity),
    };
  },

  // ─── Outreach Sequences ─────────────────────────────────────────────────────────

  async insertOutreachSequence(data: {
    tenantId: string;
    prospectId?: string | null;
    contactId?: string | null;
    name: string;
    description?: string;
    steps?: unknown[];
    personalizationContext?: Record<string, unknown>;
  }) {
    const [result] = await db
      .insert(OutreachSequenceSchema)
      .values({
        tenantId: data.tenantId,
        prospectId: data.prospectId,
        contactId: data.contactId,
        name: data.name,
        description: data.description,
        steps: (data.steps ?? []) as any,
        personalizationContext: (data.personalizationContext ?? {}) as any,
      })
      .returning();
    return result;
  },

  async selectOutreachSequencesByTenantId(
    tenantId: string,
    options?: { status?: string; prospectId?: string; limit?: number },
  ) {
    const conditions = [eq(OutreachSequenceSchema.tenantId, tenantId)];

    if (options?.status) {
      conditions.push(
        eq(OutreachSequenceSchema.status, options.status as SequenceStatus),
      );
    }
    if (options?.prospectId) {
      conditions.push(
        eq(OutreachSequenceSchema.prospectId, options.prospectId),
      );
    }

    const results = await db
      .select()
      .from(OutreachSequenceSchema)
      .where(and(...conditions))
      .orderBy(desc(OutreachSequenceSchema.createdAt))
      .limit(options?.limit ?? 50);

    return results;
  },

  async selectOutreachSequenceById(id: string, tenantId: string) {
    const [result] = await db
      .select()
      .from(OutreachSequenceSchema)
      .where(
        and(
          eq(OutreachSequenceSchema.id, id),
          eq(OutreachSequenceSchema.tenantId, tenantId),
        ),
      );
    return result ?? null;
  },

  async updateOutreachSequence(
    id: string,
    tenantId: string,
    data: Partial<{
      name: string;
      description: string;
      steps: unknown[];
      status: string;
      personalizationContext: Record<string, unknown>;
      startedAt: Date;
      completedAt: Date;
      metadata: Record<string, unknown>;
    }>,
  ) {
    const [result] = await db
      .update(OutreachSequenceSchema)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(
        and(
          eq(OutreachSequenceSchema.id, id),
          eq(OutreachSequenceSchema.tenantId, tenantId),
        ),
      )
      .returning();
    return result;
  },

  // ─── Customer Health ────────────────────────────────────────────────────────────

  async insertCustomerHealth(data: {
    tenantId: string;
    leadId: string;
    companyId?: string | null;
    healthScore?: number;
    healthStatus?: string;
    engagementScore?: number;
    adoptionScore?: number;
    sentimentScore?: number;
    expansionProbability?: number;
    churnRisk?: number;
    factors?: unknown[];
    expansionOpportunities?: unknown[];
  }) {
    const [result] = await db
      .insert(CustomerHealthSchema)
      .values({
        tenantId: data.tenantId,
        leadId: data.leadId,
        companyId: data.companyId,
        healthScore: data.healthScore ?? 50,
        healthStatus: (data.healthStatus ?? "healthy") as HealthStatus,
        engagementScore: data.engagementScore ?? 50,
        adoptionScore: data.adoptionScore ?? 50,
        sentimentScore: data.sentimentScore ?? 50,
        expansionProbability:
          data.expansionProbability != null
            ? String(data.expansionProbability)
            : "0",
        churnRisk: data.churnRisk != null ? String(data.churnRisk) : "0",
        factors: (data.factors ?? []) as any,
        expansionOpportunities: (data.expansionOpportunities ?? []) as any,
      })
      .returning();
    return {
      ...result,
      expansionProbability: Number(result.expansionProbability),
      churnRisk: Number(result.churnRisk),
    };
  },

  async selectCustomerHealthByTenantId(
    tenantId: string,
    options?: { healthStatus?: string; minScore?: number; limit?: number },
  ) {
    const conditions = [eq(CustomerHealthSchema.tenantId, tenantId)];

    if (options?.healthStatus) {
      conditions.push(
        eq(
          CustomerHealthSchema.healthStatus,
          options.healthStatus as HealthStatus,
        ),
      );
    }
    if (options?.minScore != null) {
      conditions.push(gte(CustomerHealthSchema.healthScore, options.minScore));
    }

    const results = await db
      .select()
      .from(CustomerHealthSchema)
      .where(and(...conditions))
      .orderBy(desc(CustomerHealthSchema.createdAt))
      .limit(options?.limit ?? 50);

    return results.map((r) => ({
      ...r,
      expansionProbability: Number(r.expansionProbability),
      churnRisk: Number(r.churnRisk),
    }));
  },

  async selectCustomerHealthByLeadId(leadId: string, tenantId: string) {
    const [result] = await db
      .select()
      .from(CustomerHealthSchema)
      .where(
        and(
          eq(CustomerHealthSchema.leadId, leadId),
          eq(CustomerHealthSchema.tenantId, tenantId),
        ),
      );
    if (!result) return null;
    return {
      ...result,
      expansionProbability: Number(result.expansionProbability),
      churnRisk: Number(result.churnRisk),
    };
  },

  async updateCustomerHealth(
    id: string,
    tenantId: string,
    data: Partial<{
      healthScore: number;
      healthStatus: string;
      engagementScore: number;
      adoptionScore: number;
      sentimentScore: number;
      expansionProbability: number;
      churnRisk: number;
      factors: unknown[];
      expansionOpportunities: unknown[];
      lastAssessedAt: Date;
      metadata: Record<string, unknown>;
    }>,
  ) {
    const setData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };
    if (data.expansionProbability != null) {
      setData.expansionProbability = String(data.expansionProbability);
    }
    if (data.churnRisk != null) {
      setData.churnRisk = String(data.churnRisk);
    }

    const [result] = await db
      .update(CustomerHealthSchema)
      .set(setData as any)
      .where(
        and(
          eq(CustomerHealthSchema.id, id),
          eq(CustomerHealthSchema.tenantId, tenantId),
        ),
      )
      .returning();
    return {
      ...result,
      expansionProbability: Number(result.expansionProbability),
      churnRisk: Number(result.churnRisk),
    };
  },

  // ─── Deal Analysis ──────────────────────────────────────────────────────────────

  async insertDealAnalysis(data: {
    tenantId: string;
    leadId: string;
    prospectId?: string | null;
    outcome: string;
    dealValue?: number;
    salesCycleLength?: number;
    competitorInvolved?: string;
    winLossReasons?: string[];
    stageProgression?: unknown[];
    keyFactors?: unknown[];
    lessonsLearned?: string[];
    recommendations?: string[];
  }) {
    const [result] = await db
      .insert(DealAnalysisSchema)
      .values({
        tenantId: data.tenantId,
        leadId: data.leadId,
        prospectId: data.prospectId,
        outcome: data.outcome as DealOutcome,
        dealValue: data.dealValue != null ? String(data.dealValue) : "0",
        salesCycleLength: data.salesCycleLength ?? 0,
        competitorInvolved: data.competitorInvolved,
        winLossReasons: (data.winLossReasons ?? []) as any,
        stageProgression: (data.stageProgression ?? []) as any,
        keyFactors: (data.keyFactors ?? []) as any,
        lessonsLearned: (data.lessonsLearned ?? []) as any,
        recommendations: (data.recommendations ?? []) as any,
      })
      .returning();
    return {
      ...result,
      dealValue: Number(result.dealValue),
    };
  },

  async selectDealAnalysesByTenantId(
    tenantId: string,
    options?: { outcome?: string; limit?: number },
  ) {
    const conditions = [eq(DealAnalysisSchema.tenantId, tenantId)];

    if (options?.outcome) {
      conditions.push(
        eq(DealAnalysisSchema.outcome, options.outcome as DealOutcome),
      );
    }

    const results = await db
      .select()
      .from(DealAnalysisSchema)
      .where(and(...conditions))
      .orderBy(desc(DealAnalysisSchema.createdAt))
      .limit(options?.limit ?? 50);

    return results.map((r) => ({
      ...r,
      dealValue: Number(r.dealValue),
    }));
  },

  async selectDealAnalysisByLeadId(leadId: string, tenantId: string) {
    const results = await db
      .select()
      .from(DealAnalysisSchema)
      .where(
        and(
          eq(DealAnalysisSchema.leadId, leadId),
          eq(DealAnalysisSchema.tenantId, tenantId),
        ),
      )
      .orderBy(desc(DealAnalysisSchema.createdAt));

    return results.map((r) => ({
      ...r,
      dealValue: Number(r.dealValue),
    }));
  },

  async selectDealAnalysisById(id: string, tenantId: string) {
    const [result] = await db
      .select()
      .from(DealAnalysisSchema)
      .where(
        and(
          eq(DealAnalysisSchema.id, id),
          eq(DealAnalysisSchema.tenantId, tenantId),
        ),
      );
    if (!result) return null;
    return {
      ...result,
      dealValue: Number(result.dealValue),
    };
  },
};

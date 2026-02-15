import { pgDb as db } from "../db.pg";
import {
  ProspectSchema,
  ProspectSourceSchema,
  FilingRecordSchema,
  ProspectSignalSchema,
} from "../schema.pg";
import { eq, and, desc, count, gte, sql } from "drizzle-orm";
import type {
  ProspectingRepository,
  Prospect,
  ProspectSource,
  FilingRecord,
  ProspectSignal,
  ProspectStatus,
} from "app-types/prospecting";

function toProspect(row: typeof ProspectSchema.$inferSelect): Prospect {
  return {
    ...row,
    annualRevenue: row.annualRevenue != null ? Number(row.annualRevenue) : null,
  } as Prospect;
}

export const pgProspectingRepository: ProspectingRepository = {
  // ─── Prospects ────────────────────────────────────────────────────────────────

  async insertProspect(prospect) {
    const [result] = await db
      .insert(ProspectSchema)
      .values({
        tenantId: prospect.tenantId,
        companyName: prospect.companyName,
        website: prospect.website,
        industry: prospect.industry,
        subIndustry: prospect.subIndustry,
        location: prospect.location,
        employeeCount: prospect.employeeCount,
        annualRevenue:
          prospect.annualRevenue != null
            ? String(prospect.annualRevenue)
            : undefined,
        fitScore: prospect.fitScore,
        intentScore: prospect.intentScore,
        sourceId: prospect.sourceId,
        sourceType: prospect.sourceType,
        tags: prospect.tags ?? [],
        metadata: prospect.metadata ?? {},
      })
      .returning();
    return toProspect(result);
  },

  async selectProspectsByTenantId(tenantId, options = {}) {
    const conditions = [eq(ProspectSchema.tenantId, tenantId)];

    if (options.status) {
      conditions.push(eq(ProspectSchema.status, options.status));
    }
    if (options.industry) {
      conditions.push(eq(ProspectSchema.industry, options.industry));
    }
    if (options.minFitScore != null) {
      conditions.push(gte(ProspectSchema.fitScore, options.minFitScore));
    }
    if (options.minIntentScore != null) {
      conditions.push(gte(ProspectSchema.intentScore, options.minIntentScore));
    }
    if (options.tags && options.tags.length > 0) {
      conditions.push(
        sql`${ProspectSchema.tags}::jsonb @> ${JSON.stringify(options.tags)}::jsonb`,
      );
    }

    const results = await db
      .select()
      .from(ProspectSchema)
      .where(and(...conditions))
      .orderBy(desc(ProspectSchema.createdAt))
      .limit(options.limit ?? 50)
      .offset(options.offset ?? 0);

    return results.map(toProspect);
  },

  async selectProspectById(id, tenantId) {
    const [result] = await db
      .select()
      .from(ProspectSchema)
      .where(
        and(eq(ProspectSchema.id, id), eq(ProspectSchema.tenantId, tenantId)),
      );
    if (!result) return null;
    return toProspect(result);
  },

  async updateProspect(id, tenantId, data) {
    const setData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };
    if (data.annualRevenue != null) {
      setData.annualRevenue = String(data.annualRevenue);
    }
    if (data.enrichedAt !== undefined) {
      setData.enrichedAt = data.enrichedAt;
    }

    const [result] = await db
      .update(ProspectSchema)
      .set(setData)
      .where(
        and(eq(ProspectSchema.id, id), eq(ProspectSchema.tenantId, tenantId)),
      )
      .returning();
    return toProspect(result);
  },

  async deleteProspect(id, tenantId) {
    await db
      .delete(ProspectSchema)
      .where(
        and(eq(ProspectSchema.id, id), eq(ProspectSchema.tenantId, tenantId)),
      );
  },

  async countProspectsByStatus(tenantId) {
    const results = await db
      .select({
        status: ProspectSchema.status,
        count: count(),
      })
      .from(ProspectSchema)
      .where(eq(ProspectSchema.tenantId, tenantId))
      .groupBy(ProspectSchema.status);

    const allStatuses: ProspectStatus[] = [
      "identified",
      "researching",
      "enriched",
      "qualified",
      "converted-to-lead",
      "disqualified",
      "stale",
    ];

    const statusCounts = {} as Record<ProspectStatus, number>;
    for (const status of allStatuses) {
      statusCounts[status] = 0;
    }
    for (const row of results) {
      statusCounts[row.status as ProspectStatus] = row.count;
    }

    return statusCounts;
  },

  // ─── Prospect Sources ─────────────────────────────────────────────────────────

  async insertProspectSource(source) {
    const [result] = await db
      .insert(ProspectSourceSchema)
      .values({
        tenantId: source.tenantId,
        name: source.name,
        type: source.type,
        baseUrl: source.baseUrl,
        apiEndpoint: source.apiEndpoint,
        config: source.config ?? {},
        schedule: source.schedule,
        filters: source.filters ?? {},
        enabled: source.enabled ?? true,
      })
      .returning();
    return result as ProspectSource;
  },

  async selectProspectSourcesByTenantId(tenantId) {
    const results = await db
      .select()
      .from(ProspectSourceSchema)
      .where(eq(ProspectSourceSchema.tenantId, tenantId))
      .orderBy(ProspectSourceSchema.name);
    return results as ProspectSource[];
  },

  async selectProspectSourceById(id, tenantId) {
    const [result] = await db
      .select()
      .from(ProspectSourceSchema)
      .where(
        and(
          eq(ProspectSourceSchema.id, id),
          eq(ProspectSourceSchema.tenantId, tenantId),
        ),
      );
    if (!result) return null;
    return result as ProspectSource;
  },

  async updateProspectSource(id, tenantId, data) {
    const setData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };

    const [result] = await db
      .update(ProspectSourceSchema)
      .set(setData)
      .where(
        and(
          eq(ProspectSourceSchema.id, id),
          eq(ProspectSourceSchema.tenantId, tenantId),
        ),
      )
      .returning();
    return result as ProspectSource;
  },

  async deleteProspectSource(id, tenantId) {
    await db
      .delete(ProspectSourceSchema)
      .where(
        and(
          eq(ProspectSourceSchema.id, id),
          eq(ProspectSourceSchema.tenantId, tenantId),
        ),
      );
  },

  // ─── Filing Records ───────────────────────────────────────────────────────────

  async insertFilingRecord(filing) {
    const [result] = await db
      .insert(FilingRecordSchema)
      .values({
        tenantId: filing.tenantId,
        sourceId: filing.sourceId,
        prospectId: filing.prospectId,
        externalId: filing.externalId,
        filingType: filing.filingType,
        title: filing.title,
        description: filing.description,
        filingDate: filing.filingDate,
        filingUrl: filing.filingUrl,
        facilityName: filing.facilityName,
        facilityId: filing.facilityId,
        state: filing.state,
        county: filing.county,
        regulatoryProgram: filing.regulatoryProgram,
        companyName: filing.companyName,
        contactName: filing.contactName,
        contactTitle: filing.contactTitle,
        contactEmail: filing.contactEmail,
        contactPhone: filing.contactPhone,
        rawData: filing.rawData ?? {},
        metadata: filing.metadata ?? {},
      })
      .returning();
    return result as FilingRecord;
  },

  async selectFilingRecordsByTenantId(tenantId, options = {}) {
    const conditions = [eq(FilingRecordSchema.tenantId, tenantId)];

    if (options.sourceId) {
      conditions.push(eq(FilingRecordSchema.sourceId, options.sourceId));
    }
    if (options.prospectId) {
      conditions.push(eq(FilingRecordSchema.prospectId, options.prospectId));
    }
    if (options.filingType) {
      conditions.push(eq(FilingRecordSchema.filingType, options.filingType));
    }
    if (options.state) {
      conditions.push(eq(FilingRecordSchema.state, options.state));
    }

    const results = await db
      .select()
      .from(FilingRecordSchema)
      .where(and(...conditions))
      .orderBy(desc(FilingRecordSchema.createdAt))
      .limit(options.limit ?? 50)
      .offset(options.offset ?? 0);

    return results as FilingRecord[];
  },

  async selectFilingRecordById(id, tenantId) {
    const [result] = await db
      .select()
      .from(FilingRecordSchema)
      .where(
        and(
          eq(FilingRecordSchema.id, id),
          eq(FilingRecordSchema.tenantId, tenantId),
        ),
      );
    if (!result) return null;
    return result as FilingRecord;
  },

  async selectFilingRecordByExternalId(tenantId, sourceId, externalId) {
    const [result] = await db
      .select()
      .from(FilingRecordSchema)
      .where(
        and(
          eq(FilingRecordSchema.tenantId, tenantId),
          eq(FilingRecordSchema.sourceId, sourceId),
          eq(FilingRecordSchema.externalId, externalId),
        ),
      );
    if (!result) return null;
    return result as FilingRecord;
  },

  // ─── Prospect Signals ─────────────────────────────────────────────────────────

  async insertProspectSignal(signal) {
    const [result] = await db
      .insert(ProspectSignalSchema)
      .values({
        tenantId: signal.tenantId,
        prospectId: signal.prospectId,
        signalType: signal.signalType,
        title: signal.title,
        description: signal.description,
        sourceUrl: signal.sourceUrl,
        sourceType: signal.sourceType,
        strength: signal.strength ?? 50,
        detectedAt: signal.detectedAt
          ? new Date(signal.detectedAt)
          : new Date(),
        metadata: signal.metadata ?? {},
      })
      .returning();
    return result as ProspectSignal;
  },

  async selectSignalsByProspectId(prospectId, tenantId, options = {}) {
    const conditions = [
      eq(ProspectSignalSchema.prospectId, prospectId),
      eq(ProspectSignalSchema.tenantId, tenantId),
    ];

    if (options.signalType) {
      conditions.push(eq(ProspectSignalSchema.signalType, options.signalType));
    }

    const results = await db
      .select()
      .from(ProspectSignalSchema)
      .where(and(...conditions))
      .orderBy(desc(ProspectSignalSchema.detectedAt))
      .limit(options.limit ?? 50);

    return results as ProspectSignal[];
  },

  async selectRecentSignals(tenantId, limit = 50) {
    const results = await db
      .select()
      .from(ProspectSignalSchema)
      .where(eq(ProspectSignalSchema.tenantId, tenantId))
      .orderBy(desc(ProspectSignalSchema.detectedAt))
      .limit(limit);

    return results as ProspectSignal[];
  },
};

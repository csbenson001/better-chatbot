import { pgDb as db } from "lib/db/pg/db.pg";
import {
  ContactRecordSchema,
  ContactEnrichmentSchema,
  ContactActivitySchema,
} from "lib/db/pg/schema.pg";
import { eq, and, desc, count, gte } from "drizzle-orm";
import type {
  ContactIntelligenceRepository,
  Contact,
  ContactEnrichment,
  ContactActivity,
  ContactStatus,
} from "app-types/contact-intelligence";

export const pgContactIntelligenceRepository: ContactIntelligenceRepository = {
  // Contacts
  async insertContact(contact) {
    const [result] = await db
      .insert(ContactRecordSchema)
      .values(contact as any)
      .returning();
    return result as unknown as Contact;
  },

  async selectContactsByTenantId(tenantId, options) {
    const conditions = [eq(ContactRecordSchema.tenantId, tenantId)];

    if (options?.status) {
      conditions.push(eq(ContactRecordSchema.status, options.status));
    }
    if (options?.role) {
      conditions.push(eq(ContactRecordSchema.role, options.role));
    }
    if (options?.companyId) {
      conditions.push(eq(ContactRecordSchema.companyId, options.companyId));
    }
    if (options?.prospectId) {
      conditions.push(eq(ContactRecordSchema.prospectId, options.prospectId));
    }
    if (options?.leadId) {
      conditions.push(eq(ContactRecordSchema.leadId, options.leadId));
    }
    if (options?.minConfidence) {
      conditions.push(
        gte(ContactRecordSchema.confidenceScore, options.minConfidence),
      );
    }

    const results = await db
      .select()
      .from(ContactRecordSchema)
      .where(and(...conditions))
      .orderBy(desc(ContactRecordSchema.createdAt))
      .limit(options?.limit ?? 50)
      .offset(options?.offset ?? 0);

    return results as unknown as Contact[];
  },

  async selectContactById(id, tenantId) {
    const [result] = await db
      .select()
      .from(ContactRecordSchema)
      .where(
        and(
          eq(ContactRecordSchema.id, id),
          eq(ContactRecordSchema.tenantId, tenantId),
        ),
      );
    return (result as unknown as Contact) ?? null;
  },

  async selectContactByEmail(email, tenantId) {
    const [result] = await db
      .select()
      .from(ContactRecordSchema)
      .where(
        and(
          eq(ContactRecordSchema.email, email),
          eq(ContactRecordSchema.tenantId, tenantId),
        ),
      );
    return (result as unknown as Contact) ?? null;
  },

  async updateContact(id, tenantId, data) {
    const [result] = await db
      .update(ContactRecordSchema)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(
        and(
          eq(ContactRecordSchema.id, id),
          eq(ContactRecordSchema.tenantId, tenantId),
        ),
      )
      .returning();
    return result as unknown as Contact;
  },

  async deleteContact(id, tenantId) {
    await db
      .delete(ContactRecordSchema)
      .where(
        and(
          eq(ContactRecordSchema.id, id),
          eq(ContactRecordSchema.tenantId, tenantId),
        ),
      );
  },

  async countContactsByStatus(tenantId) {
    const results = await db
      .select({
        status: ContactRecordSchema.status,
        count: count(),
      })
      .from(ContactRecordSchema)
      .where(eq(ContactRecordSchema.tenantId, tenantId))
      .groupBy(ContactRecordSchema.status);

    const counts = {} as Record<ContactStatus, number>;
    for (const r of results) {
      counts[r.status as ContactStatus] = Number(r.count);
    }
    return counts;
  },

  // Enrichments
  async insertContactEnrichment(enrichment) {
    const [result] = await db
      .insert(ContactEnrichmentSchema)
      .values(enrichment as any)
      .returning();
    return result as unknown as ContactEnrichment;
  },

  async selectEnrichmentsByContactId(contactId, tenantId) {
    const results = await db
      .select()
      .from(ContactEnrichmentSchema)
      .where(
        and(
          eq(ContactEnrichmentSchema.contactId, contactId),
          eq(ContactEnrichmentSchema.tenantId, tenantId),
        ),
      )
      .orderBy(desc(ContactEnrichmentSchema.createdAt));
    return results as unknown as ContactEnrichment[];
  },

  async updateEnrichmentStatus(id, status, completedAt) {
    const updates: Record<string, unknown> = { status };
    if (completedAt) updates.completedAt = completedAt;
    const [result] = await db
      .update(ContactEnrichmentSchema)
      .set(updates)
      .where(eq(ContactEnrichmentSchema.id, id))
      .returning();
    return result as unknown as ContactEnrichment;
  },

  // Activities
  async insertContactActivity(activity) {
    const [result] = await db
      .insert(ContactActivitySchema)
      .values(activity as any)
      .returning();
    return result as unknown as ContactActivity;
  },

  async selectActivitiesByContactId(contactId, tenantId, options) {
    const conditions = [
      eq(ContactActivitySchema.contactId, contactId),
      eq(ContactActivitySchema.tenantId, tenantId),
    ];
    if (options?.activityType) {
      conditions.push(
        eq(ContactActivitySchema.activityType, options.activityType),
      );
    }
    const results = await db
      .select()
      .from(ContactActivitySchema)
      .where(and(...conditions))
      .orderBy(desc(ContactActivitySchema.createdAt))
      .limit(options?.limit ?? 50);
    return results as unknown as ContactActivity[];
  },

  async selectRecentActivities(tenantId, limit) {
    const results = await db
      .select()
      .from(ContactActivitySchema)
      .where(eq(ContactActivitySchema.tenantId, tenantId))
      .orderBy(desc(ContactActivitySchema.createdAt))
      .limit(limit ?? 50);
    return results as unknown as ContactActivity[];
  },
};

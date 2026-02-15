import type {
  IndustryRepository,
  Industry,
  IndustryDocument,
} from "app-types/industry";
import { pgDb as db } from "../db.pg";
import { IndustrySchema, IndustryDocumentSchema } from "../schema.pg";
import { eq, and, desc, ilike } from "drizzle-orm";
import { or, isNull } from "drizzle-orm";

export const pgIndustryRepository: IndustryRepository = {
  // ─── Industries ──────────────────────────────────────────────────────────────

  async insertIndustry(industry) {
    const [result] = await db
      .insert(IndustrySchema)
      .values({
        name: industry.name,
        slug: industry.slug,
        parentId: industry.parentId ?? null,
        description: industry.description ?? null,
        naicsCodes: industry.naicsCodes ?? [],
        sicCodes: industry.sicCodes ?? [],
        keywords: industry.keywords ?? [],
        valueChainTemplate: industry.valueChainTemplate ?? [],
        regulatoryBodies: industry.regulatoryBodies ?? [],
        dataSources: industry.dataSources ?? [],
        metadata: industry.metadata ?? {},
      })
      .returning();
    return result as unknown as Industry;
  },

  async selectAllIndustries() {
    const results = await db
      .select()
      .from(IndustrySchema)
      .orderBy(IndustrySchema.name);
    return results as unknown as Industry[];
  },

  async selectIndustryById(id) {
    const [result] = await db
      .select()
      .from(IndustrySchema)
      .where(eq(IndustrySchema.id, id));
    return (result as unknown as Industry) ?? null;
  },

  async selectIndustryBySlug(slug) {
    const [result] = await db
      .select()
      .from(IndustrySchema)
      .where(eq(IndustrySchema.slug, slug));
    return (result as unknown as Industry) ?? null;
  },

  async selectIndustriesByParentId(parentId) {
    const condition =
      parentId === null
        ? isNull(IndustrySchema.parentId)
        : eq(IndustrySchema.parentId, parentId);

    const results = await db
      .select()
      .from(IndustrySchema)
      .where(condition)
      .orderBy(IndustrySchema.name);
    return results as unknown as Industry[];
  },

  async updateIndustry(id, data) {
    const [result] = await db
      .update(IndustrySchema)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(IndustrySchema.id, id))
      .returning();
    return result as unknown as Industry;
  },

  async deleteIndustry(id) {
    await db.delete(IndustrySchema).where(eq(IndustrySchema.id, id));
  },

  // ─── Industry Documents ────────────────────────────────────────────────────

  async insertIndustryDocument(doc) {
    const [result] = await db
      .insert(IndustryDocumentSchema)
      .values({
        industryId: doc.industryId,
        tenantId: doc.tenantId ?? null,
        title: doc.title,
        content: doc.content,
        docType: doc.docType,
        sourceUrl: doc.sourceUrl ?? null,
        author: doc.author ?? null,
        publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null,
        tags: doc.tags ?? [],
        metadata: doc.metadata ?? {},
      })
      .returning();
    return result as unknown as IndustryDocument;
  },

  async selectDocumentsByIndustryId(industryId, options = {}) {
    const conditions = [eq(IndustryDocumentSchema.industryId, industryId)];

    if (options.docType) {
      conditions.push(eq(IndustryDocumentSchema.docType, options.docType));
    }
    if (options.tenantId) {
      conditions.push(eq(IndustryDocumentSchema.tenantId, options.tenantId));
    }

    const results = await db
      .select()
      .from(IndustryDocumentSchema)
      .where(and(...conditions))
      .orderBy(desc(IndustryDocumentSchema.createdAt))
      .limit(options.limit ?? 50)
      .offset(options.offset ?? 0);

    return results as unknown as IndustryDocument[];
  },

  async selectIndustryDocumentById(id) {
    const [result] = await db
      .select()
      .from(IndustryDocumentSchema)
      .where(eq(IndustryDocumentSchema.id, id));
    return (result as unknown as IndustryDocument) ?? null;
  },

  async updateIndustryDocument(id, data) {
    const setData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };
    if (data.publishedAt) {
      setData.publishedAt = new Date(data.publishedAt);
    }

    const [result] = await db
      .update(IndustryDocumentSchema)
      .set(setData)
      .where(eq(IndustryDocumentSchema.id, id))
      .returning();
    return result as unknown as IndustryDocument;
  },

  async deleteIndustryDocument(id) {
    await db
      .delete(IndustryDocumentSchema)
      .where(eq(IndustryDocumentSchema.id, id));
  },

  async searchIndustryDocuments(query, options = {}) {
    const pattern = `%${query}%`;
    const conditions = [
      or(
        ilike(IndustryDocumentSchema.title, pattern),
        ilike(IndustryDocumentSchema.content, pattern),
      ),
    ];

    if (options.industryId) {
      conditions.push(
        eq(IndustryDocumentSchema.industryId, options.industryId),
      );
    }
    if (options.docType) {
      conditions.push(eq(IndustryDocumentSchema.docType, options.docType));
    }

    const results = await db
      .select()
      .from(IndustryDocumentSchema)
      .where(and(...conditions))
      .orderBy(desc(IndustryDocumentSchema.createdAt))
      .limit(options.limit ?? 50);

    return results as unknown as IndustryDocument[];
  },
};

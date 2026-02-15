import { eq, and, desc, count, sql } from "drizzle-orm";
import { pgDb as db } from "lib/db/pg/db.pg";
import {
  KnowledgeCategorySchema,
  KnowledgeDocumentSchema,
  DocumentChunkSchema,
} from "lib/db/pg/schema.pg";
import type {
  KnowledgeRepository,
  KnowledgeCategory,
  KnowledgeDocument,
  DocumentChunk,
  KnowledgeSearchResult,
  DocumentType,
  DocumentStatus,
} from "app-types/knowledge";
import type { z } from "zod";
import type {
  KnowledgeCategoryCreateSchema,
  KnowledgeDocumentCreateSchema,
} from "app-types/knowledge";

export const pgKnowledgeRepository: KnowledgeRepository = {
  // ─── Categories ───────────────────────────────────────────────────────

  async insertCategory(
    category: z.infer<typeof KnowledgeCategoryCreateSchema>,
  ): Promise<KnowledgeCategory> {
    const [row] = await db
      .insert(KnowledgeCategorySchema)
      .values({
        ...category,
        description: category.description ?? null,
        parentId: category.parentId ?? null,
      })
      .returning();
    return row as KnowledgeCategory;
  },

  async selectCategoriesByTenantId(
    tenantId: string,
  ): Promise<KnowledgeCategory[]> {
    const rows = await db
      .select()
      .from(KnowledgeCategorySchema)
      .where(eq(KnowledgeCategorySchema.tenantId, tenantId))
      .orderBy(KnowledgeCategorySchema.name);
    return rows as KnowledgeCategory[];
  },

  async selectCategoryById(
    id: string,
    tenantId: string,
  ): Promise<KnowledgeCategory | null> {
    const [row] = await db
      .select()
      .from(KnowledgeCategorySchema)
      .where(
        and(
          eq(KnowledgeCategorySchema.id, id),
          eq(KnowledgeCategorySchema.tenantId, tenantId),
        ),
      );
    return (row as KnowledgeCategory) ?? null;
  },

  async updateCategory(
    id: string,
    tenantId: string,
    data: Partial<Pick<KnowledgeCategory, "name" | "description" | "metadata">>,
  ): Promise<KnowledgeCategory> {
    const [row] = await db
      .update(KnowledgeCategorySchema)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(KnowledgeCategorySchema.id, id),
          eq(KnowledgeCategorySchema.tenantId, tenantId),
        ),
      )
      .returning();
    if (!row) throw new Error(`Category not found: ${id}`);
    return row as KnowledgeCategory;
  },

  async deleteCategory(id: string, tenantId: string): Promise<void> {
    await db
      .delete(KnowledgeCategorySchema)
      .where(
        and(
          eq(KnowledgeCategorySchema.id, id),
          eq(KnowledgeCategorySchema.tenantId, tenantId),
        ),
      );
  },

  // ─── Documents ────────────────────────────────────────────────────────

  async insertDocument(
    doc: z.infer<typeof KnowledgeDocumentCreateSchema>,
  ): Promise<KnowledgeDocument> {
    const [row] = await db
      .insert(KnowledgeDocumentSchema)
      .values({
        ...doc,
        categoryId: doc.categoryId ?? null,
        sourceUrl: doc.sourceUrl ?? null,
        sourceId: doc.sourceId ?? null,
        status: "pending",
        chunkCount: 0,
        processedAt: null,
      })
      .returning();
    return row as KnowledgeDocument;
  },

  async selectDocumentsByTenantId(
    tenantId: string,
    options?: {
      categoryId?: string;
      documentType?: DocumentType;
      status?: DocumentStatus;
      tags?: string[];
      limit?: number;
      offset?: number;
    },
  ): Promise<KnowledgeDocument[]> {
    const conditions = [eq(KnowledgeDocumentSchema.tenantId, tenantId)];

    if (options?.categoryId) {
      conditions.push(
        eq(KnowledgeDocumentSchema.categoryId, options.categoryId),
      );
    }
    if (options?.documentType) {
      conditions.push(
        eq(KnowledgeDocumentSchema.documentType, options.documentType),
      );
    }
    if (options?.status) {
      conditions.push(eq(KnowledgeDocumentSchema.status, options.status));
    }

    let query = db
      .select()
      .from(KnowledgeDocumentSchema)
      .where(and(...conditions))
      .orderBy(desc(KnowledgeDocumentSchema.createdAt))
      .$dynamic();

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    const rows = await query;
    return rows as KnowledgeDocument[];
  },

  async selectDocumentById(
    id: string,
    tenantId: string,
  ): Promise<KnowledgeDocument | null> {
    const [row] = await db
      .select()
      .from(KnowledgeDocumentSchema)
      .where(
        and(
          eq(KnowledgeDocumentSchema.id, id),
          eq(KnowledgeDocumentSchema.tenantId, tenantId),
        ),
      );
    return (row as KnowledgeDocument) ?? null;
  },

  async updateDocumentStatus(
    id: string,
    status: DocumentStatus,
    processedAt?: Date,
  ): Promise<KnowledgeDocument> {
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };
    if (processedAt) {
      updateData.processedAt = processedAt;
    }

    const [row] = await db
      .update(KnowledgeDocumentSchema)
      .set(updateData)
      .where(eq(KnowledgeDocumentSchema.id, id))
      .returning();
    if (!row) throw new Error(`Document not found: ${id}`);
    return row as KnowledgeDocument;
  },

  async deleteDocument(id: string, tenantId: string): Promise<void> {
    await db
      .delete(KnowledgeDocumentSchema)
      .where(
        and(
          eq(KnowledgeDocumentSchema.id, id),
          eq(KnowledgeDocumentSchema.tenantId, tenantId),
        ),
      );
  },

  async countDocumentsByTenantId(tenantId: string): Promise<number> {
    const [result] = await db
      .select({ value: count() })
      .from(KnowledgeDocumentSchema)
      .where(eq(KnowledgeDocumentSchema.tenantId, tenantId));
    return result?.value ?? 0;
  },

  // ─── Chunks ───────────────────────────────────────────────────────────

  async insertChunks(
    chunks: Omit<DocumentChunk, "id" | "createdAt">[],
  ): Promise<DocumentChunk[]> {
    if (chunks.length === 0) return [];
    const rows = await db
      .insert(DocumentChunkSchema)
      .values(chunks)
      .returning();
    return rows as DocumentChunk[];
  },

  async selectChunksByDocumentId(documentId: string): Promise<DocumentChunk[]> {
    const rows = await db
      .select()
      .from(DocumentChunkSchema)
      .where(eq(DocumentChunkSchema.documentId, documentId))
      .orderBy(DocumentChunkSchema.chunkIndex);
    return rows as DocumentChunk[];
  },

  async deleteChunksByDocumentId(documentId: string): Promise<void> {
    await db
      .delete(DocumentChunkSchema)
      .where(eq(DocumentChunkSchema.documentId, documentId));
  },

  // ─── Search ───────────────────────────────────────────────────────────

  async searchByEmbedding(
    tenantId: string,
    embedding: number[],
    options?: {
      categoryIds?: string[];
      limit?: number;
      minScore?: number;
    },
  ): Promise<KnowledgeSearchResult[]> {
    const limit = options?.limit ?? 10;
    const minScore = options?.minScore ?? 0.7;
    const embeddingStr = `[${embedding.join(",")}]`;

    let categoryClause = sql``;
    if (options?.categoryIds && options.categoryIds.length > 0) {
      const categoryList = options.categoryIds.map((id) => `'${id}'`).join(",");
      categoryClause = sql.raw(` AND kd.category_id IN (${categoryList})`);
    }

    const results = await db.execute(sql`
      SELECT
        dc.id as "chunkId",
        dc.document_id as "documentId",
        kd.title as "documentTitle",
        dc.content,
        1 - (dc.embedding <=> ${embeddingStr}::vector) as score,
        dc.metadata
      FROM document_chunk dc
      JOIN knowledge_document kd ON dc.document_id = kd.id
      WHERE dc.tenant_id = ${tenantId}
      AND 1 - (dc.embedding <=> ${embeddingStr}::vector) >= ${minScore}
      ${categoryClause}
      ORDER BY dc.embedding <=> ${embeddingStr}::vector
      LIMIT ${limit}
    `);

    return (results.rows ?? results) as KnowledgeSearchResult[];
  },
};

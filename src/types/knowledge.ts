import z from "zod";

// ============================================================================
// KNOWLEDGE CATEGORIES
// ============================================================================

export const KnowledgeCategoryCreateSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  parentId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type KnowledgeCategory = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// KNOWLEDGE DOCUMENTS
// ============================================================================

export const DocumentTypeSchema = z.enum([
  "pdf",
  "web-page",
  "text",
  "markdown",
  "csv",
  "json",
  "api-response",
  "filing",
  "report",
  "email",
  "presentation",
  "spreadsheet",
]);
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

export const DocumentStatusSchema = z.enum([
  "pending",
  "processing",
  "indexed",
  "failed",
  "archived",
]);
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;

export const DocumentSourceSchema = z.enum([
  "upload",
  "web-scrape",
  "connector-sync",
  "api-import",
  "enrichment",
  "filing-scan",
  "manual",
]);
export type DocumentSource = z.infer<typeof DocumentSourceSchema>;

export const KnowledgeDocumentCreateSchema = z.object({
  tenantId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  content: z.string(),
  documentType: DocumentTypeSchema,
  source: DocumentSourceSchema.default("manual"),
  sourceUrl: z.string().url().optional(),
  sourceId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  tags: z.array(z.string()).default([]),
});

export type KnowledgeDocument = {
  id: string;
  tenantId: string;
  categoryId: string | null;
  title: string;
  content: string;
  documentType: DocumentType;
  source: DocumentSource;
  sourceUrl: string | null;
  sourceId: string | null;
  status: DocumentStatus;
  chunkCount: number;
  metadata: Record<string, unknown>;
  tags: string[];
  processedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// DOCUMENT CHUNKS (for vector search)
// ============================================================================

export type DocumentChunk = {
  id: string;
  documentId: string;
  tenantId: string;
  chunkIndex: number;
  content: string;
  embedding: number[] | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

// ============================================================================
// SEARCH
// ============================================================================

export const KnowledgeSearchSchema = z.object({
  query: z.string().min(1).max(2000),
  tenantId: z.string().uuid(),
  categoryIds: z.array(z.string().uuid()).optional(),
  documentTypes: z.array(DocumentTypeSchema).optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).default(10),
  minScore: z.number().min(0).max(1).default(0.7),
});

export type KnowledgeSearchResult = {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
};

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export type KnowledgeRepository = {
  // Categories
  insertCategory(
    category: z.infer<typeof KnowledgeCategoryCreateSchema>,
  ): Promise<KnowledgeCategory>;
  selectCategoriesByTenantId(tenantId: string): Promise<KnowledgeCategory[]>;
  selectCategoryById(
    id: string,
    tenantId: string,
  ): Promise<KnowledgeCategory | null>;
  updateCategory(
    id: string,
    tenantId: string,
    data: Partial<Pick<KnowledgeCategory, "name" | "description" | "metadata">>,
  ): Promise<KnowledgeCategory>;
  deleteCategory(id: string, tenantId: string): Promise<void>;

  // Documents
  insertDocument(
    doc: z.infer<typeof KnowledgeDocumentCreateSchema>,
  ): Promise<KnowledgeDocument>;
  selectDocumentsByTenantId(
    tenantId: string,
    options?: {
      categoryId?: string;
      documentType?: DocumentType;
      status?: DocumentStatus;
      tags?: string[];
      limit?: number;
      offset?: number;
    },
  ): Promise<KnowledgeDocument[]>;
  selectDocumentById(
    id: string,
    tenantId: string,
  ): Promise<KnowledgeDocument | null>;
  updateDocumentStatus(
    id: string,
    status: DocumentStatus,
    processedAt?: Date,
  ): Promise<KnowledgeDocument>;
  deleteDocument(id: string, tenantId: string): Promise<void>;
  countDocumentsByTenantId(tenantId: string): Promise<number>;

  // Chunks
  insertChunks(
    chunks: Omit<DocumentChunk, "id" | "createdAt">[],
  ): Promise<DocumentChunk[]>;
  selectChunksByDocumentId(documentId: string): Promise<DocumentChunk[]>;
  deleteChunksByDocumentId(documentId: string): Promise<void>;

  // Vector Search (uses pgvector similarity)
  searchByEmbedding(
    tenantId: string,
    embedding: number[],
    options?: {
      categoryIds?: string[];
      limit?: number;
      minScore?: number;
    },
  ): Promise<KnowledgeSearchResult[]>;
};

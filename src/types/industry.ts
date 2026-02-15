import z from "zod";

// ============================================================================
// INDUSTRY DEFINITIONS
// ============================================================================

export const IndustryCreateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  parentId: z.string().uuid().optional(),
  description: z.string().optional(),
  naicsCodes: z.array(z.string()).default([]),
  sicCodes: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  valueChainTemplate: z
    .array(
      z.object({
        stage: z.string(),
        name: z.string(),
        description: z.string().optional(),
        typicalPlayers: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  regulatoryBodies: z.array(z.string()).default([]),
  dataSources: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().optional(),
        type: z.string(),
        description: z.string().optional(),
      }),
    )
    .default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type Industry = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string | null;
  naicsCodes: string[];
  sicCodes: string[];
  keywords: string[];
  valueChainTemplate: Record<string, unknown>[];
  regulatoryBodies: string[];
  dataSources: Record<string, unknown>[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// INDUSTRY KNOWLEDGE DOCUMENTS
// ============================================================================

export const IndustryDocTypeSchema = z.enum([
  "market-overview",
  "regulatory-guide",
  "value-chain-analysis",
  "competitive-landscape",
  "technology-trends",
  "buyer-guide",
  "pricing-intelligence",
  "trade-publication",
  "standard-specification",
  "safety-data-sheet",
  "compliance-requirement",
]);
export type IndustryDocType = z.infer<typeof IndustryDocTypeSchema>;

export const IndustryDocCreateSchema = z.object({
  industryId: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
  title: z.string().min(1).max(500),
  content: z.string(),
  docType: IndustryDocTypeSchema,
  sourceUrl: z.string().url().optional(),
  author: z.string().max(200).optional(),
  publishedAt: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type IndustryDocument = {
  id: string;
  industryId: string;
  tenantId: string | null;
  title: string;
  content: string;
  docType: IndustryDocType;
  sourceUrl: string | null;
  author: string | null;
  publishedAt: Date | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// INDUSTRY-SPECIFIC CONFIGURATIONS
// ============================================================================

export type ChemicalIndustryConfig = {
  casNumbers: string[];
  productCategories: string[];
  distributionChannels: string[];
  regulatoryFrameworks: string[];
  safetyRequirements: string[];
  packagingTypes: string[];
  shippingClassifications: string[];
};

export type RegulatoryIndustryConfig = {
  epaPrograms: string[];
  permitTypes: string[];
  complianceFrameworks: string[];
  reportingRequirements: string[];
  monitoringSystems: string[];
  emissionCategories: string[];
};

export type OilGasIndustryConfig = {
  upstream: string[];
  midstream: string[];
  downstream: string[];
  commodityTypes: string[];
  regulatoryBodies: string[];
  certifications: string[];
};

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export type IndustryRepository = {
  // Industries
  insertIndustry(
    industry: z.infer<typeof IndustryCreateSchema>,
  ): Promise<Industry>;
  selectAllIndustries(): Promise<Industry[]>;
  selectIndustryById(id: string): Promise<Industry | null>;
  selectIndustryBySlug(slug: string): Promise<Industry | null>;
  selectIndustriesByParentId(parentId: string | null): Promise<Industry[]>;
  updateIndustry(
    id: string,
    data: Partial<z.infer<typeof IndustryCreateSchema>>,
  ): Promise<Industry>;
  deleteIndustry(id: string): Promise<void>;

  // Industry Documents
  insertIndustryDocument(
    doc: z.infer<typeof IndustryDocCreateSchema>,
  ): Promise<IndustryDocument>;
  selectDocumentsByIndustryId(
    industryId: string,
    options?: {
      docType?: IndustryDocType;
      tenantId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<IndustryDocument[]>;
  selectIndustryDocumentById(id: string): Promise<IndustryDocument | null>;
  updateIndustryDocument(
    id: string,
    data: Partial<z.infer<typeof IndustryDocCreateSchema>>,
  ): Promise<IndustryDocument>;
  deleteIndustryDocument(id: string): Promise<void>;
  searchIndustryDocuments(
    query: string,
    options?: {
      industryId?: string;
      docType?: IndustryDocType;
      limit?: number;
    },
  ): Promise<IndustryDocument[]>;
};

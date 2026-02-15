import z from "zod";

// ============================================================================
// COMPANY PROFILES (Deep Context of Client Business)
// ============================================================================

export const CompanyProfileCreateSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(500),
  legalName: z.string().max(500).optional(),
  website: z.string().url().optional(),
  industry: z.string().max(200).optional(),
  subIndustry: z.string().max(200).optional(),
  naicsCode: z.string().max(10).optional(),
  sicCode: z.string().max(10).optional(),
  description: z.string().optional(),
  headquarters: z
    .object({
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      zip: z.string().optional(),
    })
    .optional(),
  annualRevenue: z.number().optional(),
  employeeCount: z.number().int().optional(),
  foundedYear: z.number().int().optional(),
  stockTicker: z.string().max(10).optional(),
  linkedinUrl: z.string().url().optional(),
  salesMethodology: z.string().optional(),
  valueProposition: z.string().optional(),
  targetMarkets: z.array(z.string()).default([]),
  competitors: z.array(z.string()).default([]),
  keyDifferentiators: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
  isClientCompany: z.boolean().default(false),
});

export const CompanyProfileUpdateSchema =
  CompanyProfileCreateSchema.partial().omit({ tenantId: true });

export type CompanyProfile = {
  id: string;
  tenantId: string;
  name: string;
  legalName: string | null;
  website: string | null;
  industry: string | null;
  subIndustry: string | null;
  naicsCode: string | null;
  sicCode: string | null;
  description: string | null;
  headquarters: Record<string, unknown> | null;
  annualRevenue: number | null;
  employeeCount: number | null;
  foundedYear: number | null;
  stockTicker: string | null;
  linkedinUrl: string | null;
  salesMethodology: string | null;
  valueProposition: string | null;
  targetMarkets: string[];
  competitors: string[];
  keyDifferentiators: string[];
  metadata: Record<string, unknown>;
  isClientCompany: boolean;
  enrichedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// PRODUCTS & SERVICES
// ============================================================================

export const ProductTypeSchema = z.enum([
  "product",
  "service",
  "solution",
  "bundle",
]);
export type ProductType = z.infer<typeof ProductTypeSchema>;

export const ProductCreateSchema = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  name: z.string().min(1).max(500),
  type: ProductTypeSchema,
  category: z.string().max(200).optional(),
  description: z.string().optional(),
  features: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  useCases: z.array(z.string()).default([]),
  targetIndustries: z.array(z.string()).default([]),
  priceRange: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string().default("USD"),
      model: z.string().optional(),
    })
    .optional(),
  competitiveAdvantages: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type Product = {
  id: string;
  tenantId: string;
  companyId: string;
  name: string;
  type: ProductType;
  category: string | null;
  description: string | null;
  features: string[];
  benefits: string[];
  useCases: string[];
  targetIndustries: string[];
  priceRange: Record<string, unknown> | null;
  competitiveAdvantages: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// VALUE CHAIN
// ============================================================================

export const ValueChainStageSchema = z.enum([
  "raw-materials",
  "manufacturing",
  "processing",
  "distribution",
  "wholesale",
  "retail",
  "end-user",
  "recycling",
  "regulatory",
  "support-services",
]);
export type ValueChainStage = z.infer<typeof ValueChainStageSchema>;

export const ValueChainCreateSchema = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  stage: ValueChainStageSchema,
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  activities: z.array(z.string()).default([]),
  partners: z.array(z.string()).default([]),
  inputs: z.array(z.string()).default([]),
  outputs: z.array(z.string()).default([]),
  painPoints: z.array(z.string()).default([]),
  opportunities: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type ValueChain = {
  id: string;
  tenantId: string;
  companyId: string;
  stage: ValueChainStage;
  name: string;
  description: string | null;
  activities: string[];
  partners: string[];
  inputs: string[];
  outputs: string[];
  painPoints: string[];
  opportunities: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// SALES METHODOLOGY
// ============================================================================

export const SalesMethodologyCreateSchema = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  name: z.string().min(1).max(200),
  framework: z.string().max(100).optional(),
  stages: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        activities: z.array(z.string()).default([]),
        exitCriteria: z.array(z.string()).default([]),
        typicalDuration: z.string().optional(),
      }),
    )
    .default([]),
  qualificationCriteria: z.record(z.string(), z.unknown()).default({}),
  idealCustomerProfile: z.record(z.string(), z.unknown()).default({}),
  buyerPersonas: z.array(z.record(z.string(), z.unknown())).default([]),
  objectionHandling: z
    .array(
      z.object({
        objection: z.string(),
        response: z.string(),
        category: z.string().optional(),
      }),
    )
    .default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type SalesMethodology = {
  id: string;
  tenantId: string;
  companyId: string;
  name: string;
  framework: string | null;
  stages: Record<string, unknown>[];
  qualificationCriteria: Record<string, unknown>;
  idealCustomerProfile: Record<string, unknown>;
  buyerPersonas: Record<string, unknown>[];
  objectionHandling: Record<string, unknown>[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export type CompanyIntelligenceRepository = {
  // Company Profiles
  insertCompanyProfile(
    profile: z.infer<typeof CompanyProfileCreateSchema>,
  ): Promise<CompanyProfile>;
  selectCompanyProfilesByTenantId(
    tenantId: string,
    options?: {
      isClientCompany?: boolean;
      industry?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<CompanyProfile[]>;
  selectCompanyProfileById(
    id: string,
    tenantId: string,
  ): Promise<CompanyProfile | null>;
  updateCompanyProfile(
    id: string,
    tenantId: string,
    data: z.infer<typeof CompanyProfileUpdateSchema>,
  ): Promise<CompanyProfile>;
  deleteCompanyProfile(id: string, tenantId: string): Promise<void>;
  searchCompanyProfiles(
    tenantId: string,
    query: string,
  ): Promise<CompanyProfile[]>;

  // Products
  insertProduct(product: z.infer<typeof ProductCreateSchema>): Promise<Product>;
  selectProductsByCompanyId(
    companyId: string,
    tenantId: string,
  ): Promise<Product[]>;
  selectProductById(id: string, tenantId: string): Promise<Product | null>;
  updateProduct(
    id: string,
    tenantId: string,
    data: Partial<z.infer<typeof ProductCreateSchema>>,
  ): Promise<Product>;
  deleteProduct(id: string, tenantId: string): Promise<void>;

  // Value Chain
  insertValueChain(
    entry: z.infer<typeof ValueChainCreateSchema>,
  ): Promise<ValueChain>;
  selectValueChainByCompanyId(
    companyId: string,
    tenantId: string,
  ): Promise<ValueChain[]>;
  deleteValueChain(id: string, tenantId: string): Promise<void>;

  // Sales Methodology
  insertSalesMethodology(
    methodology: z.infer<typeof SalesMethodologyCreateSchema>,
  ): Promise<SalesMethodology>;
  selectSalesMethodologyByCompanyId(
    companyId: string,
    tenantId: string,
  ): Promise<SalesMethodology[]>;
  updateSalesMethodology(
    id: string,
    tenantId: string,
    data: Partial<z.infer<typeof SalesMethodologyCreateSchema>>,
  ): Promise<SalesMethodology>;
  deleteSalesMethodology(id: string, tenantId: string): Promise<void>;
};

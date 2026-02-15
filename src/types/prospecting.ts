import z from "zod";

// ============================================================================
// PROSPECTS
// ============================================================================

export const ProspectStatusSchema = z.enum([
  "identified",
  "researching",
  "enriched",
  "qualified",
  "converted-to-lead",
  "disqualified",
  "stale",
]);
export type ProspectStatus = z.infer<typeof ProspectStatusSchema>;

export const ProspectCreateSchema = z.object({
  tenantId: z.string().uuid(),
  companyName: z.string().min(1).max(500),
  website: z.string().url().optional(),
  industry: z.string().max(200).optional(),
  subIndustry: z.string().max(200).optional(),
  location: z
    .object({
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      zip: z.string().optional(),
    })
    .optional(),
  employeeCount: z.number().int().optional(),
  annualRevenue: z.number().optional(),
  fitScore: z.number().min(0).max(100).optional(),
  intentScore: z.number().min(0).max(100).optional(),
  sourceId: z.string().optional(),
  sourceType: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type Prospect = {
  id: string;
  tenantId: string;
  companyName: string;
  website: string | null;
  industry: string | null;
  subIndustry: string | null;
  location: Record<string, unknown> | null;
  employeeCount: number | null;
  annualRevenue: number | null;
  fitScore: number | null;
  intentScore: number | null;
  status: ProspectStatus;
  sourceId: string | null;
  sourceType: string | null;
  convertedLeadId: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  enrichedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// PROSPECT SOURCES (Filing Registries, Web Sources)
// ============================================================================

export const ProspectSourceTypeSchema = z.enum([
  "epa-echo",
  "epa-tri",
  "sec-edgar",
  "state-permit",
  "federal-filing",
  "county-records",
  "business-registry",
  "trade-association",
  "web-scrape",
  "industry-directory",
  "government-contract",
  "import-export-records",
]);
export type ProspectSourceType = z.infer<typeof ProspectSourceTypeSchema>;

export const ProspectSourceCreateSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(200),
  type: ProspectSourceTypeSchema,
  baseUrl: z.string().url().optional(),
  apiEndpoint: z.string().optional(),
  config: z.record(z.string(), z.unknown()).default({}),
  schedule: z.string().optional(),
  filters: z.record(z.string(), z.unknown()).default({}),
  enabled: z.boolean().default(true),
});

export type ProspectSource = {
  id: string;
  tenantId: string;
  name: string;
  type: ProspectSourceType;
  baseUrl: string | null;
  apiEndpoint: string | null;
  config: Record<string, unknown>;
  schedule: string | null;
  filters: Record<string, unknown>;
  enabled: boolean;
  lastScanAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// FILING RECORDS
// ============================================================================

export const FilingRecordCreateSchema = z.object({
  tenantId: z.string().uuid(),
  sourceId: z.string().uuid(),
  prospectId: z.string().uuid().optional(),
  externalId: z.string(),
  filingType: z.string().max(200),
  title: z.string().max(1000),
  description: z.string().optional(),
  filingDate: z.string(),
  filingUrl: z.string().url().optional(),
  facilityName: z.string().max(500).optional(),
  facilityId: z.string().max(200).optional(),
  state: z.string().max(2).optional(),
  county: z.string().max(200).optional(),
  regulatoryProgram: z.string().max(200).optional(),
  companyName: z.string().max(500).optional(),
  contactName: z.string().max(200).optional(),
  contactTitle: z.string().max(200).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(50).optional(),
  rawData: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type FilingRecord = {
  id: string;
  tenantId: string;
  sourceId: string;
  prospectId: string | null;
  externalId: string;
  filingType: string;
  title: string;
  description: string | null;
  filingDate: string;
  filingUrl: string | null;
  facilityName: string | null;
  facilityId: string | null;
  state: string | null;
  county: string | null;
  regulatoryProgram: string | null;
  companyName: string | null;
  contactName: string | null;
  contactTitle: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  rawData: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// PROSPECT SIGNALS
// ============================================================================

export const SignalTypeSchema = z.enum([
  "new-permit",
  "permit-renewal",
  "violation",
  "expansion",
  "hiring",
  "funding",
  "acquisition",
  "new-product",
  "regulatory-change",
  "contract-award",
  "leadership-change",
  "facility-opening",
]);
export type SignalType = z.infer<typeof SignalTypeSchema>;

export const ProspectSignalCreateSchema = z.object({
  tenantId: z.string().uuid(),
  prospectId: z.string().uuid(),
  signalType: SignalTypeSchema,
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  sourceType: z.string().optional(),
  strength: z.number().min(0).max(100).default(50),
  detectedAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type ProspectSignal = {
  id: string;
  tenantId: string;
  prospectId: string;
  signalType: SignalType;
  title: string;
  description: string | null;
  sourceUrl: string | null;
  sourceType: string | null;
  strength: number;
  detectedAt: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export type ProspectingRepository = {
  // Prospects
  insertProspect(
    prospect: z.infer<typeof ProspectCreateSchema>,
  ): Promise<Prospect>;
  selectProspectsByTenantId(
    tenantId: string,
    options?: {
      status?: ProspectStatus;
      industry?: string;
      minFitScore?: number;
      minIntentScore?: number;
      tags?: string[];
      limit?: number;
      offset?: number;
    },
  ): Promise<Prospect[]>;
  selectProspectById(id: string, tenantId: string): Promise<Prospect | null>;
  updateProspect(
    id: string,
    tenantId: string,
    data: Partial<z.infer<typeof ProspectCreateSchema>> & {
      status?: ProspectStatus;
      convertedLeadId?: string;
      enrichedAt?: Date;
    },
  ): Promise<Prospect>;
  deleteProspect(id: string, tenantId: string): Promise<void>;
  countProspectsByStatus(
    tenantId: string,
  ): Promise<Record<ProspectStatus, number>>;

  // Sources
  insertProspectSource(
    source: z.infer<typeof ProspectSourceCreateSchema>,
  ): Promise<ProspectSource>;
  selectProspectSourcesByTenantId(tenantId: string): Promise<ProspectSource[]>;
  selectProspectSourceById(
    id: string,
    tenantId: string,
  ): Promise<ProspectSource | null>;
  updateProspectSource(
    id: string,
    tenantId: string,
    data: Partial<z.infer<typeof ProspectSourceCreateSchema>> & {
      lastScanAt?: Date;
    },
  ): Promise<ProspectSource>;
  deleteProspectSource(id: string, tenantId: string): Promise<void>;

  // Filing Records
  insertFilingRecord(
    filing: z.infer<typeof FilingRecordCreateSchema>,
  ): Promise<FilingRecord>;
  selectFilingRecordsByTenantId(
    tenantId: string,
    options?: {
      sourceId?: string;
      prospectId?: string;
      filingType?: string;
      state?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<FilingRecord[]>;
  selectFilingRecordById(
    id: string,
    tenantId: string,
  ): Promise<FilingRecord | null>;
  selectFilingRecordByExternalId(
    tenantId: string,
    sourceId: string,
    externalId: string,
  ): Promise<FilingRecord | null>;

  // Signals
  insertProspectSignal(
    signal: z.infer<typeof ProspectSignalCreateSchema>,
  ): Promise<ProspectSignal>;
  selectSignalsByProspectId(
    prospectId: string,
    tenantId: string,
    options?: {
      signalType?: SignalType;
      limit?: number;
    },
  ): Promise<ProspectSignal[]>;
  selectRecentSignals(
    tenantId: string,
    limit?: number,
  ): Promise<ProspectSignal[]>;
};

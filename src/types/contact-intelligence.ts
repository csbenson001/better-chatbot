import z from "zod";

// ============================================================================
// CONTACT RECORDS
// ============================================================================

export const ContactStatusSchema = z.enum([
  "identified",
  "verified",
  "enriched",
  "engaged",
  "opted-out",
  "bounced",
  "stale",
]);
export type ContactStatus = z.infer<typeof ContactStatusSchema>;

export const ContactSourceTypeSchema = z.enum([
  "linkedin",
  "zoominfo",
  "salesforce",
  "hubspot",
  "filing-document",
  "epa-echo",
  "permit-application",
  "company-website",
  "press-release",
  "conference-attendee",
  "trade-publication",
  "manual",
  "csv-import",
  "api-enrichment",
]);
export type ContactSourceType = z.infer<typeof ContactSourceTypeSchema>;

export const ContactRoleSchema = z.enum([
  "decision-maker",
  "influencer",
  "champion",
  "gatekeeper",
  "end-user",
  "technical-evaluator",
  "economic-buyer",
  "executive-sponsor",
  "unknown",
]);
export type ContactRole = z.infer<typeof ContactRoleSchema>;

export const ContactCreateSchema = z.object({
  tenantId: z.string().uuid(),
  prospectId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  firstName: z.string().min(1).max(200),
  lastName: z.string().min(1).max(200),
  email: z.string().email().optional(),
  emailVerified: z.boolean().default(false),
  phone: z.string().max(50).optional(),
  mobilePhone: z.string().max(50).optional(),
  title: z.string().max(500).optional(),
  department: z.string().max(200).optional(),
  company: z.string().max(500).optional(),
  companyId: z.string().uuid().optional(),
  linkedinUrl: z.string().url().optional(),
  role: ContactRoleSchema.default("unknown"),
  seniority: z.string().max(50).optional(),
  location: z
    .object({
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  confidenceScore: z.number().min(0).max(100).default(50),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const ContactUpdateSchema = ContactCreateSchema.partial().omit({
  tenantId: true,
});

export type Contact = {
  id: string;
  tenantId: string;
  prospectId: string | null;
  leadId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
  mobilePhone: string | null;
  title: string | null;
  department: string | null;
  company: string | null;
  companyId: string | null;
  linkedinUrl: string | null;
  role: ContactRole;
  seniority: string | null;
  status: ContactStatus;
  location: Record<string, unknown> | null;
  confidenceScore: number;
  tags: string[];
  metadata: Record<string, unknown>;
  enrichedAt: Date | null;
  lastContactedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// CONTACT ENRICHMENT
// ============================================================================

export const EnrichmentStatusSchema = z.enum([
  "pending",
  "in-progress",
  "completed",
  "failed",
  "partial",
]);
export type EnrichmentStatus = z.infer<typeof EnrichmentStatusSchema>;

export const ContactEnrichmentCreateSchema = z.object({
  contactId: z.string().uuid(),
  tenantId: z.string().uuid(),
  sourceType: ContactSourceTypeSchema,
  sourceId: z.string().optional(),
  enrichedData: z.record(z.string(), z.unknown()).default({}),
  confidenceScore: z.number().min(0).max(100).default(50),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type ContactEnrichment = {
  id: string;
  contactId: string;
  tenantId: string;
  sourceType: ContactSourceType;
  sourceId: string | null;
  status: EnrichmentStatus;
  enrichedData: Record<string, unknown>;
  confidenceScore: number;
  metadata: Record<string, unknown>;
  completedAt: Date | null;
  createdAt: Date;
};

// ============================================================================
// CONTACT ACTIVITY TRACKING
// ============================================================================

export const ContactActivityTypeSchema = z.enum([
  "email-sent",
  "email-opened",
  "email-replied",
  "email-bounced",
  "call-made",
  "call-answered",
  "meeting-scheduled",
  "meeting-held",
  "linkedin-connected",
  "linkedin-messaged",
  "note-added",
  "status-changed",
]);
export type ContactActivityType = z.infer<typeof ContactActivityTypeSchema>;

export const ContactActivityCreateSchema = z.object({
  contactId: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  activityType: ContactActivityTypeSchema,
  subject: z.string().max(500).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type ContactActivity = {
  id: string;
  contactId: string;
  tenantId: string;
  userId: string | null;
  activityType: ContactActivityType;
  subject: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export type ContactIntelligenceRepository = {
  // Contacts
  insertContact(contact: z.infer<typeof ContactCreateSchema>): Promise<Contact>;
  selectContactsByTenantId(
    tenantId: string,
    options?: {
      status?: ContactStatus;
      role?: ContactRole;
      companyId?: string;
      prospectId?: string;
      leadId?: string;
      minConfidence?: number;
      tags?: string[];
      limit?: number;
      offset?: number;
    },
  ): Promise<Contact[]>;
  selectContactById(id: string, tenantId: string): Promise<Contact | null>;
  selectContactByEmail(
    email: string,
    tenantId: string,
  ): Promise<Contact | null>;
  updateContact(
    id: string,
    tenantId: string,
    data: z.infer<typeof ContactUpdateSchema> & {
      status?: ContactStatus;
      enrichedAt?: Date;
      lastContactedAt?: Date;
    },
  ): Promise<Contact>;
  deleteContact(id: string, tenantId: string): Promise<void>;
  countContactsByStatus(
    tenantId: string,
  ): Promise<Record<ContactStatus, number>>;

  // Enrichments
  insertContactEnrichment(
    enrichment: z.infer<typeof ContactEnrichmentCreateSchema>,
  ): Promise<ContactEnrichment>;
  selectEnrichmentsByContactId(
    contactId: string,
    tenantId: string,
  ): Promise<ContactEnrichment[]>;
  updateEnrichmentStatus(
    id: string,
    status: EnrichmentStatus,
    completedAt?: Date,
  ): Promise<ContactEnrichment>;

  // Activities
  insertContactActivity(
    activity: z.infer<typeof ContactActivityCreateSchema>,
  ): Promise<ContactActivity>;
  selectActivitiesByContactId(
    contactId: string,
    tenantId: string,
    options?: {
      activityType?: ContactActivityType;
      limit?: number;
    },
  ): Promise<ContactActivity[]>;
  selectRecentActivities(
    tenantId: string,
    limit?: number,
  ): Promise<ContactActivity[]>;
};

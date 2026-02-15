// ============================================================================
// SALES INTELLIGENCE TYPES
// Covers: Sales Briefs, Alerts, Workflows, Relationships, Playbooks,
//         Signal Detection, Compliance Calculator, Outreach, Customer Health,
//         Win/Loss Analysis
// ============================================================================

// --- Sales Brief Generator ---

export type BriefStatus = "pending" | "generating" | "completed" | "failed";
export type BriefType =
  | "prospect-overview"
  | "pre-meeting"
  | "quarterly-review"
  | "competitive-analysis"
  | "expansion-opportunity";

export interface SalesBrief {
  id: string;
  tenantId: string;
  prospectId: string | null;
  leadId: string | null;
  companyId: string | null;
  briefType: BriefType;
  title: string;
  content: string;
  sections: BriefSection[];
  status: BriefStatus;
  generatedBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BriefSection {
  title: string;
  content: string;
  dataSource?: string;
  confidence?: number;
}

// --- Alert System ---

export type AlertSeverity = "info" | "low" | "medium" | "high" | "critical";
export type AlertStatus = "active" | "acknowledged" | "dismissed" | "resolved";
export type AlertCategory =
  | "regulatory-change"
  | "compliance-violation"
  | "permit-expiry"
  | "competitor-activity"
  | "buying-signal"
  | "contact-change"
  | "market-shift"
  | "expansion-signal";

export interface Alert {
  id: string;
  tenantId: string;
  prospectId: string | null;
  leadId: string | null;
  category: AlertCategory;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string;
  sourceUrl: string | null;
  sourceType: string | null;
  actionItems: string[];
  metadata: Record<string, unknown>;
  acknowledgedBy: string | null;
  acknowledgedAt: Date | null;
  createdAt: Date;
}

export type AlertRuleCondition =
  | "new-violation"
  | "permit-expiring-30d"
  | "permit-expiring-90d"
  | "new-filing"
  | "score-threshold"
  | "status-change"
  | "new-signal"
  | "keyword-match";

export interface AlertRule {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  category: AlertCategory;
  conditions: AlertRuleConfig[];
  severity: AlertSeverity;
  notifyChannels: string[];
  enabled: boolean;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertRuleConfig {
  condition: AlertRuleCondition;
  parameters: Record<string, unknown>;
}

// --- Autonomous Research Workflows ---

export type WorkflowRunStatus =
  | "pending"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "canceled";

export type WorkflowStepType =
  | "discover-prospects"
  | "scan-sources"
  | "extract-contacts"
  | "enrich-data"
  | "score-prospects"
  | "generate-brief"
  | "send-alert"
  | "qualify-lead"
  | "custom";

export interface ResearchWorkflow {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  steps: WorkflowStepConfig[];
  schedule: string | null;
  enabled: boolean;
  lastRunId: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowStepConfig {
  stepType: WorkflowStepType;
  name: string;
  config: Record<string, unknown>;
  dependsOn?: string[];
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  tenantId: string;
  status: WorkflowRunStatus;
  currentStep: number;
  stepResults: WorkflowStepResult[];
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface WorkflowStepResult {
  stepIndex: number;
  stepType: WorkflowStepType;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  result?: Record<string, unknown>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

// --- Relationship Mapping & Buying Committee ---

export type RelationshipType =
  | "reports-to"
  | "peers-with"
  | "influences"
  | "champions"
  | "blocks"
  | "mentors"
  | "collaborates-with"
  | "succeeded-by";

export type CommitteeRole =
  | "economic-buyer"
  | "technical-evaluator"
  | "champion"
  | "coach"
  | "end-user"
  | "gatekeeper"
  | "influencer"
  | "decision-maker"
  | "blocker";

export type EngagementLevel =
  | "unknown"
  | "cold"
  | "aware"
  | "interested"
  | "engaged"
  | "advocate";

export interface RelationshipMap {
  id: string;
  tenantId: string;
  prospectId: string | null;
  leadId: string | null;
  companyName: string;
  contacts: BuyingCommitteeMember[];
  relationships: Relationship[];
  dealStrategy: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BuyingCommitteeMember {
  contactId: string;
  role: CommitteeRole;
  engagementLevel: EngagementLevel;
  influence: number; // 1-10
  supportLevel: number; // -5 to +5
  notes?: string;
}

export interface Relationship {
  fromContactId: string;
  toContactId: string;
  type: RelationshipType;
  strength: number; // 1-10
  notes?: string;
}

// --- Vertical Sales Playbooks & Battle Cards ---

export type PlaybookType =
  | "industry-playbook"
  | "competitor-battle-card"
  | "objection-handler"
  | "roi-calculator"
  | "discovery-guide"
  | "demo-script";

export type PlaybookStatus = "draft" | "published" | "archived";

export interface SalesPlaybook {
  id: string;
  tenantId: string;
  industryId: string | null;
  type: PlaybookType;
  title: string;
  content: string;
  sections: PlaybookSection[];
  targetPersona: string | null;
  status: PlaybookStatus;
  version: number;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaybookSection {
  title: string;
  content: string;
  type:
    | "overview"
    | "talking-points"
    | "objections"
    | "roi-analysis"
    | "competitive-comparison"
    | "discovery-questions"
    | "next-steps"
    | "references";
}

// --- Buying Signal Detection & Deal Timing ---

export type CompositeSignalType =
  | "high-intent"
  | "expansion-ready"
  | "compliance-urgency"
  | "competitive-displacement"
  | "budget-cycle"
  | "leadership-transition"
  | "growth-trajectory";

export interface BuyingSignal {
  id: string;
  tenantId: string;
  prospectId: string;
  signalType: CompositeSignalType;
  title: string;
  description: string;
  compositeScore: number; // 0-100
  componentSignals: ComponentSignal[];
  recommendedAction: string;
  optimalTiming: string | null;
  expiresAt: Date | null;
  metadata: Record<string, unknown>;
  detectedAt: Date;
  createdAt: Date;
}

export interface ComponentSignal {
  type: string;
  source: string;
  weight: number;
  score: number;
  detail: string;
}

// --- Compliance Burden Calculator ---

export interface ComplianceBurden {
  id: string;
  tenantId: string;
  prospectId: string;
  facilityCount: number;
  regulatoryPrograms: string[];
  estimatedAnnualCost: number;
  costBreakdown: CostCategory[];
  riskLevel: "low" | "medium" | "high" | "critical";
  savingsOpportunity: number;
  roiProjection: ROIProjection;
  metadata: Record<string, unknown>;
  calculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostCategory {
  category: string;
  annualCost: number;
  description: string;
  automatable: boolean;
  potentialSavings: number;
}

export interface ROIProjection {
  year1Savings: number;
  year3Savings: number;
  implementationCost: number;
  paybackMonths: number;
  roi3Year: number;
}

// --- Outreach Sequence Generator ---

export type SequenceStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "archived";
export type OutreachStepType =
  | "email"
  | "linkedin-connect"
  | "linkedin-message"
  | "phone-call"
  | "custom-task";

export interface OutreachSequence {
  id: string;
  tenantId: string;
  prospectId: string | null;
  contactId: string | null;
  name: string;
  description: string | null;
  steps: OutreachStep[];
  status: SequenceStatus;
  personalizationContext: Record<string, unknown>;
  startedAt: Date | null;
  completedAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface OutreachStep {
  stepNumber: number;
  type: OutreachStepType;
  subject: string | null;
  content: string;
  delayDays: number;
  status: "pending" | "sent" | "completed" | "skipped";
  sentAt?: string;
  responseReceived?: boolean;
}

// --- Customer Health & Expansion Scoring ---

export type HealthStatus = "healthy" | "at-risk" | "churning" | "expanding";

export interface CustomerHealth {
  id: string;
  tenantId: string;
  leadId: string;
  companyId: string | null;
  healthScore: number; // 0-100
  healthStatus: HealthStatus;
  engagementScore: number;
  adoptionScore: number;
  sentimentScore: number;
  expansionProbability: number;
  churnRisk: number;
  factors: HealthFactor[];
  expansionOpportunities: ExpansionOpportunity[];
  lastAssessedAt: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthFactor {
  name: string;
  score: number;
  weight: number;
  trend: "improving" | "stable" | "declining";
  detail: string;
}

export interface ExpansionOpportunity {
  type: string;
  description: string;
  estimatedValue: number;
  probability: number;
  suggestedAction: string;
}

// --- Win/Loss Analysis Engine ---

export type DealOutcome = "won" | "lost" | "no-decision" | "disqualified";

export interface DealAnalysis {
  id: string;
  tenantId: string;
  leadId: string;
  prospectId: string | null;
  outcome: DealOutcome;
  dealValue: number;
  salesCycleLength: number; // days
  competitorInvolved: string | null;
  winLossReasons: string[];
  stageProgression: StageRecord[];
  keyFactors: DealFactor[];
  lessonsLearned: string[];
  recommendations: string[];
  analyzedBy: string | null;
  metadata: Record<string, unknown>;
  analyzedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StageRecord {
  stage: string;
  enteredAt: string;
  exitedAt?: string;
  durationDays: number;
  notes?: string;
}

export interface DealFactor {
  factor: string;
  impact: "positive" | "negative" | "neutral";
  weight: number;
  description: string;
}

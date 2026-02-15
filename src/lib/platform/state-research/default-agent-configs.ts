import type { ResearchAgentConfig } from "app-types/state-research";
import {
  COMPANY_RESEARCH_PROMPT,
  ENFORCEMENT_SCAN_PROMPT,
  PERMIT_SCAN_PROMPT,
  EMISSIONS_ANALYSIS_PROMPT,
  FACILITY_COMPLIANCE_PROMPT,
} from "./research-prompts";

type AgentConfigSeed = Omit<
  ResearchAgentConfig,
  "id" | "tenantId" | "createdAt" | "updatedAt"
>;

export const DEFAULT_RESEARCH_AGENTS: AgentConfigSeed[] = [
  {
    agentType: "company-deep-dive",
    name: "Company Deep Dive Researcher",
    systemPrompt: COMPANY_RESEARCH_PROMPT,
    targetStates: ["TX", "CO", "WY", "NM", "CA", "UT", "KS"],
    targetIndustries: ["oil-gas", "chemicals", "environmental-regulatory"],
    enabledSources: [],
    searchKeywords: [
      "operator",
      "facility",
      "permit",
      "compliance",
      "emissions",
      "monitoring",
    ],
    filters: {},
    schedule: null,
    enabled: true,
    metadata: {
      description:
        "Performs deep research on a target company across all regulatory databases",
      averageDuration: "2-5 minutes",
      outputTypes: [
        "company-profile",
        "compliance-summary",
        "engagement-recommendations",
      ],
    },
  },
  {
    agentType: "enforcement-scan",
    name: "Enforcement Action Scanner",
    systemPrompt: ENFORCEMENT_SCAN_PROMPT,
    targetStates: ["TX", "CO", "WY", "NM"],
    targetIndustries: ["oil-gas"],
    enabledSources: [],
    searchKeywords: [
      "violation",
      "penalty",
      "fine",
      "enforcement",
      "consent decree",
      "agreed order",
      "NOV",
    ],
    filters: { minPenaltyAmount: 10000 },
    schedule: "0 6 * * 1",
    enabled: true,
    metadata: {
      description:
        "Weekly scan of enforcement databases to find companies with compliance issues",
      triggerType: "scheduled",
      prospectSignal: "violation",
    },
  },
  {
    agentType: "state-permit-scan",
    name: "New Permit Tracker",
    systemPrompt: PERMIT_SCAN_PROMPT,
    targetStates: ["TX", "CO", "WY", "NM", "UT"],
    targetIndustries: ["oil-gas"],
    enabledSources: [],
    searchKeywords: [
      "new permit",
      "drilling permit",
      "air permit",
      "Title V",
      "PSD",
      "NSR",
    ],
    filters: {},
    schedule: "0 6 * * *",
    enabled: true,
    metadata: {
      description:
        "Daily scan for new permits indicating facility expansion or new operations",
      triggerType: "scheduled",
      prospectSignal: "new-permit",
    },
  },
  {
    agentType: "emissions-analysis",
    name: "Methane Emissions Analyst",
    systemPrompt: EMISSIONS_ANALYSIS_PROMPT,
    targetStates: ["TX", "CO", "WY", "NM", "CA", "UT"],
    targetIndustries: ["oil-gas"],
    enabledSources: [],
    searchKeywords: [
      "methane",
      "CH4",
      "OGI",
      "LDAR",
      "fugitive emissions",
      "Quad Oa",
      "GHGRP",
    ],
    filters: { minEmissions: 25000 },
    schedule: "0 6 1 * *",
    enabled: true,
    metadata: {
      description:
        "Monthly analysis of methane emissions data to identify high-emitting facilities",
      triggerType: "scheduled",
      prospectSignal: "emissions-threshold",
      allianceTGRelevance: "Core service - methane detection and monitoring",
    },
  },
  {
    agentType: "facility-compliance",
    name: "Facility Compliance Checker",
    systemPrompt: FACILITY_COMPLIANCE_PROMPT,
    targetStates: [],
    targetIndustries: ["oil-gas", "chemicals", "environmental-regulatory"],
    enabledSources: [],
    searchKeywords: [
      "compliance",
      "inspection",
      "violation",
      "permit",
      "monitoring",
    ],
    filters: {},
    schedule: null,
    enabled: true,
    metadata: {
      description:
        "On-demand facility compliance research - triggered by user request",
      triggerType: "on-demand",
    },
  },
];

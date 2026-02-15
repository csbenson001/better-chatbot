// ============================================================================
// TYPES
// ============================================================================

export type ScoringCriteria = {
  industryMatch: number; // 0-100 weight
  complianceRisk: number; // 0-100 weight
  companySize: number; // 0-100 weight
  recentActivity: number; // 0-100 weight
  geographicFit: number; // 0-100 weight
  regulatoryPressure: number; // 0-100 weight
};

export type ScoreResult = {
  fitScore: number;
  intentScore: number;
  breakdown: Record<string, number>;
  signals: string[];
};

// ============================================================================
// DEFAULT WEIGHTS
// ============================================================================

export const DEFAULT_SCORING_WEIGHTS: ScoringCriteria = {
  industryMatch: 25,
  complianceRisk: 20,
  companySize: 15,
  recentActivity: 20,
  geographicFit: 10,
  regulatoryPressure: 10,
};

// ============================================================================
// SCORING INPUT
// ============================================================================

export type ProspectScoringData = {
  industry?: string;
  targetIndustries?: string[];
  violationCount?: number;
  penaltyAmount?: number;
  employeeCount?: number;
  revenueRange?: string;
  lastActivityDate?: Date;
  state?: string;
  targetStates?: string[];
  regulatoryPrograms?: string[];
};

// ============================================================================
// INDUSTRY MAPPING
// ============================================================================

const INDUSTRY_SIMILARITY: Record<string, string[]> = {
  "Environmental Services": [
    "Waste Management",
    "Remediation Services",
    "Environmental Consulting",
    "Water Treatment",
    "Air Quality",
  ],
  "Waste Management": [
    "Environmental Services",
    "Recycling",
    "Hazardous Waste",
    "Solid Waste",
  ],
  Manufacturing: [
    "Industrial Manufacturing",
    "Chemical Manufacturing",
    "Metal Manufacturing",
    "Food Manufacturing",
  ],
  "Chemical Manufacturing": [
    "Manufacturing",
    "Petrochemical",
    "Pharmaceutical",
    "Specialty Chemicals",
  ],
  "Oil & Gas": ["Energy", "Petrochemical", "Mining", "Natural Resources"],
  Construction: [
    "Building Materials",
    "Heavy Construction",
    "Infrastructure",
    "Real Estate Development",
  ],
  "Water Treatment": [
    "Environmental Services",
    "Utilities",
    "Municipal Services",
    "Wastewater",
  ],
};

// ============================================================================
// REVENUE RANGE PARSING
// ============================================================================

const REVENUE_RANGES: Record<string, { min: number; max: number }> = {
  "0-1M": { min: 0, max: 1_000_000 },
  "1M-10M": { min: 1_000_000, max: 10_000_000 },
  "10M-50M": { min: 10_000_000, max: 50_000_000 },
  "50M-100M": { min: 50_000_000, max: 100_000_000 },
  "100M-500M": { min: 100_000_000, max: 500_000_000 },
  "500M-1B": { min: 500_000_000, max: 1_000_000_000 },
  "1B+": { min: 1_000_000_000, max: Infinity },
};

// ============================================================================
// MAIN SCORER
// ============================================================================

export function scoreProspect(
  data: ProspectScoringData,
  weights?: Partial<ScoringCriteria>,
): ScoreResult {
  const w: ScoringCriteria = { ...DEFAULT_SCORING_WEIGHTS, ...weights };
  const totalWeight =
    w.industryMatch +
    w.complianceRisk +
    w.companySize +
    w.recentActivity +
    w.geographicFit +
    w.regulatoryPressure;

  const breakdown: Record<string, number> = {};
  const signals: string[] = [];

  // ── Industry Match (contributes to fitScore) ──────────────────────────────
  const industryScore = scoreIndustryMatch(data, signals);
  breakdown.industryMatch = industryScore;

  // ── Compliance Risk (contributes to intentScore) ──────────────────────────
  const complianceScore = scoreComplianceRisk(data, signals);
  breakdown.complianceRisk = complianceScore;

  // ── Company Size (contributes to fitScore) ────────────────────────────────
  const sizeScore = scoreCompanySize(data, signals);
  breakdown.companySize = sizeScore;

  // ── Recent Activity (contributes to intentScore) ──────────────────────────
  const activityScore = scoreRecentActivity(data, signals);
  breakdown.recentActivity = activityScore;

  // ── Geographic Fit (contributes to fitScore) ──────────────────────────────
  const geoScore = scoreGeographicFit(data, signals);
  breakdown.geographicFit = geoScore;

  // ── Regulatory Pressure (contributes to intentScore) ──────────────────────
  const regulatoryScore = scoreRegulatoryPressure(data, signals);
  breakdown.regulatoryPressure = regulatoryScore;

  // ── Calculate Composite Scores ────────────────────────────────────────────
  // Fit score: weighted average of industry match, company size, geographic fit
  const fitWeightTotal = w.industryMatch + w.companySize + w.geographicFit;
  const fitScore =
    fitWeightTotal > 0
      ? Math.round(
          (industryScore * w.industryMatch +
            sizeScore * w.companySize +
            geoScore * w.geographicFit) /
            fitWeightTotal,
        )
      : 0;

  // Intent score: weighted average of compliance risk, recent activity, regulatory pressure
  const intentWeightTotal =
    w.complianceRisk + w.recentActivity + w.regulatoryPressure;
  const intentScore =
    intentWeightTotal > 0
      ? Math.round(
          (complianceScore * w.complianceRisk +
            activityScore * w.recentActivity +
            regulatoryScore * w.regulatoryPressure) /
            intentWeightTotal,
        )
      : 0;

  // Store the overall weighted score as well
  breakdown.overallWeighted =
    totalWeight > 0
      ? Math.round(
          (industryScore * w.industryMatch +
            complianceScore * w.complianceRisk +
            sizeScore * w.companySize +
            activityScore * w.recentActivity +
            geoScore * w.geographicFit +
            regulatoryScore * w.regulatoryPressure) /
            totalWeight,
        )
      : 0;

  return {
    fitScore: clamp(fitScore, 0, 100),
    intentScore: clamp(intentScore, 0, 100),
    breakdown,
    signals,
  };
}

// ============================================================================
// INDIVIDUAL SCORERS
// ============================================================================

function scoreIndustryMatch(
  data: ProspectScoringData,
  signals: string[],
): number {
  if (!data.industry) {
    return 30; // Neutral when unknown
  }

  if (!data.targetIndustries || data.targetIndustries.length === 0) {
    // No target industries defined -- give moderate score to any known industry
    signals.push(`Industry identified: ${data.industry}`);
    return 50;
  }

  const industryLower = data.industry.toLowerCase();

  // Direct match
  if (data.targetIndustries.some((t) => t.toLowerCase() === industryLower)) {
    signals.push(`Direct industry match: ${data.industry}`);
    return 100;
  }

  // Related industry match
  const relatedIndustries = INDUSTRY_SIMILARITY[data.industry] ?? [];
  const relatedMatch = data.targetIndustries.find((t) =>
    relatedIndustries.some((r) => r.toLowerCase() === t.toLowerCase()),
  );
  if (relatedMatch) {
    signals.push(
      `Related industry match: ${data.industry} (related to ${relatedMatch})`,
    );
    return 70;
  }

  signals.push(`Industry mismatch: ${data.industry}`);
  return 20;
}

function scoreComplianceRisk(
  data: ProspectScoringData,
  signals: string[],
): number {
  let score = 20; // Baseline

  const violations = data.violationCount ?? 0;
  const penalties = data.penaltyAmount ?? 0;

  if (violations > 0) {
    if (violations >= 10) {
      score += 50;
      signals.push(`High violation count: ${violations} violations`);
    } else if (violations >= 5) {
      score += 35;
      signals.push(`Moderate violation count: ${violations} violations`);
    } else if (violations >= 2) {
      score += 20;
      signals.push(`Some violations detected: ${violations}`);
    } else {
      score += 10;
      signals.push(`Minor violation detected: ${violations}`);
    }
  }

  if (penalties > 0) {
    if (penalties >= 100_000) {
      score += 30;
      signals.push(`Significant penalties: $${penalties.toLocaleString()}`);
    } else if (penalties >= 25_000) {
      score += 20;
      signals.push(`Notable penalties: $${penalties.toLocaleString()}`);
    } else {
      score += 10;
      signals.push(`Minor penalties: $${penalties.toLocaleString()}`);
    }
  }

  return clamp(score, 0, 100);
}

function scoreCompanySize(
  data: ProspectScoringData,
  signals: string[],
): number {
  let score = 40; // Neutral baseline

  if (data.employeeCount != null) {
    if (data.employeeCount >= 1000) {
      score = 90;
      signals.push(
        `Large enterprise: ${data.employeeCount.toLocaleString()} employees`,
      );
    } else if (data.employeeCount >= 250) {
      score = 75;
      signals.push(
        `Mid-market company: ${data.employeeCount.toLocaleString()} employees`,
      );
    } else if (data.employeeCount >= 50) {
      score = 60;
      signals.push(`SMB: ${data.employeeCount.toLocaleString()} employees`);
    } else {
      score = 35;
      signals.push(
        `Small business: ${data.employeeCount.toLocaleString()} employees`,
      );
    }
  }

  if (data.revenueRange) {
    const range = REVENUE_RANGES[data.revenueRange];
    if (range) {
      if (range.min >= 100_000_000) {
        score = Math.max(score, 85);
        signals.push(`High revenue range: ${data.revenueRange}`);
      } else if (range.min >= 10_000_000) {
        score = Math.max(score, 70);
        signals.push(`Moderate revenue range: ${data.revenueRange}`);
      } else {
        signals.push(`Revenue range: ${data.revenueRange}`);
      }
    }
  }

  return clamp(score, 0, 100);
}

function scoreRecentActivity(
  data: ProspectScoringData,
  signals: string[],
): number {
  if (!data.lastActivityDate) {
    return 30; // No activity data
  }

  const daysSinceActivity = Math.floor(
    (Date.now() - data.lastActivityDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysSinceActivity <= 7) {
    signals.push(`Very recent activity: ${daysSinceActivity} day(s) ago`);
    return 100;
  }
  if (daysSinceActivity <= 30) {
    signals.push(`Recent activity: ${daysSinceActivity} days ago`);
    return 80;
  }
  if (daysSinceActivity <= 90) {
    signals.push(`Moderate activity: ${daysSinceActivity} days ago`);
    return 60;
  }
  if (daysSinceActivity <= 180) {
    signals.push(`Aging activity: ${daysSinceActivity} days ago`);
    return 40;
  }

  signals.push(`Stale activity: ${daysSinceActivity} days ago`);
  return 15;
}

function scoreGeographicFit(
  data: ProspectScoringData,
  signals: string[],
): number {
  if (!data.state) {
    return 40; // Unknown geography
  }

  if (!data.targetStates || data.targetStates.length === 0) {
    // No target states defined -- moderate score for any known state
    signals.push(`State identified: ${data.state}`);
    return 50;
  }

  const stateLower = data.state.toLowerCase();
  if (data.targetStates.some((t) => t.toLowerCase() === stateLower)) {
    signals.push(`Target state match: ${data.state}`);
    return 100;
  }

  signals.push(`Outside target states: ${data.state}`);
  return 20;
}

function scoreRegulatoryPressure(
  data: ProspectScoringData,
  signals: string[],
): number {
  const programs = data.regulatoryPrograms ?? [];

  if (programs.length === 0) {
    return 20; // No regulatory data
  }

  // High-pressure programs that indicate complex compliance needs
  const highPressurePrograms = ["RCRA", "CWA", "CAA", "CERCLA", "TSCA"];
  const moderatePressurePrograms = ["SDWA", "NPDES", "TRI", "EPCRA"];

  let score = 20;
  const highPressureMatches = programs.filter((p) =>
    highPressurePrograms.includes(p.toUpperCase()),
  );
  const moderatePressureMatches = programs.filter((p) =>
    moderatePressurePrograms.includes(p.toUpperCase()),
  );

  if (highPressureMatches.length > 0) {
    score += highPressureMatches.length * 20;
    signals.push(
      `High-pressure regulatory programs: ${highPressureMatches.join(", ")}`,
    );
  }

  if (moderatePressureMatches.length > 0) {
    score += moderatePressureMatches.length * 10;
    signals.push(
      `Moderate-pressure regulatory programs: ${moderatePressureMatches.join(", ")}`,
    );
  }

  // Multi-program bonus: facilities under multiple regulatory programs
  // have higher compliance burden
  if (programs.length >= 3) {
    score += 15;
    signals.push(
      `Multi-program regulatory burden: ${programs.length} programs`,
    );
  }

  return clamp(score, 0, 100);
}

// ============================================================================
// UTILITIES
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

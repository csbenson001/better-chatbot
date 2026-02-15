export interface HealthAssessmentInput {
  leadId: string;
  tenantId: string;
  engagement: {
    lastContactDays: number;
    meetingsLast90Days: number;
    emailResponseRate: number;
    supportTickets: number;
    featureAdoption: number; // 0-100
  };
  contract: {
    monthsRemaining: number;
    contractValue: number;
    expansionDiscussed: boolean;
    competitorMentioned: boolean;
  };
  usage: {
    activeUsers: number;
    totalUsers: number;
    usageTrend: "increasing" | "stable" | "decreasing";
    keyFeatureUsage: number; // 0-100
  };
}

export interface HealthAssessment {
  healthScore: number;
  healthStatus: "healthy" | "at-risk" | "churning" | "expanding";
  engagementScore: number;
  adoptionScore: number;
  sentimentScore: number;
  expansionProbability: number;
  churnRisk: number;
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    trend: "improving" | "stable" | "declining";
    detail: string;
  }>;
  expansionOpportunities: Array<{
    type: string;
    description: string;
    estimatedValue: number;
    probability: number;
    suggestedAction: string;
  }>;
}

const FACTOR_WEIGHTS = {
  engagement: 0.25,
  adoption: 0.25,
  sentiment: 0.2,
  contractHealth: 0.15,
  usageTrend: 0.15,
};

export function assessCustomerHealth(
  input: HealthAssessmentInput,
): HealthAssessment {
  const factors: HealthAssessment["factors"] = [];

  // 1. Engagement Score
  const engagementScore = calculateEngagementScore(input.engagement);
  factors.push({
    name: "Engagement",
    score: engagementScore,
    weight: FACTOR_WEIGHTS.engagement,
    trend:
      input.engagement.lastContactDays < 14
        ? "improving"
        : input.engagement.lastContactDays > 45
          ? "declining"
          : "stable",
    detail: `Last contact: ${input.engagement.lastContactDays} days ago. ${input.engagement.meetingsLast90Days} meetings in 90 days. ${Math.round(input.engagement.emailResponseRate * 100)}% email response rate.`,
  });

  // 2. Adoption Score
  const adoptionScore = calculateAdoptionScore(input.usage);
  factors.push({
    name: "Product Adoption",
    score: adoptionScore,
    weight: FACTOR_WEIGHTS.adoption,
    trend:
      input.usage.usageTrend === "increasing"
        ? "improving"
        : input.usage.usageTrend === "decreasing"
          ? "declining"
          : "stable",
    detail: `${input.usage.activeUsers}/${input.usage.totalUsers} active users. ${input.usage.keyFeatureUsage}% key feature usage. Trend: ${input.usage.usageTrend}.`,
  });

  // 3. Sentiment Score
  const sentimentScore = calculateSentimentScore(
    input.engagement,
    input.contract,
  );
  factors.push({
    name: "Sentiment",
    score: sentimentScore,
    weight: FACTOR_WEIGHTS.sentiment,
    trend: input.contract.competitorMentioned
      ? "declining"
      : input.contract.expansionDiscussed
        ? "improving"
        : "stable",
    detail: input.contract.competitorMentioned
      ? "Competitor mentioned in recent conversations - potential risk"
      : input.contract.expansionDiscussed
        ? "Expansion discussed - positive sentiment"
        : "Neutral sentiment - no strong indicators",
  });

  // 4. Contract Health
  const contractScore = calculateContractHealth(input.contract);
  factors.push({
    name: "Contract Health",
    score: contractScore,
    weight: FACTOR_WEIGHTS.contractHealth,
    trend: input.contract.monthsRemaining > 6 ? "stable" : "declining",
    detail: `${input.contract.monthsRemaining} months remaining. Contract value: $${input.contract.contractValue.toLocaleString()}.`,
  });

  // 5. Usage Trend
  const usageTrendScore =
    input.usage.usageTrend === "increasing"
      ? 85
      : input.usage.usageTrend === "stable"
        ? 60
        : 25;
  factors.push({
    name: "Usage Trend",
    score: usageTrendScore,
    weight: FACTOR_WEIGHTS.usageTrend,
    trend:
      input.usage.usageTrend === "increasing"
        ? "improving"
        : input.usage.usageTrend === "decreasing"
          ? "declining"
          : "stable",
    detail: `Usage trend is ${input.usage.usageTrend}. Active user ratio: ${Math.round((input.usage.activeUsers / Math.max(input.usage.totalUsers, 1)) * 100)}%.`,
  });

  // Calculate overall health score
  const healthScore = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0),
  );

  // Calculate churn risk and expansion probability
  const churnRisk = calculateChurnRisk(healthScore, factors);
  const expansionProbability = calculateExpansionProbability(
    healthScore,
    input,
  );

  // Determine health status
  const healthStatus = determineHealthStatus(
    healthScore,
    churnRisk,
    expansionProbability,
  );

  // Identify expansion opportunities
  const expansionOpportunities = identifyExpansionOpps(input, healthScore);

  return {
    healthScore,
    healthStatus,
    engagementScore,
    adoptionScore,
    sentimentScore,
    expansionProbability,
    churnRisk,
    factors,
    expansionOpportunities,
  };
}

function calculateEngagementScore(
  engagement: HealthAssessmentInput["engagement"],
): number {
  let score = 0;
  // Recency of contact
  if (engagement.lastContactDays <= 7) score += 35;
  else if (engagement.lastContactDays <= 14) score += 28;
  else if (engagement.lastContactDays <= 30) score += 20;
  else if (engagement.lastContactDays <= 60) score += 10;
  else score += 0;

  // Meeting frequency
  score += Math.min(engagement.meetingsLast90Days * 8, 30);

  // Email response rate
  score += Math.round(engagement.emailResponseRate * 35);

  return Math.min(score, 100);
}

function calculateAdoptionScore(usage: HealthAssessmentInput["usage"]): number {
  const userRatio =
    usage.totalUsers > 0 ? usage.activeUsers / usage.totalUsers : 0;
  const userScore = Math.round(userRatio * 50);
  const featureScore = Math.round(usage.keyFeatureUsage * 0.5);
  return Math.min(userScore + featureScore, 100);
}

function calculateSentimentScore(
  engagement: HealthAssessmentInput["engagement"],
  contract: HealthAssessmentInput["contract"],
): number {
  let score = 50; // baseline
  if (contract.competitorMentioned) score -= 25;
  if (contract.expansionDiscussed) score += 20;
  if (engagement.supportTickets > 5) score -= 15;
  if (engagement.supportTickets === 0) score += 10;
  score += Math.round(engagement.emailResponseRate * 15);
  return Math.max(0, Math.min(100, score));
}

function calculateContractHealth(
  contract: HealthAssessmentInput["contract"],
): number {
  let score = 50;
  if (contract.monthsRemaining > 12) score += 30;
  else if (contract.monthsRemaining > 6) score += 15;
  else if (contract.monthsRemaining <= 3) score -= 20;
  if (contract.expansionDiscussed) score += 15;
  if (contract.competitorMentioned) score -= 15;
  return Math.max(0, Math.min(100, score));
}

function calculateChurnRisk(
  healthScore: number,
  _factors: HealthAssessment["factors"],
): number {
  if (healthScore >= 80) return Math.max(0, 15 - (healthScore - 80));
  if (healthScore >= 60) return 25 + Math.round((80 - healthScore) * 1.5);
  if (healthScore >= 40) return 50 + Math.round((60 - healthScore) * 1.5);
  return Math.min(95, 80 + Math.round((40 - healthScore) * 0.5));
}

function calculateExpansionProbability(
  healthScore: number,
  input: HealthAssessmentInput,
): number {
  if (healthScore < 60) return 5;
  let prob = Math.round((healthScore - 60) * 1.5);
  if (input.contract.expansionDiscussed) prob += 25;
  if (input.usage.usageTrend === "increasing") prob += 15;
  if (input.usage.keyFeatureUsage > 70) prob += 10;
  return Math.min(95, prob);
}

function determineHealthStatus(
  healthScore: number,
  churnRisk: number,
  expansionProbability: number,
): HealthAssessment["healthStatus"] {
  if (expansionProbability >= 50 && healthScore >= 70) return "expanding";
  if (churnRisk >= 60) return "churning";
  if (churnRisk >= 35 || healthScore < 50) return "at-risk";
  return "healthy";
}

function identifyExpansionOpps(
  input: HealthAssessmentInput,
  healthScore: number,
): HealthAssessment["expansionOpportunities"] {
  const opps: HealthAssessment["expansionOpportunities"] = [];

  if (
    input.usage.activeUsers / Math.max(input.usage.totalUsers, 1) > 0.7 &&
    healthScore >= 60
  ) {
    opps.push({
      type: "seat-expansion",
      description:
        "High user adoption indicates readiness for additional seats",
      estimatedValue: Math.round(input.contract.contractValue * 0.3),
      probability: 60,
      suggestedAction:
        "Discuss expanding user licenses to additional departments or teams",
    });
  }

  if (input.usage.keyFeatureUsage > 60 && healthScore >= 65) {
    opps.push({
      type: "feature-upsell",
      description:
        "Strong feature adoption suggests readiness for premium features",
      estimatedValue: Math.round(input.contract.contractValue * 0.25),
      probability: 45,
      suggestedAction: "Demo advanced analytics and reporting capabilities",
    });
  }

  if (input.contract.expansionDiscussed) {
    opps.push({
      type: "stated-interest",
      description: "Customer has explicitly discussed expansion",
      estimatedValue: Math.round(input.contract.contractValue * 0.5),
      probability: 70,
      suggestedAction:
        "Schedule expansion planning meeting with decision-makers",
    });
  }

  return opps;
}

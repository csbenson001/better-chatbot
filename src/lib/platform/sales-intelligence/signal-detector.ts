import { prospectingRepository } from "lib/db/repository";

export interface SignalDetectionInput {
  tenantId: string;
  prospectId: string;
}

export interface DetectedBuyingSignal {
  signalType: string;
  title: string;
  description: string;
  compositeScore: number;
  componentSignals: Array<{
    type: string;
    source: string;
    weight: number;
    score: number;
    detail: string;
  }>;
  recommendedAction: string;
  optimalTiming: string | null;
}

// Signal weights for composite scoring
const SIGNAL_WEIGHTS: Record<string, number> = {
  violation: 25,
  "new-permit": 20,
  "permit-renewal": 15,
  expansion: 20,
  hiring: 10,
  funding: 15,
  acquisition: 15,
  "regulatory-change": 20,
  "leadership-change": 10,
  "facility-opening": 15,
};

export async function detectBuyingSignals(
  input: SignalDetectionInput,
): Promise<DetectedBuyingSignal[]> {
  const prospect = await prospectingRepository.selectProspectById(
    input.prospectId,
    input.tenantId,
  );
  if (!prospect) return [];

  const signals = await prospectingRepository.selectSignalsByProspectId(
    input.prospectId,
    input.tenantId,
  );
  if (signals.length === 0) return [];

  const detectedSignals: DetectedBuyingSignal[] = [];

  // Check for compliance urgency (violations + permits)
  const violationSignals = signals.filter((s) => s.signalType === "violation");
  const permitSignals = signals.filter(
    (s) => s.signalType === "new-permit" || s.signalType === "permit-renewal",
  );

  if (violationSignals.length > 0 || permitSignals.length > 0) {
    const components = [
      ...violationSignals.map((s) => ({
        type: s.signalType,
        source: s.sourceType || "regulatory",
        weight: SIGNAL_WEIGHTS[s.signalType] || 10,
        score: s.strength,
        detail: s.title,
      })),
      ...permitSignals.map((s) => ({
        type: s.signalType,
        source: s.sourceType || "regulatory",
        weight: SIGNAL_WEIGHTS[s.signalType] || 10,
        score: s.strength,
        detail: s.title,
      })),
    ];

    const compositeScore = calculateCompositeScore(components);

    if (compositeScore >= 40) {
      detectedSignals.push({
        signalType: "compliance-urgency",
        title: `Compliance Urgency: ${prospect.companyName}`,
        description: `${violationSignals.length} violation(s) and ${permitSignals.length} permit activity detected.`,
        compositeScore,
        componentSignals: components,
        recommendedAction:
          compositeScore >= 70
            ? "Immediate outreach - position compliance solution as urgent need"
            : "Schedule discovery call to discuss compliance challenges",
        optimalTiming:
          violationSignals.length > 0
            ? "Within 1-2 weeks of violation"
            : "Before permit renewal deadline",
      });
    }
  }

  // Check for expansion signals
  const expansionSignals = signals.filter((s) =>
    ["expansion", "hiring", "funding", "facility-opening"].includes(
      s.signalType,
    ),
  );
  if (expansionSignals.length >= 2) {
    const components = expansionSignals.map((s) => ({
      type: s.signalType,
      source: s.sourceType || "business-intelligence",
      weight: SIGNAL_WEIGHTS[s.signalType] || 10,
      score: s.strength,
      detail: s.title,
    }));

    const compositeScore = calculateCompositeScore(components);

    detectedSignals.push({
      signalType: "expansion-ready",
      title: `Expansion Opportunity: ${prospect.companyName}`,
      description: `${expansionSignals.length} growth indicators detected across hiring, funding, and expansion signals.`,
      compositeScore,
      componentSignals: components,
      recommendedAction:
        "Position as growth enabler - emphasize scalability and multi-site support",
      optimalTiming:
        "During expansion planning phase (typically 3-6 months before execution)",
    });
  }

  // Check for leadership transition
  const leadershipSignals = signals.filter(
    (s) => s.signalType === "leadership-change",
  );
  if (leadershipSignals.length > 0) {
    const components = leadershipSignals.map((s) => ({
      type: s.signalType,
      source: s.sourceType || "news",
      weight: SIGNAL_WEIGHTS[s.signalType] || 10,
      score: s.strength,
      detail: s.title,
    }));

    detectedSignals.push({
      signalType: "leadership-transition",
      title: `Leadership Change: ${prospect.companyName}`,
      description: `New leadership detected. New leaders often review and change vendors within first 90 days.`,
      compositeScore: calculateCompositeScore(components),
      componentSignals: components,
      recommendedAction:
        "Reach out to new leadership within 30 days. Position as strategic partner for their new initiatives.",
      optimalTiming:
        "30-90 days after leadership change (during vendor review period)",
    });
  }

  // Check for high-intent composite
  if (prospect.fitScore && prospect.intentScore) {
    const combinedScore = prospect.fitScore * 0.4 + prospect.intentScore * 0.6;
    if (combinedScore >= 60) {
      detectedSignals.push({
        signalType: "high-intent",
        title: `High Intent: ${prospect.companyName}`,
        description: `High combined fit (${prospect.fitScore}) and intent (${prospect.intentScore}) scores.`,
        compositeScore: Math.round(combinedScore),
        componentSignals: [
          {
            type: "fit-score",
            source: "scoring-engine",
            weight: 40,
            score: prospect.fitScore,
            detail: `Fit score: ${prospect.fitScore}/100`,
          },
          {
            type: "intent-score",
            source: "scoring-engine",
            weight: 60,
            score: prospect.intentScore,
            detail: `Intent score: ${prospect.intentScore}/100`,
          },
        ],
        recommendedAction:
          "Prioritize for immediate outreach. This prospect shows strong alignment and buying intent.",
        optimalTiming: "Now - strike while intent is high",
      });
    }
  }

  return detectedSignals.sort((a, b) => b.compositeScore - a.compositeScore);
}

function calculateCompositeScore(
  components: Array<{ weight: number; score: number }>,
): number {
  if (components.length === 0) return 0;
  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const weightedSum = components.reduce(
    (sum, c) => sum + c.score * c.weight,
    0,
  );
  return Math.round(weightedSum / totalWeight);
}

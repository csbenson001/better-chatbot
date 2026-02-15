export interface DealData {
  outcome: "won" | "lost" | "no-decision" | "disqualified";
  dealValue: number;
  salesCycleLength: number;
  competitorInvolved: string | null;
  stages: Array<{
    stage: string;
    enteredAt: string;
    exitedAt?: string;
    durationDays: number;
  }>;
  winLossReasons: string[];
}

export interface DealInsights {
  keyFactors: Array<{
    factor: string;
    impact: "positive" | "negative" | "neutral";
    weight: number;
    description: string;
  }>;
  lessonsLearned: string[];
  recommendations: string[];
  benchmarks: {
    avgSalesCycleWon: number;
    avgSalesCycleLost: number;
    avgDealSizeWon: number;
    winRateByStage: Record<string, number>;
  };
}

export function analyzeDeal(deal: DealData): DealInsights {
  const keyFactors: DealInsights["keyFactors"] = [];
  const lessonsLearned: string[] = [];
  const recommendations: string[] = [];

  // Analyze sales cycle length
  if (deal.outcome === "won") {
    if (deal.salesCycleLength < 30) {
      keyFactors.push({
        factor: "Fast sales cycle",
        impact: "positive",
        weight: 8,
        description: `Deal closed in ${deal.salesCycleLength} days - strong urgency and alignment`,
      });
    } else if (deal.salesCycleLength > 120) {
      keyFactors.push({
        factor: "Extended sales cycle",
        impact: "neutral",
        weight: 5,
        description: `${deal.salesCycleLength} day cycle - consider what delayed the process`,
      });
      lessonsLearned.push(
        "Long sales cycles increase risk of no-decision. Identify and address blockers earlier.",
      );
    }
  } else if (deal.outcome === "lost") {
    if (deal.salesCycleLength > 90) {
      keyFactors.push({
        factor: "Prolonged evaluation",
        impact: "negative",
        weight: 7,
        description:
          "Extended cycle may indicate poor qualification or loss of champion",
      });
      lessonsLearned.push(
        "Set clear decision timelines and milestones early in the process.",
      );
    }
  }

  // Analyze competitor involvement
  if (deal.competitorInvolved) {
    if (deal.outcome === "won") {
      keyFactors.push({
        factor: "Competitive win",
        impact: "positive",
        weight: 9,
        description: `Won against ${deal.competitorInvolved} - differentiation message resonated`,
      });
      recommendations.push(
        `Document winning strategy against ${deal.competitorInvolved} for battle card updates`,
      );
    } else if (deal.outcome === "lost") {
      keyFactors.push({
        factor: "Competitive loss",
        impact: "negative",
        weight: 9,
        description: `Lost to ${deal.competitorInvolved} - review competitive positioning`,
      });
      lessonsLearned.push(
        `Analyze what ${deal.competitorInvolved} offered that we didn't match`,
      );
      recommendations.push(
        `Update battle card for ${deal.competitorInvolved} based on this loss`,
      );
    }
  }

  // Analyze deal value
  if (deal.dealValue > 100000) {
    keyFactors.push({
      factor: "Enterprise deal",
      impact: deal.outcome === "won" ? "positive" : "negative",
      weight: 7,
      description: `$${deal.dealValue.toLocaleString()} deal - enterprise-level engagement`,
    });
  }

  // Analyze win/loss reasons
  for (const reason of deal.winLossReasons) {
    const r = reason.toLowerCase();
    if (r.includes("price") || r.includes("cost") || r.includes("budget")) {
      keyFactors.push({
        factor: "Pricing",
        impact: deal.outcome === "won" ? "positive" : "negative",
        weight: 8,
        description: reason,
      });
      if (deal.outcome === "lost") {
        lessonsLearned.push(
          "Review pricing strategy - consider ROI-based selling to justify investment",
        );
        recommendations.push(
          "Lead with ROI and compliance cost savings before discussing price",
        );
      }
    }
    if (
      r.includes("feature") ||
      r.includes("capability") ||
      r.includes("function")
    ) {
      keyFactors.push({
        factor: "Product capabilities",
        impact: deal.outcome === "won" ? "positive" : "negative",
        weight: 7,
        description: reason,
      });
    }
    if (
      r.includes("relationship") ||
      r.includes("trust") ||
      r.includes("support")
    ) {
      keyFactors.push({
        factor: "Relationship strength",
        impact: deal.outcome === "won" ? "positive" : "negative",
        weight: 6,
        description: reason,
      });
    }
    if (
      r.includes("timeline") ||
      r.includes("urgency") ||
      r.includes("timing")
    ) {
      keyFactors.push({
        factor: "Timing",
        impact: deal.outcome === "won" ? "positive" : "negative",
        weight: 5,
        description: reason,
      });
    }
  }

  // Analyze stage progression
  if (deal.stages.length > 0) {
    const stuckStages = deal.stages.filter((s) => s.durationDays > 30);
    for (const stage of stuckStages) {
      keyFactors.push({
        factor: `Stalled at ${stage.stage}`,
        impact: "negative",
        weight: 6,
        description: `Spent ${stage.durationDays} days in ${stage.stage} stage`,
      });
    }
    if (stuckStages.length > 0) {
      lessonsLearned.push(
        `Deal stalled at: ${stuckStages.map((s) => s.stage).join(", ")}. Identify blockers at these stages earlier.`,
      );
    }
  }

  // Generate no-decision specific insights
  if (deal.outcome === "no-decision") {
    lessonsLearned.push(
      "No-decision outcomes often indicate weak pain or no compelling event. Qualify harder upfront.",
    );
    recommendations.push(
      "Establish a mutual close plan with clear milestones and decision criteria",
    );
    recommendations.push(
      "Identify and validate a compelling event that drives urgency",
    );
  }

  // General recommendations based on outcome
  if (deal.outcome === "won") {
    recommendations.push("Document winning strategy and tactics for playbook");
    recommendations.push("Request reference/case study from this customer");
    recommendations.push(
      "Set up regular health check cadence to protect and expand account",
    );
  } else if (deal.outcome === "lost") {
    recommendations.push("Schedule post-mortem with full sales team");
    recommendations.push(
      "Set reminder to re-engage in 6 months when circumstances may change",
    );
    recommendations.push(
      "Update ICP and qualification criteria based on loss factors",
    );
  }

  return {
    keyFactors,
    lessonsLearned,
    recommendations,
    benchmarks: {
      avgSalesCycleWon: 45, // Industry benchmarks
      avgSalesCycleLost: 75,
      avgDealSizeWon: 85000,
      winRateByStage: {
        qualified: 35,
        proposal: 55,
        negotiation: 75,
      },
    },
  };
}

// Aggregate analysis across multiple deals
export function analyzePortfolio(deals: DealData[]): {
  totalDeals: number;
  winRate: number;
  avgSalesCycle: number;
  avgDealSize: number;
  topWinReasons: string[];
  topLossReasons: string[];
  competitorWinRates: Record<string, number>;
} {
  const won = deals.filter((d) => d.outcome === "won");
  const lost = deals.filter((d) => d.outcome === "lost");

  const winRate =
    deals.length > 0 ? Math.round((won.length / deals.length) * 100) : 0;
  const avgSalesCycle =
    deals.length > 0
      ? Math.round(
          deals.reduce((sum, d) => sum + d.salesCycleLength, 0) / deals.length,
        )
      : 0;
  const avgDealSize =
    won.length > 0
      ? Math.round(won.reduce((sum, d) => sum + d.dealValue, 0) / won.length)
      : 0;

  // Aggregate reasons
  const winReasonCounts = new Map<string, number>();
  const lossReasonCounts = new Map<string, number>();

  for (const d of won) {
    for (const r of d.winLossReasons) {
      winReasonCounts.set(r, (winReasonCounts.get(r) || 0) + 1);
    }
  }
  for (const d of lost) {
    for (const r of d.winLossReasons) {
      lossReasonCounts.set(r, (lossReasonCounts.get(r) || 0) + 1);
    }
  }

  const topWinReasons = [...winReasonCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason]) => reason);

  const topLossReasons = [...lossReasonCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason]) => reason);

  // Competitor analysis
  const competitorWins = new Map<string, { won: number; total: number }>();
  for (const d of deals) {
    if (d.competitorInvolved) {
      const entry = competitorWins.get(d.competitorInvolved) || {
        won: 0,
        total: 0,
      };
      entry.total++;
      if (d.outcome === "won") entry.won++;
      competitorWins.set(d.competitorInvolved, entry);
    }
  }
  const competitorWinRates: Record<string, number> = {};
  for (const [comp, stats] of competitorWins) {
    competitorWinRates[comp] = Math.round((stats.won / stats.total) * 100);
  }

  return {
    totalDeals: deals.length,
    winRate,
    avgSalesCycle,
    avgDealSize,
    topWinReasons,
    topLossReasons,
    competitorWinRates,
  };
}

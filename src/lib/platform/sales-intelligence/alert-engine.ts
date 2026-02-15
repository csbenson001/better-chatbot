import { prospectingRepository } from "lib/db/repository";

export interface AlertEvalInput {
  tenantId: string;
  rules: Array<{
    id: string;
    category: string;
    severity: string;
    conditions: Array<{
      condition: string;
      parameters: Record<string, unknown>;
    }>;
  }>;
}

export interface GeneratedAlert {
  category: string;
  severity: string;
  title: string;
  description: string;
  prospectId?: string;
  sourceUrl?: string;
  sourceType?: string;
  actionItems: string[];
  metadata: Record<string, unknown>;
}

// Evaluate alert rules against current data
export async function evaluateAlertRules(
  input: AlertEvalInput,
): Promise<GeneratedAlert[]> {
  const alerts: GeneratedAlert[] = [];

  for (const rule of input.rules) {
    for (const condition of rule.conditions) {
      const matched = await evaluateCondition(input.tenantId, condition);
      for (const match of matched) {
        alerts.push({
          category: rule.category,
          severity: rule.severity,
          title: match.title,
          description: match.description,
          prospectId: match.prospectId,
          sourceUrl: match.sourceUrl,
          sourceType: match.sourceType,
          actionItems: generateActionItems(rule.category, match),
          metadata: {
            ruleId: rule.id,
            condition: condition.condition,
            ...match.metadata,
          },
        });
      }
    }
  }

  return alerts;
}

interface ConditionMatch {
  title: string;
  description: string;
  prospectId?: string;
  sourceUrl?: string;
  sourceType?: string;
  metadata: Record<string, unknown>;
}

async function evaluateCondition(
  tenantId: string,
  condition: {
    condition: string;
    parameters: Record<string, unknown>;
  },
): Promise<ConditionMatch[]> {
  const matches: ConditionMatch[] = [];

  switch (condition.condition) {
    case "new-violation": {
      // Check for prospects with recent violation signals
      const prospects = await prospectingRepository.selectProspectsByTenantId(
        tenantId,
        { limit: 100 },
      );
      for (const prospect of prospects) {
        const signals = await prospectingRepository.selectSignalsByProspectId(
          prospect.id,
          tenantId,
        );
        const recentViolations = signals.filter(
          (s) => s.signalType === "violation" && isWithinDays(s.detectedAt, 7),
        );
        for (const v of recentViolations) {
          matches.push({
            title: `Compliance Violation: ${prospect.companyName}`,
            description:
              v.description ||
              `New violation detected for ${prospect.companyName}`,
            prospectId: prospect.id,
            sourceUrl: v.sourceUrl ?? undefined,
            sourceType: v.sourceType ?? undefined,
            metadata: {
              signalId: v.id,
              signalStrength: v.strength,
            },
          });
        }
      }
      break;
    }

    case "score-threshold": {
      const threshold = (condition.parameters.minScore as number) ?? 70;
      const prospects = await prospectingRepository.selectProspectsByTenantId(
        tenantId,
        {
          minFitScore: threshold,
          limit: 50,
        },
      );
      for (const prospect of prospects) {
        matches.push({
          title: `High-Score Prospect: ${prospect.companyName}`,
          description: `${prospect.companyName} has a fit score of ${prospect.fitScore}, above threshold of ${threshold}`,
          prospectId: prospect.id,
          metadata: {
            fitScore: prospect.fitScore,
            intentScore: prospect.intentScore,
          },
        });
      }
      break;
    }

    case "new-signal": {
      const signalType = condition.parameters.signalType as string | undefined;
      const prospects = await prospectingRepository.selectProspectsByTenantId(
        tenantId,
        { limit: 100 },
      );
      for (const prospect of prospects) {
        const signals = await prospectingRepository.selectSignalsByProspectId(
          prospect.id,
          tenantId,
        );
        const recent = signals.filter(
          (s) =>
            isWithinDays(s.detectedAt, 3) &&
            (!signalType || s.signalType === signalType),
        );
        for (const s of recent) {
          matches.push({
            title: `New Signal: ${s.title}`,
            description:
              s.description || `Signal detected for ${prospect.companyName}`,
            prospectId: prospect.id,
            sourceUrl: s.sourceUrl ?? undefined,
            sourceType: s.sourceType ?? undefined,
            metadata: {
              signalId: s.id,
              signalType: s.signalType,
            },
          });
        }
      }
      break;
    }

    default:
      break;
  }

  return matches;
}

function isWithinDays(date: Date, days: number): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return new Date(date) >= cutoff;
}

function generateActionItems(
  category: string,
  _match: ConditionMatch,
): string[] {
  const items: string[] = [];
  switch (category) {
    case "compliance-violation":
      items.push("Review violation details and severity");
      items.push("Prepare compliance-focused outreach");
      items.push("Calculate potential compliance cost savings");
      break;
    case "buying-signal":
      items.push("Review signal details and timing");
      items.push("Prepare personalized outreach");
      items.push("Schedule discovery call");
      break;
    case "permit-expiry":
      items.push("Check permit expiration date");
      items.push("Prepare renewal assistance offer");
      break;
    default:
      items.push("Review alert details");
      items.push("Determine appropriate action");
  }
  return items;
}

// Calculate severity score for sorting alerts
export function calculateAlertPriority(
  severity: string,
  category: string,
): number {
  const severityScores: Record<string, number> = {
    critical: 100,
    high: 80,
    medium: 60,
    low: 40,
    info: 20,
  };
  const categoryBoost: Record<string, number> = {
    "compliance-violation": 15,
    "regulatory-change": 10,
    "buying-signal": 5,
    "expansion-signal": 5,
  };
  return (severityScores[severity] || 0) + (categoryBoost[category] || 0);
}

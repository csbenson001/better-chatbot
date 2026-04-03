import type { AgentType } from "./agentTypes";
import type { AgentColor } from "./agentColors";

export type SubagentStatus =
  | "DONE"
  | "DONE_WITH_CONCERNS"
  | "NEEDS_CONTEXT"
  | "BLOCKED";

export interface AgentSummary {
  agentId: string;
  agentType: AgentType | "fork" | "custom";
  parentAgentId?: string;
  task: string;
  status: SubagentStatus;
  durationMs: number;
  toolCallCount: number;
  tokenUsage: { inputTokens: number; outputTokens: number };
  costUsd: number;
  color?: AgentColor;
  startedAt: Date;
  completedAt: Date;
}

export function calculateAgentCost(
  summary: Pick<AgentSummary, "tokenUsage">,
  inputRatePer1M = 3.0,
  outputRatePer1M = 15.0,
): number {
  return (
    (summary.tokenUsage.inputTokens * inputRatePer1M) / 1_000_000 +
    (summary.tokenUsage.outputTokens * outputRatePer1M) / 1_000_000
  );
}

export function aggregateSummaries(summaries: AgentSummary[]): {
  totalCostUsd: number;
  totalTokens: number;
  totalDurationMs: number;
  toolCallCount: number;
  agentCount: number;
  statusCounts: Record<SubagentStatus, number>;
} {
  const statusCounts: Record<SubagentStatus, number> = {
    DONE: 0,
    DONE_WITH_CONCERNS: 0,
    NEEDS_CONTEXT: 0,
    BLOCKED: 0,
  };

  for (const s of summaries) {
    statusCounts[s.status]++;
  }

  return {
    totalCostUsd: summaries.reduce((s, a) => s + a.costUsd, 0),
    totalTokens: summaries.reduce(
      (s, a) => s + a.tokenUsage.inputTokens + a.tokenUsage.outputTokens,
      0,
    ),
    totalDurationMs: summaries.reduce((s, a) => s + a.durationMs, 0),
    toolCallCount: summaries.reduce((s, a) => s + a.toolCallCount, 0),
    agentCount: summaries.length,
    statusCounts,
  };
}

export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
  requests: number;
}

export interface SessionCostState {
  sessionId: string;
  modelUsage: Record<string, ModelUsage>;
  totalCostUsd: number;
  startedAt: Date;
  lastUpdatedAt: Date;
}

// Approximate pricing per 1M tokens (update when Anthropic changes pricing)
const MODEL_PRICING: Record<
  string,
  { inputPer1M: number; outputPer1M: number }
> = {
  "claude-sonnet-4-6": { inputPer1M: 3.0, outputPer1M: 15.0 },
  "claude-opus-4-6": { inputPer1M: 15.0, outputPer1M: 75.0 },
  "claude-haiku-4-5": { inputPer1M: 0.25, outputPer1M: 1.25 },
  default: { inputPer1M: 3.0, outputPer1M: 15.0 },
};

export function calculateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = MODEL_PRICING[model] ?? MODEL_PRICING.default;
  return (
    (inputTokens * pricing.inputPer1M) / 1_000_000 +
    (outputTokens * pricing.outputPer1M) / 1_000_000
  );
}

export function createEmptyCostState(sessionId: string): SessionCostState {
  return {
    sessionId,
    modelUsage: {},
    totalCostUsd: 0,
    startedAt: new Date(),
    lastUpdatedAt: new Date(),
  };
}

export function accumulateUsage(
  state: SessionCostState,
  model: string,
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens?: number;
    cacheReadTokens?: number;
  },
): SessionCostState {
  const existing = state.modelUsage[model] ?? {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    requests: 0,
  };

  const updated: ModelUsage = {
    inputTokens: existing.inputTokens + usage.inputTokens,
    outputTokens: existing.outputTokens + usage.outputTokens,
    cacheCreationTokens:
      existing.cacheCreationTokens + (usage.cacheCreationTokens ?? 0),
    cacheReadTokens: existing.cacheReadTokens + (usage.cacheReadTokens ?? 0),
    requests: existing.requests + 1,
  };

  const costDelta = calculateCostUsd(
    model,
    usage.inputTokens,
    usage.outputTokens,
  );

  return {
    ...state,
    modelUsage: { ...state.modelUsage, [model]: updated },
    totalCostUsd: state.totalCostUsd + costDelta,
    lastUpdatedAt: new Date(),
  };
}

export function getTotalTokens(state: SessionCostState): {
  input: number;
  output: number;
  total: number;
} {
  const input = Object.values(state.modelUsage).reduce(
    (s, u) => s + u.inputTokens,
    0,
  );
  const output = Object.values(state.modelUsage).reduce(
    (s, u) => s + u.outputTokens,
    0,
  );
  return { input, output, total: input + output };
}

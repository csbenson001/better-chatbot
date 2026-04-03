// Fast token estimation without API calls (~15% error margin)
// Rule of thumb: 1 token ≈ 4 characters
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function estimateMessagesTokens(
  messages: Array<{ role: string; content: unknown }>,
): number {
  return estimateTokens(JSON.stringify(messages));
}

// Check if context is approaching threshold
export function isApproachingThreshold(
  currentTokens: number,
  maxTokens: number,
  thresholdPct: number,
): boolean {
  return currentTokens / maxTokens >= thresholdPct;
}

// Calculate how many tokens to remove to get below threshold
export function tokensToRemove(
  currentTokens: number,
  maxTokens: number,
  targetPct: number = 0.7,
): number {
  const targetTokens = Math.floor(maxTokens * targetPct);
  return Math.max(0, currentTokens - targetTokens);
}

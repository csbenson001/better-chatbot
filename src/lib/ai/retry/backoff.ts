export const BACKOFF_CONFIG = {
  BASE_DELAY_MS: 500,
  MAX_DELAY_MS: 30_000,
} as const;

// Exponential backoff with ±20% jitter to prevent thundering herd
export function calculateDelay(
  attempt: number,
  baseDelayMs: number = BACKOFF_CONFIG.BASE_DELAY_MS,
  maxDelayMs: number = BACKOFF_CONFIG.MAX_DELAY_MS,
): number {
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const capped = Math.min(exponential, maxDelayMs);
  const jitter = capped * (0.8 + Math.random() * 0.4);
  return Math.round(jitter);
}

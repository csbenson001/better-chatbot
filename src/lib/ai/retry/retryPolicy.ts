import type { QuerySource } from "./querySource";
import { shouldRetryOn429, shouldRetryOn529 } from "./querySource";

export interface RetryPolicy {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryOn: (status: number, message?: string) => boolean;
}

const NETWORK_ERROR_CODES = [
  "ECONNRESET",
  "EPIPE",
  "ECONNREFUSED",
  "ETIMEDOUT",
];

function isNetworkError(message?: string): boolean {
  if (!message) return false;
  return NETWORK_ERROR_CODES.some((code) => message.includes(code));
}

export function getRetryPolicy(source: QuerySource): RetryPolicy {
  const retries529 = shouldRetryOn529(source);
  const retries429 = shouldRetryOn429(source);

  if (source === "user" || source === "subagent") {
    return {
      maxRetries: 10,
      baseDelayMs: 500,
      maxDelayMs: 30_000,
      retryOn: (status, msg) =>
        (retries529 && status === 529) ||
        (retries429 && status === 429) ||
        isNetworkError(msg),
    };
  }

  if (source === "compact") {
    return {
      maxRetries: 3,
      baseDelayMs: 1_000,
      maxDelayMs: 10_000,
      retryOn: (status) =>
        (retries529 && status === 529) || (retries429 && status === 429),
    };
  }

  if (source === "session-title") {
    return {
      maxRetries: 1,
      baseDelayMs: 1_000,
      maxDelayMs: 1_000,
      retryOn: (_status, msg) => isNetworkError(msg), // only network errors
    };
  }

  // memory-extract, session-memory, project-memory, classifier — never retry
  return {
    maxRetries: 0,
    baseDelayMs: 0,
    maxDelayMs: 0,
    retryOn: () => false,
  };
}

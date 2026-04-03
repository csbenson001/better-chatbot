import { describe, it, expect } from "vitest";
import {
  isUserBlocking,
  shouldRetryOn529,
  shouldRetryOn429,
} from "./querySource";
import { calculateDelay } from "./backoff";
import { getRetryPolicy } from "./retryPolicy";
import {
  ConsecutiveOverloadTracker,
  MAX_CONSECUTIVE_OVERLOAD,
} from "./overloadTracker";
import {
  getUserFacingErrorMessage,
  getRetryProgressMessage,
} from "./errorMessages";

describe("querySource", () => {
  it("marks user, compact, subagent as user-blocking", () => {
    expect(isUserBlocking("user")).toBe(true);
    expect(isUserBlocking("compact")).toBe(true);
    expect(isUserBlocking("subagent")).toBe(true);
  });

  it("marks background sources as non-blocking", () => {
    expect(isUserBlocking("memory-extract")).toBe(false);
    expect(isUserBlocking("session-title")).toBe(false);
    expect(isUserBlocking("session-memory")).toBe(false);
    expect(isUserBlocking("project-memory")).toBe(false);
    expect(isUserBlocking("classifier")).toBe(false);
  });

  it("should retry 529 for blocking sources only", () => {
    expect(shouldRetryOn529("user")).toBe(true);
    expect(shouldRetryOn529("memory-extract")).toBe(false);
  });

  it("should retry 429 for blocking sources only", () => {
    expect(shouldRetryOn429("compact")).toBe(true);
    expect(shouldRetryOn429("classifier")).toBe(false);
  });
});

describe("backoff", () => {
  it("returns delay within ±40% of expected exponential", () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const delay = calculateDelay(attempt, 500, 30_000);
      const expected = Math.min(500 * Math.pow(2, attempt), 30_000);
      expect(delay).toBeGreaterThanOrEqual(expected * 0.8);
      expect(delay).toBeLessThanOrEqual(expected * 1.2);
    }
  });

  it("caps at maxDelayMs", () => {
    const delay = calculateDelay(20, 500, 5_000);
    expect(delay).toBeLessThanOrEqual(5_000 * 1.2);
  });
});

describe("retryPolicy", () => {
  it("user policy retries 529 and 429", () => {
    const policy = getRetryPolicy("user");
    expect(policy.maxRetries).toBe(10);
    expect(policy.retryOn(529)).toBe(true);
    expect(policy.retryOn(429)).toBe(true);
    expect(policy.retryOn(400)).toBe(false);
  });

  it("compact policy retries 529 and 429 with fewer retries", () => {
    const policy = getRetryPolicy("compact");
    expect(policy.maxRetries).toBe(3);
    expect(policy.retryOn(529)).toBe(true);
    expect(policy.retryOn(429)).toBe(true);
  });

  it("memory-extract policy never retries", () => {
    const policy = getRetryPolicy("memory-extract");
    expect(policy.maxRetries).toBe(0);
    expect(policy.retryOn(529)).toBe(false);
    expect(policy.retryOn(429)).toBe(false);
  });

  it("session-title retries only network errors", () => {
    const policy = getRetryPolicy("session-title");
    expect(policy.maxRetries).toBe(1);
    expect(policy.retryOn(529)).toBe(false);
    expect(policy.retryOn(429)).toBe(false);
    expect(policy.retryOn(0, "ECONNRESET")).toBe(true);
  });

  it("classifier never retries", () => {
    const policy = getRetryPolicy("classifier");
    expect(policy.maxRetries).toBe(0);
  });
});

describe("ConsecutiveOverloadTracker", () => {
  it("starts at 0, increments on failure", () => {
    const tracker = new ConsecutiveOverloadTracker();
    expect(tracker.getCount()).toBe(0);
    tracker.recordFailure();
    expect(tracker.getCount()).toBe(1);
  });

  it("resets to 0 on success", () => {
    const tracker = new ConsecutiveOverloadTracker();
    tracker.recordFailure();
    tracker.recordFailure();
    tracker.recordSuccess();
    expect(tracker.getCount()).toBe(0);
  });

  it("pre-seeds from streaming failures", () => {
    const tracker = new ConsecutiveOverloadTracker();
    tracker.preSeed(2);
    expect(tracker.getCount()).toBe(2);
  });

  it("shouldFallbackToNonStreaming after 1 failure", () => {
    const tracker = new ConsecutiveOverloadTracker();
    expect(tracker.shouldFallbackToNonStreaming()).toBe(false);
    tracker.recordFailure();
    expect(tracker.shouldFallbackToNonStreaming()).toBe(true);
  });

  it(`shouldAbort after ${MAX_CONSECUTIVE_OVERLOAD} failures`, () => {
    const tracker = new ConsecutiveOverloadTracker();
    expect(tracker.shouldAbort()).toBe(false);
    for (let i = 0; i < MAX_CONSECUTIVE_OVERLOAD; i++) tracker.recordFailure();
    expect(tracker.shouldAbort()).toBe(true);
  });
});

describe("errorMessages", () => {
  it("returns specific message for 429", () => {
    expect(getUserFacingErrorMessage(429)).toContain("rate limit");
  });

  it("returns specific message for 529", () => {
    expect(getUserFacingErrorMessage(529)).toContain("overloaded");
  });

  it("returns auth message for 401", () => {
    expect(getUserFacingErrorMessage(401)).toContain("Authentication");
  });

  it("returns connection message for ECONNRESET", () => {
    expect(getUserFacingErrorMessage(0, "ECONNRESET error")).toContain(
      "Connection lost",
    );
  });

  it("formats retry progress message", () => {
    expect(getRetryProgressMessage(2, 10)).toBe("Retry 2/10...");
  });
});

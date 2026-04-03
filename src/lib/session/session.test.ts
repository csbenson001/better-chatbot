import { describe, it, expect } from "vitest";
import {
  generateSessionId,
  isSessionStale,
  buildResumeSystemMessage,
} from "./sessionId";
import {
  createEmptyCostState,
  accumulateUsage,
  calculateCostUsd,
  getTotalTokens,
} from "./costTracker";

describe("sessionId", () => {
  it("generates a valid UUID", () => {
    const id = generateSessionId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, generateSessionId));
    expect(ids.size).toBe(100);
  });

  it("detects stale session after threshold", () => {
    const justNow = new Date();
    const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000);
    const twentyNineMinutesAgo = new Date(Date.now() - 29 * 60 * 1000);

    expect(isSessionStale(justNow)).toBe(false);
    expect(isSessionStale(thirtyOneMinutesAgo)).toBe(true);
    expect(isSessionStale(twentyNineMinutesAgo)).toBe(false);
  });

  it("uses custom threshold", () => {
    const sixtyOneMinutesAgo = new Date(Date.now() - 61 * 60 * 1000);
    expect(isSessionStale(sixtyOneMinutesAgo, 60)).toBe(true);
    expect(isSessionStale(sixtyOneMinutesAgo, 120)).toBe(false);
  });

  it("builds a resume system message with time elapsed", () => {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const msg = buildResumeSystemMessage(
      thirtyMinutesAgo,
      "Write a report on Q1 sales data",
    );
    expect(msg).toContain("SESSION RESUMED");
    expect(msg).toContain("30 minutes");
    expect(msg).toContain("Write a report on Q1");
    expect(msg).toContain("Continue from where we left off");
  });

  it("includes pending work in resume message when provided", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const msg = buildResumeSystemMessage(
      fiveMinutesAgo,
      "hello",
      "Building the auth module",
    );
    expect(msg).toContain("Building the auth module");
  });

  it("omits pending work line when not provided", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const msg = buildResumeSystemMessage(fiveMinutesAgo, "hello");
    expect(msg).not.toContain("In-progress work");
  });

  it("truncates long message previews to 100 chars", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const longMsg = "a".repeat(200);
    const msg = buildResumeSystemMessage(fiveMinutesAgo, longMsg);
    expect(msg).toContain('"' + "a".repeat(100) + '..."');
  });
});

describe("costTracker", () => {
  it("creates empty cost state", () => {
    const state = createEmptyCostState("test-session-id");
    expect(state.sessionId).toBe("test-session-id");
    expect(state.totalCostUsd).toBe(0);
    expect(state.modelUsage).toEqual({});
  });

  it("calculates cost for sonnet", () => {
    // 1M input tokens at $3/M = $3.00, 1M output at $15/M = $15.00
    expect(calculateCostUsd("claude-sonnet-4-6", 1_000_000, 0)).toBeCloseTo(
      3.0,
      4,
    );
    expect(calculateCostUsd("claude-sonnet-4-6", 0, 1_000_000)).toBeCloseTo(
      15.0,
      4,
    );
  });

  it("uses default pricing for unknown model", () => {
    const cost = calculateCostUsd("unknown-model", 1_000_000, 0);
    expect(cost).toBeGreaterThan(0);
  });

  it("accumulates usage across multiple calls", () => {
    let state = createEmptyCostState("s1");
    state = accumulateUsage(state, "claude-sonnet-4-6", {
      inputTokens: 1000,
      outputTokens: 500,
    });
    state = accumulateUsage(state, "claude-sonnet-4-6", {
      inputTokens: 2000,
      outputTokens: 1000,
    });

    expect(state.modelUsage["claude-sonnet-4-6"].inputTokens).toBe(3000);
    expect(state.modelUsage["claude-sonnet-4-6"].outputTokens).toBe(1500);
    expect(state.modelUsage["claude-sonnet-4-6"].requests).toBe(2);
    expect(state.totalCostUsd).toBeGreaterThan(0);
  });

  it("accumulates usage across different models", () => {
    let state = createEmptyCostState("s1");
    state = accumulateUsage(state, "claude-sonnet-4-6", {
      inputTokens: 1000,
      outputTokens: 500,
    });
    state = accumulateUsage(state, "claude-haiku-4-5", {
      inputTokens: 5000,
      outputTokens: 2000,
    });

    expect(Object.keys(state.modelUsage)).toHaveLength(2);
  });

  it("includes cache tokens in accumulation", () => {
    let state = createEmptyCostState("s1");
    state = accumulateUsage(state, "claude-sonnet-4-6", {
      inputTokens: 1000,
      outputTokens: 500,
      cacheCreationTokens: 200,
      cacheReadTokens: 300,
    });

    expect(state.modelUsage["claude-sonnet-4-6"].cacheCreationTokens).toBe(200);
    expect(state.modelUsage["claude-sonnet-4-6"].cacheReadTokens).toBe(300);
  });

  it("returns total tokens across all models", () => {
    let state = createEmptyCostState("s1");
    state = accumulateUsage(state, "claude-sonnet-4-6", {
      inputTokens: 1000,
      outputTokens: 500,
    });
    state = accumulateUsage(state, "claude-haiku-4-5", {
      inputTokens: 2000,
      outputTokens: 1000,
    });

    const totals = getTotalTokens(state);
    expect(totals.input).toBe(3000);
    expect(totals.output).toBe(1500);
    expect(totals.total).toBe(4500);
  });
});

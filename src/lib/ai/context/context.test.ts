import { describe, it, expect, beforeEach } from "vitest";
import { CONTEXT_THRESHOLDS } from "./thresholds";
import {
  estimateTokens,
  estimateMessagesTokens,
  isApproachingThreshold,
  tokensToRemove,
} from "./tokenCount";
import { CompactionCircuitBreaker } from "./circuitBreaker";
import { microCompact } from "./microCompact";

describe("thresholds", () => {
  it("has expected threshold values", () => {
    expect(CONTEXT_THRESHOLDS.WARNING_PCT).toBe(0.8);
    expect(CONTEXT_THRESHOLDS.AUTO_COMPACT_PCT).toBe(0.85);
    expect(CONTEXT_THRESHOLDS.MAX_CONSECUTIVE_FAILURES).toBe(3);
  });
});

describe("tokenCount", () => {
  it("estimates tokens as ceil(chars / 4)", () => {
    expect(estimateTokens("hello")).toBe(2); // ceil(5/4) = 2
    expect(estimateTokens("a".repeat(100))).toBe(25);
  });

  it("estimates message array tokens", () => {
    const messages = [{ role: "user", content: "hello" }];
    const estimate = estimateMessagesTokens(messages);
    expect(estimate).toBeGreaterThan(0);
  });

  it("detects threshold breach", () => {
    expect(isApproachingThreshold(85_000, 100_000, 0.85)).toBe(true);
    expect(isApproachingThreshold(80_000, 100_000, 0.85)).toBe(false);
    expect(isApproachingThreshold(84_999, 100_000, 0.85)).toBe(false);
  });

  it("calculates tokens to remove to reach target", () => {
    // 90K used, max 100K, target 70% → need to remove 20K
    expect(tokensToRemove(90_000, 100_000, 0.7)).toBe(20_000);
    // Already below target → 0
    expect(tokensToRemove(50_000, 100_000, 0.7)).toBe(0);
  });
});

describe("CompactionCircuitBreaker", () => {
  let breaker: CompactionCircuitBreaker;

  beforeEach(() => {
    breaker = new CompactionCircuitBreaker();
  });

  it("starts closed", () => {
    expect(breaker.isOpen()).toBe(false);
    expect(breaker.getFailureCount()).toBe(0);
  });

  it("opens after MAX_CONSECUTIVE_FAILURES failures", () => {
    for (let i = 0; i < CONTEXT_THRESHOLDS.MAX_CONSECUTIVE_FAILURES; i++) {
      expect(breaker.isOpen()).toBe(false);
      breaker.recordFailure();
    }
    expect(breaker.isOpen()).toBe(true);
  });

  it("resets to closed on success", () => {
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordSuccess();
    expect(breaker.isOpen()).toBe(false);
    expect(breaker.getFailureCount()).toBe(0);
  });

  it("includes failure count in error message", () => {
    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.getErrorMessage()).toContain("3");
  });

  it("resets manually", () => {
    breaker.recordFailure();
    breaker.reset();
    expect(breaker.getFailureCount()).toBe(0);
  });
});

describe("microCompact", () => {
  it("returns unchanged messages if nothing to compact", () => {
    const messages = [
      { role: "user", content: "hello" },
      { role: "assistant", content: "hi" },
    ];
    const result = microCompact(messages);
    expect(result.messages).toHaveLength(2);
    expect(result.tokensRemoved).toBe(0);
  });

  it("preserves recent turns (last keepRecentTurns*2 messages)", () => {
    const messages = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `message ${i}`,
    }));
    const result = microCompact(messages, { keepRecentTurns: 4 });
    // Last 8 messages always preserved
    expect(result.messages.slice(-8)).toEqual(messages.slice(-8));
  });

  it("truncates oversized tool results", () => {
    const bigContent = "x".repeat(40_001 * 4); // ~40K tokens
    const messages = [
      { role: "user", content: "run tool" },
      { role: "tool", content: bigContent },
      { role: "user", content: "recent" },
      { role: "assistant", content: "ok" },
    ];
    const result = microCompact(messages, {
      maxToolResultTokens: 10_000,
      keepRecentTurns: 1,
    });
    const toolMsg = result.messages.find((m) => m.role === "tool");
    expect(toolMsg?.content).toContain("[Tool result truncated");
    expect(result.tokensRemoved).toBeGreaterThan(0);
    expect(result.removedItems).toContain("oversized-tool-result");
  });
});

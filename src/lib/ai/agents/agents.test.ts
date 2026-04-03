import { describe, it, expect } from "vitest";
import { getAgentColor, getAllColors } from "./agentColors";
import type { AgentColor } from "./agentColors";
import {
  MAX_AGENT_DEPTH,
  FORK_GUARD_TAG,
  buildSubagentSystemPrompt,
  isRecursionGuarded,
} from "./recursionGuard";
import { getAgentSystemPrompt, isValidAgentType } from "./agentTypes";
import {
  isConcurrencySafe,
  buildToolBatches,
  estimateConcurrencyLevel,
} from "./toolOrchestration";
import type { ToolCall } from "./toolOrchestration";
import { calculateAgentCost, aggregateSummaries } from "./agentSummary";
import type { AgentSummary } from "./agentSummary";

const makeCall = (name: string, id = name): ToolCall => ({
  id,
  name,
  input: {},
});

const makeSummary = (overrides: Partial<AgentSummary> = {}): AgentSummary => ({
  agentId: "agent-1",
  agentType: "researcher",
  task: "Research competitors",
  status: "DONE",
  durationMs: 5000,
  toolCallCount: 3,
  tokenUsage: { inputTokens: 1000, outputTokens: 500 },
  costUsd: 0.01,
  startedAt: new Date(),
  completedAt: new Date(),
  ...overrides,
});

describe("agentColors", () => {
  it("assigns color to new agent", () => {
    const map = new Map<string, AgentColor>();
    const color = getAgentColor("agent-1", map);
    expect(getAllColors()).toContain(color);
  });

  it("returns same color for same agent", () => {
    const map = new Map<string, AgentColor>();
    const c1 = getAgentColor("agent-1", map);
    const c2 = getAgentColor("agent-1", map);
    expect(c1).toBe(c2);
  });

  it("assigns different colors to different agents (round-robin)", () => {
    const map = new Map<string, AgentColor>();
    const colors = Array.from({ length: 10 }, (_, i) =>
      getAgentColor(`agent-${i}`, map),
    );
    // All unique (since there are exactly 10 colors)
    expect(new Set(colors).size).toBe(10);
  });

  it("cycles colors after exhausting all 10", () => {
    const map = new Map<string, AgentColor>();
    const colors = getAllColors();
    for (let i = 0; i < 10; i++) getAgentColor(`agent-${i}`, map);
    // 11th agent wraps around to first color
    const eleventh = getAgentColor("agent-10", map);
    expect(eleventh).toBe(colors[0]);
  });
});

describe("recursionGuard", () => {
  it("MAX_AGENT_DEPTH is 3", () => {
    expect(MAX_AGENT_DEPTH).toBe(3);
  });

  it("adds guard tag when depth >= MAX_AGENT_DEPTH", () => {
    const prompt = buildSubagentSystemPrompt(MAX_AGENT_DEPTH, "base prompt");
    expect(prompt).toContain(FORK_GUARD_TAG);
  });

  it("does not add guard tag below MAX_AGENT_DEPTH", () => {
    const prompt = buildSubagentSystemPrompt(
      MAX_AGENT_DEPTH - 1,
      "base prompt",
    );
    expect(prompt).not.toContain(FORK_GUARD_TAG);
  });

  it("isRecursionGuarded detects guard tag", () => {
    expect(isRecursionGuarded("some prompt " + FORK_GUARD_TAG)).toBe(true);
    expect(isRecursionGuarded("clean prompt")).toBe(false);
  });
});

describe("agentTypes", () => {
  it("returns system prompt for each agent type", () => {
    const types = [
      "researcher",
      "code-reviewer",
      "planner",
      "summarizer",
      "data-analyst",
    ] as const;
    for (const type of types) {
      const prompt = getAgentSystemPrompt(type);
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(20);
    }
  });

  it("isValidAgentType accepts valid types", () => {
    expect(isValidAgentType("researcher")).toBe(true);
    expect(isValidAgentType("planner")).toBe(true);
  });

  it("isValidAgentType rejects invalid types", () => {
    expect(isValidAgentType("janitor")).toBe(false);
    expect(isValidAgentType("")).toBe(false);
  });
});

describe("toolOrchestration", () => {
  describe("isConcurrencySafe", () => {
    it("marks read-only tools as safe", () => {
      expect(isConcurrencySafe("search_web")).toBe(true);
      expect(isConcurrencySafe("fetch_url")).toBe(true);
      expect(isConcurrencySafe("read_file")).toBe(true);
    });

    it("marks write tools as unsafe", () => {
      expect(isConcurrencySafe("execute_python")).toBe(false);
      expect(isConcurrencySafe("write_file")).toBe(false);
      expect(isConcurrencySafe("unknown_tool")).toBe(false);
    });
  });

  describe("buildToolBatches", () => {
    it("returns empty array for no calls", () => {
      expect(buildToolBatches([])).toEqual([]);
    });

    it("groups consecutive concurrent-safe calls into one batch", () => {
      const batches = buildToolBatches([
        makeCall("search_web"),
        makeCall("fetch_url"),
      ]);
      expect(batches).toHaveLength(1);
      expect(batches[0].type).toBe("concurrent");
      if (batches[0].type === "concurrent") {
        expect(batches[0].calls).toHaveLength(2);
      }
    });

    it("serial tool gets its own batch", () => {
      const batches = buildToolBatches([makeCall("execute_python")]);
      expect(batches).toHaveLength(1);
      expect(batches[0].type).toBe("serial");
    });

    it("separates concurrent batches around serial calls", () => {
      const batches = buildToolBatches([
        makeCall("search_web"), // concurrent
        makeCall("fetch_url"), // concurrent
        makeCall("execute_python"), // serial → flushes above
        makeCall("read_file"), // concurrent
      ]);
      expect(batches).toHaveLength(3);
      expect(batches[0].type).toBe("concurrent");
      expect(batches[1].type).toBe("serial");
      expect(batches[2].type).toBe("concurrent");
    });

    it("handles all-serial calls", () => {
      const batches = buildToolBatches([
        makeCall("execute_python", "1"),
        makeCall("execute_python", "2"),
      ]);
      expect(batches).toHaveLength(2);
      expect(batches.every((b) => b.type === "serial")).toBe(true);
    });
  });

  describe("estimateConcurrencyLevel", () => {
    it("returns 0 for all-serial batches", () => {
      const batches = buildToolBatches([makeCall("execute_python")]);
      expect(estimateConcurrencyLevel(batches)).toBe(0);
    });

    it("returns max concurrent calls in any single batch", () => {
      const batches = buildToolBatches([
        makeCall("search_web", "1"),
        makeCall("fetch_url", "2"),
        makeCall("read_file", "3"),
      ]);
      expect(estimateConcurrencyLevel(batches)).toBe(3);
    });
  });
});

describe("agentSummary", () => {
  describe("calculateAgentCost", () => {
    it("calculates cost correctly", () => {
      // 1M input at $3/M + 1M output at $15/M = $18
      const cost = calculateAgentCost({
        tokenUsage: { inputTokens: 1_000_000, outputTokens: 1_000_000 },
      });
      expect(cost).toBeCloseTo(18.0, 2);
    });

    it("returns 0 for zero tokens", () => {
      expect(
        calculateAgentCost({ tokenUsage: { inputTokens: 0, outputTokens: 0 } }),
      ).toBe(0);
    });
  });

  describe("aggregateSummaries", () => {
    it("returns zeros for empty array", () => {
      const agg = aggregateSummaries([]);
      expect(agg.totalCostUsd).toBe(0);
      expect(agg.agentCount).toBe(0);
      expect(agg.totalTokens).toBe(0);
    });

    it("sums cost, tokens, duration, tool calls", () => {
      const summaries = [
        makeSummary({
          costUsd: 0.01,
          toolCallCount: 3,
          durationMs: 1000,
          tokenUsage: { inputTokens: 500, outputTokens: 250 },
        }),
        makeSummary({
          costUsd: 0.02,
          toolCallCount: 5,
          durationMs: 2000,
          tokenUsage: { inputTokens: 1000, outputTokens: 500 },
        }),
      ];
      const agg = aggregateSummaries(summaries);
      expect(agg.totalCostUsd).toBeCloseTo(0.03, 4);
      expect(agg.toolCallCount).toBe(8);
      expect(agg.totalDurationMs).toBe(3000);
      expect(agg.totalTokens).toBe(2250);
      expect(agg.agentCount).toBe(2);
    });

    it("counts statuses", () => {
      const summaries = [
        makeSummary({ status: "DONE" }),
        makeSummary({ status: "DONE" }),
        makeSummary({ status: "BLOCKED" }),
        makeSummary({ status: "NEEDS_CONTEXT" }),
      ];
      const agg = aggregateSummaries(summaries);
      expect(agg.statusCounts.DONE).toBe(2);
      expect(agg.statusCounts.BLOCKED).toBe(1);
      expect(agg.statusCounts.NEEDS_CONTEXT).toBe(1);
      expect(agg.statusCounts.DONE_WITH_CONCERNS).toBe(0);
    });
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { matchRule, isRuleExpired } from "./PermissionRule";
import type { PermissionRule } from "./PermissionRule";
import { assessToolDanger, assessPythonCodeDanger } from "./dangerClassifier";
import { DenialTracker, AUTO_APPROVE_AFTER_DENIALS } from "./denialTracker";

const makeRule = (overrides: Partial<PermissionRule>): PermissionRule => ({
  tool: "execute_python",
  behavior: "allow",
  source: "settings",
  createdAt: new Date(),
  ...overrides,
});

describe("matchRule", () => {
  it("returns null when no rules", () => {
    expect(matchRule([], "execute_python")).toBeNull();
  });

  it("matches exact tool name", () => {
    const rules = [makeRule({ tool: "execute_python", behavior: "allow" })];
    expect(matchRule(rules, "execute_python")?.behavior).toBe("allow");
  });

  it("matches glob pattern", () => {
    const rules = [makeRule({ tool: "execute_*", behavior: "deny" })];
    expect(matchRule(rules, "execute_python")?.behavior).toBe("deny");
    expect(matchRule(rules, "execute_bash")?.behavior).toBe("deny");
    expect(matchRule(rules, "search_web")).toBeNull();
  });

  it("matches wildcard *", () => {
    const rules = [makeRule({ tool: "*", behavior: "ask" })];
    expect(matchRule(rules, "anything")?.behavior).toBe("ask");
    expect(matchRule(rules, "random_tool")?.behavior).toBe("ask");
  });

  it("prefers exact match over glob", () => {
    const rules = [
      makeRule({ tool: "*", behavior: "ask" }),
      makeRule({ tool: "execute_*", behavior: "deny" }),
      makeRule({ tool: "execute_python", behavior: "allow" }),
    ];
    expect(matchRule(rules, "execute_python")?.behavior).toBe("allow");
  });

  it("prefers glob over wildcard", () => {
    const rules = [
      makeRule({ tool: "*", behavior: "ask" }),
      makeRule({ tool: "execute_*", behavior: "deny" }),
    ];
    expect(matchRule(rules, "execute_python")?.behavior).toBe("deny");
  });

  it("ignores expired rules", () => {
    const expiredRule = makeRule({
      tool: "execute_python",
      behavior: "allow",
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(matchRule([expiredRule], "execute_python")).toBeNull();
  });
});

describe("isRuleExpired", () => {
  it("returns false when no expiry", () => {
    expect(isRuleExpired(makeRule({}))).toBe(false);
  });

  it("returns true for past expiry", () => {
    const rule = makeRule({ expiresAt: new Date(Date.now() - 1000) });
    expect(isRuleExpired(rule)).toBe(true);
  });

  it("returns false for future expiry", () => {
    const rule = makeRule({ expiresAt: new Date(Date.now() + 10_000) });
    expect(isRuleExpired(rule)).toBe(false);
  });
});

describe("assessToolDanger", () => {
  it("returns safe for web search tools", () => {
    expect(assessToolDanger("search_web", {}).level).toBe("safe");
    expect(assessToolDanger("fetch_url", {}).level).toBe("safe");
  });

  it("returns high for email tool", () => {
    const assessment = assessToolDanger("send_email", {});
    expect(assessment.level).toBe("high");
    expect(assessment.requiresConfirmation).toBe(true);
  });

  it("returns low for unknown tools", () => {
    expect(assessToolDanger("unknown_tool", {}).level).toBe("low");
  });
});

describe("assessPythonCodeDanger", () => {
  it("returns safe for benign code", () => {
    const assessment = assessPythonCodeDanger(
      'import pandas as pd\ndf = pd.read_csv("data.csv")',
    );
    expect(assessment.level).toBe("safe");
    expect(assessment.requiresConfirmation).toBe(false);
  });

  it("detects file deletion as high danger", () => {
    const assessment = assessPythonCodeDanger(
      'import os\nos.remove("/tmp/file.txt")',
    );
    expect(assessment.level).toBe("high");
    expect(assessment.requiresConfirmation).toBe(true);
    expect(assessment.reasons.some((r) => r.includes("deletion"))).toBe(true);
  });

  it("detects shell execution as medium danger", () => {
    const assessment = assessPythonCodeDanger(
      'import subprocess\nsubprocess.run(["ls"])',
    );
    expect(assessment.level).toBe("medium");
    expect(assessment.requiresConfirmation).toBe(true);
  });

  it("detects network requests as low danger", () => {
    const assessment = assessPythonCodeDanger(
      'import requests\nrequests.get("https://api.example.com")',
    );
    expect(assessment.level).toBe("low");
    expect(assessment.requiresConfirmation).toBe(false);
  });

  it("reports highest level when multiple patterns match", () => {
    // Both shell (medium) and file deletion (high) → high
    const assessment = assessPythonCodeDanger(
      'import subprocess\nos.remove("f")\nsubprocess.run(["x"])',
    );
    expect(assessment.level).toBe("high");
  });

  it("collects all matching reasons", () => {
    const assessment = assessPythonCodeDanger(
      'subprocess.run(["x"])\nrequests.get("url")',
    );
    expect(assessment.reasons.length).toBeGreaterThan(1);
  });
});

describe("DenialTracker", () => {
  let tracker: DenialTracker;

  beforeEach(() => {
    tracker = new DenialTracker();
  });

  it("starts with 0 denials", () => {
    expect(tracker.getDenialCount("execute_python")).toBe(0);
  });

  it("increments denial count", () => {
    tracker.recordDenial("execute_python");
    tracker.recordDenial("execute_python");
    expect(tracker.getDenialCount("execute_python")).toBe(2);
  });

  it("tracks different tools independently", () => {
    tracker.recordDenial("execute_python");
    tracker.recordDenial("send_email");
    tracker.recordDenial("send_email");
    expect(tracker.getDenialCount("execute_python")).toBe(1);
    expect(tracker.getDenialCount("send_email")).toBe(2);
  });

  it(`auto-approves after ${AUTO_APPROVE_AFTER_DENIALS} denials`, () => {
    expect(tracker.shouldAutoApprove("execute_python")).toBe(false);
    for (let i = 0; i < AUTO_APPROVE_AFTER_DENIALS - 1; i++) {
      tracker.recordDenial("execute_python");
      expect(tracker.shouldAutoApprove("execute_python")).toBe(false);
    }
    tracker.recordDenial("execute_python");
    expect(tracker.shouldAutoApprove("execute_python")).toBe(true);
  });

  it("resets a specific tool", () => {
    tracker.recordDenial("execute_python");
    tracker.recordDenial("execute_python");
    tracker.reset("execute_python");
    expect(tracker.getDenialCount("execute_python")).toBe(0);
  });

  it("resets all tools", () => {
    tracker.recordDenial("execute_python");
    tracker.recordDenial("send_email");
    tracker.reset();
    expect(tracker.getDenialCount("execute_python")).toBe(0);
    expect(tracker.getDenialCount("send_email")).toBe(0);
  });

  it("returns all counts", () => {
    tracker.recordDenial("tool_a");
    tracker.recordDenial("tool_b");
    tracker.recordDenial("tool_b");
    const counts = tracker.getAllCounts();
    expect(counts["tool_a"]).toBe(1);
    expect(counts["tool_b"]).toBe(2);
  });
});

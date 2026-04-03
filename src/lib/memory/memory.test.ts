import { describe, it, expect } from "vitest";
import { MEMORY_RECALL_BUDGET } from "./types";
import {
  buildMemoryIndexText,
  selectMemoriesWithinBudget,
  buildMemoryContextBlock,
} from "./recall";
import {
  parseExtractionResponse,
  isValidMemoryName,
  sanitizeMemoryContent,
} from "./autoExtract";
import type { MemoryFile, MemoryIndexEntry } from "./types";

const makeFile = (overrides: Partial<MemoryFile> = {}): MemoryFile => ({
  name: "test.md",
  description: "A test memory",
  type: "user",
  content: "Test content",
  tokenEstimate: 100,
  isPinned: false,
  lastAccessedAt: null,
  accessCount: 0,
  ...overrides,
});

describe("MEMORY_RECALL_BUDGET", () => {
  it("has correct defaults", () => {
    expect(MEMORY_RECALL_BUDGET.MAX_FILES).toBe(5);
    expect(MEMORY_RECALL_BUDGET.MAX_TOKENS_TOTAL).toBe(25_000);
    expect(MEMORY_RECALL_BUDGET.MAX_TOKENS_PER_FILE).toBe(8_000);
    expect(MEMORY_RECALL_BUDGET.INDEX_MAX_LINES).toBe(200);
  });
});

describe("buildMemoryIndexText", () => {
  it('formats entries as "name — description [type]"', () => {
    const entries: MemoryIndexEntry[] = [
      {
        name: "feedback_tdd.md",
        description: "Always write failing test first",
        type: "feedback",
        tokenEstimate: 50,
      },
    ];
    const text = buildMemoryIndexText(entries);
    expect(text).toBe(
      "feedback_tdd.md — Always write failing test first [feedback]",
    );
  });

  it("truncates to INDEX_MAX_LINES", () => {
    const entries: MemoryIndexEntry[] = Array.from({ length: 300 }, (_, i) => ({
      name: `file${i}.md`,
      description: `desc ${i}`,
      type: "user" as const,
      tokenEstimate: 50,
    }));
    const text = buildMemoryIndexText(entries);
    expect(text.split("\n")).toHaveLength(MEMORY_RECALL_BUDGET.INDEX_MAX_LINES);
  });
});

describe("selectMemoriesWithinBudget", () => {
  it("returns empty array when no files and no selected names", () => {
    expect(selectMemoriesWithinBudget([], [])).toEqual([]);
  });

  it("always includes pinned files first", () => {
    const pinned = makeFile({
      name: "pinned.md",
      isPinned: true,
      tokenEstimate: 100,
    });
    const normal = makeFile({
      name: "normal.md",
      isPinned: false,
      tokenEstimate: 100,
    });
    const result = selectMemoriesWithinBudget([normal, pinned], ["normal.md"]);
    expect(result[0].name).toBe("pinned.md");
  });

  it("respects MAX_FILES limit", () => {
    const files = Array.from({ length: 10 }, (_, i) =>
      makeFile({ name: `file${i}.md`, tokenEstimate: 100 }),
    );
    const selectedNames = files.map((f) => f.name);
    const result = selectMemoriesWithinBudget(files, selectedNames);
    expect(result.length).toBeLessThanOrEqual(MEMORY_RECALL_BUDGET.MAX_FILES);
  });

  it("respects MAX_TOKENS_TOTAL budget", () => {
    // Each file costs 9000 tokens — only 2 should fit in 25K budget
    const files = Array.from({ length: 5 }, (_, i) =>
      makeFile({ name: `file${i}.md`, tokenEstimate: 9_000 }),
    );
    const selectedNames = files.map((f) => f.name);
    const result = selectMemoriesWithinBudget(files, selectedNames);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("skips files not in selected names (non-pinned)", () => {
    const files = [
      makeFile({ name: "selected.md" }),
      makeFile({ name: "skipped.md" }),
    ];
    const result = selectMemoriesWithinBudget(files, ["selected.md"]);
    expect(result.map((f) => f.name)).not.toContain("skipped.md");
  });
});

describe("buildMemoryContextBlock", () => {
  it("returns empty string when no files and no notes", () => {
    expect(buildMemoryContextBlock([], [])).toBe("");
  });

  it("wraps content in <memory> tags", () => {
    const files = [
      makeFile({ name: "user_profile.md", content: "Senior engineer" }),
    ];
    const block = buildMemoryContextBlock(files);
    expect(block).toContain("<memory>");
    expect(block).toContain("</memory>");
    expect(block).toContain("user_profile.md");
    expect(block).toContain("Senior engineer");
  });

  it("includes session notes when provided", () => {
    const notes = [{ key: "current_task", value: "Building auth module" }];
    const block = buildMemoryContextBlock([], notes);
    expect(block).toContain("Session Notes");
    expect(block).toContain("current_task: Building auth module");
  });
});

describe("parseExtractionResponse", () => {
  it("parses valid shouldSave=true response", () => {
    const response = JSON.stringify({
      shouldSave: true,
      memories: [
        {
          name: "feedback_test.md",
          description: "desc",
          type: "feedback",
          content: "# Test\nContent",
        },
      ],
    });
    const result = parseExtractionResponse(response);
    expect(result.shouldSave).toBe(true);
    expect(result.memories).toHaveLength(1);
  });

  it("parses shouldSave=false response", () => {
    const result = parseExtractionResponse(
      '{"shouldSave":false,"memories":[]}',
    );
    expect(result.shouldSave).toBe(false);
    expect(result.memories).toHaveLength(0);
  });

  it("handles markdown code fences", () => {
    const response = '```json\n{"shouldSave":false,"memories":[]}\n```';
    const result = parseExtractionResponse(response);
    expect(result.shouldSave).toBe(false);
  });

  it("returns shouldSave=false on invalid JSON", () => {
    const result = parseExtractionResponse("not json at all");
    expect(result.shouldSave).toBe(false);
  });

  it("returns shouldSave=false on missing shouldSave field", () => {
    const result = parseExtractionResponse('{"memories":[]}');
    expect(result.shouldSave).toBe(false);
  });
});

describe("isValidMemoryName", () => {
  it("accepts valid slugs", () => {
    expect(isValidMemoryName("feedback_tdd.md")).toBe(true);
    expect(isValidMemoryName("user-profile.md")).toBe(true);
    expect(isValidMemoryName("project123.md")).toBe(true);
  });

  it("rejects names without .md extension", () => {
    expect(isValidMemoryName("feedback_tdd.txt")).toBe(false);
    expect(isValidMemoryName("feedback_tdd")).toBe(false);
  });

  it("rejects names with uppercase or spaces", () => {
    expect(isValidMemoryName("Feedback_TDD.md")).toBe(false);
    expect(isValidMemoryName("my memory.md")).toBe(false);
  });

  it("rejects names over 100 chars", () => {
    expect(isValidMemoryName("a".repeat(98) + ".md")).toBe(false);
  });
});

describe("sanitizeMemoryContent", () => {
  it("trims whitespace", () => {
    expect(sanitizeMemoryContent("  hello  ")).toBe("hello");
  });

  it("truncates at maxChars", () => {
    const content = "x".repeat(10_000);
    expect(sanitizeMemoryContent(content, 8000)).toHaveLength(8000);
  });

  it("leaves short content untouched", () => {
    expect(sanitizeMemoryContent("short")).toBe("short");
  });
});

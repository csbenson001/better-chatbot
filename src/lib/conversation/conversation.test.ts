import { describe, it, expect } from "vitest";
import {
  titleToSlug,
  buildMarkdownExport,
  buildJsonExport,
  buildHtmlExport,
  getExportFilename,
  getExportMimeType,
} from "./export";
import type { ExportThread } from "./export";
import {
  highlightMatches,
  extractSnippet,
  isValidSearchQuery,
  formatTimeAgo,
} from "./searchUtils";

const makeThread = (overrides: Partial<ExportThread> = {}): ExportThread => ({
  id: "thread-1",
  title: "Q1 Sales Analysis",
  messages: [
    { role: "user", content: "Analyze Q1 revenue" },
    { role: "assistant", content: "Revenue was up 15%" },
  ],
  exportedAt: new Date("2026-01-01T00:00:00Z"),
  ...overrides,
});

describe("titleToSlug", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(titleToSlug("Q1 Sales Analysis")).toBe("q1-sales-analysis");
  });

  it("removes special characters", () => {
    expect(titleToSlug("Revenue: $1M+ (2024)")).toBe("revenue-1m-2024");
  });

  it("collapses multiple hyphens", () => {
    expect(titleToSlug("A  --  B")).toBe("a-b");
  });

  it("trims leading and trailing hyphens", () => {
    expect(titleToSlug("  hello  ")).toBe("hello");
  });

  it("truncates to 60 characters", () => {
    const long = "a".repeat(100);
    expect(titleToSlug(long).length).toBeLessThanOrEqual(60);
  });

  it("returns empty string for special-char-only input", () => {
    expect(titleToSlug("!@#$%")).toBe("");
  });
});

describe("buildMarkdownExport", () => {
  it("starts with thread title as H1", () => {
    const md = buildMarkdownExport(makeThread());
    expect(md).toMatch(/^# Q1 Sales Analysis/);
  });

  it("includes user and assistant messages with labels", () => {
    const md = buildMarkdownExport(makeThread());
    expect(md).toContain("## You");
    expect(md).toContain("## Assistant");
    expect(md).toContain("Analyze Q1 revenue");
    expect(md).toContain("Revenue was up 15%");
  });

  it("filters out system messages", () => {
    const thread = makeThread({
      messages: [
        { role: "system", content: "You are a helpful assistant" },
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi" },
      ],
    });
    const md = buildMarkdownExport(thread);
    expect(md).not.toContain("You are a helpful assistant");
  });

  it("includes exported timestamp", () => {
    const md = buildMarkdownExport(makeThread());
    expect(md).toContain("2026-01-01");
  });
});

describe("buildJsonExport", () => {
  it("returns an object with id, title, messages", () => {
    const json = buildJsonExport(makeThread()) as any;
    expect(json.id).toBe("thread-1");
    expect(json.title).toBe("Q1 Sales Analysis");
    expect(Array.isArray(json.messages)).toBe(true);
  });

  it("includes messageCount of non-system messages", () => {
    const thread = makeThread({
      messages: [
        { role: "system", content: "sys" },
        { role: "user", content: "hello" },
        { role: "assistant", content: "hi" },
      ],
    });
    const json = buildJsonExport(thread) as any;
    expect(json.messageCount).toBe(2);
  });

  it("filters system messages from output", () => {
    const thread = makeThread({
      messages: [{ role: "system", content: "secret system prompt" }],
    });
    const json = buildJsonExport(thread) as any;
    expect(json.messages).toHaveLength(0);
  });
});

describe("buildHtmlExport", () => {
  it("is valid HTML with DOCTYPE", () => {
    const html = buildHtmlExport(makeThread());
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });

  it("includes thread title in <title> and <h1>", () => {
    const html = buildHtmlExport(makeThread());
    expect(html).toContain("<title>Q1 Sales Analysis</title>");
    expect(html).toContain("<h1>Q1 Sales Analysis</h1>");
  });

  it("escapes HTML special characters in message content", () => {
    const thread = makeThread({
      messages: [{ role: "user", content: '<script>alert("xss")</script>' }],
    });
    const html = buildHtmlExport(thread);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("filters system messages", () => {
    const thread = makeThread({
      messages: [
        { role: "system", content: "secret" },
        { role: "user", content: "hello" },
      ],
    });
    const html = buildHtmlExport(thread);
    expect(html).not.toContain("secret");
    expect(html).toContain("hello");
  });
});

describe("getExportFilename", () => {
  it("returns slug.md for markdown", () => {
    expect(getExportFilename(makeThread(), "markdown")).toBe(
      "q1-sales-analysis.md",
    );
  });

  it("returns slug.json for json", () => {
    expect(getExportFilename(makeThread(), "json")).toBe(
      "q1-sales-analysis.json",
    );
  });

  it("returns slug.html for html", () => {
    expect(getExportFilename(makeThread(), "html")).toBe(
      "q1-sales-analysis.html",
    );
  });

  it('falls back to "conversation" for empty slug', () => {
    const thread = makeThread({ title: "!!!" });
    expect(getExportFilename(thread, "json")).toBe("conversation.json");
  });
});

describe("getExportMimeType", () => {
  it("returns correct MIME type for each format", () => {
    expect(getExportMimeType("markdown")).toBe("text/markdown");
    expect(getExportMimeType("json")).toBe("application/json");
    expect(getExportMimeType("html")).toBe("text/html");
  });
});

describe("highlightMatches", () => {
  it("wraps matching terms in <mark> tags", () => {
    const result = highlightMatches("Hello world", "world");
    expect(result).toContain("<mark>world</mark>");
  });

  it("is case-insensitive", () => {
    const result = highlightMatches("Hello World", "world");
    expect(result).toContain("<mark>World</mark>");
  });

  it("highlights multiple terms", () => {
    const result = highlightMatches("foo and bar", "foo bar");
    expect(result).toContain("<mark>foo</mark>");
    expect(result).toContain("<mark>bar</mark>");
  });

  it("returns text unchanged for empty query", () => {
    expect(highlightMatches("hello", "")).toBe("hello");
  });
});

describe("extractSnippet", () => {
  it("returns first N chars when no match", () => {
    const snippet = extractSnippet("hello world", "xyz", 5);
    expect(snippet).toBe("hello");
  });

  it("centers snippet around first match", () => {
    const text = "a".repeat(50) + "TARGET" + "b".repeat(50);
    const snippet = extractSnippet(text, "TARGET");
    expect(snippet).toContain("TARGET");
  });

  it("returns short text without truncation markers", () => {
    const snippet = extractSnippet("hello", "hello", 150);
    expect(snippet).toBe("hello");
  });
});

describe("isValidSearchQuery", () => {
  it("accepts query of minLength or more", () => {
    expect(isValidSearchQuery("ab")).toBe(true);
    expect(isValidSearchQuery("hello")).toBe(true);
  });

  it("rejects too-short queries", () => {
    expect(isValidSearchQuery("")).toBe(false);
    expect(isValidSearchQuery("a")).toBe(false);
  });

  it("trims before checking length", () => {
    expect(isValidSearchQuery("  a  ")).toBe(false);
    expect(isValidSearchQuery("  ab  ")).toBe(true);
  });
});

describe("formatTimeAgo", () => {
  it('returns "just now" for very recent', () => {
    expect(formatTimeAgo(new Date())).toBe("just now");
  });

  it("returns minutes for < 1h", () => {
    expect(formatTimeAgo(new Date(Date.now() - 5 * 60 * 1000))).toBe("5m ago");
  });

  it("returns hours for < 1d", () => {
    expect(formatTimeAgo(new Date(Date.now() - 3 * 60 * 60 * 1000))).toBe(
      "3h ago",
    );
  });

  it("returns days for < 1mo", () => {
    expect(formatTimeAgo(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000))).toBe(
      "10d ago",
    );
  });
});

import { describe, it, expect } from "vitest";
import { extractDomain, MockSearchProvider } from "./searchProvider";
import type { SearchResult } from "./searchProvider";
import {
  formatSearchResults,
  truncateToTokenBudget,
  formatCitationList,
} from "./formatResults";
import { extractCitationIndices, filterCitedResults } from "./citations";

const makeResult = (overrides: Partial<SearchResult> = {}): SearchResult => ({
  title: "Test Result",
  url: "https://example.com/page",
  snippet: "This is a test snippet.",
  domain: "example.com",
  ...overrides,
});

describe("extractDomain", () => {
  it("extracts domain from https URL", () => {
    expect(extractDomain("https://www.example.com/path")).toBe("example.com");
  });

  it("strips www. prefix", () => {
    expect(extractDomain("https://www.bbc.co.uk/news")).toBe("bbc.co.uk");
  });

  it("handles invalid URL gracefully", () => {
    expect(extractDomain("not-a-url")).toBe("not-a-url");
  });
});

describe("MockSearchProvider", () => {
  it("returns provided results", async () => {
    const results = [
      makeResult({ title: "Result 1" }),
      makeResult({ title: "Result 2" }),
    ];
    const provider = new MockSearchProvider(results);
    const found = await provider.search("test");
    expect(found).toHaveLength(2);
    expect(found[0].title).toBe("Result 1");
  });

  it("respects numResults limit", async () => {
    const results = Array.from({ length: 10 }, (_, i) =>
      makeResult({ title: `R${i}` }),
    );
    const provider = new MockSearchProvider(results);
    const found = await provider.search("test", { numResults: 3 });
    expect(found).toHaveLength(3);
  });

  it("returns empty array when no results configured", async () => {
    const provider = new MockSearchProvider();
    const found = await provider.search("test");
    expect(found).toEqual([]);
  });
});

describe("formatSearchResults", () => {
  it("wraps in <search_results> tags", () => {
    const results = [makeResult()];
    const xml = formatSearchResults(results);
    expect(xml).toContain("<search_results>");
    expect(xml).toContain("</search_results>");
  });

  it("numbers results starting from 1", () => {
    const results = [makeResult(), makeResult()];
    const xml = formatSearchResults(results);
    expect(xml).toContain('index="1"');
    expect(xml).toContain('index="2"');
  });

  it("includes title, url, domain, snippet", () => {
    const result = makeResult({
      title: "My Article",
      url: "https://news.example.com/article",
      snippet: "Summary here.",
      domain: "news.example.com",
    });
    const xml = formatSearchResults([result]);
    expect(xml).toContain("My Article");
    expect(xml).toContain("https://news.example.com/article");
    expect(xml).toContain("news.example.com");
    expect(xml).toContain("Summary here.");
  });

  it("includes published date when present", () => {
    const result = makeResult({ publishedAt: new Date("2024-01-15") });
    const xml = formatSearchResults([result]);
    expect(xml).toContain("<published>");
    expect(xml).toContain("2024-01-15");
  });

  it("omits published tag when absent", () => {
    const result = makeResult({ publishedAt: undefined });
    const xml = formatSearchResults([result]);
    expect(xml).not.toContain("<published>");
  });

  it("returns no_results element for empty array", () => {
    const xml = formatSearchResults([]);
    expect(xml).toContain("<no_results");
  });

  it("escapes XML special characters in title", () => {
    const result = makeResult({ title: "A & B < C > D" });
    const xml = formatSearchResults([result]);
    expect(xml).toContain("A &amp; B &lt; C &gt; D");
    expect(xml).not.toContain("A & B < C > D");
  });

  it("includes citation instructions", () => {
    const xml = formatSearchResults([makeResult()]);
    expect(xml).toContain("[N] notation");
  });
});

describe("truncateToTokenBudget", () => {
  it("returns text unchanged if under budget", () => {
    expect(truncateToTokenBudget("hello", 100)).toBe("hello");
  });

  it("truncates and appends truncation notice at token limit", () => {
    const longText = "a".repeat(1000);
    const result = truncateToTokenBudget(longText, 100); // 100 tokens = 400 chars
    expect(result.length).toBeLessThan(1000);
    expect(result).toContain("[... truncated]");
  });
});

describe("formatCitationList", () => {
  it("formats numbered citations", () => {
    const results = [
      makeResult({
        title: "Article One",
        domain: "one.com",
        url: "https://one.com",
      }),
      makeResult({
        title: "Article Two",
        domain: "two.com",
        url: "https://two.com",
      }),
    ];
    const list = formatCitationList(results);
    expect(list).toContain("[1] Article One — one.com");
    expect(list).toContain("[2] Article Two — two.com");
  });
});

describe("extractCitationIndices", () => {
  it("extracts citation indices from text", () => {
    const text = "According to [1], the price is $4.12/lb [2]. See also [3].";
    expect(extractCitationIndices(text)).toEqual([1, 2, 3]);
  });

  it("deduplicates indices", () => {
    expect(extractCitationIndices("[1] and [1] again")).toEqual([1]);
  });

  it("returns sorted indices", () => {
    expect(extractCitationIndices("[3] and [1] and [2]")).toEqual([1, 2, 3]);
  });

  it("returns empty array when no citations", () => {
    expect(extractCitationIndices("no citations here")).toEqual([]);
  });
});

describe("filterCitedResults", () => {
  const results = [
    makeResult({ title: "R1" }),
    makeResult({ title: "R2" }),
    makeResult({ title: "R3" }),
  ];

  it("returns only cited results", () => {
    const cited = filterCitedResults(results, [1, 3]);
    expect(cited.map((r) => r.title)).toEqual(["R1", "R3"]);
  });

  it("ignores out-of-range indices", () => {
    const cited = filterCitedResults(results, [0, 99]);
    expect(cited).toHaveLength(0);
  });

  it("returns empty array for empty indices", () => {
    expect(filterCitedResults(results, [])).toEqual([]);
  });
});

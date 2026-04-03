import type { SearchResult } from "./searchProvider";

// Extract citation indices that appear in a text (e.g. [1], [2], [3])
export function extractCitationIndices(text: string): number[] {
  const matches = text.matchAll(/\[(\d+)\]/g);
  const indices = new Set<number>();
  for (const match of matches) {
    const n = parseInt(match[1], 10);
    if (n > 0) indices.add(n);
  }
  return Array.from(indices).sort((a, b) => a - b);
}

// Filter search results to only those that were actually cited
export function filterCitedResults(
  results: SearchResult[],
  citedIndices: number[],
): SearchResult[] {
  return citedIndices
    .filter((i) => i >= 1 && i <= results.length)
    .map((i) => results[i - 1]);
}

import type { SearchResult } from "./searchProvider";

// Format results as XML for injection into AI context
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0)
    return "<search_results>\n<no_results />\n</search_results>";

  const items = results
    .map(
      (r, i) => `<result index="${i + 1}">
  <title>${escapeXml(r.title)}</title>
  <url>${escapeXml(r.url)}</url>
  <domain>${escapeXml(r.domain)}</domain>${r.publishedAt ? `\n  <published>${r.publishedAt.toISOString()}</published>` : ""}
  <snippet>${escapeXml(r.snippet)}</snippet>
</result>`,
    )
    .join("\n");

  return `<search_results>\n${items}\n</search_results>\n\nUse the above results to answer the user's question. Cite sources with [N] notation (e.g. [1], [2]).`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Truncate content to approximate token budget (1 token ≈ 4 chars)
export function truncateToTokenBudget(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "\n[... truncated]";
}

// Format citation reference for end of AI response
export function formatCitationList(results: SearchResult[]): string {
  return results
    .map((r, i) => `[${i + 1}] ${r.title} — ${r.domain} (${r.url})`)
    .join("\n");
}

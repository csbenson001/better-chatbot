// Client-side search helpers (full-text search lives in DB, these help format/highlight results)

// Highlight matching query terms in text with <mark> tags
export function highlightMatches(text: string, query: string): string {
  if (!query.trim()) return text;
  const terms = query.trim().split(/\s+/).filter(Boolean);
  let result = text;
  for (const term of terms) {
    const regex = new RegExp(`(${escapeRegex(term)})`, "gi");
    result = result.replace(regex, "<mark>$1</mark>");
  }
  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Extract a short snippet around the first match in text
export function extractSnippet(
  text: string,
  query: string,
  snippetLength = 150,
): string {
  if (!query.trim() || !text) return text.slice(0, snippetLength);
  const term = query.trim().split(/\s+/)[0];
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text.slice(0, snippetLength);
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, start + snippetLength);
  const snippet = text.slice(start, end);
  return (start > 0 ? "..." : "") + snippet + (end < text.length ? "..." : "");
}

// Validate that a search query is worth sending (not empty/too short)
export function isValidSearchQuery(query: string, minLength = 2): boolean {
  return query.trim().length >= minLength;
}

// Format a relative "time ago" string for search results
export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

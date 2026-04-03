import type { MemoryIndexEntry, MemoryFile } from "./types";
import { MEMORY_RECALL_BUDGET } from "./types";

// Build a compact index string for the AI selector
// Format: "filename.md — description (type)"
// Truncated to INDEX_MAX_LINES to keep selector prompt small
export function buildMemoryIndexText(entries: MemoryIndexEntry[]): string {
  return entries
    .slice(0, MEMORY_RECALL_BUDGET.INDEX_MAX_LINES)
    .map((e) => `${e.name} — ${e.description} [${e.type}]`)
    .join("\n");
}

// Select memories that fit within the token budget
// Pinned memories are always included first (up to MAX_FILES)
// Remaining slots filled by selected names in order given
export function selectMemoriesWithinBudget(
  allFiles: MemoryFile[],
  selectedNames: string[],
): MemoryFile[] {
  const pinned = allFiles.filter((f) => f.isPinned);
  const selectedNonPinned = selectedNames
    .map((name) => allFiles.find((f) => f.name === name && !f.isPinned))
    .filter((f): f is MemoryFile => f !== undefined);

  const candidates = [...pinned, ...selectedNonPinned];
  const result: MemoryFile[] = [];
  let totalTokens = 0;

  for (const file of candidates) {
    if (result.length >= MEMORY_RECALL_BUDGET.MAX_FILES) break;
    if (
      totalTokens + file.tokenEstimate >
      MEMORY_RECALL_BUDGET.MAX_TOKENS_TOTAL
    )
      continue;
    result.push(file);
    totalTokens += file.tokenEstimate;
  }

  return result;
}

// Format selected memories for injection into system prompt
export function buildMemoryContextBlock(
  files: MemoryFile[],
  sessionNotes: Array<{ key: string; value: string }> = [],
): string {
  if (files.length === 0 && sessionNotes.length === 0) return "";

  const parts: string[] = ["<memory>"];

  for (const file of files) {
    parts.push(`### ${file.name}\n${file.content}`);
  }

  if (sessionNotes.length > 0) {
    parts.push("### Session Notes");
    parts.push(sessionNotes.map((n) => `- ${n.key}: ${n.value}`).join("\n"));
  }

  parts.push("</memory>");
  return parts.join("\n\n");
}

export type MemoryType = "user" | "feedback" | "project" | "reference";

export interface MemoryIndexEntry {
  name: string; // filename slug: "feedback_tdd.md"
  description: string; // one-liner for selector
  type: MemoryType;
  tokenEstimate: number;
}

export interface MemoryFile {
  name: string;
  description: string;
  type: MemoryType;
  content: string;
  tokenEstimate: number;
  isPinned: boolean;
  lastAccessedAt: Date | null;
  accessCount: number;
}

export const MEMORY_RECALL_BUDGET = {
  MAX_FILES: 5,
  MAX_TOKENS_TOTAL: 25_000,
  MAX_TOKENS_PER_FILE: 8_000,
  INDEX_MAX_LINES: 200,
} as const;

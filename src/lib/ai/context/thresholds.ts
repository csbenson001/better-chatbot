export const CONTEXT_THRESHOLDS = {
  WARNING_PCT: 0.8,
  AUTO_COMPACT_PCT: 0.85,
  MAX_CONSECUTIVE_FAILURES: 3,
  POST_COMPACT_SKILLS_BUDGET_TOKENS: 25_000,
  POST_COMPACT_MAX_FILES: 5,
  POST_COMPACT_MAX_FILE_TOKENS: 5_000,
} as const;

export type CompactionTrigger = "threshold" | "error" | "media_size" | "manual";
export type CompactionMode = "full" | "micro" | "reactive";

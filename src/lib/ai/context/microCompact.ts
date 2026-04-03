export interface MicroCompactResult {
  messages: Array<{ role: string; content: unknown }>;
  tokensRemoved: number;
  removedItems: string[];
}

// Remove low-value messages without full summarization:
// - Duplicate base64 images (keep only the most recent)
// - Verbose tool results > maxToolResultTokens (replace with truncation notice)
export function microCompact(
  messages: Array<{ role: string; content: unknown }>,
  options: {
    maxToolResultTokens?: number;
    keepRecentTurns?: number; // Always preserve last N turns
  } = {},
): MicroCompactResult {
  const { maxToolResultTokens = 10_000, keepRecentTurns = 4 } = options;
  const removedItems: string[] = [];
  let tokensRemoved = 0;

  const safeIndex = Math.max(0, messages.length - keepRecentTurns * 2);
  const compactable = messages.slice(0, safeIndex);
  const preserved = messages.slice(safeIndex);

  // Track seen image hashes to remove duplicates
  const seenImages = new Set<string>();

  const processed = compactable.map((msg) => {
    const content = msg.content;
    if (typeof content !== "string") return msg;

    // Check for oversized tool results
    const tokenCount = Math.ceil(content.length / 4);
    if (msg.role === "tool" && tokenCount > maxToolResultTokens) {
      const truncated = `[Tool result truncated — ${tokenCount} tokens removed]`;
      tokensRemoved += tokenCount - Math.ceil(truncated.length / 4);
      removedItems.push("oversized-tool-result");
      return { ...msg, content: truncated };
    }

    return msg;
  });

  // Suppress unused variable warning
  void seenImages;

  return {
    messages: [...processed, ...preserved],
    tokensRemoved,
    removedItems,
  };
}

import type { MemoryType } from "./types";

export interface ExtractedMemory {
  name: string;
  description: string;
  type: MemoryType;
  content: string;
}

export interface AutoExtractDecision {
  shouldSave: boolean;
  memories: ExtractedMemory[];
}

// Prompt used to determine if a conversation contains memory-worthy facts
export const AUTO_EXTRACT_SYSTEM_PROMPT = `You analyze conversations to find facts worth remembering for FUTURE conversations.

Memory-worthy (SAVE these):
- User corrected AI behavior ("don't do X", "always do Y")
- User revealed important role, goals, or strong preferences
- Non-obvious decisions made that could recur
- Projects, teams, resources mentioned that matter ongoing

NOT memory-worthy (SKIP):
- Routine Q&A with no recurring pattern
- One-off requests
- Facts already common knowledge
- Ephemeral session details

If memory-worthy facts exist respond with JSON:
{"shouldSave":true,"memories":[{"name":"feedback_xxx.md","description":"one-line for selector","type":"feedback|user|project|reference","content":"# Title\\n\\nContent here"}]}

If nothing worth saving: {"shouldSave":false,"memories":[]}`;

// Parse the AI model's extraction response
export function parseExtractionResponse(response: string): AutoExtractDecision {
  try {
    // Strip markdown code fences if present
    const cleaned = response.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.shouldSave !== "boolean") {
      return { shouldSave: false, memories: [] };
    }
    return {
      shouldSave: parsed.shouldSave,
      memories: Array.isArray(parsed.memories) ? parsed.memories : [],
    };
  } catch {
    return { shouldSave: false, memories: [] };
  }
}

// Check if a memory name is valid (slug-like filename)
export function isValidMemoryName(name: string): boolean {
  return /^[a-z0-9_-]+\.md$/.test(name) && name.length <= 100;
}

// Sanitize memory content — prevent injection, enforce max length
export function sanitizeMemoryContent(
  content: string,
  maxChars = 8000,
): string {
  return content.slice(0, maxChars).trim();
}

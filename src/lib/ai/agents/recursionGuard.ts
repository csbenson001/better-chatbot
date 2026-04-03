export const MAX_AGENT_DEPTH = 3;
export const FORK_GUARD_TAG = "<!-- fork-child: cannot spawn subagents -->";

export function buildSubagentSystemPrompt(
  depth: number,
  basePrompt: string,
): string {
  if (depth >= MAX_AGENT_DEPTH) {
    return basePrompt + "\n\n" + FORK_GUARD_TAG;
  }
  return basePrompt;
}

export function isRecursionGuarded(systemPrompt: string): boolean {
  return systemPrompt.includes(FORK_GUARD_TAG);
}

export function getMaxDepth(): number {
  return MAX_AGENT_DEPTH;
}

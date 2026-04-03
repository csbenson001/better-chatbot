const AGENT_COLORS = [
  "blue",
  "green",
  "purple",
  "orange",
  "pink",
  "teal",
  "yellow",
  "red",
  "indigo",
  "cyan",
] as const;

export type AgentColor = (typeof AGENT_COLORS)[number];

// Deterministic: same agentId always gets same color within a session
// Uses simple round-robin based on current map size
export function getAgentColor(
  agentId: string,
  sessionColorMap: Map<string, AgentColor>,
): AgentColor {
  if (sessionColorMap.has(agentId)) return sessionColorMap.get(agentId)!;
  const color = AGENT_COLORS[sessionColorMap.size % AGENT_COLORS.length];
  sessionColorMap.set(agentId, color);
  return color;
}

export function getAllColors(): readonly AgentColor[] {
  return AGENT_COLORS;
}

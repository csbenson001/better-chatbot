export type RuleBehavior = "allow" | "ask" | "deny";
export type RuleSource = "settings" | "session" | "hook" | "cli";

export interface PermissionRule {
  tool: string; // exact name, glob, or '*'
  behavior: RuleBehavior;
  source: RuleSource;
  reason?: string;
  createdAt: Date;
  expiresAt?: Date;
}

// Glob matching: '*' wildcard matches any segment
function matchGlob(pattern: string, value: string): boolean {
  if (pattern === "*") return true;
  if (!pattern.includes("*")) return pattern === value;
  const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
  return regex.test(value);
}

// Find the most specific matching rule for a tool name
// Priority: exact match > glob > wildcard '*'
export function matchRule(
  rules: PermissionRule[],
  toolName: string,
): PermissionRule | null {
  // Check if rule is expired
  const isActive = (r: PermissionRule) =>
    !r.expiresAt || r.expiresAt > new Date();

  const active = rules.filter(isActive);

  // Exact match
  const exact = active.find((r) => r.tool === toolName);
  if (exact) return exact;

  // Glob match (excluding wildcard)
  const glob = active.find(
    (r) =>
      r.tool !== "*" && r.tool.includes("*") && matchGlob(r.tool, toolName),
  );
  if (glob) return glob;

  // Wildcard
  return active.find((r) => r.tool === "*") ?? null;
}

export function isRuleExpired(rule: PermissionRule): boolean {
  return !!rule.expiresAt && rule.expiresAt <= new Date();
}

export type DangerLevel = "safe" | "low" | "medium" | "high" | "critical";

export interface DangerAssessment {
  level: DangerLevel;
  reasons: string[];
  requiresConfirmation: boolean;
}

const DANGER_PATTERNS: Array<{
  pattern: RegExp;
  reason: string;
  level: DangerLevel;
}> = [
  {
    pattern: /os\.remove|shutil\.rmtree|os\.unlink/,
    reason: "Contains file deletion operations",
    level: "high",
  },
  {
    pattern: /subprocess|os\.system|os\.popen/,
    reason: "Contains shell command execution",
    level: "medium",
  },
  {
    pattern: /requests\.|urllib\.|httpx\./,
    reason: "Makes external network requests",
    level: "low",
  },
  {
    pattern: /open\([^)]+['"]\s*,\s*['"]w/,
    reason: "Writes to filesystem",
    level: "low",
  },
  {
    pattern: /smtplib|sendmail|send_message/,
    reason: "Sends email",
    level: "high",
  },
  {
    pattern: /boto3|S3Client|gcs|azure\.storage/,
    reason: "Accesses cloud storage",
    level: "medium",
  },
];

function levelToNumber(level: DangerLevel): number {
  return { safe: 0, low: 1, medium: 2, high: 3, critical: 4 }[level];
}

function highestLevel(levels: DangerLevel[]): DangerLevel {
  if (levels.length === 0) return "safe";
  return levels.reduce(
    (max, l) => (levelToNumber(l) > levelToNumber(max) ? l : max),
    "safe" as DangerLevel,
  );
}

export function assessPythonCodeDanger(code: string): DangerAssessment {
  const matched = DANGER_PATTERNS.filter(({ pattern }) => pattern.test(code));
  const reasons = matched.map((m) => m.reason);
  const level = highestLevel(matched.map((m) => m.level));
  return {
    level,
    reasons,
    requiresConfirmation: levelToNumber(level) >= levelToNumber("medium"),
  };
}

export function assessToolDanger(
  toolName: string,
  input: unknown,
): DangerAssessment {
  if (toolName === "execute_python") {
    const code = (input as { code?: string })?.code ?? "";
    return assessPythonCodeDanger(code);
  }
  if (toolName === "send_email" || toolName === "gmail_send") {
    return {
      level: "high",
      reasons: ["Sends external email"],
      requiresConfirmation: true,
    };
  }
  if (toolName === "search_web" || toolName === "fetch_url") {
    return { level: "safe", reasons: [], requiresConfirmation: false };
  }
  // Unknown tools: low danger, no confirmation needed
  return { level: "low", reasons: [], requiresConfirmation: false };
}

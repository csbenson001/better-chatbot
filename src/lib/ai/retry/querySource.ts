export type QuerySource =
  | "user"
  | "compact"
  | "subagent"
  | "memory-extract"
  | "session-title"
  | "session-memory"
  | "project-memory"
  | "classifier";

export function isUserBlocking(source: QuerySource): boolean {
  return ["user", "compact", "subagent"].includes(source);
}

export function shouldRetryOn529(source: QuerySource): boolean {
  return isUserBlocking(source);
}

export function shouldRetryOn429(source: QuerySource): boolean {
  return isUserBlocking(source);
}

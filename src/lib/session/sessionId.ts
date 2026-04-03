import { randomUUID } from "node:crypto";

export interface SessionMetadata {
  id: string;
  parentId?: string;
  threadId: string;
  userId: string;
  createdAt: Date;
  lastActiveAt: Date;
  model: string;
  isEphemeral: boolean;
}

export function generateSessionId(): string {
  return randomUUID();
}

export function isSessionStale(
  lastActiveAt: Date,
  thresholdMinutes = 30,
): boolean {
  const msSince = Date.now() - lastActiveAt.getTime();
  return msSince > thresholdMinutes * 60 * 1000;
}

export function buildResumeSystemMessage(
  lastActiveAt: Date,
  lastMessagePreview: string,
  pendingWork?: string,
): string {
  const minutesSince = Math.round(
    (Date.now() - lastActiveAt.getTime()) / 60000,
  );
  const timeStr =
    minutesSince < 60
      ? `${minutesSince} minutes`
      : `${Math.round(minutesSince / 60)} hours`;

  return [
    `[SESSION RESUMED — ${timeStr} since last active]`,
    `Last activity: "${lastMessagePreview.slice(0, 100)}..."`,
    pendingWork ? `In-progress work noted: ${pendingWork}` : "",
    `Continue from where we left off.`,
  ]
    .filter(Boolean)
    .join("\n");
}

import { CONTEXT_THRESHOLDS } from "./thresholds";

export class CompactionCircuitBreaker {
  private consecutiveFailures = 0;

  recordFailure(): void {
    this.consecutiveFailures++;
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }

  isOpen(): boolean {
    return (
      this.consecutiveFailures >= CONTEXT_THRESHOLDS.MAX_CONSECUTIVE_FAILURES
    );
  }

  getFailureCount(): number {
    return this.consecutiveFailures;
  }

  getErrorMessage(): string {
    return (
      `Context window is full and compaction failed after ${this.consecutiveFailures} attempts. ` +
      `Please start a new conversation.`
    );
  }

  reset(): void {
    this.consecutiveFailures = 0;
  }
}

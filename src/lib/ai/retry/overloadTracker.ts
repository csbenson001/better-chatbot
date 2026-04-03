export const MAX_CONSECUTIVE_OVERLOAD = 3;

export class ConsecutiveOverloadTracker {
  private count = 0;

  preSeed(failures: number): void {
    this.count = failures;
  }

  recordSuccess(): void {
    this.count = 0;
  }

  recordFailure(): void {
    this.count++;
  }

  shouldFallbackToNonStreaming(): boolean {
    return this.count >= 1;
  }

  shouldAbort(): boolean {
    return this.count >= MAX_CONSECUTIVE_OVERLOAD;
  }

  getCount(): number {
    return this.count;
  }
}

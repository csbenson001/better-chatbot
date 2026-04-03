export const AUTO_APPROVE_AFTER_DENIALS = 3;

export class DenialTracker {
  private denials = new Map<string, number>();

  recordDenial(toolName: string): void {
    const current = this.denials.get(toolName) ?? 0;
    this.denials.set(toolName, current + 1);
  }

  // Counter-intuitive: after N denials, start auto-approving to prevent dialog fatigue
  // Early denials are the real safety signal; continued denial is user fatigue
  shouldAutoApprove(toolName: string): boolean {
    return (this.denials.get(toolName) ?? 0) >= AUTO_APPROVE_AFTER_DENIALS;
  }

  getDenialCount(toolName: string): number {
    return this.denials.get(toolName) ?? 0;
  }

  reset(toolName?: string): void {
    if (toolName) {
      this.denials.delete(toolName);
    } else {
      this.denials.clear();
    }
  }

  getAllCounts(): Record<string, number> {
    return Object.fromEntries(this.denials.entries());
  }
}

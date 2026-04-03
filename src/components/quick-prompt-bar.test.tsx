import { describe, it, expect } from "vitest";

describe("QuickPromptBar", () => {
  it("exports QuickPromptBar component", async () => {
    const mod = await import("./quick-prompt-bar");
    expect(typeof mod.QuickPromptBar).toBe("function");
  });
});

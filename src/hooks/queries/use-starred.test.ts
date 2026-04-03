import { describe, it, expect } from "vitest";

describe("useStarred", () => {
  it("exports useStarred function", async () => {
    const mod = await import("./use-starred");
    expect(typeof mod.useStarred).toBe("function");
  });
});

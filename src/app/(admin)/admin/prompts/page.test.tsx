import { describe, it, expect } from "vitest";

describe("/admin/prompts page", () => {
  it("exports a default component", async () => {
    const mod = await import("./page");
    expect(typeof mod.default).toBe("function");
  });
});

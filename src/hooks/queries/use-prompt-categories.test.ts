import { describe, it, expect } from "vitest";

describe("usePromptCategories", () => {
  it("exports usePromptCategories function", async () => {
    const mod = await import("./use-prompt-categories");
    expect(typeof mod.usePromptCategories).toBe("function");
  });

  it("exports useAdminPromptCategories function", async () => {
    const mod = await import("./use-prompt-categories");
    expect(typeof mod.useAdminPromptCategories).toBe("function");
  });
});

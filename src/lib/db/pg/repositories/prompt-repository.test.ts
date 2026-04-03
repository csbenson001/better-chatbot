import { describe, it, expect } from "vitest";

describe("PromptCategory and PromptItem schema tables", () => {
  it("PromptCategoryTable is defined in schema", async () => {
    const schema = await import("../schema.pg");
    expect(schema.PromptCategoryTable).toBeDefined();
  });

  it("PromptItemTable is defined in schema", async () => {
    const schema = await import("../schema.pg");
    expect(schema.PromptItemTable).toBeDefined();
  });
});

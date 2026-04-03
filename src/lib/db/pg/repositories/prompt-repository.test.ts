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

describe("pgPromptRepository", () => {
  it("exports pgPromptRepository with all required methods", async () => {
    const mod = await import("./prompt-repository.pg");
    const repo = mod.pgPromptRepository;
    expect(typeof repo.selectEnabledCategories).toBe("function");
    expect(typeof repo.selectAllCategories).toBe("function");
    expect(typeof repo.insertCategory).toBe("function");
    expect(typeof repo.updateCategory).toBe("function");
    expect(typeof repo.deleteCategory).toBe("function");
    expect(typeof repo.selectItemsByCategory).toBe("function");
    expect(typeof repo.insertItem).toBe("function");
    expect(typeof repo.updateItem).toBe("function");
    expect(typeof repo.deleteItem).toBe("function");
    expect(typeof repo.reorderItems).toBe("function");
  });
});

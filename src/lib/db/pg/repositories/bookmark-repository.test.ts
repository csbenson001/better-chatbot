import { describe, it, expect } from "vitest";
import { BookmarkTable } from "../schema.pg";
import { pgBookmarkRepository } from "./bookmark-repository.pg";

describe("BookmarkTable itemType enum", () => {
  it("includes thread and project as valid item types", () => {
    const column = BookmarkTable.itemType;
    const enumValues = (column as any).enumValues as string[];
    expect(enumValues).toContain("thread");
    expect(enumValues).toContain("project");
    expect(enumValues).toContain("agent");
    expect(enumValues).toContain("workflow");
    expect(enumValues).toContain("mcp");
  });
});

describe("pgBookmarkRepository", () => {
  it("exposes selectStarredThreads method", () => {
    expect(typeof pgBookmarkRepository.selectStarredThreads).toBe("function");
  });

  it("exposes selectStarredProjects method", () => {
    expect(typeof pgBookmarkRepository.selectStarredProjects).toBe("function");
  });

  it("exposes checkItemAccess method", () => {
    expect(typeof pgBookmarkRepository.checkItemAccess).toBe("function");
  });
});

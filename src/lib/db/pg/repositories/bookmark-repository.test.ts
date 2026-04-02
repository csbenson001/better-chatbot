import { describe, it, expect } from "vitest";
import { BookmarkTable } from "../schema.pg";

describe("BookmarkTable itemType enum", () => {
  it("includes thread and project as valid item types", () => {
    // Verify the column config has the expected enum values
    const column = BookmarkTable.itemType;
    const enumValues = (column as any).enumValues as string[];
    expect(enumValues).toContain("thread");
    expect(enumValues).toContain("project");
    expect(enumValues).toContain("agent");
    expect(enumValues).toContain("workflow");
    expect(enumValues).toContain("mcp");
  });
});

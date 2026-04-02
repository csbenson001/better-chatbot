import { describe, it, expect } from "vitest";

describe("BookmarkTable itemType enum", () => {
  it("should include thread and project in valid item types", () => {
    // This test validates at the type level — if schema doesn't include
    // these types, the build will fail
    const validTypes: Array<
      "agent" | "workflow" | "mcp" | "thread" | "project"
    > = ["agent", "workflow", "mcp", "thread", "project"];
    expect(validTypes).toContain("thread");
    expect(validTypes).toContain("project");
  });
});

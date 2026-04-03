import { describe, it, expect } from "vitest";

describe("AppSidebarStarred", () => {
  it("exports AppSidebarStarred component", async () => {
    const mod = await import("./app-sidebar-starred");
    expect(typeof mod.AppSidebarStarred).toBe("function");
  });
});

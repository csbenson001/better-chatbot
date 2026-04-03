import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("auth/server", () => ({ getSession: vi.fn() }));
vi.mock("lib/db/pg/db.pg", () => ({ pgDb: {} }));
vi.mock("lib/db/pg/schema.pg", () => ({ ChatThreadTable: {} }));
vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  count: vi.fn(),
  desc: vi.fn(),
  eq: vi.fn(),
  like: vi.fn(),
}));

describe("GET /api/chats", () => {
  it("exports a GET handler", async () => {
    const mod = await import("./route");
    expect(typeof mod.GET).toBe("function");
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetSession = vi.fn();
vi.mock("./auth-instance", () => ({ getSession: () => mockGetSession() }));
vi.mock("lib/user/utils", () => ({
  getIsUserAdmin: (user: any) => user?.role === "admin",
}));

let permissionsModule: typeof import("./permissions");

beforeEach(async () => {
  vi.resetModules();
  permissionsModule = await import("./permissions");
});

describe("hasSuperadminPermission", () => {
  it("returns false when no session", async () => {
    mockGetSession.mockResolvedValue(null);
    expect(await permissionsModule.hasSuperadminPermission()).toBe(false);
  });

  it("returns false for role=user", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "1", role: "user" } });
    expect(await permissionsModule.hasSuperadminPermission()).toBe(false);
  });

  it("returns false for role=admin", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "1", role: "admin" } });
    expect(await permissionsModule.hasSuperadminPermission()).toBe(false);
  });

  it("returns false for role=editor", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "1", role: "editor" } });
    expect(await permissionsModule.hasSuperadminPermission()).toBe(false);
  });

  it("returns true for role=superadmin", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "1", role: "superadmin" } });
    expect(await permissionsModule.hasSuperadminPermission()).toBe(true);
  });
});

describe("requireSuperadminPermission", () => {
  it("throws for non-superadmin", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "1", role: "admin" } });
    await expect(
      permissionsModule.requireSuperadminPermission("test action"),
    ).rejects.toThrow("Superadmin access required");
  });

  it("resolves without error for superadmin", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "1", role: "superadmin" } });
    await expect(
      permissionsModule.requireSuperadminPermission(),
    ).resolves.toBeUndefined();
  });
});

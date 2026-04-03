import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("auth/server", () => ({ getSession: vi.fn() }));
vi.mock("swr/infinite", () => ({
  default: vi.fn(() => ({
    data: undefined,
    setSize: vi.fn(),
    isLoading: false,
    isValidating: false,
  })),
}));
vi.mock("swr", () => ({
  default: vi.fn(() => ({ data: undefined, isLoading: false })),
}));
vi.mock("@/hooks/queries/use-starred", () => ({
  useStarred: () => ({ starredThreads: [] }),
}));
vi.mock("@/components/thread-dropdown", () => ({
  ThreadDropdown: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

describe("/chats page", () => {
  it("exports a default page component", async () => {
    const mod = await import("./page");
    expect(typeof mod.default).toBe("function");
  });
});

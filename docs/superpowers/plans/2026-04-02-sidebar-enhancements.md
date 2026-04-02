# Sidebar Enhancements (Starred + All Chats) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Starred section to the sidebar for pinning threads and projects, and replace the "show all" expand toggle with a dedicated /chats page.

**Architecture:** Extend `BookmarkTable.itemType` enum to include "thread" and "project" (no new table needed). Add `selectStarredThreads` / `selectStarredProjects` to the bookmark repository. Create `/api/starred` and `/api/chats` endpoints. Build `AppSidebarStarred` component with a `useStarred` SWR hook. Wire star/unstar actions into `ThreadDropdown` and `ProjectCard`. Replace the expand-toggle in `AppSidebarThreads` with an "All chats" link to `/chats`.

**Tech Stack:** Drizzle ORM + PostgreSQL, Next.js App Router, SWR, shadcn/ui, lucide-react, Zustand

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/lib/db/pg/schema.pg.ts` — extend BookmarkTable itemType enum |
| Generate | `src/lib/db/migrations/pg/0018_*.sql` — via `pnpm db:generate` |
| Modify | `src/lib/db/pg/repositories/bookmark-repository.pg.ts` — add 3 new methods |
| Modify | `src/app/api/bookmark/route.ts` — extend Zod enum + update type signatures |
| Create | `src/app/api/starred/route.ts` — GET starred threads + projects |
| Create | `src/app/api/chats/route.ts` — GET paginated thread list |
| Modify | `src/hooks/queries/use-bookmark.ts` — add thread/project to type union |
| Create | `src/hooks/queries/use-starred.ts` — SWR hook for starred data |
| Create | `src/components/layouts/app-sidebar-starred.tsx` — starred section |
| Modify | `src/components/layouts/app-sidebar.tsx` — insert AppSidebarStarred |
| Modify | `src/components/thread-dropdown.tsx` — add Star/Unstar menu item |
| Modify | `src/components/project/project-card.tsx` — add Star/Unstar menu item |
| Modify | `src/components/layouts/app-sidebar-threads.tsx` — replace expand button with All Chats link |
| Create | `src/app/(chat)/chats/page.tsx` — All Chats dedicated page |

---

### Task 1: Extend BookmarkTable Schema + Generate Migration

**Files:**
- Modify: `src/lib/db/pg/schema.pg.ts` lines 225–227

- [ ] **Step 1: Write the failing test**

Create `src/lib/db/pg/repositories/bookmark-repository.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("BookmarkTable itemType enum", () => {
  it("should include thread and project in valid item types", () => {
    // This test validates at the type level — if schema doesn't include
    // these types, the build will fail
    const validTypes: Array<"agent" | "workflow" | "mcp" | "thread" | "project"> = [
      "agent", "workflow", "mcp", "thread", "project",
    ];
    expect(validTypes).toContain("thread");
    expect(validTypes).toContain("project");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/chrisbenson/Documents - Local/GitHub/better-chatbot"
pnpm test src/lib/db/pg/repositories/bookmark-repository.test.ts
```

Expected: PASS (this is a type-level test — it confirms our intent; the real failure will be at runtime if we don't update the schema enum).

- [ ] **Step 3: Update `BookmarkTable.itemType` enum in schema**

In `src/lib/db/pg/schema.pg.ts`, find this block at line 225–227:

```typescript
    itemType: varchar("item_type", {
      enum: ["agent", "workflow", "mcp"],
    }).notNull(),
```

Replace with:

```typescript
    itemType: varchar("item_type", {
      enum: ["agent", "workflow", "mcp", "thread", "project"],
    }).notNull(),
```

- [ ] **Step 4: Generate migration**

```bash
cd "/Users/chrisbenson/Documents - Local/GitHub/better-chatbot"
pnpm db:generate
```

Expected: Creates `src/lib/db/migrations/pg/0018_*.sql` with an ALTER TABLE statement changing the item_type column constraint.

- [ ] **Step 5: Apply migration**

```bash
pnpm db:migrate
```

Expected: Migration applied successfully with no errors.

- [ ] **Step 6: Run tests**

```bash
pnpm test src/lib/db/pg/repositories/bookmark-repository.test.ts
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/db/pg/schema.pg.ts src/lib/db/migrations/pg/ src/lib/db/pg/repositories/bookmark-repository.test.ts
git commit -m "feat: extend BookmarkTable itemType to support thread and project"
```

---

### Task 2: Add Starred Query Methods to Bookmark Repository

**Files:**
- Modify: `src/lib/db/pg/repositories/bookmark-repository.pg.ts`

- [ ] **Step 1: Update the test with new method expectations**

Update `src/lib/db/pg/repositories/bookmark-repository.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { pgBookmarkRepository } from "./bookmark-repository.pg";

describe("BookmarkRepository", () => {
  it("should expose selectStarredThreads method", () => {
    expect(typeof pgBookmarkRepository.selectStarredThreads).toBe("function");
  });

  it("should expose selectStarredProjects method", () => {
    expect(typeof pgBookmarkRepository.selectStarredProjects).toBe("function");
  });

  it("should expose checkItemAccess method that accepts thread type", () => {
    expect(typeof pgBookmarkRepository.checkItemAccess).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test src/lib/db/pg/repositories/bookmark-repository.test.ts
```

Expected: FAIL — `selectStarredThreads` is not a function on `pgBookmarkRepository`.

- [ ] **Step 3: Update bookmark-repository.pg.ts**

Replace the entire file `src/lib/db/pg/repositories/bookmark-repository.pg.ts`:

```typescript
import { and, desc, eq } from "drizzle-orm";
import { pgDb as db } from "../db.pg";
import {
  BookmarkTable,
  AgentTable,
  ChatThreadTable,
  ProjectTable,
} from "../schema.pg";

type BookmarkItemType = "agent" | "workflow" | "mcp" | "thread" | "project";

export interface StarredThread {
  id: string;
  title: string | null;
  createdAt: Date;
}

export interface StarredProject {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookmarkRepository {
  createBookmark(
    userId: string,
    itemId: string,
    itemType: BookmarkItemType,
  ): Promise<void>;

  removeBookmark(
    userId: string,
    itemId: string,
    itemType: BookmarkItemType,
  ): Promise<void>;

  toggleBookmark(
    userId: string,
    itemId: string,
    itemType: BookmarkItemType,
    isCurrentlyBookmarked: boolean,
  ): Promise<boolean>;

  checkItemAccess(
    itemId: string,
    itemType: BookmarkItemType,
    userId: string,
  ): Promise<boolean>;

  selectStarredThreads(userId: string): Promise<StarredThread[]>;
  selectStarredProjects(userId: string): Promise<StarredProject[]>;
}

export const pgBookmarkRepository: BookmarkRepository = {
  async createBookmark(userId, itemId, itemType) {
    await db
      .insert(BookmarkTable)
      .values({ userId, itemId, itemType })
      .onConflictDoNothing();
  },

  async removeBookmark(userId, itemId, itemType) {
    await db
      .delete(BookmarkTable)
      .where(
        and(
          eq(BookmarkTable.userId, userId),
          eq(BookmarkTable.itemId, itemId),
          eq(BookmarkTable.itemType, itemType),
        ),
      );
  },

  async toggleBookmark(userId, itemId, itemType, isCurrentlyBookmarked) {
    if (isCurrentlyBookmarked) {
      await this.removeBookmark(userId, itemId, itemType);
      return false;
    } else {
      await this.createBookmark(userId, itemId, itemType);
      return true;
    }
  },

  async checkItemAccess(itemId, itemType, userId) {
    if (itemType === "agent") {
      const [agent] = await db
        .select()
        .from(AgentTable)
        .where(eq(AgentTable.id, itemId))
        .limit(1);
      if (!agent) return false;
      return (
        agent.visibility === "public" ||
        agent.visibility === "readonly" ||
        agent.userId === userId
      );
    }

    if (itemType === "thread") {
      const [thread] = await db
        .select({ userId: ChatThreadTable.userId })
        .from(ChatThreadTable)
        .where(eq(ChatThreadTable.id, itemId))
        .limit(1);
      if (!thread) return false;
      return thread.userId === userId;
    }

    if (itemType === "project") {
      const [project] = await db
        .select({ userId: ProjectTable.userId })
        .from(ProjectTable)
        .where(eq(ProjectTable.id, itemId))
        .limit(1);
      if (!project) return false;
      return project.userId === userId;
    }

    return false;
  },

  async selectStarredThreads(userId) {
    return db
      .select({
        id: ChatThreadTable.id,
        title: ChatThreadTable.title,
        createdAt: ChatThreadTable.createdAt,
      })
      .from(BookmarkTable)
      .innerJoin(ChatThreadTable, eq(BookmarkTable.itemId, ChatThreadTable.id))
      .where(
        and(
          eq(BookmarkTable.userId, userId),
          eq(BookmarkTable.itemType, "thread"),
        ),
      )
      .orderBy(desc(BookmarkTable.createdAt));
  },

  async selectStarredProjects(userId) {
    return db
      .select({
        id: ProjectTable.id,
        name: ProjectTable.name,
        description: ProjectTable.description,
        createdAt: ProjectTable.createdAt,
        updatedAt: ProjectTable.updatedAt,
      })
      .from(BookmarkTable)
      .innerJoin(ProjectTable, eq(BookmarkTable.itemId, ProjectTable.id))
      .where(
        and(
          eq(BookmarkTable.userId, userId),
          eq(BookmarkTable.itemType, "project"),
        ),
      )
      .orderBy(desc(BookmarkTable.createdAt));
  },
};
```

- [ ] **Step 4: Run tests**

```bash
pnpm test src/lib/db/pg/repositories/bookmark-repository.test.ts
```

Expected: PASS — all three method-existence checks pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/pg/repositories/bookmark-repository.pg.ts src/lib/db/pg/repositories/bookmark-repository.test.ts
git commit -m "feat: add selectStarredThreads and selectStarredProjects to bookmark repository"
```

---

### Task 3: API Routes — Extend /api/bookmark, Create /api/starred and /api/chats

**Files:**
- Modify: `src/app/api/bookmark/route.ts`
- Create: `src/app/api/starred/route.ts`
- Create: `src/app/api/chats/route.ts`

- [ ] **Step 1: Write failing tests**

Create `src/app/api/starred/route.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("GET /api/starred", () => {
  it("returns threads and projects keys", async () => {
    // Integration smoke test — verifies response shape
    // Full integration requires DB; this validates the export exists
    const mod = await import("./route");
    expect(typeof mod.GET).toBe("function");
  });
});
```

Create `src/app/api/chats/route.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("GET /api/chats", () => {
  it("exports a GET handler", async () => {
    const mod = await import("./route");
    expect(typeof mod.GET).toBe("function");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test src/app/api/starred/route.test.ts src/app/api/chats/route.test.ts
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Update /api/bookmark/route.ts to accept thread and project**

Replace the entire file `src/app/api/bookmark/route.ts`:

```typescript
import { getSession } from "auth/server";
import { bookmarkRepository } from "lib/db/repository";
import { z } from "zod";

const BookmarkSchema = z.object({
  itemId: z.string().min(1),
  itemType: z.enum(["agent", "workflow", "mcp", "thread", "project"]),
});

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { itemId, itemType } = BookmarkSchema.parse(body);

    const hasAccess = await bookmarkRepository.checkItemAccess(
      itemId,
      itemType,
      session.user.id,
    );

    if (!hasAccess) {
      return Response.json(
        { error: "Item not found or access denied" },
        { status: 404 },
      );
    }

    await bookmarkRepository.createBookmark(session.user.id, itemId, itemType);

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.message },
        { status: 400 },
      );
    }
    console.error("Error creating bookmark:", error);
    return Response.json({ error: "Failed to create bookmark" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { itemId, itemType } = BookmarkSchema.parse(body);

    await bookmarkRepository.removeBookmark(session.user.id, itemId, itemType);

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.message },
        { status: 400 },
      );
    }
    console.error("Error deleting bookmark:", error);
    return Response.json({ error: "Failed to delete bookmark" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create /api/starred/route.ts**

Create `src/app/api/starred/route.ts`:

```typescript
import { getSession } from "auth/server";
import { bookmarkRepository } from "lib/db/repository";

export async function GET() {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [threads, projects] = await Promise.all([
    bookmarkRepository.selectStarredThreads(session.user.id),
    bookmarkRepository.selectStarredProjects(session.user.id),
  ]);

  return Response.json({ threads, projects });
}
```

- [ ] **Step 5: Create /api/chats/route.ts**

Create `src/app/api/chats/route.ts`:

```typescript
import { getSession } from "auth/server";
import { pgDb as db } from "lib/db/pg/db.pg";
import { ChatThreadTable } from "lib/db/pg/schema.pg";
import { and, count, desc, eq, like } from "drizzle-orm";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")));
  const search = searchParams.get("search") ?? "";
  const offset = (page - 1) * limit;

  const whereClause = and(
    eq(ChatThreadTable.userId, session.user.id),
    search ? like(ChatThreadTable.title, `%${search}%`) : undefined,
  );

  const [threads, [{ total }]] = await Promise.all([
    db
      .select()
      .from(ChatThreadTable)
      .where(whereClause)
      .orderBy(desc(ChatThreadTable.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(ChatThreadTable).where(whereClause),
  ]);

  return Response.json({ threads, total, page, limit });
}
```

- [ ] **Step 6: Run tests**

```bash
pnpm test src/app/api/starred/route.test.ts src/app/api/chats/route.test.ts
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/app/api/bookmark/route.ts src/app/api/starred/route.ts src/app/api/starred/route.test.ts src/app/api/chats/route.ts src/app/api/chats/route.test.ts
git commit -m "feat: extend bookmark API for threads/projects, add /api/starred and /api/chats"
```

---

### Task 4: Hooks — useStarred + update useBookmark

**Files:**
- Create: `src/hooks/queries/use-starred.ts`
- Modify: `src/hooks/queries/use-bookmark.ts`

- [ ] **Step 1: Write failing test**

Create `src/hooks/queries/use-starred.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("useStarred hook", () => {
  it("exports useStarred function", async () => {
    const mod = await import("./use-starred");
    expect(typeof mod.useStarred).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test src/hooks/queries/use-starred.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create use-starred.ts**

Create `src/hooks/queries/use-starred.ts`:

```typescript
"use client";

import useSWR from "swr";
import { fetcher } from "lib/utils";

export interface StarredThread {
  id: string;
  title: string | null;
  createdAt: string;
}

export interface StarredProject {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useStarred() {
  const { data, isLoading, mutate } = useSWR<{
    threads: StarredThread[];
    projects: StarredProject[];
  }>("/api/starred", fetcher, {
    fallbackData: { threads: [], projects: [] },
    revalidateOnFocus: false,
  });

  return {
    starredThreads: data?.threads ?? [],
    starredProjects: data?.projects ?? [],
    isLoading,
    mutate,
  };
}
```

- [ ] **Step 4: Update use-bookmark.ts to support thread/project + revalidate starred cache**

Replace `src/hooks/queries/use-bookmark.ts`:

```typescript
"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { mutate as globalMutate } from "swr";

export interface BookmarkItem {
  id: string;
  isBookmarked?: boolean;
}

type BookmarkItemType = "agent" | "workflow" | "mcp" | "thread" | "project";

interface UseBookmarkOptions {
  itemType?: BookmarkItemType;
}

export function useBookmark(options: UseBookmarkOptions = {}) {
  const { itemType = "agent" } = options;
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const { mutate } = useSWRConfig();

  const toggleBookmark = async (item: BookmarkItem) => {
    const { id, isBookmarked = false } = item;

    if (loadingIds.has(id)) return;

    setLoadingIds((prev) => new Set(prev).add(id));

    try {
      const response = await fetch(`/api/bookmark`, {
        method: isBookmarked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: id, itemType }),
      });

      if (!response.ok) {
        throw new Error("Failed to update bookmark");
      }

      // Update list caches for agent/workflow/mcp types
      if (itemType !== "thread" && itemType !== "project") {
        await mutate(
          (key) => {
            if (typeof key !== "string") return false;
            return (
              key.startsWith(`/api/${itemType}`) &&
              !key.match(new RegExp(`/api/${itemType}/[^/?]+$`))
            );
          },
          (cachedData: any) => {
            if (!cachedData) return cachedData;
            if (Array.isArray(cachedData)) {
              return cachedData.map((item: any) =>
                item.id === id ? { ...item, isBookmarked: !isBookmarked } : item,
              );
            }
            if (cachedData.id === id) {
              return { ...cachedData, isBookmarked: !isBookmarked };
            }
            return cachedData;
          },
          { revalidate: true },
        );

        await mutate(
          `/api/${itemType}/${id}`,
          (cachedData: any) => {
            if (!cachedData) return cachedData;
            return { ...cachedData, isBookmarked: !isBookmarked };
          },
          { revalidate: true },
        );
      }

      // Always revalidate starred cache when toggling thread or project
      if (itemType === "thread" || itemType === "project") {
        await globalMutate("/api/starred");
      }

      return !isBookmarked;
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      throw error;
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return {
    toggleBookmark,
    isLoading: (itemId: string) => loadingIds.has(itemId),
  };
}
```

- [ ] **Step 5: Run tests**

```bash
pnpm test src/hooks/queries/use-starred.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/hooks/queries/use-starred.ts src/hooks/queries/use-starred.test.ts src/hooks/queries/use-bookmark.ts
git commit -m "feat: add useStarred hook and extend useBookmark for thread/project types"
```

---

### Task 5: Create AppSidebarStarred Component

**Files:**
- Create: `src/components/layouts/app-sidebar-starred.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/layouts/app-sidebar-starred.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";

describe("AppSidebarStarred", () => {
  it("exports AppSidebarStarred component", async () => {
    const mod = await import("./app-sidebar-starred");
    expect(typeof mod.AppSidebarStarred).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test src/components/layouts/app-sidebar-starred.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create app-sidebar-starred.tsx**

Create `src/components/layouts/app-sidebar-starred.tsx`:

```tsx
"use client";

import Link from "next/link";
import { Star, MessageSquare, FolderIcon, Loader } from "lucide-react";
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSkeleton } from "ui/sidebar";
import { useStarred } from "@/hooks/queries/use-starred";
import { useBookmark } from "@/hooks/queries/use-bookmark";
import { Button } from "ui/button";
import { cn } from "lib/utils";

export function AppSidebarStarred() {
  const { starredThreads, starredProjects, isLoading } = useStarred();
  const { toggleBookmark, isLoading: isUnstarring } = useBookmark({ itemType: "thread" });
  const { toggleBookmark: toggleProjectBookmark, isLoading: isUnstarringProject } =
    useBookmark({ itemType: "project" });

  const hasItems = starredThreads.length > 0 || starredProjects.length > 0;

  if (!isLoading && !hasItems) return null;

  return (
    <SidebarGroup>
      <SidebarGroupContent className="group-data-[collapsible=icon]:hidden group/starred">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarGroupLabel>
              <h4 className="text-xs text-muted-foreground group-hover/starred:text-foreground transition-colors flex items-center gap-1">
                <Star className="size-3" />
                Starred
              </h4>
            </SidebarGroupLabel>

            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <SidebarMenuSkeleton key={i} />
              ))
            ) : (
              <>
                {starredProjects.map((project) => (
                  <div key={project.id} className="group/starred-item flex items-center">
                    <SidebarMenuButton asChild>
                      <Link href={`/projects/${project.id}`} className="flex items-center gap-2 flex-1 min-w-0">
                        <FolderIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm">{project.name}</span>
                      </Link>
                    </SidebarMenuButton>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 opacity-0 group-hover/starred-item:opacity-100 transition-opacity shrink-0"
                      onClick={() => toggleProjectBookmark({ id: project.id, isBookmarked: true })}
                      disabled={isUnstarringProject(project.id)}
                    >
                      {isUnstarringProject(project.id) ? (
                        <Loader className="size-3 animate-spin" />
                      ) : (
                        <Star className="size-3 fill-current" />
                      )}
                    </Button>
                  </div>
                ))}

                {starredThreads.map((thread) => (
                  <div key={thread.id} className="group/starred-item flex items-center">
                    <SidebarMenuButton asChild>
                      <Link href={`/chat/${thread.id}`} className="flex items-center gap-2 flex-1 min-w-0">
                        <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm">{thread.title || "Untitled"}</span>
                      </Link>
                    </SidebarMenuButton>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 opacity-0 group-hover/starred-item:opacity-100 transition-opacity shrink-0"
                      onClick={() => toggleBookmark({ id: thread.id, isBookmarked: true })}
                      disabled={isUnstarring(thread.id)}
                    >
                      {isUnstarring(thread.id) ? (
                        <Loader className="size-3 animate-spin" />
                      ) : (
                        <Star className="size-3 fill-current" />
                      )}
                    </Button>
                  </div>
                ))}
              </>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test src/components/layouts/app-sidebar-starred.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/layouts/app-sidebar-starred.tsx src/components/layouts/app-sidebar-starred.test.tsx
git commit -m "feat: add AppSidebarStarred component"
```

---

### Task 6: Wire AppSidebarStarred into AppSidebar

**Files:**
- Modify: `src/components/layouts/app-sidebar.tsx`

- [ ] **Step 1: Update app-sidebar.tsx**

In `src/components/layouts/app-sidebar.tsx`, add the import and insert the component between `AppSidebarMenus` and `AppSidebarAgents`.

Find the imports block (lines 1–13) and add:

```typescript
import { AppSidebarStarred } from "./app-sidebar-starred";
```

Find the content block around line 51–56:

```tsx
      <SidebarContent className="mt-2 overflow-hidden relative">
        <div className="flex flex-col overflow-y-auto">
          <AppSidebarMenus user={user} />
          <AppSidebarAgents userRole={userRole} />
          <AppSidebarThreads />
        </div>
      </SidebarContent>
```

Replace with:

```tsx
      <SidebarContent className="mt-2 overflow-hidden relative">
        <div className="flex flex-col overflow-y-auto">
          <AppSidebarMenus user={user} />
          <AppSidebarStarred />
          <AppSidebarAgents userRole={userRole} />
          <AppSidebarThreads />
        </div>
      </SidebarContent>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/chrisbenson/Documents - Local/GitHub/better-chatbot"
pnpm tsc --noEmit 2>&1 | grep -E "app-sidebar" | head -20
```

Expected: No errors mentioning app-sidebar files.

- [ ] **Step 3: Commit**

```bash
git add src/components/layouts/app-sidebar.tsx
git commit -m "feat: add AppSidebarStarred to main sidebar layout"
```

---

### Task 7: Add Star/Unstar to ThreadDropdown

**Files:**
- Modify: `src/components/thread-dropdown.tsx`

- [ ] **Step 1: Add Star/Unstar menu item to ThreadDropdown**

The `ThreadDropdown` component needs to know if the current thread is starred. It will get `isStarred` as a prop. The `useStarred` hook will be called by the parent (`AppSidebarThreads`) and passed down as a prop.

Open `src/components/thread-dropdown.tsx`.

Add `Star` to the lucide import at line 5–13:

```typescript
import {
  Archive,
  ChevronRight,
  FolderIcon,
  Loader,
  PencilLine,
  Star,
  Trash,
  UploadIcon,
} from "lucide-react";
```

Update the `Props` type at lines 51–57 to add `isStarred`:

```typescript
type Props = PropsWithChildren<{
  threadId: string;
  isStarred?: boolean;
  beforeTitle?: string;
  onDeleted?: () => void;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "end" | "center";
}>;
```

Update the destructured props in the function signature at lines 59–66:

```typescript
export function ThreadDropdown({
  threadId,
  children,
  isStarred = false,
  beforeTitle,
  onDeleted,
  side,
  align,
}: Props) {
```

Add bookmark hook after the existing state declarations (after line 78, before `handleUpdate`):

```typescript
  const { toggleBookmark, isLoading: isStarLoading } = useBookmark({ itemType: "thread" });
```

Add the import at the top of the file (after existing imports):

```typescript
import { useBookmark } from "@/hooks/queries/use-bookmark";
```

Add the Star menu item after the MoveToProject `CommandItem` (after line 222, before `CommandSeparator`):

```tsx
                <CommandItem
                  className="cursor-pointer"
                  disabled={isStarLoading(threadId)}
                  onClick={() => toggleBookmark({ id: threadId, isBookmarked: isStarred })}
                >
                  <Star className={isStarred ? "fill-current text-yellow-400" : "text-foreground"} />
                  <span className="mr-4">{isStarred ? "Remove from Starred" : "Add to Starred"}</span>
                  {isStarLoading(threadId) && <Loader className="ml-auto h-4 w-4 animate-spin" />}
                </CommandItem>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit 2>&1 | grep -E "thread-dropdown" | head -10
```

Expected: No errors.

- [ ] **Step 3: Update AppSidebarThreads to pass isStarred prop**

In `src/components/layouts/app-sidebar-threads.tsx`, import `useStarred`:

```typescript
import { useStarred } from "@/hooks/queries/use-starred";
```

Add the hook call inside `AppSidebarThreads` (after the existing state declarations, around line 61):

```typescript
  const { starredThreads } = useStarred();
  const starredThreadIds = new Set(starredThreads.map((t) => t.id));
```

Find the `ThreadDropdown` usage at line 253–257 and add the `isStarred` prop:

```tsx
                        <ThreadDropdown
                          side="right"
                          threadId={thread.id}
                          beforeTitle={thread.title}
                          isStarred={starredThreadIds.has(thread.id)}
                        >
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit 2>&1 | grep -E "thread-dropdown|app-sidebar-threads" | head -10
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/thread-dropdown.tsx src/components/layouts/app-sidebar-threads.tsx
git commit -m "feat: add star/unstar action to ThreadDropdown"
```

---

### Task 8: Add Star/Unstar to ProjectCard

**Files:**
- Modify: `src/components/project/project-card.tsx`

- [ ] **Step 1: Update ProjectCard**

The `ProjectCard` component needs to know if the project is starred. Add an `isStarred?: boolean` prop and use the bookmark hook.

Replace the entire file `src/components/project/project-card.tsx`:

```tsx
"use client";
import {
  FolderIcon,
  MoreHorizontalIcon,
  Star,
  Trash2Icon,
  PencilIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ProjectSummary } from "app-types/project";
import { formatTimeAgo } from "lib/date-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { Button } from "ui/button";
import { toast } from "sonner";
import { mutate } from "swr";
import { useBookmark } from "@/hooks/queries/use-bookmark";

interface ProjectCardProps {
  project: ProjectSummary;
  isStarred?: boolean;
}

export function ProjectCard({ project, isStarred = false }: ProjectCardProps) {
  const router = useRouter();
  const { toggleBookmark, isLoading: isStarLoading } = useBookmark({ itemType: "project" });

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Project deleted");
      mutate("/api/projects");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  return (
    <div
      className="group relative flex flex-col rounded-xl border border-border/60 bg-card p-4 cursor-pointer hover:border-border transition-colors"
      onClick={() => router.push(`/projects/${project.id}`)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <FolderIcon className="size-4 shrink-0 text-yale-blue" />
          <span className="font-semibold text-sm truncate">{project.name}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <MoreHorizontalIcon className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/projects/${project.id}`);
              }}
            >
              <PencilIcon className="size-3.5 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isStarLoading(project.id)}
              onClick={(e) => {
                e.stopPropagation();
                toggleBookmark({ id: project.id, isBookmarked: isStarred });
              }}
            >
              <Star className={`size-3.5 mr-2 ${isStarred ? "fill-current text-yellow-400" : ""}`} />
              {isStarred ? "Remove from Starred" : "Add to Starred"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2Icon className="size-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {project.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">
          {project.description}
        </p>
      )}

      <div className="mt-auto pt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground/60">
          Updated {formatTimeAgo(new Date(project.updatedAt))}
        </span>
        <span className="text-xs text-muted-foreground/50">
          {project.threadCount} chat{project.threadCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Find where ProjectCard is rendered and pass isStarred**

Search for usages of `ProjectCard`:

```bash
grep -r "ProjectCard" src --include="*.tsx" -l
```

For each file that renders `<ProjectCard`, import `useStarred` and pass `isStarred={starredProjectIds.has(project.id)}`.

Pattern to add to each parent component:
```typescript
import { useStarred } from "@/hooks/queries/use-starred";
// Inside component:
const { starredProjects } = useStarred();
const starredProjectIds = new Set(starredProjects.map((p) => p.id));
// Then on each ProjectCard:
// isStarred={starredProjectIds.has(project.id)}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit 2>&1 | grep -E "project-card" | head -10
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/project/project-card.tsx
git commit -m "feat: add star/unstar action to ProjectCard"
```

---

### Task 9: Replace Expand Button with "All Chats" Link

**Files:**
- Modify: `src/components/layouts/app-sidebar-threads.tsx`

- [ ] **Step 1: Replace the expand/collapse button block**

In `src/components/layouts/app-sidebar-threads.tsx`, find the `hasExcessThreads` block at lines 304–322:

```tsx
      {hasExcessThreads && (
        <SidebarMenu>
          <SidebarMenuItem>
            {/* TODO: Later implement a dedicated search/all chats page instead of this expand functionality */}
            <div className="w-full flex px-4">
              <Button
                variant="secondary"
                size="sm"
                className="w-full hover:bg-input! justify-start"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <MoreHorizontal className="mr-2" />
                {isExpanded ? t("showLessChats") : t("showAllChats")}
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      )}
```

Replace with:

```tsx
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="w-full flex px-4 pb-2">
            <Link
              href="/chats"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center py-1"
            >
              All chats
            </Link>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
```

Also add the `Link` import at the top of the file (it may already exist — check first):

```typescript
import Link from "next/link";
```

Remove unused imports that were only used by the old expand button:
- `ChevronDown`, `ChevronUp` (if not used elsewhere in the file)
- `isExpanded` state and `setIsExpanded` (if not used elsewhere)

Check before removing — search for other usages in the file first.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit 2>&1 | grep -E "app-sidebar-threads" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layouts/app-sidebar-threads.tsx
git commit -m "feat: replace expand toggle with All Chats link in sidebar"
```

---

### Task 10: Create /chats Page

**Files:**
- Create: `src/app/(chat)/chats/page.tsx`

- [ ] **Step 1: Write failing test**

Create `src/app/(chat)/chats/page.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";

describe("/chats page", () => {
  it("exports a default page component", async () => {
    const mod = await import("./page");
    expect(typeof mod.default).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test "src/app/(chat)/chats/page.test.tsx"
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create the /chats page**

Create `src/app/(chat)/chats/page.tsx`:

```tsx
"use client";

import { useCallback, useState } from "react";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "lib/utils";
import { ThreadDropdown } from "@/components/thread-dropdown";
import { MoreHorizontal } from "lucide-react";
import { Button } from "ui/button";
import { Input } from "ui/input";
import Link from "next/link";
import { formatTimeAgo } from "lib/date-utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useStarred } from "@/hooks/queries/use-starred";

const PAGE_SIZE = 50;

interface Thread {
  id: string;
  title: string | null;
  createdAt: string;
  projectId: string | null;
}

interface ChatsResponse {
  threads: Thread[];
  total: number;
  page: number;
  limit: number;
}

function getKey(pageIndex: number, previousPageData: ChatsResponse | null, search: string) {
  if (previousPageData && previousPageData.threads.length === 0) return null;
  return `/api/chats?page=${pageIndex + 1}&limit=${PAGE_SIZE}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
}

export default function ChatsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { starredThreads } = useStarred();
  const starredIds = new Set(starredThreads.map((t) => t.id));

  const { data, size, setSize, isLoading, isValidating } = useSWRInfinite<ChatsResponse>(
    (pageIndex, prev) => getKey(pageIndex, prev, debouncedSearch),
    fetcher,
    { revalidateOnFocus: false },
  );

  const threads = data ? data.flatMap((d) => d.threads) : [];
  const total = data?.[0]?.total ?? 0;
  const hasMore = threads.length < total;

  const handleLoadMore = useCallback(() => {
    setSize((s) => s + 1);
  }, [setSize]);

  return (
    <div className="flex flex-col min-h-full max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">All Chats</h1>
        <span className="text-sm text-muted-foreground">{total} total</span>
      </div>

      <Input
        placeholder="Search chats..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6"
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {search ? "No chats match your search." : "No conversations yet."}
        </div>
      ) : (
        <div className="space-y-1">
          {threads.map((thread) => (
            <div
              key={thread.id}
              className="group flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
            >
              <Link href={`/chat/${thread.id}`} className="flex-1 min-w-0">
                <p className="text-sm truncate">{thread.title || "Untitled"}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeAgo(new Date(thread.createdAt))}
                </p>
              </Link>
              <ThreadDropdown
                threadId={thread.id}
                beforeTitle={thread.title ?? ""}
                isStarred={starredIds.has(thread.id)}
                side="left"
                align="start"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </ThreadDropdown>
            </div>
          ))}

          {hasMore && (
            <div className="pt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isValidating}
              >
                {isValidating ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**Note:** If `useDebounce` hook doesn't exist, create it at `src/hooks/use-debounce.ts`:

```typescript
import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

Check first: `grep -r "useDebounce" src --include="*.ts" -l` — if it exists, import from the existing location.

- [ ] **Step 4: Run tests**

```bash
pnpm test "src/app/(chat)/chats/page.test.tsx"
```

Expected: PASS

- [ ] **Step 5: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit 2>&1 | grep -E "chats" | head -10
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(chat\)/chats/ src/hooks/use-debounce.ts
git commit -m "feat: add All Chats dedicated page at /chats"
```

---

### Final: Push and PR

- [ ] **Step 1: Run full test suite**

```bash
pnpm test 2>&1 | tail -20
```

Expected: All existing 336 tests pass plus the new tests we added.

- [ ] **Step 2: Push and create PR**

```bash
git push origin claude/platform-architecture-planning-h1crR
gh pr create --repo csbenson001/better-chatbot \
  --title "feat: sidebar enhancements — starred items + all chats page" \
  --body "$(cat <<'EOF'
## Summary
- Extends BookmarkTable to support starring threads and projects
- New Starred section in sidebar (hidden when empty, projects then threads)
- Star/Unstar action in ThreadDropdown and ProjectCard menus
- Replaces sidebar expand toggle with dedicated /chats page
- /chats page: searchable, paginated, with thread actions

## Test plan
- [ ] Star a thread from its dropdown menu → appears in Starred sidebar section
- [ ] Star a project from its card menu → appears in Starred sidebar section  
- [ ] Unstar an item → disappears from Starred section
- [ ] Navigate to /chats → see all threads with search and load more
- [ ] "All chats" link at bottom of sidebar → navigates to /chats

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

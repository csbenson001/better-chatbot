# Sidebar Enhancements Design — Starred Items + All Chats

## Goal

Add a **Starred** section to the sidebar (threads and projects the user has pinned), a **Star/Unstar** action in thread and project menus, and an **All Chats** dedicated page reachable from the sidebar.

## Reference

Mirrors Claude.ai sidebar: starred items section above recent chats, star from item dropdown, "All chats" link at the bottom of the thread list.

---

## Architecture

### Data Layer — Extend BookmarkTable

The existing `BookmarkTable` already handles starred/bookmarked agents, workflows, and MCP servers. We extend the `itemType` enum to include `"thread"` and `"project"`.

**Schema change** (`src/lib/db/pg/schema.pg.ts`):
```typescript
itemType: varchar("item_type", {
  enum: ["agent", "workflow", "mcp", "thread", "project"],
}).notNull(),
```

**New migration** — `pnpm db:generate` then `pnpm db:migrate`.

No new tables. The unique constraint on `(userId, itemId, itemType)` prevents duplicates automatically.

### Repository Layer

Add two new methods to `bookmark-repository.pg.ts`:

- `selectStarredThreads(userId)` — joins `BookmarkTable` with `ChatThreadTable` to return starred threads (id, title, lastMessageAt)
- `selectStarredProjects(userId)` — joins `BookmarkTable` with `ProjectTable` to return starred projects (id, name, description)

Both methods filter `itemType = "thread"` / `"project"` and order by `createdAt DESC` (bookmark creation time = pin order).

Export updated interface from `src/types/bookmark.ts` (or inline in repository if no type file exists).

### API Layer

**Extend existing `/api/bookmark`** (`src/app/api/bookmark/route.ts`):
- Update Zod validation schema to allow `itemType: z.enum(["agent", "workflow", "mcp", "thread", "project"])`
- Add access check for "thread" type: verify `thread.userId === session.user.id`
- Add access check for "project" type: verify `project.userId === session.user.id`

**New GET endpoint `/api/starred`** (`src/app/api/starred/route.ts`):
- Returns `{ threads: StarredThread[], projects: StarredProject[] }`
- Calls `selectStarredThreads` + `selectStarredProjects` in parallel (`Promise.all`)
- Used by the sidebar starred section

**New GET endpoint `/api/chats`** (`src/app/api/chats/route.ts`):
- Returns paginated thread list: `{ threads: Thread[], total: number }`
- Query params: `page` (default 1), `limit` (default 50), `search` (optional substring match on title)
- Used by the `/chats` page

### Frontend — New Hook

**`src/hooks/queries/use-starred.ts`**:
- SWR fetch from `/api/starred`
- Returns `{ starredThreads, starredProjects, isLoading, mutate }`
- Cache key: `"/api/starred"`

**Update `src/hooks/queries/use-bookmark.ts`**:
- Add `"thread"` and `"project"` to the `itemType` union type
- After toggle, call `mutate("/api/starred")` to refresh the starred sidebar section

---

## UI Components

### AppSidebarStarred (`src/components/layouts/app-sidebar-starred.tsx`)

New sidebar section rendered between `AppSidebarMenus` and `AppSidebarAgents` in `app-sidebar.tsx`.

**Behavior:**
- Only rendered when `starredThreads.length > 0 || starredProjects.length > 0`
- Section header: "Starred" (small caps label, same style as "Agents" section header)
- Projects listed first (folder icon), then threads (message icon)
- Max 10 items shown; if more, show "See all starred" link (future)
- Clicking a starred thread → navigates to `/chat/{threadId}`
- Clicking a starred project → navigates to `/projects/{projectId}`
- Each item has a hover-visible unstar button (⭐ filled → outline) on the right

**Loading state:** 3 skeleton rows while fetching.

**Empty state:** Section is hidden (not rendered).

### Star Action in Thread Dropdown

File: `src/components/thread-dropdown.tsx`

Add menu item after "Move to Project":
```
⭐ Add to Starred   (when not starred)
★  Remove from Starred  (when starred)
```

The dropdown needs to know if the current thread is starred. Pass `isStarred: boolean` as a prop (derived from the `starredThreads` list in `useStarred`).

Clicking calls `toggleBookmark({ id: thread.id, isBookmarked: isStarred })` with `itemType: "thread"`.

### Star Action in Project Card Menu

File: `src/components/project/project-card.tsx` (or wherever the project kebab menu lives)

Same pattern: "Add to Starred" / "Remove from Starred" menu item. Pass `isStarred` from `useStarred`.

### "All Chats" Entry Point

**In `AppSidebarThreads`** (`src/components/layouts/app-sidebar-threads.tsx`):

At the very bottom of the thread list (below all date groups), add a fixed link:
```
  ← All chats
```
Styled as a small muted link (same style as Claude's "All chats" button). Always visible, not dependent on thread count. Navigates to `/chats`.

### All Chats Page (`src/app/(chat)/chats/page.tsx`)

Dedicated page under the `(chat)` route group.

**Layout:**
- Page heading: "All Chats"
- Search bar (text input, debounced 300ms, filters by title)
- Thread list: title, last message relative timestamp, project badge if in a project
- Each row has the same `ThreadDropdown` actions as the sidebar
- Pagination: "Load more" button (not numbered pages) — loads next 50
- Empty state: "No conversations yet" when search returns nothing

---

## Sidebar Layout After Changes

```
SidebarHeader (SayfeAI)
SidebarContent
  ├─ AppSidebarMenus (New Chat, Projects, Workflow, Customize, Admin, Archive, Connectors)
  ├─ AppSidebarStarred  ← NEW (hidden when empty)
  ├─ AppSidebarAgents
  └─ AppSidebarThreads (recent chats + "All chats" link at bottom)
SidebarFooter (user menu)
```

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/lib/db/pg/schema.pg.ts` — extend BookmarkTable itemType enum |
| Generate | `src/lib/db/migrations/pg/0017_*.sql` |
| Modify | `src/lib/db/pg/repositories/bookmark-repository.pg.ts` — add selectStarredThreads, selectStarredProjects |
| Modify | `src/app/api/bookmark/route.ts` — extend validation + access checks for thread/project |
| Create | `src/app/api/starred/route.ts` — GET starred threads + projects |
| Create | `src/app/api/chats/route.ts` — GET paginated thread list |
| Create | `src/hooks/queries/use-starred.ts` — SWR hook |
| Modify | `src/hooks/queries/use-bookmark.ts` — add thread/project types, mutate starred cache |
| Create | `src/components/layouts/app-sidebar-starred.tsx` — starred section |
| Modify | `src/components/layouts/app-sidebar.tsx` — add AppSidebarStarred |
| Modify | `src/components/layouts/app-sidebar-threads.tsx` — add "All chats" link at bottom |
| Modify | `src/components/thread-dropdown.tsx` — add Star/Unstar menu item |
| Modify | `src/components/project/project-card.tsx` (or project kebab menu) — add Star/Unstar |
| Create | `src/app/(chat)/chats/page.tsx` — All Chats dedicated page |

---

## Out of Scope

- Drag-to-reorder starred items (future)
- "See all starred" dedicated page (future)
- Starring agents or workflows via sidebar (already works via existing bookmark system)
- Push notifications for starred thread activity (future)

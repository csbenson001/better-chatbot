# Quick Prompt Buttons Design — Home Screen Prompts + Admin Config

## Goal

Add configurable **quick prompt buttons** (Write, Learn, Code, Life stuff) below the chat input on the home/new-chat screen. Clicking a button opens a dropdown of sub-prompts; selecting one injects the prompt text into the chat input. Admins can fully configure categories, prompts, ordering, and visibility from the admin panel.

## Reference

Mirrors Claude.ai home screen: a row of labeled category buttons, each expanding into a list of actionable prompt suggestions. Applies to all users (no per-user filtering yet).

---

## Architecture

### Data Layer — Two New Tables

#### `PromptCategoryTable`

```typescript
export const PromptCategoryTable = pgTable("prompt_category", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  label: text("label").notNull(),          // e.g. "Write"
  icon: text("icon").notNull(),            // lucide icon name e.g. "PenLine"
  sequence: integer("sequence").notNull(), // display order, ascending
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
```

#### `PromptItemTable`

```typescript
export const PromptItemTable = pgTable("prompt_item", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => PromptCategoryTable.id, { onDelete: "cascade" }),
  label: text("label").notNull(),    // short display label e.g. "Improve my essay"
  prompt: text("prompt").notNull(),  // full text injected into chat input
  sequence: integer("sequence").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
```

**Indexes:** `prompt_item_category_id_idx` on `categoryId`.

**Migration:** `pnpm db:generate` then `pnpm db:migrate`.

### Seed Data

Run once at migration time (or via a seed script). Default categories and prompts matching Claude.ai:

| Category | Icon | Prompts |
|----------|------|---------|
| Write | `PenLine` | Improve my essay · Send a professional email · Summarize a document · Brainstorm ideas · Write a blog post · Create a cover letter |
| Learn | `GraduationCap` | Summarize my academic papers · Help me make sense of these ideas · Find the best books on a subject · Develop research methodologies · Create learning timelines |
| Code | `Code2` | Review my code · Debug this error · Write unit tests · Explain this code · Suggest optimizations |
| Life stuff | `Smile` | Plan a trip · Create a workout plan · Write a recipe · Help me make a decision · Plan a budget |

Seed inserts only if `prompt_category` table is empty (idempotent).

### Repository Layer

**New file:** `src/lib/db/pg/repositories/prompt-repository.pg.ts`

```typescript
export const pgPromptRepository: PromptRepository = {
  // Public (used by all users)
  selectEnabledCategories(): Promise<PromptCategoryWithItems[]>
  // Returns enabled categories (sequence ASC) with their enabled items (sequence ASC)

  // Admin CRUD — Categories
  selectAllCategories(): Promise<PromptCategory[]>
  insertCategory(data): Promise<PromptCategory>
  updateCategory(id, data): Promise<PromptCategory>
  deleteCategory(id): Promise<void>

  // Admin CRUD — Items
  selectItemsByCategory(categoryId): Promise<PromptItem[]>
  insertItem(data): Promise<PromptItem>
  updateItem(id, data): Promise<PromptItem>
  deleteItem(id): Promise<void>
  reorderItems(items: { id: string; sequence: number }[]): Promise<void>
}
```

**Types** in `src/types/prompt.ts`:
```typescript
export interface PromptCategory {
  id: string; label: string; icon: string;
  sequence: number; enabled: boolean;
  createdAt: Date; updatedAt: Date;
}
export interface PromptItem {
  id: string; categoryId: string; label: string; prompt: string;
  sequence: number; enabled: boolean;
  createdAt: Date; updatedAt: Date;
}
export interface PromptCategoryWithItems extends PromptCategory {
  items: PromptItem[];
}
```

Export `promptRepository` from `src/lib/db/repository.ts`.

### API Layer

#### Public endpoint (all authenticated users)

**`GET /api/prompt-categories`** (`src/app/api/prompt-categories/route.ts`):
- Returns enabled categories with enabled items, ordered by sequence
- Cached for 60 seconds (SWR deduplication handles client-side)
- No auth required beyond session check

#### Admin endpoints

**`src/app/api/admin/prompt-categories/route.ts`**:
- `GET` — all categories (enabled + disabled) for admin table view
- `POST` — create new category

**`src/app/api/admin/prompt-categories/[id]/route.ts`**:
- `PUT` — update category (label, icon, sequence, enabled)
- `DELETE` — delete category (cascades to items)

**`src/app/api/admin/prompt-categories/[id]/items/route.ts`**:
- `GET` — all items for a category
- `POST` — create new item

**`src/app/api/admin/prompt-items/[id]/route.ts`**:
- `PUT` — update item (label, prompt, sequence, enabled)
- `DELETE` — delete item

**`src/app/api/admin/prompt-items/reorder/route.ts`**:
- `POST` — batch update sequence numbers (for drag-to-reorder)
- Body: `{ items: { id: string; sequence: number }[] }`

All admin routes guard with `canEditAdmin()` (or equivalent permission check matching existing admin routes).

---

## UI Components

### `QuickPromptBar` (`src/components/quick-prompt-bar.tsx`)

Client component rendered on the home screen below the `PromptInput`.

**Layout:**
```
[ Write ↓ ]  [ Learn ↓ ]  [ Code ↓ ]  [ Life stuff ↓ ]
```

- Horizontal scrollable flex row, centered
- Each button: `variant="outline"`, small size, shows lucide icon + label + chevron-down
- Buttons hidden on small screens if they overflow (no wrap — scroll horizontally)
- Fetches from `/api/prompt-categories` via `usePromptCategories` hook

**On button click:** Opens a **Popover** (shadcn/ui) anchored to the button, containing the list of prompt items for that category.

**Popover content:**
- List of enabled prompt items as clickable rows
- Each row: just the `label` text (not the full prompt)
- Clicking a row: closes the popover, calls `onPromptSelect(item.prompt)` which injects the full `prompt` text into the chat input

**Only one popover open at a time** — clicking a different category button closes the previous one.

**Loading state:** Skeleton buttons (4 rounded rectangles) while fetching.

**Empty state:** If no enabled categories exist, render nothing (don't show an empty bar).

### Wiring into Home Screen

**`src/components/chat-greeting.tsx`** (or the ChatBot component on the home screen):

The prompt bar appears below the greeting and above (or below) the chat input. Based on Claude's layout: **below the chat input**, centered.

In `src/app/(chat)/page.tsx` (home page), pass an `onPromptSelect` callback to `ChatBot` which calls the existing input setter. Or inject directly via the Zustand store (`appStore`).

**Show condition:** Only render `QuickPromptBar` when:
1. Current route is `/` (home/new chat screen)
2. No messages in the thread yet (`initialMessages.length === 0`)

Once the user sends a message or navigates to an existing thread, the bar disappears.

### `usePromptCategories` Hook (`src/hooks/queries/use-prompt-categories.ts`)

```typescript
function usePromptCategories(): {
  categories: PromptCategoryWithItems[];
  isLoading: boolean;
}
```

SWR fetch from `/api/prompt-categories`. Cache key: `"/api/prompt-categories"`.

---

## Admin Panel — `/admin/prompts`

**New page:** `src/app/(admin)/admin/prompts/page.tsx`

Added to admin sidebar navigation between "Features" and "Plugins".

**Layout:**

Two-column or tabbed layout:
- **Left / top tab:** Categories table
- **Right / bottom tab:** Items for the selected category

### Categories Table

| Label | Icon | Sequence | Enabled | Actions |
|-------|------|----------|---------|---------|
| Write | PenLine | 1 | ✅ | Edit · Delete |
| Learn | GraduationCap | 2 | ✅ | Edit · Delete |
| Code | Code2 | 3 | ✅ | Edit · Delete |
| Life stuff | Smile | 4 | ✅ | Edit · Delete |

- **Add Category** button (top right) → inline form or dialog: label, icon (text input for lucide name), sequence
- **Enable/Disable** toggle in table row (instant PATCH)
- **Delete** with confirmation dialog
- **Edit** opens dialog with current values

### Items Table (shown when a category is selected)

| Label | Prompt (truncated) | Sequence | Enabled | Actions |
|-------|--------------------|----------|---------|---------|
| Improve my essay | Improve my essay. Here is the... | 1 | ✅ | Edit · Delete |

- **Add Item** button → dialog: label + prompt text (textarea), sequence
- **Drag-to-reorder** rows (or sequence number input as simpler alternative) — calls `/api/admin/prompt-items/reorder`
- **Enable/Disable** toggle
- **Delete** with confirmation

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/lib/db/pg/schema.pg.ts` — add PromptCategoryTable, PromptItemTable |
| Generate | `src/lib/db/migrations/pg/0017_*.sql` (or next number) |
| Create | `src/types/prompt.ts` — PromptCategory, PromptItem, PromptCategoryWithItems, PromptRepository |
| Create | `src/lib/db/pg/repositories/prompt-repository.pg.ts` |
| Modify | `src/lib/db/repository.ts` — export promptRepository |
| Create | `src/app/api/prompt-categories/route.ts` — public GET |
| Create | `src/app/api/admin/prompt-categories/route.ts` — admin GET + POST |
| Create | `src/app/api/admin/prompt-categories/[id]/route.ts` — admin PUT + DELETE |
| Create | `src/app/api/admin/prompt-categories/[id]/items/route.ts` — admin GET + POST |
| Create | `src/app/api/admin/prompt-items/[id]/route.ts` — admin PUT + DELETE |
| Create | `src/app/api/admin/prompt-items/reorder/route.ts` — admin POST batch reorder |
| Create | `src/hooks/queries/use-prompt-categories.ts` — SWR hook |
| Create | `src/components/quick-prompt-bar.tsx` — category buttons + popover |
| Modify | `src/app/(chat)/page.tsx` — render QuickPromptBar below input |
| Modify | `src/components/chat-bot.tsx` — accept/handle onPromptSelect or store injection |
| Create | `src/app/(admin)/admin/prompts/page.tsx` — admin CRUD page |
| Modify | `src/app/(admin)/admin/layout.tsx` — add Prompts nav item |

---

## Seed Script

**`scripts/seed-prompts.ts`** — standalone script (or integrated into migration):
- Inserts default 4 categories + 5–6 items each
- Idempotent: skips if `prompt_category` table is non-empty
- Run: `pnpm tsx scripts/seed-prompts.ts`

---

## Out of Scope

- Per-user or per-role prompt customization (future: interview user on signup for role-based suggestions)
- "From Drive" button (explicitly excluded by user)
- Prompt analytics / usage tracking (future)
- AI-generated prompt suggestions in admin (future)
- Drag-to-reorder categories (sequence input field is sufficient for now)

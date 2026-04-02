# Quick Prompt Buttons + Admin Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add configurable quick-prompt buttons (Write, Learn, Code, Life stuff) below the chat input on the home screen — each opens a popover of sub-prompts; clicking one injects the prompt into the chat input. Admins configure categories and items from `/admin/prompts`.

**Architecture:** Two new DB tables (`prompt_category`, `prompt_item`) with cascade delete. A repository with public read and admin CRUD. A public GET endpoint cached via SWR. A `QuickPromptBar` component rendered only when `messages.length === 0`. Admin CRUD page at `/admin/prompts`. Seed script populates defaults (idempotent).

**Tech Stack:** Drizzle ORM + PostgreSQL, Next.js App Router, SWR, shadcn/ui Popover, lucide-react

**Note:** Run this plan **after** the Sidebar Enhancements plan, because both touch `schema.pg.ts`. Migration numbering will auto-increment via `pnpm db:generate`.

---

## File Map

| Action | File |
|--------|------|
| Modify | `src/lib/db/pg/schema.pg.ts` — add PromptCategoryTable + PromptItemTable |
| Generate | `src/lib/db/migrations/pg/0018_*.sql` (or 0019 if sidebar plan ran first) |
| Create | `src/types/prompt.ts` — PromptCategory, PromptItem, PromptCategoryWithItems, PromptRepository |
| Create | `src/lib/db/pg/repositories/prompt-repository.pg.ts` |
| Modify | `src/lib/db/repository.ts` — export promptRepository |
| Create | `src/app/api/prompt-categories/route.ts` — public GET |
| Create | `src/app/api/admin/prompt-categories/route.ts` — admin GET + POST |
| Create | `src/app/api/admin/prompt-categories/[id]/route.ts` — admin PUT + DELETE |
| Create | `src/app/api/admin/prompt-categories/[id]/items/route.ts` — admin GET + POST items |
| Create | `src/app/api/admin/prompt-items/[id]/route.ts` — admin PUT + DELETE item |
| Create | `src/app/api/admin/prompt-items/reorder/route.ts` — admin batch reorder |
| Create | `src/hooks/queries/use-prompt-categories.ts` — SWR hook |
| Create | `src/components/quick-prompt-bar.tsx` — category buttons + popover |
| Modify | `src/components/chat-bot.tsx` — render QuickPromptBar below PromptInput when no messages |
| Create | `src/app/(admin)/admin/prompts/page.tsx` — admin CRUD page |
| Modify | `src/app/(admin)/admin/layout.tsx` — add "Quick Prompts" nav item |
| Create | `scripts/seed-prompts.ts` — idempotent seed script |

---

### Task 1: Add PromptCategoryTable and PromptItemTable to Schema + Migrate

**Files:**
- Modify: `src/lib/db/pg/schema.pg.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/db/pg/repositories/prompt-repository.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("PromptRepository schema tables", () => {
  it("validates that PromptCategoryTable and PromptItemTable types exist", async () => {
    const schema = await import("../schema.pg");
    expect(schema.PromptCategoryTable).toBeDefined();
    expect(schema.PromptItemTable).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/chrisbenson/Documents - Local/GitHub/better-chatbot"
pnpm test src/lib/db/pg/repositories/prompt-repository.test.ts
```

Expected: FAIL — `PromptCategoryTable` is undefined.

- [ ] **Step 3: Add tables to schema.pg.ts**

In `src/lib/db/pg/schema.pg.ts`, append the following **at the very end of the file** (after the last export):

```typescript
// ─── Quick Prompts ────────────────────────────────────────────────────────────

export const PromptCategoryTable = pgTable(
  "prompt_category",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    label: text("label").notNull(),
    icon: text("icon").notNull(),
    sequence: integer("sequence").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("prompt_category_sequence_idx").on(t.sequence)],
);

export const PromptItemTable = pgTable(
  "prompt_item",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => PromptCategoryTable.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    prompt: text("prompt").notNull(),
    sequence: integer("sequence").notNull(),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("prompt_item_category_id_idx").on(t.categoryId)],
);
```

Check that `boolean` and `integer` are already imported at the top of the schema file. They should be — but if `integer` is missing, add it to the Drizzle import line:

```typescript
import { ..., boolean, integer, ... } from "drizzle-orm/pg-core";
```

- [ ] **Step 4: Generate migration**

```bash
pnpm db:generate
```

Expected: Creates a new `0018_*.sql` (or `0019_*.sql` if sidebar plan ran first) with CREATE TABLE statements for `prompt_category` and `prompt_item`.

- [ ] **Step 5: Apply migration**

```bash
pnpm db:migrate
```

Expected: Migration applied with no errors.

- [ ] **Step 6: Run test**

```bash
pnpm test src/lib/db/pg/repositories/prompt-repository.test.ts
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/lib/db/pg/schema.pg.ts src/lib/db/migrations/pg/ src/lib/db/pg/repositories/prompt-repository.test.ts
git commit -m "feat: add PromptCategoryTable and PromptItemTable to schema"
```

---

### Task 2: Create Types — src/types/prompt.ts

**Files:**
- Create: `src/types/prompt.ts`

- [ ] **Step 1: Write failing test**

Add to `src/lib/db/pg/repositories/prompt-repository.test.ts`:

```typescript
describe("Prompt types", () => {
  it("PromptRepository interface is importable from app-types/prompt", async () => {
    // If this import fails, the types file is missing
    const types = await import("../../../../types/prompt");
    expect(types).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test src/lib/db/pg/repositories/prompt-repository.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create src/types/prompt.ts**

Create `src/types/prompt.ts`:

```typescript
export interface PromptCategory {
  id: string;
  label: string;
  icon: string;
  sequence: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptItem {
  id: string;
  categoryId: string;
  label: string;
  prompt: string;
  sequence: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptCategoryWithItems extends PromptCategory {
  items: PromptItem[];
}

export interface PromptRepository {
  // Public read — returns enabled categories with enabled items ordered by sequence
  selectEnabledCategories(): Promise<PromptCategoryWithItems[]>;

  // Admin — categories
  selectAllCategories(): Promise<PromptCategory[]>;
  insertCategory(
    data: Omit<PromptCategory, "id" | "createdAt" | "updatedAt">,
  ): Promise<PromptCategory>;
  updateCategory(
    id: string,
    data: Partial<Omit<PromptCategory, "id" | "createdAt" | "updatedAt">>,
  ): Promise<PromptCategory>;
  deleteCategory(id: string): Promise<void>;

  // Admin — items
  selectItemsByCategory(categoryId: string): Promise<PromptItem[]>;
  insertItem(
    data: Omit<PromptItem, "id" | "createdAt" | "updatedAt">,
  ): Promise<PromptItem>;
  updateItem(
    id: string,
    data: Partial<Omit<PromptItem, "id" | "createdAt" | "updatedAt">>,
  ): Promise<PromptItem>;
  deleteItem(id: string): Promise<void>;
  reorderItems(items: { id: string; sequence: number }[]): Promise<void>;
}
```

- [ ] **Step 4: Run test**

```bash
pnpm test src/lib/db/pg/repositories/prompt-repository.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/prompt.ts src/lib/db/pg/repositories/prompt-repository.test.ts
git commit -m "feat: add PromptRepository types"
```

---

### Task 3: Implement Prompt Repository + Export

**Files:**
- Create: `src/lib/db/pg/repositories/prompt-repository.pg.ts`
- Modify: `src/lib/db/repository.ts`

- [ ] **Step 1: Write failing tests**

Add to `src/lib/db/pg/repositories/prompt-repository.test.ts`:

```typescript
describe("pgPromptRepository", () => {
  it("exports pgPromptRepository with all required methods", async () => {
    const mod = await import("./prompt-repository.pg");
    const repo = mod.pgPromptRepository;
    expect(typeof repo.selectEnabledCategories).toBe("function");
    expect(typeof repo.selectAllCategories).toBe("function");
    expect(typeof repo.insertCategory).toBe("function");
    expect(typeof repo.updateCategory).toBe("function");
    expect(typeof repo.deleteCategory).toBe("function");
    expect(typeof repo.selectItemsByCategory).toBe("function");
    expect(typeof repo.insertItem).toBe("function");
    expect(typeof repo.updateItem).toBe("function");
    expect(typeof repo.deleteItem).toBe("function");
    expect(typeof repo.reorderItems).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test src/lib/db/pg/repositories/prompt-repository.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create prompt-repository.pg.ts**

Create `src/lib/db/pg/repositories/prompt-repository.pg.ts`:

```typescript
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { pgDb as db } from "../db.pg";
import { PromptCategoryTable, PromptItemTable } from "../schema.pg";
import type {
  PromptCategory,
  PromptCategoryWithItems,
  PromptItem,
  PromptRepository,
} from "app-types/prompt";

export const pgPromptRepository: PromptRepository = {
  async selectEnabledCategories(): Promise<PromptCategoryWithItems[]> {
    const categories = await db
      .select()
      .from(PromptCategoryTable)
      .where(eq(PromptCategoryTable.enabled, true))
      .orderBy(asc(PromptCategoryTable.sequence));

    if (categories.length === 0) return [];

    const items = await db
      .select()
      .from(PromptItemTable)
      .where(
        and(
          inArray(
            PromptItemTable.categoryId,
            categories.map((c) => c.id),
          ),
          eq(PromptItemTable.enabled, true),
        ),
      )
      .orderBy(asc(PromptItemTable.sequence));

    return categories.map((category) => ({
      ...category,
      items: items.filter((item) => item.categoryId === category.id),
    }));
  },

  async selectAllCategories(): Promise<PromptCategory[]> {
    return db
      .select()
      .from(PromptCategoryTable)
      .orderBy(asc(PromptCategoryTable.sequence));
  },

  async insertCategory(
    data: Omit<PromptCategory, "id" | "createdAt" | "updatedAt">,
  ): Promise<PromptCategory> {
    const [result] = await db
      .insert(PromptCategoryTable)
      .values(data)
      .returning();
    return result;
  },

  async updateCategory(
    id: string,
    data: Partial<Omit<PromptCategory, "id" | "createdAt" | "updatedAt">>,
  ): Promise<PromptCategory> {
    const [result] = await db
      .update(PromptCategoryTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(PromptCategoryTable.id, id))
      .returning();
    return result;
  },

  async deleteCategory(id: string): Promise<void> {
    await db
      .delete(PromptCategoryTable)
      .where(eq(PromptCategoryTable.id, id));
  },

  async selectItemsByCategory(categoryId: string): Promise<PromptItem[]> {
    return db
      .select()
      .from(PromptItemTable)
      .where(eq(PromptItemTable.categoryId, categoryId))
      .orderBy(asc(PromptItemTable.sequence));
  },

  async insertItem(
    data: Omit<PromptItem, "id" | "createdAt" | "updatedAt">,
  ): Promise<PromptItem> {
    const [result] = await db
      .insert(PromptItemTable)
      .values(data)
      .returning();
    return result;
  },

  async updateItem(
    id: string,
    data: Partial<Omit<PromptItem, "id" | "createdAt" | "updatedAt">>,
  ): Promise<PromptItem> {
    const [result] = await db
      .update(PromptItemTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(PromptItemTable.id, id))
      .returning();
    return result;
  },

  async deleteItem(id: string): Promise<void> {
    await db.delete(PromptItemTable).where(eq(PromptItemTable.id, id));
  },

  async reorderItems(items: { id: string; sequence: number }[]): Promise<void> {
    await Promise.all(
      items.map(({ id, sequence }) =>
        db
          .update(PromptItemTable)
          .set({ sequence, updatedAt: new Date() })
          .where(eq(PromptItemTable.id, id)),
      ),
    );
  },
};
```

- [ ] **Step 4: Export from repository.ts**

In `src/lib/db/repository.ts`, add at the very end of the file:

```typescript
import { pgPromptRepository } from "./pg/repositories/prompt-repository.pg";
export const promptRepository = pgPromptRepository;
```

- [ ] **Step 5: Run tests**

```bash
pnpm test src/lib/db/pg/repositories/prompt-repository.test.ts
```

Expected: PASS — all method-existence checks pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/pg/repositories/prompt-repository.pg.ts src/lib/db/pg/repositories/prompt-repository.test.ts src/lib/db/repository.ts
git commit -m "feat: implement prompt repository and export from repository.ts"
```

---

### Task 4: Create Seed Script + Run It

**Files:**
- Create: `scripts/seed-prompts.ts`

- [ ] **Step 1: Create seed-prompts.ts**

Create `scripts/seed-prompts.ts`:

```typescript
import { pgDb as db } from "../src/lib/db/pg/db.pg";
import {
  PromptCategoryTable,
  PromptItemTable,
} from "../src/lib/db/pg/schema.pg";
import { count } from "drizzle-orm";

const SEED_DATA = [
  {
    label: "Write",
    icon: "PenLine",
    sequence: 1,
    items: [
      { label: "Improve my essay", prompt: "I'd like help improving my essay. Please review it for clarity, structure, and style, then suggest specific improvements.", sequence: 1 },
      { label: "Send a professional email", prompt: "Help me write a professional email. I'll describe the situation and recipient, and you'll draft a clear, polite message.", sequence: 2 },
      { label: "Summarize a document", prompt: "Please summarize the following document. Provide key points, main arguments, and any important conclusions.", sequence: 3 },
      { label: "Brainstorm ideas", prompt: "Help me brainstorm ideas for the following topic. Give me a diverse range of creative and practical suggestions.", sequence: 4 },
      { label: "Write a blog post", prompt: "Help me write a blog post. I'll share the topic and audience, and you'll draft an engaging, well-structured post.", sequence: 5 },
      { label: "Create a cover letter", prompt: "Help me write a cover letter for a job application. I'll share the role and my background, and you'll craft a compelling letter.", sequence: 6 },
    ],
  },
  {
    label: "Learn",
    icon: "GraduationCap",
    sequence: 2,
    items: [
      { label: "Summarize my academic papers", prompt: "Please summarize the following academic paper. Highlight the research question, methodology, key findings, and implications.", sequence: 1 },
      { label: "Help me make sense of these ideas", prompt: "I'm trying to understand some complex ideas. Can you explain them clearly, using analogies where helpful?", sequence: 2 },
      { label: "Find the best books on a subject", prompt: "Recommend the best books on the following subject. Include a mix of introductory and advanced texts with brief descriptions of each.", sequence: 3 },
      { label: "Develop research methodologies", prompt: "Help me develop a research methodology for my project. I'll describe my research question and you'll suggest appropriate methods.", sequence: 4 },
      { label: "Create learning timelines", prompt: "Create a structured learning timeline for mastering the following subject. Include milestones, resources, and estimated time for each phase.", sequence: 5 },
    ],
  },
  {
    label: "Code",
    icon: "Code2",
    sequence: 3,
    items: [
      { label: "Review my code", prompt: "Please review the following code. Look for bugs, performance issues, security vulnerabilities, and style improvements.", sequence: 1 },
      { label: "Debug this error", prompt: "Help me debug this error. I'll share the error message and relevant code, and you'll help identify and fix the issue.", sequence: 2 },
      { label: "Write unit tests", prompt: "Write unit tests for the following code. Cover the main functionality, edge cases, and error scenarios.", sequence: 3 },
      { label: "Explain this code", prompt: "Explain what the following code does. Walk through it step by step, explaining the logic and any important concepts.", sequence: 4 },
      { label: "Suggest optimizations", prompt: "Suggest optimizations for the following code. Focus on performance, readability, and maintainability improvements.", sequence: 5 },
    ],
  },
  {
    label: "Life stuff",
    icon: "Smile",
    sequence: 4,
    items: [
      { label: "Plan a trip", prompt: "Help me plan a trip. I'll share my destination, dates, budget, and interests, and you'll create a detailed itinerary.", sequence: 1 },
      { label: "Create a workout plan", prompt: "Create a workout plan tailored to my goals and fitness level. I'll share my current routine and objectives.", sequence: 2 },
      { label: "Write a recipe", prompt: "Help me write or adapt a recipe. I'll describe the dish and any dietary restrictions, and you'll provide a clear, step-by-step recipe.", sequence: 3 },
      { label: "Help me make a decision", prompt: "Help me think through an important decision. I'll explain the options and context, and you'll help me weigh the pros and cons.", sequence: 4 },
      { label: "Plan a budget", prompt: "Help me create a personal budget. I'll share my income and expenses, and you'll help me build a practical plan to meet my financial goals.", sequence: 5 },
    ],
  },
];

async function seed() {
  const [{ total }] = await db
    .select({ total: count() })
    .from(PromptCategoryTable);

  if (total > 0) {
    console.log(`Skipping seed — prompt_category table already has ${total} rows.`);
    process.exit(0);
  }

  console.log("Seeding prompt categories and items...");

  for (const category of SEED_DATA) {
    const [inserted] = await db
      .insert(PromptCategoryTable)
      .values({
        label: category.label,
        icon: category.icon,
        sequence: category.sequence,
        enabled: true,
      })
      .returning();

    await db.insert(PromptItemTable).values(
      category.items.map((item) => ({
        categoryId: inserted.id,
        label: item.label,
        prompt: item.prompt,
        sequence: item.sequence,
        enabled: true,
      })),
    );

    console.log(`  ✓ ${category.label} (${category.items.length} items)`);
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Run the seed script**

```bash
cd "/Users/chrisbenson/Documents - Local/GitHub/better-chatbot"
pnpm tsx scripts/seed-prompts.ts
```

Expected output:
```
Seeding prompt categories and items...
  ✓ Write (6 items)
  ✓ Learn (5 items)
  ✓ Code (5 items)
  ✓ Life stuff (5 items)
Seed complete.
```

- [ ] **Step 3: Verify seed data**

```bash
pnpm tsx -e "
import { pgDb as db } from './src/lib/db/pg/db.pg';
import { PromptCategoryTable } from './src/lib/db/pg/schema.pg';
import { count } from 'drizzle-orm';
const [r] = await db.select({ total: count() }).from(PromptCategoryTable);
console.log('Categories:', r.total);
process.exit(0);
"
```

Expected: `Categories: 4`

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-prompts.ts
git commit -m "feat: add idempotent seed script for default prompt categories"
```

---

### Task 5: Public API — GET /api/prompt-categories

**Files:**
- Create: `src/app/api/prompt-categories/route.ts`

- [ ] **Step 1: Write failing test**

Create `src/app/api/prompt-categories/route.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("GET /api/prompt-categories", () => {
  it("exports a GET handler", async () => {
    const mod = await import("./route");
    expect(typeof mod.GET).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test src/app/api/prompt-categories/route.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create the route**

Create `src/app/api/prompt-categories/route.ts`:

```typescript
import { getSession } from "auth/server";
import { promptRepository } from "lib/db/repository";

export async function GET() {
  const session = await getSession();

  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await promptRepository.selectEnabledCategories();
  return Response.json(categories);
}
```

- [ ] **Step 4: Run test**

```bash
pnpm test src/app/api/prompt-categories/route.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/prompt-categories/route.ts src/app/api/prompt-categories/route.test.ts
git commit -m "feat: add public GET /api/prompt-categories endpoint"
```

---

### Task 6: Admin API Routes — Categories + Items CRUD

**Files:**
- Create: `src/app/api/admin/prompt-categories/route.ts`
- Create: `src/app/api/admin/prompt-categories/[id]/route.ts`
- Create: `src/app/api/admin/prompt-categories/[id]/items/route.ts`
- Create: `src/app/api/admin/prompt-items/[id]/route.ts`
- Create: `src/app/api/admin/prompt-items/reorder/route.ts`

- [ ] **Step 1: Create admin categories GET + POST**

Create `src/app/api/admin/prompt-categories/route.ts`:

```typescript
import { getSession } from "auth/server";
import { promptRepository } from "lib/db/repository";
import { z } from "zod";

const CreateCategorySchema = z.object({
  label: z.string().min(1).max(100),
  icon: z.string().min(1).max(100),
  sequence: z.number().int().min(0),
  enabled: z.boolean().optional().default(true),
});

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  // Admin check — role must be "admin" or "super_admin"
  const role = (session.user as any).role as string | undefined;
  if (role !== "admin" && role !== "super_admin") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const categories = await promptRepository.selectAllCategories();
  return Response.json(categories);
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const data = CreateCategorySchema.parse(body);
    const category = await promptRepository.insertCategory(data);
    return Response.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid input", details: error.message }, { status: 400 });
    }
    console.error("Error creating category:", error);
    return Response.json({ error: "Failed to create category" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create admin category PUT + DELETE**

Create `src/app/api/admin/prompt-categories/[id]/route.ts`:

```typescript
import { getSession } from "auth/server";
import { promptRepository } from "lib/db/repository";
import { z } from "zod";

const UpdateCategorySchema = z.object({
  label: z.string().min(1).max(100).optional(),
  icon: z.string().min(1).max(100).optional(),
  sequence: z.number().int().min(0).optional(),
  enabled: z.boolean().optional(),
});

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const role = (session.user as any).role as string | undefined;
  if (role !== "admin" && role !== "super_admin") return null;
  return session;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const body = await request.json();
    const data = UpdateCategorySchema.parse(body);
    const category = await promptRepository.updateCategory(id, data);
    return Response.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid input", details: error.message }, { status: 400 });
    }
    console.error("Error updating category:", error);
    return Response.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  await promptRepository.deleteCategory(id);
  return new Response(null, { status: 204 });
}
```

- [ ] **Step 3: Create admin items GET + POST for a category**

Create `src/app/api/admin/prompt-categories/[id]/items/route.ts`:

```typescript
import { getSession } from "auth/server";
import { promptRepository } from "lib/db/repository";
import { z } from "zod";

const CreateItemSchema = z.object({
  label: z.string().min(1).max(200),
  prompt: z.string().min(1),
  sequence: z.number().int().min(0),
  enabled: z.boolean().optional().default(true),
});

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const role = (session.user as any).role as string | undefined;
  if (role !== "admin" && role !== "super_admin") return null;
  return session;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const items = await promptRepository.selectItemsByCategory(id);
  return Response.json(items);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id: categoryId } = await params;

  try {
    const body = await request.json();
    const data = CreateItemSchema.parse(body);
    const item = await promptRepository.insertItem({ ...data, categoryId });
    return Response.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid input", details: error.message }, { status: 400 });
    }
    console.error("Error creating item:", error);
    return Response.json({ error: "Failed to create item" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create admin item PUT + DELETE**

Create `src/app/api/admin/prompt-items/[id]/route.ts`:

```typescript
import { getSession } from "auth/server";
import { promptRepository } from "lib/db/repository";
import { z } from "zod";

const UpdateItemSchema = z.object({
  label: z.string().min(1).max(200).optional(),
  prompt: z.string().min(1).optional(),
  sequence: z.number().int().min(0).optional(),
  enabled: z.boolean().optional(),
});

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const role = (session.user as any).role as string | undefined;
  if (role !== "admin" && role !== "super_admin") return null;
  return session;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const body = await request.json();
    const data = UpdateItemSchema.parse(body);
    const item = await promptRepository.updateItem(id, data);
    return Response.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid input", details: error.message }, { status: 400 });
    }
    console.error("Error updating item:", error);
    return Response.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  await promptRepository.deleteItem(id);
  return new Response(null, { status: 204 });
}
```

- [ ] **Step 5: Create batch reorder endpoint**

Create `src/app/api/admin/prompt-items/reorder/route.ts`:

```typescript
import { getSession } from "auth/server";
import { promptRepository } from "lib/db/repository";
import { z } from "zod";

const ReorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      sequence: z.number().int().min(0),
    }),
  ),
});

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const role = (session.user as any).role as string | undefined;
  if (role !== "admin" && role !== "super_admin") return null;
  return session;
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const { items } = ReorderSchema.parse(body);
    await promptRepository.reorderItems(items);
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "Invalid input", details: error.message }, { status: 400 });
    }
    console.error("Error reordering items:", error);
    return Response.json({ error: "Failed to reorder items" }, { status: 500 });
  }
}
```

- [ ] **Step 6: Verify TypeScript compiles for all new routes**

```bash
pnpm tsc --noEmit 2>&1 | grep -E "admin/prompt" | head -20
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/admin/prompt-categories/ src/app/api/admin/prompt-items/ src/app/api/prompt-categories/
git commit -m "feat: add admin CRUD API routes for prompt categories and items"
```

---

### Task 7: SWR Hook — usePromptCategories

**Files:**
- Create: `src/hooks/queries/use-prompt-categories.ts`

- [ ] **Step 1: Write failing test**

Create `src/hooks/queries/use-prompt-categories.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("usePromptCategories", () => {
  it("exports usePromptCategories function", async () => {
    const mod = await import("./use-prompt-categories");
    expect(typeof mod.usePromptCategories).toBe("function");
  });

  it("exports useAdminPromptCategories function", async () => {
    const mod = await import("./use-prompt-categories");
    expect(typeof mod.useAdminPromptCategories).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test src/hooks/queries/use-prompt-categories.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create use-prompt-categories.ts**

Create `src/hooks/queries/use-prompt-categories.ts`:

```typescript
"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { fetcher } from "lib/utils";
import type { PromptCategory, PromptCategoryWithItems, PromptItem } from "app-types/prompt";
import { handleErrorWithToast } from "ui/shared-toast";

export function usePromptCategories() {
  const { data, isLoading } = useSWR<PromptCategoryWithItems[]>(
    "/api/prompt-categories",
    fetcher,
    {
      fallbackData: [],
      revalidateOnFocus: false,
      onError: handleErrorWithToast,
    },
  );

  return {
    categories: data ?? [],
    isLoading,
  };
}

export function useAdminPromptCategories() {
  const { data, isLoading, mutate } = useSWR<PromptCategory[]>(
    "/api/admin/prompt-categories",
    fetcher,
    {
      fallbackData: [],
      revalidateOnFocus: true,
      onError: handleErrorWithToast,
    },
  );

  return { categories: data ?? [], isLoading, mutate };
}

export function useAdminPromptItems(categoryId: string | null) {
  const { data, isLoading, mutate } = useSWR<PromptItem[]>(
    categoryId ? `/api/admin/prompt-categories/${categoryId}/items` : null,
    fetcher,
    {
      fallbackData: [],
      revalidateOnFocus: false,
      onError: handleErrorWithToast,
    },
  );

  return { items: data ?? [], isLoading, mutate };
}

export async function revalidatePromptCategories() {
  await Promise.all([
    globalMutate("/api/prompt-categories"),
    globalMutate("/api/admin/prompt-categories"),
  ]);
}
```

- [ ] **Step 4: Run test**

```bash
pnpm test src/hooks/queries/use-prompt-categories.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/queries/use-prompt-categories.ts src/hooks/queries/use-prompt-categories.test.ts
git commit -m "feat: add usePromptCategories SWR hooks"
```

---

### Task 8: Create QuickPromptBar Component

**Files:**
- Create: `src/components/quick-prompt-bar.tsx`

- [ ] **Step 1: Write failing test**

Create `src/components/quick-prompt-bar.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";

describe("QuickPromptBar", () => {
  it("exports QuickPromptBar component", async () => {
    const mod = await import("./quick-prompt-bar");
    expect(typeof mod.QuickPromptBar).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test src/components/quick-prompt-bar.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create quick-prompt-bar.tsx**

Create `src/components/quick-prompt-bar.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button } from "ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { usePromptCategories } from "@/hooks/queries/use-prompt-categories";
import { cn } from "lib/utils";
import type { PromptCategoryWithItems } from "app-types/prompt";

interface QuickPromptBarProps {
  onPromptSelect: (prompt: string) => void;
}

function CategoryIcon({ iconName }: { iconName: string }) {
  const Icon = (LucideIcons as any)[iconName];
  if (!Icon) return null;
  return <Icon className="size-3.5 shrink-0" />;
}

function CategoryPopover({
  category,
  isOpen,
  onOpenChange,
  onSelect,
}: {
  category: PromptCategoryWithItems;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (prompt: string) => void;
}) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5 text-xs font-medium shrink-0",
            isOpen && "bg-accent",
          )}
        >
          <CategoryIcon iconName={category.icon} />
          {category.label}
          <ChevronDown className="size-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-1"
        align="start"
        side="top"
        sideOffset={8}
      >
        <div className="space-y-0.5">
          {category.items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item.prompt);
                onOpenChange(false);
              }}
              className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function QuickPromptBar({ onPromptSelect }: QuickPromptBarProps) {
  const { categories, isLoading } = usePromptCategories();
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 justify-center flex-wrap px-4 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-24 rounded-md bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="flex items-center gap-2 justify-center flex-wrap px-4 py-2">
      {categories.map((category) => (
        <CategoryPopover
          key={category.id}
          category={category}
          isOpen={openCategoryId === category.id}
          onOpenChange={(open) =>
            setOpenCategoryId(open ? category.id : null)
          }
          onSelect={onPromptSelect}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test**

```bash
pnpm test src/components/quick-prompt-bar.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/quick-prompt-bar.tsx src/components/quick-prompt-bar.test.tsx
git commit -m "feat: add QuickPromptBar component with category buttons and prompt popover"
```

---

### Task 9: Wire QuickPromptBar into ChatBot

**Files:**
- Modify: `src/components/chat-bot.tsx`

- [ ] **Step 1: Add QuickPromptBar to ChatBot**

Open `src/components/chat-bot.tsx`.

Add import after the existing imports (around line 52):

```typescript
import { QuickPromptBar } from "./quick-prompt-bar";
```

Find the `emptyMessage` check — search the file for `emptyMessage`. It is the variable/condition used to show `<ChatGreeting />`. Look for where it is defined (likely `const emptyMessage = messages.length === 0` or similar).

Find the `PromptInput` block (lines ~510–519):

```tsx
            <PromptInput
              input={input}
              threadId={threadId}
              sendMessage={sendMessage}
              setInput={setInput}
              isLoading={isLoading || isPendingToolCall}
              onStop={stop}
              onFocus={isFirstTime ? undefined : handleFocus}
              projectName={projectName}
            />
```

Add `QuickPromptBar` immediately after the closing `/>` of `PromptInput`, still inside the parent `<div>` (before the closing `</div>` at line ~520):

```tsx
            <PromptInput
              input={input}
              threadId={threadId}
              sendMessage={sendMessage}
              setInput={setInput}
              isLoading={isLoading || isPendingToolCall}
              onStop={stop}
              onFocus={isFirstTime ? undefined : handleFocus}
              projectName={projectName}
            />
            {messages.length === 0 && (
              <QuickPromptBar onPromptSelect={setInput} />
            )}
```

**Note:** Use `messages` from `useChat` (not `initialMessages` from props) so the bar hides immediately after the user sends their first message.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit 2>&1 | grep -E "chat-bot" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/chat-bot.tsx
git commit -m "feat: render QuickPromptBar below chat input on new chat screen"
```

---

### Task 10: Create Admin Prompts Page

**Files:**
- Create: `src/app/(admin)/admin/prompts/page.tsx`

- [ ] **Step 1: Write failing test**

Create `src/app/(admin)/admin/prompts/page.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";

describe("/admin/prompts page", () => {
  it("exports a default component", async () => {
    const mod = await import("./page");
    expect(typeof mod.default).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test "src/app/(admin)/admin/prompts/page.test.tsx"
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create the admin prompts page**

Create `src/app/(admin)/admin/prompts/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { mutate } from "swr";
import {
  useAdminPromptCategories,
  useAdminPromptItems,
  revalidatePromptCategories,
} from "@/hooks/queries/use-prompt-categories";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Badge } from "ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { Textarea } from "ui/textarea";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, ChevronRight } from "lucide-react";
import type { PromptCategory, PromptItem } from "app-types/prompt";

// ─── Category Form Dialog ────────────────────────────────────────────────────

function CategoryDialog({
  open,
  onClose,
  category,
}: {
  open: boolean;
  onClose: () => void;
  category?: PromptCategory;
}) {
  const isEdit = !!category;
  const [label, setLabel] = useState(category?.label ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "");
  const [sequence, setSequence] = useState(category?.sequence ?? 1);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!label.trim() || !icon.trim()) {
      toast.error("Label and icon are required");
      return;
    }
    setSaving(true);
    try {
      const url = isEdit
        ? `/api/admin/prompt-categories/${category!.id}`
        : "/api/admin/prompt-categories";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, icon, sequence, enabled: true }),
      });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? "Category updated" : "Category created");
      await revalidatePromptCategories();
      onClose();
    } catch {
      toast.error("Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Label</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Write" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Icon (lucide name)</label>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="PenLine" />
            <p className="text-xs text-muted-foreground mt-1">Use a valid lucide-react icon name, e.g. PenLine, Code2, Smile</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Sequence</label>
            <Input
              type="number"
              value={sequence}
              onChange={(e) => setSequence(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Item Form Dialog ────────────────────────────────────────────────────────

function ItemDialog({
  open,
  onClose,
  categoryId,
  item,
}: {
  open: boolean;
  onClose: () => void;
  categoryId: string;
  item?: PromptItem;
}) {
  const isEdit = !!item;
  const [label, setLabel] = useState(item?.label ?? "");
  const [prompt, setPrompt] = useState(item?.prompt ?? "");
  const [sequence, setSequence] = useState(item?.sequence ?? 1);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!label.trim() || !prompt.trim()) {
      toast.error("Label and prompt are required");
      return;
    }
    setSaving(true);
    try {
      const url = isEdit
        ? `/api/admin/prompt-items/${item!.id}`
        : `/api/admin/prompt-categories/${categoryId}/items`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, prompt, sequence, enabled: true }),
      });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? "Item updated" : "Item created");
      await mutate(`/api/admin/prompt-categories/${categoryId}/items`);
      await revalidatePromptCategories();
      onClose();
    } catch {
      toast.error("Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Prompt" : "Add Prompt"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Label</label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Improve my essay" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Prompt text (injected into chat)</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="I'd like help improving my essay..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Sequence</label>
            <Input
              type="number"
              value={sequence}
              onChange={(e) => setSequence(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PromptsAdminPage() {
  const { categories, isLoading } = useAdminPromptCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const { items, isLoading: itemsLoading } = useAdminPromptItems(selectedCategoryId);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PromptCategory | undefined>();
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PromptItem | undefined>();

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const handleDeleteCategory = async (category: PromptCategory) => {
    if (!confirm(`Delete category "${category.label}" and all its prompts?`)) return;
    try {
      await fetch(`/api/admin/prompt-categories/${category.id}`, { method: "DELETE" });
      toast.success("Category deleted");
      if (selectedCategoryId === category.id) setSelectedCategoryId(null);
      await revalidatePromptCategories();
    } catch {
      toast.error("Failed to delete category");
    }
  };

  const handleToggleCategory = async (category: PromptCategory) => {
    try {
      await fetch(`/api/admin/prompt-categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !category.enabled }),
      });
      await revalidatePromptCategories();
    } catch {
      toast.error("Failed to update category");
    }
  };

  const handleDeleteItem = async (item: PromptItem) => {
    if (!confirm(`Delete prompt "${item.label}"?`)) return;
    try {
      await fetch(`/api/admin/prompt-items/${item.id}`, { method: "DELETE" });
      toast.success("Prompt deleted");
      await mutate(`/api/admin/prompt-categories/${selectedCategoryId}/items`);
      await revalidatePromptCategories();
    } catch {
      toast.error("Failed to delete prompt");
    }
  };

  const handleToggleItem = async (item: PromptItem) => {
    try {
      await fetch(`/api/admin/prompt-items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !item.enabled }),
      });
      await mutate(`/api/admin/prompt-categories/${selectedCategoryId}/items`);
      await revalidatePromptCategories();
    } catch {
      toast.error("Failed to update prompt");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Quick Prompts</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure the prompt suggestion buttons shown on the home screen.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Panel */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h2 className="text-sm font-medium text-zinc-300">Categories</h2>
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:text-zinc-100"
              onClick={() => {
                setEditingCategory(undefined);
                setCategoryDialogOpen(true);
              }}
            >
              <Plus className="size-3.5 mr-1" />
              Add
            </Button>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-zinc-800 rounded animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">No categories yet.</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-800 transition-colors ${
                    selectedCategoryId === cat.id ? "bg-zinc-800" : ""
                  }`}
                  onClick={() => setSelectedCategoryId(cat.id)}
                >
                  <ChevronRight className="size-3.5 text-zinc-500 shrink-0" />
                  <span className="flex-1 text-sm text-zinc-200">{cat.label}</span>
                  <span className="text-xs text-zinc-500">{cat.icon}</span>
                  <Badge
                    variant={cat.enabled ? "default" : "secondary"}
                    className="text-xs cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCategory(cat);
                    }}
                  >
                    {cat.enabled ? "On" : "Off"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-zinc-400 hover:text-zinc-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCategory(cat);
                      setCategoryDialogOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-zinc-400 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Items Panel */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h2 className="text-sm font-medium text-zinc-300">
              {selectedCategory ? `Prompts — ${selectedCategory.label}` : "Prompts"}
            </h2>
            {selectedCategoryId && (
              <Button
                size="sm"
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:text-zinc-100"
                onClick={() => {
                  setEditingItem(undefined);
                  setItemDialogOpen(true);
                }}
              >
                <Plus className="size-3.5 mr-1" />
                Add
              </Button>
            )}
          </div>

          {!selectedCategoryId ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              Select a category to manage its prompts.
            </div>
          ) : itemsLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-zinc-800 rounded animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">No prompts yet.</div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200">{item.label}</p>
                    <p className="text-xs text-zinc-500 truncate">{item.prompt}</p>
                  </div>
                  <Badge
                    variant={item.enabled ? "default" : "secondary"}
                    className="text-xs cursor-pointer shrink-0"
                    onClick={() => handleToggleItem(item)}
                  >
                    {item.enabled ? "On" : "Off"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-zinc-400 hover:text-zinc-100 shrink-0"
                    onClick={() => {
                      setEditingItem(item);
                      setItemDialogOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-zinc-400 hover:text-destructive shrink-0"
                    onClick={() => handleDeleteItem(item)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CategoryDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        category={editingCategory}
      />

      {selectedCategoryId && (
        <ItemDialog
          open={itemDialogOpen}
          onClose={() => setItemDialogOpen(false)}
          categoryId={selectedCategoryId}
          item={editingItem}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test**

```bash
pnpm test "src/app/(admin)/admin/prompts/page.test.tsx"
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "src/app/(admin)/admin/prompts/"
git commit -m "feat: add admin CRUD page for quick prompt categories and items"
```

---

### Task 11: Add "Quick Prompts" to Admin Nav

**Files:**
- Modify: `src/app/(admin)/admin/layout.tsx`

- [ ] **Step 1: Add nav item**

In `src/app/(admin)/admin/layout.tsx`, find the `navItems` array. Add the following entry after the Tenants entry (after the closing `}` of the Tenants item, before the closing `]`):

```typescript
  {
    href: "/admin/prompts",
    label: "Quick Prompts",
    icon: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z",
  },
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit 2>&1 | grep -E "admin/layout" | head -10
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(admin\)/admin/layout.tsx
git commit -m "feat: add Quick Prompts nav item to admin sidebar"
```

---

### Final: TypeScript Check + Push + PR

- [ ] **Step 1: Run full TypeScript check**

```bash
pnpm tsc --noEmit 2>&1 | grep -v "node_modules" | head -40
```

Expected: No new errors beyond the 180 pre-existing upstream errors.

- [ ] **Step 2: Run full test suite**

```bash
pnpm test 2>&1 | tail -20
```

Expected: All existing 336 tests plus new tests pass.

- [ ] **Step 3: Push and create PR**

```bash
git push origin claude/platform-architecture-planning-h1crR
gh pr create --repo csbenson001/better-chatbot \
  --title "feat: quick prompt buttons + admin config" \
  --body "$(cat <<'EOF'
## Summary
- New PromptCategory and PromptItem DB tables with cascade delete
- Seed data: Write / Learn / Code / Life stuff with Claude.ai default prompts
- QuickPromptBar component on home screen (disappears after first message)
- Each category button opens a popover of sub-prompts; clicking injects into chat input
- Admin CRUD at /admin/prompts for full category + item management
- Enable/disable toggle per category and item

## Test plan
- [ ] On new chat screen, see 4 category buttons below the input
- [ ] Click "Write" → popover shows 6 prompt options
- [ ] Click "Improve my essay" → text injected into chat input, popover closes
- [ ] Send a message → QuickPromptBar disappears
- [ ] Navigate to /admin/prompts → see category list
- [ ] Add/edit/delete a category → changes reflected in sidebar
- [ ] Toggle a category off → button disappears from home screen
- [ ] Add/edit/delete a prompt item within a category
- [ ] Run `pnpm tsx scripts/seed-prompts.ts` on fresh DB → inserts 4 categories + 21 items

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

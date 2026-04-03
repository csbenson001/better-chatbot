import { and, asc, eq, inArray } from "drizzle-orm";
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
    await db.delete(PromptCategoryTable).where(eq(PromptCategoryTable.id, id));
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
    const [result] = await db.insert(PromptItemTable).values(data).returning();
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

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

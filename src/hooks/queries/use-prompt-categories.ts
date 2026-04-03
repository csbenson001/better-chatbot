"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { fetcher } from "lib/utils";
import type {
  PromptCategory,
  PromptCategoryWithItems,
  PromptItem,
} from "app-types/prompt";
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

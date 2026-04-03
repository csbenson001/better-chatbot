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

      // For agent/workflow/mcp: update their list caches
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
                item.id === id
                  ? { ...item, isBookmarked: !isBookmarked }
                  : item,
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

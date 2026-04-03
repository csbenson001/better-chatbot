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
import { useDebouncedValue } from "@/hooks/use-debounce";
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

function getKey(
  pageIndex: number,
  previousPageData: ChatsResponse | null,
  search: string,
) {
  if (previousPageData && previousPageData.threads.length === 0) return null;
  return `/api/chats?page=${pageIndex + 1}&limit=${PAGE_SIZE}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
}

export default function ChatsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const { starredThreads } = useStarred();
  const starredIds = new Set(starredThreads.map((t) => t.id));

  const { data, setSize, isLoading, isValidating } =
    useSWRInfinite<ChatsResponse>(
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

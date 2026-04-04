"use client";
import { useState } from "react";
import Link from "next/link";
import { generateUUID } from "lib/utils";
import { formatTimeAgo } from "lib/date-utils";
import { MessageSquareIcon, PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "ui/button";
import { Input } from "ui/input";

interface ProjectThread {
  id: string;
  title: string;
  createdAt: Date;
}

interface ProjectChatListProps {
  threads: ProjectThread[];
  projectId: string;
}

export function ProjectChatList({ threads, projectId }: ProjectChatListProps) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? threads.filter((t) =>
        (t.title || "Untitled Chat")
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : threads;

  const newChatHref = `/chat/${generateUUID()}?projectId=${projectId}`;

  return (
    <div className="flex flex-col gap-3 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Chats
        </h2>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" asChild>
          <Link href={newChatHref}>
            <PlusIcon className="size-3" />
            New chat
          </Link>
        </Button>
      </div>

      {threads.length > 4 && (
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/50" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats..."
            className="pl-8 h-8 text-xs"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquareIcon className="size-8 text-muted-foreground/30 mb-2" />
          <p className="text-muted-foreground text-sm">
            {search ? "No chats match your search" : "No chats yet"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border/50 rounded-lg border border-border/50 overflow-hidden">
          {filtered.map((thread) => (
            <Link
              key={thread.id}
              href={`/chat/${thread.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-accent/40 transition-colors"
            >
              <span className="font-medium text-sm truncate">
                {thread.title || "Untitled Chat"}
              </span>
              <span className="text-xs text-muted-foreground shrink-0 ml-4">
                {formatTimeAgo(new Date(thread.createdAt))}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

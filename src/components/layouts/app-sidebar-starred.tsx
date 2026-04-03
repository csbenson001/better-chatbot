"use client";

import Link from "next/link";
import { Star, MessageSquare, FolderIcon, Loader } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
} from "ui/sidebar";
import { useStarred } from "@/hooks/queries/use-starred";
import { useBookmark } from "@/hooks/queries/use-bookmark";
import { Button } from "ui/button";

export function AppSidebarStarred() {
  const { starredThreads, starredProjects, isLoading } = useStarred();
  const { toggleBookmark: toggleThread, isLoading: isUnstarringThread } =
    useBookmark({ itemType: "thread" });
  const { toggleBookmark: toggleProject, isLoading: isUnstarringProject } =
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
                  <div
                    key={project.id}
                    className="group/starred-item flex items-center"
                  >
                    <SidebarMenuButton asChild>
                      <Link
                        href={`/projects/${project.id}`}
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <FolderIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm">{project.name}</span>
                      </Link>
                    </SidebarMenuButton>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 opacity-0 group-hover/starred-item:opacity-100 transition-opacity shrink-0"
                      onClick={() =>
                        toggleProject({ id: project.id, isBookmarked: true })
                      }
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
                  <div
                    key={thread.id}
                    className="group/starred-item flex items-center"
                  >
                    <SidebarMenuButton asChild>
                      <Link
                        href={`/chat/${thread.id}`}
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm">
                          {thread.title || "Untitled"}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 opacity-0 group-hover/starred-item:opacity-100 transition-opacity shrink-0"
                      onClick={() =>
                        toggleThread({ id: thread.id, isBookmarked: true })
                      }
                      disabled={isUnstarringThread(thread.id)}
                    >
                      {isUnstarringThread(thread.id) ? (
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

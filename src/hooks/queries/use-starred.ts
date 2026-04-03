"use client";

import useSWR from "swr";
import { fetcher } from "lib/utils";

export interface StarredThread {
  id: string;
  title: string;
  createdAt: string;
}

export interface StarredProject {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useStarred() {
  const { data, isLoading, mutate } = useSWR<{
    threads: StarredThread[];
    projects: StarredProject[];
  }>("/api/starred", fetcher, {
    fallbackData: { threads: [], projects: [] },
    revalidateOnFocus: false,
  });

  return {
    starredThreads: data?.threads ?? [],
    starredProjects: data?.projects ?? [],
    isLoading,
    mutate,
  };
}

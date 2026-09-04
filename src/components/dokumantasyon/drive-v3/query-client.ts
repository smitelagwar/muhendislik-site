// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — QUERY CLIENT & SERVER STATE MOTORU
// ============================================================================

"use client";

import React from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { DokFile, DokFolder, DokBreadcrumbItem } from "@/lib/dokumantasyon/types";

export type DokItemsResponse = {
  folder: DokFolder | null;
  breadcrumbs: DokBreadcrumbItem[];
  folders: DokFolder[];
  files: DokFile[];
  summary?: {
    totalFiles?: number;
    totalSizeBytes?: number;
    starredCount?: number;
  };
};

export const dokQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export function DokQueryProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(QueryClientProvider, { client: dokQueryClient }, children);
}

export type DokItemsKeyParams = {
  collection?: string;
  type?: string;
  date?: string;
  size?: string;
  sortBy?: string;
  sortOrder?: string;
};

export const dokKeys = {
  all: ["dok-items"] as const,
  items: (folderId: string | null, params: DokItemsKeyParams) =>
    [
      "dok-items",
      folderId ?? "root",
      params.collection ?? "none",
      params.type ?? "all",
      params.date ?? "all",
      params.size ?? "all",
      params.sortBy ?? "name",
      params.sortOrder ?? "asc",
    ] as const,
};

export async function fetchDokItems(
  folderId: string | null,
  queryParams: Record<string, string>,
  signal?: AbortSignal
): Promise<DokItemsResponse> {
  const url = new URL("/api/dokumantasyon/items", typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  if (folderId) url.searchParams.set("folderId", folderId);
  for (const [k, v] of Object.entries(queryParams)) {
    if (v && v !== "all" && v !== "none") url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const err = new Error(errorData.error || "Dosyalar listelenemedi.");
    (err as unknown as { status: number; code?: string }).status = res.status;
    (err as unknown as { status: number; code?: string }).code = errorData.code;
    throw err;
  }
  return res.json();
}

export function useDokItemsQuery({
  folderId,
  collection = "none",
  typeFilter = "all",
  dateFilter = "all",
  sizeFilter = "all",
  sortBy = "name",
  sortOrder = "asc",
  enabled = true,
}: {
  folderId: string | null;
  collection?: string;
  typeFilter?: string;
  dateFilter?: string;
  sizeFilter?: string;
  sortBy?: string;
  sortOrder?: string;
  enabled?: boolean;
}) {
  const keyParams: DokItemsKeyParams = {
    collection,
    type: typeFilter,
    date: dateFilter,
    size: sizeFilter,
    sortBy,
    sortOrder,
  };
  const queryKey = dokKeys.items(folderId, keyParams);

  return useQuery({
    queryKey,
    queryFn: ({ signal }) => {
      const queryParams: Record<string, string> = {};
      if (collection && collection !== "none") queryParams.collection = collection;
      if (typeFilter && typeFilter !== "all") queryParams.type = typeFilter;
      if (dateFilter && dateFilter !== "all") queryParams.date = dateFilter;
      if (sizeFilter && sizeFilter !== "all") queryParams.size = sizeFilter;
      if (sortBy) queryParams.sortBy = sortBy;
      if (sortOrder) queryParams.sortOrder = sortOrder;
      return fetchDokItems(folderId, queryParams, signal);
    },
    enabled,
  });
}

// ============================================================================
// MUTATION SCOPE COORDINATOR (CONCURRENCY PROTECTION)
// ============================================================================

const activeMutationScopes = new Set<string>();

export function acquireMutationScope(scope: string): boolean {
  if (activeMutationScopes.has(scope)) return false;
  activeMutationScopes.add(scope);
  return true;
}

export function releaseMutationScope(scope: string): void {
  activeMutationScopes.delete(scope);
}

// ============================================================================
// OPTIMISTIC CACHE MANIPULATORS (NO F5 ARCHITECTURE)
// ============================================================================

export function insertPendingFolderInCache(
  client: QueryClient,
  queryKey: readonly unknown[],
  pendingFolder: DokFolder
) {
  client.setQueryData<DokItemsResponse>(queryKey, (old) => {
    if (!old) return old;
    return {
      ...old,
      folders: [...old.folders, pendingFolder],
    };
  });
}

export function replacePendingFolderInCache(
  client: QueryClient,
  queryKey: readonly unknown[],
  tempId: string,
  serverFolder: DokFolder
) {
  client.setQueryData<DokItemsResponse>(queryKey, (old) => {
    if (!old) return old;
    return {
      ...old,
      folders: old.folders.map((f) => (f.id === tempId ? serverFolder : f)),
    };
  });
}

export function removePendingFolderFromCache(
  client: QueryClient,
  queryKey: readonly unknown[],
  tempId: string
) {
  client.setQueryData<DokItemsResponse>(queryKey, (old) => {
    if (!old) return old;
    return {
      ...old,
      folders: old.folders.filter((f) => f.id !== tempId),
    };
  });
}

export function updateItemNameInCache(
  client: QueryClient,
  queryKey: readonly unknown[],
  id: string,
  type: "file" | "folder",
  newName: string
) {
  client.setQueryData<DokItemsResponse>(queryKey, (old) => {
    if (!old) return old;
    if (type === "folder") {
      return {
        ...old,
        folders: old.folders.map((f) => (f.id === id ? { ...f, name: newName, updated_at: new Date().toISOString() } : f)),
      };
    } else {
      return {
        ...old,
        files: old.files.map((f) => (f.id === id ? { ...f, display_name: newName, updated_at: new Date().toISOString() } : f)),
      };
    }
  });
}

export function updateItemStarInCache(
  client: QueryClient,
  queryKey: readonly unknown[],
  id: string,
  type: "file" | "folder",
  isStarred: boolean
) {
  const starredAt = isStarred ? new Date().toISOString() : null;
  client.setQueryData<DokItemsResponse>(queryKey, (old) => {
    if (!old) return old;
    const currentStarred = old.summary?.starredCount || 0;
    const newStarredCount = Math.max(0, currentStarred + (isStarred ? 1 : -1));

    if (type === "folder") {
      return {
        ...old,
        folders: old.folders.map((f) => (f.id === id ? { ...f, starred_at: starredAt } : f)),
        summary: { ...old.summary, starredCount: newStarredCount },
      };
    } else {
      return {
        ...old,
        files: old.files.map((f) => (f.id === id ? { ...f, starred_at: starredAt } : f)),
        summary: { ...old.summary, starredCount: newStarredCount },
      };
    }
  });
}

export function insertUploadedFileInCache(
  client: QueryClient,
  queryKey: readonly unknown[],
  file: DokFile
) {
  client.setQueryData<DokItemsResponse>(queryKey, (old) => {
    if (!old) return old;
    const exists = old.files.some((f) => f.id === file.id);
    if (exists) return old;
    return {
      ...old,
      files: [...old.files, file],
      summary: {
        ...old.summary,
        totalFiles: (old.summary?.totalFiles || old.files.length) + 1,
        totalSizeBytes: (old.summary?.totalSizeBytes || 0) + Number(file.size_bytes || 0),
      },
    };
  });
}

export function removeItemsFromCache(
  client: QueryClient,
  queryKey: readonly unknown[],
  deletedIds: Set<string>
) {
  client.setQueryData<DokItemsResponse>(queryKey, (old) => {
    if (!old) return old;
    return {
      ...old,
      folders: old.folders.filter((f) => !deletedIds.has(f.id)),
      files: old.files.filter((f) => !deletedIds.has(f.id)),
    };
  });
}

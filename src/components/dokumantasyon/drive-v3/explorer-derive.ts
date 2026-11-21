// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — TEK VE DETERMİNİSTİK EXPLORER COMPARATOR & VIEW DERIVE
// ============================================================================

import { DokFile, DokFolder } from "@/lib/dokumantasyon/types";
import {
  FILE_SIZE_THRESHOLDS,
  getEffectiveItemTimestamp,
  getGroupFileBucket,
  matchesDateFilter,
  matchesSizeFilter,
  matchesTypeFilter,
  normalizeExtension,
  normalizeTrSearch,
} from "@/lib/dokumantasyon/file-categories";

export type ExplorerSortBy = "name" | "date" | "size" | "type";
export type ExplorerSortOrder = "asc" | "desc";
export type ExplorerGroupBy = "none" | "type" | "date" | "size";

export type DeriveExplorerOptions = {
  sortBy: ExplorerSortBy;
  sortOrder: ExplorerSortOrder;
  groupBy: ExplorerGroupBy;
  typeFilter?: string;
  dateFilter?: string;
  sizeFilter?: string;
  starredOnly?: boolean;
  collection?: "none" | "recent" | "starred";
  searchQuery?: string;
};

export type ItemGroup = {
  key: string;
  label: string;
  folders: DokFolder[];
  files: DokFile[];
};

export type ExplorerViewResult = {
  displayedFolders: DokFolder[];
  displayedFiles: DokFile[];
  groupedBuckets: ItemGroup[];
  visibleOrderedIds: string[];
  visibleItemsMap: Map<string, DokFolder | DokFile>;
  totalCount: number;
};

export function compareFolders(
  a: DokFolder,
  b: DokFolder,
  sortBy: ExplorerSortBy,
  sortOrder: ExplorerSortOrder
): number {
  let cmp = 0;
  if (sortBy === "name" || sortBy === "type" || sortBy === "size") {
    // Folders sort by name when sorting by name, type, or size
    cmp = (a.name || "").localeCompare(b.name || "", "tr", { sensitivity: "base" });
  } else if (sortBy === "date") {
    const timeA = getEffectiveItemTimestamp(a);
    const timeB = getEffectiveItemTimestamp(b);
    cmp = timeA - timeB; // Natural ascending (oldest first)
  }
  return sortOrder === "asc" ? cmp : -cmp;
}

export function compareFiles(
  a: DokFile,
  b: DokFile,
  sortBy: ExplorerSortBy,
  sortOrder: ExplorerSortOrder
): number {
  let cmp = 0;
  if (sortBy === "name") {
    cmp = (a.display_name || "").localeCompare(b.display_name || "", "tr", { sensitivity: "base" });
  } else if (sortBy === "date") {
    const timeA = getEffectiveItemTimestamp(a);
    const timeB = getEffectiveItemTimestamp(b);
    cmp = timeA - timeB; // Natural ascending (oldest first)
  } else if (sortBy === "size") {
    cmp = Number(a.size_bytes || 0) - Number(b.size_bytes || 0); // Natural ascending (smallest first)
  } else if (sortBy === "type") {
    const extA = normalizeExtension(a.extension || a.display_name);
    const extB = normalizeExtension(b.extension || b.display_name);
    cmp = extA.localeCompare(extB, "tr", { sensitivity: "base" });
    if (cmp === 0) {
      cmp = (a.display_name || "").localeCompare(b.display_name || "", "tr", { sensitivity: "base" });
    }
  }
  return sortOrder === "asc" ? cmp : -cmp;
}

export function matchesFilters(
  item: DokFolder | DokFile,
  isFolder: boolean,
  options: DeriveExplorerOptions
): boolean {
  if (options.starredOnly && !item.starred_at) return false;
  if (options.collection === "starred" && !item.starred_at) return false;

  const query = normalizeTrSearch(options.searchQuery || "");
  if (query) {
    const name = isFolder ? (item as DokFolder).name : (item as DokFile).display_name;
    if (!normalizeTrSearch(name || "").includes(query)) return false;
  }

  // Type filter
  if (options.typeFilter && options.typeFilter !== "all") {
    if (isFolder) {
      return false;
    }
    const file = item as DokFile;
    if (!matchesTypeFilter(file.extension || file.display_name, options.typeFilter)) {
      return false;
    }
  }

  // Date filter
  if (options.dateFilter && options.dateFilter !== "all") {
    if (!matchesDateFilter(item, options.dateFilter)) return false;
  }

  // Size filter (files only; hide folders to match server contract)
  if (options.sizeFilter && options.sizeFilter !== "all") {
    if (isFolder) return false;
    if (!matchesSizeFilter((item as DokFile).size_bytes, options.sizeFilter)) {
      return false;
    }
  }

  return true;
}

export function groupItems(
  folders: DokFolder[],
  files: DokFile[],
  groupBy: ExplorerGroupBy
): ItemGroup[] {
  if (groupBy === "none") {
    return [
      {
        key: "all",
        label: "Tüm Öğeler",
        folders,
        files,
      },
    ];
  }

  if (groupBy === "type") {
    const buckets: Record<string, ItemGroup> = {
      folders: { key: "folders", label: "📁 Klasörler", folders: [], files: [] },
      cad: { key: "cad", label: "📐 AutoCAD & CAD Çizimleri (DWG / DXF / DWF)", folders: [], files: [] },
      pdf: { key: "pdf", label: "📄 PDF Dokümanları", folders: [], files: [] },
      image: { key: "image", label: "🖼️ Görseller & Fotoğraflar", folders: [], files: [] },
      document: { key: "document", label: "📝 Metin & Kod Belgeleri", folders: [], files: [] },
      other: { key: "other", label: "📦 Diğer Dosyalar", folders: [], files: [] },
    };

    buckets.folders.folders = folders;

    files.forEach((file) => {
      const bucketKey = getGroupFileBucket(file.extension || file.display_name);
      buckets[bucketKey].files.push(file);
    });

    return Object.values(buckets).filter((b) => b.folders.length > 0 || b.files.length > 0);
  }

  if (groupBy === "date") {
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    const buckets: Record<string, ItemGroup> = {
      today: { key: "today", label: "⚡ Bugün", folders: [], files: [] },
      week: { key: "week", label: "📅 Bu Hafta", folders: [], files: [] },
      month: { key: "month", label: "🗓️ Bu Ay", folders: [], files: [] },
      older: { key: "older", label: "🗄️ Daha Eski", folders: [], files: [] },
    };

    const classify = (item: { updated_at?: string | null; created_at?: string | null }) => {
      const ts = getEffectiveItemTimestamp(item);
      if (!ts) return "older";
      const diff = now - ts;
      if (diff < ONE_DAY) return "today";
      if (diff < 7 * ONE_DAY) return "week";
      if (diff < 30 * ONE_DAY) return "month";
      return "older";
    };

    folders.forEach((f) => buckets[classify(f)].folders.push(f));
    files.forEach((f) => buckets[classify(f)].files.push(f));

    return Object.values(buckets).filter((b) => b.folders.length > 0 || b.files.length > 0);
  }

  if (groupBy === "size") {
    const { MB, SMALL_MAX_BYTES, LARGE_MIN_BYTES, BUCKET_MEDIUM_MAX_BYTES } = FILE_SIZE_THRESHOLDS;
    const buckets: Record<string, ItemGroup> = {
      folders: { key: "folders", label: "📁 Klasörler", folders: [], files: [] },
      huge: { key: "huge", label: "🔥 Çok Büyük (≥ 100 MB)", folders: [], files: [] },
      large: { key: "large", label: "📦 Büyük (25 - 100 MB)", folders: [], files: [] },
      medium: { key: "medium", label: "📄 Orta (5 - 25 MB)", folders: [], files: [] },
      small: { key: "small", label: "⚡ Küçük (< 5 MB)", folders: [], files: [] },
    };

    buckets.folders.folders = folders;

    files.forEach((f) => {
      const size = Number(f.size_bytes || 0);
      if (size >= LARGE_MIN_BYTES) buckets.huge.files.push(f);
      else if (size >= BUCKET_MEDIUM_MAX_BYTES) buckets.large.files.push(f);
      else if (size >= SMALL_MAX_BYTES && MB > 0) buckets.medium.files.push(f);
      else buckets.small.files.push(f);
    });

    return Object.values(buckets).filter((b) => b.folders.length > 0 || b.files.length > 0);
  }

  return [
    {
      key: "all",
      label: "Tüm Öğeler",
      folders,
      files,
    },
  ];
}

export function deriveExplorerView(
  rawData: { folders: DokFolder[]; files: DokFile[] },
  options: DeriveExplorerOptions
): ExplorerViewResult {
  const { folders = [], files = [] } = rawData;

  // 1. Filter
  const filteredFolders = folders.filter((f) => matchesFilters(f, true, options));
  const filteredFiles = files.filter((f) => matchesFilters(f, false, options));

  // 2. Sort using the exact same comparators
  const sortedFolders = [...filteredFolders].sort((a, b) =>
    compareFolders(a, b, options.sortBy, options.sortOrder)
  );
  const sortedFiles = [...filteredFiles].sort((a, b) =>
    compareFiles(a, b, options.sortBy, options.sortOrder)
  );

  // 3. Group
  const groupedBuckets = groupItems(sortedFolders, sortedFiles, options.groupBy);

  // 4. Generate flat visibleOrderedIds
  const visibleOrderedIds: string[] = [];
  const visibleItemsMap = new Map<string, DokFolder | DokFile>();

  if (options.groupBy === "none") {
    for (const folder of sortedFolders) {
      visibleOrderedIds.push(folder.id);
      visibleItemsMap.set(folder.id, folder);
    }
    for (const file of sortedFiles) {
      visibleOrderedIds.push(file.id);
      visibleItemsMap.set(file.id, file);
    }
  } else {
    for (const bucket of groupedBuckets) {
      for (const folder of bucket.folders) {
        visibleOrderedIds.push(folder.id);
        visibleItemsMap.set(folder.id, folder);
      }
      for (const file of bucket.files) {
        visibleOrderedIds.push(file.id);
        visibleItemsMap.set(file.id, file);
      }
    }
  }

  return {
    displayedFolders: sortedFolders,
    displayedFiles: sortedFiles,
    groupedBuckets,
    visibleOrderedIds,
    visibleItemsMap,
    totalCount: visibleOrderedIds.length,
  };
}

/**
 * Reconciles selected IDs against the current visible universe.
 * Background fetch will NOT wipe selection; it only prunes IDs that no longer exist in visibleOrderedIds.
 */
export function reconcileSelection(
  selectedIds: Set<string>,
  visibleOrderedIds: string[]
): Set<string> {
  const visibleSet = new Set(visibleOrderedIds);
  const next = new Set<string>();
  for (const id of selectedIds) {
    if (visibleSet.has(id)) {
      next.add(id);
    }
  }
  return next;
}

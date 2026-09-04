// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — TEK VE DETERMİNİSTİK EXPLORER COMPARATOR & VIEW DERIVE
// ============================================================================

import { DokFile, DokFolder } from "@/lib/dokumantasyon/types";

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
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
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
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    cmp = timeA - timeB; // Natural ascending (oldest first)
  } else if (sortBy === "size") {
    cmp = Number(a.size_bytes || 0) - Number(b.size_bytes || 0); // Natural ascending (smallest first)
  } else if (sortBy === "type") {
    const extA = (a.extension || "").toLowerCase();
    const extB = (b.extension || "").toLowerCase();
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

  const query = (options.searchQuery || "").trim().toLowerCase();
  if (query) {
    const name = isFolder ? (item as DokFolder).name : (item as DokFile).display_name;
    if (!name.toLowerCase().includes(query)) return false;
  }

  // Type filter
  if (options.typeFilter && options.typeFilter !== "all") {
    if (isFolder) {
      // Folders are hidden when specific file type filter is active
      return false;
    }
    const file = item as DokFile;
    const ext = (file.extension || "").toLowerCase().replace(".", "");
    if (options.typeFilter === "cad") {
      if (ext !== "dwg" && ext !== "dxf" && ext !== "dwf") return false;
    } else if (options.typeFilter === "pdf") {
      if (ext !== "pdf") return false;
    } else if (options.typeFilter === "image") {
      if (!["png", "jpg", "jpeg", "webp", "svg", "gif"].includes(ext)) return false;
    }
  }

  // Date filter
  if (options.dateFilter && options.dateFilter !== "all" && item.created_at) {
    const itemTime = new Date(item.created_at).getTime();
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (options.dateFilter === "today" && now - itemTime > ONE_DAY) return false;
    if (options.dateFilter === "week" && now - itemTime > 7 * ONE_DAY) return false;
    if (options.dateFilter === "month" && now - itemTime > 30 * ONE_DAY) return false;
  }

  // Size filter (files only)
  if (!isFolder && options.sizeFilter && options.sizeFilter !== "all") {
    const size = Number((item as DokFile).size_bytes || 0);
    const MB = 1024 * 1024;
    if (options.sizeFilter === "small" && size >= 5 * MB) return false;
    if (options.sizeFilter === "medium" && (size < 5 * MB || size > 50 * MB)) return false;
    if (options.sizeFilter === "large" && size <= 50 * MB) return false;
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
      cad: { key: "cad", label: "📐 AutoCAD & CAD Çizimleri (DWG / DXF)", folders: [], files: [] },
      pdf: { key: "pdf", label: "📄 PDF Dokümanları", folders: [], files: [] },
      image: { key: "image", label: "🖼️ Görseller & Fotoğraflar", folders: [], files: [] },
      text: { key: "text", label: "📝 Metin & Kod Belgeleri", folders: [], files: [] },
      other: { key: "other", label: "📦 Diğer Dosyalar", folders: [], files: [] },
    };

    buckets.folders.folders = folders;

    files.forEach((file) => {
      const ext = (file.extension || "").toLowerCase().replace(".", "");
      if (ext === "dwg" || ext === "dxf" || ext === "dwf") {
        buckets.cad.files.push(file);
      } else if (ext === "pdf") {
        buckets.pdf.files.push(file);
      } else if (["png", "jpg", "jpeg", "webp", "svg", "gif"].includes(ext)) {
        buckets.image.files.push(file);
      } else if (["txt", "md", "json", "csv", "ts", "js", "html", "css", "doc", "docx", "xls", "xlsx"].includes(ext)) {
        buckets.text.files.push(file);
      } else {
        buckets.other.files.push(file);
      }
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

    const classify = (dateStr?: string) => {
      if (!dateStr) return "older";
      const diff = now - new Date(dateStr).getTime();
      if (diff < ONE_DAY) return "today";
      if (diff < 7 * ONE_DAY) return "week";
      if (diff < 30 * ONE_DAY) return "month";
      return "older";
    };

    folders.forEach((f) => buckets[classify(f.created_at)].folders.push(f));
    files.forEach((f) => buckets[classify(f.created_at)].files.push(f));

    return Object.values(buckets).filter((b) => b.folders.length > 0 || b.files.length > 0);
  }

  if (groupBy === "size") {
    const MB = 1024 * 1024;
    const buckets: Record<string, ItemGroup> = {
      folders: { key: "folders", label: "📁 Klasörler", folders: [], files: [] },
      huge: { key: "huge", label: "🔥 Çok Büyük (> 100 MB)", folders: [], files: [] },
      large: { key: "large", label: "📦 Büyük (25 - 100 MB)", folders: [], files: [] },
      medium: { key: "medium", label: "📄 Orta (5 - 25 MB)", folders: [], files: [] },
      small: { key: "small", label: "⚡ Küçük (< 5 MB)", folders: [], files: [] },
    };

    buckets.folders.folders = folders;

    files.forEach((f) => {
      const size = Number(f.size_bytes || 0);
      if (size >= 100 * MB) buckets.huge.files.push(f);
      else if (size >= 25 * MB) buckets.large.files.push(f);
      else if (size >= 5 * MB) buckets.medium.files.push(f);
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

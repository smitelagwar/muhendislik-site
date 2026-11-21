import test from "node:test";
import assert from "node:assert/strict";
import {
  FILE_SIZE_THRESHOLDS,
  getEffectiveItemTimestamp,
  getFileCategory,
  getGroupFileBucket,
  matchesDateFilter,
  matchesSizeFilter,
  matchesTypeFilter,
  normalizeExtension,
  normalizeTrSearch,
} from "../../src/lib/dokumantasyon/file-categories";
import {
  deriveExplorerView,
  reconcileSelection,
} from "../../src/components/dokumantasyon/drive-v3/explorer-derive";
import {
  dokKeys,
  fetchDokItems,
} from "../../src/components/dokumantasyon/drive-v3/query-client";
import type { DokFile, DokFolder } from "../../src/lib/dokumantasyon/types";

const MB = FILE_SIZE_THRESHOLDS.MB;

function makeFolder(overrides: Partial<DokFolder> & { id: string; name: string }): DokFolder {
  const now = new Date().toISOString();
  return {
    parent_id: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    starred_at: null,
    ...overrides,
  };
}

function makeFile(
  overrides: Partial<DokFile> & { id: string; display_name: string; extension: string }
): DokFile {
  const now = new Date().toISOString();
  return {
    folder_id: null,
    blob_pathname: `dok/${overrides.display_name}`,
    blob_url: `https://example.test/${overrides.display_name}`,
    size_bytes: 1024,
    mime_type: "application/octet-stream",
    created_at: now,
    updated_at: now,
    deleted_at: null,
    starred_at: null,
    last_opened_at: null,
    ...overrides,
  };
}

test("BUG-03: file-categories ve deriveExplorerView tur filtre paritesi (.dwf dahil, other dahil)", () => {
  assert.equal(normalizeExtension(".DWG"), "dwg");
  assert.equal(normalizeExtension("plan.dwf"), "dwf");
  assert.equal(getFileCategory(".dwf"), "cad");
  assert.equal(getFileCategory("notlar.md"), "other");
  assert.equal(getGroupFileBucket(".xlsx"), "document");
  assert.equal(getGroupFileBucket(".zip"), "other");

  const folders = [makeFolder({ id: "fld-1", name: "Statik" })];
  const files = [
    makeFile({ id: "f-dwg", display_name: "temel.DWG", extension: ".DWG" }),
    makeFile({ id: "f-dxf", display_name: "kat.dxf", extension: ".dxf" }),
    makeFile({ id: "f-dwf", display_name: "kesit.dwf", extension: ".dwf" }),
    makeFile({ id: "f-pdf", display_name: "rapor.pdf", extension: ".pdf" }),
    makeFile({ id: "f-png", display_name: "gorunum.png", extension: ".png" }),
    makeFile({ id: "f-md", display_name: "oku.md", extension: ".md" }),
    makeFile({ id: "f-xlsx", display_name: "metraj.xlsx", extension: ".xlsx" }),
    makeFile({ id: "f-zip", display_name: "arsiv.zip", extension: ".zip" }),
  ];

  const cadView = deriveExplorerView({ folders, files }, {
    sortBy: "name",
    sortOrder: "asc",
    groupBy: "none",
    typeFilter: "cad",
  });
  assert.equal(cadView.displayedFolders.length, 0);
  assert.deepEqual(
    cadView.displayedFiles.map((f) => f.id).sort(),
    ["f-dwf", "f-dwg", "f-dxf"]
  );

  const pdfView = deriveExplorerView({ folders, files }, {
    sortBy: "name",
    sortOrder: "asc",
    groupBy: "none",
    typeFilter: "pdf",
  });
  assert.deepEqual(pdfView.displayedFiles.map((f) => f.id), ["f-pdf"]);

  const imgView = deriveExplorerView({ folders, files }, {
    sortBy: "name",
    sortOrder: "asc",
    groupBy: "none",
    typeFilter: "image",
  });
  assert.deepEqual(imgView.displayedFiles.map((f) => f.id), ["f-png"]);

  const otherView = deriveExplorerView({ folders, files }, {
    sortBy: "name",
    sortOrder: "asc",
    groupBy: "none",
    typeFilter: "other",
  });
  assert.equal(otherView.displayedFolders.length, 0);
  assert.deepEqual(
    otherView.displayedFiles.map((f) => f.id).sort(),
    ["f-md", "f-xlsx", "f-zip"]
  );
  assert.equal(matchesTypeFilter(".dwf", "cad"), true);
  assert.equal(matchesTypeFilter(".dwf", "other"), false);
});

test("BUG-04: boyut esik paritesi (small < 5MB, medium 5-100MB / 75MB dahil, large >= 100MB)", () => {
  assert.equal(matchesSizeFilter(0, "small"), true);
  assert.equal(matchesSizeFilter(4.99 * MB, "small"), true);
  assert.equal(matchesSizeFilter(5 * MB, "small"), false);

  assert.equal(matchesSizeFilter(4.99 * MB, "medium"), false);
  assert.equal(matchesSizeFilter(5 * MB, "medium"), true);
  assert.equal(matchesSizeFilter(75 * MB, "medium"), true);
  assert.equal(matchesSizeFilter(99.99 * MB, "medium"), true);
  assert.equal(matchesSizeFilter(100 * MB, "medium"), false);

  assert.equal(matchesSizeFilter(99.99 * MB, "large"), false);
  assert.equal(matchesSizeFilter(100 * MB, "large"), true);
  assert.equal(matchesSizeFilter(250 * MB, "large"), true);

  const folders = [makeFolder({ id: "fld-1", name: "Klasor" })];
  const files = [
    makeFile({ id: "s", display_name: "kucuk.pdf", extension: ".pdf", size_bytes: 2 * MB }),
    makeFile({ id: "m75", display_name: "orta75.dwg", extension: ".dwg", size_bytes: 75 * MB }),
    makeFile({ id: "l100", display_name: "buyuk100.dwg", extension: ".dwg", size_bytes: 100 * MB }),
  ];

  const mediumView = deriveExplorerView({ folders, files }, {
    sortBy: "name",
    sortOrder: "asc",
    groupBy: "none",
    sizeFilter: "medium",
  });
  assert.equal(mediumView.displayedFolders.length, 0);
  assert.deepEqual(mediumView.displayedFiles.map((f) => f.id), ["m75"]);

  const largeView = deriveExplorerView({ folders, files }, {
    sortBy: "name",
    sortOrder: "asc",
    groupBy: "none",
    sizeFilter: "large",
  });
  assert.equal(largeView.displayedFolders.length, 0);
  assert.deepEqual(largeView.displayedFiles.map((f) => f.id), ["l100"]);
});

test("BUG-05 & BUG-02 & BUG-20: updated_at tarih, type siralama ve Turkce arama normalizasyonu", () => {
  const now = Date.now();
  const fortyDaysAgo = new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();
  const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();

  const updatedRecently = makeFile({
    id: "f-updated",
    display_name: "İnşaat Kalıp Planı.dwg",
    extension: ".dwg",
    created_at: fortyDaysAgo,
    updated_at: twoHoursAgo,
  });
  const olderFile = makeFile({
    id: "f-older",
    display_name: "Kısım 1 Çatı.pdf",
    extension: ".pdf",
    created_at: fiveDaysAgo,
    updated_at: fiveDaysAgo,
  });
  const anotherDwg = makeFile({
    id: "f-dwg-a",
    display_name: "Ankara Kesit.dwg",
    extension: ".dwg",
    created_at: fortyDaysAgo,
    updated_at: fortyDaysAgo,
  });

  assert.equal(getEffectiveItemTimestamp(updatedRecently), new Date(twoHoursAgo).getTime());
  assert.equal(matchesDateFilter(updatedRecently, "today", now), true);
  assert.equal(matchesDateFilter(olderFile, "today", now), false);

  const dateView = deriveExplorerView({ folders: [], files: [olderFile, updatedRecently, anotherDwg] }, {
    sortBy: "date",
    sortOrder: "desc",
    groupBy: "date",
  });
  assert.equal(dateView.displayedFiles[0].id, "f-updated");
  assert.equal(dateView.groupedBuckets[0].key, "today");
  assert.deepEqual(dateView.groupedBuckets[0].files.map((f) => f.id), ["f-updated"]);

  const typeView = deriveExplorerView({ folders: [], files: [updatedRecently, olderFile, anotherDwg] }, {
    sortBy: "type",
    sortOrder: "asc",
    groupBy: "none",
  });
  assert.deepEqual(typeView.displayedFiles.map((f) => f.id), ["f-dwg-a", "f-updated", "f-older"]);

  assert.equal(normalizeTrSearch("İNŞAAT"), normalizeTrSearch("inşaat"));
  assert.equal(normalizeTrSearch("KISIM"), normalizeTrSearch("kısım"));

  const searchView = deriveExplorerView({ folders: [], files: [updatedRecently, olderFile] }, {
    sortBy: "name",
    sortOrder: "asc",
    groupBy: "none",
    searchQuery: "inşaat",
  });
  assert.deepEqual(searchView.displayedFiles.map((f) => f.id), ["f-updated"]);
});

test("Gruplama dogrulugu, bos kovalarin elenmesi ve reconcileSelection", () => {
  const folders = [makeFolder({ id: "fld-1", name: "Projeler" })];
  const files = [
    makeFile({ id: "f-1", display_name: "plan.dwg", extension: ".dwg", size_bytes: 10 * MB }),
    makeFile({ id: "f-2", display_name: "rapor.pdf", extension: ".pdf", size_bytes: 120 * MB }),
  ];

  for (const groupBy of ["none", "type", "date", "size"] as const) {
    const view = deriveExplorerView({ folders, files }, {
      sortBy: "name",
      sortOrder: "asc",
      groupBy,
    });
    for (const bucket of view.groupedBuckets) {
      assert.ok(bucket.folders.length + bucket.files.length > 0);
    }
    const flattenedFromBuckets = view.groupedBuckets.flatMap((b) => [
      ...b.folders.map((x) => x.id),
      ...b.files.map((x) => x.id),
    ]);
    assert.deepEqual(view.visibleOrderedIds, flattenedFromBuckets);
  }

  const reconciled = reconcileSelection(new Set(["fld-1", "f-2", "deleted-id"]), ["fld-1", "f-2"]);
  assert.deepEqual(Array.from(reconciled), ["fld-1", "f-2"]);
});

test("BUG-01 & BUG-02: dokKeys.items ve fetchDokItems scope=all ve order=desc sozlesmesi", async () => {
  const keyCurrent = dokKeys.items(null, { scope: "current", sortBy: "type", sortOrder: "desc" });
  const keyAll = dokKeys.items(null, { scope: "all", sortBy: "type", sortOrder: "desc" });
  assert.notDeepEqual(keyCurrent, keyAll);
  assert.ok(keyAll.includes("all"));

  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    capturedUrl = typeof input === "string" ? input : input.toString();
    return new Response(
      JSON.stringify({ folder: null, breadcrumbs: [], folders: [], files: [], summary: { starredCount: 0 } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }) as typeof fetch;

  try {
    await fetchDokItems("fld-99", {
      scope: "all",
      type: "other",
      sortBy: "type",
      order: "desc",
    });
    const parsed = new URL(capturedUrl);
    assert.equal(parsed.searchParams.get("folderId"), "fld-99");
    assert.equal(parsed.searchParams.get("scope"), "all");
    assert.equal(parsed.searchParams.get("type"), "other");
    assert.equal(parsed.searchParams.get("sortBy"), "type");
    assert.equal(parsed.searchParams.get("order"), "desc");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

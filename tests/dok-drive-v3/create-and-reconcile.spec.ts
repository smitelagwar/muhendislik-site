// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — CREATE & RECONCILE (NO-F5) TESTİ
// ============================================================================

import { test, expect } from "@playwright/test";
import {
  dokQueryClient,
  dokKeys,
  insertPendingFolderInCache,
  replacePendingFolderInCache,
  removePendingFolderFromCache,
  DokItemsResponse,
} from "../../src/components/dokumantasyon/drive-v3/query-client";
import { DokFolder } from "../../src/lib/dokumantasyon/types";

test.describe("Drive V3.1 — Create & Reconcile (No-F5)", () => {
  const queryKey = dokKeys.items("test-root", {
    collection: "none",
    type: "all",
    date: "all",
    size: "all",
    sortBy: "name",
    sortOrder: "asc",
  });

  test.beforeEach(() => {
    dokQueryClient.setQueryData<DokItemsResponse>(queryKey, {
      folder: null,
      breadcrumbs: [{ id: null, name: "Kök Dizin" }],
      folders: [
        {
          id: "folder-existing-1",
          name: "Mevcut Klasör 1",
          parent_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
        },
      ],
      files: [],
      summary: { totalFiles: 0, totalSizeBytes: 0, starredCount: 0 },
    });
  });

  test("1. Optimistic pending folder ekleme anında cache'e yansır (0ms No-F5)", () => {
    const tempId = "pending:temp-123";
    const pendingFolder: DokFolder = {
      id: tempId,
      name: "Yeni Proje Klasörü",
      parent_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      pending: true,
    };

    insertPendingFolderInCache(dokQueryClient, queryKey, pendingFolder);

    const data = dokQueryClient.getQueryData<DokItemsResponse>(queryKey);
    expect(data?.folders).toHaveLength(2);
    expect(data?.folders.some((f) => f.id === tempId && f.pending === true)).toBe(true);
  });

  test("2. Server yanıtı geldiğinde pending kimlik kalıcı kimlikle atomik takas edilir", () => {
    const tempId = "pending:temp-123";
    const pendingFolder: DokFolder = {
      id: tempId,
      name: "Yeni Proje Klasörü",
      parent_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      pending: true,
    };
    insertPendingFolderInCache(dokQueryClient, queryKey, pendingFolder);

    const serverId = "folder-real-999";
    const serverFolder: DokFolder = {
      id: serverId,
      name: "Yeni Proje Klasörü",
      parent_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      pending: false,
    };

    replacePendingFolderInCache(dokQueryClient, queryKey, tempId, serverFolder);

    const data = dokQueryClient.getQueryData<DokItemsResponse>(queryKey);
    expect(data?.folders).toHaveLength(2);
    expect(data?.folders.some((f) => f.id === tempId)).toBe(false);
    expect(data?.folders.some((f) => f.id === serverId && !f.pending)).toBe(true);
  });

  test("3. Hata durumunda pending folder rollback edilerek cache temizlenir", () => {
    const tempId = "pending:temp-fail";
    const pendingFolder: DokFolder = {
      id: tempId,
      name: "Hatalı Klasör",
      parent_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      pending: true,
    };

    insertPendingFolderInCache(dokQueryClient, queryKey, pendingFolder);
    expect(dokQueryClient.getQueryData<DokItemsResponse>(queryKey)?.folders).toHaveLength(2);

    removePendingFolderFromCache(dokQueryClient, queryKey, tempId);
    expect(dokQueryClient.getQueryData<DokItemsResponse>(queryKey)?.folders).toHaveLength(1);
    expect(dokQueryClient.getQueryData<DokItemsResponse>(queryKey)?.folders.some((f) => f.id === tempId)).toBe(false);
  });

  test("4. Hızlı arka arkaya iki klasör oluşturulduğunda deterministik reconcile sağlanır", () => {
    const temp1 = "pending:t1";
    const temp2 = "pending:t2";

    insertPendingFolderInCache(dokQueryClient, queryKey, {
      id: temp1,
      name: "Klasör 1",
      parent_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      pending: true,
    });

    insertPendingFolderInCache(dokQueryClient, queryKey, {
      id: temp2,
      name: "Klasör 2",
      parent_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      pending: true,
    });

    let data = dokQueryClient.getQueryData<DokItemsResponse>(queryKey);
    expect(data?.folders.filter((f) => f.pending)).toHaveLength(2);

    // 2. klasör önce tamamlanırsa
    replacePendingFolderInCache(dokQueryClient, queryKey, temp2, {
      id: "real-2",
      name: "Klasör 2",
      parent_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    });

    data = dokQueryClient.getQueryData<DokItemsResponse>(queryKey);
    expect(data?.folders.some((f) => f.id === "real-2")).toBe(true);
    expect(data?.folders.some((f) => f.id === temp1)).toBe(true);

    // 1. klasör tamamlanırsa
    replacePendingFolderInCache(dokQueryClient, queryKey, temp1, {
      id: "real-1",
      name: "Klasör 1",
      parent_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    });

    data = dokQueryClient.getQueryData<DokItemsResponse>(queryKey);
    expect(data?.folders.filter((f) => f.pending)).toHaveLength(0);
    expect(data?.folders.some((f) => f.id === "real-1")).toBe(true);
    expect(data?.folders.some((f) => f.id === "real-2")).toBe(true);
  });
});

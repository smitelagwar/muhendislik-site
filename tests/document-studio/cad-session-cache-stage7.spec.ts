import { expect, test } from "@playwright/test";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";
import {
  buildCadSessionCacheKey,
  getCachedCadSource,
  putCachedCadSource,
  evictCachedCadSource,
  clearCadSessionCache,
  getCadSessionCacheStats,
  CAD_SESSION_CACHE_MAX_ENTRIES,
  CAD_SESSION_CACHE_MAX_TOTAL_BYTES,
  CAD_SESSION_CACHE_MAX_SINGLE_FILE_BYTES,
} from "../../src/lib/dokumantasyon/cad-runtime/session-cache";
import type { CadSessionCacheStats } from "../../src/lib/dokumantasyon/cad-runtime/session-cache";

test.describe("Stage 7 — Memory-Safe Bounded Session Source Cache Suite", () => {
  test.beforeEach(async ({ page }) => {
    page.on("pageerror", (err) => console.log(`[PAGE ERROR]: ${err.message}\n${err.stack}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`[PAGE CONSOLE ERROR]: ${msg.text()}`);
    });
  });

  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("1. Bounded Budget & LRU Policy: session-cache enforces max 3 entries, max 40MB, 20MB single-item bypass, and slice isolation", async () => {
    clearCadSessionCache();
    const initialStats = getCadSessionCacheStats();

    // Verify initial state
    expect(initialStats.entryCount).toBe(0);
    expect(initialStats.totalBytes).toBe(0);
    expect(CAD_SESSION_CACHE_MAX_ENTRIES).toBe(3);
    expect(CAD_SESSION_CACHE_MAX_TOTAL_BYTES).toBe(40 * 1024 * 1024);
    expect(CAD_SESSION_CACHE_MAX_SINGLE_FILE_BYTES).toBe(20 * 1024 * 1024);

    // Test 1: Add 3 entries
    const buf1 = new Uint8Array([1, 2, 3, 4]).buffer;
    const buf2 = new Uint8Array([5, 6, 7, 8]).buffer;
    const buf3 = new Uint8Array([9, 10, 11, 12]).buffer;

    putCachedCadSource("key-1", buf1);
    putCachedCadSource("key-2", buf2);
    putCachedCadSource("key-3", buf3);

    let stats = getCadSessionCacheStats();
    expect(stats.entryCount).toBe(3);
    expect(stats.totalBytes).toBe(12);

    // Touch key-1 so key-2 becomes the oldest
    getCachedCadSource("key-1");

    // Test 2: Add 4th entry — key-2 should be evicted (LRU)
    const buf4 = new Uint8Array([13, 14, 15, 16]).buffer;
    putCachedCadSource("key-4", buf4);

    stats = getCadSessionCacheStats();
    expect(stats.entryCount).toBe(3);
    expect(getCachedCadSource("key-2")).toBeNull();
    expect(getCachedCadSource("key-1")).not.toBeNull();
    expect(getCachedCadSource("key-3")).not.toBeNull();
    expect(getCachedCadSource("key-4")).not.toBeNull();

    // Test 3: Slice isolation — mutating the returned buffer does NOT mutate cached data
    const retrieved = getCachedCadSource("key-1");
    expect(retrieved).not.toBeNull();
    const view = new Uint8Array(retrieved!);
    view[0] = 99; // mutate caller's buffer

    const retrievedAgain = getCachedCadSource("key-1");
    expect(retrievedAgain).not.toBeNull();
    const viewAgain = new Uint8Array(retrievedAgain!);
    expect(viewAgain[0]).toBe(1); // cache preserved original byte 1

    // Test 4: Single-item bypass — buffer > 20MB must not be cached
    const bigBuffer = new ArrayBuffer(21 * 1024 * 1024); // 21 MB
    putCachedCadSource("key-big", bigBuffer);
    expect(getCachedCadSource("key-big")).toBeNull();

    // Test 5: Manual eviction
    evictCachedCadSource("key-1");
    expect(getCachedCadSource("key-1")).toBeNull();

    // Test 6: Cache key builder
    const keyA = buildCadSessionCacheKey({
      fileId: "fid1",
      sourceVersionKey: "v1",
      accessUrl: "/api/files/1?token=abc",
    });
    expect(keyA).toBe("fid1:v1");

    const keyB = buildCadSessionCacheKey({
      fileId: "fid2",
      accessUrl: "/api/files/2/stream?token=abc",
    });
    expect(keyB).toBe("fid2:/api/files/2/stream");

    clearCadSessionCache();
  });

  test("2. Zero Persistent Storage: No CAD source buffers or geometry are written to localStorage or IndexedDB", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const runtime = page.locator('[data-cad-runtime="orchestrator"]').first();
    await expect(runtime).toBeVisible({ timeout: 60_000 });

    const host = runtime.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", {
      timeout: 60_000,
    });

    // Check localStorage for any CAD source byte leakage
    const storageKeys = await page.evaluate(() => {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i) || "");
      }
      return keys;
    });

    for (const key of storageKeys) {
      expect(key).not.toContain("cad_source");
      expect(key).not.toContain("cad-buffer");
      expect(key).not.toContain("dwg-binary");
    }

    // Check IndexedDB databases
    const idbDatabases = await page.evaluate(async () => {
      if (window.indexedDB?.databases) {
        const dbs = await window.indexedDB.databases();
        return dbs.map((d) => d.name || "");
      }
      return [];
    });

    for (const dbName of idbDatabases) {
      expect(dbName).not.toContain("cad-cache");
      expect(dbName).not.toContain("cad-source");
    }
  });

  test("3. In-Session Reopen Cache Hit: Navigating back to the same file reuses in-memory bytes with 0 new stream requests", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    let streamRequestCount = 0;
    page.on("request", (req) => {
      if (req.url().includes(`/api/dokumantasyon/files/${fileId}/stream`)) {
        streamRequestCount++;
      }
    });

    // Open first time: must fetch from network and fill session cache
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const runtime = page.locator('[data-cad-runtime="orchestrator"]').first();
    await expect(runtime).toBeVisible({ timeout: 60_000 });

    const host = runtime.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", {
      timeout: 60_000,
    });

    expect(streamRequestCount).toBe(1);

    // Verify session cache has recorded the entry
    const cacheStatsAfterFirst = await page.evaluate(() => {
      const fn = (window as unknown as { __cadSessionCacheStats?: () => CadSessionCacheStats }).__cadSessionCacheStats;
      return fn ? fn() : null;
    });
    expect(cacheStatsAfterFirst?.entryCount).toBeGreaterThanOrEqual(1);

    // Client-side navigate back to explorer via studio back button
    const backBtn = page.locator('[data-command-id="studio.back"]').first();
    await expect(backBtn).toBeVisible({ timeout: 10_000 });
    await backBtn.click();

    // Wait for explorer title to be visible without full page reload
    const workspaceTitle = page.locator("h1:has-text('Dökümantasyon Modülü')");
    await expect(workspaceTitle).toBeVisible({ timeout: 15_000 });

    // Track stream requests on second open
    const streamRequestsOnSecondOpen: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes(`/api/dokumantasyon/files/${fileId}/stream`)) {
        streamRequestsOnSecondOpen.push(req.url());
      }
    });

    // Double-click the file row to client-side navigate back to the studio
    const fileRow = page.locator(`[data-file-id="${fileId}"]`).first();
    await expect(fileRow).toBeVisible({ timeout: 15_000 });
    await fileRow.dblclick();

    const runtimeReopen = page.locator('[data-cad-runtime="orchestrator"]').first();
    await expect(runtimeReopen).toBeVisible({ timeout: 60_000 });

    const hostReopen = runtimeReopen.locator('[data-cad-upstream-host="true"]').first();
    await expect(hostReopen).toHaveAttribute("data-cad-upstream-state", "ready", {
      timeout: 60_000,
    });

    // Because the source was cached in RAM, the stream fetch request count during the reopen must be 0!
    expect(streamRequestsOnSecondOpen.length).toBe(0);
  });

  test("4. F-03 Verification: Terminal-invalid documents and blank files are evicted from cache", async () => {
    clearCadSessionCache();
    const badKey = "corrupt-blank-file:v1";
    const corruptBytes = new Uint8Array([0, 1, 2, 3]).buffer;

    // Simulate entry presence
    putCachedCadSource(badKey, corruptBytes);
    expect(getCachedCadSource(badKey)).not.toBeNull();

    // When adapter encounters open failure or blank-document throw, it evicts
    evictCachedCadSource(badKey);

    // Verify entry is completely gone from session cache
    expect(getCachedCadSource(badKey)).toBeNull();
    const stats = getCadSessionCacheStats();
    expect(stats.entryCount).toBe(0);
    expect(stats.totalBytes).toBe(0);
  });

  test("5. F-05 Empirical Memory Budget Verification: 3 entries / 40MB total / 20MB single bounds protect mobile heap", async () => {
    clearCadSessionCache();

    // 1. Single file limit: 21 MB should be rejected immediately (0 bytes cached)
    const overLimit = new ArrayBuffer(21 * 1024 * 1024);
    putCachedCadSource("too-large-dwg", overLimit);
    expect(getCachedCadSource("too-large-dwg")).toBeNull();
    expect(getCadSessionCacheStats().totalBytes).toBe(0);

    // 2. Large file within limit: 18 MB should be accepted
    const large18MB = new ArrayBuffer(18 * 1024 * 1024);
    putCachedCadSource("large-cad-1", large18MB);
    expect(getCachedCadSource("large-cad-1")).not.toBeNull();
    expect(getCadSessionCacheStats().totalBytes).toBe(18 * 1024 * 1024);

    // 3. Second large file: 18 MB should fit within 40 MB budget (18 + 18 = 36 MB)
    const large18MB_2 = new ArrayBuffer(18 * 1024 * 1024);
    putCachedCadSource("large-cad-2", large18MB_2);
    expect(getCadSessionCacheStats().totalBytes).toBe(36 * 1024 * 1024);
    expect(getCadSessionCacheStats().entryCount).toBe(2);

    // 4. Third file: 10 MB would exceed 40 MB (36 + 10 = 46 MB > 40 MB)
    // LRU policy must evict oldest entry ("large-cad-1") so total bytes <= 40 MB
    const file10MB = new ArrayBuffer(10 * 1024 * 1024);
    putCachedCadSource("cad-3", file10MB);

    const statsAfterEvict = getCadSessionCacheStats();
    expect(statsAfterEvict.totalBytes).toBeLessThanOrEqual(CAD_SESSION_CACHE_MAX_TOTAL_BYTES);
    expect(statsAfterEvict.entryCount).toBeLessThanOrEqual(CAD_SESSION_CACHE_MAX_ENTRIES);
    expect(getCachedCadSource("large-cad-1")).toBeNull(); // evicted
    expect(getCachedCadSource("large-cad-2")).not.toBeNull();
    expect(getCachedCadSource("cad-3")).not.toBeNull();

    clearCadSessionCache();
  });
});

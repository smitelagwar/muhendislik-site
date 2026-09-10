import type { Page } from "@playwright/test";

const NOW = "2026-09-10T06:00:00.000Z";

function makeFile(index: number, folderId: string | null = null) {
  const suffix = String(index).padStart(3, "0");
  return {
    id: `file-${suffix}`,
    folder_id: folderId,
    display_name: `Dosya ${suffix} — mobil görünürlük kontrolü.pdf`,
    blob_pathname: `tests/file-${suffix}.pdf`,
    blob_url: `https://example.invalid/file-${suffix}.pdf`,
    size_bytes: 1024 + index,
    mime_type: "application/pdf",
    extension: "pdf",
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
    starred_at: null,
  };
}

export async function mockExplorerData(page: Page, count = 100) {
  await page.route("**/api/dokumantasyon/readiness", route => route.fulfill({ json: { ok: true, storageMode: "local_dev" } }));
  await page.route("**/api/dokumantasyon/items**", async (route) => {
    const url = new URL(route.request().url());
    const folderId = url.searchParams.get("folderId");

    if (folderId === "folder-mobile") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          folder: {
            id: "folder-mobile",
            name: "Mobil Klasör",
            parent_id: null,
            created_at: NOW,
            updated_at: NOW,
            deleted_at: null,
            starred_at: null,
          },
          breadcrumbs: [
            { id: null, name: "Kök Dizin" },
            { id: "folder-mobile", name: "Mobil Klasör" },
          ],
          folders: [],
          files: Array.from({ length: 12 }, (_, index) => makeFile(index, "folder-mobile")),
          summary: { totalFiles: 12, totalSizeBytes: 12_000, starredCount: 0 },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        folder: null,
        breadcrumbs: [{ id: null, name: "Kök Dizin" }],
        folders: [
          {
            id: "folder-mobile",
            name: "Mobil Klasör",
            parent_id: null,
            created_at: NOW,
            updated_at: NOW,
            deleted_at: null,
            starred_at: null,
          },
        ],
        files: Array.from({ length: count }, (_, index) => makeFile(index)),
        summary: { totalFiles: count, totalSizeBytes: 100_000, starredCount: 0 },
      }),
    });
  });
}


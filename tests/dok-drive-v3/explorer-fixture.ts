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



type MixedFileSeed = {
  extension: string;
  mime_type: string;
  display_name: string;
  size_bytes: number;
};

const MIXED_FILE_SEEDS: MixedFileSeed[] = [
  { extension: "dwg", mime_type: "application/acad", display_name: "1 ve 2.kat dwg.dwg", size_bytes: 3_444_087 },
  { extension: "dxf", mime_type: "image/vnd.dxf", display_name: "1_kisim_tum_kalip_planlari_FINAL_TEK.dxf", size_bytes: 1_238_400 },
  { extension: "pdf", mime_type: "application/pdf", display_name: "A3 KAĞIT DEMİRCİYE VERİLECEK HER KATTA-Model.pdf", size_bytes: 2_612_224 },
  { extension: "md", mime_type: "text/markdown", display_name: "Betonarme_Perdeler_Asama_07_Perde.md", size_bytes: 35_840 },
  { extension: "png", mime_type: "image/png", display_name: "ChatGPT Image 5 Tem 2026 16_47_22.png", size_bytes: 3_145_728 },
  { extension: "xlsx", mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", display_name: "Metraj_Ozeti.xlsx", size_bytes: 486_400 },
];

const MOCK_PREVIEW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#27272a"/>
    </linearGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#f59e0b" stroke-opacity="0.18" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="640" height="400" fill="url(#bg)"/>
  <rect width="640" height="400" fill="url(#grid)"/>
  <rect x="96" y="72" width="448" height="256" rx="12" fill="none" stroke="#f59e0b" stroke-width="3"/>
  <line x1="96" y1="200" x2="544" y2="200" stroke="#38bdf8" stroke-width="2" stroke-dasharray="8 6"/>
  <line x1="320" y1="72" x2="320" y2="328" stroke="#38bdf8" stroke-width="2" stroke-dasharray="8 6"/>
  <circle cx="320" cy="200" r="56" fill="#f59e0b" fill-opacity="0.22" stroke="#f59e0b" stroke-width="2.5"/>
  <text x="320" y="365" fill="#fbbf24" font-family="monospace" font-size="18" font-weight="bold" text-anchor="middle">AKS PLANI · 640x400</text>
</svg>`;

export async function mockMixedExplorerData(page: Page) {
  await page.route("**/api/dokumantasyon/readiness", route => route.fulfill({ json: { ok: true, storageMode: "local_dev" } }));
  await page.route("**/api/dokumantasyon/files/*/stream", async (route) => {
    const url = route.request().url();
    if (url.includes("mixed-3")) {
      await route.fulfill({
        status: 200,
        contentType: "text/markdown; charset=utf-8",
        body: "# Betonarme Perdeler\nC30/37 analiz notları.",
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "image/svg+xml; charset=utf-8",
      body: MOCK_PREVIEW_SVG,
    });
  });
  await page.route("**/api/dokumantasyon/items**", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        folder: null,
        breadcrumbs: [{ id: null, name: "Kök Dizin" }],
        folders: [
          {
            id: "folder-mixed",
            name: "agss",
            parent_id: null,
            created_at: NOW,
            updated_at: NOW,
            deleted_at: null,
            starred_at: null,
          },
        ],
        files: MIXED_FILE_SEEDS.map((seed, index) => ({
          id: `mixed-${index}`,
          folder_id: null,
          display_name: seed.display_name,
          blob_pathname: `tests/mixed-${index}.${seed.extension}`,
          blob_url: `https://example.invalid/mixed-${index}.${seed.extension}`,
          size_bytes: seed.size_bytes,
          mime_type: seed.mime_type,
          extension: seed.extension,
          created_at: NOW,
          updated_at: NOW,
          deleted_at: null,
          starred_at: null,
        })),
        summary: {
          totalFiles: MIXED_FILE_SEEDS.length,
          totalSizeBytes: MIXED_FILE_SEEDS.reduce((sum, item) => sum + item.size_bytes, 0),
          starredCount: 0,
        },
      }),
    });
  });
}

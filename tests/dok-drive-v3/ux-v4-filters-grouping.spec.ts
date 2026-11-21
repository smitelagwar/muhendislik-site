import { test, expect, type Page } from "@playwright/test";

const NOW = new Date().toISOString();
const THREE_DAYS_AGO = new Date(Date.now() - 3 * 86_400_000).toISOString();
const FORTY_DAYS_AGO = new Date(Date.now() - 40 * 86_400_000).toISOString();

interface SeedFile {
  id: string;
  folder_id: string | null;
  display_name: string;
  blob_pathname: string;
  blob_url: string;
  size_bytes: number;
  mime_type: string;
  extension: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  starred_at: string | null;
}

const ROOT_FOLDERS = [
  {
    id: "folder-statik",
    name: "Statik Projeler",
    parent_id: null,
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
    starred_at: null,
  },
];

const ALL_FILES: SeedFile[] = [
  {
    id: "f-cad-1",
    folder_id: null,
    display_name: "Kalıp Planı.dwg",
    blob_pathname: "tests/kalip.dwg",
    blob_url: "https://example.invalid/kalip.dwg",
    size_bytes: 2_000_000,
    mime_type: "application/acad",
    extension: "dwg",
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
    starred_at: null,
  },
  {
    id: "f-pdf-1",
    folder_id: null,
    display_name: "İnşaat Ruhsatı.pdf",
    blob_pathname: "tests/insaat.pdf",
    blob_url: "https://example.invalid/insaat.pdf",
    size_bytes: 1_500_000,
    mime_type: "application/pdf",
    extension: "pdf",
    created_at: THREE_DAYS_AGO,
    updated_at: THREE_DAYS_AGO,
    deleted_at: null,
    starred_at: NOW,
  },
  {
    id: "f-pdf-2",
    folder_id: null,
    display_name: "Büyük Statik Rapor.pdf",
    blob_pathname: "tests/rapor.pdf",
    blob_url: "https://example.invalid/rapor.pdf",
    size_bytes: 120 * 1024 * 1024,
    mime_type: "application/pdf",
    extension: "pdf",
    created_at: FORTY_DAYS_AGO,
    updated_at: FORTY_DAYS_AGO,
    deleted_at: null,
    starred_at: null,
  },
  {
    id: "f-img-1",
    folder_id: null,
    display_name: "Şantiye Fotoğrafı.png",
    blob_pathname: "tests/santiye.png",
    blob_url: "https://example.invalid/santiye.png",
    size_bytes: 3_200_000,
    mime_type: "image/png",
    extension: "png",
    created_at: NOW,
    updated_at: NOW,
    deleted_at: null,
    starred_at: null,
  },
  {
    id: "f-other-75mb",
    folder_id: "folder-statik",
    display_name: "Alt Klasör Metraj Paketi.zip",
    blob_pathname: "tests/metraj.zip",
    blob_url: "https://example.invalid/metraj.zip",
    size_bytes: 75 * 1024 * 1024,
    mime_type: "application/zip",
    extension: "zip",
    created_at: THREE_DAYS_AGO,
    updated_at: THREE_DAYS_AGO,
    deleted_at: null,
    starred_at: null,
  },
];

async function setupS1Mock(page: Page) {
  const requests: URL[] = [];

  await page.route("**/api/dokumantasyon/readiness", (route) =>
    route.fulfill({ json: { ok: true, storageMode: "local_dev" } })
  );
  await page.route("**/api/dokumantasyon/trash", (route) =>
    route.fulfill({ json: { folders: [], files: [] } })
  );
  await page.route("**/api/dokumantasyon/shares**", (route) =>
    route.fulfill({ json: { shares: [] } })
  );

  await page.route("**/api/dokumantasyon/items**", async (route) => {
    const url = new URL(route.request().url());
    requests.push(url);
    const folderId = url.searchParams.get("folderId");
    const scope = url.searchParams.get("scope") || "current";
    const collection = url.searchParams.get("collection") || "none";

    let files = ALL_FILES.filter((f) =>
      scope === "all" || collection !== "none" ? true : f.folder_id === (folderId || null)
    );
    if (collection === "starred") {
      files = files.filter((f) => Boolean(f.starred_at));
    }

    const folders = folderId || scope === "all" || collection !== "none" ? [] : ROOT_FOLDERS;
    const breadcrumbs =
      folderId === "folder-statik"
        ? [
            { id: null, name: "Kök Dizin" },
            { id: "folder-statik", name: "Statik Projeler" },
          ]
        : [{ id: null, name: "Kök Dizin" }];

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        folder: folderId ? ROOT_FOLDERS.find((f) => f.id === folderId) ?? null : null,
        breadcrumbs,
        folders,
        files,
        summary: {
          totalFiles: ALL_FILES.length,
          totalFolders: ROOT_FOLDERS.length,
          totalSizeBytes: ALL_FILES.reduce((acc, f) => acc + f.size_bytes, 0),
          starredCount: ALL_FILES.filter((f) => Boolean(f.starred_at)).length,
          categoryCounts: { cad: 1, pdf: 2, image: 1, other: 1 },
        },
      }),
    });
  });

  return requests;
}

function attachErrorGuard(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

test.describe("UX V4 — S1: Filtre, Kapsam, Sıralama & Gruplama", () => {
  test("S1.1 & S1.7: Sol menü filtreleri API paramları ve summary toplamlarını korur; Kök Dizin temizler", async ({ page }) => {
    const errors = attachErrorGuard(page);
    const requests = await setupS1Mock(page);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

    await page.getByRole("button", { name: /AutoCAD \(DWG \/ DXF\)/ }).click();
    await expect(page.locator('[data-file-id="f-cad-1"]')).toBeVisible();
    await expect(page.locator('[data-file-id="f-pdf-1"]')).toHaveCount(0);

    await page.getByRole("button", { name: /PDF Dokümanları/ }).click();
    await expect(page.locator('[data-file-id="f-pdf-1"]')).toBeVisible();

    await page.getByRole("button", { name: /Görseller & Fotoğraflar/ }).click();
    await expect(page.locator('[data-file-id="f-img-1"]')).toBeVisible();

    await page.getByRole("button", { name: /Yıldızlı Dosyalar/ }).click();
    await expect(page.locator('[data-file-id="f-pdf-1"]')).toBeVisible();
    expect(requests.some((u) => u.searchParams.get("collection") === "starred")).toBe(true);

    // Summary toplamları sıfırlanmamalı
    const allFilesBtn = page.getByRole("button", { name: /Tüm Dosyalarım/ });
    await expect(allFilesBtn).toContainText(String(ALL_FILES.length));

    await page.getByRole("button", { name: /Son Açılanlar/ }).click();
    expect(requests.some((u) => u.searchParams.get("collection") === "recent")).toBe(true);

    // S1.7: Breadcrumb Kök Dizin tıklaması koleksiyon filtresini temizler
    await page.getByRole("button", { name: "Kök Dizin" }).click();
    await expect(page.locator('[data-file-id="f-cad-1"]')).toBeVisible();
    await expect(page.locator('[data-file-id="f-img-1"]')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("S1.2 & S1.3: Filtre sheet (Diğer + 5-100MB + Son 7 gün + Tüm klasörler) ve çoklu çip kaldırma", async ({ page }) => {
    const errors = attachErrorGuard(page);
    const requests = await setupS1Mock(page);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

    await page.getByRole("button", { name: "Dosya filtreleri" }).click();
    const sheet = page.getByTestId("workspace-filter-sheet");
    await expect(sheet).toBeVisible();

    await sheet.getByLabel("Tür").selectOption("other");
    await sheet.getByLabel("Boyut").selectOption("medium");
    await sheet.getByLabel("Tarih").selectOption("week");
    await sheet.getByLabel("Kapsam").selectOption("all");
    await sheet.getByRole("button", { name: "Uygula" }).click();

    await expect(page.locator('[data-file-id="f-other-75mb"]')).toBeVisible();
    expect(requests.some((u) => u.searchParams.get("scope") === "all")).toBe(true);

    // S1.3: Çoklu filtre kombinasyonu -> 3 çip -> tek çip silme -> Temizle
    await page.getByTestId("dok-filter-chips-clear-all").click();
    await page.getByRole("button", { name: "Dosya filtreleri" }).click();
    await sheet.getByLabel("Tür").selectOption("pdf");
    await sheet.getByLabel("Boyut").selectOption("small");
    await sheet.getByLabel("Yalnız yıldızlı öğeler").check();
    await sheet.getByRole("button", { name: "Uygula" }).click();

    const chipsBar = page.getByTestId("dok-filter-chips-bar");
    await expect(chipsBar).toBeVisible();
    await expect(chipsBar).toContainText("Tür: PDF");
    await expect(chipsBar).toContainText("Boyut: 5 MB altı");
    await expect(chipsBar).toContainText("Yıldızlılar");
    await expect(page.locator('[data-file-id="f-pdf-1"]')).toBeVisible();
    await expect(page.locator('[data-file-id="f-pdf-2"]')).toHaveCount(0);

    await chipsBar.getByRole("button", { name: /Boyut: 5 MB altı.*kaldır/i }).click();
    await expect(chipsBar).not.toContainText("Boyut: 5 MB altı");
    await expect(chipsBar).toContainText("Tür: PDF");

    await page.getByTestId("dok-filter-chips-clear-all").click();
    await expect(page.locator('[data-file-id="f-cad-1"]')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("S1.4: Satır içi Türkçe arama ve bağlama duyarlı boş durum", async ({ page }) => {
    const errors = attachErrorGuard(page);
    await setupS1Mock(page);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

    const inlineFilter = page.getByTestId("dok-inline-filter");
    await inlineFilter.fill("inşaat");
    await expect(page.locator('[data-file-id="f-pdf-1"]')).toBeVisible();
    await expect(page.locator('[data-file-id="f-cad-1"]')).toHaveCount(0);

    await inlineFilter.fill("KALIP");
    await expect(page.locator('[data-file-id="f-cad-1"]')).toBeVisible();

    await inlineFilter.fill("bulunamayan-dosya-xyz");
    await expect(page.getByText("Filtreleme Kriterine Uygun Dosya Yok")).toBeVisible();
    await page.getByRole("button", { name: "Filtreleri Temizle" }).click();
    await expect(page.locator('[data-file-id="f-cad-1"]')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("S1.5 & S1.6: Sıralama matrisi ve Liste/Grid gruplama (daralt/aç, Grubu Seç, tek başlık)", async ({ page }) => {
    const errors = attachErrorGuard(page);
    const requests = await setupS1Mock(page);
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("dok-file-row").first()).toBeVisible();

    // Sıralama dropdown seçenekleri
    const sortBtn = page.getByRole("button", { name: "Sırala" });
    for (const label of [
      "İsim (Z → A)",
      "En Yeni İlk",
      "En Eski İlk",
      "Büyük → Küçük",
      "Küçük → Büyük",
      "Türe Göre (Uzantı A-Z)",
      "İsim (A → Z)",
    ]) {
      await sortBtn.click();
      await page.getByRole("menuitem", { name: label }).click();
    }

    // Sütun başlığından sıralama
    await page.getByRole("button", { name: "Boyut", exact: true }).click();
    expect(requests.some((u) => u.searchParams.has("order"))).toBe(true);

    // S1.6: Liste modunda gruplama
    for (const groupLabel of ["Türe Göre (CAD, PDF, vb.)", "Tarihe Göre (Bugün, Bu Ay)", "Boyuta Göre (>100MB, <5MB)"]) {
      await page.getByRole("button", { name: "Grupla" }).click();
      await page.getByRole("menuitem", { name: groupLabel }).click();
      const firstHeader = page.getByTestId("dok-group-header").first();
      await expect(firstHeader).toBeVisible();
    }

    // Tek sticky sütun başlığı (duplike yok)
    await expect(page.getByRole("button", { name: "Değiştirilme", exact: true })).toHaveCount(1);

    // Daralt / aç + Grubu Seç
    const firstHeader = page.getByTestId("dok-group-header").first();
    const toggleBtn = firstHeader.locator("button[aria-expanded]");
    await expect(toggleBtn).toHaveAttribute("aria-expanded", "true");
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute("aria-expanded", "true");

    await firstHeader.getByRole("button", { name: /Grubu Seç/ }).click();
    expect(await page.locator('[data-selected="true"]').count()).toBeGreaterThan(0);

    // Grid modunda gruplama
    await page.getByRole("button", { name: "Kart (Grid) Görünümü", exact: true }).click();
    await expect(page.getByTestId("dok-group-header").first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});

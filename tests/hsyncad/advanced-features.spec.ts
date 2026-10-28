import { test, expect } from "@playwright/test";

test("TBDY 2018 analysis, visualization modes, foundations, stairs and pafta layout", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");

  // 1. Create a column at (0, 0) and a beam from (0, 0) to (4, 0)
  await page.getByTestId("tool-column").click();
  await page.getByTestId("coordinate-x").fill("0");
  await page.getByTestId("coordinate-y").fill("0");
  await page.getByTestId("coordinate-place").click();

  await page.getByTestId("tool-beam").click();
  for (const [x, y] of [[0, 0], [4, 0]]) {
    await page.getByTestId("coordinate-x").fill(String(x));
    await page.getByTestId("coordinate-y").fill(String(y));
    await page.getByTestId("coordinate-place").click();
  }

  // 2. Open Analysis via Ribbon "Betonarme" -> "Analiz Tasarım" (11760)
  await page.getByRole("tab", { name: "Betonarme", exact: true }).click();
  await page.locator('button[data-command-id="11760"]').click();

  // Verify Analysis Dialog is open
  const dialog = page.getByTestId("hsyncad-analysis-dialog");
  await expect(dialog).toBeVisible();

  // Verify summary statistics exist
  await expect(dialog.getByText("Bina Toplam Ağırlığı (W)")).toBeVisible();
  await expect(dialog.getByText("Doğal Titreşim Periyodu (T1)")).toBeVisible();
  await expect(dialog.getByText("Tasarım Taban Kesmesi (Vt)")).toBeVisible();
  await expect(dialog.getByText("Maks. Göreli Kat Ötelemesi")).toBeVisible();

  // Switch tabs in dialog
  await dialog.getByRole("button", { name: "Kat & Göreli Öteleme" }).click();
  await expect(dialog.locator("table")).toBeVisible();

  await dialog.getByRole("button", { name: "Kolon Tahkikleri" }).click();
  await expect(dialog.getByText("Eksenel Yük")).toBeVisible();

  await dialog.getByRole("button", { name: "Kiriş Donatıları" }).click();
  await expect(dialog.getByText("Önerilen Donatı")).toBeVisible();

  await dialog.getByRole("button", { name: "Birleşim & Güçlü Kolon" }).click();
  await expect(dialog.getByText("Birleşim Türü")).toBeVisible();
  await expect(dialog.getByText("ΣMc / ΣMb")).toBeVisible();

  await dialog.getByRole("button", { name: "Düzensizlikler" }).click();
  await expect(dialog.getByText("A1 — Burulma Düzensizliği Kontrolü")).toBeVisible();
  await expect(dialog.getByText("B2 — Komşu Katlar Arası Dayanım")).toBeVisible();

  await dialog.getByRole("button", { name: "Deprem Parametreleri" }).click();
  await expect(dialog.getByText("Kısa Periyot Tasarım Spektral İvmesi SDS")).toBeVisible();

  // Verify DXF download from analysis dialog
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByTestId("analysis-dxf-export").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain(".dxf");

  // Close dialog
  await dialog.getByTestId("analysis-close-btn").click();
  await expect(dialog).not.toBeVisible();

  // 3. Visualization Modes via Ribbon "Analiz ve Tasarım Görüntüleme"
  await page.getByRole("tab", { name: "Analiz ve Tasarım Görüntüleme", exact: true }).click();

  // Moment 3-3 mode (11840)
  await page.locator('button[data-command-id="11840"]').click();
  await expect(page.getByTestId("hsyncad-plan")).toHaveAttribute("data-analysis-mode", "moment");

  // Kesme kuvveti 2-2 mode (11839)
  await page.locator('button[data-command-id="11839"]').click();
  await expect(page.getByTestId("hsyncad-plan")).toHaveAttribute("data-analysis-mode", "shear");

  // Toggle off back to none
  await page.locator('button[data-command-id="11839"]').click();
  await expect(page.getByTestId("hsyncad-plan")).toHaveAttribute("data-analysis-mode", "none");

  // 4. Foundations: Add a Pad Footing (Tekil Temel - 12710)
  await page.getByRole("tab", { name: "Betonarme", exact: true }).click();
  await page.locator('button[data-command-id="12710"]').click();

  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem("hsyncad.model.v1")!));
  await expect.poll(async () => {
    const m = await saved();
    return m.elements.some((e: any) => e.layer === "Temeller");
  }).toBe(true);

  // Add Stair (Merdiven - 13830)
  await page.locator('button[data-command-id="13830"]').click();
  await expect.poll(async () => {
    const m = await saved();
    return m.elements.some((e: any) => e.layer === "Merdivenler");
  }).toBe(true);

  // 5. Pafta Layout Mode via "Çizimler" -> "Yeni Pafta Oluştur" (40202)
  await page.getByRole("tab", { name: "Çizimler", exact: true }).click();
  await page.locator('button[data-command-id="40202"]').click();
  await expect(page.getByTestId("hsyncad-plan")).toHaveAttribute("data-pafta-mode", "true");
  await expect(page.locator(".hcad-pafta-frame")).toBeVisible();
  await expect(page.getByText("hsynCAD - STATİK UYGULAMA PLANI")).toBeVisible();

  // Toggle Pafta mode off
  await page.locator('button[data-command-id="40202"]').click();
  await expect(page.getByTestId("hsyncad-plan")).toHaveAttribute("data-pafta-mode", "false");
  await expect(page.locator(".hcad-pafta-frame")).not.toBeVisible();

  // 6. Test Kalıp Planı via Betonarme drawings dropdown (11307 -> 11990)
  await page.getByRole("button", { name: "Betonarme alt komutları" }).first().click();
  await page.getByRole("menuitem", { name: "Kalıp Planı" }).click();
  await expect(page.getByTestId("hsyncad-plan")).toHaveAttribute("data-pafta-mode", "true");

  // 7. Test Kiriş Açılımları DXF download via dropdown (11307 -> 63389)
  await page.getByRole("button", { name: "Betonarme alt komutları" }).first().click();
  const beamDownloadPromise = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Kiriş Açılımları" }).click();
  const beamDxf = await beamDownloadPromise;
  expect(beamDxf.suggestedFilename()).toContain(".dxf");

  expect(errors).toEqual([]);
});

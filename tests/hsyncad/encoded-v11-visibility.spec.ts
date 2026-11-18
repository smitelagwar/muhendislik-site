import { expect, test } from "@playwright/test";
import { existsSync } from "node:fs";

// T-F5.2 — encoded v11 (.ide11, 211220) UI görünürlük smoke testi.
// X11 korpus dosyası yalnız OKUNUR; worker → parseIde10 → importIdeWorkspace → etiketler DOM'da.
const X11_PATH = "C:/Users/hsyn/Desktop/hsyncad/incelemeler/donusum-esdegerlik-2026-11-15/00-kaynak/X11_downloads.ide11";

test("encoded v11 .ide11 açılınca malzeme/deprem/donatı/F9 sayı etiketleri workbench ve rapor penceresinde görünür", async ({ page }, testInfo) => {
  test.skip(!existsSync(X11_PATH), "Gerçek X11 korpus dosyası gerekir");
  test.setTimeout(150_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  // 140 MB gerçek dosya: yükleme adımı için sayfa bazlı en fazla 60 sn bekleme.
  await page.getByTestId("hsyncad-import").setInputFiles(X11_PATH);
  await expect(page.getByTestId("hsyncad-ide-import-report")).toContainText("eleman düzenlemeye aktarıldı", { timeout: 60_000 });

  // Workbench aktarım raporu: R1/R3/R4/R5 özet etiketi.
  const summary = page.getByTestId("hsyncad-ide-r15-summary");
  await expect(summary).toContainText("2 malzeme", { timeout: 8_000 });
  await expect(summary).toContainText("deprem/zemin XC2/DSF1");
  await expect(summary).toContainText("r=6");
  await expect(summary).toContainText("ko=3080 tf/m³");
  await expect(summary).toContainText("468 donatı düzeni");
  await expect(summary).toContainText("10 F9/modal tablosu");
  await page.screenshot({ path: testInfo.outputPath("x11-workbench-r15.png"), fullPage: true });

  // Statik Rapor Ayarları penceresi: kaynak sayım rozeti.
  await page.getByTestId("hsyncad-ide-report-open").click();
  const dialogBadge = page.getByTestId("hsyncad-ide-source-summary");
  await expect(dialogBadge).toBeVisible({ timeout: 8_000 });
  await expect(dialogBadge).toContainText("2 malzeme");
  await expect(dialogBadge).toContainText("468 donatı");
  await expect(dialogBadge).toContainText("10 F9/modal tablosu");
  await expect(dialogBadge).toContainText("deprem: XC2/DSF1");
  await page.screenshot({ path: testInfo.outputPath("x11-dialog-r15.png"), fullPage: true });

  expect(errors).toEqual([]);
});

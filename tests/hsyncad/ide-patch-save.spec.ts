import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { parseIde10 } from "../../src/lib/hsyncad/ide-import/index";

// T-F6.2 — UI kaydetme akışı smoke testi (T-F5.2 deseni).
// X11 korpus dosyası yalnız OKUNUR; tarayıcı: yükle → K34 kesit 0.55 DÜZENLE
// → native kaydet → indirilen yamalı dosya parse + bayt karşılaştırma:
// yama alanı @1377843 (8B) + CRC mührü @83 (4B) dışı fark YOK; düzenleme
// yapılmadan native kaydetme RED mesajı görünür (ürün ilkesi).
const X11_PATH = "C:/Users/hsyn/Desktop/hsyncad/incelemeler/donusum-esdegerlik-2026-11-15/00-kaynak/X11_downloads.ide11";
const K34_ID = "ide-floor-1:6129433";
const K34_FIELD_OFFSET = 1377573 + "K34".length + 1 + 266; // 1377843 (t61 sözleşmesi)

test("ide11 aç → K34 kesit 0.55 düzenle → native kaydet → yamalı dosya doğrula; değişiklik dışı kaydetme RED", async ({ page }, testInfo) => {
  test.skip(!existsSync(X11_PATH), "Gerçek X11 korpus dosyası gerekir");
  test.setTimeout(300_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");

  // 140 MB gerçek dosya: yükleme adımı için sayfa bazlı en fazla 90 sn bekleme.
  await page.getByTestId("hsyncad-import").setInputFiles(X11_PATH);
  await expect(page.getByTestId("hsyncad-ide-import-report")).toContainText("eleman düzenlemeye aktarıldı", { timeout: 90_000 });

  // (1) Değişiklik dışı native kaydetme REDDİ edilir (ürün ilkesi korunur).
  await expect(page.getByTestId("ide-native-save-row")).toBeVisible();
  await expect(page.getByTestId("ide-native-patch-count")).toContainText("Henüz native yazılabilir düzenleme yok");
  await page.getByTestId("ide-native-save").click();
  await expect(page.getByTestId("hsyncad-message")).toContainText("Değişiklik dışı native kaydetme reddedilir", { timeout: 8_000 });
  await page.screenshot({ path: testInfo.outputPath("t62-red-mesaj.png") });

  // (2) K34 (ide-floor-1:6129433) seçilir; mevcut özellik panelinden kesit h 0.55 yapılır.
  await page.getByTestId("hsyncad-element-list").locator("summary").click();
  await page.getByTestId("element-K34").first().click();
  const height = page.getByTestId("property-height");
  await expect(height).toBeVisible();
  await expect(height).toHaveValue("0.5");
  await height.fill("0.55");
  await page.getByTestId("property-apply").click();
  await expect(page.getByTestId("ide-native-patch-count")).toContainText("1 kiriş kesit yüksekliği yaması kayda hazır: K34", { timeout: 8_000 });

  // (3) Native kaydet → indirilen yamalı dosya (çıktı daima YENİ adla).
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 120_000 }),
    page.getByTestId("ide-native-save").click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^HS_.*_duzenlenmis\.ide11$/);
  const patchedPath = await download.path();
  expect(patchedPath, "indirme tamamlanmalı").toBeTruthy();
  await page.screenshot({ path: testInfo.outputPath("t62-native-kaydet-sonrasi.png") });

  // (4) Bayt karşılaştırma: fark YALNIZ yama alanı (8B) + CRC mührü (≤4B) içinde.
  const original = new Uint8Array(readFileSync(X11_PATH));
  const patched = new Uint8Array(readFileSync(patchedPath!));
  expect(patched.byteLength).toBe(original.byteLength);
  const fieldDiffs: number[] = [], crcDiffs: number[] = [], strayDiffs: number[] = [];
  for (let i = 0; i < original.byteLength; i++) {
    if (original[i] === patched[i]) continue;
    if (i >= K34_FIELD_OFFSET && i < K34_FIELD_OFFSET + 8) fieldDiffs.push(i);
    else if (i >= 83 && i < 87) crcDiffs.push(i);
    else strayDiffs.push(i);
  }
  expect(fieldDiffs.length, "yama alanında tam 8 bayt değişmeli").toBe(8);
  expect(crcDiffs.length).toBeGreaterThanOrEqual(1);
  expect(strayDiffs.length, `yama kapsamı dışı bayt değişti: ${strayDiffs.slice(0, 8).join(", ")}`).toBe(0);

  // (5) Parse: K34 (ide-floor-1) = 0.55; diğer katlardaki K34'ler 0.50 kalır.
  const raw = readFileSync(patchedPath!);
  const reopened = parseIde10(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer, "yamali.ide11");
  const beams = reopened.elements.filter(e => e.name === "K34");
  expect(beams.length).toBe(4);
  const k34 = beams.find(e => e.id === K34_ID);
  expect(k34?.height).toBeCloseTo(0.55, 12);
  for (const other of beams.filter(e => e.id !== K34_ID)) expect(other.height).toBeCloseTo(0.5, 12);
  expect(errors, "sayfa hatası olmamalı").toEqual([]);
});

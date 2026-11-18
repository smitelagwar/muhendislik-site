import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

import { parseIde10 } from "../../src/lib/hsyncad/ide-import";
import { getIdeCarrierFormat, validateIdeCarrier } from "../../src/lib/hsyncad/ide-import/ide-binary-codec";
import { saveNativeIdeSource } from "../../src/lib/hsyncad/ide-native-save";

// T-F1.4 — .ide11 dışa aktarma düğmesi (ide-file-menu.tsx:43) T-F1.3 sonrası:
// getIdeCarrierFormat kilit baytlarından (previewEnd+28/+29) ayırdığı için
// ideCAD 11.28'in kendi ticari .ide11 çıktısı (211280) artık "ide11" sayılır.
const commercial = "C:/Users/hsyn/Desktop/hsyncad_idecad_uzanti_optimizasyon/evidence/hsyncad-conversions/HS_B0_orijinal.ide11";
// Negatif durum: aynı projenin deneme kaydı (görev "aynı klasörde" demişti; korpus
// klasöründeki orijinal B0_orijinal.ide11trial kullanıldı — conversions klasöründe
// .ide11trial yoktur, raporda belirtilmiştir).
const trial = "C:/Users/hsyn/Desktop/hsyncad/incelemeler/donusum-esdegerlik-2026-11-15/00-kaynak/B0_orijinal.ide11trial";

// ide-file-menu.tsx:43 koşulunun birebir karşılığı:
//   const canExportIde11 = Boolean(sourceFile && project?.format === "ide11");
const canExportIde11 = (sourceFile: boolean, project: { format?: string } | null) =>
  Boolean(sourceFile && project?.format === "ide11");

test("gerçek B0 ticari .ide11 (211280) yüklenince .ide11 dışa aktarma koşulu açılır", async ({ page }, testInfo) => {
  test.skip(!existsSync(commercial) || !existsSync(trial), "Gerçek B0 korpus dosyaları gerekir");
  test.setTimeout(150_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  // 140 MB gerçek dosya: worker üzerinden parse — yükleme adımı için 60 sn sayfa bazlı bekleme.
  await page.getByTestId("hsyncad-import").setInputFiles(commercial);
  await expect(page.getByTestId("hsyncad-ide-import-report")).toContainText("eleman düzenlemeye aktarıldı", { timeout: 60_000 });
  const importedFormat = () => page.evaluate(() => (JSON.parse(localStorage.getItem("hsyncad.model.v1")!).ideImport?.source?.format) ?? "yok");
  await expect.poll(importedFormat, { timeout: 8_000 }).toBe("ide11");
  const imported = await page.evaluate(() => JSON.parse(localStorage.getItem("hsyncad.model.v1")!).ideImport.source);
  expect(imported.filename).toBe("HS_B0_orijinal.ide11");
  // Panelde kaynak dosya seçili olduğu için koşul yalnız project.format'a bağlıdır.
  expect(canExportIde11(true, imported)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("b0-ide11-acik.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("negatif: B0 deneme kaydı .ide11trial yüklenince .ide11 dışa aktarma koşulu kapalı kalır", async ({ page }, testInfo) => {
  test.skip(!existsSync(commercial) || !existsSync(trial), "Gerçek B0 korpus dosyaları gerekir");
  test.setTimeout(150_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await page.getByTestId("hsyncad-import").setInputFiles(trial);
  await expect(page.getByTestId("hsyncad-ide-import-report")).toContainText("eleman düzenlemeye aktarıldı", { timeout: 60_000 });
  const importedFormat = () => page.evaluate(() => (JSON.parse(localStorage.getItem("hsyncad.model.v1")!).ideImport?.source?.format) ?? "yok");
  await expect.poll(importedFormat, { timeout: 8_000 }).toBe("ide11trial");
  const imported = await page.evaluate(() => JSON.parse(localStorage.getItem("hsyncad.model.v1")!).ideImport.source);
  expect(imported.filename).toBe("B0_orijinal.ide11trial");
  expect(canExportIde11(true, imported)).toBe(false);
  await page.screenshot({ path: testInfo.outputPath("b0-trial-kapali.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("birim: getIdeCarrierFormat kilit baytından ayırır ve saveNativeIdeSource yalnız doğru biçimde yazar", () => {
  test.skip(!existsSync(commercial) || !existsSync(trial), "Gerçek B0 korpus dosyaları gerekir");
  test.setTimeout(120_000);
  const commercialBytes = new Uint8Array(readFileSync(commercial));
  const trialBytes = new Uint8Array(readFileSync(trial));
  const commercialMeta = validateIdeCarrier(commercialBytes), trialMeta = validateIdeCarrier(trialBytes);
  // T-F1.3 kanıtı: iki dosya da 211280 + encodedFlag 1 taşıyor; ayırım kilit baytlarından geliyor.
  expect(commercialMeta.formatVersion).toBe(211280);
  expect(trialMeta.formatVersion).toBe(211280);
  expect(getIdeCarrierFormat(commercialBytes, commercialMeta)).toBe("ide11");
  expect(getIdeCarrierFormat(trialBytes, trialMeta)).toBe("ide11trial");
  const bufferOf = (bytes: Uint8Array) => Uint8Array.from(bytes).buffer;
  const commercialProject = parseIde10(bufferOf(commercialBytes), "HS_B0_orijinal.ide11");
  const trialProject = parseIde10(bufferOf(trialBytes), "B0_orijinal.ide11trial");
  expect(commercialProject.format).toBe("ide11");
  expect(trialProject.format).toBe("ide11trial");
  expect(commercialProject.floors).toHaveLength(6);
  // Düğmenin eylemi: ticari B0 .ide11 kaynağı olduğu gibi korunarak indirilir.
  const saved = saveNativeIdeSource(commercialBytes, commercialProject, "ide11");
  expect(saved.format).toBe("ide11");
  expect(Buffer.compare(Buffer.from(saved.bytes), Buffer.from(commercialBytes))).toBe(0);
  // Deneme kaydı için .ide11 istenirse düğme arkasındaki fonksiyon net hata verir.
  expect(() => saveNativeIdeSource(trialBytes, trialProject, "ide11")).toThrow(/Kaynak ide11trial biçiminde/);
});

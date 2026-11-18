import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import { smallSlab, pdfText } from "../hsyncad-structural/report-fixtures";

test("model -> missing mass -> downloaded PDF remains partial on desktop and narrow viewport", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await page.getByTestId("hsyncad-import").setInputFiles({ name: "P02-bagimsiz.hsyncad", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(smallSlab())) });
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("hsyncad.model.v1")!).elements.length)).toBe(1);
  await page.getByRole("button", { name: "Sağ metraj raporu", exact: true }).click();
  await expect(page.getByTestId("takeoff-concrete")).toHaveText("2,4");
  await expect(page.getByTestId("takeoff-rebar")).toHaveText("Bilinmiyor");
  await expect(page.getByTestId("takeoff-integrity-status")).toContainText("Bilinmeyen miktar sıfır değildir");
  const downloaded = page.waitForEvent("download", { timeout: 8_000 });
  await page.getByTestId("download-metraj-pdf").click();
  const file = info.outputPath("P02-metraj.pdf"); await (await downloaded).saveAs(file);
  const { text } = await pdfText(new Uint8Array(await fs.readFile(file)));
  expect(text).toContain("VERİ EKSİK");
  expect(text).not.toMatch(/E-İMZALIDIR|Resmi Onay Belgesidir|117[.,]421/);
  await page.screenshot({ path: info.outputPath("desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByTestId("download-metraj-pdf")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("mobile.png") });
  await page.getByRole("button", { name: "Ayarları kapat", exact: true }).click();
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.getByRole("tab", { name: "Görüntü", exact: true }).click();
  await page.getByRole("button", { name: "Koyu çalışma alanı", exact: true }).click();
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-cad-theme", "dark");
  await page.getByRole("button", { name: "Sağ metraj raporu", exact: true }).click();
  await expect(page.getByTestId("takeoff-rebar")).toHaveText("Bilinmiyor");
  await page.screenshot({ path: info.outputPath("dark.png") });
  expect(errors).toEqual([]);
});

test("migrated project cannot run the old engine with ignored structural settings", async ({ page }) => {
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await page.getByTestId("hsyncad-import").setInputFiles({ name: "P03-eksik.hsyncad", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(smallSlab())) });
  await expect.poll(() => page.evaluate(() => !!JSON.parse(localStorage.getItem("hsyncad.model.v1")!).structural)).toBe(true);
  await page.getByRole("textbox", { name: "Komut ara", exact: true }).fill("Seçmeli Raporlar");
  await page.getByRole("button", { name: /^Seçmeli Raporlar/ }).first().click();
  await expect(page.getByTestId("static-report-readiness")).toContainText("VERİ EKSİK");
  await expect(page.getByTestId("download-static-pdf-btn")).toHaveCount(0);
  await expect(page.getByTestId("run-analysis-btn")).toBeDisabled();
});

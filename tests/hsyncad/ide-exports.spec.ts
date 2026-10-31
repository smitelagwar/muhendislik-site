import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const artifacts = path.join(process.cwd(), "test-output/hsyncad-exports");
const original = "D:/IDM_DOWNLOAD/MUSTAFA SELVİ TÜM PROJELER/STATİK/1.kısım/MUSTAFA SELVİ 1.KISIM.ide10";
const digest = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

test("native source copy, independent exports and saved viewer project reopen without replacing the editor", async ({ page }) => {
  test.setTimeout(150_000);
  await fs.mkdir(artifacts, { recursive: true });
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  const editorBefore = await page.evaluate(() => localStorage.getItem("hsyncad.model.v1"));
  await page.getByTestId("hsyncad-import").setInputFiles(original);
  await expect(page.getByTestId("ide-loading")).toBeHidden({ timeout: 60_000 });
  await expect(page.getByTestId("ide-viewer")).toHaveAttribute("data-element-count", "1273");
  const formats = ["snapshot", "dxf", "svg", "png", "source"] as const;
  const saved: Record<string, string> = {};
  for (const format of formats) {
    await page.getByTestId("ide-file-menu").click();
    await expect(page.getByTestId("ide-export-menu")).toBeVisible();
    const downloadEvent = page.waitForEvent("download");
    await page.getByTestId(format === "source" ? "ide-save-source" : format === "snapshot" ? "ide-save-snapshot" : `ide-export-${format}`).click();
    const download = await downloadEvent;
    expect(await download.failure()).toBeNull();
    const file = path.join(artifacts, download.suggestedFilename());
    await download.saveAs(file); saved[format] = file;
  }
  const snapshot = JSON.parse(await fs.readFile(saved.snapshot, "utf8"));
  expect(snapshot.kind).toBe("hsyncad-ide-viewer");
  expect(snapshot.project.elements).toHaveLength(1273);
  expect((await fs.readFile(saved.dxf, "utf8"))).toContain("AC1024");
  expect((await fs.readFile(saved.svg, "utf8"))).toContain("<svg");
  expect((await fs.readFile(saved.png)).subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(digest(await fs.readFile(saved.source))).toBe(digest(await fs.readFile(original)));
  await page.reload();
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await page.getByTestId("open-ide-projects").click();
  await expect(page.getByTestId("ide-viewer")).toHaveAttribute("data-element-count", "1273", { timeout: 15_000 });
  await page.getByTestId("ide-file-menu").click();
  await expect(page.getByTestId("ide-save-source")).toBeEnabled();
  await page.getByTestId("ide-file-menu").click();
  await page.getByTestId("ide-file-input").setInputFiles(saved.snapshot);
  await expect(page.getByTestId("ide-loading")).toBeHidden({ timeout: 30_000 });
  await expect(page.getByTestId("ide-error")).toHaveCount(0);
  await expect(page.getByTestId("ide-viewer")).toHaveAttribute("data-element-count", "1273");
  await page.getByTestId("ide-file-menu").click();
  await expect(page.getByTestId("ide-save-source")).toBeDisabled();
  await page.screenshot({ path: path.join(artifacts, "save-as-export-menu.png") });
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("ide-export-menu")).toHaveCount(0);
  await expect(page.getByTestId("ide-viewer")).toBeVisible();
  await page.getByTestId("ide-close").click();
  expect(await page.evaluate(() => localStorage.getItem("hsyncad.model.v1"))).toBe(editorBefore);
  expect(errors).toEqual([]);
});

test("file menu fits a narrow screen and Escape keeps the viewer open", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await page.getByTestId("open-ide-projects").click();
  await page.getByTestId("ide-file-menu").click();
  await expect(page.getByTestId("ide-export-menu")).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("ide-viewer")).toBeVisible();
});

test("saved trial sample opens directly and exports a reusable project while preserving the native source", async ({ page }) => {
  test.setTimeout(120_000);
  await fs.mkdir(artifacts, { recursive: true });
  const trial = "C:/Users/hsyn/Desktop/MUSTAFA SELVİ 1.KISIM.ide11trial";
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  const editorBefore = await page.evaluate(() => localStorage.getItem("hsyncad.model.v1"));
  await page.getByTestId("open-ide-projects").click();
  await page.getByTestId("ide-sample-mustafa-selvi-1-trial").click();
  await expect(page.getByTestId("ide-loading")).toBeHidden({ timeout: 60_000 });
  await expect(page.getByTestId("ide-error")).toHaveCount(0);
  await expect(page.getByTestId("ide-viewer")).toHaveAttribute("data-element-count", "1273");
  await expect(page.getByTestId("ide-floor").locator("option")).toHaveCount(6);
  await expect(page.getByTestId("ide-3d-canvas")).toHaveAttribute("data-native-mesh-count", "7");
  await page.getByTestId("ide-file-menu").click();
  await page.screenshot({ path: path.join(artifacts, "trial-project-and-export-menu.png") });
  const snapshotEvent = page.waitForEvent("download");
  await page.getByTestId("ide-save-snapshot").click();
  const snapshotDownload = await snapshotEvent;
  const snapshotFile = path.join(artifacts, "mustafa-1-trial.hsyncad");
  await snapshotDownload.saveAs(snapshotFile);
  const saved = JSON.parse(await fs.readFile(snapshotFile, "utf8"));
  expect(saved.project.format).toBe("ide11trial");
  expect(saved.project.coverage.unsupportedRecords).toBe(0);
  expect(saved.project.elements.filter((e: { planAnnotation?: { loads?: unknown } }) => e.planAnnotation?.loads)).toHaveLength(159);

  await page.getByTestId("ide-file-menu").click();
  const ide11Event = page.waitForEvent("download");
  await page.getByTestId("ide-export-ide11").click();
  const ide11Download = await ide11Event;
  expect(ide11Download.suggestedFilename()).toBe("MUSTAFA SELVİ 1.KISIM.ide11");
  const ide11File = path.join(artifacts, "mustafa-1-from-trial.ide11");
  await ide11Download.saveAs(ide11File);

  await page.getByTestId("ide-file-menu").click();
  const ide10Event = page.waitForEvent("download");
  await page.getByTestId("ide-export-ide10").click();
  const ide10Download = await ide10Event;
  expect(ide10Download.suggestedFilename()).toBe("MUSTAFA SELVİ 1.KISIM.ide10");
  const ide10File = path.join(artifacts, "mustafa-1-from-trial.ide10");
  await ide10Download.saveAs(ide10File);
  expect(digest(await fs.readFile(ide10File))).toBe(digest(await fs.readFile(original)));

  await page.getByTestId("ide-file-menu").click();
  const sourceEvent = page.waitForEvent("download");
  await page.getByTestId("ide-save-source").click();
  const sourceDownload = await sourceEvent;
  expect(sourceDownload.suggestedFilename()).toMatch(/\.ide11trial$/);
  const copy = path.join(artifacts, "trial-source-copy.ide11trial");
  await sourceDownload.saveAs(copy);
  expect(digest(await fs.readFile(copy))).toBe(digest(await fs.readFile(trial)));

  // Reopen exported .ide11 and .ide10 in the viewer to verify end-to-end roundtrip
  await page.getByTestId("ide-file-input").setInputFiles(ide11File);
  await expect(page.getByTestId("ide-loading")).toBeHidden({ timeout: 60_000 });
  await expect(page.getByTestId("ide-viewer")).toHaveAttribute("data-element-count", "1273");

  await page.getByTestId("ide-file-input").setInputFiles(ide10File);
  await expect(page.getByTestId("ide-loading")).toBeHidden({ timeout: 60_000 });
  await expect(page.getByTestId("ide-viewer")).toHaveAttribute("data-element-count", "1273");
  await page.getByTestId("ide-file-input").setInputFiles(snapshotFile);
  await expect(page.getByTestId("ide-loading")).toBeHidden({ timeout: 30_000 });
  await expect(page.getByTestId("ide-viewer")).toHaveAttribute("data-element-count", "1273");
  await page.getByTestId("ide-close").click();
  expect(await page.evaluate(() => localStorage.getItem("hsyncad.model.v1"))).toBe(editorBefore);
  expect(errors).toEqual([]);
});

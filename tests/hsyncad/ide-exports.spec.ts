import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { createDemoModel } from "../../src/lib/hsyncad/model";
import { createIdeCadPanelDemo } from "../../src/lib/hsyncad/ifc-panels";

const artifacts = path.join(process.cwd(), "test-output/hsyncad-exports");
const original = "D:/IDM_DOWNLOAD/MUSTAFA SELVİ TÜM PROJELER/STATİK/1.kısım/MUSTAFA SELVİ 1.KISIM.ide10";
const digest = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");

for (const sample of [
  { name: "one-storey", fixture: process.env.HSYNCAD_IFC_PANELS_FIXTURE, solids: 11, floors: 1 },
  { name: "three-storey", fixture: process.env.HSYNCAD_IFC_TC33_RESAVED_FIXTURE, solids: 33, floors: 3 },
]) test(`IFC-created native ${sample.name} panel sample opens and preserves its trial source`, async ({ page }) => {
  const fixture = sample.fixture;
  test.skip(!fixture, "Requires the actual ideCAD-saved panel fixture");
  if (!fixture) return;
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await page.getByTestId("hsyncad-import").setInputFiles(fixture);
  await expect(page.getByTestId("ide-viewer")).toHaveAttribute("data-element-count", String(sample.solids));
  await expect(page.getByTestId("ide-floor").locator("option")).toHaveCount(sample.floors);
  await page.getByTestId("ide-file-menu").click();
  await expect(page.getByTestId("ide-export-ide10")).toBeDisabled();
  await expect(page.getByTestId("ide-export-ide11")).toBeDisabled();
  const download = page.waitForEvent("download", { timeout: 8000 });
  await page.getByTestId("ide-save-source").click();
  const copy = await download;
  expect(copy.suggestedFilename()).toMatch(/\.ide11trial$/);
  expect(digest(await fs.readFile((await copy.path())!))).toBe(digest(await fs.readFile(fixture)));
});

test("compressed ideCAD 11.04 opens in the viewer and preserves the .cde source", async ({ page }) => {
  const fixture = process.env.HSYNCAD_IDE211040_FIXTURE;
  test.skip(!fixture, "Requires the official ideYAPI 11.04 project");
  if (!fixture) return;
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await page.getByTestId("open-ide-projects").click();
  await page.getByTestId("ide-file-input").setInputFiles(fixture);
  await expect(page.getByTestId("ide-viewer")).toHaveAttribute("data-element-count", "135", { timeout: 45_000 });
  await expect(page.getByTestId("ide-floor").locator("option")).toHaveCount(2);
  await page.getByTestId("ide-file-menu").click();
  const download = page.waitForEvent("download", { timeout: 8000 });
  await page.getByTestId("ide-save-source").click();
  const source = await download;
  expect(source.suggestedFilename()).toMatch(/\.cde$/i);
  expect(digest(await fs.readFile((await source.path())!))).toBe(digest(await fs.readFile(fixture)));
});

test("native short-member offsets and circular section dimensions appear in the inspector and saved snapshot", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  const fixture = process.env.HSYNCAD_IFC_TC8_R2_FIXTURE;
  test.skip(!fixture, "Requires the native custom-section acceptance fixture");
  if (!fixture) return;
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await page.getByTestId("hsyncad-import").setInputFiles(fixture);
  await expect(page.getByTestId("ide-viewer")).toHaveAttribute("data-element-count", "8");
  await page.getByTestId("ide-element").filter({ has: page.getByText("S92", { exact: true }) }).click();
  await expect(page.getByTestId("ide-native-top-offset-info")).toContainText("-0,5 m");
  await expect(page.getByTestId("ide-selection").locator("dd")).toContainText(["Zemin kat", "2,3", "0,2", "2,5"]);
  await page.getByTestId("ide-element").filter({ has: page.getByText("S93", { exact: true }) }).click();
  await expect(page.getByTestId("ide-native-circle-info")).toContainText("0,6 m");
  await page.getByTestId("ide-file-menu").click();
  const downloaded = page.waitForEvent("download", { timeout: 8000 });
  await page.getByTestId("ide-save-snapshot").click();
  const snapshotFile = await downloaded;
  const snapshot = JSON.parse(await fs.readFile((await snapshotFile.path())!, "utf8"));
  expect(snapshot.project.elements.find((e: { name: string }) => e.name === "S92").top).toBeCloseTo(2.5, 8);
  expect(snapshot.project.elements.find((e: { name: string }) => e.name === "S93").circleSection.radius).toBeCloseTo(.3, 8);
  await page.getByTestId("ide-file-input").setInputFiles((await snapshotFile.path())!);
  await expect(page.getByTestId("ide-loading")).toBeHidden();
  await expect(page.getByTestId("ide-viewer")).toHaveAttribute("data-element-count", "8");
  await page.getByTestId("ide-element").filter({ has: page.getByText("S92", { exact: true }) }).click();
  await expect(page.getByTestId("ide-native-top-offset-info")).toContainText("-0,5 m");
  expect(errors).toEqual([]);
});

test("editable hsyncad model imports and downloads IFC with its coverage report", async ({ page }) => {
  const model = createIdeCadPanelDemo();
  model.name = "IFC aktarım modeli";
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await page.getByTestId("hsyncad-import").setInputFiles({ name: "model.hsyncad", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(model)) });
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "11");
  await expect(page.getByTestId("ide-viewer")).toHaveCount(0);
  await page.getByRole("tab", { name: /^(Ayarlar|Proje)$/ }).click();
  const ifc = page.waitForEvent("download", { predicate: file => file.suggestedFilename().endsWith(".ifc"), timeout: 8000 });
  const report = page.waitForEvent("download", { predicate: file => file.suggestedFilename().endsWith("-aktarim-raporu.json"), timeout: 8000 });
  await page.getByTestId("workbench-export-ifc").click();
  const [modelFile, reportFile] = await Promise.all([ifc, report]);
  expect(await fs.readFile((await modelFile.path())!, "utf8")).toContain("FILE_SCHEMA(('IFC2X3'))");
  const result = JSON.parse(await fs.readFile((await reportFile.path())!, "utf8"));
  expect(result.exported).toHaveLength(11);
  expect(result.omitted).toHaveLength(4);
  expect(result.nativeIdeCadVerified).toBe(false);
});

test("IFC refuses a slab spanning the internal wall and the panel example provides an exportable model", async ({ page }) => {
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await page.getByTestId("hsyncad-import").setInputFiles({ name: "unpanelled.hsyncad", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(createDemoModel())) });
  await page.getByRole("tab", { name: /^(Ayarlar|Proje)$/ }).click();
  const downloads: string[] = [];
  page.on("download", download => downloads.push(download.suggestedFilename()));
  await page.getByTestId("workbench-export-ifc").click();
  await expect(page.getByTestId("hsyncad-message")).toContainText("kapalı alan");
  expect(downloads).toEqual([]);
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "10");
  await page.getByTestId("load-idecad-panel-demo").click();
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "11");
  const modelFile = page.waitForEvent("download", { predicate: file => file.suggestedFilename().endsWith(".ifc"), timeout: 8000 });
  await page.getByTestId("workbench-export-ifc").click();
  expect((await modelFile).suggestedFilename()).toMatch(/\.ifc$/);
  await expect(page.getByTestId("hsyncad-message")).toContainText("11 eleman");
});

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
  await expect(page.getByTestId("ide-export-ide11")).toBeDisabled();
  await expect(page.getByTestId("ide-export-ide10")).toBeDisabled();
  const sourceEvent = page.waitForEvent("download");
  await page.getByTestId("ide-save-source").click();
  const sourceDownload = await sourceEvent;
  expect(sourceDownload.suggestedFilename()).toMatch(/\.ide11trial$/);
  const copy = path.join(artifacts, "trial-source-copy.ide11trial");
  await sourceDownload.saveAs(copy);
  expect(digest(await fs.readFile(copy))).toBe(digest(await fs.readFile(trial)));

  await page.getByTestId("ide-file-input").setInputFiles(snapshotFile);
  await expect(page.getByTestId("ide-loading")).toBeHidden({ timeout: 30_000 });
  await expect(page.getByTestId("ide-viewer")).toHaveAttribute("data-element-count", "1273");
  await page.getByTestId("ide-close").click();
  expect(await page.evaluate(() => localStorage.getItem("hsyncad.model.v1"))).toBe(editorBefore);
  expect(errors).toEqual([]);
});

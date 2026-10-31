import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const samples = [
  { id: "suheyla-kara", floors: 7, stairs: 9, elements: 2171, bands: 0, sections: 14, bandFloor: 1, file: "D:/IDM_DOWNLOAD/SÜHEYLA KARA PROJELER/STATİK/218 ada 50 parsel STATİK.ide10" },
  { id: "mustafa-selvi-2", floors: 5, stairs: 1, elements: 686, bands: 12, sections: 5, bandFloor: 0, file: "D:/IDM_DOWNLOAD/MUSTAFA SELVİ TÜM PROJELER/STATİK/2.kısım/MUSTAFA SELVİ 2.KISIM.ide10" },
  { id: "mustafa-selvi-1", floors: 6, stairs: 7, elements: 1273, bands: 25, sections: 6, bandFloor: 1, file: "D:/IDM_DOWNLOAD/MUSTAFA SELVİ TÜM PROJELER/STATİK/1.kısım/MUSTAFA SELVİ 1.KISIM.ide10" },
];
const artifacts = path.join(process.cwd(), "test-output", "hsyncad-ide");

test("three original IDE samples open through bottom shortcut and retain the editor model", async ({ page }) => {
  test.setTimeout(180_000);
  for (const sample of samples) await fs.access(sample.file);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await fs.mkdir(artifacts, { recursive: true });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  const editorBefore = await page.evaluate(() => localStorage.getItem("hsyncad.model.v1"));
  await page.getByTestId("open-ide-projects").click();
  await expect(page.getByTestId("ide-examples")).toBeVisible();
  for (const [i, sample] of samples.entries()) {
    if (i) await page.getByTestId("ide-examples-toggle").click();
    await page.getByTestId(`ide-sample-${sample.id}`).click();
    await expect(page.getByTestId("ide-loading")).toBeHidden({ timeout: 60_000 });
    await expect(page.getByTestId("ide-error")).toHaveCount(0);
    await expect(page.getByTestId("ide-viewer")).toHaveAttribute("data-element-count", String(sample.elements));
    await expect(page.getByTestId("ide-floor").locator("option")).toHaveCount(sample.floors);
    await expect(page.getByTestId("ide-plan-canvas")).toBeVisible();
    await expect(page.getByTestId("ide-3d-canvas")).toBeVisible();
    await expect(page.getByTestId("ide-3d-canvas")).toHaveAttribute("data-native-mesh-count", String(sample.stairs));
    await expect(page.getByTestId("ide-type-section")).toContainText(String(sample.sections));
    if (sample.bands) await expect(page.getByTestId("ide-type-band")).toContainText(String(sample.bands));
    await page.getByTestId("ide-type-stair").click();
    await expect(page.getByTestId("ide-3d-canvas")).toHaveAttribute("data-native-mesh-count", "0");
    await page.getByTestId("ide-type-stair").click();
    await expect(page.getByTestId("ide-3d-canvas")).toHaveAttribute("data-native-mesh-count", String(sample.stairs));
    if (sample.bands) {
      await page.getByTestId("ide-floor").selectOption({ index: sample.bandFloor });
      await page.getByRole("searchbox", { name: "IDE elemanı ara" }).fill("BAND");
      await page.getByTestId("ide-element").first().click();
      await expect(page.getByTestId("ide-plan-only-info")).toBeVisible();
      await page.getByRole("searchbox", { name: "IDE elemanı ara" }).fill("");
    }
    await page.getByTestId("ide-floor").selectOption({ index: sample.floors - 1 });
    await page.getByTestId("ide-fit").click();
    await page.getByRole("searchbox", { name: "IDE elemanı ara" }).fill("M");
    await page.getByTestId("ide-element").filter({ hasText: "Merdiven ağı" }).first().click();
    await expect(page.getByTestId("ide-native-mesh-info")).toContainText("XYZ kotları doğrudan dosyadan");
    if (sample.id === "mustafa-selvi-1") await page.screenshot({ path: path.join(artifacts, "mustafa-native-mesh.png") });
    await page.getByRole("searchbox", { name: "IDE elemanı ara" }).fill("");
    await expect(page.getByTestId("ide-selection")).toBeVisible();
    await page.screenshot({ path: path.join(artifacts, `${sample.id}-1920.png`) });
    await expect(page.locator("body")).not.toHaveJSProperty("scrollWidth", 0);
  }
  await page.getByTestId("ide-examples-toggle").click();
  await expect(page.getByTestId("ide-examples")).toBeVisible();
  await page.screenshot({ path: path.join(artifacts, "examples-bottom-right.png") });
  await page.getByTestId("ide-close").click();
  expect(await page.evaluate(() => localStorage.getItem("hsyncad.model.v1"))).toBe(editorBefore);
  await page.reload();
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await page.getByTestId("open-ide-projects").click();
  await expect(page.getByTestId("ide-status")).toContainText("MUSTAFA SELVİ 1.KISIM", { timeout: 10_000 });
  expect(errors).toEqual([]);
});

test("file input, malformed file recovery, mobile views and cancellation", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("open-ide-projects")).toBeInViewport();
  await page.getByTestId("hsyncad-import").setInputFiles(samples[1].file);
  await expect(page.getByTestId("ide-viewer")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("ide-loading")).toBeHidden({ timeout: 60_000 });
  await expect(page.getByTestId("ide-floor").locator("option")).toHaveCount(5, { timeout: 60_000 });
  await expect(page.getByTestId("ide-mobile-scope")).toBeVisible();
  const count = await page.getByTestId("ide-viewer").getAttribute("data-element-count");
  await page.getByTestId("ide-file-input").setInputFiles({ name: "broken.ide10", mimeType: "application/octet-stream", buffer: Buffer.from("not an IDE file") });
  await expect(page.getByTestId("ide-error")).toBeVisible({ timeout: 8_000 });
  await expect(page.getByTestId("ide-viewer")).toHaveAttribute("data-element-count", count!);
  await page.getByTestId("ide-view-2d").click();
  await expect(page.getByTestId("ide-plan-canvas")).toBeVisible();
  await page.getByTestId("ide-view-3d").click();
  await expect(page.getByTestId("ide-3d-canvas")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: path.join(artifacts, "mobile-390.png") });
  await page.getByTestId("ide-examples-toggle").click();
  await page.getByTestId("ide-sample-mustafa-selvi-1").click();
  await page.getByRole("button", { name: "İptal", exact: true }).click();
  await expect(page.getByTestId("ide-loading")).toBeHidden();
  await expect(page.getByTestId("ide-viewer")).toHaveAttribute("data-element-count", count!);
  await page.getByTestId("ide-close").click();
  await expect(page.getByTestId("hsyncad-workbench")).toBeVisible();
  expect(errors).toEqual([]);
});

test("an unavailable viewer bundle leaves the existing CAD model usable", async ({ page }) => {
  const buildDirectory = process.env.HSYNCAD_BUILD_DIR;
  test.skip(!buildDirectory, "Run against the named production build to simulate a missing viewer chunk.");
  const manifest = JSON.parse(await fs.readFile(path.join(buildDirectory!, "react-loadable-manifest.json"), "utf8")) as Record<string, { files: string[] }>;
  const viewer = Object.entries(manifest).find(([key]) => key.endsWith("workbench.tsx -> ./ide-project-panel"))?.[1];
  expect(viewer).toBeTruthy();
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  const before = await page.evaluate(() => localStorage.getItem("hsyncad.model.v1"));
  for (const file of viewer!.files.filter(file => file.endsWith(".js"))) await page.route(`**/_next/${file}`, route => route.abort("failed"));
  await page.getByTestId("open-ide-projects").click();
  await expect(page.getByTestId("ide-load-fallback")).toBeVisible({ timeout: 8_000 });
  await page.getByRole("button", { name: "Çizime dön", exact: true }).click();
  await expect(page.getByTestId("ide-load-fallback")).toHaveCount(0);
  await expect(page.getByTestId("hsyncad-workbench")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("hsyncad.model.v1"))).toBe(before);
});

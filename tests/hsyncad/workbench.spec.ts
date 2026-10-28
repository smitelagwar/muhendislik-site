import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs/promises";

const route = "/kategori/araclar/hsyncad";
const scene = (page: Page) => page.getByTestId("hsyncad-3d-viewport");
async function ready(page: Page) {
  await page.goto(route);
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("hsyncad-3d-canvas")).toBeVisible();
}
async function point(page: Page, x: number, y: number) {
  await page.getByTestId("coordinate-x").fill(String(x));
  await page.getByTestId("coordinate-y").fill(String(y));
  await page.getByTestId("coordinate-place").click();
}
async function worldPoint(page: Page, x: number, y: number) {
  const plan = page.getByTestId("hsyncad-plan");
  await plan.scrollIntoViewIfNeeded();
  const box = (await plan.boundingBox())!;
  const camera = JSON.parse((await plan.getAttribute("data-camera"))!) as { x: number; y: number; scale: number };
  return { x: box.x + box.width / 2 + (x - camera.x) * camera.scale, y: box.y + box.height / 2 - (y - camera.y) * camera.scale };
}
async function clickWorld(page: Page, x: number, y: number) {
  const p = await worldPoint(page, x, y);
  await page.mouse.click(p.x, p.y);
}
// Section solid count excludes axes; the inner viewport's rendered meshes include axes.
async function solids(page: Page, count: number) { await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", String(count)); }
async function signature(page: Page) { return JSON.parse((await scene(page).getAttribute("data-model-signature"))!) as Array<{ id: string; name: string; type: string; width?: number; position?: { x: number; y: number }; end?: { x: number; y: number } }>; }

test("complete placement, snap, 2D/3D edits, history, floors, layers and invalid input", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page);
  await page.getByTestId("tool-axis").click();
  // Current default is single-click horizontal axes. Select explicit two-point mode.
  await page.getByTestId("hsyncad-axis-free").click();
  await clickWorld(page, 0, 0); await clickWorld(page, 4, 0);
  await clickWorld(page, 2, -1); await clickWorld(page, 2, 4);
  await expect(page.getByTestId("hsyncad-plan")).toHaveAttribute("data-element-count", "2");
  // Snap near an existing endpoint must preserve an off-grid orthogonal anchor.
  await page.getByRole("button", { name: "Dik çizim", exact: true }).click();
  await point(page, 1, 0.1); await clickWorld(page, 4.02, 0.14);
  await expect.poll(async () => (await signature(page)).at(-1)?.end?.y).toBe(0.1);
  await page.getByRole("button", { name: "Geri al", exact: true }).click();
  await page.getByRole("button", { name: "Dik çizim", exact: true }).click();
  await page.getByTestId("tool-column").click();
  await clickWorld(page, 2.04, 0.03);
  await page.getByTestId("confirm-column").click();
  await solids(page, 1);
  expect((await signature(page)).find((e) => e.type === "column")?.position).toEqual({ x: 2, y: 0 });
  await page.getByTestId("tool-beam").click(); await page.getByTestId("continuous-toggle").uncheck(); await point(page, 2, 0); await point(page, 6, 0);
  await page.getByTestId("tool-wall").click(); await point(page, 2, 2); await point(page, 6, 2);
  await page.getByTestId("tool-slab").click();
  await page.getByTestId("slab-mode-polygon").click();
  for (const [x, y] of [[2, 0], [6, 0], [6, 4], [2, 4]]) await point(page, x, y);
  await page.getByTestId("finish-slab").click(); await solids(page, 4);
  await expect(page.getByTestId("hsyncad-plan")).toHaveAttribute("data-element-count", "6");

  // Reject a self-intersecting slab without publishing partial geometry.
  for (const [x, y] of [[0, 0], [2, 2], [0, 2], [2, 0]]) await point(page, x, y);
  await page.getByTestId("finish-slab").click();
  await expect(page.getByTestId("hsyncad-message")).toContainText("kesişmeyen");
  await solids(page, 4);
  await page.getByRole("button", { name: "Çizimi iptal et", exact: true }).click();

  // A column at an axis intersection must be selectable ahead of the axis/slab.
  await page.getByTestId("tool-select").click(); await clickWorld(page, 2, 0);
  await expect(page.getByTestId("hsyncad-properties")).toContainText("S1");
  await page.getByTestId("property-width").fill("0.6");
  await page.getByTestId("property-apply").click();
  await expect.poll(async () => (await signature(page)).find((e) => e.type === "column")?.width).toBe(0.6);
  await page.getByTestId("tool-move").click(); await point(page, 2, 0); await point(page, 3, 1);
  await expect.poll(async () => (await signature(page)).find((e) => e.type === "column")?.position).toEqual({ x: 3, y: 1 });
  await page.locator(".hcad-property-form").getByRole("button", { name: "Seçili elemanı sil", exact: true }).click(); await solids(page, 3);
  await page.getByRole("button", { name: "Geri al", exact: true }).click(); await solids(page, 4);
  await page.getByRole("button", { name: "Yinele", exact: true }).click(); await solids(page, 3);
  await page.getByRole("button", { name: "Geri al", exact: true }).click(); await solids(page, 4);

  const plan = page.getByTestId("hsyncad-plan");
  const beforeZoom = JSON.parse((await plan.getAttribute("data-camera"))!).scale;
  const middle = await worldPoint(page, 3, 1);
  await page.mouse.move(middle.x, middle.y); await page.mouse.wheel(0, -250);
  await expect.poll(async () => JSON.parse((await plan.getAttribute("data-camera"))!).scale).toBeGreaterThan(beforeZoom);
  await page.getByTestId("tool-pan").click();
  const beforePan = await plan.getAttribute("data-camera");
  const panStart = await worldPoint(page, 3, 1);
  await page.mouse.move(panStart.x, panStart.y); await page.mouse.down(); await page.mouse.move(panStart.x + 40, panStart.y + 20, { steps: 5 }); await page.mouse.up();
  await expect(plan).not.toHaveAttribute("data-camera", beforePan!);
  await solids(page, 4);

  await page.getByRole("button", { name: "Metraj", exact: true }).click();
  const netBefore = await page.getByTestId("quantity-net").textContent();
  await page.getByRole("tab", { name: "Görüntü", exact: true }).click();
  await page.getByLabel("Perdeler", { exact: true }).uncheck(); await solids(page, 3);
  await expect(page.getByTestId("quantity-net")).toHaveText(netBefore!);
  await page.getByLabel("Perdeler", { exact: true }).check(); await solids(page, 4);
  await page.getByRole("tab", { name: "Betonarme", exact: true }).click(); await page.getByTestId("hsyncad-native-ribbon").getByRole("button", { name: "Kat listesi", exact: true }).click();
  await page.getByLabel("Kat yüksekliği (m)", { exact: true }).fill("4");
  await page.getByRole("button", { name: "Katı güncelle", exact: true }).click();
  await expect.poll(async () => JSON.parse((await scene(page).getAttribute("data-volume-size"))!)[1]).toBeCloseTo(4);
  await page.getByRole("button", { name: "Yeni kat", exact: true }).click();
  await page.getByRole("tab", { name: "Betonarme", exact: true }).click();
  await page.getByTestId("tool-column").click(); await point(page, 0, 0); await solids(page, 5);
  await expect(plan).toHaveAttribute("data-element-count", "1");
  await expect(page.getByTestId("active-floor").locator("option:checked")).toContainText("1. Kat");
  expect(errors).toEqual([]);
});

test("known 4x4 quantities, JSON roundtrip, persistence, 3D orbit and tool hub", async ({ page }, testInfo) => {
  await ready(page);
  await page.getByRole("button", { name: "Ölçülü örnekle başla" }).click(); await solids(page, 10);
  await expect(page.getByTestId("quantity-net")).toHaveText("8,089");
  await expect(page.getByTestId("quantity-formwork")).toHaveText("83,80");
  await expect(page.getByTestId("quantity-overlap")).toHaveText("−0,632 m³");
  const count = (await signature(page)).length; expect(count).toBe(14);
  const canvas = page.getByTestId("hsyncad-3d-canvas");
  const before = await canvas.screenshot();
  const bounds = (await canvas.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down(); await page.mouse.move(bounds.x + bounds.width / 2 + 70, bounds.y + bounds.height / 2 + 30, { steps: 8 }); await page.mouse.up();
  const after = await canvas.screenshot(); expect(before.equals(after)).toBe(false);
  await page.getByTestId("hsyncad-3d-fit").click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath("masaustu.png"), fullPage: true });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON kaydet", exact: true }).click();
  const download = await downloadPromise;
  const jsonPath = testInfo.outputPath("hsyncad-model.json"); await download.saveAs(jsonPath);
  const exported = JSON.parse(await fs.readFile(jsonPath, "utf8")); expect(exported.elements).toHaveLength(14);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("hsyncad.model.v1") || "{}").elements?.length)).toBe(14);
  await page.reload(); await solids(page, 10);
  await expect(page.getByTestId("hsyncad-message")).toContainText("geri yüklendi");
  await page.getByTestId("hsyncad-import").setInputFiles({ name: "bozuk.json", mimeType: "application/json", buffer: Buffer.from('{"schemaVersion":999}') });
  await expect(page.getByTestId("hsyncad-message")).toContainText("Dosya açılamadı"); await solids(page, 10);
  await page.getByRole("button", { name: "Dosya işlemleri", exact: true }).click();
  await page.getByRole("menuitem", { name: "Yeni model", exact: true }).click(); await solids(page, 0);
  await page.getByTestId("hsyncad-import").setInputFiles(jsonPath); await solids(page, 10);
  await page.goto("/kategori/araclar");
  const card = page.locator('a[href="/kategori/araclar/hsyncad"]').filter({ hasText: "hsynCAD" }).first();
  await expect(card).toBeVisible(); await card.click(); await solids(page, 10);
  // Existing tools continue rendering their own route.
  await page.goto("/kategori/araclar/donati-hesabi");
  await expect(page.getByRole("heading", { name: "Donatı Alanı Hesabı", exact: true }).first()).toBeVisible();
});

test("mobile single-pane 2D/3D switching, inspector focus, pinch/pan, touch and light theme", async ({ browser }, testInfo) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  try {
    const page = await context.newPage();
    await page.goto(route);
    await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
    await page.getByRole("button", { name: "Ölçülü örnekle başla" }).click(); await solids(page, 10);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const plan = page.getByTestId("hsyncad-plan");
    await expect(page.getByTestId("hsyncad-view-2d")).toHaveAttribute("aria-pressed", "true");
    await expect(scene(page)).toBeHidden();
    await page.getByTestId("hsyncad-view-3d").click();
    await expect(scene(page)).toBeVisible();
    await expect(page.getByTestId("hsyncad-3d-canvas")).toBeVisible();
    await expect(plan).toBeHidden();
    await page.getByTestId("hsyncad-view-2d").click();
    await expect(plan).toBeVisible();
    await expect(scene(page)).toBeHidden();
    await page.getByTestId("hsyncad-inspector-toggle").click();
    const inspector = page.getByRole("dialog", { name: "Metraj ve özellikler" });
    await expect(inspector).toBeVisible();
    await expect(page.getByTestId("quantity-net")).toHaveText("8,089");
    await expect(page.getByTestId("hsyncad-inspector-close")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(inspector).toHaveCount(0);
    await expect(page.getByTestId("hsyncad-inspector-toggle")).toBeFocused();
    await page.getByTestId("hsyncad-coordinate-toggle").click();
    await expect(page.getByTestId("coordinate-x")).toBeVisible();
    await page.getByTestId("hsyncad-coordinate-toggle").click();
    const box = (await plan.boundingBox())!;
    const x = box.x + box.width / 2, y = box.y + box.height * 0.66;
    const previous = JSON.parse((await plan.getAttribute("data-camera"))!);
    const client = await context.newCDPSession(page);
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x - 30, y, id: 1 }, { x: x + 30, y, id: 2 }] });
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - 55, y: y + 20, id: 1 }, { x: x + 65, y: y + 20, id: 2 }] });
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(async () => JSON.parse((await plan.getAttribute("data-camera"))!).scale).toBeGreaterThan(previous.scale);
    expect(JSON.parse((await plan.getAttribute("data-camera"))!).y).not.toBe(previous.y);
    await solids(page, 10);
    await page.getByTestId("tool-column").click();
    await plan.scrollIntoViewIfNeeded();
    const tap = await worldPoint(page, 2, 1);
    await page.touchscreen.tap(tap.x, tap.y); await page.getByTestId("confirm-column-floating").click(); await solids(page, 11);
    await page.getByRole("tab", { name: /^(Giriş|Betonarme)$/ }).click();
    await page.getByRole("button", { name: "Geri al", exact: true }).first().click(); await solids(page, 10);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath("mobil-koyu.png"), fullPage: true });
    await page.evaluate(() => localStorage.setItem("theme", "light"));
    await page.reload(); await solids(page, 10);
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("mobil-acik.png"), fullPage: true });
  } finally { await context.close(); }
});

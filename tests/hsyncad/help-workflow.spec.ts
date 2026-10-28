import { expect, test, type Page } from "@playwright/test";
import type { CadModel } from "../../src/lib/hsyncad/model";
import { polygonArea } from "../../src/lib/hsyncad/geometry";
async function ready(page: Page) { await page.goto("/kategori/araclar/hsyncad"); await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true"); }
async function model(page: Page): Promise<CadModel> { return page.evaluate(() => JSON.parse(localStorage.getItem("hsyncad.model.v1")!)); }
async function screen(page: Page, x: number, y: number) { const plan = page.getByTestId("hsyncad-plan"), b = (await plan.boundingBox())!, c = JSON.parse((await plan.getAttribute("data-camera"))!); return { x: b.x + b.width / 2 + (x - c.x) * c.scale, y: b.y + b.height / 2 - (y - c.y) * c.scale }; }
async function click(page: Page, x: number, y: number) { const p = await screen(page, x, y); await page.mouse.click(p.x, p.y); }
async function move(page: Page, x: number, y: number) { const p = await screen(page, x, y); await page.mouse.move(p.x, p.y); }
async function point(page: Page, x: number, y: number) { await page.getByTestId("coordinate-x").fill(String(x)); await page.getByTestId("coordinate-y").fill(String(y)); await page.getByTestId("coordinate-place").click(); }

test("axis preview and typed centimetre offsets advance from the latest axis", async ({ page }) => {
  await ready(page); await page.getByRole("combobox", { name: "Çizim giriş birimi" }).selectOption("cm");
  await page.getByTestId("tool-axis").click(); await move(page, 0, 0);
  await expect(page.getByTestId("hsyncad-placement-preview")).toHaveAttribute("data-preview-type", "axis");
  await click(page, 0, 0); await page.keyboard.type("400"); await page.keyboard.press("Enter");
  await page.keyboard.type("300"); await page.keyboard.press("Enter");
  await page.keyboard.press("Space"); await click(page, 0, 0); await page.keyboard.type("500"); await page.keyboard.press("Enter");
  await expect.poll(async () => (await model(page)).elements.length).toBe(5);
  const axes = (await model(page)).elements;
  expect(axes.filter(e => e.type === "axis" && e.orientation === "horizontal").map(e => e.type === "axis" && e.start.y)).toEqual([0, 4, 7]);
  expect(axes.filter(e => e.type === "axis" && e.orientation === "vertical").map(e => e.type === "axis" && e.start.x)).toEqual([0, 5]);
});

test("column anchor, live dimensions, mirror and orientation form a two-step transaction", async ({ page }) => {
  await ready(page); await page.getByRole("combobox", { name: "Çizim giriş birimi" }).selectOption("cm");
  await page.getByTestId("tool-column").click(); await page.getByRole("combobox", { name: "Kolon tutma noktası" }).selectOption("edge");
  await page.getByTestId("new-depth").fill("60"); await click(page, 0, 0);
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "0");
  await page.getByTestId("new-width").fill("80"); await page.getByRole("spinbutton", { name: "Kolon çizim açısı" }).fill("90");
  await page.getByTestId("hsyncad-workbench").focus(); await page.keyboard.press("Space");
  await expect(page.getByTestId("hsyncad-placement-preview")).toBeVisible(); await page.keyboard.press("Enter");
  await expect(page.getByTestId("quantity-net")).toHaveText("1,440");
  expect((await model(page)).elements[0]).toMatchObject({ type: "column", width: 0.8, depth: 0.6, rotation: 90, anchorMode: "edge", mirrorX: true, position: { x: 0, y: 0 } });
  await click(page, 2, 0); await page.keyboard.press("Escape");
  expect((await model(page)).elements.length).toBe(1);
});

test("continuous member drawing, Space alignment and automatic slab match an independent area", async ({ page }) => {
  await ready(page); await page.getByTestId("tool-column").click();
  for (const [x, y] of [[0, 0], [4, 0], [4, 4], [0, 4]]) await point(page, x, y);
  await page.getByTestId("tool-beam").click(); await click(page, 0, 0); await move(page, 4, 0); await page.keyboard.press("Space");
  for (const [x, y] of [[4, 0], [4, 4], [0, 4], [0, 0]]) await click(page, x, y);
  await page.keyboard.press("Escape");
  expect((await model(page)).elements.filter(e => e.type === "beam")).toHaveLength(4);
  expect((await model(page)).elements.filter(e => e.type === "beam").every(e => e.type === "beam" && e.alignment === "left" && e.connections?.start?.kind === "column")).toBe(true);
  await page.getByTestId("tool-slab").click(); await move(page, 2, 2);
  await expect(page.getByTestId("hsyncad-placement-preview")).toHaveAttribute("data-preview-type", "slab");
  await click(page, 2, 2);
  const slab = (await model(page)).elements.find(e => e.type === "slab"); expect(slab?.type).toBe("slab");
  if (slab?.type !== "slab") throw new Error("No slab");
  expect(polygonArea(slab.points)).toBeCloseTo(12.25); expect(slab.boundary!.elementIds.length).toBeGreaterThanOrEqual(4);
  await expect(page.getByTestId("quantity-slab")).toContainText("1,838");
});

test("fixed length/angle input drives the next continuous segment in SI units", async ({ page }) => {
  await ready(page); await page.getByRole("combobox", { name: "Çizim giriş birimi" }).selectOption("cm");
  await page.getByTestId("tool-beam").click(); await click(page, 0, 0);
  await page.keyboard.type("400"); await page.keyboard.press("Enter");
  await page.getByRole("textbox", { name: "Çizim yönü", exact: true }).fill("90");
  await page.getByRole("textbox", { name: "Çizim uzunluğu", exact: true }).fill("100");
  await page.getByTestId("hsyncad-workbench").focus(); await page.keyboard.press("Enter");
  const beams = (await model(page)).elements.filter(e => e.type === "beam");
  expect(beams[0]).toMatchObject({ start: { x: 0, y: 0 }, end: { x: 4, y: 0 } });
  expect(beams[1]).toMatchObject({ start: { x: 4, y: 0 }, end: { x: 4, y: 1 } });
});

test("open slab boundary is rejected; Ctrl label placement and dependent deletion are atomic", async ({ page }) => {
  await ready(page); await page.getByTestId("tool-slab").click(); await page.getByTestId("slab-mode-edge").click();
  for (const [x, y] of [[0, 0], [4, 0], [4, 4], [0, 4]]) await point(page, x, y);
  await page.getByTestId("slab-mode-region").click(); await click(page, 2, 2);
  await expect(page.getByTestId("hsyncad-message")).toContainText("Kapalı sınır bulunamadı");
  await page.getByTestId("slab-mode-edge").click(); await point(page, 0, 4); await point(page, 0, 0);
  await page.getByTestId("slab-mode-region").click(); await page.keyboard.down("Control"); await click(page, 2, 2); await page.keyboard.up("Control");
  expect((await model(page)).elements.filter(e => e.type === "slab")).toHaveLength(0);
  await click(page, 1, 1); expect((await model(page)).elements.find(e => e.type === "slab")).toMatchObject({ labelPosition: { x: 1, y: 1 } });
  await expect(page.getByTestId("quantity-net")).toHaveText("2,400");
  await page.getByTestId("desktop-inspector-toggle").click();
  await page.locator(".hcad-element-list > summary").click(); await page.getByTestId("element-DK1").click();
  await page.getByTestId("hsyncad-workbench").focus(); await page.keyboard.press("Delete");
  expect((await model(page)).elements).toHaveLength(3); await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "0");
  await page.keyboard.press("Control+z"); expect((await model(page)).elements).toHaveLength(5);
});

test("editing an axis updates a connected frame, middle wall and both slabs; floor copy remaps references", async ({ page }) => {
  await ready(page); await page.getByRole("button", { name: "Dosya işlemleri", exact: true }).click(); await page.getByTestId("load-workflow-demo").click();
  await page.getByTestId("desktop-inspector-toggle").click();
  await expect(page.getByTestId("quantity-net")).toHaveText("8,089");
  await page.locator(".hcad-element-list > summary").click(); await page.getByTestId("element-2").click();
  await page.getByLabel("1. nokta X (m)", { exact: true }).fill("5"); await page.getByLabel("2. nokta X (m)", { exact: true }).fill("5"); await page.getByTestId("property-apply").click();
  const m = await model(page); expect(m.elements.find(e => e.name === "S2")).toMatchObject({ position: { x: 5, y: 0 } });
  expect(m.elements.find(e => e.name === "P1")).toMatchObject({ end: { x: 5, y: 2 } });
  const area = m.elements.filter(e => e.type === "slab").reduce((s, e) => s + (e.type === "slab" ? polygonArea(e.points) : 0), 0); expect(area).toBeCloseTo(16.84);
  await page.getByRole("tab", { name: "Betonarme", exact: true }).click(); await page.getByTestId("hsyncad-native-ribbon").getByRole("button", { name: "Kat listesi", exact: true }).click(); await page.getByRole("button", { name: "Katı üste kopyala", exact: true }).click();
  expect((await model(page)).floors).toHaveLength(2); expect((await model(page)).elements).toHaveLength(30);
  await page.reload(); await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  expect((await model(page)).elements).toHaveLength(30);
});

test("touch placement requires an explicit second step and keeps controls within a phone viewport", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  try {
    const page = await context.newPage(); await ready(page); await page.getByTestId("tool-column").click();
    const p = await screen(page, 2, 1); await page.touchscreen.tap(p.x, p.y);
    await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "0");
    await page.getByTestId("confirm-column-floating").click(); await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "1");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await context.close(); }
});

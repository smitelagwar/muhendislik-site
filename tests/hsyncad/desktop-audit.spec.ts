import { expect, test, type Page } from "@playwright/test";
import type { CadModel, Point } from "../../src/lib/hsyncad/model";
import { elementFootprint } from "../../src/lib/hsyncad/geometry";
import { polygonArea } from "../../src/lib/hsyncad/geometry";
import { createDemoModel } from "../../src/lib/hsyncad/model";

async function ready(page: Page) {
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
}
async function point(page: Page, x: number, y: number) {
  await page.getByTestId("coordinate-x").fill(String(x));
  await page.getByTestId("coordinate-y").fill(String(y));
  await page.getByTestId("coordinate-place").click();
}
const model = (page: Page): Promise<CadModel> => page.evaluate(() => JSON.parse(localStorage.getItem("hsyncad.model.v1")!));
async function expectPointsInView(page: Page, points: Point[]) {
  const plan = page.getByTestId("hsyncad-plan"), bounds = (await plan.boundingBox())!;
  const camera = JSON.parse((await plan.getAttribute("data-camera"))!) as { x: number; y: number; scale: number };
  for (const point of points) {
    const x = bounds.width / 2 + (point.x - camera.x) * camera.scale;
    const y = bounds.height / 2 - (point.y - camera.y) * camera.scale;
    expect(x).toBeGreaterThanOrEqual(1); expect(x).toBeLessThanOrEqual(bounds.width - 1);
    expect(y).toBeGreaterThanOrEqual(1); expect(y).toBeLessThanOrEqual(bounds.height - 1);
  }
}

test("desktop fit recovers a measurement without any structural elements", async ({ page }) => {
  await ready(page); await page.getByRole("tab", { name: "Araçlar", exact: true }).click(); await page.getByTestId("ribbon-measureDistance").click();
  await point(page, 100, 100); await point(page, 103, 104);
  await expect(page.getByTestId("reference-record").first()).toContainText("5 m");
  await page.getByRole("button", { name: "Hızlı sığdır", exact: true }).click();
  await expect.poll(async () => JSON.parse((await page.getByTestId("hsyncad-plan").getAttribute("data-camera"))!).x).toBeCloseTo(101.5);
  await expectPointsInView(page, (await model(page)).drafting!.items[0].points);
});

test("desktop fit includes structural outlines, finite reference anchors and an active local origin", async ({ page }) => {
  await ready(page); await page.getByTestId("tool-column").click(); await point(page, 0, 0);
  await page.getByTestId("quick-referenceLine").click(); await point(page, 100, 100); await point(page, 103, 104);
  const saved = await model(page);
  saved.drafting!.frames = { "floor-0": { origin: { x: 150, y: -50 }, angle: 45, enabled: true } };
  await page.getByTestId("hsyncad-import").setInputFiles({ name: "fit-references.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(saved)) });
  await page.getByRole("button", { name: "Hızlı sığdır", exact: true }).click();
  await expect.poll(async () => JSON.parse((await page.getByTestId("hsyncad-plan").getAttribute("data-camera"))!).x).toBeCloseTo(74.9);
  const current = await model(page);
  await expectPointsInView(page, [...current.elements.flatMap(elementFootprint), ...current.drafting!.items.flatMap(item => item.points), current.drafting!.frames!["floor-0"].origin]);
  const camera = JSON.parse((await page.getByTestId("hsyncad-plan").getAttribute("data-camera"))!);
  expect(camera.scale).toBeLessThan(6);
  const bounds = (await page.getByTestId("hsyncad-plan").boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.wheel(0, -20);
  await expect.poll(async () => JSON.parse((await page.getByTestId("hsyncad-plan").getAttribute("data-camera"))!).scale / camera.scale).toBeCloseTo(Math.exp(20 * 0.0015), 5);
});

test("invalid desktop measurement coordinates do not poison the next valid drawing", async ({ page }) => {
  await ready(page); await page.getByRole("tab", { name: "Araçlar", exact: true }).click(); await page.getByTestId("ribbon-measureDistance").click();
  await page.getByTestId("coordinate-x").fill("abc"); await page.getByTestId("coordinate-y").fill("0"); await page.getByTestId("coordinate-place").click();
  await expect(page.getByTestId("hsyncad-message")).toContainText("Geçerli X/Y girin");
  await point(page, 0, 0); await point(page, 3, 4);
  await expect(page.getByTestId("reference-record").first()).toContainText("5 m");
  expect((await model(page)).drafting!.items).toHaveLength(1);
});

test("desktop automatic slab only recognizes the matching beam elevation", async ({ page }) => {
  await ready(page); const m = createDemoModel();
  m.elements = m.elements.filter(e => e.type !== "wall" && e.type !== "slab").map(e => e.type === "beam" ? { ...e, topOffset: -1 } : e);
  await page.getByTestId("hsyncad-import").setInputFiles({ name: "low-beams.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(m)) });
  await page.getByTestId("tool-slab").click(); await point(page, 2, 2);
  await expect(page.getByTestId("hsyncad-message")).toContainText("Kapalı sınır bulunamadı");
  expect((await model(page)).elements.filter(e => e.type === "slab")).toHaveLength(0);
  await page.getByTestId("hsyncad-new-settings").click();
  await page.getByRole("dialog").getByLabel("Kot farkı (m)", { exact: true }).fill("-1");
  await page.getByRole("button", { name: "Varsayılanları uygula", exact: true }).click();
  await point(page, 2, 2);
  const slab = (await model(page)).elements.find(e => e.type === "slab");
  expect(slab?.type).toBe("slab"); if (slab?.type !== "slab") throw new Error("slab missing");
  expect(slab.topOffset).toBe(-1); expect(polygonArea(slab.points)).toBeCloseTo(14.04, 6);
});

test("desktop command line applies relative Cartesian and polar centimetres with undo and redo", async ({ page }) => {
  await ready(page);
  await page.getByRole("combobox", { name: "Çizim giriş birimi", exact: true }).selectOption("cm");
  await page.getByTestId("tool-beam").click();
  const command = async (text: string) => { await page.getByTestId("hsyncad-command").fill(text); await page.getByRole("button", { name: "Komutu çalıştır", exact: true }).click(); };
  await command("1000 2000"); await command("@300 400"); await command("@200<90");
  await expect.poll(async () => (await model(page)).elements.length).toBe(2);
  let beams = (await model(page)).elements;
  expect(beams[0]).toMatchObject({ type: "beam", start: { x: 10, y: 20 }, end: { x: 13, y: 24 } });
  expect(beams[1]).toMatchObject({ type: "beam", start: { x: 13, y: 24 }, end: { x: 13, y: 26 } });
  await command("geri"); await expect.poll(async () => (await model(page)).elements.length).toBe(1);
  await command("yinele"); await expect.poll(async () => (await model(page)).elements.length).toBe(2);
  beams = (await model(page)).elements;
  expect(beams[1]).toMatchObject({ start: { x: 13, y: 24 }, end: { x: 13, y: 26 } });
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "2");
  await command("@abc 2"); await expect(page.getByTestId("hsyncad-message")).toContainText("Komutlar:");
  expect((await model(page)).elements).toHaveLength(2);
});

test("desktop floor deletion removes its structure, measurements and local frame in one undoable operation", async ({ page }) => {
  await ready(page);
  const floors = async () => { await page.getByRole("tab", { name: "Betonarme", exact: true }).click(); await page.getByTestId("hsyncad-native-ribbon").getByRole("button", { name: "Kat listesi", exact: true }).click(); };
  await floors(); await page.getByRole("button", { name: "Yeni kat", exact: true }).click();
  const floorId = await page.getByTestId("active-floor").inputValue();
  await page.getByTestId("quick-measureDistance").click(); await point(page, 0, 0); await point(page, 3, 4);
  await page.getByTestId("quick-referencePoint").click(); await point(page, 10, 20);
  await page.getByRole("tab", { name: "Betonarme", exact: true }).click();
  await page.getByTestId("tool-column").click(); await point(page, 0, 0);
  const before = await model(page);
  expect(before.floors).toHaveLength(2); expect(before.drafting?.items).toHaveLength(2);
  expect(before.drafting?.frames?.[floorId]).toMatchObject({ origin: { x: 10, y: 20 }, enabled: true });
  expect(before.elements).toHaveLength(1);
  await floors(); await page.getByRole("button", { name: "Katı ve elemanlarını sil", exact: true }).click();
  await expect.poll(async () => (await model(page)).floors.length).toBe(1);
  const after = await model(page);
  expect(after.elements).toHaveLength(0); expect(after.drafting?.items).toHaveLength(0);
  expect(after.drafting?.frames?.[floorId]).toBeUndefined();
  expect(after.floors.some(f => f.id === floorId)).toBe(false);
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "0");
  await page.getByTestId("hsyncad-command-bar").getByRole("button", { name: "Geri al", exact: true }).click();
  await expect.poll(async () => (await model(page)).floors.length).toBe(2);
  const restored = await model(page);
  expect(restored.elements).toEqual(before.elements); expect(restored.drafting).toEqual(before.drafting);
  await page.getByTestId("hsyncad-command-bar").getByRole("button", { name: "Yinele", exact: true }).click();
  await expect.poll(async () => (await model(page)).floors.length).toBe(1);
  expect((await model(page)).drafting?.items).toHaveLength(0);
});

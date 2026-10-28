import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import type { CadModel } from "../../src/lib/hsyncad/model";

const artifacts = "C:/Users/hsyn/Desktop/hsyncad/incelemeler/idecad-rea/devam-2026-10-28/kullanici-denetimi";
const saved = (p: Page): Promise<CadModel> => p.evaluate(() => JSON.parse(localStorage.getItem("hsyncad.model.v1")!));
async function point(p: Page, x: number, y: number) {
  await p.getByTestId("coordinate-x").fill(String(x)); await p.getByTestId("coordinate-y").fill(String(y)); await p.getByTestId("coordinate-place").click();
}
async function clickWorld(p: Page, x: number, y: number) {
  const plan = p.getByTestId("hsyncad-plan"), bounds = (await plan.boundingBox())!, camera = JSON.parse((await plan.getAttribute("data-camera"))!);
  await p.mouse.click(bounds.x + bounds.width / 2 + (x - camera.x) * camera.scale, bounds.y + bounds.height / 2 - (y - camera.y) * camera.scale);
}
async function concrete(p: Page) { await p.getByRole("tab", { name: "Betonarme", exact: true }).click(); }
async function floors(p: Page) { await concrete(p); await p.getByTestId("hsyncad-native-ribbon").getByRole("button", { name: "Kat listesi", exact: true }).click(); }

test("real user builds a two-storey linked concrete model from blank, edits and delivers files", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await fs.mkdir(artifacts, { recursive: true });
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  // No demo, model injection or storage writes: every model mutation below is a real UI action.
  expect((await saved(page))?.elements ?? []).toHaveLength(0);
  await page.getByTestId("tool-axis").click();
  await page.getByTestId("hsyncad-axis-grid-toggle").click();
  await page.getByTestId("hsyncad-axis-x-spacings").fill("4");
  await page.getByTestId("hsyncad-axis-y-spacings").fill("2;2");
  await page.getByTestId("hsyncad-axis-grid-create").click();
  await expect.poll(async () => (await saved(page)).elements.length).toBe(5);
  await page.getByTestId("tool-column").click();
  await page.getByRole("combobox", { name: "Kolon tutma noktası", exact: true }).selectOption("center");
  await page.getByTestId("new-width").fill("0.4"); await page.getByTestId("new-depth").fill("0.4");
  await clickWorld(page, .02, .02); await page.getByTestId("confirm-column").click();
  for (const [x, y] of [[4, 0], [4, 4], [0, 4]]) await point(page, x, y);
  expect((await saved(page)).elements.find(e => e.name === "S1")).toMatchObject({ position: { x: 0, y: 0 }, connections: { position: { kind: "axes" } } });
  await page.getByTestId("tool-beam").click();
  for (const [x, y] of [[0, 0], [4, 0], [4, 4], [0, 4], [0, 0]]) await point(page, x, y);
  await page.getByTestId("tool-wall").click(); await point(page, 0, 2); await point(page, 4, 2);
  await page.getByTestId("tool-slab").click(); await clickWorld(page, 2, 1); await clickWorld(page, 2, 3);
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "11");
  const initial = await saved(page);
  expect(initial.elements.filter(e => e.type === "slab")).toHaveLength(2);
  expect(initial.elements.filter(e => e.type === "slab").every(e => e.type === "slab" && !!e.boundary?.elementIds.length)).toBe(true);

  await page.getByTestId("desktop-inspector-toggle").click();
  await page.locator(".hcad-element-list > summary").click();
  const rightAxis = initial.elements.find(e => e.type === "axis" && e.start.x === 4 && e.end.x === 4)!;
  await page.getByTestId(`element-${rightAxis.name}`).click();
  await page.getByLabel("1. nokta X (m)", { exact: true }).fill("5"); await page.getByLabel("2. nokta X (m)", { exact: true }).fill("5"); await page.getByTestId("property-apply").click();
  await expect.poll(async () => (await saved(page)).elements.find(e => e.name === "S2")?.type === "column" && ((await saved(page)).elements.find(e => e.name === "S2") as { position: { x: number } }).position.x).toBe(5);
  expect((await saved(page)).elements.find(e => e.name === "P1")).toMatchObject({ end: { x: 5, y: 2 } });
  await page.getByTestId("element-S1").click(); await page.getByTestId("property-width").fill("0.5"); await page.getByTestId("property-apply").click();
  await floors(page); await page.getByLabel("Kat yüksekliği (m)", { exact: true }).fill("3.2"); await page.getByRole("button", { name: "Katı güncelle", exact: true }).click();
  await page.getByRole("button", { name: "Katı üste kopyala", exact: true }).click();
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "22");
  const copied = await saved(page); expect(copied.floors).toHaveLength(2); expect(copied.elements).toHaveLength(32);
  expect(copied.floors[1].elevation).toBeCloseTo(3.2);
  await expect.poll(async () => JSON.parse((await page.getByTestId("hsyncad-3d-viewport").getAttribute("data-volume-size"))!)[1]).toBeCloseTo(6.4);
  await page.getByTestId("quick-measureDistance").click(); await point(page, 0, 0); await point(page, 5, 0);
  await expect(page.getByTestId("reference-record").last()).toContainText("5 m");
  await page.getByRole("button", { name: "Metraj", exact: true }).click();
  await expect(page.getByTestId("quantity-net")).not.toHaveText("—");
  const net = await page.getByTestId("quantity-net").innerText();
  await page.getByTestId("hsyncad-report-open").click();
  await expect(page.getByTestId("hsyncad-report").locator("tbody tr")).toHaveCount(8);
  const csvPromise = page.waitForEvent("download"); await page.getByRole("button", { name: "CSV metraj indir", exact: true }).click(); const csv = await csvPromise; await csv.saveAs(path.join(artifacts, "iki-kat-metraj.csv"));
  await page.getByRole("button", { name: "Ayarları kapat", exact: true }).click();
  const downloadPromise = page.waitForEvent("download"); await page.getByRole("button", { name: "JSON kaydet", exact: true }).click(); const download = await downloadPromise; const projectPath = path.join(artifacts, "iki-kat-kullanici-projesi.json"); await download.saveAs(projectPath);
  const delivered = JSON.parse(await fs.readFile(projectPath, "utf8")); expect(delivered.elements).toHaveLength(32);
  await page.getByRole("button", { name: "Dosya işlemleri", exact: true }).click(); await page.getByRole("menuitem", { name: "Yeni model", exact: true }).click();
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "0");
  await page.getByTestId("hsyncad-import").setInputFiles(projectPath);
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "22");
  await page.reload(); await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  expect((await saved(page)).elements).toEqual(delivered.elements);
  const signature = JSON.parse((await page.getByTestId("hsyncad-3d-viewport").getAttribute("data-model-signature"))!);
  expect(signature).toHaveLength(32);
  await page.getByRole("button", { name: "Metraj", exact: true }).click(); await expect(page.getByTestId("quantity-net")).toHaveText(net);
  await page.screenshot({ path: path.join(artifacts, "iki-kat-sonuc-1920.png") });
  expect(errors).toEqual([]);
  await fs.writeFile(path.join(artifacts, "akis-sonucu.json"), JSON.stringify({ status: "passed", createdThroughUIOnly: true, elements: delivered.elements.length, floors: delivered.floors, solidCount: 22, netDisplay: net, consoleErrors: errors }, null, 2));
});

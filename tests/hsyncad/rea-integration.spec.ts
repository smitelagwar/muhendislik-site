import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import { createEmptyModel, type CadModel } from "../../src/lib/hsyncad/model";
import { createToolTemplate } from "../../src/lib/hsyncad/creation";
import { resolveJunctions } from "../../src/lib/hsyncad/junctions";

async function ready(page: Page) { await page.goto("/kategori/araclar/hsyncad"); await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true"); }
async function point(page: Page, x: number, y: number) { await page.getByTestId("coordinate-x").fill(String(x)); await page.getByTestId("coordinate-y").fill(String(y)); await page.getByTestId("coordinate-place").click(); }
async function saved(page: Page): Promise<CadModel> { return page.evaluate(() => JSON.parse(localStorage.getItem("hsyncad.model.v1")!)); }
async function settings(page: Page, type: string) { await page.getByRole("tab", { name: "Betonarme", exact: true }).click(); await page.getByTestId(`tool-${type}`).click(); await page.getByTestId("hsyncad-new-settings").click(); return page.getByRole("dialog"); }

test("REA axis options, successive parallel axes and snap preferences are connected", async ({ page }) => {
  await ready(page); await page.getByTestId("tool-axis").click();
  await page.getByText("Aks genel ayarları", { exact: true }).click();
  await page.getByLabel("Aks ad eki", { exact: true }).fill("a");
  await page.getByLabel("Tali aks", { exact: true }).check();
  await page.getByLabel("Sol / başlangıç uzatma (m)", { exact: true }).fill("2");
  await page.getByLabel("Sağ / bitiş uzatma (m)", { exact: true }).fill("3");
  await page.getByLabel("Kontur içi renk", { exact: true }).fill("#ff0000");
  await point(page, 0, 0);
  await page.getByText("Aks genel ayarları", { exact: true }).click();
  await page.getByTestId("hsyncad-axis-parallel-toggle").click();
  await page.getByTestId("hsyncad-axis-parallel-create").click();
  await page.getByTestId("hsyncad-axis-parallel-create").click();
  await expect.poll(async () => (await saved(page)).elements.length).toBe(3);
  const axes = (await saved(page)).elements;
  expect(axes.map(e => e.type === "axis" && e.start.y)).toEqual([0, 4, 8]);
  expect(axes[0]).toMatchObject({ suffix: "a", minor: true, extensionStart: 2, extensionEnd: 3, color: "#ff0000" });
  await expect(page.getByTestId("hsyncad-plan").locator('text').filter({ hasText: /^Aa$/ }).first()).toBeVisible();
  await page.getByRole("tab", { name: "Görüntü", exact: true }).click();
  await page.getByRole("button", { name: "Yakalama ayarları", exact: true }).click();
  await page.getByLabel("Orta nokta", { exact: true }).uncheck();
  await page.getByLabel("Düğüm noktalarını göster", { exact: true }).check();
  await page.getByLabel("Yakalama uzaklığı (piksel)", { exact: true }).fill("18");
  await page.getByRole("button", { name: "Yakalama ayarlarını uygula" }).click();
  await expect.poll(async () => (await saved(page)).snap?.tolerancePx).toBe(18);
  await page.getByRole("button", { name: "Ayarları kapat" }).click();
  await page.reload(); await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  expect((await saved(page)).snap).toMatchObject({ midpoint: false, showNodes: true, tolerancePx: 18 });
});

test("column creation settings drive real section geometry, story elevations and JSON", async ({ page }) => {
  await ready(page); await page.getByRole("tab", { name: "Betonarme", exact: true }).click(); await page.getByTestId("hsyncad-native-ribbon").getByRole("button", { name: "Kat listesi", exact: true }).click();
  await page.getByLabel("Kat yüksekliği (m)", { exact: true }).fill("4");
  await page.getByRole("button", { name: "Katı güncelle", exact: true }).click();
  const dialog = await settings(page, "column");
  await dialog.getByLabel("Kesit biçimi", { exact: true }).selectOption("circle");
  await dialog.getByLabel("Çap b (m)", { exact: true }).fill("0.6");
  await dialog.getByLabel("Kaçıklık X (m)", { exact: true }).fill("0.1");
  await dialog.getByLabel("Üst uç X ötelenmesi (m)", { exact: true }).fill("0.3");
  await dialog.getByLabel("Grup adı", { exact: true }).fill("Çerçeve A");
  await dialog.getByRole("button", { name: "Varsayılanları uygula" }).click(); await expect(dialog).not.toBeVisible();
  await point(page, 0, 0);
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "1");
  const model = await saved(page), e = model.elements[0];
  expect(e).toMatchObject({ section: "circle", width: 0.6, offsetX: 0.1, leanX: 0.3, heightMode: "story", group: "Çerçeve A" });
  await expect.poll(async () => JSON.parse((await page.getByTestId("hsyncad-3d-viewport").getAttribute("data-volume-size"))!)[1]).toBeCloseTo(4);
  await page.getByTestId("desktop-inspector-toggle").click();
  await page.getByRole("button", { name: "Özellikler", exact: true }).click();
  await expect(page.getByLabel("Alt ve üst kot")).toContainText("+4,000 m");
  await page.locator(".hcad-advanced-element > summary").click();
  await page.getByLabel("Kesit biçimi", { exact: true }).selectOption("polygon");
  await page.getByLabel("Poligon kesit köşeleri", { exact: true }).fill("0 0\n1 0\n0 1");
  await page.getByTestId("property-apply").click();
  await expect.poll(async () => (await saved(page)).elements[0].type === "column" && (await saved(page)).elements[0]).toMatchObject({ section: "polygon", sectionPoints: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }] });
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "JSON kaydet", exact: true }).click();
  const file = await download; expect(JSON.parse(await fs.readFile((await file.path())!, "utf8")).toolDefaults.column.section).toBe("circle");
});

test("curved wall, layered sloping slab, manual rebar and filtered load report work end to end", async ({ page }) => {
  await ready(page);
  let dialog = await settings(page, "wall");
  await dialog.getByLabel("Yay orta sehimi (m)", { exact: true }).fill("0.5");
  await dialog.getByRole("button", { name: "Varsayılanları uygula" }).click();
  await point(page, 0, -2); await point(page, 4, -2);
  dialog = await settings(page, "slab");
  await dialog.getByLabel("X eğimi (%)", { exact: true }).fill("50");
  await dialog.getByLabel("Kalınlığı katmanlardan hesapla", { exact: true }).check();
  await dialog.getByLabel("Katman 1 kalınlık (m)", { exact: true }).fill("0.1");
  await dialog.getByRole("button", { name: "Beton katmanı ekle" }).click();
  await dialog.getByLabel("Katman 2 kalınlık (m)", { exact: true }).fill("0.1");
  await dialog.getByLabel("Kaplama yükü (kN/m²)", { exact: true }).fill("1.5");
  await dialog.getByLabel("Hareketli yük Q (kN/m²)", { exact: true }).fill("2");
  await dialog.getByLabel("Tanımlı donatı (kg)", { exact: true }).fill("20");
  await dialog.getByRole("button", { name: "Varsayılanları uygula" }).click();
  await page.getByTestId("slab-mode-polygon").click();
  for (const [x, y] of [[0, 0], [2, 0], [2, 2], [0, 2]]) await point(page, x, y);
  await page.getByTestId("finish-slab").click();
  await expect.poll(async () => (await saved(page)).elements.length).toBe(2);
  await page.getByTestId("desktop-inspector-toggle").click();
  await page.getByTestId("hsyncad-report-open").click();
  await page.getByRole("combobox", { name: "Metraj gruplaması", exact: true }).selectOption("type");
  await page.getByRole("dialog").getByLabel("Perde", { exact: true }).uncheck();
  const rows = page.getByTestId("hsyncad-report").locator("tbody tr");
  await expect(rows).toHaveCount(1); await expect(rows.first()).toContainText("Döşeme");
  const cells = await rows.first().locator("td").allTextContents();
  expect(cells.slice(0, 3)).toEqual(["1", "0,8", "0,8"]); expect(cells.slice(-3)).toEqual(["20", "6", "8"]);
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "CSV metraj indir" }).click();
  const file = await download; const csv = await fs.readFile((await file.path())!, "utf8"); expect(csv).toContain('"Döşeme";1;0,800000;0,800000');
  await page.getByRole("button", { name: "Ayarları kapat" }).click();
  await expect(page.getByTestId("hsyncad-3d-viewport")).not.toHaveAttribute("data-rendered-solid-count", "0");
});

test("mobile layer locks, project materials and modal focus remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await ready(page);
  await page.getByRole("button", { name: "Ölçülü örnekle başla" }).click();
  await page.getByRole("tab", { name: /^Görün(üm|tü)$/ }).click();
  await page.getByRole("button", { name: "Katman ayarları", exact: true }).click();
  await page.getByLabel("Kolonlar kilitli", { exact: true }).check();
  await expect.poll(async () => (await saved(page)).floors[0].layerStates?.Kolonlar.locked).toBe(true);
  await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("tab", { name: /^(Ayarlar|Proje)$/ }).click();
  await page.getByRole("button", { name: "Malzeme tanımları", exact: true }).click();
  await page.getByLabel("Yeni malzeme adı", { exact: true }).fill("C30/37");
  await page.getByRole("button", { name: "Malzeme ekle", exact: true }).click();
  await expect.poll(async () => (await saved(page)).materials.length).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press("Escape");
  const dialog = await settings(page, "beam");
  await dialog.getByLabel("Sağ / bitiş uç kot farkı (m)", { exact: true }).fill("0.5");
  await dialog.getByRole("combobox", { name: "Malzeme", exact: true }).selectOption({ label: "C30/37" });
  await dialog.getByRole("button", { name: "Varsayılanları uygula" }).click();
  expect((await saved(page)).toolDefaults?.beam?.materialId).toBe((await saved(page)).materials[1].id);
  await page.getByTestId("hsyncad-coordinate-toggle").click();
  await page.getByLabel("Koordinat giriş yöntemi", { exact: true }).selectOption("relative");
  await point(page, 2, 1); await point(page, 3, 0);
  const beam = (await saved(page)).elements.find(e => e.name === "K5"); expect(beam).toMatchObject({ start: { x: 2, y: 1 }, end: { x: 5, y: 1 }, endTopOffset: 0.5 });
});

test("failed junctions display an explicit error without gross fallback meshes", async ({ page }) => {
  await ready(page);
  const model = createEmptyModel(), template = createToolTemplate("column", "floor-0", "concrete");
  if (template.type !== "column") throw new Error("Bad template");
  model.elements = Array.from({ length: 100 }, (_, i) => ({ ...template, id: `c${i}`, name: `S${i}`, position: { x: (i % 10) * 0.17, y: Math.floor(i / 10) * 0.17 }, width: 0.6, section: "circle", circleSegments: 32, heightMode: "fixed", height: 3 + i * 0.001 }));
  expect(resolveJunctions(model).status).toBe("failed");
  await page.getByTestId("hsyncad-import").setInputFiles({ name: "budget.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(model)) });
  await expect(page.getByTestId("hsyncad-3d").getByRole("alert")).toContainText("Birleşim üretilemedi");
  await expect(page.getByTestId("hsyncad-3d-viewport")).toHaveAttribute("data-rendered-solid-count", "0");
  await expect(page.getByTestId("quantity-net")).toHaveText("—");
});

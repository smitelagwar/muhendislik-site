import { expect, test, type Page } from "@playwright/test";
import type { CadModel } from "../../src/lib/hsyncad/model";

test.use({ viewport: { width: 1920, height: 1080 } });

async function ready(page: Page) {
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("hsyncad-native-coordinates")).toBeVisible();
}
const model = (page: Page): Promise<CadModel> => page.evaluate(() => JSON.parse(localStorage.getItem("hsyncad.model.v1")!));
async function point(page: Page, x: number, y: number) {
  await page.getByTestId("coordinate-x").fill(String(x));
  await page.getByTestId("coordinate-y").fill(String(y));
  await page.getByTestId("coordinate-place").click();
}
async function screen(page: Page, x: number, y: number) {
  const plan = page.getByTestId("hsyncad-plan"), box = (await plan.boundingBox())!;
  const camera = JSON.parse((await plan.getAttribute("data-camera"))!) as { x: number; y: number; scale: number };
  return { x: box.x + box.width / 2 + (x - camera.x) * camera.scale, y: box.y + box.height / 2 - (y - camera.y) * camera.scale, localX: box.width / 2 + (x - camera.x) * camera.scale, localY: box.height / 2 - (y - camera.y) * camera.scale };
}

test("Enter keeps X locked and mouse preview matches the inserted column", async ({ page }) => {
  await ready(page); await page.getByTestId("tool-column").click();
  const x = page.getByTestId("coordinate-x"), lock = page.getByRole("checkbox", { name: "X koordinatını kilitle", exact: true });
  await x.fill("3"); await x.press("Enter"); await expect(lock).toBeChecked();
  await x.press("Enter"); await expect(lock).toBeChecked();
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "0");
  const pointer = await screen(page, 6, 1), target = await screen(page, 3, 1);
  await page.mouse.move(pointer.x, pointer.y);
  const previewAnchor = page.getByTestId("hsyncad-placement-preview").locator("circle");
  await expect.poll(async () => Number(await previewAnchor.getAttribute("cx"))).toBeCloseTo(target.localX, 4);
  await expect.poll(async () => Number(await previewAnchor.getAttribute("cy"))).toBeCloseTo(target.localY, 4);
  await page.mouse.click(pointer.x, pointer.y);
  await page.getByTestId("hsyncad-workbench").focus(); await page.keyboard.press("Enter");
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "1");
  expect((await model(page)).elements[0]).toMatchObject({ type: "column", position: { x: 3, y: 1 } });
});

test("X/Y pair locks reserve the coordinate pair and the point button places it once", async ({ page }) => {
  await ready(page); await page.getByTestId("tool-column").click();
  const bounds = (await page.getByTestId("hsyncad-native-coordinates").boundingBox())!;
  expect(bounds.width).toBe(220); expect(bounds.height).toBeLessThanOrEqual(125);
  await page.getByTestId("coordinate-x").fill("3"); await page.getByTestId("coordinate-x").press("Enter");
  await page.getByTestId("coordinate-y").fill("2"); await page.getByTestId("coordinate-y").press("Enter");
  await expect(page.getByRole("checkbox", { name: "X koordinatını kilitle", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Y koordinatını kilitle", exact: true })).toBeChecked();
  await expect(page.getByRole("textbox", { name: "L koordinatı", exact: true })).toBeDisabled();
  await expect(page.getByRole("textbox", { name: "A koordinatı", exact: true })).toBeDisabled();
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "0");
  await page.getByTestId("coordinate-place").click();
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "1");
  expect((await model(page)).elements).toHaveLength(1);
  expect((await model(page)).elements[0]).toMatchObject({ type: "column", position: { x: 3, y: 2 } });
});

test("L/A locks produce an exact beam endpoint in centimetres", async ({ page }) => {
  await ready(page); await page.getByRole("combobox", { name: "Çizim giriş birimi", exact: true }).selectOption("cm");
  await page.getByTestId("tool-beam").click(); await point(page, 100, 200);
  const length = page.getByRole("textbox", { name: "L koordinatı", exact: true }), angle = page.getByRole("textbox", { name: "A koordinatı", exact: true });
  await length.fill("400"); await length.press("Enter");
  await angle.fill("90"); await angle.press("Enter");
  await expect(page.getByRole("checkbox", { name: "Uzunluğu kilitle", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Açıyı kilitle", exact: true })).toBeChecked();
  await expect(page.getByTestId("coordinate-x")).toBeDisabled(); await expect(page.getByTestId("coordinate-y")).toBeDisabled();
  await page.getByTestId("coordinate-place").click();
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "1");
  const beam = (await model(page)).elements.find(e => e.type === "beam");
  expect(beam?.type).toBe("beam"); if (beam?.type !== "beam") throw new Error("Beam missing");
  expect(beam.start).toEqual({ x: 1, y: 2 }); expect(beam.end.x).toBeCloseTo(1, 8); expect(beam.end.y).toBeCloseTo(6, 8);
});

test("relative and polar numeric entries share the continuous beam anchor and centimetre scale", async ({ page }) => {
  await ready(page); await page.getByRole("combobox", { name: "Çizim giriş birimi", exact: true }).selectOption("cm");
  await page.getByTestId("tool-beam").click(); await point(page, 100, 200);
  await page.getByRole("combobox", { name: "Koordinat giriş yöntemi", exact: true }).selectOption("relative");
  await point(page, 300, 400);
  await page.getByRole("combobox", { name: "Koordinat giriş yöntemi", exact: true }).selectOption("polar");
  await point(page, 500, 0);
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "2");
  const beams = (await model(page)).elements.filter(e => e.type === "beam");
  expect(beams[0]).toMatchObject({ start: { x: 1, y: 2 }, end: { x: 4, y: 6 } });
  expect(beams[1]).toMatchObject({ start: { x: 4, y: 6 }, end: { x: 9, y: 6 } });
});

test("switching drawing units preserves the physical X lock and numeric point", async ({ page }) => {
  await ready(page); await page.getByTestId("tool-column").click();
  await page.getByTestId("coordinate-x").fill("3"); await page.getByTestId("coordinate-x").press("Enter");
  await page.getByTestId("coordinate-y").fill("2");
  await page.getByRole("combobox", { name: "Çizim giriş birimi", exact: true }).selectOption("cm");
  await expect(page.getByTestId("coordinate-x")).toHaveValue("300");
  await expect(page.getByTestId("coordinate-y")).toHaveValue("200");
  await expect(page.getByRole("checkbox", { name: "X koordinatını kilitle", exact: true })).toBeChecked();
  await page.getByTestId("coordinate-place").click();
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "1");
  expect((await model(page)).elements[0]).toMatchObject({ type: "column", position: { x: 3, y: 2 } });
});

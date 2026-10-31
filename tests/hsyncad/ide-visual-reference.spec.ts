import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const output = path.join(process.cwd(), "test-output/hsyncad-ide-reference");

test("Mustafa 1 native reference: ceiling floor, full plan, close plan, zoom out and materials", async ({ page }) => {
  test.setTimeout(150_000);
  const errors: string[] = [];
  page.on("pageerror", e => { errors.push(e.message); console.error("Browser exception:", e.message); });
  await fs.mkdir(output, { recursive: true });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await page.getByTestId("open-ide-projects").click();
  await page.getByTestId("ide-sample-mustafa-selvi-1").click();
  await expect(page.getByTestId("ide-loading")).toBeHidden({ timeout: 60_000 });
  await expect(page.getByTestId("ide-floor").locator("option:checked")).toContainText("1. BODRUM TAVANI · 0,5 m");
  await expect(page.getByTestId("ide-floor").locator("option")).toContainText([/ASANSÖR MAK.DAİRESİ TAVANI · 15,1 m/, /3. KAT/, /2. KAT/, /1. KAT/, /ZEMİN KAT/, /1. BODRUM/]);
  await expect(page.getByTestId("ide-3d-canvas")).toBeVisible();
  await page.screenshot({ path: path.join(output, "mustafa-1-split.png") });
  await page.getByTestId("ide-view-2d").click();
  await page.getByTestId("ide-fit").click();
  const canvas = page.getByTestId("ide-plan-canvas");
  // Wait for the demand-rendered canvas to finish the white CAD plan.
  await expect.poll(() => canvas.evaluate(node => {
    const c = node as HTMLCanvasElement;
    const pixels = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    let light = 0, green = 0, orange = 0;
    for (let i = 0; i < pixels.length; i += 16) {
      if (pixels[i] > 225 && pixels[i + 1] > 225 && pixels[i + 2] > 225) light++;
      if (pixels[i] < 90 && pixels[i + 1] > 180 && pixels[i + 2] < 110) green++;
      if (pixels[i] > 220 && pixels[i + 1] > 35 && pixels[i + 1] < 170 && pixels[i + 2] < 100) orange++;
    }
    return light > pixels.length / 16 * .35 && green > 30 && orange > 10;
  })).toBe(true);
  await expect(canvas).toHaveAttribute("data-axis-label-count", "96");
  // No concrete wall exists at X=-2..-1, Y=15..22. The former canvas-path bug
  // painted hatch diagonals here after removing the wall's clipping region.
  const outsideHatch = await canvas.evaluate(node => {
    const c = node as HTMLCanvasElement, r = c.getBoundingClientRect();
    const scale = Number(c.dataset.scale), cx = Number(c.dataset.cameraX), cy = Number(c.dataset.cameraY);
    const ratio = c.width / r.width;
    const x = (r.width / 2 + (-2 - cx) * scale) * ratio;
    const y = (r.height / 2 - (22 - cy) * scale) * ratio;
    const data = c.getContext("2d")!.getImageData(Math.round(x), Math.round(y), Math.ceil(scale * ratio), Math.ceil(7 * scale * ratio)).data;
    let purple = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i + 2] - data[i] > 25 && data[i] < 200) purple++;
    return purple;
  });
  expect(outsideHatch).toBe(0);
  const scale = Number(await canvas.getAttribute("data-scale"));
  const cx = Number(await canvas.getAttribute("data-camera-x")), cy = Number(await canvas.getAttribute("data-camera-y"));
  const rect = (await canvas.boundingBox())!;
  await page.mouse.move(rect.x + rect.width / 2 + (6.5 - cx) * scale, rect.y + rect.height / 2 - (20 - cy) * scale);
  await expect(page.getByTestId("ide-plan-tooltip")).toContainText("D4");
  await expect(page.getByTestId("ide-plan-tooltip")).toContainText("0.545 tf/m²");
  await page.mouse.move(rect.x + 10, rect.y + 10);
  await page.screenshot({ path: path.join(output, "mustafa-1-plan-fit.png") });
  const bounds = (await canvas.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width * .32, bounds.y + bounds.height * .25);
  const fitScale = Number(await canvas.getAttribute("data-scale"));
  for (let i = 0; i < 3; i++) {
    const previous = Number(await canvas.getAttribute("data-scale"));
    await page.mouse.wheel(0, -200);
    await expect.poll(async () => Number(await canvas.getAttribute("data-scale"))).toBeGreaterThan(previous * 1.2);
  }
  await expect.poll(async () => Number(await canvas.getAttribute("data-scale"))).toBeGreaterThan(fitScale * 3);
  await page.screenshot({ path: path.join(output, "mustafa-1-plan-close.png") });
  for (let i = 0; i < 6; i++) {
    const previous = Number(await canvas.getAttribute("data-scale"));
    await page.mouse.wheel(0, 200);
    await expect.poll(async () => Number(await canvas.getAttribute("data-scale"))).toBeLessThan(previous * .9);
  }
  await expect.poll(async () => Number(await canvas.getAttribute("data-scale"))).toBeLessThan(fitScale * .5);
  await page.screenshot({ path: path.join(output, "mustafa-1-plan-far.png") });
  await page.getByTestId("ide-fit").click();
  await page.getByTestId("ide-view-3d").click();
  await page.getByTestId("ide-slab-mode").selectOption("solid");
  await expect(page.getByTestId("ide-3d-canvas")).toHaveAttribute("data-slab-mode", "solid");
  await page.screenshot({ path: path.join(output, "mustafa-1-solid.png") });
  await page.getByTestId("ide-slab-mode").selectOption("transparent");
  await expect(page.getByTestId("ide-3d-canvas")).toHaveAttribute("data-slab-mode", "transparent");
  await page.screenshot({ path: path.join(output, "mustafa-1-transparent.png") });
  expect(errors).toEqual([]);
});

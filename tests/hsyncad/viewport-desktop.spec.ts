import { expect, test } from "@playwright/test";

const viewports = [
  { width: 1920, height: 1080 },
  { width: 1640, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 1366, height: 600 },
] as const;

test("hsynCAD fills the desktop viewport; only inspector/axis panels can scroll", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("hsyncad-3d-canvas")).toBeVisible();

  const geometry = () => page.evaluate(() => {
    const box = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error("Missing " + selector);
      const r = element.getBoundingClientRect();
      return { width: r.width, height: r.height, left: r.left, top: r.top, bottom: r.bottom };
    };
    const root = document.scrollingElement!;
    return {
      doc: { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth, scrollHeight: root.scrollHeight, clientHeight: root.clientHeight, scrollY: window.scrollY },
      app: box('[data-testid="hsyncad-workbench"]'),
      plan: box('[data-testid="hsyncad-plan"]'),
      scene: box('[data-testid="hsyncad-3d-viewport"]'),
      inspector: box(".hcad-inspector-content"),
      command: box(".hcad-command"),
      message: box(".hcad-message"),
      status: box(".hcad-statusbar"),
      help: box(".hcad-bottom-help"),
    };
  });

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await expect.poll(async () => (await geometry()).app.height).toBeGreaterThan(viewport.height - 2);
    const m = await geometry();
    expect(m.doc.scrollHeight, "document vertical overflow " + JSON.stringify(viewport)).toBeLessThanOrEqual(m.doc.clientHeight + 1);
    expect(m.doc.scrollWidth, "document horizontal overflow " + JSON.stringify(viewport)).toBeLessThanOrEqual(m.doc.clientWidth + 1);
    expect(Math.abs(m.app.width - viewport.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.app.height - viewport.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.app.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(m.app.top)).toBeLessThanOrEqual(1);
    expect(m.plan.width).toBeGreaterThan(100);
    expect(m.plan.height).toBeGreaterThan(40);
    expect(m.scene.width).toBeGreaterThan(100);
    expect(m.scene.height).toBeGreaterThan(40);
    expect(m.inspector.height).toBeGreaterThan(40);
    for (const row of [m.command, m.message, m.status, m.help]) {
      expect(row.bottom).toBeLessThanOrEqual(viewport.height + 1);
      expect(row.height).toBeGreaterThan(0);
    }
    await page.keyboard.press("PageDown");
    await page.evaluate(() => window.scrollTo(0, 999));
    expect((await geometry()).doc.scrollY).toBeLessThanOrEqual(1);
  }

  await page.setViewportSize({ width: 1366, height: 600 });
  const plan = page.getByTestId("hsyncad-plan");
  const original = JSON.parse((await plan.getAttribute("data-camera"))!).scale as number;
  const planBounds = await plan.boundingBox();
  if (!planBounds) throw new Error("2D plan has no bounds");
  await page.mouse.move(planBounds.x + planBounds.width / 2, planBounds.y + planBounds.height / 2);
  await page.mouse.wheel(0, -120);
  await expect.poll(async () => JSON.parse((await plan.getAttribute("data-camera"))!).scale as number).toBeGreaterThan(original);
  expect((await geometry()).doc.scrollY).toBeLessThanOrEqual(1);

  await page.getByRole("button", { name: "Ölçülü örnekle başla" }).click();
  const inspector = page.locator(".hcad-inspector-content");
  const scrollSize = await inspector.evaluate((el) => ({ scrollHeight: el.scrollHeight, height: el.clientHeight }));
  if (scrollSize.scrollHeight > scrollSize.height + 5) {
    const r = await inspector.boundingBox();
    if (!r) throw new Error("Inspector hidden");
    await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
    await page.mouse.wheel(0, 300);
    await expect.poll(() => inspector.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
    expect((await geometry()).doc.scrollY).toBeLessThanOrEqual(1);
  }
  await page.getByTestId("tool-axis").click();
  await expect(page.getByTestId("hsyncad-axis-options-slot")).toBeVisible();
  expect((await geometry()).doc.scrollHeight).toBeLessThanOrEqual((await geometry()).doc.clientHeight + 1);
  await page.getByRole("tab", { name: "Proje" }).click();
  expect((await geometry()).doc.scrollY).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

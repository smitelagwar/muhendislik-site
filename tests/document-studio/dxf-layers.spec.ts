import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const DXF_FIXTURE_DIR = path.resolve(process.cwd(), "tests", "fixtures", "dxf");
const ENTITY_COVERAGE_LAYERS = [
  "COV_LINE",
  "COV_LWPOLYLINE",
  "COV_POLYLINE",
  "COV_ARC",
  "COV_CIRCLE",
  "COV_ELLIPSE",
  "COV_POINT",
  "COV_SOLID",
  "COV_3DFACE",
  "COV_SPLINE",
  "COV_HATCH",
  "COV_INSERT",
] as const;

type LayerSnapshot = {
  visibleLayerNames: string[];
  hiddenLayerNames: string[];
  visibleBounds: { minX: number; maxX: number; minY: number; maxY: number } | null;
  allHidden: boolean;
};

type RuntimeSnapshot = {
  bounds: { minX: number; maxX: number; minY: number; maxY: number } | null;
  camera: { position: { x: number; y: number } } | null;
};

async function login(page: Page) {
  await page.goto("/dokumantasyon");
  await page.getByLabel("Kullanıcı Adı").fill("admin");
  await page.locator("input#password").fill("admin");
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes("/api/dokumantasyon/giris") && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  const response = await responsePromise;
  expect(response.status(), `admin login failed: ${await response.text()}`).toBe(200);
  await expect(page.getByLabel("Kullanıcı Adı")).toBeHidden();
}

async function uploadFixture(page: Page, fixtureName = "stage4-layer-interaction.dxf"): Promise<string> {
  const buffer = await readFile(path.join(DXF_FIXTURE_DIR, fixtureName));
  let lastNetworkError: unknown = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await page.request.post("/api/dokumantasyon/upload/local", {
        multipart: {
          file: { name: `layers-${fixtureName}`, mimeType: "application/dxf", buffer },
          pathname: `dok_storage/dxf-layers-${Date.now()}-${Math.random().toString(36).slice(2)}-${fixtureName}`,
        },
      });
      const payload = await response.json();
      expect(response.ok(), payload.error || "DXF layer fixture upload failed").toBeTruthy();
      expect(payload.file?.id).toBeTruthy();
      return payload.file.id as string;
    } catch (error) {
      lastNetworkError = error;
      if (attempt === 0) {
        await page.waitForTimeout(300);
        continue;
      }
    }
  }

  throw lastNetworkError instanceof Error ? lastNetworkError : new Error("DXF layer fixture upload failed after transient retry");
}

async function layerSnapshot(page: Page): Promise<LayerSnapshot> {
  const output = page.getByTestId("cad-dxf-layer-snapshot");
  await expect(output).toBeAttached({ timeout: 30_000 });
  return JSON.parse((await output.textContent()) || "{}") as LayerSnapshot;
}

async function runtimeSnapshot(page: Page): Promise<RuntimeSnapshot> {
  const output = page.getByTestId("cad-dxf-runtime-snapshot");
  await expect(output).toBeAttached({ timeout: 30_000 });
  return JSON.parse((await output.textContent()) || "{}") as RuntimeSnapshot;
}

function spanX(snapshot: LayerSnapshot): number {
  expect(snapshot.visibleBounds).not.toBeNull();
  return snapshot.visibleBounds!.maxX - snapshot.visibleBounds!.minX;
}

function expectFiniteNonDegenerateBounds(bounds: LayerSnapshot["visibleBounds"], label: string) {
  expect(bounds, `${label} should contribute renderer bounds`).not.toBeNull();
  const values = [bounds!.minX, bounds!.maxX, bounds!.minY, bounds!.maxY];
  expect(values.every(Number.isFinite), `${label} renderer bounds must be finite`).toBe(true);
  const combinedSpan = bounds!.maxX - bounds!.minX + bounds!.maxY - bounds!.minY;
  expect(combinedSpan, `${label} should produce non-degenerate renderer geometry`).toBeGreaterThan(0);
}

async function expectNoHorizontalOverflow(page: Page) {
  const geometry = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(geometry.scrollWidth, "DXF mobile viewer must not create page-level horizontal overflow").toBeLessThanOrEqual(geometry.clientWidth);
}

async function expectCanvasImageToChange(canvas: Locator, before: Buffer, message: string) {
  await expect.poll(async () => {
    const current = await canvas.screenshot({ animations: "disabled" });
    return before.equals(current);
  }, { message, timeout: 8_000 }).toBe(false);
}

async function attach(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, {
    body: await page.screenshot({ animations: "disabled" }),
    contentType: "image/png",
  });
}

test.describe("DXF interactive layer controls", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "DXF WebGL layer gate runs in Chromium.");

  test("source visibility, layer toggles and visible-only FitView stay consistent", async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1200, height: 800 });
    await login(page);
    const fileId = await uploadFixture(page);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    await expect(page.getByTestId("cad-dxf-viewer")).toBeVisible();
    await expect(page.getByRole("heading", { name: "DXF açılamadı" })).toBeHidden();

    let layers = await layerSnapshot(page);
    expect(layers.visibleLayerNames).toEqual(["0", "ACTIVE_B"]);
    expect(layers.hiddenLayerNames).toEqual(["FROZEN_LAYER", "OFF_LAYER"]);
    expect(spanX(layers)).toBeCloseTo(100, 3);

    await page.getByRole("button", { name: "Katmanlar" }).click();
    await expect(page.getByTestId("cad-dxf-layer-panel")).toBeVisible();
    await expect(page.getByTestId("cad-dxf-layer-OFF_LAYER")).toHaveAttribute("data-visible", "false");
    await expect(page.getByTestId("cad-dxf-layer-FROZEN_LAYER")).toHaveAttribute("data-visible", "false");

    const beforeToggle = await runtimeSnapshot(page);
    await page.getByTestId("cad-dxf-layer-OFF_LAYER").click();
    layers = await layerSnapshot(page);
    expect(layers.visibleLayerNames).toContain("OFF_LAYER");
    expect(spanX(layers)).toBeCloseTo(1100, 3);
    const afterToggleBeforeFit = await runtimeSnapshot(page);
    expect(afterToggleBeforeFit.camera?.position).toEqual(beforeToggle.camera?.position);

    await page.getByRole("button", { name: "Sığdır" }).click();
    await expect.poll(async () => (await runtimeSnapshot(page)).bounds?.maxX).toBeCloseTo(1100, 3);
    let runtime = await runtimeSnapshot(page);
    expect(runtime.bounds?.minX).toBeCloseTo(0, 3);
    expect(runtime.bounds?.maxX).toBeCloseTo(1100, 3);

    await page.getByTestId("cad-dxf-layer-FROZEN_LAYER").click();
    layers = await layerSnapshot(page);
    expect(spanX(layers)).toBeCloseTo(2100, 3);
    await page.getByRole("button", { name: "Sığdır" }).click();
    await expect.poll(async () => (await runtimeSnapshot(page)).bounds?.minX).toBeCloseTo(-1000, 3);
    runtime = await runtimeSnapshot(page);
    expect(runtime.bounds?.maxX).toBeCloseTo(1100, 3);
    await attach(page, testInfo, "dxf-layers-expanded.png");

    await page.getByRole("button", { name: "Tümünü kapat" }).click();
    layers = await layerSnapshot(page);
    expect(layers.allHidden).toBe(true);
    await expect(page.getByTestId("cad-dxf-all-layers-hidden")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sığdır" })).toBeDisabled();

    await page.getByRole("button", { name: "Kaynak", exact: true }).click();
    layers = await layerSnapshot(page);
    expect(layers.visibleLayerNames).toEqual(["0", "ACTIVE_B"]);
    expect(spanX(layers)).toBeCloseTo(100, 3);
    await expect(page.getByTestId("cad-dxf-all-layers-hidden")).toHaveCount(0);

    await page.getByTestId("cad-dxf-layer-search").fill("OFF");
    await expect(page.getByTestId("cad-dxf-layer-OFF_LAYER")).toBeVisible();
    await expect(page.getByTestId("cad-dxf-layer-ACTIVE_B")).toHaveCount(0);
  });

  test("layer panel remains usable on 390px mobile viewport", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    const fileId = await uploadFixture(page);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    await expect(page.getByTestId("cad-dxf-layer-snapshot")).toBeAttached({ timeout: 30_000 });
    await page.getByRole("button", { name: "Katmanlar" }).click();
    const panel = page.getByTestId("cad-dxf-layer-panel");
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    await expect(page.getByRole("button", { name: "Tümünü aç" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tümünü kapat" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Kaynak", exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await attach(page, testInfo, "dxf-layers-mobile.png");
  });

  test("390px mobile canvas keeps wheel, drag, touch and pinch inside the CAD surface and recovers from all-hidden layers", async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page);
    const fileId = await uploadFixture(page);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    const viewer = page.getByTestId("cad-dxf-viewer");
    const canvasHost = page.getByTestId("cad-dxf-canvas");
    const canvas = canvasHost.locator("canvas").first();
    await expect(viewer).toBeVisible();
    await expect(canvas).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "DXF açılamadı" })).toBeHidden();
    await expectNoHorizontalOverflow(page);

    const hostBox = await canvasHost.boundingBox();
    expect(hostBox).not.toBeNull();
    expect(hostBox!.width).toBeGreaterThan(250);
    expect(hostBox!.height).toBeGreaterThan(300);

    const scrollBeforeZoom = await page.evaluate(() => window.scrollY);
    const zoomBefore = await canvas.screenshot({ animations: "disabled" });
    await page.mouse.move(hostBox!.x + hostBox!.width * 0.5, hostBox!.y + hostBox!.height * 0.5);
    await page.mouse.wheel(0, -650);
    await expectCanvasImageToChange(canvas, zoomBefore, "wheel zoom must visibly change the DXF canvas");
    expect(await page.evaluate(() => window.scrollY), "CAD zoom must not scroll the document").toBe(scrollBeforeZoom);

    const panBefore = await canvas.screenshot({ animations: "disabled" });
    const startX = hostBox!.x + hostBox!.width * 0.55;
    const startY = hostBox!.y + hostBox!.height * 0.55;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 55, startY + 35, { steps: 6 });
    await page.mouse.up();
    await expectCanvasImageToChange(canvas, panBefore, "drag pan must visibly change the DXF canvas");
    expect(await page.evaluate(() => window.scrollY), "CAD pan must stay inside the viewer").toBe(scrollBeforeZoom);

    const visualScaleBefore = await page.evaluate(() => window.visualViewport?.scale ?? 1);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    const centerX = Math.round(hostBox!.x + hostBox!.width * 0.5);
    const centerY = Math.round(hostBox!.y + hostBox!.height * 0.5);

    const touchBefore = await canvas.screenshot({ animations: "disabled" });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: centerX, y: centerY }],
    });
    for (const offset of [18, 36, 54]) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: centerX + offset, y: centerY + Math.round(offset * 0.5) }],
      });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expectCanvasImageToChange(canvas, touchBefore, "one-finger touch pan must visibly change the DXF canvas");
    expect(await page.evaluate(() => window.scrollY), "CAD one-finger touch must not scroll the document").toBe(scrollBeforeZoom);
    expect(await page.evaluate(() => window.visualViewport?.scale ?? 1), "CAD one-finger touch must not browser-zoom the page").toBeCloseTo(visualScaleBefore, 5);

    const pinchBefore = await canvas.screenshot({ animations: "disabled" });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [
        { x: centerX - 28, y: centerY },
        { x: centerX + 28, y: centerY },
      ],
    });
    for (const distance of [40, 54, 68]) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          { x: centerX - distance, y: centerY },
          { x: centerX + distance, y: centerY },
        ],
      });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach();
    await expectCanvasImageToChange(canvas, pinchBefore, "two-finger pinch must visibly change the DXF canvas");
    expect(await page.evaluate(() => window.scrollY), "CAD pinch must not scroll the document").toBe(scrollBeforeZoom);
    expect(await page.evaluate(() => window.visualViewport?.scale ?? 1), "CAD pinch must not browser-zoom the page").toBeCloseTo(visualScaleBefore, 5);

    await page.getByRole("button", { name: "Katmanlar" }).click();
    await page.getByRole("button", { name: "Tümünü kapat" }).click();
    await expect(page.getByTestId("cad-dxf-all-layers-hidden")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sığdır" })).toBeDisabled();
    await page.getByRole("button", { name: "Katman panelini kapat", exact: true }).click();
    await page.getByRole("button", { name: "Kaynak görünürlüğüne dön" }).click();
    await expect(page.getByTestId("cad-dxf-all-layers-hidden")).toHaveCount(0);
    expect((await layerSnapshot(page)).allHidden).toBe(false);
    await expect(page.getByRole("button", { name: "Sığdır" })).toBeEnabled();
    await expectNoHorizontalOverflow(page);
    await attach(page, testInfo, "dxf-mobile-wheel-drag-touch-pinch-recovery.png");
  });

  test("each accepted geometry entity type produces isolated renderer bounds", async ({ page }, testInfo) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1280, height: 820 });
    await login(page);
    const fileId = await uploadFixture(page, "stage6-entity-coverage.dxf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);

    await expect(page.getByTestId("cad-dxf-viewer")).toBeVisible();
    await expect(page.getByRole("heading", { name: "DXF açılamadı" })).toBeHidden();
    await expect(page.getByTestId("cad-dxf-runtime-snapshot")).toBeAttached({ timeout: 30_000 });
    await expect(page.getByTestId("cad-dxf-diagnostics-toggle")).toContainText("Denetim temiz");
    await attach(page, testInfo, "dxf-stage6-entity-coverage-all.png");

    await page.getByRole("button", { name: "Katmanlar" }).click();
    await expect(page.getByTestId("cad-dxf-layer-panel")).toBeVisible();
    await page.getByRole("button", { name: "Tümünü kapat" }).click();
    expect((await layerSnapshot(page)).allHidden).toBe(true);

    for (const layer of ENTITY_COVERAGE_LAYERS) {
      const toggle = page.getByTestId(`cad-dxf-layer-${layer}`);
      await expect(toggle).toBeVisible();
      await toggle.click();

      const isolated = await layerSnapshot(page);
      expect(isolated.visibleLayerNames, `${layer} must be the only visible entity layer`).toEqual([layer]);
      expectFiniteNonDegenerateBounds(isolated.visibleBounds, layer);

      await page.getByRole("button", { name: "Sığdır" }).click();
      await expect.poll(async () => (await runtimeSnapshot(page)).bounds, {
        message: `${layer} FitView must publish renderer bounds`,
      }).not.toBeNull();

      await toggle.click();
      expect((await layerSnapshot(page)).allHidden, `${layer} must be removable through layer visibility`).toBe(true);
    }

    await page.getByRole("button", { name: "Tümünü aç" }).click();
    const restored = await layerSnapshot(page);
    for (const layer of ENTITY_COVERAGE_LAYERS) expect(restored.visibleLayerNames).toContain(layer);
    await attach(page, testInfo, "dxf-stage6-entity-coverage-restored.png");
  });
});

import { devices, expect, test, type Locator, type Page } from "@playwright/test";

const SNAP_MODES = [
  "endpoint",
  "midpoint",
  "intersection",
  "center",
  "nearest",
] as const;
type SnapMode = (typeof SNAP_MODES)[number];
// The settings panel has a sixth mode. Exclude it when selecting exactly one of the five fixtures.
const ALL_SNAP_MODES = [...SNAP_MODES, "perpendicular"] as const;

type Point = { x: number; y: number };
type WorldPoint = { x: number; y: number; z?: number };
type CameraControlsInspection = {
  target?: WorldPoint;
  object?: { zoom?: number; position?: WorldPoint };
};
type CadAdapterInspection = {
  manager?: { curView?: { activeLayoutView?: { _cameraControls?: CameraControlsInspection } } };
  screenToWorldPoint: (point: Point) => WorldPoint;
  projectWorldPoint: (point: WorldPoint) => Point;
};
type WindowWithCadAdapter = Window & { __cadAdapter?: CadAdapterInspection };
type ViewerHarness = {
  host: Locator;
  viewport: Locator;
  center: Point;
};

function createPrecisionFixture(): string {
  const entityLine = (x1: number, y1: number, x2: number, y2: number) => [
    "0", "LINE",
    "100", "AcDbEntity", "8", "KALIP",
    "100", "AcDbLine",
    "10", String(x1), "20", String(y1), "30", "0",
    "11", String(x2), "21", String(y2), "31", "0",
  ];

  return [
    "0", "SECTION", "2", "HEADER",
    "9", "$ACADVER", "1", "AC1027",
    "0", "ENDSEC",
    "0", "SECTION", "2", "TABLES",
    "0", "TABLE", "2", "LAYER", "70", "2",
    "0", "LAYER", "2", "0", "70", "0", "62", "7", "6", "CONTINUOUS",
    "0", "LAYER", "2", "KALIP", "70", "0", "62", "2", "6", "CONTINUOUS",
    "0", "ENDTAB", "0", "ENDSEC",
    "0", "SECTION", "2", "ENTITIES",
    ...entityLine(-500, 0, 500, 0),
    ...entityLine(0, -500, 0, 500),
    ...entityLine(0, 0, 300, 300),
    "0", "CIRCLE",
    "100", "AcDbEntity", "8", "KALIP",
    "100", "AcDbCircle",
    "10", "0", "20", "0", "30", "0", "40", "100",
    "0", "ENDSEC", "0", "EOF",
  ].join("\n");
}

async function signIn(page: Page): Promise<void> {
  await page.goto("/dokumantasyon");

  const authProbe = await page.request.get("/api/dokumantasyon/items");
  if (authProbe.ok()) return;
  if (authProbe.status() !== 401) {
    throw new Error(`Stage 8 auth probe failed: ${authProbe.status()} ${await authProbe.text()}`);
  }

  const username = page.getByLabel("Kullanıcı Adı");
  await expect(username).toBeVisible({ timeout: 20_000 });
  await username.pressSequentially("admin");
  await page.locator("input#password").fill("admin");

  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/dokumantasyon/giris") &&
      response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  const response = await loginResponse;
  if (!response.ok()) {
    throw new Error(`Stage 8 admin login failed: ${response.status()} ${await response.text()}`);
  }
  await expect(username).toBeHidden({ timeout: 12_000 });
}

async function uploadFixture(page: Page): Promise<string> {
  const content = createPrecisionFixture();
  return page.evaluate(async ({ fixture }) => {
    const formData = new FormData();
    formData.append(
      "file",
      new File([fixture], "stage8-mobile-precision.dxf", { type: "application/dxf" })
    );
    formData.append("pathname", `cad-stage8-${crypto.randomUUID()}.dxf`);
    const response = await fetch("/api/dokumantasyon/upload/local", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok || !payload.file?.id) {
      throw new Error(payload.error || "Stage 8 DXF fixture yüklenemedi");
    }
    return payload.file.id as string;
  }, { fixture: content });
}

async function openViewer(page: Page): Promise<ViewerHarness> {
  await signIn(page);
  const fileId = await uploadFixture(page);
  await page.goto(`/dokumantasyon/dosya/${fileId}`);

  const runtime = page
    .locator('[data-cad-runtime="orchestrator"][data-cad-engine="upstream"]')
    .first();
  const host = runtime.locator('[data-cad-upstream-host="true"]').first();
  await expect(runtime).toBeVisible({ timeout: 30_000 });
  await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", {
    timeout: 30_000,
  });

  const viewport = host.locator('div[aria-label$="CAD görünümü"]').first();
  await expect(viewport).toBeVisible();
  await expect(viewport.locator("canvas").first()).toBeVisible();

  await page.getByTestId("cad-tool-fit").click();
  await page.waitForTimeout(120);

  const box = await viewport.boundingBox();
  if (!box) throw new Error("Stage 8 CAD viewport ölçülemedi");
  return {
    host,
    viewport,
    center: { x: box.x + box.width / 2, y: box.y + box.height / 2 },
  };
}

async function dispatchTouchPointer(
  target: Locator,
  type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel",
  point: Point,
  pointerId: number,
  isPrimary = true
): Promise<void> {
  const released = type === "pointerup" || type === "pointercancel";
  await target.dispatchEvent(type, {
    pointerId,
    pointerType: "touch",
    isPrimary,
    button: 0,
    buttons: released ? 0 : 1,
    clientX: point.x,
    clientY: point.y,
    pressure: released ? 0 : 0.5,
    width: 1,
    height: 1,
    bubbles: true,
    cancelable: true,
    composed: true,
  });
}

async function setSnapMaster(page: Page, enabled: boolean): Promise<void> {
  await page.getByTestId("cad-tool-snap-settings").click();
  const panel = page.getByTestId("cad-snap-settings-panel");
  await expect(panel).toBeVisible();
  const master = panel.getByTestId("cad-snap-master-toggle");
  if ((await master.getAttribute("aria-checked")) !== String(enabled)) {
    await master.click();
  }
  await expect(master).toHaveAttribute("aria-checked", String(enabled));
  await panel.getByRole("button", { name: "Nesne yakalama ayarlarını kapat" }).click();
}

async function setOnlySnapMode(page: Page, mode: SnapMode): Promise<void> {
  await page.getByTestId("cad-tool-snap-settings").click();
  const panel = page.getByTestId("cad-snap-settings-panel");
  await expect(panel).toBeVisible();
  const master = panel.getByTestId("cad-snap-master-toggle");
  if ((await master.getAttribute("aria-checked")) !== "true") await master.click();

  for (const candidate of ALL_SNAP_MODES) {
    const toggle = panel.getByTestId(`cad-snap-mode-${candidate}`);
    const shouldBeEnabled = candidate === mode;
    if ((await toggle.getAttribute("aria-checked")) !== String(shouldBeEnabled)) {
      await toggle.click();
    }
    await expect(toggle).toHaveAttribute("aria-checked", String(shouldBeEnabled));
  }

  await panel.getByRole("button", { name: "Nesne yakalama ayarlarını kapat" }).click();
}

async function startDistance(page: Page, host: Locator): Promise<void> {
  await page.getByTestId("cad-tool-distance").click();
  await expect(host).toHaveAttribute("data-cad-active-tool", "distance");
  await expect(host).toHaveAttribute("data-cad-distance-phase", "awaiting-first");
}

async function cancelDistance(page: Page, host: Locator): Promise<void> {
  if ((await host.getAttribute("data-cad-active-tool")) === "distance") {
    await page.getByTestId("cad-tool-distance").click();
  }
  await expect(host).toHaveAttribute("data-cad-active-tool", "none");
}

async function longPressUntilTracking(
  page: Page,
  target: Locator,
  host: Locator,
  point: Point,
  pointerId: number,
  phase: "tracking-first" | "tracking-second"
): Promise<void> {
  await dispatchTouchPointer(target, "pointerdown", point, pointerId);
  await expect(host).toHaveAttribute("data-cad-distance-phase", phase, { timeout: 1_100 });
  await expect(page.getByTestId("cad-precision-magnifier")).toBeVisible();
}

async function completedLineGeometry(page: Page): Promise<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
}> {
  const line = page.locator('[data-cad-distance-complete="true"] line').first();
  await expect(line).toBeAttached();
  const values = await line.evaluate((node) => {
    const element = node as SVGLineElement;
    return {
      x1: Number(element.getAttribute("x1")),
      y1: Number(element.getAttribute("y1")),
      x2: Number(element.getAttribute("x2")),
      y2: Number(element.getAttribute("y2")),
    };
  });
  return {
    ...values,
    length: Math.hypot(values.x2 - values.x1, values.y2 - values.y1),
  };
}

test("basılı tutma eşiği, snap, büyüteç, offset crosshair ve iki nokta commit akışı mobilde birlikte çalışır", async ({ page }) => {
  const { host, viewport, center } = await openViewer(page);
  await setOnlySnapMode(page, "intersection");
  await expect(host).toHaveAttribute("data-cad-snap-modes", "intersection");
  await startDistance(page, host);

  await longPressUntilTracking(page, viewport, host, center, 31, "tracking-first");
  await expect(page.getByTestId("cad-snap-label")).toHaveAttribute(
    "data-cad-snap-label",
    "intersection"
  );

  const lens = page.getByTestId("cad-precision-magnifier");
  const [lensBox, viewportBox] = await Promise.all([lens.boundingBox(), viewport.boundingBox()]);
  if (!lensBox || !viewportBox) throw new Error("Büyüteç veya viewport ölçülemedi");
  expect(lensBox.x).toBeGreaterThanOrEqual(viewportBox.x - 1);
  expect(lensBox.y).toBeGreaterThanOrEqual(viewportBox.y - 1);
  expect(lensBox.x + lensBox.width).toBeLessThanOrEqual(viewportBox.x + viewportBox.width + 1);
  expect(lensBox.y + lensBox.height).toBeLessThanOrEqual(viewportBox.y + viewportBox.height + 1);

  const offsetPoint = { x: center.x + 10, y: center.y };
  await dispatchTouchPointer(viewport, "pointermove", offsetPoint, 31);
  await expect(page.locator('[data-cad-offset-guide="true"]')).toBeAttached();
  await expect(page.getByTestId("cad-snap-label")).toHaveAttribute(
    "data-cad-snap-label",
    "intersection"
  );
  await dispatchTouchPointer(viewport, "pointerup", offsetPoint, 31);
  await expect(host).toHaveAttribute("data-cad-distance-phase", "awaiting-second");
  await expect(page.getByTestId("cad-precision-magnifier")).toHaveCount(0);

  const second = { x: center.x + 140, y: center.y + 55 };
  await longPressUntilTracking(page, viewport, host, second, 32, "tracking-second");
  await expect(page.locator('[data-cad-distance-rubber-band="true"]')).toBeVisible();
  await dispatchTouchPointer(viewport, "pointermove", { x: second.x + 18, y: second.y + 8 }, 32);
  await dispatchTouchPointer(viewport, "pointerup", { x: second.x + 18, y: second.y + 8 }, 32);

  await expect(host).toHaveAttribute("data-cad-active-tool", "none");
  await expect(page.locator('[data-cad-distance-complete="true"]')).toHaveCount(1);
  await expect(page.getByTestId("cad-precision-magnifier")).toHaveCount(0);
  expect((await completedLineGeometry(page)).length).toBeGreaterThan(40);
});

test("Endpoint, Midpoint, Intersection, Center ve Nearest gerçek CAD merkezinde ayrı snap etiketi üretir ve ayar kalıcıdır", async ({ page }) => {
  const { host, viewport, center } = await openViewer(page);

  let pointerId = 50;
  for (const mode of SNAP_MODES) {
    await setOnlySnapMode(page, mode);
    await expect(host).toHaveAttribute("data-cad-snap-modes", mode);
    await startDistance(page, host);
    await longPressUntilTracking(page, viewport, host, center, pointerId, "tracking-first");
    await expect(page.getByTestId("cad-snap-label")).toHaveAttribute("data-cad-snap-label", mode);
    await expect(page.locator('[data-cad-magnifier-snap-label]')).toHaveAttribute(
      "data-cad-magnifier-snap-label",
      mode
    );
    await dispatchTouchPointer(viewport, "pointercancel", center, pointerId);
    await expect(host).toHaveAttribute("data-cad-distance-phase", "awaiting-first");
    await cancelDistance(page, host);
    pointerId += 1;
  }

  await page.reload();
  const reloadedHost = page.locator('[data-cad-upstream-host="true"]').first();
  await expect(reloadedHost).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });
  await expect(reloadedHost).toHaveAttribute("data-cad-snap-modes", "nearest");
});

test("ikinci parmak pending long-press ölçümünü iptal eder ve CAD görünümü hazır kalır", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Touch pointer lifecycle mobile-chromium projesinde doğrulanır.");
  const { host, viewport, center } = await openViewer(page);
  await startDistance(page, host);

  await dispatchTouchPointer(viewport, "pointerdown", center, 71, true);
  await page.waitForTimeout(120);
  await expect(host).toHaveAttribute("data-cad-distance-phase", "pressing-first");

  const second = { x: center.x + 70, y: center.y };
  await dispatchTouchPointer(viewport, "pointerdown", second, 72, false);
  await expect(host).toHaveAttribute("data-cad-distance-phase", "awaiting-first");
  await expect(page.getByTestId("cad-precision-magnifier")).toHaveCount(0);
  await expect(host).toHaveAttribute("data-cad-upstream-state", "ready");

  await dispatchTouchPointer(viewport, "pointerup", second, 72, false);
  await dispatchTouchPointer(viewport, "pointerup", center, 71, true);
  await cancelDistance(page, host);
});

test("ikinci touch pointer aktif freehand taslağını iptal eder; yarım stroke commit edilmez", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Touch pointer lifecycle mobile-chromium projesinde doğrulanır.");
  const { host, viewport, center } = await openViewer(page);
  await page.getByTestId("cad-tool-stroke").click();
  const first = { x: center.x - 50, y: center.y - 25 };
  const moved = { x: center.x + 25, y: center.y + 35 };
  await dispatchTouchPointer(viewport, "pointerdown", first, 91, true);
  await dispatchTouchPointer(viewport, "pointermove", moved, 91, true);
  const draft = page.locator('[data-cad-review-overlay] [data-review-type="stroke"]');
  await expect(draft).toBeAttached();

  const second = { x: center.x + 80, y: center.y - 35 };
  await dispatchTouchPointer(viewport, "pointerdown", second, 92, false);
  await expect(draft).toHaveCount(0);
  await dispatchTouchPointer(viewport, "pointerup", moved, 91, true);
  await dispatchTouchPointer(viewport, "pointerup", second, 92, false);
  await expect(page.locator('[data-review-type="stroke"]')).toHaveCount(0);
  await expect(host).toHaveAttribute("data-cad-upstream-state", "ready");
});

test("sabit açıklıklı iki parmak pan kamerayı taşır; zoom değişmez", async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== "chromium" || testInfo.project.name !== "mobile-chromium", "Trusted multi-touch injection mobile-chromium/CDP kapısında çalıştırılır.");
  const { host, center } = await openViewer(page);
  const cameraBefore = await page.evaluate(() => {
    const adapter = (window as WindowWithCadAdapter).__cadAdapter;
    const view = adapter?.manager?.curView?.activeLayoutView;
    const target = view?._cameraControls?.target;
    const position = view?._cameraControls?.object?.position;
    return {
      zoom: view?._cameraControls?.object?.zoom ?? null,
      center: target ? { x: target.x, y: target.y } : null,
      position: position ? { x: position.x, y: position.y, z: position.z } : null,
    };
  });
  const client = await page.context().newCDPSession(page);
  const start = [
    { x: Math.round(center.x - 40), y: Math.round(center.y), radiusX: 1, radiusY: 1, force: 1, id: 1 },
    { x: Math.round(center.x + 40), y: Math.round(center.y), radiusX: 1, radiusY: 1, force: 1, id: 2 },
  ];
  const moved = start.map((point) => ({ ...point, x: point.x + 35, y: point.y + 25 }));
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start[0]] });
  await page.waitForTimeout(30);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start[1]] });
  await page.waitForTimeout(60);
  await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: moved });
  await page.waitForTimeout(100);
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [moved[0]] });
  await page.waitForTimeout(30);
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  const cameraAfter = await page.evaluate(() => {
    const adapter = (window as WindowWithCadAdapter).__cadAdapter;
    const view = adapter?.manager?.curView?.activeLayoutView;
    const target = view?._cameraControls?.target;
    const position = view?._cameraControls?.object?.position;
    return {
      zoom: view?._cameraControls?.object?.zoom ?? null,
      center: target ? { x: target.x, y: target.y } : null,
      position: position ? { x: position.x, y: position.y, z: position.z } : null,
    };
  });
  await test.info().attach("cad-two-finger-pan-camera.json", {
    body: JSON.stringify({ profile: "Pixel 7 (Chromium emulation)", gesture: { translationCssPx: { x: 35, y: 25 }, spanChangeCssPx: 0 }, cameraBefore, cameraAfter }, null, 2),
    contentType: "application/json",
  });
  if (cameraBefore.zoom === null || cameraAfter.zoom === null || !cameraBefore.center || !cameraAfter.center) {
    throw new Error("CAD camera snapshot is incomplete for the two-finger pan assertion");
  }
  expect(cameraAfter.zoom).toBeCloseTo(cameraBefore.zoom, 8);
  expect(Math.hypot(cameraAfter.center.x - cameraBefore.center.x, cameraAfter.center.y - cameraBefore.center.y)).toBeGreaterThan(0.01);
  console.log("[CAD TWO-FINGER PAN PASS]", JSON.stringify({ zoomBefore: cameraBefore.zoom, zoomAfter: cameraAfter.zoom, centerBefore: cameraBefore.center, centerAfter: cameraAfter.center }));
  await expect(host).toHaveAttribute("data-cad-upstream-state", "ready");
});

test("iki-parmak pinch gerçek OrbitControls kamerada doğal hızda zoom yapar ve pinch merkezini korur", async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== "chromium" || testInfo.project.name !== "mobile-chromium", "Trusted multi-touch injection mobile-chromium/CDP kapısında çalıştırılır.");

  const { host, viewport, center } = await openViewer(page);
  await setSnapMaster(page, false);
  await expect(host).toHaveAttribute("data-cad-snap-enabled", "false");
  await startDistance(page, host);

  await longPressUntilTracking(page, viewport, host, center, 81, "tracking-first");
  await dispatchTouchPointer(viewport, "pointerup", center, 81);
  await expect(host).toHaveAttribute("data-cad-distance-phase", "awaiting-second");

  const rawSecond = { x: center.x + 90, y: center.y };
  await longPressUntilTracking(page, viewport, host, rawSecond, 82, "tracking-second");
  await dispatchTouchPointer(viewport, "pointerup", rawSecond, 82);
  await expect(host).toHaveAttribute("data-cad-active-tool", "none");

  const before = await completedLineGeometry(page);
  expect(before.length).toBeGreaterThan(70);
  expect(before.length).toBeLessThan(110);
  const lineWorldBefore = await page.evaluate(({ line }) => {
    const adapter = (window as WindowWithCadAdapter).__cadAdapter;
    if (!adapter) throw new Error("CAD adapter unavailable for world projection");
    return {
      start: adapter.screenToWorldPoint({ x: line.x1, y: line.y1 }),
      end: adapter.screenToWorldPoint({ x: line.x2, y: line.y2 }),
    };
  }, { line: before });

  const viewportBox = await viewport.boundingBox();
  if (!viewportBox) throw new Error("CAD viewport ölçülemedi");
  const cameraSnapshot = (point: Point) => page.evaluate(({ x, y }) => {
    const adapter = (window as WindowWithCadAdapter).__cadAdapter;
    const view = adapter?.manager?.curView?.activeLayoutView;
    const controls = view?._cameraControls;
    const camera = controls?.object;
    const target = controls?.target;
    return {
      zoom: camera?.zoom ?? null,
      position: camera?.position ? { x: camera.position.x, y: camera.position.y, z: camera.position.z } : null,
      target: target ? { x: target.x, y: target.y, z: target.z } : null,
      centerWorld: adapter?.screenToWorldPoint?.({ x, y }) ?? null,
      originScreen: adapter?.projectWorldPoint?.({ x: 0, y: 0 }) ?? null,
      viewKeys: view ? Object.keys(view).filter((key) => key.includes("camera") || key.includes("Camera")) : [],
      controlKeys: controls ? Object.keys(controls).filter((key) => ["object", "target", "enabled", "enableZoom", "enablePan", "touches", "state", "_pointers"].includes(key)) : [],
    };
  }, { x: point.x - viewportBox.x, y: point.y - viewportBox.y });
  await page.evaluate(() => {
    const viewport = document.querySelector('[data-cad-upstream-host="true"] [aria-label$="CAD görünümü"]');
    if (!viewport) throw new Error("CAD viewport event target not found");
    const events: Array<Record<string, unknown>> = [];
    (window as unknown as { __cadPinchTrace?: Array<Record<string, unknown>> }).__cadPinchTrace = events;
    for (const type of ["touchstart", "touchmove", "touchend", "pointerdown", "pointermove", "pointerup", "pointercancel", "lostpointercapture"]) {
      document.addEventListener(type, (event) => {
        const pointer = event as PointerEvent;
        const touch = event as TouchEvent;
      const target = event.target as Element;
      const path: Array<{ tag: string; testId: string | null; touchAction: string }> = [];
      let current: Element | null = target;
      while (current && current !== viewport) {
        path.push({ tag: current.tagName, testId: current.getAttribute("data-testid"), touchAction: getComputedStyle(current).touchAction });
        current = current.parentElement;
      }
        events.push({
          phase: "capture", type, target: target?.tagName, path,
          pointerId: pointer.pointerId, pointerType: pointer.pointerType,
          touches: touch.touches?.length, changedTouches: touch.changedTouches?.length,
          cancelable: event.cancelable, defaultPrevented: event.defaultPrevented,
        });
      }, { capture: true, passive: true });
      document.addEventListener(type, (event) => {
        const pointer = event as PointerEvent;
        events.push({ phase: "bubble", type, pointerId: pointer.pointerId, pointerType: pointer.pointerType, defaultPrevented: event.defaultPrevented });
      }, { passive: true });
    }
  });
  const cameraBefore = await cameraSnapshot(center);

  const client = await page.context().newCDPSession(page);
  const startTouches = [
    { x: Math.round(center.x - 40), y: Math.round(center.y), radiusX: 1, radiusY: 1, force: 1, id: 1 },
    { x: Math.round(center.x + 40), y: Math.round(center.y), radiusX: 1, radiusY: 1, force: 1, id: 2 },
  ];
  const movedTouches = [
    { x: Math.round(center.x - 60), y: Math.round(center.y), radiusX: 1, radiusY: 1, force: 1, id: 1 },
    { x: Math.round(center.x + 60), y: Math.round(center.y), radiusX: 1, radiusY: 1, force: 1, id: 2 },
  ];

  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [startTouches[0]] });
  await page.waitForTimeout(30);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [startTouches[1]] });
  await page.waitForTimeout(60);
  await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: movedTouches });
  await page.waitForTimeout(120);
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [movedTouches[0]] });
  await page.waitForTimeout(30);
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(100);

  const cameraAfter = await cameraSnapshot(center);
  if (cameraBefore.zoom === null || cameraAfter.zoom === null) throw new Error("CAD camera zoom snapshot is missing after pinch");
  const pinchTrace = await page.evaluate(() => (window as unknown as { __cadPinchTrace?: Array<Record<string, unknown>> }).__cadPinchTrace ?? []);
  await test.info().attach("cad-pinch-input-trace-pixel7.json", {
    body: JSON.stringify({ cameraBefore, cameraAfter, pinchTrace }, null, 2),
    contentType: "application/json",
  });

  try {
    await expect.poll(async () => (await completedLineGeometry(page)).length, {
      timeout: 2_000,
    }).toBeGreaterThan(before.length * 1.1);
  } catch (error) {
    const observed = await completedLineGeometry(page);
    console.error("[CAD PINCH REPRO]", JSON.stringify({
      before,
      observed,
      zoomRatio: observed.length / before.length,
      anchorDriftPx: Math.hypot(observed.x1 - before.x1, observed.y1 - before.y1),
    }));
    throw error;
  }

  const after = await completedLineGeometry(page);
  const zoomRatio = after.length / before.length;
  expect(zoomRatio).toBeGreaterThan(1.15);
  expect(zoomRatio).toBeLessThan(2.25);

  const measuredCamera = await page.evaluate(({ world }) => {
    const adapter = (window as WindowWithCadAdapter).__cadAdapter;
    if (!adapter) throw new Error("CAD adapter unavailable for world projection");
    return { start: adapter.projectWorldPoint(world.start), end: adapter.projectWorldPoint(world.end) };
  }, { world: lineWorldBefore });
  expect(Math.hypot(measuredCamera.start.x - after.x1, measuredCamera.start.y - after.y1)).toBeLessThan(1);
  expect(Math.hypot(measuredCamera.end.x - after.x2, measuredCamera.end.y - after.y2)).toBeLessThan(1);
  expect(cameraAfter.zoom).toBeGreaterThan(cameraBefore.zoom);
  expect(cameraAfter.zoom / cameraBefore.zoom).toBeGreaterThan(1.15);
  expect(cameraAfter.zoom / cameraBefore.zoom).toBeLessThan(2.25);
  const forwardedTouchDown = pinchTrace.find((entry) => entry.type === "pointerdown" && entry.target === "CANVAS" && entry.cancelable === false);
  expect(forwardedTouchDown).toBeTruthy();
  const reviewTouchStart = pinchTrace.find((entry) => entry.type === "touchstart" && entry.target === "line");
  expect(reviewTouchStart).toBeTruthy();
  expect(JSON.stringify(reviewTouchStart?.path)).toContain('"touchAction":"none"');

  const anchorDriftPx = Math.hypot(after.x1 - before.x1, after.y1 - before.y1);
  expect(anchorDriftPx).toBeLessThan(8);
  await expect(host).toHaveAttribute("data-cad-upstream-state", "ready");

  const browser = page.context().browser();
  if (!browser) throw new Error("İkinci mobil emülasyon için Chromium oturumu bulunamadı");
  const phoneContext = await browser.newContext({
    ...devices["iPhone 13"],
    baseURL: new URL(page.url()).origin,
  });
  try {
    const phonePage = await phoneContext.newPage();
    const phoneViewer = await openViewer(phonePage);
    await setSnapMaster(phonePage, false);
    await startDistance(phonePage, phoneViewer.host);
    await longPressUntilTracking(phonePage, phoneViewer.viewport, phoneViewer.host, phoneViewer.center, 101, "tracking-first");
    await dispatchTouchPointer(phoneViewer.viewport, "pointerup", phoneViewer.center, 101);
    await expect(phoneViewer.host).toHaveAttribute("data-cad-distance-phase", "awaiting-second");
    const phoneSecond = { x: phoneViewer.center.x + 90, y: phoneViewer.center.y };
    await longPressUntilTracking(phonePage, phoneViewer.viewport, phoneViewer.host, phoneSecond, 102, "tracking-second");
    await dispatchTouchPointer(phoneViewer.viewport, "pointerup", phoneSecond, 102);
    await expect(phoneViewer.host).toHaveAttribute("data-cad-active-tool", "none");

    const phoneBeforeLine = await completedLineGeometry(phonePage);
    const phoneWorldBefore = await phonePage.evaluate(({ line }) => {
      const adapter = (window as WindowWithCadAdapter).__cadAdapter;
      if (!adapter) throw new Error("CAD adapter unavailable for world projection");
      return {
        start: adapter.screenToWorldPoint({ x: line.x1, y: line.y1 }),
        end: adapter.screenToWorldPoint({ x: line.x2, y: line.y2 }),
      };
    }, { line: phoneBeforeLine });
    const phoneCameraBefore = await phonePage.evaluate(() => {
      const adapter = (window as WindowWithCadAdapter).__cadAdapter;
      return adapter?.manager?.curView?.activeLayoutView?._cameraControls?.object?.zoom ?? null;
    });
    await phonePage.evaluate(() => {
      const events: Array<Record<string, unknown>> = [];
      (window as unknown as { __cadPinchTrace?: Array<Record<string, unknown>> }).__cadPinchTrace = events;
      for (const type of ["touchstart", "touchmove", "touchend", "pointerdown", "pointermove", "pointerup", "pointercancel", "lostpointercapture"]) {
        document.addEventListener(type, (event) => {
          const target = event.target as Element;
          const path: Array<{ tag: string; testId: string | null; touchAction: string }> = [];
          let current: Element | null = target;
          while (current) {
            path.push({ tag: current.tagName, testId: current.getAttribute("data-testid"), touchAction: getComputedStyle(current).touchAction });
            current = current.parentElement;
          }
          events.push({ phase: "capture", type, target: target?.tagName, path, pointerId: (event as PointerEvent).pointerId, pointerType: (event as PointerEvent).pointerType, touches: (event as TouchEvent).touches?.length, changedTouches: (event as TouchEvent).changedTouches?.length });
        }, { capture: true, passive: true });
      }
    });
    const phoneClient = await phoneContext.newCDPSession(phonePage);
    const phoneStart = [
      { x: Math.round(phoneViewer.center.x - 40), y: Math.round(phoneViewer.center.y), radiusX: 1, radiusY: 1, force: 1, id: 11 },
      { x: Math.round(phoneViewer.center.x + 40), y: Math.round(phoneViewer.center.y), radiusX: 1, radiusY: 1, force: 1, id: 12 },
    ];
    const phoneMove = [
      { x: Math.round(phoneViewer.center.x - 60), y: Math.round(phoneViewer.center.y), radiusX: 1, radiusY: 1, force: 1, id: 11 },
      { x: Math.round(phoneViewer.center.x + 60), y: Math.round(phoneViewer.center.y), radiusX: 1, radiusY: 1, force: 1, id: 12 },
    ];
    await phoneClient.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [phoneStart[0]] });
    await phonePage.waitForTimeout(30);
    await phoneClient.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [phoneStart[1]] });
    await phonePage.waitForTimeout(60);
    await phoneClient.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: phoneMove });
    await phonePage.waitForTimeout(120);
    await phoneClient.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [phoneMove[0]] });
    await phonePage.waitForTimeout(30);
    await phoneClient.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await phonePage.waitForTimeout(100);

    const phoneAfterLine = await completedLineGeometry(phonePage);
    const phoneCameraAfter = await phonePage.evaluate(() => {
      const adapter = (window as WindowWithCadAdapter).__cadAdapter;
      return adapter?.manager?.curView?.activeLayoutView?._cameraControls?.object?.zoom ?? null;
    });
    const phoneProjected = await phonePage.evaluate(({ world }) => {
      const adapter = (window as WindowWithCadAdapter).__cadAdapter;
      if (!adapter) throw new Error("CAD adapter unavailable for world projection");
      return { start: adapter.projectWorldPoint(world.start), end: adapter.projectWorldPoint(world.end) };
    }, { world: phoneWorldBefore });
    const phoneTrace = await phonePage.evaluate(() => (window as unknown as { __cadPinchTrace?: Array<Record<string, unknown>> }).__cadPinchTrace ?? []);
    if (phoneCameraBefore === null || phoneCameraAfter === null) throw new Error("iPhone profile camera zoom snapshot is missing after pinch");
    expect(phoneCameraAfter).toBeGreaterThan(phoneCameraBefore);
    expect(phoneCameraAfter / phoneCameraBefore).toBeGreaterThan(1.15);
    expect(phoneCameraAfter / phoneCameraBefore).toBeLessThan(2.25);
    expect(phoneAfterLine.length / phoneBeforeLine.length).toBeGreaterThan(1.1);
    expect(Math.hypot(phoneAfterLine.x1 - phoneBeforeLine.x1, phoneAfterLine.y1 - phoneBeforeLine.y1)).toBeLessThan(8);
    expect(Math.hypot(phoneProjected.start.x - phoneAfterLine.x1, phoneProjected.start.y - phoneAfterLine.y1)).toBeLessThan(1);
    expect(Math.hypot(phoneProjected.end.x - phoneAfterLine.x2, phoneProjected.end.y - phoneAfterLine.y2)).toBeLessThan(1);
    await test.info().attach("cad-pinch-input-trace-iphone13.json", {
      body: JSON.stringify({ profile: "iPhone 13 (Chromium emulation)", cameraBefore: phoneCameraBefore, cameraAfter: phoneCameraAfter, lineBefore: phoneBeforeLine, lineAfter: phoneAfterLine, pinchTrace: phoneTrace }, null, 2),
      contentType: "application/json",
    });
    console.log("[CAD PINCH PROFILE PASS]", JSON.stringify({ pixel7: { zoomBefore: cameraBefore.zoom, zoomAfter: cameraAfter.zoom, lineBefore: before.length, lineAfter: after.length }, iphone13: { zoomBefore: phoneCameraBefore, zoomAfter: phoneCameraAfter, lineBefore: phoneBeforeLine.length, lineAfter: phoneAfterLine.length } }));
  } finally {
    await phoneContext.close();
  }
});

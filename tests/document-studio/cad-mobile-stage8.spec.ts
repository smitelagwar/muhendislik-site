import { expect, test, type Locator, type Page } from "@playwright/test";

const SNAP_MODES = [
  "endpoint",
  "midpoint",
  "intersection",
  "center",
  "nearest",
] as const;
type SnapMode = (typeof SNAP_MODES)[number];

type Point = { x: number; y: number };
type ViewerHarness = {
  host: Locator;
  viewport: Locator;
  center: Point;
};

function createPrecisionFixture(): string {
  const entityLine = (x1: number, y1: number, x2: number, y2: number) => [
    "0", "LINE", "8", "KALIP",
    "10", String(x1), "20", String(y1),
    "11", String(x2), "21", String(y2),
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
    "0", "CIRCLE", "8", "KALIP", "10", "0", "20", "0", "40", "100",
    "0", "ENDSEC", "0", "EOF",
  ].join("\n");
}

async function signIn(page: Page): Promise<void> {
  await page.goto("/dokumantasyon");
  const username = page.locator("input#username");
  const dashboard = page.getByRole("button", { name: "Yeni Dosya Yükle" });

  await expect.poll(async () => {
    if (await username.isVisible()) return "login";
    if (await dashboard.isVisible()) return "dashboard";
    return "pending";
  }, { timeout: 12_000 }).not.toBe("pending");

  if (await username.isVisible()) {
    await username.fill("admin");
    await page.locator("input#password").fill("admin");
    await page.getByRole("button", { name: "Giriş Yap" }).click();
  }
  await expect(dashboard).toBeVisible();
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

  for (const candidate of SNAP_MODES) {
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
  await page.waitForTimeout(300);
  await expect(host).toHaveAttribute(
    "data-cad-distance-phase",
    phase === "tracking-first" ? "pressing-first" : "pressing-second"
  );
  await expect(page.getByTestId("cad-precision-magnifier")).toHaveCount(0);
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
  await expect(line).toBeVisible();
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
  await expect(page.locator('[data-cad-offset-guide="true"]')).toBeVisible();
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

test("ikinci parmak pending long-press ölçümünü iptal eder ve CAD görünümü hazır kalır", async ({ page }) => {
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

test("iki-parmak pinch gerçek OrbitControls kamerada doğal hızda zoom yapar ve pinch merkezini korur", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Trusted multi-touch injection yalnız Chromium/CDP kapısında çalıştırılır.");

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

  const client = await page.context().newCDPSession(page);
  const startTouches = [
    { x: Math.round(center.x - 40), y: Math.round(center.y), radiusX: 1, radiusY: 1, force: 1, id: 1 },
    { x: Math.round(center.x + 40), y: Math.round(center.y), radiusX: 1, radiusY: 1, force: 1, id: 2 },
  ];
  const movedTouches = [
    { x: Math.round(center.x - 60), y: Math.round(center.y), radiusX: 1, radiusY: 1, force: 1, id: 1 },
    { x: Math.round(center.x + 60), y: Math.round(center.y), radiusX: 1, radiusY: 1, force: 1, id: 2 },
  ];

  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: startTouches });
  await page.waitForTimeout(60);
  await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: movedTouches });
  await page.waitForTimeout(120);
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });

  await expect.poll(async () => (await completedLineGeometry(page)).length, {
    timeout: 2_000,
  }).toBeGreaterThan(before.length * 1.1);

  const after = await completedLineGeometry(page);
  const zoomRatio = after.length / before.length;
  expect(zoomRatio).toBeGreaterThan(1.15);
  expect(zoomRatio).toBeLessThan(2.25);

  const anchorDriftPx = Math.hypot(after.x1 - before.x1, after.y1 - before.y1);
  expect(anchorDriftPx).toBeLessThan(8);
  await expect(host).toHaveAttribute("data-cad-upstream-state", "ready");
});

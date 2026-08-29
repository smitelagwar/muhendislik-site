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

function createGeometryFixture(): string {
  let handle = 0x20;
  const nextHandle = () => (handle++).toString(16).toUpperCase();
  const line = (x1: number, y1: number, x2: number, y2: number) => [
    "0", "LINE", "5", nextHandle(),
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
    ...line(-500, -500, 500, -500),
    ...line(500, -500, 500, 500),
    ...line(500, 500, -500, 500),
    ...line(-500, 500, -500, -500),
    ...line(-300, 0, 300, 0),
    ...line(0, -300, 0, 300),
    ...line(0, 0, 260, 260),
    "0", "CIRCLE", "5", nextHandle(),
    "100", "AcDbEntity", "8", "KALIP",
    "100", "AcDbCircle",
    "10", "0", "20", "0", "30", "0", "40", "100",
    "0", "ENDSEC", "0", "EOF",
  ].join("\n");
}

async function ensureAdminSession(page: Page): Promise<void> {
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

async function openViewer(page: Page): Promise<{
  host: Locator;
  viewport: Locator;
  center: Point;
}> {
  await ensureAdminSession(page);
  const fixture = createGeometryFixture();
  const fileId = await page.evaluate(async ({ content }) => {
    const formData = new FormData();
    formData.append(
      "file",
      new File([content], "stage8-mobile-geometry.dxf", {
        type: "application/dxf",
      })
    );
    formData.append("pathname", `cad-stage8-geometry-${crypto.randomUUID()}.dxf`);
    const response = await fetch("/api/dokumantasyon/upload/local", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();
    if (!response.ok || !payload.file?.id) {
      throw new Error(payload.error || "Stage 8 AC1027 DXF fixture yüklenemedi");
    }
    return payload.file.id as string;
  }, { content: fixture });

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
  await expect(viewport.locator("canvas").first()).toBeVisible();
  await page.getByTestId("cad-tool-fit").click();
  await page.waitForTimeout(180);
  const box = await viewport.boundingBox();
  if (!box) throw new Error("Stage 8 CAD viewport ölçülemedi");

  return {
    host,
    viewport,
    center: { x: box.x + box.width / 2, y: box.y + box.height / 2 },
  };
}

async function dispatchTouch(
  target: Locator,
  type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel",
  point: Point,
  pointerId: number
): Promise<void> {
  const released = type === "pointerup" || type === "pointercancel";
  await target.dispatchEvent(type, {
    pointerId,
    pointerType: "touch",
    isPrimary: true,
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

async function setOnlySnapMode(page: Page, mode: SnapMode): Promise<void> {
  await page.getByTestId("cad-tool-snap-settings").click();
  const panel = page.getByTestId("cad-snap-settings-panel");
  await expect(panel).toBeVisible();
  const master = panel.getByTestId("cad-snap-master-toggle");
  if ((await master.getAttribute("aria-checked")) !== "true") await master.click();

  for (const candidate of SNAP_MODES) {
    const toggle = panel.getByTestId(`cad-snap-mode-${candidate}`);
    const enabled = candidate === mode;
    if ((await toggle.getAttribute("aria-checked")) !== String(enabled)) {
      await toggle.click();
    }
    await expect(toggle).toHaveAttribute("aria-checked", String(enabled));
  }
  await panel.getByRole("button", { name: "Nesne yakalama ayarlarını kapat" }).click();
}

async function setSnapMaster(page: Page, enabled: boolean): Promise<void> {
  await page.getByTestId("cad-tool-snap-settings").click();
  const panel = page.getByTestId("cad-snap-settings-panel");
  const master = panel.getByTestId("cad-snap-master-toggle");
  if ((await master.getAttribute("aria-checked")) !== String(enabled)) await master.click();
  await expect(master).toHaveAttribute("aria-checked", String(enabled));
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

async function longPress(
  page: Page,
  viewport: Locator,
  host: Locator,
  point: Point,
  pointerId: number,
  phase: "tracking-first" | "tracking-second"
): Promise<void> {
  await dispatchTouch(viewport, "pointerdown", point, pointerId);
  await page.waitForTimeout(300);
  await expect(host).toHaveAttribute(
    "data-cad-distance-phase",
    phase === "tracking-first" ? "pressing-first" : "pressing-second"
  );
  await expect(page.getByTestId("cad-precision-magnifier")).toHaveCount(0);
  await expect(host).toHaveAttribute("data-cad-distance-phase", phase, {
    timeout: 1_100,
  });
  await expect(page.getByTestId("cad-precision-magnifier")).toBeVisible();
}

test("Stage 8 geometry: beş snap modu gerçek CAD runtime üzerinde çözülür ve kalıcıdır", async ({ page }) => {
  const { host, viewport, center } = await openViewer(page);
  let pointerId = 101;

  for (const mode of SNAP_MODES) {
    await setOnlySnapMode(page, mode);
    await expect(host).toHaveAttribute("data-cad-snap-modes", mode);
    await startDistance(page, host);
    await longPress(page, viewport, host, center, pointerId, "tracking-first");
    await expect(page.getByTestId("cad-snap-label")).toHaveAttribute(
      "data-cad-snap-label",
      mode
    );
    await expect(page.locator("[data-cad-magnifier-snap-label]")).toHaveAttribute(
      "data-cad-magnifier-snap-label",
      mode
    );
    await dispatchTouch(viewport, "pointercancel", center, pointerId);
    await cancelDistance(page, host);
    pointerId += 1;
  }

  await page.reload();
  const reloadedHost = page.locator('[data-cad-upstream-host="true"]').first();
  await expect(reloadedHost).toHaveAttribute("data-cad-upstream-state", "ready", {
    timeout: 30_000,
  });
  await expect(reloadedHost).toHaveAttribute("data-cad-snap-modes", "nearest");
});

test("Stage 8 geometry: intersection long-press precision UX ve iki nokta commit birlikte çalışır", async ({ page }) => {
  const { host, viewport, center } = await openViewer(page);
  await setOnlySnapMode(page, "intersection");
  await startDistance(page, host);

  await longPress(page, viewport, host, center, 121, "tracking-first");
  await expect(page.getByTestId("cad-snap-label")).toHaveAttribute(
    "data-cad-snap-label",
    "intersection"
  );

  const lens = page.getByTestId("cad-precision-magnifier");
  const [lensBox, viewportBox] = await Promise.all([lens.boundingBox(), viewport.boundingBox()]);
  if (!lensBox || !viewportBox) throw new Error("Stage 8 büyüteç/viewport ölçülemedi");
  expect(lensBox.x).toBeGreaterThanOrEqual(viewportBox.x - 1);
  expect(lensBox.y).toBeGreaterThanOrEqual(viewportBox.y - 1);
  expect(lensBox.x + lensBox.width).toBeLessThanOrEqual(viewportBox.x + viewportBox.width + 1);
  expect(lensBox.y + lensBox.height).toBeLessThanOrEqual(viewportBox.y + viewportBox.height + 1);

  const offset = { x: center.x + 10, y: center.y };
  await dispatchTouch(viewport, "pointermove", offset, 121);
  await expect(page.locator('[data-cad-offset-guide="true"]')).toBeAttached();
  await dispatchTouch(viewport, "pointerup", offset, 121);
  await expect(host).toHaveAttribute("data-cad-distance-phase", "awaiting-second");
  await expect(page.getByTestId("cad-precision-magnifier")).toHaveCount(0);

  await setSnapMaster(page, false);
  const second = { x: center.x + 125, y: center.y + 55 };
  await longPress(page, viewport, host, second, 122, "tracking-second");
  await expect(page.locator('[data-cad-distance-rubber-band="true"]')).toBeAttached();
  const end = { x: second.x + 15, y: second.y + 5 };
  await dispatchTouch(viewport, "pointermove", end, 122);
  await dispatchTouch(viewport, "pointerup", end, 122);

  await expect(host).toHaveAttribute("data-cad-active-tool", "none");
  const complete = page.locator('[data-cad-distance-complete="true"]');
  await expect(complete).toHaveCount(1);
  const line = complete.locator("line").first();
  await expect(line).toBeAttached();
  const length = await line.evaluate((node) => {
    const element = node as SVGLineElement;
    return Math.hypot(
      Number(element.getAttribute("x2")) - Number(element.getAttribute("x1")),
      Number(element.getAttribute("y2")) - Number(element.getAttribute("y1"))
    );
  });
  expect(length).toBeGreaterThan(50);
});

import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const DXF_FIXTURE_DIR = path.resolve(process.cwd(), "tests", "fixtures", "dxf");

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

async function uploadFixture(page: Page): Promise<string> {
  const fixtureName = "stage4-layer-interaction.dxf";
  const buffer = await readFile(path.join(DXF_FIXTURE_DIR, fixtureName));
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
    await attach(page, testInfo, "dxf-layers-mobile.png");
  });
});

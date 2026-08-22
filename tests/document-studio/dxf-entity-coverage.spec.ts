import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const DXF_FIXTURE_DIR = path.resolve(process.cwd(), "tests", "fixtures", "dxf");
const FIXTURE = "stage6-entity-coverage.dxf";
const ENTITY_LAYERS = [
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
}

async function uploadFixture(page: Page): Promise<string> {
  const buffer = await readFile(path.join(DXF_FIXTURE_DIR, FIXTURE));
  const response = await page.request.post("/api/dokumantasyon/upload/local", {
    multipart: {
      file: { name: `coverage-${FIXTURE}`, mimeType: "application/dxf", buffer },
      pathname: `dok_storage/dxf-coverage-${Date.now()}-${Math.random().toString(36).slice(2)}-${FIXTURE}`,
    },
  });
  const payload = await response.json();
  expect(response.ok(), payload.error || "DXF entity coverage upload failed").toBeTruthy();
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

function assertFiniteBounds(bounds: LayerSnapshot["visibleBounds"], entityLayer: string) {
  expect(bounds, `${entityLayer} should contribute renderer bounds`).not.toBeNull();
  const values = [bounds!.minX, bounds!.maxX, bounds!.minY, bounds!.maxY];
  expect(values.every(Number.isFinite), `${entityLayer} renderer bounds must be finite`).toBe(true);
  const span = bounds!.maxX - bounds!.minX + bounds!.maxY - bounds!.minY;
  expect(span, `${entityLayer} should produce non-degenerate renderer geometry`).toBeGreaterThan(0);
}

async function attach(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, {
    body: await page.screenshot({ animations: "disabled" }),
    contentType: "image/png",
  });
}

test.describe("DXF Stage 6 entity coverage", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Entity/WebGL fidelity gate runs in Chromium.");

  test("each verified or conditionally accepted geometry type produces isolated renderer bounds", async ({ page }, testInfo) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1280, height: 820 });
    await login(page);
    const fileId = await uploadFixture(page);
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

    for (const layer of ENTITY_LAYERS) {
      const toggle = page.getByTestId(`cad-dxf-layer-${layer}`);
      await expect(toggle).toBeVisible();
      await toggle.click();

      const isolated = await layerSnapshot(page);
      expect(isolated.visibleLayerNames, `${layer} must be the only visible entity layer`).toEqual([layer]);
      assertFiniteBounds(isolated.visibleBounds, layer);

      await page.getByRole("button", { name: "Sığdır" }).click();
      await expect.poll(async () => (await runtimeSnapshot(page)).bounds, {
        message: `${layer} FitView must publish renderer bounds`,
      }).not.toBeNull();

      await toggle.click();
      expect((await layerSnapshot(page)).allHidden, `${layer} must be removable from the scene by layer visibility`).toBe(true);
    }

    await page.getByRole("button", { name: "Tümünü aç" }).click();
    const restored = await layerSnapshot(page);
    for (const layer of ENTITY_LAYERS) expect(restored.visibleLayerNames).toContain(layer);
    await attach(page, testInfo, "dxf-stage6-entity-coverage-restored.png");
  });
});

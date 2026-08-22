import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const DXF_FIXTURE_DIR = path.resolve(process.cwd(), "tests", "fixtures", "dxf");
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

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

async function uploadDxf(page: Page, fixtureName: string): Promise<string> {
  const buffer = await readFile(path.join(DXF_FIXTURE_DIR, fixtureName));
  const response = await page.request.post("/api/dokumantasyon/upload/local", {
    multipart: {
      file: {
        name: `release-${fixtureName}`,
        mimeType: "application/dxf",
        buffer,
      },
      pathname: `dok_storage/dxf-release-${Date.now()}-${Math.random().toString(36).slice(2)}-${fixtureName}`,
    },
  });
  const payload = await response.json();
  expect(response.ok(), payload.error || `DXF upload failed for ${fixtureName}`).toBeTruthy();
  expect(payload.file?.id, `DXF upload returned no file id for ${fixtureName}`).toBeTruthy();
  return payload.file.id as string;
}

async function openDxf(page: Page, fileId: string) {
  await page.goto(`/dokumantasyon/dosya/${fileId}`);
  await expect(page.getByTestId("cad-dxf-viewer")).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  const geometry = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(geometry.scrollWidth, "DXF page-level horizontal overflow").toBeLessThanOrEqual(geometry.clientWidth);
}

async function expectRenderableCanvas(page: Page) {
  const canvasHost = page.getByTestId("cad-dxf-canvas");
  await expect(canvasHost).toBeVisible();
  const canvas = canvasHost.locator("canvas").first();
  await expect(canvas).toBeVisible();
  await expect.poll(async () => canvas.evaluate((element) => ({
    width: (element as HTMLCanvasElement).width,
    height: (element as HTMLCanvasElement).height,
  }))).toMatchObject({ width: expect.any(Number), height: expect.any(Number) });
  const size = await canvas.evaluate((element) => ({
    width: (element as HTMLCanvasElement).width,
    height: (element as HTMLCanvasElement).height,
  }));
  expect(size.width).toBeGreaterThan(100);
  expect(size.height).toBeGreaterThan(100);
  await expect(page.getByRole("heading", { name: "DXF açılamadı" })).toBeHidden();
}

async function attachEvidence(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, {
    body: await page.screenshot({ animations: "disabled" }),
    contentType: "image/png",
  });
}

test.describe("DXF Stage 6 release fidelity gate", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "DXF WebGL release gate is deterministic in Chromium; cross-browser UI coverage remains in release.spec.ts.");

  test("clean and warning DXFs reach ready state with actionable diagnostics on desktop and mobile", async ({ page }, testInfo) => {
    test.setTimeout(150_000);
    await page.setViewportSize(DESKTOP);
    await login(page);

    const cleanId = await uploadDxf(page, "geometry-basic.dxf");
    await openDxf(page, cleanId);
    await expectRenderableCanvas(page);
    const cleanToggle = page.getByTestId("cad-dxf-diagnostics-toggle");
    await expect(cleanToggle).toContainText("Denetim temiz");
    await cleanToggle.click();
    await expect(page.getByTestId("cad-dxf-diagnostics-panel")).toBeVisible();
    await expect(page.getByTestId("cad-dxf-diagnostics-panel").locator('[data-severity="blocking"]')).toHaveCount(0);
    await attachEvidence(page, testInfo, "dxf-clean-desktop.png");

    await page.goto("/dokumantasyon");
    const geometryWarningId = await uploadDxf(page, "stage4-geometry-layers.dxf");
    await openDxf(page, geometryWarningId);
    await expectRenderableCanvas(page);
    const warningToggle = page.getByTestId("cad-dxf-diagnostics-toggle");
    await expect(warningToggle).toContainText("uyarı");
    await warningToggle.click();
    const warningPanel = page.getByTestId("cad-dxf-diagnostics-panel");
    await expect(warningPanel).toBeVisible();
    await expect(warningPanel).toContainText("Layer");
    await expect(warningPanel).toContainText("Geometri");
    await expect(warningPanel).toContainText("Görünüm");
    await expect(warningPanel.locator('[data-severity="blocking"]')).toHaveCount(0);
    const panelHeight = await warningPanel.evaluate((element) => element.getBoundingClientRect().height);
    expect(panelHeight).toBeLessThanOrEqual(DESKTOP.height * 0.38 + 4);
    await attachEvidence(page, testInfo, "dxf-warning-desktop.png");

    await page.setViewportSize(MOBILE);
    await expectNoHorizontalOverflow(page);
    await expect(warningPanel).toBeVisible();
    const mobilePanelHeight = await warningPanel.evaluate((element) => element.getBoundingClientRect().height);
    expect(mobilePanelHeight).toBeLessThanOrEqual(MOBILE.height * 0.38 + 4);
    await attachEvidence(page, testInfo, "dxf-warning-mobile.png");

    await page.goto("/dokumantasyon");
    const textId = await uploadDxf(page, "stage3-text-mtext.dxf");
    await openDxf(page, textId);
    await expectRenderableCanvas(page);
    const textToggle = page.getByTestId("cad-dxf-diagnostics-toggle");
    await expect(textToggle).toContainText("uyarı");
    await textToggle.click();
    await expect(page.getByTestId("cad-dxf-diagnostics-panel")).toContainText("Yazı");
  });

  test("known incomplete dimension, spline and hatch cases fail closed instead of reporting success", async ({ page }, testInfo) => {
    test.setTimeout(150_000);
    await page.setViewportSize(DESKTOP);
    await login(page);

    const dimensionId = await uploadDxf(page, "stage3-dimensions.dxf");
    await openDxf(page, dimensionId);
    await expect(page.getByRole("heading", { name: "DXF açılamadı" })).toBeVisible();
    await expect(page.getByText(/fidelity engeli/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Orijinal dosyayı indir" })).toBeVisible();
    const dimensionPanel = page.getByTestId("cad-dxf-diagnostics-panel");
    await expect(dimensionPanel).toBeVisible();
    await expect(dimensionPanel.locator('[data-severity="blocking"]')).not.toHaveCount(0);
    await expect(dimensionPanel).toContainText("Ölçü");
    await attachEvidence(page, testInfo, "dxf-blocked-dimension.png");

    await page.goto("/dokumantasyon");
    const riskyGeometryId = await uploadDxf(page, "stage4-risky-geometry.dxf");
    await openDxf(page, riskyGeometryId);
    await expect(page.getByRole("heading", { name: "DXF açılamadı" })).toBeVisible();
    const riskyToggle = page.getByTestId("cad-dxf-diagnostics-toggle");
    await expect(riskyToggle).toContainText("engel");
    const riskyPanel = page.getByTestId("cad-dxf-diagnostics-panel");
    await expect(riskyPanel).toBeVisible();
    await expect(riskyPanel).toContainText("SPLINE");
    await expect(riskyPanel).toContainText("HATCH");
    await expect(riskyPanel.locator('[data-severity="blocking"]')).not.toHaveCount(0);
    await expect(page.getByRole("button", { name: "Orijinal dosyayı indir" })).toBeVisible();

    await page.setViewportSize(MOBILE);
    await expectNoHorizontalOverflow(page);
    await attachEvidence(page, testInfo, "dxf-blocked-geometry-mobile.png");
  });
});

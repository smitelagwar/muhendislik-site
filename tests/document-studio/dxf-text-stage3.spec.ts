import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const DXF_FIXTURE_DIR = path.resolve(process.cwd(), "tests", "fixtures", "dxf");

type RuntimeSnapshot = {
  bounds: { minX: number; maxX: number; minY: number; maxY: number } | null;
  origin: { x: number; y: number } | null;
};

type TextEvidence = {
  source: { renderCandidateTextRecords: number };
  parsed: { totalTextRecords: number } | null;
  parserLossCount: number;
  rendererMissingChars: boolean | null;
  fontProbes: Array<{ ok: boolean; status: number | null; bytes: number }>;
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

async function uploadDxf(page: Page, fixtureName: string): Promise<string> {
  const buffer = await readFile(path.join(DXF_FIXTURE_DIR, fixtureName));
  const response = await page.request.post("/api/dokumantasyon/upload/local", {
    multipart: {
      file: {
        name: `text-stage3-${fixtureName}`,
        mimeType: "application/dxf",
        buffer,
      },
      pathname: `dok_storage/dxf-text-stage3-${Date.now()}-${Math.random().toString(36).slice(2)}-${fixtureName}`,
    },
  });
  const payload = await response.json();
  expect(response.ok(), payload.error || `DXF upload failed for ${fixtureName}`).toBeTruthy();
  expect(payload.file?.id, `DXF upload returned no file id for ${fixtureName}`).toBeTruthy();
  return payload.file.id as string;
}

async function openReadyTextFixture(page: Page, fixtureName: string) {
  await page.goto("/dokumantasyon");
  const fileId = await uploadDxf(page, fixtureName);
  await page.goto(`/dokumantasyon/dosya/${fileId}`);
  await expect(page.getByTestId("cad-dxf-viewer")).toBeVisible();
  await expect(page.getByRole("heading", { name: "DXF açılamadı" })).toBeHidden();

  const snapshotOutput = page.getByTestId("cad-dxf-runtime-snapshot");
  await expect(snapshotOutput).toBeAttached({ timeout: 30_000 });
  const snapshot = JSON.parse((await snapshotOutput.textContent()) || "{}") as RuntimeSnapshot;
  expect(snapshot.bounds, `${fixtureName} should produce text bounds`).not.toBeNull();

  const textOutput = page.getByTestId("cad-dxf-text-render-evidence");
  await expect(textOutput).toBeAttached();
  const evidence = JSON.parse((await textOutput.textContent()) || "{}") as TextEvidence;
  expect(evidence.source.renderCandidateTextRecords).toBeGreaterThan(0);
  expect(evidence.parsed?.totalTextRecords).toBe(evidence.source.renderCandidateTextRecords);
  expect(evidence.parserLossCount).toBe(0);
  expect(evidence.rendererMissingChars).not.toBe(true);
  expect(evidence.fontProbes).toHaveLength(2);
  expect(evidence.fontProbes.every((font) => font.ok && font.status === 200 && font.bytes > 1024)).toBe(true);

  const bounds = snapshot.bounds!;
  return {
    spanX: bounds.maxX - bounds.minX,
    spanY: bounds.maxY - bounds.minY,
    centerX: (bounds.minX + bounds.maxX) / 2,
    centerY: (bounds.minY + bounds.maxY) / 2,
    snapshot,
    evidence,
  };
}

async function attachEvidence(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, {
    body: await page.screenshot({ animations: "disabled" }),
    contentType: "image/png",
  });
}

test.describe("DXF Text Stage 3 layout fidelity", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Worker/WebGL text layout gate runs in Chromium.");

  test("TEXT width factor and 90-degree rotation preserve measurable geometry", async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1200, height: 800 });
    await login(page);

    const base = await openReadyTextFixture(page, "stage3-layout-base.dxf");
    expect(base.spanX).toBeGreaterThan(5);
    expect(base.spanY).toBeGreaterThan(3);
    await attachEvidence(page, testInfo, "dxf-text-stage3-base.png");

    const wide = await openReadyTextFixture(page, "stage3-layout-wide.dxf");
    expect(wide.spanX / base.spanX).toBeGreaterThan(1.8);
    expect(wide.spanX / base.spanX).toBeLessThan(2.2);
    expect(wide.spanY / base.spanY).toBeGreaterThan(0.9);
    expect(wide.spanY / base.spanY).toBeLessThan(1.1);
    await attachEvidence(page, testInfo, "dxf-text-stage3-wide.png");

    const rotated = await openReadyTextFixture(page, "stage3-layout-rot90.dxf");
    expect(rotated.spanX / base.spanY).toBeGreaterThan(0.9);
    expect(rotated.spanX / base.spanY).toBeLessThan(1.1);
    expect(rotated.spanY / base.spanX).toBeGreaterThan(0.9);
    expect(rotated.spanY / base.spanX).toBeLessThan(1.1);
    await attachEvidence(page, testInfo, "dxf-text-stage3-rot90.png");
  });

  test("center/middle alignment uses the DXF second alignment point", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1200, height: 800 });
    await login(page);

    const centered = await openReadyTextFixture(page, "stage3-layout-center.dxf");
    expect(Math.abs(centered.centerX - 100)).toBeLessThan(1.5);
    expect(Math.abs(centered.centerY - 100)).toBeLessThan(1.5);
    await attachEvidence(page, testInfo, "dxf-text-stage3-centered.png");
  });

  test("multiline Turkish MTEXT keeps glyphs and paragraph geometry", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1200, height: 800 });
    await login(page);

    const mtext = await openReadyTextFixture(page, "stage3-layout-mtext-turkish.dxf");
    expect(mtext.evidence.source.renderCandidateTextRecords).toBe(1);
    expect(mtext.evidence.parsed?.totalTextRecords).toBe(1);
    expect(mtext.evidence.rendererMissingChars).toBe(false);
    expect(mtext.spanX).toBeGreaterThan(20);
    expect(mtext.spanY).toBeGreaterThan(10);
    await expect(page.getByTestId("cad-dxf-text-evidence")).toContainText("kaynak 1");
    await expect(page.getByTestId("cad-dxf-text-evidence")).toContainText("parser 1");
    await attachEvidence(page, testInfo, "dxf-text-stage3-mtext-turkish.png");
  });

  test("unsupported source text transforms fail closed", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1200, height: 800 });
    await login(page);

    await page.goto("/dokumantasyon");
    const fileId = await uploadDxf(page, "stage3-layout-invalid.dxf");
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    await expect(page.getByRole("heading", { name: "DXF açılamadı" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/oblique|generation flag|MTEXT/i).first()).toBeVisible();
    await expect(page.getByTestId("cad-dxf-runtime-snapshot")).toHaveCount(0);
    await expect(page.getByTestId("cad-dxf-diagnostics-toggle")).toContainText("engel");
    await attachEvidence(page, testInfo, "dxf-text-stage3-fail-closed.png");
  });
});

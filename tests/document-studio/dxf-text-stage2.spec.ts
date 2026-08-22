import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { readFile } from "node:fs/promises";
import path from "node:path";

const DXF_FIXTURE_DIR = path.resolve(process.cwd(), "tests", "fixtures", "dxf");

type RuntimeSnapshot = {
  bounds: { minX: number; maxX: number; minY: number; maxY: number } | null;
};

type TextEvidence = {
  source: { renderCandidateTextRecords: number };
  parsed: { totalTextRecords: number } | null;
  parserLossCount: number;
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
        name: `text-stage2-${fixtureName}`,
        mimeType: "application/dxf",
        buffer,
      },
      pathname: `dok_storage/dxf-text-stage2-${Date.now()}-${Math.random().toString(36).slice(2)}-${fixtureName}`,
    },
  });
  const payload = await response.json();
  expect(response.ok(), payload.error || `DXF upload failed for ${fixtureName}`).toBeTruthy();
  expect(payload.file?.id, `DXF upload returned no file id for ${fixtureName}`).toBeTruthy();
  return payload.file.id as string;
}

async function openTextOnlyFixture(page: Page, fixtureName: string) {
  await page.goto("/dokumantasyon");
  const fileId = await uploadDxf(page, fixtureName);
  await page.goto(`/dokumantasyon/dosya/${fileId}`);
  await expect(page.getByTestId("cad-dxf-viewer")).toBeVisible();
  await expect(page.getByRole("heading", { name: "DXF açılamadı" })).toBeHidden();

  const snapshotOutput = page.getByTestId("cad-dxf-runtime-snapshot");
  await expect(snapshotOutput).toBeAttached({ timeout: 30_000 });
  const snapshot = JSON.parse((await snapshotOutput.textContent()) || "{}") as RuntimeSnapshot;
  expect(snapshot.bounds, `${fixtureName} should produce text geometry bounds`).not.toBeNull();
  const spanX = (snapshot.bounds?.maxX ?? 0) - (snapshot.bounds?.minX ?? 0);
  const spanY = (snapshot.bounds?.maxY ?? 0) - (snapshot.bounds?.minY ?? 0);
  expect(spanX, `${fixtureName} text bounds width`).toBeGreaterThan(0.01);
  expect(spanY, `${fixtureName} text bounds height`).toBeGreaterThan(0.01);

  const textOutput = page.getByTestId("cad-dxf-text-render-evidence");
  await expect(textOutput).toBeAttached();
  const evidence = JSON.parse((await textOutput.textContent()) || "{}") as TextEvidence;
  expect(evidence.source.renderCandidateTextRecords).toBeGreaterThan(0);
  expect(evidence.parsed?.totalTextRecords).toBe(evidence.source.renderCandidateTextRecords);
  expect(evidence.parserLossCount).toBe(0);
  expect(evidence.fontProbes).toHaveLength(2);
  expect(evidence.fontProbes.every((font) => font.ok && font.status === 200 && font.bytes > 1024)).toBe(true);

  return { spanX, spanY };
}

async function attachEvidence(page: Page, testInfo: TestInfo, name: string) {
  await testInfo.attach(name, {
    body: await page.screenshot({ animations: "disabled" }),
    contentType: "image/png",
  });
}

test.describe("DXF Text Stage 2 renderer hardening", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Worker/WebGL fidelity gate runs in Chromium.");

  test("constant ATTDEF becomes real block-instanced text geometry", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1200, height: 800 });
    await login(page);

    const geometry = await openTextOnlyFixture(page, "stage2-constant-attdef.dxf");
    expect(geometry.spanX).toBeGreaterThan(5);
    expect(geometry.spanY).toBeGreaterThan(1);
    await expect(page.getByTestId("cad-dxf-text-evidence")).toContainText("kaynak 1");
    await expect(page.getByTestId("cad-dxf-text-evidence")).toContainText("parser 1");
    await attachEvidence(page, testInfo, "dxf-text-stage2-constant-attdef.png");
  });

  test("ATTRIB-only drawing renders after owner and width-factor normalization", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1200, height: 800 });
    await login(page);

    const geometry = await openTextOnlyFixture(page, "stage2-attrib-width-owner.dxf");
    expect(geometry.spanX).toBeGreaterThan(5);
    expect(geometry.spanY).toBeGreaterThan(10);
    await expect(page.getByTestId("cad-dxf-text-evidence")).toContainText("kaynak 3");
    await expect(page.getByTestId("cad-dxf-text-evidence")).toContainText("parser 3");
    await attachEvidence(page, testInfo, "dxf-text-stage2-attrib-width-owner.png");
  });
});

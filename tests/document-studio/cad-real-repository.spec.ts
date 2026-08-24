import { expect, test, type Page } from "@playwright/test";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const fixtureDir = process.env.CAD_REAL_REPO_FIXTURE_DIR;

const fixtures = [
  { file: "dwg-a.dwg", mime: "application/acad", maxReadyMs: 70_000 },
  { file: "dwg-b-large.dwg", mime: "application/acad", maxReadyMs: 150_000 },
  { file: "dwg-c-beams.dwg", mime: "application/acad", maxReadyMs: 70_000 },
  { file: "dxf-a-large.dxf", mime: "application/dxf", maxReadyMs: 220_000 },
] as const;

async function signIn(page: Page) {
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

async function uploadFixture(page: Page, filePath: string, mime: string): Promise<string> {
  const buffer = readFileSync(filePath);
  const extension = path.extname(filePath).toLowerCase();
  const response = await page.request.post("/api/dokumantasyon/upload/local", {
    multipart: {
      file: { name: path.basename(filePath), mimeType: mime, buffer },
      pathname: `dok_storage/real-cad-${Date.now()}-${Math.random().toString(36).slice(2)}${extension}`,
    },
  });
  const payload = await response.json().catch(() => ({}));
  expect(response.ok(), payload.error || `Fixture yüklenemedi (${response.status()})`).toBeTruthy();
  expect(payload.file?.id).toBeTruthy();
  return payload.file.id as string;
}

async function waitForVisibleCad(page: Page, timeout: number): Promise<void> {
  await expect.poll(async () => {
    const terminalError =
      await page.getByText("CAD görünümü açılamadı", { exact: true }).isVisible().catch(() => false) ||
      await page.getByText("DWG açılamadı", { exact: true }).isVisible().catch(() => false) ||
      await page.getByText("DXF açılamadı", { exact: true }).isVisible().catch(() => false);
    if (terminalError) return "error";

    const upstream = page.locator('[data-cad-upstream-host="true"]').first();
    if (await upstream.getAttribute("data-cad-upstream-state").catch(() => null) === "ready") {
      if (await upstream.locator("canvas").first().isVisible().catch(() => false)) return "upstream";
    }

    const legacy = page.getByTestId("cad-dxf-viewer").first();
    if (await legacy.getAttribute("data-cad-load-state").catch(() => null) === "ready") {
      if (await page.getByTestId("cad-dxf-canvas").first().locator("canvas").first().isVisible().catch(() => false)) {
        return "legacy";
      }
    }

    return "pending";
  }, { timeout, intervals: [250, 500, 1_000, 2_000] }).toMatch(/^(upstream|legacy)$/);
}

async function visibleCadCanvas(page: Page) {
  const upstreamCanvas = page.locator('[data-cad-upstream-host="true"] canvas').first();
  if (await upstreamCanvas.isVisible().catch(() => false)) return upstreamCanvas;
  return page.getByTestId("cad-dxf-canvas").first().locator("canvas").first();
}

test("repo gerçek DWG ve DXF dosyaları Dökümantasyon yükle→aç akışında hata ekranına düşmez", async ({ page }) => {
  test.setTimeout(12 * 60_000);
  test.skip(!fixtureDir, "CAD_REAL_REPO_FIXTURE_DIR tanımlı değil.");
  await signIn(page);

  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (const fixture of fixtures) {
    const filePath = path.resolve(fixtureDir!, fixture.file);
    expect(existsSync(filePath), `${fixture.file} bulunamadı`).toBeTruthy();
    expect(statSync(filePath).size, `${fixture.file} boş`).toBeGreaterThan(0);

    const fileId = await uploadFixture(page, filePath, fixture.mime);
    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    await expect(page.locator('[data-cad-runtime="orchestrator"]').first()).toBeVisible({ timeout: 20_000 });

    await waitForVisibleCad(page, fixture.maxReadyMs);
    await expect(page.getByText("CAD görünümü açılamadı", { exact: true })).toHaveCount(0);
    await expect(page.getByText("DWG açılamadı", { exact: true })).toHaveCount(0);
    await expect(page.getByText("DXF açılamadı", { exact: true })).toHaveCount(0);

    const canvas = await visibleCadCanvas(page);
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    if (!box) throw new Error(`${fixture.file}: görünür CAD canvas sınırı alınamadı`);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, -160);
  }

  expect(pageErrors).toEqual([]);
});

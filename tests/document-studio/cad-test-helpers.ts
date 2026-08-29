import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CAD_PREVIEW_V2_MANIFEST, type CadPreviewV2FixtureManifest } from "../fixtures/cad-preview-v2/manifest";

export async function signInAdmin(page: Page) {
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

export async function uploadCadPreviewV2Fixture(page: Page, fixtureId: string): Promise<{ fileId: string; manifest: CadPreviewV2FixtureManifest }> {
  const manifest = CAD_PREVIEW_V2_MANIFEST[fixtureId];
  if (!manifest) throw new Error(`Fixture not found in manifest: ${fixtureId}`);

  const filePath = resolve(process.cwd(), "tests/fixtures/cad-preview-v2", manifest.fileName);
  const content = readFileSync(filePath, "utf8");

  const fileId = await page.evaluate(async ({ content, name }) => {
    const formData = new FormData();
    formData.append("file", new File([content], name, { type: "application/dxf" }));
    formData.append("pathname", `cad-preview-v2-${crypto.randomUUID()}.dxf`);
    const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok || !payload.file?.id) throw new Error(payload.error || "Fixture yüklenemedi");
    return payload.file.id as string;
  }, { content, name: manifest.fileName });

  return { fileId, manifest };
}

export async function uploadCustomDwgFixture(page: Page, fileName = "test-drawing.dwg"): Promise<string> {
  return await page.evaluate(async ({ name }) => {
    // Minimal mock DWG header bytes for local upload testing
    const sampleDwgBytes = new Uint8Array([0x41, 0x43, 0x31, 0x30, 0x33, 0x32, 0x00, 0x00]);
    const blob = new Blob([sampleDwgBytes], { type: "application/acad" });
    const formData = new FormData();
    formData.append("file", new File([blob], name, { type: "application/acad" }));
    formData.append("pathname", `cad-preview-v2-${crypto.randomUUID()}-${name}`);
    const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok || !payload.file?.id) throw new Error(payload.error || "DWG Fixture yüklenemedi");
    return payload.file.id as string;
  }, { name: fileName });
}

export async function forceUpstreamUnavailable(page: Page): Promise<void> {
  await page.route("**/cad-upstream/**", async (route) => {
    await route.abort("failed");
  });
}

export async function mockDwgFastCacheHit(page: Page, fileId: string, cachedDxfContent: string | Buffer): Promise<void> {
  await page.route(`**/api/dokumantasyon/files/${fileId}/dwg-dxf`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/dxf",
      headers: {
        "X-DWG-DXF-Decision": "PASS",
      },
      body: cachedDxfContent,
    });
  });
}

export async function mockDwgFastCacheMiss(page: Page, fileId: string): Promise<void> {
  await page.route(`**/api/dokumantasyon/files/${fileId}/dwg-dxf`, async (route) => {
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: "CACHE_MISS" }),
    });
  });
}

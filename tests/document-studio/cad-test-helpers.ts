import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CAD_PREVIEW_V2_MANIFEST, type CadPreviewV2FixtureManifest } from "../fixtures/cad-preview-v2/manifest";

const trackedFixtureFileIds = new Set<string>();

export function getTrackedFixtureFileIds(): string[] {
  return Array.from(trackedFixtureFileIds);
}

export function clearTrackedFixtureFileIds(): void {
  trackedFixtureFileIds.clear();
}

export async function cleanupUploadedCadFixtures(page?: Page): Promise<void> {
  const ids = Array.from(trackedFixtureFileIds);
  if (ids.length === 0) return;

  for (const fileId of ids) {
    try {
      if (page && !page.isClosed()) {
        await page.evaluate(async (id) => {
          try {
            await fetch(`/api/dokumantasyon/files/${id}`, { method: "DELETE" });
            await fetch(`/api/dokumantasyon/trash/files/${id}`, { method: "DELETE" });
          } catch {
            // ignore network errors during teardown
          }
        }, fileId);
      }
    } catch {
      // ignore page closed or evaluation error
    }
  }
  trackedFixtureFileIds.clear();
}

export async function signInAdmin(page: Page) {
  await page.goto("/dokumantasyon");
  const username = page.locator("input#username");
  const workspaceTitle = page.locator("h1:has-text('Dökümantasyon Modülü')");

  await expect.poll(async () => {
    if (await username.isVisible()) return "login";
    if (await workspaceTitle.isVisible()) return "workspace";
    return "pending";
  }, { timeout: 15_000 }).not.toBe("pending");

  if (await username.isVisible()) {
    await username.fill("admin");
    await page.locator("input#password").fill("admin");
    await page.getByRole("button", { name: "Giriş Yap" }).click();
    await expect(username).toBeHidden({ timeout: 12_000 });
  }

  await expect(workspaceTitle).toBeVisible({ timeout: 12_000 });
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

  trackedFixtureFileIds.add(fileId);
  return { fileId, manifest };
}

export async function uploadCustomDwgFixture(page: Page, fileName = "test-drawing.dwg"): Promise<string> {
  const fileId = await page.evaluate(async ({ name }) => {
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

  trackedFixtureFileIds.add(fileId);
  return fileId;
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

import { expect, type Page } from "@playwright/test";
import { createHash, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { resolve } from "node:path";
import { CAD_PREVIEW_V2_MANIFEST, type CadPreviewV2FixtureManifest } from "../fixtures/cad-preview-v2/manifest";
import { getLocalStorageDir, readLocalDb, writeLocalDb } from "../../src/lib/dokumantasyon/local-store";
import {
  getDwgDxfConverterSignatureHash,
  getDwgDxfSourceVersionKey,
} from "../../src/lib/dokumantasyon/dwg/derivative-cache";
import { DWG_DXF_CONVERTER_SIGNATURE } from "../../src/lib/dokumantasyon/dwg/signature";

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
          const boundedDelete = async (url: string) => {
            const controller = new AbortController();
            const timer = window.setTimeout(() => controller.abort("CAD_TEST_CLEANUP_TIMEOUT"), 1_500);
            try {
              await fetch(url, { method: "DELETE", signal: controller.signal });
            } catch {
              // ignore network/abort errors during teardown
            } finally {
              window.clearTimeout(timer);
            }
          };

          await boundedDelete(`/api/dokumantasyon/files/${id}`);
          await boundedDelete(`/api/dokumantasyon/trash/files/${id}`);
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
  const workspaceTitle = page.locator("h1:has-text('Dokümantasyon Modülü'):visible").first();

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

export async function uploadCadPreviewV2Fixture(page: Page, fixtureId: string, fileName?: string): Promise<{ fileId: string; manifest: CadPreviewV2FixtureManifest }> {
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
  }, { content, name: fileName ?? manifest.fileName });

  trackedFixtureFileIds.add(fileId);
  return { fileId, manifest };
}

export async function uploadRealCadBinaryFixture(
  page: Page,
  filePath: string,
  fileName: string,
  mimeType = "application/acad",
): Promise<string> {
  const base64 = Buffer.from(readFileSync(filePath)).toString("base64");
  const extension = fileName.match(/\.[A-Za-z0-9]+$/)?.[0]?.toLowerCase() ?? ".dwg";
  const pathname = `cad-preview-v2-${randomUUID()}${extension}`;
  const fileId = await page.evaluate(async ({ base64, name, type, pathname }) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const formData = new FormData();
    formData.append("file", new File([bytes], name, { type }));
    formData.append("pathname", pathname);
    const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok || !payload.file?.id) throw new Error(payload.error || "Gerçek CAD binary fixture yüklenemedi");
    return payload.file.id as string;
  }, { base64, name: fileName, type: mimeType, pathname });

  trackedFixtureFileIds.add(fileId);
  return fileId;
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

/** Seed only the isolated Playwright local store so the server sends `ready: true`. */
export function seedReadyDwgDxfDerivative(fileId: string, dxfBytes: Buffer): void {
  const db = readLocalDb();
  const file = db.files.find((candidate) => candidate.id === fileId && !candidate.deleted_at);
  if (!file) throw new Error(`Cannot seed DWG derivative; uploaded fixture not found: ${fileId}`);

  const localPath = `test-derivatives/${fileId}/cached-preview.dxf`;
  const diskPath = path.join(getLocalStorageDir(), ...localPath.split("/"));
  mkdirSync(path.dirname(diskPath), { recursive: true });
  writeFileSync(diskPath, dxfBytes);

  const now = new Date().toISOString();
  const dxfSha256 = createHash("sha256").update(dxfBytes).digest("hex");
  db.dwg_dxf_derivatives ??= [];
  db.dwg_dxf_derivatives.push({
    id: randomUUID(),
    file_id: fileId,
    source_version_key: getDwgDxfSourceVersionKey(file),
    source_sha256: file.sha256_hash || "0".repeat(64),
    converter_signature: DWG_DXF_CONVERTER_SIGNATURE,
    converter_signature_sha256: getDwgDxfConverterSignatureHash(),
    dwg_version: null,
    status: "ready",
    validation_decision: "PASS",
    dxf_blob_pathname: localPath,
    dxf_blob_url: null,
    dxf_sha256: dxfSha256,
    dxf_size_bytes: dxfBytes.byteLength,
    conversion_ms: 0,
    validation_ms: 0,
    diagnostics_json: [],
    validation_json: { decision: "PASS", source: "isolated-playwright-fixture" },
    error_code: null,
    error_message: null,
    lock_expires_at: null,
    started_at: now,
    completed_at: now,
    created_at: now,
    updated_at: now,
  });
  writeLocalDb(db);
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

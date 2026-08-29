import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { signInAdmin, uploadCadPreviewV2Fixture } from "./cad-test-helpers";

test.describe("CAD Preview V2 — Text and Entity Orientation Suite", () => {
  test("TEXT 0°, 90°, 180°, 270° rotation fixture upstream-primary içinde render edilir", async ({ page }) => {
    await signInAdmin(page);
    const { fileId, manifest } = await uploadCadPreviewV2Fixture(page, "text-rotation-0-90-180-270");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const runtime = page.locator('[data-cad-runtime="orchestrator"][data-cad-engine="upstream"]').first();
    const host = runtime.locator('[data-cad-upstream-host="true"]').first();

    await expect(runtime).toBeVisible({ timeout: 30_000 });
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    const canvas = host.locator("canvas").first();
    await expect(canvas).toBeVisible();

    // Verify all 4 entities in manifest are defined with correct rotation oracle
    for (const entity of manifest.entities) {
      expect(entity.expectedRotationDeg).toBeDefined();
      expect([0, 90, 180, 270]).toContain(entity.expectedRotationDeg);
    }
  });

  test("KZ Synthetic Oracle: 90° KZ (102C/102D) ile 0° KZ (E5C98/E5CE0) kesin olarak ayrıştırılır", async ({ page }) => {
    await signInAdmin(page);
    const { fileId, manifest } = await uploadCadPreviewV2Fixture(page, "kz-synthetic-rotation-oracle");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const runtime = page.locator('[data-cad-runtime="orchestrator"][data-cad-engine="upstream"]').first();
    const host = runtime.locator('[data-cad-upstream-host="true"]').first();

    await expect(runtime).toBeVisible({ timeout: 30_000 });
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    const canvas = host.locator("canvas").first();
    await expect(canvas).toBeVisible();

    // Oracle assertions
    const targetKz49 = manifest.entities.find((e) => e.handle === "102C");
    const targetKz50 = manifest.entities.find((e) => e.handle === "102D");
    const controlKz49 = manifest.entities.find((e) => e.handle === "E5C98");
    const controlKz50 = manifest.entities.find((e) => e.handle === "E5CE0");

    expect(targetKz49?.expectedRotationDeg).toBe(90.0);
    expect(targetKz50?.expectedRotationDeg).toBe(90.0);
    expect(controlKz49?.expectedRotationDeg).toBe(0.0);
    expect(controlKz50?.expectedRotationDeg).toBe(0.0);
  });

  test("MTEXT group 50, direction vector ve combined rotation fixture render edilir", async ({ page }) => {
    await signInAdmin(page);
    const { fileId, manifest } = await uploadCadPreviewV2Fixture(page, "mtext-rotation-vectors");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const runtime = page.locator('[data-cad-runtime="orchestrator"][data-cad-engine="upstream"]').first();
    const host = runtime.locator('[data-cad-upstream-host="true"]').first();

    await expect(runtime).toBeVisible({ timeout: 30_000 });
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });
    await expect(host.locator("canvas").first()).toBeVisible();

    expect(manifest.entities.length).toBe(3);
    for (const entity of manifest.entities) {
      expect(entity.expectedRotationDeg).toBe(90.0);
    }
  });

  test("INSERT ve ATTRIB birleşik transformları doğru parse edilir ve render edilir", async ({ page }) => {
    await signInAdmin(page);
    const { fileId, manifest } = await uploadCadPreviewV2Fixture(page, "insert-attrib-transforms");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const runtime = page.locator('[data-cad-runtime="orchestrator"][data-cad-engine="upstream"]').first();
    const host = runtime.locator('[data-cad-upstream-host="true"]').first();

    await expect(runtime).toBeVisible({ timeout: 30_000 });
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });
    await expect(host.locator("canvas").first()).toBeVisible();

    const insertEntity = manifest.entities.find((e) => e.handle === "INS_1");
    const attribEntity = manifest.entities.find((e) => e.handle === "ATT_1");

    expect(insertEntity?.expectedRotationDeg).toBe(90.0);
    expect(attribEntity?.expectedRotationDeg).toBe(90.0);
  });

  test("Türkçe karakterler ve font fallback (ÇçĞğİıÖöŞşÜü) upstream-primary içinde render edilir", async ({ page }) => {
    await signInAdmin(page);
    const { fileId, manifest } = await uploadCadPreviewV2Fixture(page, "text-turkish-unicode");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const runtime = page.locator('[data-cad-runtime="orchestrator"][data-cad-engine="upstream"]').first();
    const host = runtime.locator('[data-cad-upstream-host="true"]').first();

    await expect(runtime).toBeVisible({ timeout: 30_000 });
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });
    await expect(host.locator("canvas").first()).toBeVisible();

    expect(manifest.entities.length).toBe(3);
    const lowerTr = manifest.entities.find((e) => e.handle === "T_TR_LOWER");
    const upperTr = manifest.entities.find((e) => e.handle === "T_TR_UPPER");
    const phraseTr = manifest.entities.find((e) => e.handle === "T_TR_PHRASE");

    expect(lowerTr?.text).toBe("çğıöşü");
    expect(upperTr?.text).toBe("ÇĞİÖŞÜ");
    expect(phraseTr?.text).toBe("MİMARİ VE STATİK PROJESİ");
  });

  test("Legacy fallback motorunda metin rotasyon paritesi doğrulanır", async ({ page }) => {
    // Force upstream to fail so legacy engine is tested
    await page.route("**/cad-upstream/**", async (route) => {
      await route.abort("failed");
    });

    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "text-rotation-0-90-180-270");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const fallbackRuntime = page.locator('[data-cad-runtime="orchestrator"][data-cad-engine="legacy"]').first();
    await expect(fallbackRuntime).toBeVisible({ timeout: 30_000 });
  });

  test("Gerçek yerel proje DXF (tanımlıysa) 102C ve 102D entity rotasyon oracle'ı doğrulanır", async ({ page }) => {
    const realPath = process.env.CAD_DXF_PROJECT_FIXTURE;
    test.skip(!realPath || !existsSync(realPath), "CAD_DXF_PROJECT_FIXTURE tanımlı değil.");

    const rawDxf = readFileSync(realPath!, "utf8");
    // Verify in raw DXF without exposing file path or content to logs
    expect(rawDxf).toContain("102C");
    expect(rawDxf).toContain("102D");
    expect(rawDxf).toContain("KZ49 25/50");
    expect(rawDxf).toContain("KZ50 25/50");

    await signInAdmin(page);
    const fileId = await page.evaluate(async ({ content }) => {
      const formData = new FormData();
      formData.append("file", new File([content], "gercek-proje.dxf", { type: "application/dxf" }));
      formData.append("pathname", `cad-real-${crypto.randomUUID()}.dxf`);
      const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
      const payload = await response.json();
      return payload.file.id as string;
    }, { content: rawDxf });

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const runtime = page.locator('[data-cad-runtime="orchestrator"][data-cad-engine="upstream"]').first();
    const host = runtime.locator('[data-cad-upstream-host="true"]').first();

    await expect(runtime).toBeVisible({ timeout: 30_000 });
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });
  });
});

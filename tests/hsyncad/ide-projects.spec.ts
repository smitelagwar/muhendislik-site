import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { IDE_EXAMPLES } from "../../src/lib/hsyncad/ide-examples";

test("published IDE examples open in the normal editor without any local source endpoint", async ({ page, request }, testInfo) => {
  test.setTimeout(180_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  const manifest = JSON.parse(await fs.readFile("public/hsyncad/examples/manifest.json", "utf8"));
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await expect(page.getByTestId("open-ide-projects")).toHaveCount(0);
  for (const sample of IDE_EXAMPLES) {
    const response = await request.get(`/api/hsyncad/ide-examples/${sample.id}`);
    expect(response.ok()).toBe(true);
    const bytes = await response.body(), item = manifest.find((m: { id: string }) => m.id === sample.id);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(item.sha256);
    await page.getByRole("button", { name: "Dosya işlemleri" }).click();
    await page.getByTestId(`ide-sample-${sample.id}`).click();
    await expect(page.getByTestId("hsyncad-ide-import-report")).toContainText(item.sourceFilename, { timeout: 30_000 });
    await expect(page.getByTestId("hsyncad-import-progress")).toHaveCount(0);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("hsyncad.model.v1")!));
    expect(saved.elements).toHaveLength(item.editable);
    expect(saved.floors).toHaveLength(item.floors);
    expect(saved.ideImport.references).toHaveLength(item.references);
    await expect(page.getByTestId("ide-viewer")).toHaveCount(0);
    await expect(page.getByTestId("hsyncad-3d-canvas")).toBeVisible();
  }
  await page.screenshot({ path: testInfo.outputPath("integrated-ide-examples.png") });
  expect((await request.get("/api/hsyncad/ide-examples/unknown")).status()).toBe(404);
  expect(errors).toEqual([]);
});

test("failed download and cancellation preserve the current editor model", async ({ page }) => {
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Dosya işlemleri" }).click();
  await page.getByTestId("load-demo").click();
  const before = await page.evaluate(() => localStorage.getItem("hsyncad.model.v1"));
  await page.route("**/hsyncad/examples/*", route => route.fulfill({ status: 404, body: "missing" }));
  await page.getByRole("button", { name: "Dosya işlemleri" }).click();
  await page.getByTestId("ide-sample-suheyla-kara").click();
  await expect(page.getByTestId("hsyncad-message")).toContainText("indirilemedi");
  expect(await page.evaluate(() => localStorage.getItem("hsyncad.model.v1"))).toBe(before);
  await page.unroute("**/hsyncad/examples/*");
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/hsyncad/examples/*", async route => { await held; await route.abort().catch(() => {}); });
  await page.getByRole("button", { name: "Dosya işlemleri" }).click();
  await page.getByTestId("ide-sample-suheyla-kara").click();
  try {
    await page.getByRole("button", { name: "İptal", exact: true }).click();
    await expect(page.getByTestId("hsyncad-import-progress")).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("hsyncad.model.v1"))).toBe(before);
  } finally { release(); }
});

import { expect, test, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { SOZLESME_DEFAULT_DATA } from "../../src/lib/pdf-engine";

type Share = { viewToken: string; manageToken: string; revoked: boolean };
const evidence = "docs/belgeler-paylasim-v3-uygulama/ASAMA_15_production_smoke.json";

async function create(page: Page, address: string): Promise<Share> {
  const result = await page.evaluate(async (values) => {
    const secret = () => {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
    };
    const response = await fetch("/api/belgeler/paylasim", {
      method: "POST", headers: { "content-type": "application/json", "x-belge-share-replay-proof": secret() },
      body: JSON.stringify({ clientRequestId: secret(), documentId: "santiye-sefi-sozlesmesi", values }),
    });
    const body = await response.json();
    return { status: response.status, code: body.code ?? null, viewToken: body.viewToken, manageToken: body.manageToken };
  }, { ...SOZLESME_DEFAULT_DATA, muteahhit_unvan: "V3 SENTETİK TEST", muteahhit_imza_unvan: "V3 SENTETİK TEST", santiye_sefi_ad: "SENTETİK TEST", santiye_sefi_imza_adi: "SENTETİK TEST", adres: address });
  expect(result.status, `create code=${result.code}`).toBe(201);
  expect(Boolean(result.viewToken && result.manageToken)).toBe(true);
  return { viewToken: result.viewToken, manageToken: result.manageToken, revoked: false };
}

async function pdf(page: Page, share: Share) {
  return page.evaluate(async (token) => {
    const response = await fetch(`/api/belgeler/paylasim/${token}/pdf`);
    const bytes = await response.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const sha256 = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    return { status: response.status, type: response.headers.get("content-type"), size: bytes.byteLength, sha256 };
  }, share.viewToken);
}

test("Production contract: first link, changed second link, stable PDFs, revoke and cleanup", async ({ page }) => {
  const shares: Share[] = [];
  const cleanupStatuses: number[] = [];
  let accepted = false;
  const measurements: Record<string, unknown> = {};
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(await page.evaluate(async () => (await fetch("/api/belgeler/paylasim/kota", { method: "POST" })).status)).toBe(200);
    const first = await create(page, "ASAMA_15 sentetik ilk adres"); shares.push(first);
    const firstPdf = await pdf(page, first);
    const second = await create(page, "ASAMA_15 sentetik değişen ikinci adres"); shares.push(second);
    const secondPdf = await pdf(page, second);
    const firstAgain = await pdf(page, first);
    for (const item of [firstPdf, secondPdf, firstAgain]) { expect(item.status).toBe(200); expect(item.type).toContain("application/pdf"); expect(item.size).toBeGreaterThan(1000); }
    expect(firstAgain.sha256).toBe(firstPdf.sha256);
    expect(secondPdf.sha256).not.toBe(firstPdf.sha256);
    const revoke = async (share: Share) => page.evaluate(async (item) => (await fetch(`/api/belgeler/paylasim/${item.viewToken}`, { method: "DELETE", headers: { "x-manage-token": item.manageToken } })).status, share);
    expect(await revoke(first)).toBe(200); first.revoked = true;
    expect((await pdf(page, first)).status).toBe(410);
    expect((await pdf(page, second)).sha256).toBe(secondPdf.sha256);
    await page.goto(`/b/${second.viewToken}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("viewer-canvas")).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId("viewer-page")).toHaveText("1 / 2", { timeout: 8000 });
    await page.screenshot({ path: "docs/belgeler-paylasim-v3-uygulama/ASAMA_15_production_viewer.jpg", fullPage: false });
    expect(await revoke(second)).toBe(200); second.revoked = true;
    expect((await pdf(page, second)).status).toBe(410);
    const quota = await page.evaluate(async () => (await (await fetch("/api/belgeler/paylasim/kota")).json()).quota);
    expect(quota).toMatchObject({ used: 2, reserved: 0, remaining: 48 });
    Object.assign(measurements, { firstPdf, secondPdf, quota: { used: quota.used, reserved: quota.reserved, remaining: quota.remaining } });
    accepted = true;
  } finally {
    for (const share of shares.filter((item) => !item.revoked)) {
      const status = await page.evaluate(async (item) => (await fetch(`/api/belgeler/paylasim/${item.viewToken}`, { method: "DELETE", headers: { "x-manage-token": item.manageToken } })).status, share).catch(() => 0);
      cleanupStatuses.push(status); share.revoked = status === 200;
    }
    writeFileSync(evidence, JSON.stringify({ result: accepted && shares.every((item) => item.revoked) ? "PASS" : "FAIL", scope: "canonical Production; two own synthetic contract PDFs only", sharesCreated: shares.length, sharesRevoked: shares.filter((item) => item.revoked).length, cleanupStatuses, measurements, tokenValuesRecorded: false, productionLoadTest: false }, null, 2) + "\n");
    expect(shares.every((item) => item.revoked), "all own synthetic shares revoked").toBe(true);
  }
});

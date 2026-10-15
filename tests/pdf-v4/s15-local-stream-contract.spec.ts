import fs from "node:fs";
import path from "node:path";
import { test, expect } from "./helpers/test";
import { fixturePath, signIn, uploadPdf, type Fixture } from "./helpers/viewer";

const fixture: Fixture = "tr-metin";
const routeFor = (id: string) => `/api/dokumantasyon/files/${id}/stream`;

async function uploadFreshPdf(page: import("@playwright/test").Page, name: Fixture): Promise<string> {
  const content = fs.readFileSync(fixturePath(name)).toString("base64");
  const fileId = await page.evaluate(async ({ fixtureName, base64, nonce }) => {
    const bytes = Uint8Array.from(atob(base64), (value) => value.charCodeAt(0));
    const form = new FormData();
    form.append("file", new File([bytes], `${fixtureName}.pdf`, { type: "application/pdf" }));
    form.append("pathname", `a7-fresh-${nonce}.pdf`);
    const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: form });
    const result = await response.json();
    if (!response.ok || !result.file?.id) throw new Error(`synthetic upload failed: ${response.status}`);
    return result.file.id as string;
  }, { fixtureName: name, base64: content, nonce: Math.random().toString(36).slice(2) });
  return fileId;
}

function testDataDir(): string {
  const base = path.resolve(process.cwd(), ".test-data");
  const active = fs.readFileSync(path.join(base, "active-test-dir.txt"), "utf8").trim();
  const resolved = path.resolve(active);
  if (!resolved.startsWith(base + path.sep)) throw new Error("Test verisi .test-data dışına çıkıyor");
  return resolved;
}

function updateFileBlobUrl(dataDir: string, fileId: string, blobUrl: string): void {
  const dbPath = path.join(dataDir, "dok_db.json");
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  const file = db.files.find((candidate: { id: string }) => candidate.id === fileId);
  if (!file) throw new Error("Sentetik PDF fixture veritabanında yok");
  file.blob_url = blobUrl;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
}

test("local PDF stream rejects a fresh anonymous browser context before returning private metadata or bytes", async ({ page, browser }) => {
  await signIn(page);
  const fileId = await uploadPdf(page, fixture);
  const expectedBytes = fs.readFileSync(fixturePath(fixture));

  const anonymousContext = await browser.newContext();
  try {
    const anonymousPage = await anonymousContext.newPage();
    const origin = new URL(page.url()).origin;
    const response = await anonymousPage.request.get(`${origin}${routeFor(fileId)}`, {
      headers: { Range: "bytes=0-31" },
    });
    const body = await response.body();

    expect(response.status()).toBe(401);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["referrer-policy"]).toBe("no-referrer");
    expect(body).not.toEqual(expectedBytes.subarray(0, 32));
    expect(body.toString("utf8")).not.toContain("%PDF-");

    const access = await anonymousPage.request.get(`${origin}/api/dokumantasyon/files/${fileId}/access`);
    expect(access.status()).toBe(401);
    expect(access.headers()["cache-control"]).toContain("no-store");
    expect((await access.text())).not.toContain(fileId);

    const shares = await anonymousPage.request.get(`${origin}/api/dokumantasyon/shares`);
    expect(shares.status()).toBe(401);
    expect(shares.headers()["cache-control"]).toContain("no-store");
    expect((await shares.text())).not.toContain(fileId);
  } finally {
    await anonymousContext.close();
  }
});

test("local PDF stream implements single-byte ranges and returns 416 for invalid ranges", async ({ page }) => {
  await signIn(page);
  const fileId = await uploadFreshPdf(page, fixture);
  const expected = fs.readFileSync(fixturePath(fixture));

  const cases = [
    { header: "bytes=0-9", status: 206, start: 0, end: 9 },
    { header: "bytes=10-", status: 206, start: 10, end: expected.length - 1 },
    { header: "bytes=-10", status: 206, start: expected.length - 10, end: expected.length - 1 },
  ];
  for (const item of cases) {
    const response = await page.request.get(routeFor(fileId), { headers: { Range: item.header } });
    expect(response.status(), item.header).toBe(item.status);
    expect(response.headers()["content-range"], item.header).toBe(`bytes ${item.start}-${item.end}/${expected.length}`);
    expect(await response.body(), item.header).toEqual(expected.subarray(item.start, item.end + 1));
  }

  const full = await page.request.get(routeFor(fileId));
  expect(full.status()).toBe(200);
  expect(full.headers()["content-length"]).toBe(String(expected.length));
  expect(await full.body()).toEqual(expected);

  const invalidRanges = ["bytes=0-1,4-5", "bytes=abc-xyz", "bytes=20-10", "bytes=-0", "bytes=999999-"];
  for (const header of invalidRanges) {
    const response = await page.request.get(routeFor(fileId), { headers: { Range: header } });
    expect(response.status(), header).toBe(416);
    expect(response.headers()["content-range"], header).toBe(`bytes */${expected.length}`);
    expect((await response.body()).length, header).toBe(0);
  }

  const dataDir = testDataDir();
  const zeroPath = path.join(dataDir, "dok_storage", "zero-byte.pdf");
  fs.writeFileSync(zeroPath, Buffer.alloc(0));
  updateFileBlobUrl(dataDir, fileId, "local:zero-byte.pdf");
  const zeroResponse = await page.request.get(routeFor(fileId), { headers: { Range: "bytes=0-" } });
  expect(zeroResponse.status()).toBe(416);
  expect(zeroResponse.headers()["content-range"]).toBe("bytes */0");
  expect((await zeroResponse.body()).length).toBe(0);
});

test("local PDF stream rejects traversal and symlink paths outside its storage root", async ({ page }) => {
  await signIn(page);
  const fileId = await uploadFreshPdf(page, fixture);
  const dataDir = testDataDir();
  const storageDir = path.join(dataDir, "dok_storage");
  const outsideDir = path.join(dataDir, "outside-a3");
  const secret = Buffer.from("A3_SYNTHETIC_OUTSIDE_STORAGE_SENTINEL");
  fs.mkdirSync(outsideDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, "traversal-sentinel.pdf"), secret);
  fs.writeFileSync(path.join(outsideDir, "symlink-sentinel.pdf"), secret);

  updateFileBlobUrl(dataDir, fileId, "local:../traversal-sentinel.pdf");
  const traversal = await page.request.get(routeFor(fileId), { headers: { Range: "bytes=0-31" } });
  expect(traversal.status()).toBe(404);
  expect((await traversal.body()).toString("utf8")).not.toContain(secret.toString("utf8"));

  const junction = path.join(storageDir, "outside-link");
  fs.symlinkSync(outsideDir, junction, "junction");
  updateFileBlobUrl(dataDir, fileId, "local:outside-link/symlink-sentinel.pdf");
  const symlink = await page.request.get(routeFor(fileId), { headers: { Range: "bytes=0-31" } });
  expect(symlink.status()).toBe(404);
  expect((await symlink.body()).toString("utf8")).not.toContain(secret.toString("utf8"));
});

test("PDF studio opens and closes ten distinct synthetic file records without stale errors", async ({ page }) => {
  await signIn(page);
  const content = fs.readFileSync(fixturePath(fixture)).toString("base64");
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  for (let i = 0; i < 10; i++) {
    const fileId = await page.evaluate(async ({ index, base64 }) => {
      const bytes = Uint8Array.from(atob(base64), (value) => value.charCodeAt(0));
      const form = new FormData();
      form.append("file", new File([bytes], `a3-lifecycle-${index}.pdf`, { type: "application/pdf" }));
      form.append("pathname", `a3-lifecycle-${index}.pdf`);
      const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok || !result.file?.id) throw new Error(`synthetic upload failed: ${response.status}`);
      return result.file.id as string;
    }, { index: i, base64: content });

    await page.goto(`/dokumantasyon/dosya/${fileId}?pdfEngine=v4`, { waitUntil: "domcontentloaded" });
    if (i % 2 === 0) {
      await page.waitForSelector('[data-testid="pdf-scroll-viewport"] [data-page-state="rendered"]', { timeout: 30_000 });
    } else {
      await page.waitForTimeout(25);
    }
    await page.goto("/dokumantasyon", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1").filter({ hasText: "Dokümantasyon Modülü" }).first()).toBeVisible();
  }

  expect(pageErrors).toEqual([]);
});

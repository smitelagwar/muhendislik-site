import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { hash as hashPassword } from "bcryptjs";
import { test, expect } from "./helpers/test";
import { fixturePath, signIn, uploadPdf, type Fixture } from "./helpers/viewer";

const fixture: Fixture = "tr-metin";

interface SyntheticShareOptions {
  expiresAt?: string;
  revokedAt?: string | null;
  passwordHash?: string | null;
  maxDownloads?: number | null;
  downloadCount?: number;
}

function installSyntheticShare(
  fileId: string,
  rawToken: string,
  options: SyntheticShareOptions = {}
): { shareId: string; itemId: string } {
  const testBase = path.resolve(process.cwd(), ".test-data");
  const dataDir = path.resolve(fs.readFileSync(path.join(testBase, "active-test-dir.txt"), "utf8").trim());
  if (!dataDir.startsWith(testBase + path.sep)) throw new Error("Test verisi .test-data dışına çıkıyor");
  const dbPath = path.join(dataDir, "dok_db.json");
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  const file = db.files.find((candidate: { id: string }) => candidate.id === fileId);
  if (!file) throw new Error("Sentetik PDF fixture veritabanında yok");

  const shareId = randomUUID();
  const itemId = randomUUID();
  db.shares.push({
    id: shareId,
    token_hash: createHash("sha256").update(rawToken).digest("hex"),
    title: "A3 sentetik paylaşım",
    expires_at: options.expiresAt ?? new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    password_hash: options.passwordHash === undefined ? "a3-password-required" : options.passwordHash,
    max_downloads: options.maxDownloads ?? null,
    download_count: options.downloadCount ?? 0,
    created_at: new Date().toISOString(),
    revoked_at: options.revokedAt ?? null,
    last_accessed_at: null,
  });
  db.share_items.push({
    id: itemId,
    share_link_id: shareId,
    file_id: fileId,
    file_version_id: null,
    snapshot_name: file.display_name,
    relative_path: "",
    snapshot_size_bytes: Number(file.size_bytes),
    snapshot_mime_type: file.mime_type,
    sort_order: 0,
  });
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");
  return { shareId, itemId };
}

test("public share password boundary and token download remain separate from admin stream access", async ({ page }) => {
  await signIn(page);
  const fileId = await uploadPdf(page, fixture);
  const expected = fs.readFileSync(fixturePath(fixture));
  const rawToken = `a3-${randomUUID()}`;
  const password = `a3-password-${randomUUID()}`;
  const passwordHash = await hashPassword(password, 4);
  const { shareId, itemId } = installSyntheticShare(fileId, rawToken, { passwordHash });

  await page.context().clearCookies();
  const publicUrl = `/api/dokumantasyon/public/download/${rawToken}/${itemId}?preview=1`;
  const passwordRequired = await page.request.get(publicUrl, { headers: { Range: "bytes=0-31" } });
  expect(passwordRequired.status()).toBe(401);
  expect(passwordRequired.headers()["cache-control"]).toContain("no-store");
  expect(passwordRequired.headers()["referrer-policy"]).toBe("no-referrer");
  expect((await passwordRequired.body()).toString("utf8")).not.toContain("%PDF-");

  const wrongPassword = await page.request.post("/api/dokumantasyon/public/verify-password", {
    data: { rawToken, password: "wrong-password" },
  });
  expect(wrongPassword.status()).toBe(401);
  expect(wrongPassword.headers()["cache-control"]).toContain("no-store");
  expect((await wrongPassword.text())).not.toContain(rawToken);

  const correctPassword = await page.request.post("/api/dokumantasyon/public/verify-password", {
    data: { rawToken, password },
  });
  expect(correctPassword.status()).toBe(200);
  expect(correctPassword.headers()["cache-control"]).toContain("no-store");
  expect(correctPassword.headers()["set-cookie"]).toMatch(/HttpOnly/i);
  const accessCookie = (await page.context().cookies()).find((cookie) => cookie.name === `dok_share_${shareId}`);
  expect(accessCookie).toMatchObject({ httpOnly: true, secure: true, sameSite: "Lax" });
  const passwordAccess = await page.evaluate(async (url) => {
    const response = await fetch(url, { headers: { Range: "bytes=0-31" } });
    return {
      status: response.status,
      body: Array.from(new Uint8Array(await response.arrayBuffer())),
    };
  }, publicUrl);
  expect(passwordAccess.status).toBe(200);
  expect(Buffer.from(passwordAccess.body)).toEqual(expected);

  await page.context().clearCookies();

  const testBase = path.resolve(process.cwd(), ".test-data");
  const dataDir = path.resolve(fs.readFileSync(path.join(testBase, "active-test-dir.txt"), "utf8").trim());
  const dbPath = path.join(dataDir, "dok_db.json");
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  db.shares.find((share: { id: string }) => share.id === shareId).password_hash = null;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");

  const capabilityAccess = await page.request.get(publicUrl, { headers: { Range: "bytes=0-31" } });
  expect(capabilityAccess.status()).toBe(200);
  expect(capabilityAccess.headers()["content-length"]).toBe(String(expected.length));
  expect(capabilityAccess.headers()["cache-control"]).toContain("no-store");
  expect(capabilityAccess.headers()["referrer-policy"]).toBe("no-referrer");
  expect(capabilityAccess.headers()["x-content-type-options"]).toBe("nosniff");
  expect(await capabilityAccess.body()).toEqual(expected);
});

test("public share rejects expired, revoked, wrong-token, wrong-item, and exhausted links without caching", async ({ page }) => {
  await signIn(page);
  const fileId = await uploadPdf(page, fixture);
  const expected = fs.readFileSync(fixturePath(fixture));

  const expiredToken = `a3-expired-${randomUUID()}`;
  const revokedToken = `a3-revoked-${randomUUID()}`;
  const scopedToken = `a3-scoped-${randomUUID()}`;
  const exhaustedToken = `a3-exhausted-${randomUUID()}`;
  const expired = installSyntheticShare(fileId, expiredToken, {
    passwordHash: null,
    expiresAt: new Date(Date.now() - 60_000).toISOString(),
  });
  const revoked = installSyntheticShare(fileId, revokedToken, {
    passwordHash: null,
    revokedAt: new Date().toISOString(),
  });
  const scoped = installSyntheticShare(fileId, scopedToken, { passwordHash: null });
  const exhausted = installSyntheticShare(fileId, exhaustedToken, {
    passwordHash: null,
    maxDownloads: 1,
  });

  const publicPage = await page.request.get(`/p/${scopedToken}`);
  expect(publicPage.status()).toBe(200);
  expect(publicPage.headers()["cache-control"]).toMatch(/no-cache|no-store/);
  expect(publicPage.headers()["cache-control"]).not.toContain("public");
  expect(publicPage.headers()["referrer-policy"]).toBe("no-referrer");

  const invalidCases = [
    { token: expiredToken, itemId: expired.itemId, status: 410 },
    { token: revokedToken, itemId: revoked.itemId, status: 410 },
    { token: `a3-wrong-${randomUUID()}`, itemId: scoped.itemId, status: 400 },
    { token: scopedToken, itemId: expired.itemId, status: 404 },
    { token: scopedToken, itemId: randomUUID(), status: 404 },
  ];
  for (const item of invalidCases) {
    const response = await page.request.get(`/api/dokumantasyon/public/download/${item.token}/${item.itemId}`, {
      headers: { Range: "bytes=0-31" },
    });
    expect(response.status()).toBe(item.status);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["referrer-policy"]).toBe("no-referrer");
    const body = await response.text();
    expect(body).not.toContain("%PDF-");
    expect(body).not.toContain(item.token);
  }

  const testBase = path.resolve(process.cwd(), ".test-data");
  const dataDir = path.resolve(fs.readFileSync(path.join(testBase, "active-test-dir.txt"), "utf8").trim());
  const dbPath = path.join(dataDir, "dok_db.json");
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  const exhaustedItem = db.share_items.find((item: { id: string }) => item.id === exhausted.itemId);
  exhaustedItem.snapshot_name = 'unsafe"\r\nX-Leak: injected.pdf';
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf8");

  const allowedDownload = await page.request.get(
    `/api/dokumantasyon/public/download/${exhaustedToken}/${exhausted.itemId}`,
    { headers: { Range: "bytes=0-31" } }
  );
  expect(allowedDownload.status()).toBe(200);
  expect(allowedDownload.headers()["content-length"]).toBe(String(expected.length));
  expect(allowedDownload.headers()["cache-control"]).toContain("no-store");
  expect(allowedDownload.headers()["referrer-policy"]).toBe("no-referrer");
  expect(await allowedDownload.body()).toEqual(expected);
  expect(allowedDownload.headers()["content-disposition"]).toContain("%0D%0A");
  expect(allowedDownload.headers()["content-disposition"]).not.toMatch(/[\r\n]/);
  expect(allowedDownload.headers()["x-leak"]).toBeUndefined();

  const overLimit = await page.request.get(
    `/api/dokumantasyon/public/download/${exhaustedToken}/${exhausted.itemId}`,
    { headers: { Range: "bytes=0-31" } }
  );
  expect(overLimit.status()).toBe(403);
  expect(overLimit.headers()["cache-control"]).toContain("no-store");
  expect((await overLimit.body()).toString("utf8")).not.toContain("%PDF-");

  const listing = await page.request.get("/api/dokumantasyon/shares");
  expect(listing.status()).toBe(200);
  expect(listing.headers()["cache-control"]).toContain("no-store");
  const links = (await listing.json()).links as Array<{ id: string }>;
  expect(links.map((link) => link.id)).toContain(scoped.shareId);
});

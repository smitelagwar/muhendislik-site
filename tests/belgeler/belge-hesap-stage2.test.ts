import assert from "node:assert/strict";
import test from "node:test";
import { credentialsSchema, usernameSchema, deletionSchema, passwordChangeSchema } from "../../src/lib/belge-hesap/credentials-schema";
import { decryptProfile, digest, encryptProfile, hashPassword, newSessionToken, verifyPassword } from "../../src/lib/belge-hesap/server/crypto";
import { getAccountConfig } from "../../src/lib/belge-hesap/server/config";

test("hsyn/123 accepted; short passwords can be hashed and verified", async () => {
  assert.deepEqual(credentialsSchema.parse({ username: "hsyn", password: "123" }), { username: "hsyn", password: "123" });
  const hash = await hashPassword("123");
  assert.notEqual(hash, "123");
  assert.equal(await verifyPassword("123", hash), true);
  assert.equal(await verifyPassword("124", hash), false);
});
test("username restrictions and deletion confirmation", () => {
  assert.equal(usernameSchema.safeParse("hsyn").success, true);
  assert.equal(usernameSchema.safeParse("hsyn spaces").success, false);
  assert.equal(deletionSchema.safeParse({ password: "123", confirmation: "SIL" }).success, true);
  assert.equal(deletionSchema.safeParse({ password: "123", confirmation: "sil" }).success, false);
  assert.equal(passwordChangeSchema.safeParse({ currentPassword: "123", newPassword: "abc" }).success, true);
});
test("session tokens are randomly generated and digests differ", () => {
  const a = newSessionToken(), b = newSessionToken();
  assert.notEqual(a, b);
  assert.notEqual(digest(a), digest(b));
  assert.equal(digest(a).length, 64);
});
test("account-specific encrypted profile cannot be opened with another id", () => {
  const env = {
    ...process.env,
    BELGE_ACCOUNT_ENABLED: "true",
    BELGE_ACCOUNT_PROFILE_KEY: Buffer.alloc(32, 7).toString("base64"),
    BELGE_ACCOUNT_RATE_SALT: "different-testing-rate-salt-at-least-32chars",
    VERCEL_ENV: "local",
  };
  // Config requires a DB URL but does not connect to it.
  const originalUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgres://unit:test@localhost:5432/test";
  try {
    const config = getAccountConfig(env);
    assert.ok(config);
    const uid = "f48e2dde-9ad9-4772-84c4-4fbd9ad0422e";
    const encrypted = encryptProfile(config, uid, JSON.stringify({ ad: "Deneme" }));
    assert.equal(decryptProfile(config, uid, encrypted), JSON.stringify({ ad: "Deneme" }));
    assert.throws(() => decryptProfile(config, "e1d71370-185c-4bde-b83d-ab8d6fa8c320", encrypted));
  } finally {
    if (originalUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalUrl;
  }
});

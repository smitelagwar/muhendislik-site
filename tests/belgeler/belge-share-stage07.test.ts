import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createShareSnapshotFingerprint,
  filterShareSnapshotValues,
  formatShareExpiryTr,
  parseShareCreateResponse,
  parseShareRecoveryRecord,
  type ShareRecoveryRecord,
} from "../../src/hooks/use-belge-share";

const requestId = Buffer.alloc(32, 11).toString("base64url");
const proof = Buffer.alloc(32, 12).toString("base64url");

describe("ASAMA_07 share snapshot and recovery contract", () => {
  it("shares only fields defined by the selected document contract", () => {
    const rawValues: Record<string, string> = {
      muteahhit_unvan: "Müteahhit Ltd.",
      santiye_sefi_ad: "Şantiye Şefi",
      forged_fixed_label: "forged",
    };
    Object.defineProperty(rawValues, "__proto__", { value: "unsafe", enumerable: true });
    const values = filterShareSnapshotValues("santiye-sefi-sozlesmesi", rawValues);

    assert.deepStrictEqual(values, {
      muteahhit_unvan: "Müteahhit Ltd.",
      santiye_sefi_ad: "Şantiye Şefi",
    });
  });

  it("binds a one-way fingerprint to the exact form content across reloads without exposing form text", async () => {
    const values = { muteahhit_unvan: "Özel Firma", santiye_sefi_ad: "Özel Kişi" };
    const first = await createShareSnapshotFingerprint("santiye-sefi-sozlesmesi", 7, values);
    const edited = await createShareSnapshotFingerprint("santiye-sefi-sozlesmesi", 7, { ...values, muteahhit_unvan: "Başka Firma" });
    const regenerated = await createShareSnapshotFingerprint("santiye-sefi-sozlesmesi", 8, values);

    assert.match(first, /^[A-Za-z0-9_-]{43}$/);
    assert.notStrictEqual(first, edited);
    // Runtime revision counters restart after a reload; the same restored form remains identical.
    assert.strictEqual(first, regenerated);
    assert.equal(first.includes("Özel Firma"), false);
  });

  it("recovers only request proof and a digest, never the personal form payload", async () => {
    const fingerprint = await createShareSnapshotFingerprint("santiye-sefi-sozlesmesi", 4, { muteahhit_unvan: "Gizli Firma" });
    const record: ShareRecoveryRecord = {
      clientRequestId: requestId,
      replayProof: proof,
      documentId: "santiye-sefi-sozlesmesi",
      snapshotFingerprint: fingerprint,
      snapshotRevision: 4,
      createdAt: "2026-10-23T12:00:00.000Z",
    };
    const serialized = JSON.stringify(record);

    assert.equal(serialized.includes("Gizli Firma"), false);
    assert.deepStrictEqual(parseShareRecoveryRecord(JSON.parse(serialized), record.documentId), record);
    assert.equal(parseShareRecoveryRecord({ ...record, replayProof: "invalid" }), null);
    assert.equal(parseShareRecoveryRecord({ ...record, documentId: "another-document" }, record.documentId), null);
  });

  it("keeps WAF HTML 429 distinct from the server's daily quota response", async () => {
    const waf = new Response("<html>blocked</html>", { status: 429, headers: { "content-type": "text/html" } });
    await assert.rejects(parseShareCreateResponse(waf), /günlük kota bilgisi değildir/);

    const quota = new Response(JSON.stringify({
      code: "DAILY_BROWSER_QUOTA_EXCEEDED",
      message: "Günlük bağlantı hakkı doldu.",
    }), {
      status: 429,
      headers: { "content-type": "application/json", "Retry-After": "3600" },
    });
    await assert.rejects(parseShareCreateResponse(quota), /Kota 60 dakika sonra yenilenecek/);
  });

  it("formats the reset time using the server's Türkiye date and time", () => {
    assert.match(formatShareExpiryTr("2026-10-24T00:00:00.000Z"), /24\.10\.2026/);
    assert.equal(formatShareExpiryTr("invalid"), "");
  });
});

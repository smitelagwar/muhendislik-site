import assert from "node:assert/strict";
import test from "node:test";
import { createDraftEnvelope, parseDraft, saveDraft, loadDraft, type StorageLike } from "../../src/lib/belge-draft-storage";
import { DOCUMENT_EDITABLE_FIELDS, getKeyForMode, getScopedRecoveryKey } from "../../src/lib/belge-ux-config";
import { clearLocalAccountDrafts } from "../../src/lib/belge-hesap/account-draft-cleanup";
import { mergeStoredDraftWithBase } from "../../src/lib/belge-hesap/document-draft";
import { resolveBelgeBaseData } from "../../src/lib/belge-hesap/resolve-base-data";

const doc = "santiye-sefi-taahhutnamesi";
const first = { kind: "account" as const, accountId: "28f30578-dcb8-47d8-9c29-a39b12658275" };
const second = { kind: "account" as const, accountId: "d20310a0-e9b8-43a4-b6a3-0e26f9ed9114" };
const guest = { kind: "guest" as const };
function memory() {
  const contents = new Map<string, string>();
  const storage: StorageLike = {
    getItem: (key) => contents.get(key) ?? null,
    setItem: (key, value) => { contents.set(key, value); },
    removeItem: (key) => { contents.delete(key); },
  };
  return { storage, contents };
}
function envelope(manualFields: readonly string[] | undefined, values: Record<string, string>) {
  const result = createDraftEnvelope({
    documentId: doc, values, writerId: "stage-4-test",
    revision: 1, savedAt: Date.now(), ...(manualFields === undefined ? {} : { manualFields }),
  });
  if (!result.ok) throw new Error(result.details);
  return result.envelope;
}

test("five document baselines use profile only for explicitly allowed personal fields", () => {
  const user = {
    ad: "İlhan", soyad: "işçi", tcKimlikNo: "11111111110",
    meslekUnvani: "İnşaat Mühendisi", telefon: "05551234567",
    adres: "Benim adresim", il: "Ankara", ilce: "Çankaya",
  };
  for (const id of [
    "beton-dokum-tutanagi",
    "insaat-ruhsati-dilekcesi",
    "santiye-sefi-istifa-dilekcesi",
    "santiye-sefi-sozlesmesi",
    "santiye-sefi-taahhutnamesi",
  ] as const) {
    const result = resolveBelgeBaseData(id, user);
    const sample = resolveBelgeBaseData(id, null);
    assert.equal(Object.keys(result.data).length, Object.keys(sample.data).length);
    assert.ok(result.profileKeys.length >= 1);
    for (const key of Object.keys(result.data)) {
      if (!result.profileKeys.includes(key)) assert.equal(result.data[key], sample.data[key]);
    }
  }
});

test("manual overrides and intentional empty fields survive an updated profile", () => {
  const oldBase = resolveBelgeBaseData(doc, {
    ad: "Ayşe", soyad: "Yılmaz", adres: "Eski adres", tcKimlikNo: "11111111110",
  }).data;
  const newBase = resolveBelgeBaseData(doc, {
    ad: "Ayşe", soyad: "Kaya", adres: "Yeni adres", tcKimlikNo: "11111111110",
  }).data;
  const values = { ...oldBase, adres: "", telefon: "0533 123 45 67" };
  const saved = envelope(["adres", "telefon"], values);
  const merged = mergeStoredDraftWithBase(doc, newBase, saved, first);
  assert.equal(merged.adres, "");
  assert.equal(merged.telefon, "0533 123 45 67");
  assert.equal(merged.santiye_sefi_ad_soyad, "Ayşe KAYA");
  assert.equal(merged.yapi_adresi, newBase.yapi_adresi);
});

test("legacy account envelope conservatively keeps existing values", () => {
  const oldBase = resolveBelgeBaseData(doc, null).data;
  const nextBase = resolveBelgeBaseData(doc, { ad: "Deniz", soyad: "Çelik" }).data;
  const legacy = envelope(undefined, oldBase);
  assert.deepEqual(mergeStoredDraftWithBase(doc, nextBase, legacy, first), oldBase);
  assert.deepEqual(mergeStoredDraftWithBase(doc, nextBase, legacy, guest), oldBase);
});

test("guest draft keys and bytes remain unchanged; accounts are isolated", () => {
  const { storage } = memory();
  const values = resolveBelgeBaseData(doc, null).data;
  const guestEnvelope = envelope(undefined, values);
  const aEnvelope = envelope(["tc_kimlik_no"], { ...values, tc_kimlik_no: "" });
  assert.equal(saveDraft(storage, "device", guestEnvelope).ok, true);
  assert.equal(saveDraft(storage, "device", aEnvelope, { scope: first }).ok, true);
  assert.equal(getKeyForMode("device", doc), "belgeler:ux:draft:device:v1:" + doc);
  assert.equal(loadDraft(storage, "device", doc).ok, true);
  const own = loadDraft(storage, "device", doc, Date.now(), { scope: first });
  assert.equal(own.ok && own.draft?.values.tc_kimlik_no, "");
  const other = loadDraft(storage, "device", doc, Date.now(), { scope: second });
  assert.equal(other.ok && other.draft, null);
  const g = loadDraft(storage, "device", doc);
  assert.equal(g.ok && g.draft?.values.tc_kimlik_no, values.tc_kimlik_no);
});

test("account logout clears only its own draft and recovery keys", () => {
  const { storage: device } = memory();
  const { storage: session } = memory();
  const userValues = resolveBelgeBaseData(doc, null).data;
  const a = envelope(["adres"], userValues);
  const b = envelope(["adres"], userValues);
  saveDraft(device, "device", a, { scope: first });
  saveDraft(device, "device", b, { scope: second });
  saveDraft(device, "device", envelope(undefined, userValues));
  session.setItem(getScopedRecoveryKey(doc, first), "recover");
  clearLocalAccountDrafts(first.accountId, { device, session });
  assert.equal(device.getItem(getKeyForMode("device", doc, first)), null);
  assert.notEqual(device.getItem(getKeyForMode("device", doc, second)), null);
  assert.notEqual(device.getItem(getKeyForMode("device", doc)), null);
  assert.equal(session.getItem(getScopedRecoveryKey(doc, first)), null);
});

test("only valid manual field names are saved or accepted", () => {
  const values = resolveBelgeBaseData(doc, null).data;
  assert.equal(createDraftEnvelope({
    documentId: doc, values, writerId: "test", revision: 1, manualFields: ["__proto__"],
  }).ok, false);
  const draft = envelope(["adres"], values);
  assert.equal(parseDraft({ ...draft, manualFields: ["adres", "adres"] }).ok, false);
  const valid = parseDraft(JSON.stringify(draft));
  assert.equal(valid.ok && valid.draft?.manualFields?.[0], "adres");
  assert.ok(DOCUMENT_EDITABLE_FIELDS[doc].includes("adres"));
});

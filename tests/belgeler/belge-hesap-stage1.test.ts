import test from "node:test";
import assert from "node:assert/strict";
import { ALL_BELGE_DOCUMENT_IDS, getKeyForMode, getScopedRecoveryKey } from "../../src/lib/belge-ux-config";
import { isValidTcKimlikNo } from "../../src/lib/belge-hesap/profile-schema";
import { resolveBelgeBaseData } from "../../src/lib/belge-hesap/resolve-base-data";
import { BETON_DOKUM_DEFAULT_DATA, ISTIFA_DILEKCESI_DEFAULT_DATA, SOZLESME_DEFAULT_DATA, INSAAT_RUHSATI_DEFAULT_DATA, TAAHHUTNAME_DEFAULT_DATA } from "../../src/lib/pdf-engine";

const defaults = {
  "beton-dokum-tutanagi": BETON_DOKUM_DEFAULT_DATA,
  "insaat-ruhsati-dilekcesi": INSAAT_RUHSATI_DEFAULT_DATA,
  "santiye-sefi-istifa-dilekcesi": ISTIFA_DILEKCESI_DEFAULT_DATA,
  "santiye-sefi-sozlesmesi": SOZLESME_DEFAULT_DATA,
  "santiye-sefi-taahhutnamesi": TAAHHUTNAME_DEFAULT_DATA,
};
test("Guest defaults are unchanged across all five documents", () => {
  for (const id of ALL_BELGE_DOCUMENT_IDS) {
    assert.deepEqual(resolveBelgeBaseData(id, null).data, defaults[id]);
    assert.deepEqual(resolveBelgeBaseData(id, null).profileKeys, []);
  }
});
test("Partial profile overwrites only correct person fields", () => {
  const p = { ad: "İlhan", soyad: "işçi", meslekUnvani: "İnşaat Mühendisi", telefon: "05551234567", il: "İstanbul", ilce: "Şişli" };
  const taahhut = resolveBelgeBaseData("santiye-sefi-taahhutnamesi", p);
  assert.equal(taahhut.data.santiye_sefi_ad_soyad, "İlhan İŞÇİ");
  assert.equal(taahhut.data.telefon, "0555 123 45 67");
  assert.equal(taahhut.data.il_ilce, "İSTANBUL / ŞİŞLİ");
  assert.equal(taahhut.data.yapi_adresi, TAAHHUTNAME_DEFAULT_DATA.yapi_adresi);
  assert.equal(resolveBelgeBaseData("beton-dokum-tutanagi", p).data.santiye_sefi, "İnş. Müh. İlhan İŞÇİ");
  assert.equal(resolveBelgeBaseData("santiye-sefi-sozlesmesi", p).data.il, SOZLESME_DEFAULT_DATA.il);
});
test("Missing profile values retain samples", () => {
  const data = resolveBelgeBaseData("santiye-sefi-taahhutnamesi", { ad: "Ahmet", soyad: "Yılmaz" }).data;
  assert.equal(data.tc_kimlik_no, TAAHHUTNAME_DEFAULT_DATA.tc_kimlik_no);
  assert.equal(data.santiye_sefi_ad_soyad, "Ahmet YILMAZ");
});
test("Guest draft keys remain byte identical, accounts are scoped", () => {
  const id = "santiye-sefi-taahhutnamesi", accountId = "28f30578-dcb8-47d8-9c29-a39b12658275";
  assert.equal(getKeyForMode("device", id), "belgeler:ux:draft:device:v1:" + id);
  assert.equal(getKeyForMode("session", id), "belgeler:ux:draft:session:v1:" + id);
  assert.equal(getScopedRecoveryKey(id), "belgeler:ux:draft:recovery:v1:" + id);
  assert.notEqual(getKeyForMode("device", id, { kind: "account", accountId }), getKeyForMode("device", id));
  assert.throws(() => getKeyForMode("device", id, { kind: "account", accountId: "hsyn" }));
});
test("TC checksum validates length and check digits", () => {
  assert.equal(isValidTcKimlikNo("11111111110"), true);
  assert.equal(isValidTcKimlikNo("12345678901"), false);
});

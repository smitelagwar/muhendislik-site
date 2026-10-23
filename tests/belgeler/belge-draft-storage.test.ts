/**
 * ASAMA_01 — Saf, İki Modlu Taslak ve Depolama Çekirdeği Birim Testleri
 *
 * Test Kapsamı:
 * 1. Türkçe, emoji ve uzun alan serileştirme/geri okuma.
 * 2. Temiz/boş string içeren form değerlerinin geçerli kabulü.
 * 3. 5 belgenin 56 düzenlenebilir alanının tam eşleme testi.
 * 4. wrong-document ve documentId uyuşmazlığı.
 * 5. Bozuk JSON (bad JSON) yönetimi.
 * 6. Prototype pollution (__proto__, constructor, prototype) ve İstifa PDF-only alan engellemesi.
 * 7. Kısmi (eksik) ve fazla (bilinmeyen) alan denetimleri.
 * 8. Geçersiz veri tipleri (number, boolean, null) ve zarf meta hataları.
 * 9. Şema parmak izi (fingerprint) uyuşmazlığı.
 * 10. 64 KiB ± 1 bayt boyut sınırı denetimi.
 * 11. 30 gün ± 1 ms yaş uyarı kontrolü (silmeme garantisi).
 * 12. Storage exception ve read-back mismatch hata yönetimi.
 * 13. Concurrency / yazar revizyon çakışma analizi.
 * 14. Session vs. Device ad alanı (namespace) ve anahtar ayrılığı.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALL_BELGE_DOCUMENT_IDS,
  BELGE_UX_LIMITS,
  getKeyForMode,
  getConsentKeyForMode,
  type BelgeDocumentId,
} from "../../src/lib/belge-ux-config";
import { DOCUMENT_EDITABLE_FIELDS } from "../../src/lib/document-field-contracts";
import {
  StorageLike,
  utf8ByteLength,
  draftAgeStatus,
  validateEditableSnapshot,
  createDraftEnvelope,
  parseDraft,
  saveDraft,
  loadDraft,
  deleteDraft,
  compareWriterRevision,
  loadDraftConsent,
  saveDraftConsent,
  clearDraftConsent,
} from "../../src/lib/belge-draft-storage";

/**
 * Testler için bellek içi StorageLike taklidi
 */
class InMemoryStorage implements StorageLike {
  private map = new Map<string, string>();
  public throwOnSet = false;
  public throwOnGet = false;
  public corruptReadBack = false;

  getItem(key: string): string | null {
    if (this.throwOnGet) throw new Error("SIMULATED_GET_ERROR");
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.throwOnSet) throw new Error("SIMULATED_QUOTA_ERROR");
    if (this.corruptReadBack) {
      this.map.set(key, value + "_corrupt");
      return;
    }
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }
}

/**
 * Belirtilen belge için geçerli örnek sahte veri üretir
 */
function createSampleValuesForDocument(docId: BelgeDocumentId): Record<string, string> {
  const fields = DOCUMENT_EDITABLE_FIELDS[docId];
  const values: Record<string, string> = {};
  for (const f of fields) {
    values[f] = `ornek_${f}_degeri`;
  }
  return values;
}

describe("ASAMA_01: Saf Taslak ve Depolama Çekirdeği Testleri", () => {
  it("1. Türkçe karakterler, emojiler ve uzun metin alanlarını kayıpsız saklamalıdır", () => {
    const storage = new InMemoryStorage();
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const sample = createSampleValuesForDocument(docId);

    // Türkçe karakter ve emoji ekle
    sample.yer = "ÇANKAYA / ANKARA — Şantiye Alanı 🏗️ 🏢 ğüşiöç İĞÜŞÖÇ";
    sample.olay_aciklamasi = "A".repeat(500) + " Özel Not: 'İnşaat Sahası & Test'";

    const created = createDraftEnvelope({
      documentId: docId,
      values: sample,
      writerId: "writer-tab-1",
      revision: 1,
    });

    assert.equal(created.ok, true);
    if (!created.ok) return;

    const saveResult = saveDraft(storage, "device", created.envelope);
    assert.equal(saveResult.ok, true);

    const loadResult = loadDraft(storage, "device", docId);
    assert.equal(loadResult.ok, true);
    if (!loadResult.ok || !loadResult.draft) return;

    assert.equal(loadResult.draft.values.yer, sample.yer);
    assert.equal(loadResult.draft.values.olay_aciklamasi, sample.olay_aciklamasi);
  });

  it("2. Tüm alanları boş string olan temiz form snapshot'ını geçerli kabul etmeli ve saklamalıdır", () => {
    const storage = new InMemoryStorage();
    const docId: BelgeDocumentId = "insaat-ruhsati-dilekcesi";
    const emptyValues: Record<string, string> = {};
    for (const f of DOCUMENT_EDITABLE_FIELDS[docId]) {
      emptyValues[f] = "";
    }

    const created = createDraftEnvelope({
      documentId: docId,
      values: emptyValues,
      writerId: "writer-clear-tab",
      revision: 2,
    });

    assert.equal(created.ok, true);
    if (!created.ok) return;

    const saveResult = saveDraft(storage, "session", created.envelope);
    assert.equal(saveResult.ok, true);

    const loadResult = loadDraft(storage, "session", docId);
    assert.equal(loadResult.ok, true);
    if (!loadResult.ok || !loadResult.draft) return;

    for (const f of DOCUMENT_EDITABLE_FIELDS[docId]) {
      assert.equal(loadResult.draft.values[f], "");
    }
  });

  it("3. 5 belgenin 56 düzenlenebilir alanını eksiksiz olarak doğrulamalıdır", () => {
    let totalFieldsValidated = 0;

    for (const docId of ALL_BELGE_DOCUMENT_IDS) {
      const values = createSampleValuesForDocument(docId);
      const validation = validateEditableSnapshot(docId, values);
      assert.equal(validation.ok, true, `Belge doğrulaması başarısız: ${docId}`);

      if (validation.ok) {
        const count = Object.keys(validation.values).length;
        assert.equal(count, DOCUMENT_EDITABLE_FIELDS[docId].length);
        totalFieldsValidated += count;
      }
    }

    // Toplam tam 56 düzenlenebilir alan olmalı
    assert.equal(totalFieldsValidated, 56);
  });

  it("4. wrong-document: beklenen belge kimliği ile zarf uyuşmazlığında reddetmelidir", () => {
    const betonValues = createSampleValuesForDocument("beton-dokum-tutanagi");
    const created = createDraftEnvelope({
      documentId: "beton-dokum-tutanagi",
      values: betonValues,
      writerId: "w1",
      revision: 1,
    });

    assert.equal(created.ok, true);
    if (!created.ok) return;

    // Beton taslağını ruhsat belgesi olarak ayrıştırmayı dene
    const parsed = parseDraft(created.envelope, "insaat-ruhsati-dilekcesi");
    assert.equal(parsed.ok, false);
    if (!parsed.ok) {
      assert.equal(parsed.error, "DOCUMENT_MISMATCH");
    }
  });

  it("5. bad JSON: geçersiz JSON dizisinde CORRUPT_JSON hatası dönmelidir", () => {
    const badJson = '{"schemaVersion":1, "documentId":"beton-dokum-tutanagi", "unclosed":';
    const parsed = parseDraft(badJson);
    assert.equal(parsed.ok, false);
    if (!parsed.ok) {
      assert.equal(parsed.error, "CORRUPT_JSON");
    }
  });

  it("6. unknown/proto key ve İstifa PDF-only alan sızıntılarını engellemelidir", () => {
    const docId: BelgeDocumentId = "santiye-sefi-istifa-dilekcesi";
    const sample = createSampleValuesForDocument(docId);

    // 1. JSON parse üzerinden gelen __proto__ injection
    const rawJson = JSON.stringify(sample);
    const jsonWithProto = rawJson.replace("{", '{"__proto__": "evil", ');
    const parsedObj = JSON.parse(jsonWithProto);
    const protoResult1 = validateEditableSnapshot(docId, parsedObj);
    assert.equal(protoResult1.ok, false);
    if (!protoResult1.ok) {
      assert.equal(protoResult1.error, "PROTOTYPE_POLLUTION");
    }

    // 2. Prototip zinciri bozulmuş nesne denemesi
    const alteredProto = Object.create({ isAdmin: true });
    Object.assign(alteredProto, sample);
    const protoResult2 = validateEditableSnapshot(docId, alteredProto);
    assert.equal(protoResult2.ok, false);
    if (!protoResult2.ok) {
      assert.equal(protoResult2.error, "PROTOTYPE_POLLUTION");
    }

    // 3. constructor anahtarı denemesi
    const constructorPayload = { ...sample, constructor: "evil" };
    const constructorResult = validateEditableSnapshot(docId, constructorPayload);
    assert.equal(constructorResult.ok, false);
    if (!constructorResult.ok) {
      assert.equal(constructorResult.error, "PROTOTYPE_POLLUTION");
    }

    // 4. İstifa PDF-only sabit etiketler form verisine konamaz
    const pdfOnlyPayload = { ...sample, adres_etiket: "ADRES" };
    const pdfOnlyResult = validateEditableSnapshot(docId, pdfOnlyPayload);
    assert.equal(pdfOnlyResult.ok, false);
    if (!pdfOnlyResult.ok) {
      assert.equal(pdfOnlyResult.error, "UNKNOWN_FIELD");
    }
  });

  it("7. Kısmi (eksik) ve fazla (bilinmeyen) alanları tespit etmelidir", () => {
    const docId: BelgeDocumentId = "insaat-ruhsati-dilekcesi";
    const sample = createSampleValuesForDocument(docId);

    // Eksik alan (tarih silindi)
    const missingPayload: Record<string, string> = { ...sample };
    delete missingPayload.tarih;
    const missingResult = validateEditableSnapshot(docId, missingPayload);
    assert.equal(missingResult.ok, false);
    if (!missingResult.ok) {
      assert.equal(missingResult.error, "MISSING_FIELD");
    }

    // Fazla alan
    const extraPayload = { ...sample, sahte_alan: "test" };
    const extraResult = validateEditableSnapshot(docId, extraPayload);
    assert.equal(extraResult.ok, false);
    if (!extraResult.ok) {
      assert.equal(extraResult.error, "UNKNOWN_FIELD");
    }
  });

  it("8. Geçersiz alan veri tiplerini (sayı, nesne vb.) ve geçersiz zarf meta verilerini reddetmelidir", () => {
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const sample: Record<string, unknown> = createSampleValuesForDocument(docId);
    sample.yibf = 1234567; // Sayı verildi (string olmalı)

    const typeResult = validateEditableSnapshot(docId, sample);
    assert.equal(typeResult.ok, false);
    if (!typeResult.ok) {
      assert.equal(typeResult.error, "FIELD_TYPE_MISMATCH");
    }

    // Geçersiz revizyon (< 1)
    const validSample = createSampleValuesForDocument(docId);
    const revResult = createDraftEnvelope({
      documentId: docId,
      values: validSample,
      writerId: "w1",
      revision: 0,
    });
    assert.equal(revResult.ok, false);
    if (!revResult.ok) {
      assert.equal(revResult.error, "INVALID_REVISION");
    }
  });

  it("9. Şema parmak izi (fingerprint) uyuşmazlığında taslağı reddetmelidir", () => {
    const docId: BelgeDocumentId = "santiye-sefi-sozlesmesi";
    const sample = createSampleValuesForDocument(docId);
    const created = createDraftEnvelope({
      documentId: docId,
      values: sample,
      writerId: "w1",
      revision: 1,
    });

    assert.equal(created.ok, true);
    if (!created.ok) return;

    // Parmak izini manuel boz
    const corruptedEnvelope = {
      ...created.envelope,
      fieldSchemaFingerprint: "v1:eski_parmak_izi",
    };

    const parsed = parseDraft(corruptedEnvelope, docId);
    assert.equal(parsed.ok, false);
    if (!parsed.ok) {
      assert.equal(parsed.error, "FINGERPRINT_MISMATCH");
    }
  });

  it("10. 64 KiB ± 1 bayt güvenlik boyut sınırını (65535, 65536, 65537) doğru ölçmelidir", () => {
    const storage = new InMemoryStorage();
    const docId: BelgeDocumentId = "santiye-sefi-taahhutnamesi";
    const sample = createSampleValuesForDocument(docId);

    // Varsayılan MAX_DRAFT_BYTES (65536 bayt) sınırında tam test:
    const baseEnvelope = createDraftEnvelope({
      documentId: docId,
      values: { ...sample, adres: "" },
      writerId: "w1",
      revision: 1,
    });
    assert.equal(baseEnvelope.ok, true);
    if (!baseEnvelope.ok) return;

    const baseJsonLen = utf8ByteLength(JSON.stringify(baseEnvelope.envelope));
    const neededFor65535 = 65535 - baseJsonLen;
    const neededFor65536 = 65536 - baseJsonLen;
    const neededFor65537 = 65537 - baseJsonLen;

    const env65535 = createDraftEnvelope({
      documentId: docId,
      values: { ...sample, adres: "A".repeat(neededFor65535) },
      writerId: "w1",
      revision: 1,
    });
    assert.equal(env65535.ok, true);
    if (!env65535.ok) return;
    assert.equal(utf8ByteLength(JSON.stringify(env65535.envelope)), 65535);

    const env65536 = createDraftEnvelope({
      documentId: docId,
      values: { ...sample, adres: "A".repeat(neededFor65536) },
      writerId: "w1",
      revision: 1,
    });
    assert.equal(env65536.ok, true);
    if (!env65536.ok) return;
    assert.equal(utf8ByteLength(JSON.stringify(env65536.envelope)), 65536);

    const env65537 = createDraftEnvelope({
      documentId: docId,
      values: { ...sample, adres: "A".repeat(neededFor65537) },
      writerId: "w1",
      revision: 1,
    });
    assert.equal(env65537.ok, true);
    if (!env65537.ok) return;
    assert.equal(utf8ByteLength(JSON.stringify(env65537.envelope)), 65537);

    // 65535 bayt -> saveDraft PASS
    const res65535 = saveDraft(storage, "device", env65535.envelope);
    assert.equal(res65535.ok, true);

    // 65536 bayt -> saveDraft PASS (sınır dahil)
    const res65536 = saveDraft(storage, "device", env65536.envelope);
    assert.equal(res65536.ok, true);

    // 65537 bayt -> saveDraft FAIL (OVERSIZE_LIMIT)
    const res65537 = saveDraft(storage, "device", env65537.envelope);
    assert.equal(res65537.ok, false);
    if (!res65537.ok) {
      assert.equal(res65537.error, "OVERSIZE_LIMIT");
    }
  });

  it("11. 30 gün ± 1 ms yaş uyarı eşiğini doğru hesaplamalı ve taslağı ASLA silmemelidir", () => {
    const now = 1700000000000;
    const thirtyDaysMs = BELGE_UX_LIMITS.DRAFT_STALE_AGE_MS;

    // 30 günden 1 ms önce kaydedilmiş
    const freshStatus = draftAgeStatus(now - thirtyDaysMs + 1, now);
    assert.equal(freshStatus.isStale, false);
    assert.equal(freshStatus.warningMessage, null);

    // 30 günden 1 ms sonra kaydedilmiş
    const staleStatus = draftAgeStatus(now - thirtyDaysMs - 1, now);
    assert.equal(staleStatus.isStale, true);
    assert.notEqual(staleStatus.warningMessage, null);

    // Depodan yüklerken de taslağın korunduğu (silinmediği)
    const storage = new InMemoryStorage();
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const sample = createSampleValuesForDocument(docId);
    const created = createDraftEnvelope({
      documentId: docId,
      values: sample,
      writerId: "w1",
      revision: 1,
      savedAt: now - thirtyDaysMs - 5000,
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;

    saveDraft(storage, "device", created.envelope);

    const loaded = loadDraft(storage, "device", docId, now);
    assert.equal(loaded.ok, true);
    if (loaded.ok && loaded.draft) {
      assert.equal(loaded.draft.documentId, docId);
      assert.equal(loaded.ageStatus?.isStale, true);
    }
  });

  it("12. Depolama istisnalarını (kota) ve read-back mismatch hatalarını yakalamalıdır", () => {
    const storage = new InMemoryStorage();
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const sample = createSampleValuesForDocument(docId);
    const created = createDraftEnvelope({
      documentId: docId,
      values: sample,
      writerId: "w1",
      revision: 1,
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;

    // 1. Yazma hatası (quota)
    storage.throwOnSet = true;
    const throwResult = saveDraft(storage, "device", created.envelope);
    assert.equal(throwResult.ok, false);
    if (!throwResult.ok) {
      assert.equal(throwResult.error, "STORAGE_EXCEPTION");
    }
    storage.throwOnSet = false;

    // 2. Read-back mismatch (yazılan ile okunan eşleşmiyor)
    storage.corruptReadBack = true;
    const mismatchResult = saveDraft(storage, "device", created.envelope);
    assert.equal(mismatchResult.ok, false);
    if (!mismatchResult.ok) {
      assert.equal(mismatchResult.error, "READ_BACK_MISMATCH");
    }
  });

  it("13. Concurrency / yazar revizyon çakışmalarını tespit etmelidir", () => {
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const sample = createSampleValuesForDocument(docId);
    const envelope1 = createDraftEnvelope({
      documentId: docId,
      values: sample,
      writerId: "tab-A",
      revision: 5,
    });
    assert.equal(envelope1.ok, true);
    if (!envelope1.ok) return;

    // Başka bir sekme (tab-B) yazmaya çalışırsa
    const conflictOther = compareWriterRevision(envelope1.envelope, "tab-B", 6);
    assert.equal(conflictOther.isConflict, true);
    assert.equal(conflictOther.reason, "CONCURRENT_WRITER");

    // Aynı sekme daha eski bir revizyon yazmaya çalışırsa
    const conflictStale = compareWriterRevision(envelope1.envelope, "tab-A", 4);
    assert.equal(conflictStale.isConflict, true);
    assert.equal(conflictStale.reason, "STALE_REVISION");

    // Aynı sekme ileri revizyon yazarsa çakışma yok
    const okNext = compareWriterRevision(envelope1.envelope, "tab-A", 6);
    assert.equal(okNext.isConflict, false);
    assert.equal(okNext.reason, null);
  });

  it("14. Session vs. Device ad alanı (namespace) ve anahtar ayrılığını korumalıdır", () => {
    const storage = new InMemoryStorage();
    const docId: BelgeDocumentId = "insaat-ruhsati-dilekcesi";

    const deviceKey = getKeyForMode("device", docId);
    const sessionKey = getKeyForMode("session", docId);
    assert.notEqual(deviceKey, sessionKey);
    assert.equal(deviceKey.includes("device"), true);
    assert.equal(sessionKey.includes("session"), true);

    const deviceConsentKey = getConsentKeyForMode("device");
    const sessionConsentKey = getConsentKeyForMode("session");
    assert.notEqual(deviceConsentKey, sessionConsentKey);

    // Cihaz modunda kaydet
    const sample = createSampleValuesForDocument(docId);
    const created = createDraftEnvelope({
      documentId: docId,
      values: sample,
      writerId: "w1",
      revision: 1,
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;

    saveDraft(storage, "device", created.envelope);

    // Session modundan okumayı dene -> boş dönmeli
    const sessionLoad = loadDraft(storage, "session", docId);
    assert.equal(sessionLoad.ok, true);
    if (sessionLoad.ok) {
      assert.equal(sessionLoad.draft, null);
    }

    // Device modundan oku -> dolu dönmeli
    const deviceLoad = loadDraft(storage, "device", docId);
    assert.equal(deviceLoad.ok, true);
    if (deviceLoad.ok) {
      assert.notEqual(deviceLoad.draft, null);
    }

    // Silme işlemi de yalnızca ilgili modu etkilemeli
    const delResult = deleteDraft(storage, "device", docId);
    assert.equal(delResult.ok, true);

    const afterDel = loadDraft(storage, "device", docId);
    assert.equal(afterDel.ok, true);
    if (afterDel.ok) {
      assert.equal(afterDel.draft, null);
    }
  });

  it("15. İzin (consent) saklama, yükleme ve temizleme işlemlerini hatasız yürütmelidir", () => {
    const storage = new InMemoryStorage();

    assert.equal(loadDraftConsent(storage, "device"), null);

    saveDraftConsent(storage, "device", "device");
    assert.equal(loadDraftConsent(storage, "device"), "device");

    saveDraftConsent(storage, "session", "dismissed");
    assert.equal(loadDraftConsent(storage, "session"), "dismissed");
    assert.equal(loadDraftConsent(storage, "device"), "device"); // Bağımsızlık

    clearDraftConsent(storage, "device");
    assert.equal(loadDraftConsent(storage, "device"), null);
    assert.equal(loadDraftConsent(storage, "session"), "dismissed");
  });

  it("16. (D01-S01) loadDraft depodaki 64 KiB üstü aşırı büyük veriyi ayrıştırmadan OVERSIZE_LIMIT ile reddetmelidir", () => {
    const storage = new InMemoryStorage();
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const sample = createSampleValuesForDocument(docId);
    const created = createDraftEnvelope({
      documentId: docId,
      values: sample,
      writerId: "w1",
      revision: 1,
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;

    // 70 KiB büyüklüğünde veri zarfı
    const largePayload = JSON.stringify({
      ...created.envelope,
      values: { ...sample, yer: "x".repeat(70000) },
    });
    storage.setItem(getKeyForMode("device", docId), largePayload);

    const loadRes = loadDraft(storage, "device", docId);
    assert.equal(loadRes.ok, false);
    if (!loadRes.ok) {
      assert.equal(loadRes.error, "OVERSIZE_LIMIT");
    }
  });

  it("17. (D01-S02) parseDraft prototip zincirinden kalıtılmış zarf nesnesini PROTOTYPE_POLLUTION ile reddetmelidir", () => {
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const sample = createSampleValuesForDocument(docId);
    const created = createDraftEnvelope({
      documentId: docId,
      values: sample,
      writerId: "w1",
      revision: 1,
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;

    const inheritedEnvelope = Object.create(created.envelope);
    const parseRes = parseDraft(inheritedEnvelope, docId);
    assert.equal(parseRes.ok, false);
    if (!parseRes.ok) {
      assert.equal(parseRes.error, "PROTOTYPE_POLLUTION");
    }
  });

  it("18. (D01-S03) parseDraft üst düzey __proto__ ve yasaklı anahtarları PROTOTYPE_POLLUTION ile reddetmelidir", () => {
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const sample = createSampleValuesForDocument(docId);
    const created = createDraftEnvelope({
      documentId: docId,
      values: sample,
      writerId: "w1",
      revision: 1,
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;

    const raw = JSON.stringify(created.envelope).replace("{", '{"__proto__":{"audit":true},');
    const parseRes = parseDraft(raw, docId);
    assert.equal(parseRes.ok, false);
    if (!parseRes.ok) {
      assert.equal(parseRes.error, "PROTOTYPE_POLLUTION");
    }
  });

  it("19. (D01-S05) deleteDraft silme sonrası doğrulama okuması hata fırlatırsa STORAGE_EXCEPTION dönmeli ve sessizce onaylamamalıdır", () => {
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const fakeStorage: StorageLike = {
      getItem: () => {
        throw new Error("READ_DENIED_TEST");
      },
      setItem: () => {},
      removeItem: () => {},
    };

    const delRes = deleteDraft(fakeStorage, "device", docId);
    assert.equal(delRes.ok, false);
    if (!delRes.ok) {
      assert.equal(delRes.error, "STORAGE_EXCEPTION");
    }
  });

  it("20. (D01-S05) deleteDraft silme sonrası kayıt hala depoda görünüyorsa READ_BACK_MISMATCH dönmelidir", () => {
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const fakeStorage: StorageLike = {
      getItem: () => '{"still":"here"}',
      setItem: () => {},
      removeItem: () => {}, // silme komutunu görmezden gelen sahte depo
    };

    const delRes = deleteDraft(fakeStorage, "device", docId);
    assert.equal(delRes.ok, false);
    if (!delRes.ok) {
      assert.equal(delRes.error, "READ_BACK_MISMATCH");
    }
  });

  it("21. (D01-F02/R01) loadDraft bozuk JSON ile karşılaştığında CORRUPT_JSON dönmeli ve depodaki ham kaydı değiştirmemelidir", () => {
    const storage = new InMemoryStorage();
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const key = getKeyForMode("device", docId);
    const corruptData = "{AUDIT incompatible saved data";
    storage.setItem(key, corruptData);

    const loadRes = loadDraft(storage, "device", docId);
    assert.equal(loadRes.ok, false);
    if (!loadRes.ok) {
      assert.equal(loadRes.error, "CORRUPT_JSON");
    }
    // Depodaki ham verinin aynen korunduğunun teyidi
    assert.equal(storage.getItem(key), corruptData);
  });

  it("22. (D01-F08/R09) saveDraftConsent depolama yazma hatası (kota) durumunda STORAGE_EXCEPTION dönmelidir", () => {
    const storage = new InMemoryStorage();
    storage.throwOnSet = true;

    const consentRes = saveDraftConsent(storage, "device", "device");
    assert.equal(consentRes.ok, false);
    if (!consentRes.ok) {
      assert.equal(consentRes.error, "STORAGE_EXCEPTION");
    }
  });
});

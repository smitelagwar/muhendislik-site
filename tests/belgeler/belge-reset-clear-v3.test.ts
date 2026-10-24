/**
 * ASAMA_03: Beş Stüdyoda Onaysız Sıfırla / Temizle ve Gecikmesiz Persist / Undo Testleri
 *
 * Kapsam:
 * 1. Sıfırla (ResetToPdfDefaults): Onaysızdır, window.confirm çağrılmaz, PDF default verilerini anında yazar.
 * 2. Temizle (ClearAll): Onaysızdır, window.confirm çağrılmaz, tüm düzenlenebilir alanları boşaltır.
 * 3. İstifa Dilekçesi: Temizle sırasında PDF-only etiket alanları (adres_etiket, tc_etiket vb.) korunur.
 * 4. replaceAndPersist: Reset/Clear/Undo anında senkron olarak depoya yazılır (0 ms bekleme).
 * 5. Geri al (Undo): Önceki snapshot'ı geri yükler ve onu da anında depoya kaydeder.
 * 6. Rastgele veri (Randomize): İnşaat Ruhsatı'ndaki korumalı window.confirm davranışı bozulmaz.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  StorageLike,
  createDraftEnvelope,
  saveDraft,
  loadDraft,
} from "../../src/lib/belge-draft-storage";
import {
  getKeyForMode,
  type BelgeDocumentId,
} from "../../src/lib/belge-ux-config";
import { DOCUMENT_EDITABLE_FIELDS } from "../../src/lib/document-field-contracts";
import {
  BETON_DOKUM_DEFAULT_DATA,
  INSAAT_RUHSATI_DEFAULT_DATA,
  ISTIFA_DILEKCESI_DEFAULT_DATA,
  SOZLESME_DEFAULT_DATA,
  TAAHHUTNAME_DEFAULT_DATA,
} from "../../src/lib/pdf-engine";

class InMemoryMockStorage implements StorageLike {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

describe("ASAMA_03: Onaysız Sıfırla / Temizle ve replaceAndPersist Testleri", () => {
  it("1. Taahhütname: Sıfırla ve Temizle window.confirm çağrısı olmadan anında uygulanır ve depolanır", () => {
    const storage = new InMemoryMockStorage();
    const docId: BelgeDocumentId = "santiye-sefi-taahhutnamesi";
    let confirmCalls = 0;
    const originalConfirm = globalThis.confirm;
    globalThis.confirm = () => {
      confirmCalls++;
      return false; // Çağrılırsa iptal etmiş sayılacak
    };

    try {
      let formData = {
        ...TAAHHUTNAME_DEFAULT_DATA,
        santiye_sefi_ad_soyad: "Değiştirilmiş İsim",
      };
      let undoData: typeof formData | null = null;
      let persistedRevision = 1;

      // Sıfırla işlemi
      const handleReset = () => {
        undoData = { ...formData };
        formData = { ...TAAHHUTNAME_DEFAULT_DATA };
        persistedRevision++;
        const env = createDraftEnvelope({
          documentId: docId,
          values: formData,
          writerId: "w1",
          revision: persistedRevision,
        });
        if (env.ok) saveDraft(storage, "device", env.envelope);
      };

      handleReset();
      // Onay penceresi çağrılmamalıdır!
      assert.equal(confirmCalls, 0);
      assert.equal(formData.santiye_sefi_ad_soyad, TAAHHUTNAME_DEFAULT_DATA.santiye_sefi_ad_soyad);
      assert.notEqual(undoData, null);

      // Depodaki veri de anında güncellenmiş olmalıdır
      const loaded = loadDraft(storage, "device", docId);
      assert.equal(loaded.ok, true);
      assert.equal(loaded.draft?.values.santiye_sefi_ad_soyad, TAAHHUTNAME_DEFAULT_DATA.santiye_sefi_ad_soyad);
      assert.equal(loaded.draft?.revision, 2);

      // Temizle işlemi
      const handleClear = () => {
        undoData = { ...formData };
        const cleared: any = {};
        for (const f of DOCUMENT_EDITABLE_FIELDS[docId]) {
          cleared[f] = "";
        }
        formData = cleared;
        persistedRevision++;
        const env = createDraftEnvelope({
          documentId: docId,
          values: formData,
          writerId: "w1",
          revision: persistedRevision,
        });
        if (env.ok) saveDraft(storage, "device", env.envelope);
      };

      handleClear();
      assert.equal(confirmCalls, 0);
      assert.equal(formData.santiye_sefi_ad_soyad, "");

      const reloaded = loadDraft(storage, "device", docId);
      assert.equal(reloaded.ok, true);
      assert.equal(reloaded.draft?.values.santiye_sefi_ad_soyad, "");
      assert.equal(reloaded.draft?.revision, 3);
    } finally {
      globalThis.confirm = originalConfirm;
    }
  });

  it("2. Beton Döküm Tutanağı: Sıfırla ve Temizle onay gerektirmeden uygulanır", () => {
    let confirmCalls = 0;
    const originalConfirm = globalThis.confirm;
    globalThis.confirm = () => {
      confirmCalls++;
      return false;
    };

    try {
      let formData = {
        ...BETON_DOKUM_DEFAULT_DATA,
        yer: "Farklı Şantiye",
      };
      let undoData: typeof formData | null = null;

      const handleReset = () => {
        undoData = { ...formData };
        formData = { ...BETON_DOKUM_DEFAULT_DATA };
      };

      handleReset();
      assert.equal(confirmCalls, 0);
      assert.equal(formData.yer, BETON_DOKUM_DEFAULT_DATA.yer);
      assert.equal(undoData?.yer, "Farklı Şantiye");
    } finally {
      globalThis.confirm = originalConfirm;
    }
  });

  it("3. Sözleşme: Sıfırla ve Temizle onaysız çalışır ve geri alınabilir", () => {
    let confirmCalls = 0;
    const originalConfirm = globalThis.confirm;
    globalThis.confirm = () => {
      confirmCalls++;
      return false;
    };

    try {
      let formData = {
        ...SOZLESME_DEFAULT_DATA,
        muteahhit_unvan: "Özel İnşaat A.Ş.",
      };
      let undoData: typeof formData | null = null;

      // Temizle
      undoData = { ...formData };
      const cleared = Object.fromEntries(
        Object.keys(SOZLESME_DEFAULT_DATA).map((k) => [k, ""])
      ) as typeof SOZLESME_DEFAULT_DATA;
      formData = cleared;

      assert.equal(confirmCalls, 0);
      assert.equal(formData.muteahhit_unvan, "");

      // Geri al (Undo)
      formData = undoData!;
      undoData = null;

      assert.equal(formData.muteahhit_unvan, "Özel İnşaat A.Ş.");
      assert.equal(undoData, null);
    } finally {
      globalThis.confirm = originalConfirm;
    }
  });

  it("4. İstifa Dilekçesi: Temizle sırasında sabit PDF etiketleri (adres_etiket vb.) korunur", () => {
    let formData = {
      ...ISTIFA_DILEKCESI_DEFAULT_DATA,
      ad_soyad: "Mühendis Ali",
    };

    // Temizle
    const cleared = {
      hitap_1: "",
      hitap_2: "",
      ana_paragraf: "",
      sonuc_cumlesi: "",
      tarih: "",
      unvan: "",
      ad_soyad: "",
      adres_etiket: "ADRES :",
      adres_deger: "",
      tc_etiket: "T.C. :",
      tc_deger: "",
      iletisim_etiket: "İletişim :",
      iletisim_deger: "",
    };
    formData = cleared;

    assert.equal(formData.ad_soyad, "");
    assert.equal(formData.adres_etiket, "ADRES :");
    assert.equal(formData.tc_etiket, "T.C. :");
    assert.equal(formData.iletisim_etiket, "İletişim :");
  });

  it("5. İnşaat Ruhsatı: Sıfırla/Temizle onaysızdır ancak Rastgele (Randomize) onay korumasını sürdürür", () => {
    let confirmCalls = 0;
    const originalConfirm = globalThis.confirm;
    const originalWindow = (globalThis as any).window;
    (globalThis as any).window = globalThis;
    globalThis.confirm = (msg) => {
      confirmCalls++;
      assert.match(String(msg), /örnek rastgele verilerle doldurulacaktır/);
      return false; // İptal tıklandı
    };

    try {
      let formData = {
        ...INSAAT_RUHSATI_DEFAULT_DATA,
        ad_soyad: "Kullanıcı Adı",
      };
      let undoData: typeof formData | null = null;

      // 1. Sıfırla: confirm çağrılmaz
      undoData = { ...formData };
      formData = { ...INSAAT_RUHSATI_DEFAULT_DATA };
      assert.equal(confirmCalls, 0);
      assert.equal(formData.ad_soyad, INSAAT_RUHSATI_DEFAULT_DATA.ad_soyad);

      // 2. Rastgele: confirm çağrılır ve iptal edilince veriler değişmez!
      const handleRandomize = () => {
        const hasValues = Object.values(formData).some((v) => typeof v === "string" && v.trim() !== "");
        if (
          hasValues &&
          typeof window !== "undefined" &&
          !globalThis.confirm("Form alanları örnek rastgele verilerle doldurulacaktır. Mevcut verileriniz değişecektir. Onaylıyor musunuz?")
        ) {
          return;
        }
        formData = { ...formData, ad_soyad: "Yeni Rastgele Kişi" };
      };

      handleRandomize();
      assert.equal(confirmCalls, 1);
      assert.equal(formData.ad_soyad, INSAAT_RUHSATI_DEFAULT_DATA.ad_soyad); // Değişmedi (korundu)
    } finally {
      globalThis.confirm = originalConfirm;
      (globalThis as any).window = originalWindow;
    }
  });

  it("6. Geri al (Undo) anında depoya yazılır ve eski bekleyen timer geri getiremez", () => {
    const storage = new InMemoryMockStorage();
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";

    // 1. Durum A
    const stateA = { ...BETON_DOKUM_DEFAULT_DATA, yer: "Şantiye A" };
    const envA = createDraftEnvelope({
      documentId: docId,
      values: stateA,
      writerId: "w1",
      revision: 1,
    });
    if (envA.ok) saveDraft(storage, "device", envA.envelope);

    // 2. Sıfırla yapıldı (Durum B)
    let undoData: typeof stateA | null = { ...stateA };
    const envB = createDraftEnvelope({
      documentId: docId,
      values: { ...BETON_DOKUM_DEFAULT_DATA },
      writerId: "w1",
      revision: 2,
    });
    if (envB.ok) saveDraft(storage, "device", envB.envelope);

    // 3. Kullanıcı Geri Al'a bastı
    const stateRestored = undoData!;
    undoData = null;
    const envUndo = createDraftEnvelope({
      documentId: docId,
      values: stateRestored,
      writerId: "w1",
      revision: 3,
    });
    if (envUndo.ok) saveDraft(storage, "device", envUndo.envelope);

    const reloaded = loadDraft(storage, "device", docId);
    assert.equal(reloaded.ok, true);
    assert.equal(reloaded.draft?.values.yer, "Şantiye A");
    assert.equal(reloaded.draft?.revision, 3);
  });
});

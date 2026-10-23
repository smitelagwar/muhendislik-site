/**
 * Belge Stüdyosu — Akıllı Bölüm (Akordeon) Birim Test Paketi (ASAMA_05)
 *
 * Doğrulanan Kurallar:
 * 1. 10/10 Beton alanı tam olarak 1 bölüme ait olmalıdır (çift veya yetim alan yok).
 * 2. Dolu alan sayacı (filled count) boşlukları ve tanımsız alanları doğru hesaplamalıdır.
 * 3. Tercih saklama motoru (loadCollapsedSections / saveCollapsedSections) güvenli ve izoledir.
 * 4. Bozuk/geçersiz depolama verisinde varsayılan all-open (boş set) fallback dönmelidir.
 * 5. findSectionForField ve getSectionsForDocument doğru referansları çözmelidir.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DOCUMENT_EDITABLE_FIELDS } from "../../src/lib/document-field-contracts";
import {
  calculateSectionFilledCount,
  findSectionForField,
  getSectionsForDocument,
} from "../../src/lib/belge-studio-sections";
import {
  loadCollapsedSections,
  saveCollapsedSections,
} from "../../src/lib/belge-section-preferences";
import type { StorageLike } from "../../src/lib/belge-draft-storage";

class InMemoryStorage implements StorageLike {
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
  clear(): void {
    this.map.clear();
  }
}

describe("ASAMA_05: Akordeon Bölüm Eşleştirme ve Tercih Birim Testleri", () => {
  it("1. Beton Döküm Tutanağı 10/10 alan tam olarak tek bir bölüme ait olmalıdır", () => {
    const docId = "beton-dokum-tutanagi";
    const expectedFields = DOCUMENT_EDITABLE_FIELDS[docId];
    const sections = getSectionsForDocument(docId);

    assert.equal(sections.length, 4, "Beton stüdyosu tam 4 bölüme sahip olmalıdır");

    const allMappedFields: string[] = [];
    const sectionIds = new Set<string>();

    for (const sec of sections) {
      assert.ok(sec.id && sec.id.length > 0, "Bölüm ID'si boş olamaz");
      assert.ok(!sectionIds.has(sec.id), `Bölüm ID'si benzersiz olmalıdır: ${sec.id}`);
      sectionIds.add(sec.id);

      assert.ok(sec.title && sec.title.length > 0, "Bölüm başlığı boş olamaz");
      assert.ok(sec.fields.length > 0, `Bölümde en az bir alan olmalıdır: ${sec.id}`);

      for (const field of sec.fields) {
        allMappedFields.push(field);
      }
    }

    // 10 alan birebir küme eşitliği
    assert.equal(allMappedFields.length, expectedFields.length, "Toplam alan sayısı 10 olmalıdır");
    const mappedSet = new Set(allMappedFields);
    assert.equal(mappedSet.size, allMappedFields.length, "Hiçbir alan birden fazla bölüme bağlanamaz");

    for (const exp of expectedFields) {
      assert.ok(mappedSet.has(exp), `Alan haritada eksik (yetim): ${exp}`);
    }
  });

  it("2. findSectionForField alanı doğru bölüme çözümlemelidir", () => {
    const docId = "beton-dokum-tutanagi";
    const sec1 = findSectionForField(docId, "tutanak_alt_baslik");
    assert.equal(sec1?.id, "belge-kayit");

    const sec2 = findSectionForField(docId, "yer");
    assert.equal(sec2?.id, "santiye-yeri");

    const sec3 = findSectionForField(docId, "olay_aciklamasi");
    assert.equal(sec3?.id, "olay-gozlem");

    const sec4 = findSectionForField(docId, "laboratuvar");
    assert.equal(sec4?.id, "imzaci-taraflar");

    const secNone = findSectionForField(docId, "olmayan_alan");
    assert.equal(secNone, null);
  });

  it("3. Dolu alan sayacı boş string ve salt boşlukları doğru saymalıdır", () => {
    const docId = "beton-dokum-tutanagi";
    const sec = getSectionsForDocument(docId)[0]; // belge-kayit: 3 alan

    // Tamamı boş
    const count1 = calculateSectionFilledCount(sec, {
      tutanak_alt_baslik: "",
      tarih: "",
      yibf: "",
    });
    assert.equal(count1.filled, 0);
    assert.equal(count1.total, 3);

    // Biri dolu, biri salt boşluk
    const count2 = calculateSectionFilledCount(sec, {
      tutanak_alt_baslik: "Alt Başlık",
      tarih: "   ",
      yibf: "",
    });
    assert.equal(count2.filled, 1);
    assert.equal(count2.total, 3);

    // Tümü dolu
    const count3 = calculateSectionFilledCount(sec, {
      tutanak_alt_baslik: "Alt Başlık",
      tarih: "10.08.2026",
      yibf: "1234567",
    });
    assert.equal(count3.filled, 3);
    assert.equal(count3.total, 3);
  });

  it("4. Tercih motoru kapalı bölümleri kaydetmeli ve kayıpsız okumalıdır", () => {
    const storage = new InMemoryStorage();
    const docId = "beton-dokum-tutanagi";

    // İlk ziyaret: boş
    const initial = loadCollapsedSections(storage, docId);
    assert.equal(initial.size, 0);

    // İki bölümü kapat ve kaydet
    const toSave = new Set(["santiye-yeri", "imzaci-taraflar"]);
    saveCollapsedSections(storage, docId, toSave);

    // Geri oku
    const loaded = loadCollapsedSections(storage, docId);
    assert.equal(loaded.size, 2);
    assert.ok(loaded.has("santiye-yeri"));
    assert.ok(loaded.has("imzaci-taraflar"));
    assert.ok(!loaded.has("belge-kayit"));
  });

  it("5. Bozuk veya geçersiz depolama verisinde güvenle boş set (all-open) dönmelidir", () => {
    const storage = new InMemoryStorage();
    const docId = "beton-dokum-tutanagi";
    const key = `belgeler:ux:sections:v1:${docId}`;

    // Bozuk JSON
    storage.setItem(key, "{ invalid json");
    const res1 = loadCollapsedSections(storage, docId);
    assert.equal(res1.size, 0);

    // Array yerine nesne
    storage.setItem(key, JSON.stringify({ notAnArray: true }));
    const res2 = loadCollapsedSections(storage, docId);
    assert.equal(res2.size, 0);

    // Sayı dizisi veya geçersiz tipler filtrelenmeli (geçerli bölüm korunmalı)
    storage.setItem(key, JSON.stringify([123, null, "belge-kayit", ""]));
    const res3 = loadCollapsedSections(storage, docId);
    assert.equal(res3.size, 1);
    assert.ok(res3.has("belge-kayit"));
  });

  it("6. ASAMA_06: 5 belgenin 56 düzenlenebilir alanının tamamı eksiksiz ve çakışmasız haritalanmalıdır", () => {
    const documentIds = [
      "beton-dokum-tutanagi",
      "insaat-ruhsati-dilekcesi",
      "santiye-sefi-istifa-dilekcesi",
      "santiye-sefi-sozlesmesi",
      "santiye-sefi-taahhutnamesi",
    ] as const;

    let totalMappedFieldsCount = 0;

    for (const docId of documentIds) {
      const expectedFields = DOCUMENT_EDITABLE_FIELDS[docId];
      const sections = getSectionsForDocument(docId);
      assert.ok(sections.length >= 3, `${docId} en az 3 bölüme sahip olmalıdır`);

      const mappedFields: string[] = [];
      const sectionIds = new Set<string>();

      for (const sec of sections) {
        assert.ok(sec.id && sec.id.length > 0, `${docId}: Bölüm ID boş olamaz`);
        assert.ok(!sectionIds.has(sec.id), `${docId}: Bölüm ID benzersiz olmalıdır (${sec.id})`);
        sectionIds.add(sec.id);

        assert.ok(sec.title && sec.title.length > 0, `${docId}: Bölüm başlığı boş olamaz`);
        assert.ok(sec.fields.length > 0, `${docId}: Bölüm ${sec.id} en az 1 alana sahip olmalıdır`);

        for (const field of sec.fields) {
          mappedFields.push(field);
          // findSectionForField ters yön doğrulaması
          const found = findSectionForField(docId, field);
          assert.equal(found?.id, sec.id, `${docId} - ${field} doğru bölüme (${sec.id}) çözülmelidir`);
        }
      }

      // Sayı ve küme eşitliği
      assert.equal(
        mappedFields.length,
        expectedFields.length,
        `${docId} beklenen alan sayısı (${expectedFields.length}) ile haritalanan (${mappedFields.length}) uyuşmalıdır`
      );

      const mappedSet = new Set(mappedFields);
      assert.equal(mappedSet.size, mappedFields.length, `${docId}: Çift tanımlı alan olamaz`);

      for (const exp of expectedFields) {
        assert.ok(mappedSet.has(exp), `${docId}: Alan eksik (yetim): ${exp}`);
      }

      totalMappedFieldsCount += mappedFields.length;
    }

    // 56 alanın tamamı
    assert.equal(totalMappedFieldsCount, 56, "5 belgenin toplam 56 düzenlenebilir alanı haritalanmış olmalıdır");
  });

  it("7. ASAMA_06: İstifa Dilekçesi PDF-only alanları bölümlere sızmamalıdır", () => {
    const sections = getSectionsForDocument("santiye-sefi-istifa-dilekcesi");
    const forbidden = ["adres_etiket", "tc_etiket", "iletisim_etiket"];

    for (const sec of sections) {
      for (const field of sec.fields) {
        assert.ok(
          !forbidden.includes(field),
          `PDF-only etiket alanı akordeon bölümüne sızamaz: ${field}`
        );
      }
    }
  });

  it("8. ASAMA_06: Farklı belgeler arasında tercih depolama izolasyonu", () => {
    const storage = new InMemoryStorage();
    const docA = "insaat-ruhsati-dilekcesi";
    const docB = "santiye-sefi-sozlesmesi";

    saveCollapsedSections(storage, docA, new Set(["talep-metni", "dilekce-sahibi"]));
    saveCollapsedSections(storage, docB, new Set(["isyeri-bilgileri"]));

    const loadedA = loadCollapsedSections(storage, docA);
    const loadedB = loadCollapsedSections(storage, docB);

    assert.equal(loadedA.size, 2);
    assert.ok(loadedA.has("talep-metni"));
    assert.ok(loadedA.has("dilekce-sahibi"));
    assert.ok(!loadedA.has("isyeri-bilgileri"));

    assert.equal(loadedB.size, 1);
    assert.ok(loadedB.has("isyeri-bilgileri"));
    assert.ok(!loadedB.has("talep-metni"));
  });
});

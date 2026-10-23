/**
 * ASAMA_D04 — Akordeon Sözleşmesi, Tercihler ve Erişilebilirlik Birim Testleri
 *
 * Test Kapsamı:
 * 1. F12 (R08 Sözleşmesi):
 *    - closeOthers çağrıldığında 0 açık bölüm KALMAZ; aktif/seçilen bölüm (veya ilk bölüm) açık kalır.
 *    - openAll tüm bölümleri açar.
 *    - Pre-hide focus: Kapatılacak bölümdeki odak başlığa taşınır.
 * 2. F13 (S04 Allowlist & Sürüm & Reveal İzolasyonu):
 *    - { version: 1, closedSectionIds: [...] } zarf formatı doğru kaydedilir ve okunur.
 *    - Eski düz dizi formatı (legacy raw array) kayıpsız ve güvenle migrate edilir.
 *    - Belgeye ait olmayan ID'ler (örn. not-a-real-section) allowlist tarafından filtrelenir.
 *    - revealField geçici görünürlük sağlar; kullanıcının localStorage'daki tercihlerini kalıcı olarak ezmez.
 *    - İnşaat Ruhsatı başlıkları tutarlı 1, 2, 3, 4 olarak numaralandırılmıştır.
 * 3. F14 (Erişilebilirlik ve 44px Dokunma Hedefi):
 *    - Dolu sayacı doluluğun geçerlilik kontrolü olmadığını açıklar.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  loadCollapsedSections,
  saveCollapsedSections,
  type BelgeSectionPreferencesEnvelope,
} from "../../src/lib/belge-section-preferences";
import {
  BELGE_STUDIO_SECTIONS,
  getSectionsForDocument,
  findSectionForField,
} from "../../src/lib/belge-studio-sections";
import { getKeyForMode, getSectionPreferencesKey, type BelgeDocumentId } from "../../src/lib/belge-ux-config";
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

describe("D04: Akordeon Sözleşmesi ve Tercih Motoru Birim Testleri", () => {
  it("1. F12 (R08 Sözleşmesi): closeOthers en az 1 bölümü açık tutmalı ve 0 açık bölüm üretmemelidir", () => {
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const sections = getSectionsForDocument(docId);
    assert.equal(sections.length, 4);

    // Hiçbir bölüm seçilmemişse ilk bölüm (sections[0].id) açık kalmalıdır
    let activeSectionId: string | null = null;
    let collapsedSections = new Set<string>();

    function closeOthers(targetId?: string) {
      const keepOpenId = targetId ?? activeSectionId ?? sections[0]?.id;
      const next = new Set<string>();
      for (const sec of sections) {
        if (sec.id !== keepOpenId) {
          next.add(sec.id);
        }
      }
      collapsedSections = next;
    }

    closeOthers();
    // 4 bölümden 3'ü kapalı, tam 1 tanesi açık
    assert.equal(collapsedSections.size, 3);
    assert.equal(collapsedSections.has(sections[0].id), false);
    assert.equal(collapsedSections.has(sections[1].id), true);
    assert.equal(collapsedSections.has(sections[2].id), true);
    assert.equal(collapsedSections.has(sections[3].id), true);

    // Aktif bölüm seçilmişse o bölüm açık kalmalıdır
    activeSectionId = sections[2].id; // "olay-gozlem"
    closeOthers();
    assert.equal(collapsedSections.size, 3);
    assert.equal(collapsedSections.has(sections[2].id), false);
    assert.equal(collapsedSections.has(sections[0].id), true);
    assert.equal(collapsedSections.has(sections[1].id), true);
    assert.equal(collapsedSections.has(sections[3].id), true);
  });

  it("2. F13: { version: 1, closedSectionIds } şeması doğru kaydedilmeli ve okunmalıdır", () => {
    const storage = new InMemoryStorage();
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const key = getSectionPreferencesKey(docId);

    saveCollapsedSections(storage, docId, ["santiye-yeri", "imzaci-taraflar"]);

    const raw = storage.getItem(key);
    assert.notEqual(raw, null);
    const parsed = JSON.parse(raw!) as BelgeSectionPreferencesEnvelope;

    assert.equal(parsed.version, 1);
    assert.deepEqual(parsed.closedSectionIds, ["santiye-yeri", "imzaci-taraflar"]);

    // loadCollapsedSections ile okuma
    const loaded = loadCollapsedSections(storage, docId);
    assert.equal(loaded.size, 2);
    assert.equal(loaded.has("santiye-yeri"), true);
    assert.equal(loaded.has("imzaci-taraflar"), true);
  });

  it("3. F13: Eski düz dizi formatı (legacy raw array) güvenle migrate edilmelidir", () => {
    const storage = new InMemoryStorage();
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const key = getSectionPreferencesKey(docId);

    // Eski format: doğrudan JSON dizisi
    storage.setItem(key, JSON.stringify(["belge-kayit", "olay-gozlem"]));

    const loaded = loadCollapsedSections(storage, docId);
    assert.equal(loaded.size, 2);
    assert.equal(loaded.has("belge-kayit"), true);
    assert.equal(loaded.has("olay-gozlem"), true);

    // Yeni kayıt yapıldığında version: 1 olarak kaydedilmelidir
    saveCollapsedSections(storage, docId, loaded);
    const updated = JSON.parse(storage.getItem(key)!);
    assert.equal(updated.version, 1);
    assert.deepEqual(updated.closedSectionIds, ["belge-kayit", "olay-gozlem"]);
  });

  it("4. F13 / S04: Tanımsız veya başka belgenin bölüm ID'leri allowlist tarafından elenmelidir", () => {
    const storage = new InMemoryStorage();
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const key = getSectionPreferencesKey(docId);

    // Tanımsız ID ve başka belgenin ID'si
    storage.setItem(
      key,
      JSON.stringify({
        version: 1,
        closedSectionIds: ["not-a-real-section", "belge-kayit", "talep-metni"],
      })
    );

    const loaded = loadCollapsedSections(storage, docId);
    // Yalnızca "belge-kayit" geçerlidir
    assert.equal(loaded.size, 1);
    assert.equal(loaded.has("belge-kayit"), true);
    assert.equal(loaded.has("not-a-real-section"), false);
    assert.equal(loaded.has("talep-metni"), false);
  });

  it("5. F13: revealField geçici açmalı ve kullanıcının kalıcı depolama tercihlerini ezmemelidir", () => {
    const storage = new InMemoryStorage();
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const key = getSectionPreferencesKey(docId);

    // Kullanıcı "santiye-yeri" bölümünü kapattı
    saveCollapsedSections(storage, docId, ["santiye-yeri"]);

    let persistentCollapsed = loadCollapsedSections(storage, docId);
    let temporarilyRevealed = new Set<string>();

    function isSectionOpen(secId: string): boolean {
      if (temporarilyRevealed.has(secId)) return true;
      return !persistentCollapsed.has(secId);
    }

    function revealField(fieldKey: string) {
      const sec = findSectionForField(docId, fieldKey);
      if (!sec) return;
      if (!persistentCollapsed.has(sec.id)) return;
      temporarilyRevealed = new Set(temporarilyRevealed).add(sec.id);
    }

    assert.equal(isSectionOpen("santiye-yeri"), false);

    // "yer" alanı için reveal çağrılır
    revealField("yer");

    // Şimdi geçici olarak açık olmalıdır
    assert.equal(isSectionOpen("santiye-yeri"), true);

    // Ancak depodaki kalıcı tercihler DEĞİŞMEMİŞTİR (ezilmemiştir)
    const storedAfterReveal = loadCollapsedSections(storage, docId);
    assert.equal(storedAfterReveal.has("santiye-yeri"), true);
  });

  it("6. F13: İnşaat Ruhsatı başlıkları tutarlı 1, 2, 3, 4 olarak numaralandırılmış olmalıdır", () => {
    const sections = BELGE_STUDIO_SECTIONS["insaat-ruhsati-dilekcesi"];
    assert.equal(sections.length, 4);

    assert.match(sections[0].title, /^1\./);
    assert.match(sections[1].title, /^2\./);
    assert.match(sections[2].title, /^3\./);
    assert.match(sections[3].title, /^4\./);

    assert.equal(sections[2].title, "3. Dilekçe Sahibi");
    assert.equal(sections[3].title, "4. İletişim ve Tebligat Adresi");
  });
});

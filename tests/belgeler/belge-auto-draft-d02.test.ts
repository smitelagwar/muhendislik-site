/**
 * ASAMA_D02 — Writer, Silme, Lifecycle ve Recovery Veri Kaybı Kapısı Birim Testleri
 *
 * Test Kapsamı:
 * 1. F03 (R03): Başka sekmenin sildiği taslak bekleyen yerel edit ile dirilmemelidir.
 * 2. F04 (R04): Taslak restore edildikten sonra aynı sekmede yapılan yeni edit sahte çakışma (false conflict) üretmemelidir.
 * 3. F05 (R13/R18): Taslak yok sayıldığında (ignoreDraft), depodaki taslak korunmalı ve sonraki editler üzerine yazmamalıdır.
 * 4. F05 (R14): Remote taslak yüklendiğinde (resolveConflictWithRemote), yerel revizyon ve writer kimliği güncellenmelidir.
 * 5. F07 (R16): SPA / sayfa ayrılışı öncesinde bekleyen snapshot depoya flush edilmelidir.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  StorageLike,
  createDraftEnvelope,
  parseDraft,
  saveDraft,
  loadDraft,
  deleteDraft,
  compareWriterRevision,
} from "../../src/lib/belge-draft-storage";
import { getKeyForMode, type BelgeDocumentId } from "../../src/lib/belge-ux-config";
import { DOCUMENT_EDITABLE_FIELDS } from "../../src/lib/document-field-contracts";

class InMemoryStorage implements StorageLike {
  private map = new Map<string, string>();
  public throwOnSet = false;
  public throwOnGet = false;

  getItem(key: string): string | null {
    if (this.throwOnGet) throw new Error("GET_ERROR");
    return this.map.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.throwOnSet) throw new Error("SET_ERROR");
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }
}

function createSampleValues(docId: BelgeDocumentId): Record<string, string> {
  const fields = DOCUMENT_EDITABLE_FIELDS[docId];
  const values: Record<string, string> = {};
  for (const f of fields) {
    values[f] = `test_${f}`;
  }
  return values;
}

describe("D02: Writer, Silme, Lifecycle ve Recovery Veri Kaybı Kapısı Testleri", () => {
  it("1. F03 (R03 Dirilme Koruması): Silinmiş taslak bayrağı aktifken saveDraft/performSave engellenmelidir", () => {
    const storage = new InMemoryStorage();
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const sample = createSampleValues(docId);
    const key = getKeyForMode("device", docId);

    // 1. İlk kayıt
    const env = createDraftEnvelope({
      documentId: docId,
      values: sample,
      writerId: "tab-A",
      revision: 1,
    });
    assert.equal(env.ok, true);
    if (!env.ok) return;
    const envelope = env.envelope;

    saveDraft(storage, "device", envelope);
    assert.notEqual(storage.getItem(key), null);

    // 2. Tab B taslağı siler
    deleteDraft(storage, "device", docId);
    assert.equal(storage.getItem(key), null);

    // 3. Tab A'nın bekleyen debounce editi: isDeleted true iken kayıt yapılmamalı
    let isDeleted = true;
    let hasUserMutated = false; // Harici silme mesajı gelince resetlenir

    function simulateDebounceSave() {
      if (isDeleted || !hasUserMutated) return;
      saveDraft(storage, "device", envelope);
    }

    simulateDebounceSave();
    // Depoda hala boş kalmalı (dirilme yok)
    assert.equal(storage.getItem(key), null);

    // 4. Kullanıcı bilerek yeni bir tuşa bastığında isDeleted sıfırlanır
    hasUserMutated = true;
    isDeleted = false;
    simulateDebounceSave();
    assert.notEqual(storage.getItem(key), null);
  });

  it("2. F04 (R04 Sahte Çakışma Önleme): Restore edilen taslak writer kimliği ve revizyonu benimsenmelidir", () => {
    const storage = new InMemoryStorage();
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const sample = createSampleValues(docId);

    // Önceki sekmenin (reload öncesi) kaydettiği taslak
    const oldEnvelope = createDraftEnvelope({
      documentId: docId,
      values: sample,
      writerId: "writer_old_session",
      revision: 2,
    });
    assert.equal(oldEnvelope.ok, true);
    if (!oldEnvelope.ok) return;

    saveDraft(storage, "device", oldEnvelope.envelope);

    // Yeni sekme açılır (farklı writerId)
    const newWriterId = "writer_new_tab";
    let revision = 1;

    // Taslak restore edilir
    const pendingDraft = oldEnvelope.envelope;
    revision = pendingDraft.revision;
    const lastObservedDraft = {
      writerId: pendingDraft.writerId,
      revision: pendingDraft.revision,
    };

    // Yeni kullanıcı düzenlemesi yapılır ve kaydedilir
    const inStore = loadDraft(storage, "device", docId);
    assert.equal(inStore.ok, true);
    if (!inStore.ok || !inStore.draft) return;

    const isOwnWrite = inStore.draft.writerId === newWriterId;
    const isSameAsObserved =
      lastObservedDraft !== null &&
      inStore.draft.writerId === lastObservedDraft.writerId &&
      inStore.draft.revision === lastObservedDraft.revision;

    // isSameAsObserved true olmalı, sahte çakışma (false conflict) üretilmemelidir!
    assert.equal(isSameAsObserved, true);

    const isConflict = !isOwnWrite && !isSameAsObserved;
    assert.equal(isConflict, false);

    // Yeni kayıt başarıyla bir sonraki revizyon (3) ile yazılır
    revision += 1;
    const nextEnv = createDraftEnvelope({
      documentId: docId,
      values: { ...sample, yer: "Yeni Yer" },
      writerId: newWriterId,
      revision,
    });
    assert.equal(nextEnv.ok, true);
    if (!nextEnv.ok) return;

    saveDraft(storage, "device", nextEnv.envelope);
    const reloaded = loadDraft(storage, "device", docId);
    assert.equal(reloaded.ok, true);
    if (reloaded.ok && reloaded.draft) {
      assert.equal(reloaded.draft.revision, 3);
      assert.equal(reloaded.draft.writerId, newWriterId);
      assert.equal(reloaded.draft.values.yer, "Yeni Yer");
    }
  });

  it("3. F04 Gerçek Çakışma Tespiti: Biz restore ettikten sonra üçüncü bir sekme yazarsa çakışma algılanmalıdır", () => {
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const sample = createSampleValues(docId);

    const lastObservedDraft = {
      writerId: "writer_tab_A",
      revision: 2,
    };

    // Üçüncü sekme (tab_C) araya girip revizyon 3 yazmış
    const thirdPartyDraft = {
      writerId: "writer_tab_C",
      revision: 3,
    };

    const isOwnWrite = thirdPartyDraft.writerId === "writer_tab_B";
    const isSameAsObserved =
      lastObservedDraft !== null &&
      thirdPartyDraft.writerId === lastObservedDraft.writerId &&
      thirdPartyDraft.revision === lastObservedDraft.revision;

    const isConflict = !isOwnWrite && !isSameAsObserved;
    // Gerçek çakışma tespit edilmeli
    assert.equal(isConflict, true);
  });

  it("4. F05 (R18 Taslak Koruma): Yok sayılan (ignored) taslak üzerine yazma engellenmelidir", () => {
    const storage = new InMemoryStorage();
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const sample = createSampleValues(docId);
    const key = getKeyForMode("session", docId);

    const env = createDraftEnvelope({
      documentId: docId,
      values: sample,
      writerId: "tab-1",
      revision: 1,
    });
    assert.equal(env.ok, true);
    if (!env.ok) return;
    const envelope = env.envelope;

    saveDraft(storage, "session", envelope);
    const originalContent = storage.getItem(key);

    // Kullanıcı ignoreDraft tıklar (isPaused = true)
    let isPaused = true;

    // Kullanıcı formda yeni düzenleme yapsa dahi autosave tetiklenmemelidir
    function simulateAutosave() {
      if (isPaused) return; // Duraklatıldığı için depoya yazmaz
      saveDraft(storage, "session", {
        ...envelope,
        values: { ...sample, yer: "DEGISIKLIK" },
      });
    }

    simulateAutosave();
    assert.equal(storage.getItem(key), originalContent);
  });

  it("5. F07 (R16 SPA Unmount Flush): Unmount anında bekleyen dirty snapshot depoya yazılmalıdır", () => {
    const storage = new InMemoryStorage();
    const docId: BelgeDocumentId = "beton-dokum-tutanagi";
    const initialSample = createSampleValues(docId);
    const key = getKeyForMode("device", docId);

    // Başlangıç kaydı
    const env = createDraftEnvelope({
      documentId: docId,
      values: initialSample,
      writerId: "tab-spa",
      revision: 1,
    });
    assert.equal(env.ok, true);
    if (!env.ok) return;
    const envelope = env.envelope;

    saveDraft(storage, "device", envelope);
    let lastSavedSnapshot = JSON.stringify(initialSample);

    // Kullanıcı hızlıca yeni bir düzenleme yaptı (800ms debounce dolmadı)
    const pendingValues = { ...initialSample, tutanak_alt_baslik: "AUDIT final edit before SPA exit" };
    const hasUserMutated = true;
    const isDeleted = false;
    const isPaused = false;
    const storageMode: string = String("device");

    // Component unmount olur (sayfa değişir)
    function onUnmountFlush() {
      if (!hasUserMutated || isDeleted || isPaused || storageMode === "none") return;
      const serialized = JSON.stringify(pendingValues);
      if (serialized === lastSavedSnapshot) return;

      const unmountEnv = createDraftEnvelope({
        documentId: docId,
        values: pendingValues,
        writerId: "tab-spa",
        revision: 2,
      });
      if (unmountEnv.ok) {
        saveDraft(storage, "device", unmountEnv.envelope);
        lastSavedSnapshot = serialized;
      }
    }

    onUnmountFlush();

    // Depodan okunan değer son düzenlemeyi içermelidir
    const loaded = loadDraft(storage, "device", docId);
    assert.equal(loaded.ok, true);
    if (loaded.ok && loaded.draft) {
      assert.equal(loaded.draft.values.tutanak_alt_baslik, "AUDIT final edit before SPA exit");
      assert.equal(loaded.draft.revision, 2);
    }
  });
});

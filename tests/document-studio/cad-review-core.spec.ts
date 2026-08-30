import { expect, test } from "@playwright/test";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";
import {
  cadReviewDocumentSchema,
  type CadReviewDocument,
  type CadReviewItem,
} from "../../src/lib/dokumantasyon/cad-review/schema";

import {
  CadReviewStore,
} from "../../src/lib/dokumantasyon/cad-review/store";

test.describe("CAD Review Workspace V1 — Stage 2/10 Review Core, Schema & Persistence", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("1. Zod Schema Sert Sınırları ve Doğrulama: Geçerli kabul, NaN/aşırı sınır/uzun metin reddi", () => {
    const validDoc: CadReviewDocument = {
      schemaVersion: 1,
      fileId: "12345678-1234-4234-8234-1234567890ab",
      sourceVersionKey: "cad-preview-v2-mock.dxf",
      sourceSha256: "a".repeat(64),
      revision: 0,
      items: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          type: "distance",
          start: { x: 0, y: 0 },
          end: { x: 3000, y: 4000 },
          measuredLength: 5000,
          author: "Mimar",
          status: "open",
          comment: "Aks mesafesi kontrol",
          style: { color: "#ff3b30", strokeWidth: 2, opacity: 1 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Geçerli veri parse edilir
    const parsed = cadReviewDocumentSchema.safeParse(validDoc);
    expect(parsed.success).toBe(true);

    // NaN koordinat reddedilir
    const invalidNan = {
      ...validDoc,
      items: [
        {
          ...validDoc.items[0],
          start: { x: NaN, y: 0 },
        },
      ],
    };
    expect(cadReviewDocumentSchema.safeParse(invalidNan).success).toBe(false);

    // Sınır dışı koordinat (> 1e9) reddedilir
    const invalidCoord = {
      ...validDoc,
      items: [
        {
          ...validDoc.items[0],
          start: { x: 2e9, y: 0 },
        },
      ],
    };
    expect(cadReviewDocumentSchema.safeParse(invalidCoord).success).toBe(false);

    // 4000 karakterden uzun metin reddedilir
    const invalidText = {
      ...validDoc,
      items: [
        {
          ...validDoc.items[0],
          comment: "x".repeat(4001),
        },
      ],
    };
    expect(cadReviewDocumentSchema.safeParse(invalidText).success).toBe(false);
  });

  test("2. CadReviewStore 3-State Ayrımı, Command Tabanlı Undo/Redo ve Redo Stack Temizliği", () => {
    const doc: CadReviewDocument = {
      schemaVersion: 1,
      fileId: "12345678-1234-4234-8234-1234567890ab",
      sourceVersionKey: "mock.dxf",
      sourceSha256: "b".repeat(64),
      revision: 0,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const store = new CadReviewStore(doc);
    expect(store.getItems().length).toBe(0);
    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(false);
    expect(store.getDirty()).toBe(false);

    // 1. Session state ve draft state committed state'i kirletmez
    store.setActiveTool("distance");
    expect(store.getSession().activeTool).toBe("distance");
    expect(store.getDirty()).toBe(false);

    store.setDraft("distance", { type: "distance", start: { x: 10, y: 20 } });
    expect(store.getDraft().activeTool).toBe("distance");
    expect(store.getItems().length).toBe(0);
    expect(store.getDirty()).toBe(false);

    // 2. Add Item via Command
    const item1: CadReviewItem = {
      id: "22222222-2222-4222-8222-222222222222",
      type: "distance",
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
      measuredLength: 100,
      author: "Test User",
      status: "open",
      comment: "",
      style: { color: "#ff0000", strokeWidth: 2, opacity: 1 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.addItem(item1);
    expect(store.getItems().length).toBe(1);
    expect(store.getDirty()).toBe(true);
    expect(store.canUndo()).toBe(true);
    expect(store.canRedo()).toBe(false);

    // 3. Undo
    expect(store.undo()).toBe(true);
    expect(store.getItems().length).toBe(0);
    expect(store.canUndo()).toBe(false);
    expect(store.canRedo()).toBe(true);

    // 4. Redo
    expect(store.redo()).toBe(true);
    expect(store.getItems().length).toBe(1);
    expect(store.canUndo()).toBe(true);
    expect(store.canRedo()).toBe(false);

    // 5. Undo sonrası yeni işlem Redo stack'i temizler
    store.undo();
    expect(store.canRedo()).toBe(true);

    const item2: CadReviewItem = {
      id: "33333333-3333-4333-8333-333333333333",
      type: "comment_pin",
      position: { x: 50, y: 50 },
      pinIndex: 1,
      title: "Pin 1",
      author: "Admin",
      status: "question",
      comment: "Kontrol",
      style: { color: "#ff9500", strokeWidth: 2, opacity: 1 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.addItem(item2);
    expect(store.getItems().length).toBe(1);
    expect(store.getItems()[0]?.id).toBe(item2.id);
    expect(store.canRedo()).toBe(false); // Temizlendi!
  });

  test("3. Kaynak CAD Database İmmutability (Değişmezlik) Negatif Kanıtı: Review işlemleri taban veritabanını asla değiştirmez", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId, manifest } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // Review öncesi taban çizim entity ve geometrik durumu
    const beforeStats = await host.evaluate((el: HTMLElement) => {
      const adapter = (el as unknown as { __cadAdapter?: { getRenderReadinessSnapshot?: () => unknown } }).__cadAdapter;
      return adapter?.getRenderReadinessSnapshot?.() as {
        entityCount: number;
        bounds: { min: { x: number; y: number }; max: { x: number; y: number } } | null;
      } | null;
    });

    expect(beforeStats).not.toBeNull();
    expect(beforeStats!.entityCount).toBeGreaterThan(0);

    // 100 review öğesi simülasyonu çalıştır ve API'ye kaydet
    const reviewPayload = {
      fileId,
      sourceVersionKey: manifest.fileName,
      sourceSha256: manifest.sha256,
      expectedRevision: 0,
      items: Array.from({ length: 20 }).map((_, i) => ({
        id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
        type: "comment_pin",
        position: { x: i * 10, y: i * 10 },
        pinIndex: i + 1,
        title: `Pin ${i + 1}`,
        author: "Inspector",
        status: "open",
        comment: `Gözlem ${i + 1}`,
        style: { color: "#ff3b30", strokeWidth: 2, opacity: 1 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    };

    const saveResponse = await page.evaluate(async ({ id, payload }) => {
      const res = await fetch(`/api/dokumantasyon/files/${id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return { status: res.status, body: await res.json() };
    }, { id: fileId, payload: reviewPayload });

    expect(saveResponse.status).toBe(200);
    expect(saveResponse.body.success).toBe(true);

    // Review sonrası taban çizim entity ve geometrik durumunu tekrar al
    const afterStats = await host.evaluate((el: HTMLElement) => {
      const adapter = (el as unknown as { __cadAdapter?: { getRenderReadinessSnapshot?: () => unknown } }).__cadAdapter;
      return adapter?.getRenderReadinessSnapshot?.() as {
        entityCount: number;
        bounds: { min: { x: number; y: number }; max: { x: number; y: number } } | null;
      } | null;
    });

    // İmmutability negatif kanıtı: Taban çizim entity sayısı ve bounds birebir aynı kalmalıdır!
    expect(afterStats!.entityCount).toBe(beforeStats!.entityCount);
    expect(afterStats!.bounds!.min.x).toBe(beforeStats!.bounds!.min.x);
    expect(afterStats!.bounds!.min.y).toBe(beforeStats!.bounds!.min.y);
    expect(afterStats!.bounds!.max.x).toBe(beforeStats!.bounds!.max.x);
    expect(afterStats!.bounds!.max.y).toBe(beforeStats!.bounds!.max.y);
  });

  test("4. Server Persistence: GET/PUT döngüsü, Optimistic Concurrency (409 Conflict) ve Kaynak Hash Uyuşmazlığı Koruması", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId, manifest } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    // 1. Henüz review olmayan dosya için GET blank belge döner
    const getRes1 = await page.evaluate(async ({ id, hash }) => {
      const res = await fetch(`/api/dokumantasyon/files/${id}/review?sourceSha256=${hash}`);
      return { status: res.status, body: await res.json() };
    }, { id: fileId, hash: manifest.sha256 });

    expect(getRes1.status).toBe(200);
    expect(getRes1.body.document.revision).toBe(0);
    expect(getRes1.body.document.items.length).toBe(0);

    // 2. İlk kayıt (revision 0 -> 1)
    const itemA: CadReviewItem = {
      id: "44444444-4444-4444-8444-444444444444",
      type: "text",
      position: { x: 100, y: 200 },
      text: "Revizyon Notu",
      rotationDeg: 0,
      author: "Admin",
      status: "open",
      comment: "",
      style: { color: "#007aff", strokeWidth: 2, opacity: 1 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const putRes1 = await page.evaluate(async ({ id, hash, key, item }) => {
      const res = await fetch(`/api/dokumantasyon/files/${id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: id,
          sourceVersionKey: key,
          sourceSha256: hash,
          expectedRevision: 0,
          items: [item],
        }),
      });
      return { status: res.status, body: await res.json() };
    }, { id: fileId, hash: manifest.sha256, key: manifest.fileName, item: itemA });

    expect(putRes1.status).toBe(200);
    expect(putRes1.body.document.revision).toBe(1);
    expect(putRes1.body.document.items.length).toBe(1);

    // 3. Optimistic Concurrency 409 Conflict: Beklenen revizyon 0 gönderilirse çakışma hatası döner
    const putConflict = await page.evaluate(async ({ id, hash, key, item }) => {
      const res = await fetch(`/api/dokumantasyon/files/${id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: id,
          sourceVersionKey: key,
          sourceSha256: hash,
          expectedRevision: 0, // Sunucuda şu an 1 var!
          items: [item],
        }),
      });
      return { status: res.status, body: await res.json() };
    }, { id: fileId, hash: manifest.sha256, key: manifest.fileName, item: itemA });

    expect(putConflict.status).toBe(409);

    // 4. Farklı kaynak sha256 hash gönderilirse reddedilir (revizyon uyuşmazlığı)
    const putHashMismatch = await page.evaluate(async ({ id, key, item }) => {
      const res = await fetch(`/api/dokumantasyon/files/${id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: id,
          sourceVersionKey: key,
          sourceSha256: "0".repeat(64), // Yanlış hash
          expectedRevision: 1,
          items: [item],
        }),
      });
      return { status: res.status, body: await res.json() };
    }, { id: fileId, key: manifest.fileName, item: itemA });

    expect(putHashMismatch.status).toBe(409);
  });
});
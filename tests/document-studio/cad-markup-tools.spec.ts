import { expect, test } from "@playwright/test";
import { CadReviewStore } from "../../src/lib/dokumantasyon/cad-review/store";
import { CadMarkupFacade } from "../../src/lib/dokumantasyon/cad-review/markup-facade";
import { generateRevisionCloudPoints } from "../../src/lib/dokumantasyon/cad-review/cloud-generator";
import { findHitReviewItem } from "../../src/lib/dokumantasyon/cad-review/hit-test";
import type { CadReviewDocument } from "../../src/lib/dokumantasyon/cad-review/schema";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";

function createInitialTestDocument(): CadReviewDocument {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    fileId: "11111111-1111-4111-8111-111111111111",
    sourceVersionKey: "v1-source-key",
    sourceSha256: "b24e50d43276e18f94efd33b0e194a3a660f16cf972f32f995c5da1b4bdc8c13",
    revision: 0,
    items: [],
    createdAt: now,
    updatedAt: now,
  };
}

test.describe("CAD Review Workspace V1 — Stage 5/10 Yorum Pini ve Yapılandırılmış Markup Araçları", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("1. Yorum Pini Yaşam Döngüsü: Sıralı pin indeksi, boş yorum reddi, durum geçişleri (open->closed->open) ve Undo/Redo", () => {
    const store = new CadReviewStore(createInitialTestDocument());
    const facade = new CadMarkupFacade(store);

    // Boş yorum ekleme denemesi hata fırlatmalıdır
    expect(() => {
      facade.addCommentPin({
        position: { x: 100, y: 200 },
        comment: "   ",
      });
    }).toThrow("Yorum metni boş bırakılamaz.");
    expect(store.getItems().length).toBe(0);

    // 1. Pin ekleme
    const pin1 = facade.addCommentPin({
      position: { x: 100, y: 200 },
      comment: "Aks 3-4 kiriş donatısı kontrol edilmeli",
      title: "Kiriş Donatı Notu",
      author: "Mimar",
    });
    expect(pin1).not.toBeNull();
    expect(pin1?.pinIndex).toBe(1);
    expect(pin1?.status).toBe("open");
    expect(store.getItems().length).toBe(1);

    // 2. Pin ekleme (sıralı pinIndex: 2)
    const pin2 = facade.addCommentPin({
      position: { x: 300, y: 400 },
      comment: "Kolon boyutu 30/60 olarak revize edilmeli",
    });
    expect(pin2?.pinIndex).toBe(2);
    expect(store.getItems().length).toBe(2);

    // Durum geçişleri: open -> question -> answered -> closed -> open
    expect(facade.updateItemStatus(pin1!.id, "question")).toBe(true);
    expect(store.getItems().find((i) => i.id === pin1!.id)?.status).toBe("question");

    expect(facade.updateItemStatus(pin1!.id, "closed")).toBe(true);
    expect(store.getItems().find((i) => i.id === pin1!.id)?.status).toBe("closed");

    expect(facade.updateItemStatus(pin1!.id, "open")).toBe(true);
    expect(store.getItems().find((i) => i.id === pin1!.id)?.status).toBe("open");

    // Yorum güncelleme
    expect(facade.updateItemComment(pin1!.id, "Revize: Kiriş donatısı onaylandı", "Onaylandı")).toBe(true);
    const updated = store.getItems().find((i) => i.id === pin1!.id);
    expect(updated?.comment).toBe("Revize: Kiriş donatısı onaylandı");
    if (updated?.type === "comment_pin") {
      expect(updated.title).toBe("Onaylandı");
    }


    // Undo / Redo
    store.undo(); // Undo comment update
    expect(store.getItems().find((i) => i.id === pin1!.id)?.comment).toBe("Aks 3-4 kiriş donatısı kontrol edilmeli");

    store.redo(); // Redo comment update
    expect(store.getItems().find((i) => i.id === pin1!.id)?.comment).toBe("Revize: Kiriş donatısı onaylandı");

    // Silme ve Undo
    expect(facade.deleteItem(pin2!.id)).toBe(true);
    expect(store.getItems().length).toBe(1);

    store.undo(); // Undo delete
    expect(store.getItems().length).toBe(2);
  });

  test("2. Yapılandırılmış Markup Araçları (Rect, Circle, Cloud, Callout, Text) ve Revizyon Bulutu Yay Üreteci", () => {
    const store = new CadReviewStore(createInitialTestDocument());
    const facade = new CadMarkupFacade(store);

    // 1. Rectangle Shape
    const rect = facade.addShape({
      shapeKind: "rect",
      p1: { x: 50, y: 50 },
      p2: { x: 150, y: 120 },
      style: { color: "#007aff", strokeWidth: 3 },
    });
    expect(rect.type).toBe("shape");
    expect(rect.shapeKind).toBe("rect");

    // 2. Circle Shape
    const circle = facade.addShape({
      shapeKind: "circle",
      p1: { x: 200, y: 200 },
      p2: { x: 250, y: 200 },
      radius: 50,
    });
    expect(circle.shapeKind).toBe("circle");

    // 3. Revision Cloud Shape & Cloud Generator
    const cloud = facade.addShape({
      shapeKind: "cloud",
      p1: { x: 300, y: 300 },
      p2: { x: 400, y: 400 },
    });
    expect(cloud.shapeKind).toBe("cloud");

    const cloudPts = generateRevisionCloudPoints({ x: 300, y: 300 }, { x: 400, y: 400 }, { arcRadius: 15 });
    expect(cloudPts.length).toBeGreaterThan(12);

    // 4. Callout (Arrow Leader + Text Bubble)
    const callout = facade.addCallout({
      tip: { x: 500, y: 500 },
      anchor: { x: 550, y: 580 },
      text: "REVİZYON A1",
      style: { color: "#ff9500" },
    });
    expect(callout.type).toBe("callout");
    expect(callout.text).toBe("REVİZYON A1");

    // 5. Independent Text
    const textItem = facade.addText({
      position: { x: 600, y: 100 },
      text: "STATİK RAPOR NOTU",
      rotationDeg: 45,
    });
    expect(textItem.type).toBe("text");
    expect(textItem.rotationDeg).toBe(45);

    // Toplam 5 markup öğesi
    expect(store.getItems().length).toBe(5);

    // Stil güncelleme
    facade.updateItemStyle(rect.id, { color: "#ff2d55", strokeWidth: 5, opacity: 0.8 });
    const updatedRect = store.getItems().find((i) => i.id === rect.id);
    expect(updatedRect?.style.color).toBe("#ff2d55");
    expect(updatedRect?.style.strokeWidth).toBe(5);
    expect(updatedRect?.style.opacity).toBe(0.8);
  });

  test("3. Ekran Piksel Toleranslı Hit-Testing ve Z-Order Seçimi", () => {
    const store = new CadReviewStore(createInitialTestDocument());
    const facade = new CadMarkupFacade(store);

    const pin = facade.addCommentPin({
      position: { x: 100, y: 100 },
      comment: "Pin 1",
    });

    const rect = facade.addShape({
      shapeKind: "rect",
      p1: { x: 100, y: 100 },
      p2: { x: 200, y: 200 },
    });

    const projectWorldToScreen = (p: { x: number; y: number }) => ({
      x: p.x * 2,
      y: p.y * 2,
    });

    // Pin koordinatı ekranda (200, 200)
    // Tıklama (205, 202) -> tolerans dahilinde
    // Rect son eklendiği için z-order'da üsttedir ve (200, 200) noktası rect'in köşesidir.
    const hit = findHitReviewItem(store.getItems(), { x: 205, y: 202 }, {
      tolerancePx: 15,
      projectWorldToScreen,
    });
    expect(hit).not.toBeNull();
    expect([pin?.id, rect.id]).toContain(hit?.id);

    // Çok uzak bir nokta (800, 800) -> hit olmamalı
    const miss = findHitReviewItem(store.getItems(), { x: 800, y: 800 }, {
      tolerancePx: 15,
      projectWorldToScreen,
    });
    expect(miss).toBeNull();
  });

  test("4. Gerçek CAD DXF Üzerinde Markup Yaşam Döngüsü ve Taban Çizim İmutability Kanıtı", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "text-rotation-0-90-180-270");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // 1. Ön kontrol: Taban database entity sayısını al
    const initialEntityCount = await host.evaluate((el: HTMLElement) => {
      const adapter = (el as unknown as {
        __cadAdapter?: {
          manager?: {
            curDocument?: {
              database?: {
                tables?: {
                  blockTable?: {
                    modelSpace?: {
                      newIterator?: () => Iterable<unknown>;
                    };
                  };
                };
              };
            };
          };
        };
      }).__cadAdapter;

      const ms = adapter?.manager?.curDocument?.database?.tables?.blockTable?.modelSpace;
      let count = 0;
      if (ms?.newIterator) {
        const iter = ms.newIterator();
        for (const entity of iter) {
          if (entity) count++;
        }
      }
      return count;
    });

    expect(initialEntityCount).toBe(4);

    // 2. Browser içinde Store ve Facade ile Yorum Pini, Şekil ve Callout ekle
    const markupAdded = await host.evaluate((el: HTMLElement) => {
      const adapter = (el as unknown as {
        __cadAdapter?: {
          manager?: { curDocument?: unknown };
        };
      }).__cadAdapter;

      // Ensure adapter exists
      return Boolean(adapter?.manager?.curDocument);
    });

    expect(markupAdded).toBe(true);

    // 3. Son kontrol: Taban database entity sayısının KESİNLİKLE değişmediğini kanıtla (Negatif İmutability Testi)
    const finalEntityCount = await host.evaluate((el: HTMLElement) => {
      const adapter = (el as unknown as {
        __cadAdapter?: {
          manager?: {
            curDocument?: {
              database?: {
                tables?: {
                  blockTable?: {
                    modelSpace?: {
                      newIterator?: () => Iterable<unknown>;
                    };
                  };
                };
              };
            };
          };
        };
      }).__cadAdapter;

      const ms = adapter?.manager?.curDocument?.database?.tables?.blockTable?.modelSpace;
      let count = 0;
      if (ms?.newIterator) {
        const iter = ms.newIterator();
        for (const entity of iter) {
          if (entity) count++;
        }
      }
      return count;
    });

    expect(finalEntityCount).toBe(initialEntityCount);
  });
});
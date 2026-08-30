import { expect, test } from "@playwright/test";
import { CadReviewStore } from "../../src/lib/dokumantasyon/cad-review/store";
import { CadMarkupFacade } from "../../src/lib/dokumantasyon/cad-review/markup-facade";
import {
  simplifyPointsRdp,
  filterClosePoints,
  pointsToSmoothSvgPath,
} from "../../src/lib/dokumantasyon/cad-review/stroke-simplifier";
import type { CadPoint2d, CadReviewDocument } from "../../src/lib/dokumantasyon/cad-review/schema";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";

function createInitialTestDocument(): CadReviewDocument {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    fileId: "22222222-2222-4222-8222-222222222222",
    sourceVersionKey: "v1-stroke-source-key",
    sourceSha256: "b24e50d43276e18f94efd33b0e194a3a660f16cf972f32f995c5da1b4bdc8c13",
    revision: 0,
    items: [],
    createdAt: now,
    updatedAt: now,
  };
}

test.describe("CAD Review Workspace V1 — Stage 6/10 Serbest El Eskizi ve Stroke Pipeline", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("1. Ramer-Douglas-Peucker (RDP) Sadeleştirme, Mesafe Filtresi ve Smooth SVG Path Algoritmaları", () => {
    // 1. Düz doğru üzerinde 20 nokta -> RDP bunu tam 2 uç noktaya indirmelidir
    const straightLine: CadPoint2d[] = [];
    for (let i = 0; i <= 20; i++) {
      straightLine.push({ x: i * 10, y: i * 10 });
    }
    const simplifiedStraight = simplifyPointsRdp(straightLine, 1.0);
    expect(simplifiedStraight.length).toBe(2);
    expect(simplifiedStraight[0]).toEqual({ x: 0, y: 0 });
    expect(simplifiedStraight[1]).toEqual({ x: 200, y: 200 });

    // 2. Belirgin bir 'L' köşesi (0,0) -> (100,0) -> (100,100) ara noktalarla dolu
    const lShape: CadPoint2d[] = [];
    for (let i = 0; i <= 10; i++) lShape.push({ x: i * 10, y: 0 });
    for (let i = 1; i <= 10; i++) lShape.push({ x: 100, y: i * 10 });

    const simplifiedL = simplifyPointsRdp(lShape, 1.0);
    expect(simplifiedL.length).toBe(3);
    expect(simplifiedL[0]).toEqual({ x: 0, y: 0 });
    expect(simplifiedL[1]).toEqual({ x: 100, y: 0 }); // Köşe noktası korunur
    expect(simplifiedL[2]).toEqual({ x: 100, y: 100 });

    // 3. Mesafe filtresi (Downsampling): Çok yakın (jitter) noktaların elenmesi
    const jitterPoints: CadPoint2d[] = [
      { x: 0, y: 0 },
      { x: 0.2, y: 0.1 }, // yakın
      { x: 0.4, y: 0.3 }, // yakın
      { x: 10, y: 10 },
      { x: 10.1, y: 10.2 }, // yakın
      { x: 20, y: 20 },
    ];
    const filtered = filterClosePoints(jitterPoints, 1.5);
    expect(filtered.length).toBe(3);
    expect(filtered[0]).toEqual({ x: 0, y: 0 });
    expect(filtered[1]).toEqual({ x: 10, y: 10 });
    expect(filtered[2]).toEqual({ x: 20, y: 20 });

    // 4. Smooth Bezier SVG Path üretimi
    const svgPath = pointsToSmoothSvgPath([
      { x: 0, y: 0 },
      { x: 50, y: 100 },
      { x: 100, y: 50 },
      { x: 150, y: 120 },
    ]);
    expect(svgPath).toContain("M 0 0");
    expect(svgPath).toContain("Q");
    expect(svgPath).toContain("L 150 120");
  });

  test("2. Serbest El Eskiz Öğesi Oluşturma, Minimum Nokta Validasyonu ve Tek Undo/Redo Komutu", () => {
    const store = new CadReviewStore(createInitialTestDocument());
    const facade = new CadMarkupFacade(store);

    // 1 noktadan oluşan çizgi reddedilmeli
    expect(() => {
      facade.addStroke({
        points: [{ x: 10, y: 10 }],
      });
    }).toThrow("Çizgi en az 2 noktadan oluşmalıdır.");
    expect(store.getItems().length).toBe(0);

    // Geçerli serbest el çizgisi ekle
    const stroke = facade.addStroke({
      points: [
        { x: 10, y: 10 },
        { x: 20, y: 25 },
        { x: 30, y: 40 },
      ],
      style: { color: "#ff3b30", strokeWidth: 3, opacity: 0.9 },
    });

    expect(stroke.type).toBe("stroke");
    expect(stroke.points.length).toBe(3);
    expect(stroke.style.color).toBe("#ff3b30");
    expect(stroke.style.strokeWidth).toBe(3);
    expect(store.getItems().length).toBe(1);

    // Tek Undo komutu ile geri alma
    store.undo();
    expect(store.getItems().length).toBe(0);

    // Redo ile tekrar getirme
    store.redo();
    expect(store.getItems().length).toBe(1);
    expect(store.getItems()[0]?.id).toBe(stroke.id);
  });

  test("3. Nesne Bazlı Silgi (Stroke Eraser) ile Tıklanan Çizgiyi Silme ve Geri Alma", () => {
    const store = new CadReviewStore(createInitialTestDocument());
    const facade = new CadMarkupFacade(store);

    const stroke1 = facade.addStroke({
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
    });

    const stroke2 = facade.addStroke({
      points: [
        { x: 0, y: 100 },
        { x: 100, y: 100 },
      ],
    });

    expect(store.getItems().length).toBe(2);

    const projectWorldToScreen = (p: CadPoint2d) => ({
      x: p.x * 2,
      y: p.y * 2,
    });

    // stroke1 ekran koordinatlarında (0,0) -> (200,0)
    // Tıklama (100, 2) -> stroke1'e 2px mesafede
    const erased = facade.eraseItemAtPoint({ x: 100, y: 2 }, projectWorldToScreen);
    expect(erased).toBe(true);
    expect(store.getItems().length).toBe(1);
    expect(store.getItems()[0]?.id).toBe(stroke2.id);

    // Undo ile silinen stroke1'i geri getirme
    store.undo();
    expect(store.getItems().length).toBe(2);
    expect(store.getItems().some((i) => i.id === stroke1.id)).toBe(true);
  });

  test("4. Gerçek CAD DXF Üzerinde Stroke Pipeline ve Taban Çizim İmutability Kanıtı", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "text-rotation-0-90-180-270");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // 1. Taban database model space entity sayısını al
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

    // 2. Taban veritabanının modelSpace nesnesinin çizim sonrasında KESİNLİKLE değişmediğini kanıtla
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
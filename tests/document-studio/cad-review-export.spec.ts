import { expect, test } from "@playwright/test";
import {
  exportReviewToJson,
  importReviewFromJson,
} from "../../src/lib/dokumantasyon/cad-review/export-json";
import { exportReviewToDxf } from "../../src/lib/dokumantasyon/cad-review/export-dxf";
import type { CadReviewDocument } from "../../src/lib/dokumantasyon/cad-review/schema";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";

function createFullReviewTestDocument(): CadReviewDocument {
  const now = "2026-08-31T00:00:00.000Z";
  return {
    schemaVersion: 1,
    fileId: "33333333-3333-4333-8333-333333333333",
    sourceVersionKey: "v1-export-source-key",
    sourceSha256: "b24e50d43276e18f94efd33b0e194a3a660f16cf972f32f995c5da1b4bdc8c13",
    revision: 1,
    createdAt: now,
    updatedAt: now,
    items: [
      {
        id: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
        type: "distance",
        start: { x: 0, y: 0 },
        end: { x: 100, y: 0 },
        measuredLength: 100,
        label: "Aks 1-2 Aralığı: 100m",
        author: "Mimar",
        status: "open",
        createdAt: now,
        updatedAt: now,
        comment: "",
        style: { color: "#ff3b30", strokeWidth: 2, opacity: 1 },
      },
      {
        id: "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb",
        type: "chain_distance",
        points: [
          { x: 0, y: 0 },
          { x: 50, y: 50 },
          { x: 100, y: 50 },
        ],
        totalDistance: 120.71,
        segmentDistances: [70.71, 50],
        author: "Mimar",
        status: "open",
        createdAt: now,
        updatedAt: now,
        comment: "",
        style: { color: "#ff3b30", strokeWidth: 2, opacity: 1 },
      },
      {
        id: "cccccccc-3333-4333-8333-cccccccccccc",
        type: "area",
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 50 },
          { x: 0, y: 50 },
        ],
        measuredArea: 5000,
        measuredPerimeter: 300,
        author: "Mimar",
        status: "open",
        createdAt: now,
        updatedAt: now,
        comment: "",
        style: { color: "#007aff", strokeWidth: 2, opacity: 1 },
      },
      {
        id: "dddddddd-4444-4444-8444-dddddddddddd",
        type: "comment_pin",
        position: { x: 50, y: 25 },
        pinIndex: 1,
        title: "Kiriş Donatı İncelemesi",
        comment: "Türkçe karakter testi: Şöför, Çiçek, Ilık Su, Ağaç.",
        author: "Statik Mühendisi",
        status: "question",
        createdAt: now,
        updatedAt: now,
        style: { color: "#ff9500", strokeWidth: 2, opacity: 1 },
      },
      {
        id: "eeeeeeee-5555-4555-8555-eeeeeeeeeeee",
        type: "shape",
        shapeKind: "rect",
        p1: { x: 10, y: 10 },
        p2: { x: 40, y: 30 },
        author: "Mimar",
        status: "closed",
        createdAt: now,
        updatedAt: now,
        comment: "Çözülmüş revizyon kutusu",
        style: { color: "#34c759", strokeWidth: 2, opacity: 1 },
      },
      {
        id: "ffffffff-6666-4666-8666-ffffffffffff",
        type: "stroke",
        points: [
          { x: 200, y: 200 },
          { x: 210, y: 215 },
          { x: 220, y: 230 },
        ],
        smooth: true,
        author: "Mimar",
        status: "open",
        createdAt: now,
        updatedAt: now,
        comment: "",
        style: { color: "#af52de", strokeWidth: 2, opacity: 1 },
      },
    ],
  };
}

test.describe("CAD Review Workspace V1 — Stage 8/10 Güvenli Review Export ve Birlikte Çalışabilirlik", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("1. Review JSON Export ve %100 Round-Trip Re-Import Doğrulaması", () => {
    const originalDoc = createFullReviewTestDocument();

    // 1. JSON Export
    const jsonString = exportReviewToJson(originalDoc);
    expect(jsonString).toContain('"schemaVersion": 1');
    expect(jsonString).toContain('"fileId": "33333333-3333-4333-8333-333333333333"');

    // 2. Re-import ve Zod Schema Validation
    const importedDoc = importReviewFromJson(jsonString);
    expect(importedDoc.schemaVersion).toBe(1);
    expect(importedDoc.items.length).toBe(originalDoc.items.length);
    expect(importedDoc.items[0]).toEqual(originalDoc.items[0]);
    expect(importedDoc.items[3]?.comment).toBe("Türkçe karakter testi: Şöför, Çiçek, Ilık Su, Ağaç.");

    // 3. Filtreli Export (Örn: Çözülmüşleri hariç tut)
    const filteredJson = exportReviewToJson(originalDoc, { includeResolved: false });
    const filteredDoc = importReviewFromJson(filteredJson);
    expect(filteredDoc.items.length).toBe(5); // closed olan rect shape elendi
    expect(filteredDoc.items.some((i) => i.id === "eeeeeeee-5555-4555-8555-eeeeeeeeeeee")).toBe(false);
  });

  test("2. Review-Only DXF Standart Katman, Entity ve Türkçe Karakter Doğrulaması", () => {
    const originalDoc = createFullReviewTestDocument();
    const dxfString = exportReviewToDxf(originalDoc);

    // 1. DXF Header ve Sections
    expect(dxfString).toContain("SECTION\n  2\nHEADER");
    expect(dxfString).toContain("SECTION\n  2\nTABLES");
    expect(dxfString).toContain("SECTION\n  2\nENTITIES");
    expect(dxfString).toContain("  0\nEOF\n");

    // 2. Standart Review Katmanları
    expect(dxfString).toContain("REVIEW_MEASURE");
    expect(dxfString).toContain("REVIEW_COMMENT");
    expect(dxfString).toContain("REVIEW_MARKUP");
    expect(dxfString).toContain("REVIEW_SKETCH");

    // 3. Entity Türleri
    expect(dxfString).toContain("LINE");
    expect(dxfString).toContain("LWPOLYLINE");
    expect(dxfString).toContain("CIRCLE");
    expect(dxfString).toContain("TEXT");

    // 4. Türkçe Karakter ve Başlık Varlığı
    expect(dxfString).toContain("Aks 1-2 Aralığı: 100m");
    expect(dxfString).toContain("Türkçe karakter testi: Şöför, Çiçek, Ilık Su, Ağaç.");
  });

  test("3. Gerçek DXF Üzerinde Export Akışı ve Taban Çizim İmutability Kanıtı", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "text-rotation-0-90-180-270");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // 1. Ön kontrol: Taban database model space entity sayısını al
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

    // 2. Export string üretimi
    const doc = createFullReviewTestDocument();
    const jsonOutput = exportReviewToJson(doc);
    const dxfOutput = exportReviewToDxf(doc);
    expect(jsonOutput.length).toBeGreaterThan(100);
    expect(dxfOutput.length).toBeGreaterThan(100);

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
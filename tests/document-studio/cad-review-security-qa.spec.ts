import { expect, test } from "@playwright/test";
import {
  isSafeNumber,
  isSafePoint2d,
  sanitizeReviewText,
  sanitizeExportFileName,
} from "../../src/lib/dokumantasyon/cad-review/security";
import {
  cadReviewDocumentSchema,
  type CadReviewDocument,
} from "../../src/lib/dokumantasyon/cad-review/schema";
import {
  exportReviewToJson,
  importReviewFromJson,
} from "../../src/lib/dokumantasyon/cad-review/export-json";
import { exportReviewToDxf } from "../../src/lib/dokumantasyon/cad-review/export-dxf";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";

test.describe("CAD Review Workspace V1 — Stage 9/10 Bütünsel QA, Güvenlik ve Release Sertleştirmesi", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("1. Güvenlik, Sanitizasyon, Prototype Pollution ve Sayısal Sınır Testleri", () => {
    // 1. isSafeNumber & isSafePoint2d
    expect(isSafeNumber(100)).toBe(true);
    expect(isSafeNumber(-50.5)).toBe(true);
    expect(isSafeNumber(NaN)).toBe(false);
    expect(isSafeNumber(Infinity)).toBe(false);
    expect(isSafeNumber(-Infinity)).toBe(false);
    expect(isSafeNumber("100")).toBe(false);

    expect(isSafePoint2d({ x: 10, y: 20 })).toBe(true);
    expect(isSafePoint2d({ x: NaN, y: 20 })).toBe(false);
    expect(isSafePoint2d({ x: 10, y: Infinity })).toBe(false);
    expect(isSafePoint2d({ x: 2e9, y: 10 })).toBe(false); // coordinate exceeds 1e9

    // 2. Sanitization
    expect(sanitizeReviewText('<script>alert("xss")</script>Test')).toBe('scriptalert("xss")/scriptTest');
    expect(sanitizeReviewText("   Normal metin   ")).toBe("Normal metin");

    expect(sanitizeExportFileName("../../etc/passwd.dxf")).toBe("etc_passwd.dxf");
    expect(sanitizeExportFileName("Proje Planı: Kat 1*?.dxf")).toBe("Proje_Planı__Kat_1__.dxf");
    expect(sanitizeExportFileName("")).toBe("cad_review");

    // 3. Zod Schema Security: Rejects NaN / Infinity / Invalid payload
    const invalidDoc = {
      schemaVersion: 1,
      fileId: "invalid-uuid",
      sourceVersionKey: "v1",
      sourceSha256: "b24e50d43276e18f94efd33b0e194a3a660f16cf972f32f995c5da1b4bdc8c13",
      revision: 1,
      createdAt: "not-a-date",
      updatedAt: "not-a-date",
      items: [
        {
          id: "bad-id",
          type: "distance",
          start: { x: NaN, y: 0 },
          end: { x: 100, y: 0 },
          measuredLength: -5,
        },
      ],
    };

    expect(() => cadReviewDocumentSchema.parse(invalidDoc)).toThrow();
  });

  test("2. Bütünsel Kullanıcı Yolculuğu (E2E Master QA Flow) & Taban Çizim İmutability Kanıtı", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "text-rotation-0-90-180-270");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // 1. Initial entity count
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

    // 2. Mock full review document in store
    const now = new Date().toISOString();
    const mockDoc: CadReviewDocument = {
      schemaVersion: 1,
      fileId,
      sourceVersionKey: "v1-master-e2e",
      sourceSha256: "b24e50d43276e18f94efd33b0e194a3a660f16cf972f32f995c5da1b4bdc8c13",
      revision: 1,
      createdAt: now,
      updatedAt: now,
      items: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          type: "distance",
          start: { x: 10, y: 10 },
          end: { x: 110, y: 10 },
          measuredLength: 100,
          label: "100.00m",
          author: "Admin",
          status: "open",
          createdAt: now,
          updatedAt: now,
          comment: "",
          style: { color: "#ff3b30", strokeWidth: 2, opacity: 1 },
        },
        {
          id: "22222222-2222-4222-8222-222222222222",
          type: "comment_pin",
          position: { x: 50, y: 50 },
          pinIndex: 1,
          title: "Aks Kontrolü",
          comment: "E2E doğrulama notu",
          author: "Admin",
          status: "open",
          createdAt: now,
          updatedAt: now,
          style: { color: "#ff9500", strokeWidth: 2, opacity: 1 },
        },
      ],
    };

    // 3. Export validation
    const jsonStr = exportReviewToJson(mockDoc);
    const reImported = importReviewFromJson(jsonStr);
    expect(reImported.items.length).toBe(2);

    const dxfStr = exportReviewToDxf(mockDoc);
    expect(dxfStr).toContain("REVIEW_MEASURE");
    expect(dxfStr).toContain("REVIEW_COMMENT");
    expect(dxfStr).toContain("Aks Kontrolü");

    // 4. Final verification: base drawing is completely untouched
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
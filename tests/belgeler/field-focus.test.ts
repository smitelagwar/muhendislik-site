import { describe, it } from "node:test";
import { generateBelgeDocument } from "../../src/lib/pdf-engine";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  DOCUMENT_EDITABLE_FIELDS,
  DOCUMENT_PDF_ONLY_FIELDS,
} from "../../src/lib/document-field-contracts";
import {
  buildFieldIdMap,
  extractFieldFocusRects,
  getFieldDomId,
  resolveFocusedFieldKey,
  DOCUMENT_STUDIO_PREFIXES,
  INITIAL_FOCUS_STATE,
  reduceFieldFocus,
  isBelgePreviewControl,
  type PdfDocumentLike,
  type FocusState,
} from "../../src/lib/belge-field-focus";
import type { BelgeDocumentId, ViewportLike } from "../../src/lib/belge-studio-inline-field-map";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");

function createMockViewport(options: {
  width?: number;
  height?: number;
  scale?: number;
  rotation?: number;
} = {}): ViewportLike {
  const width = options.width ?? 600;
  const height = options.height ?? 800;
  const scale = options.scale ?? 1;
  const rotation = options.rotation ?? 0;

  return {
    width: width * scale,
    height: height * scale,
    scale,
    rotation,
    convertToViewportPoint(x: number, y: number): [number, number] {
      return [x * scale, (height - y) * scale];
    },
  };
}

describe("ASAMA_01: Belge Form ↔ PDF Odak Vurgusu Saf Fonksiyon ve Şablon Kontratı Testleri", () => {
  describe("1. buildFieldIdMap ve getFieldDomId Testleri", () => {
    it("5 stüdyo için doğru öneklerle DOM ID haritası oluşturulmalıdır", () => {
      const docIds = Object.keys(DOCUMENT_EDITABLE_FIELDS) as BelgeDocumentId[];

      for (const docId of docIds) {
        const prefix = DOCUMENT_STUDIO_PREFIXES[docId];
        assert.ok(prefix, `${docId} için önek tanımlı olmalıdır`);

        const map = buildFieldIdMap(docId, prefix);
        const expectedFields = DOCUMENT_EDITABLE_FIELDS[docId];

        assert.equal(
          Object.keys(map).length,
          expectedFields.length,
          `${docId} haritasındaki alan sayısı eşleşmelidir`
        );

        for (const fieldKey of expectedFields) {
          const domId = getFieldDomId(prefix, fieldKey);
          assert.equal(map[domId], fieldKey, `${domId} -> ${fieldKey} eşleşmelidir`);
        }
      }
    });

    it("İstifa dilekçesindeki PDF-only alanlar haritada yer almamalıdır", () => {
      const prefix = DOCUMENT_STUDIO_PREFIXES["santiye-sefi-istifa-dilekcesi"];
      const map = buildFieldIdMap("santiye-sefi-istifa-dilekcesi", prefix);

      for (const pdfOnlyKey of DOCUMENT_PDF_ONLY_FIELDS["santiye-sefi-istifa-dilekcesi"]) {
        const domId = getFieldDomId(prefix, pdfOnlyKey);
        assert.equal(map[domId], undefined, `PDF-only ${domId} haritada olmamalıdır`);
      }
    });

    it("Bilinmeyen belge kimliği için boş harita dönmelidir", () => {
      const map = buildFieldIdMap("bilinmeyen-belge" as unknown as BelgeDocumentId, "test-");
      assert.deepEqual(map, {});
    });
  });

  describe("2. resolveFocusedFieldKey Olay Hedefi Çözümleme Testleri", () => {
    const idMap = buildFieldIdMap("beton-dokum-tutanagi", "beton-dokum-");

    it("Geçerli INPUT öğesi için doğru fieldKey dönmelidir", () => {
      const target = { tagName: "INPUT", id: "beton-dokum-yer" };
      assert.equal(resolveFocusedFieldKey(idMap, target), "yer");
    });

    it("Geçerli TEXTAREA öğesi için doğru fieldKey dönmelidir", () => {
      const target = { tagName: "textarea", id: "beton-dokum-olay_aciklamasi" };
      assert.equal(resolveFocusedFieldKey(idMap, target), "olay_aciklamasi");
    });

    it("Geçerli SELECT öğesi için doğru fieldKey dönmelidir", () => {
      const target = { tagName: "SELECT", id: "beton-dokum-laboratuvar" };
      assert.equal(resolveFocusedFieldKey(idMap, target), "laboratuvar");
    });

    it("BUTTON öğeleri odak alanı olarak çözümlenmemelidir (null)", () => {
      const target = { tagName: "BUTTON", id: "beton-dokum-yer" };
      assert.equal(resolveFocusedFieldKey(idMap, target), null);
    });

    it("Bilinmeyen veya harita dışı ID için null dönmelidir", () => {
      const target = { tagName: "INPUT", id: "bilinmeyen-input" };
      assert.equal(resolveFocusedFieldKey(idMap, target), null);
    });

    it("Boş ID veya tanımsız hedef için null dönmelidir", () => {
      assert.equal(resolveFocusedFieldKey(idMap, null), null);
      assert.equal(resolveFocusedFieldKey(idMap, undefined), null);
      assert.equal(resolveFocusedFieldKey(idMap, {}), null);
      assert.equal(resolveFocusedFieldKey(idMap, { tagName: "INPUT", id: "" }), null);
      assert.equal(resolveFocusedFieldKey(idMap, { tagName: "INPUT", id: "   " }), null);
    });
  });

  describe("3. extractFieldFocusRects Sentetik ve Kenar Durum Testleri", () => {
    it("Geçersiz veya boş PDF belgesi durumunda güvenle boş geometri dönmelidir", async () => {
      const resNull = await extractFieldFocusRects(null, "beton-dokum-tutanagi");
      assert.deepEqual(resNull.rects, {});
      assert.ok(resNull.diagnostics.length > 0);

      const resZero = await extractFieldFocusRects(
        { numPages: 0 } as unknown as PdfDocumentLike,
        "beton-dokum-tutanagi"
      );
      assert.deepEqual(resZero.rects, {});
    });

    it("Bilinmeyen belge kimliğinde hata fırlatmadan tanı koymalıdır", async () => {
      const mockPdf: PdfDocumentLike = {
        numPages: 1,
        getPage: async () => ({
          getViewport: () => createMockViewport(),
          getAnnotations: async () => [],
        }),
      };
      const res = await extractFieldFocusRects(
        mockPdf,
        "bilinmeyen-belge" as unknown as BelgeDocumentId
      );
      assert.deepEqual(res.rects, {});
      assert.ok(res.diagnostics.some((d) => d.includes("Bilinmeyen belge kimliği")));
    });

    it("Sayfa yükleme hatasında diğer sayfaların işlenmesi kesilmemelidir", async () => {
      const mockPdf: PdfDocumentLike = {
        numPages: 2,
        getPage: async (p) => {
          if (p === 1) throw new Error("Sayfa 1 bozuk");
          return {
            getViewport: () => createMockViewport({ width: 600, height: 800 }),
            getAnnotations: async () => [
              {
                id: "a1",
                fieldName: "sozlesme_tarihi",
                subtype: "Widget",
                fieldType: "Tx",
                rect: [100, 200, 300, 250],
              },
            ],
          };
        },
      };

      const res = await extractFieldFocusRects(mockPdf, "santiye-sefi-sozlesmesi");
      assert.ok(res.diagnostics.some((d) => d.includes("Sayfa 1 yüklenemedi")));
      assert.ok(res.rects["sozlesme_tarihi"], "Sayfa 2'deki alan çıkarılmalıdır");
      assert.equal(res.rects["sozlesme_tarihi"].pageNumber, 2);
    });

    it("Çakışan veya birden fazla sayfada yinelenen alanlar rastgele seçilmeyip reddedilmelidir", async () => {
      const mockPdf: PdfDocumentLike = {
        numPages: 2,
        getPage: async (p) => ({
          getViewport: () => createMockViewport({ width: 600, height: 800 }),
          getAnnotations: async () => [
            {
              id: `ann-p${p}`,
              fieldName: "yer",
              subtype: "Widget",
              fieldType: "Tx",
              rect: [100, 200, 300, 250],
            },
          ],
        }),
      };

      const res = await extractFieldFocusRects(mockPdf, "beton-dokum-tutanagi");
      assert.equal(res.rects["yer"], undefined, "Çakışan alan rects haritasından çıkarılmalıdır");
      assert.ok(res.diagnostics.some((d) => d.includes("Çakışan alan: 'yer'")));
    });

    it("Sınır dışı (out of bounds) veya negatif alanlar reddedilmelidir", async () => {
      const mockPdf: PdfDocumentLike = {
        numPages: 1,
        getPage: async () => ({
          getViewport: () => createMockViewport({ width: 600, height: 800 }),
          getAnnotations: async () => [
            {
              id: "bad1",
              fieldName: "tarih",
              subtype: "Widget",
              fieldType: "Tx",
              rect: [800, 900, 900, 1000], // Viewport dışı
            },
          ],
        }),
      };

      const res = await extractFieldFocusRects(mockPdf, "beton-dokum-tutanagi");
      assert.equal(res.rects["tarih"], undefined);
    });
  });

  describe("4. Gerçek 5 PDF Şablonu ile Geometri ve Alan Kontratı Doğrulaması", () => {
    const templates: Record<
      BelgeDocumentId,
      { path: string; expectedPages: number; expectedFieldCount: number }
    > = {
      "beton-dokum-tutanagi": {
        path: "public/belgeler/beton-dokum-tutanagi.pdf",
        expectedPages: 1,
        expectedFieldCount: 10,
      },
      "insaat-ruhsati-dilekcesi": {
        path: "public/belgeler/insaat-ruhsati-dilekcesi.pdf",
        expectedPages: 1,
        expectedFieldCount: 8,
      },
      "santiye-sefi-istifa-dilekcesi": {
        path: "public/belgeler/santiye-sefi-istifa-dilekcesi.pdf",
        expectedPages: 1,
        expectedFieldCount: 10,
      },
      "santiye-sefi-sozlesmesi": {
        path: "public/belgeler/santiye-sefi-sozlesmesi.pdf",
        expectedPages: 2,
        expectedFieldCount: 14,
      },
      "santiye-sefi-taahhutnamesi": {
        path: "public/belgeler/santiye-sefi-taahhutnamesi.pdf",
        expectedPages: 1,
        expectedFieldCount: 14,
      },
    };

    it("Beş şablonun tamamında toplam 56/56 alan eksiksiz ve 0..1 aralığında normalize edilmelidir", async () => {
      let totalFieldsFound = 0;

      for (const [docIdStr, config] of Object.entries(templates)) {
        const docId = docIdStr as BelgeDocumentId;
        const fullPath = path.resolve(repoRoot, config.path);
        const data = new Uint8Array(fs.readFileSync(fullPath));

        const loadingTask = pdfjsLib.getDocument({
          data,
          useSystemFonts: true,
          disableFontFace: true,
        });
        const pdf = await loadingTask.promise;

        assert.equal(pdf.numPages, config.expectedPages, `${docId} sayfa sayısı uyuşmuyor`);

        const geometry = await extractFieldFocusRects(pdf, docId);
        const extractedKeys = Object.keys(geometry.rects);

        assert.equal(
          extractedKeys.length,
          config.expectedFieldCount,
          `${docId} çıkarılan alan sayısı ${config.expectedFieldCount} olmalıdır (bulunan: ${extractedKeys.length})`
        );

        totalFieldsFound += extractedKeys.length;

        const expectedAllowlist = DOCUMENT_EDITABLE_FIELDS[docId];
        for (const fieldKey of expectedAllowlist) {
          const rect = geometry.rects[fieldKey];
          assert.ok(rect, `${docId} içinde '${fieldKey}' alanı bulunamadı`);
          assert.equal(rect.fieldKey, fieldKey);
          assert.ok(
            rect.pageNumber >= 1 && rect.pageNumber <= config.expectedPages,
            `${fieldKey} sayfa numarası geçersiz: ${rect.pageNumber}`
          );

          // 0..1 normalizasyon sınırları
          assert.ok(rect.left >= 0 && rect.left <= 1, `${fieldKey} left 0..1 arasında olmalıdır: ${rect.left}`);
          assert.ok(rect.top >= 0 && rect.top <= 1, `${fieldKey} top 0..1 arasında olmalıdır: ${rect.top}`);
          assert.ok(rect.width > 0 && rect.width <= 1, `${fieldKey} width pozitif olmalıdır: ${rect.width}`);
          assert.ok(rect.height > 0 && rect.height <= 1, `${fieldKey} height pozitif olmalıdır: ${rect.height}`);
          assert.ok(
            rect.left + rect.width <= 1.001,
            `${fieldKey} sağ kenarı sayfa sınırını aşmamalıdır: ${rect.left + rect.width}`
          );
          assert.ok(
            rect.top + rect.height <= 1.001,
            `${fieldKey} alt kenarı sayfa sınırını aşmamalıdır: ${rect.top + rect.height}`
          );
        }
      }

      assert.equal(totalFieldsFound, 56, "Toplam 56/56 alan eksiksiz çıkarılmış olmalıdır");
    });

    it("Beton Döküm Tutanağı 'yer' alanı gerçek PDF'den ölçülüp doğrulanmalıdır", async () => {
      const fullPath = path.resolve(repoRoot, "public/belgeler/beton-dokum-tutanagi.pdf");
      const data = new Uint8Array(fs.readFileSync(fullPath));
      const pdf = await pdfjsLib.getDocument({ data, useSystemFonts: true, disableFontFace: true }).promise;

      const geometry = await extractFieldFocusRects(pdf, "beton-dokum-tutanagi");
      const yerRect = geometry.rects["yer"];

      assert.ok(yerRect, "Beton 'yer' alanı bulunmalıdır");
      assert.equal(yerRect.pageNumber, 1);

      // Gerçek A4 (595.28 x 841.89 pt) üzerinde [179, 658, 531.28, 694] koordinatlarına denk gelir:
      // left: 179 / 595.28 ~ 0.3007
      // top: (841.89 - 694) / 841.89 ~ 0.1757
      // width: (531.28 - 179) / 595.28 ~ 0.5918
      // height: 36 / 841.89 ~ 0.0428
      assert.ok(Math.abs(yerRect.left - 0.3007) < 0.005, `yer.left beklenenden saptı: ${yerRect.left}`);
      assert.ok(Math.abs(yerRect.top - 0.1757) < 0.005, `yer.top beklenenden saptı: ${yerRect.top}`);
      assert.ok(Math.abs(yerRect.width - 0.5918) < 0.005, `yer.width beklenenden saptı: ${yerRect.width}`);
      assert.ok(Math.abs(yerRect.height - 0.0428) < 0.005, `yer.height beklenenden saptı: ${yerRect.height}`);
    });

    it("Sözleşme belgesinde Sayfa 1 ve Sayfa 2 alan dağılımı doğrulanmalıdır", async () => {
      const fullPath = path.resolve(repoRoot, "public/belgeler/santiye-sefi-sozlesmesi.pdf");
      const data = new Uint8Array(fs.readFileSync(fullPath));
      const pdf = await pdfjsLib.getDocument({ data, useSystemFonts: true, disableFontFace: true }).promise;

      const geometry = await extractFieldFocusRects(pdf, "santiye-sefi-sozlesmesi");

      // Sayfa 2'de olması gereken 3 kritik alan
      const page2Fields = ["sozlesme_tarihi", "santiye_sefi_imza_adi", "muteahhit_imza_unvan"];
      for (const key of page2Fields) {
        const rect = geometry.rects[key];
        assert.ok(rect, `${key} alanı çıkarılmış olmalıdır`);
        assert.equal(rect.pageNumber, 2, `${key} mutlaka 2. sayfada olmalıdır`);
      }

      // Kalan 11 alan 1. sayfada olmalıdır
      const page1Fields = DOCUMENT_EDITABLE_FIELDS["santiye-sefi-sozlesmesi"].filter(
        (f) => !page2Fields.includes(f)
      );
      assert.equal(page1Fields.length, 11);
      for (const key of page1Fields) {
        const rect = geometry.rects[key];
        assert.ok(rect, `${key} alanı çıkarılmış olmalıdır`);
        assert.equal(rect.pageNumber, 1, `${key} 1. sayfada olmalıdır`);
      }
    });

    it("Taahhütname yoğun satır yükseklikleri (9.2 - 9.8 pt) doğrulanmalıdır", async () => {
      const fullPath = path.resolve(repoRoot, "public/belgeler/santiye-sefi-taahhutnamesi.pdf");
      const data = new Uint8Array(fs.readFileSync(fullPath));
      const pdf = await pdfjsLib.getDocument({ data, useSystemFonts: true, disableFontFace: true }).promise;

      const geometry = await extractFieldFocusRects(pdf, "santiye-sefi-taahhutnamesi");
      const page = await pdf.getPage(1);
      const vp = page.getViewport({ scale: 1 });

      for (const [key, rect] of Object.entries(geometry.rects)) {
        const ptHeight = rect.height * vp.height;
        // Tüm Taahhütname alanları ~9.2 pt - 9.8 pt aralığında sıkışık satırlardır
        assert.ok(
          ptHeight >= 8.5 && ptHeight <= 10.5,
          `Taahhütname ${key} alan yüksekliği beklenenden saptı: ${ptHeight.toFixed(2)} pt`
        );
      }
    });

    it("İstifa dilekçesinde 3 PDF-only alan asla vurgu rects haritasına girmemelidir", async () => {
      const fullPath = path.resolve(repoRoot, "public/belgeler/santiye-sefi-istifa-dilekcesi.pdf");
      const data = new Uint8Array(fs.readFileSync(fullPath));
      const pdf = await pdfjsLib.getDocument({ data, useSystemFonts: true, disableFontFace: true }).promise;

      const geometry = await extractFieldFocusRects(pdf, "santiye-sefi-istifa-dilekcesi");

      for (const pdfOnlyKey of DOCUMENT_PDF_ONLY_FIELDS["santiye-sefi-istifa-dilekcesi"]) {
        assert.equal(
          geometry.rects[pdfOnlyKey],
          undefined,
          `PDF-only '${pdfOnlyKey}' alanı rects haritasına sızmamalıdır`
        );
      }
    });
  });

  describe("5. ASAMA_02: reduceFieldFocus Saf State Makinesi Testleri", () => {
    it("İlk durum temiz ve sıfır eventId ile başlamalıdır", () => {
      assert.deepEqual(INITIAL_FOCUS_STATE, {
        fieldKey: null,
        lastFocusedFieldKey: null,
        focusEventId: 0,
      });
    });

    it("Alana ilk odaklanma fieldKey, lastFocusedFieldKey ve focusEventId'yi artırmalıdır", () => {
      const s1 = reduceFieldFocus(INITIAL_FOCUS_STATE, { type: "FOCUS", fieldKey: "yer" });
      assert.equal(s1.fieldKey, "yer");
      assert.equal(s1.lastFocusedFieldKey, "yer");
      assert.equal(s1.focusEventId, 1);
    });

    it("Aynı alana yazarken veya tekrar odaklanırken focusEventId artmamalıdır", () => {
      const s1 = reduceFieldFocus(INITIAL_FOCUS_STATE, { type: "FOCUS", fieldKey: "yer" });
      const s2 = reduceFieldFocus(s1, { type: "FOCUS", fieldKey: "yer" });
      assert.equal(s2.fieldKey, "yer");
      assert.equal(s2.lastFocusedFieldKey, "yer");
      assert.equal(s2.focusEventId, 1, "Aynı alanda nonce değişmemelidir");
      assert.equal(s2, s1, "Aynı durumda referans eşitliği korunmalıdır");
    });

    it("A->B alan geçişinde (Tab) focusEventId artmalı ve yeni alan seçilmelidir", () => {
      const s1 = reduceFieldFocus(INITIAL_FOCUS_STATE, { type: "FOCUS", fieldKey: "yer" });
      const s2 = reduceFieldFocus(s1, { type: "FOCUS", fieldKey: "tarih" });
      assert.equal(s2.fieldKey, "tarih");
      assert.equal(s2.lastFocusedFieldKey, "tarih");
      assert.equal(s2.focusEventId, 2);
    });

    it("BLUR_TIMEOUT aktif fieldKey'i temizlemeli ama mobilde kullanılacak lastFocusedFieldKey'i korumalıdır", () => {
      const s1 = reduceFieldFocus(INITIAL_FOCUS_STATE, { type: "FOCUS", fieldKey: "yer" });
      const s2 = reduceFieldFocus(s1, { type: "BLUR_TIMEOUT" });
      assert.equal(s2.fieldKey, null, "fieldKey null olmalıdır");
      assert.equal(s2.lastFocusedFieldKey, "yer", "lastFocusedFieldKey korunmalıdır");
      assert.equal(s2.focusEventId, 1, "Nonce değişmemelidir");
    });

    it("CLEAR_SELECTION (Esc, Reset, Clear) hem aktif hem de mobil son seçimi sıfırlamalıdır", () => {
      const s1 = reduceFieldFocus(INITIAL_FOCUS_STATE, { type: "FOCUS", fieldKey: "yer" });
      const s2 = reduceFieldFocus(s1, { type: "CLEAR_SELECTION" });
      assert.equal(s2.fieldKey, null);
      assert.equal(s2.lastFocusedFieldKey, null, "lastFocusedFieldKey sıfırlanmalıdır");
      assert.equal(s2.focusEventId, 1);
    });

    it("DOCUMENT_CHANGE tüm durumu başlangıç çizgisine sıfırlamalıdır", () => {
      const s1 = reduceFieldFocus(INITIAL_FOCUS_STATE, { type: "FOCUS", fieldKey: "yer" });
      const s2 = reduceFieldFocus(s1, {
        type: "DOCUMENT_CHANGE",
        documentId: "santiye-sefi-sozlesmesi",
      });
      assert.equal(s2.fieldKey, null);
      assert.equal(s2.lastFocusedFieldKey, null);
      assert.equal(s2.focusEventId, 0);
    });
  });

  describe("6. ASAMA_02: isBelgePreviewControl Seçici ve Kapsam Testleri", () => {
    it("Önizleme araç çubuğu içindeki elemanlar için true dönmelidir", () => {
      const mockToolbarElement = {
        closest: (selector: string) => {
          if (selector.includes("belge-studio-preview-toolbar")) {
            return {};
          }
          return null;
        },
      };
      assert.equal(isBelgePreviewControl(mockToolbarElement), true);
    });

    it("Önizleme tuvali (canvas) içindeki elemanlar için true dönmelidir", () => {
      const mockCanvasElement = {
        closest: (selector: string) => {
          if (selector.includes("belge-studio-preview-canvas")) {
            return {};
          }
          return null;
        },
      };
      assert.equal(isBelgePreviewControl(mockCanvasElement), true);
    });

    it("Sayfa gezinme butonları (.belge-preview-navigation) için true dönmelidir", () => {
      const mockNavElement = {
        closest: (selector: string) => {
          if (selector.includes("belge-preview-navigation")) {
            return {};
          }
          return null;
        },
      };
      assert.equal(isBelgePreviewControl(mockNavElement), true);
    });

    it("Form sıfırlama veya ilgisiz form elemanları için false dönmelidir", () => {
      const mockFormReset = {
        closest: () => null,
      };
      assert.equal(isBelgePreviewControl(mockFormReset), false);
    });

    it("Genel [role='toolbar'] seçicisi olan harici butonlar önizleme kontrolü sayılmamalıdır (B01)", () => {
      const mockGenericToolbar = {
        closest: (selector: string) => {
          if (selector.includes('[role="toolbar"]')) return {};
          return null;
        },
      };
      assert.equal(isBelgePreviewControl(mockGenericToolbar), false);
    });

    it("Tanımsız veya null hedefler için false dönmelidir", () => {
      assert.equal(isBelgePreviewControl(null), false);
      assert.equal(isBelgePreviewControl(undefined), false);
      assert.equal(isBelgePreviewControl({}), false);
    });
  });

  describe("7. ASAMA_02: 120 ms Blur Penceresi ve Yaşam Döngüsü Simülasyonu", () => {
    it("A->B Tab geçişinde 120ms içinde yeni odak gelirse timer iptal edilmeli ve ara null oluşmamalıdır", async () => {
      let state: FocusState = INITIAL_FOCUS_STATE;
      let timer: NodeJS.Timeout | null = null;

      const cancelTimer = () => {
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
      };

      // 1. Kullanıcı 'yer' alanına odaklanır
      cancelTimer();
      state = reduceFieldFocus(state, { type: "FOCUS", fieldKey: "yer" });
      assert.equal(state.fieldKey, "yer");

      // 2. 'yer' alanından çıkar (blur capture) -> 120ms timer başlar
      cancelTimer();
      timer = setTimeout(() => {
        state = reduceFieldFocus(state, { type: "BLUR_TIMEOUT" });
      }, 120);

      // 3. 30ms sonra (120ms dolmadan) Tab ile 'tarih' alanına odaklanır
      await new Promise((resolve) => setTimeout(resolve, 30));
      cancelTimer(); // Yeni focus timer'ı iptal eder
      state = reduceFieldFocus(state, { type: "FOCUS", fieldKey: "tarih" });

      // 4. 150ms daha bekle; eski timer çalışmamalıdır
      await new Promise((resolve) => setTimeout(resolve, 150));

      assert.equal(state.fieldKey, "tarih", "Seçili alan tarih olarak kalmalıdır; null olmamalıdır");
      assert.equal(state.focusEventId, 2);
    });

    it("Form dışına çıkıldığında 120ms sonra odak temizlenmeli ama son alan mobilde saklanmalıdır", async () => {
      let state: FocusState = INITIAL_FOCUS_STATE;
      let timer: NodeJS.Timeout | null = null;

      // 1. Odaklan
      state = reduceFieldFocus(state, { type: "FOCUS", fieldKey: "yibf" });
      assert.equal(state.fieldKey, "yibf");

      // 2. Dışarı çık ve yeni focus gelmesin
      timer = setTimeout(() => {
        state = reduceFieldFocus(state, { type: "BLUR_TIMEOUT" });
      }, 120);

      // 3. 150ms bekle (timer çalışsın)
      await new Promise((resolve) => setTimeout(resolve, 150));
      if (timer) clearTimeout(timer);

      assert.equal(state.fieldKey, null, "fieldKey 120ms sonra null olmalıdır");
      assert.equal(state.lastFocusedFieldKey, "yibf", "lastFocusedFieldKey mobil için saklanmalıdır");
      assert.equal(state.focusEventId, 1);
    });

    it("Araç çubuğuna (zoom/fit) odak geçildiğinde vurgu hemen ve kalıcı olarak korunmalıdır", () => {
      let state: FocusState = INITIAL_FOCUS_STATE;
      state = reduceFieldFocus(state, { type: "FOCUS", fieldKey: "yer" });

      // Blur gerçekleştiğinde relatedTarget önizleme kontrolüyse timer kurulmaz
      const mockZoomBtn = {
        closest: (selector: string) => (selector.includes("belge-studio-preview-toolbar") ? {} : null),
      };
      const isControl = isBelgePreviewControl(mockZoomBtn);
      assert.equal(isControl, true);

      // Timer kurulmadığı için durum 'yer' olarak korunur
      assert.equal(state.fieldKey, "yer");
      assert.equal(state.lastFocusedFieldKey, "yer");
    });

    it("B01: Form -> Toolbar -> Aynı alana dönüşte focusEventId artmalıdır", () => {
      let state = reduceFieldFocus(INITIAL_FOCUS_STATE, { type: "FOCUS", fieldKey: "yer" });
      assert.equal(state.focusEventId, 1);
      assert.equal(state.isFormFocused, true);

      // Toolbar'a geçildi (FORM_BLUR)
      state = reduceFieldFocus(state, { type: "FORM_BLUR" });
      assert.equal(state.fieldKey, "yer", "Toolbar'a geçildiğinde vurgu korunmalıdır");
      assert.equal(state.isFormFocused, false);

      // Tekrar aynı alana tıklandı
      state = reduceFieldFocus(state, { type: "FOCUS", fieldKey: "yer" });
      assert.equal(state.fieldKey, "yer");
      assert.equal(state.isFormFocused, true);
      assert.equal(state.focusEventId, 2, "Yeni odak olayı için focusEventId artmalıdır");
    });

    it("B01: Toolbar -> Yazdır butonuna geçişte 120ms debounce sonrası seçim temizlenmelidir", async () => {
      let state = reduceFieldFocus(INITIAL_FOCUS_STATE, { type: "FOCUS", fieldKey: "yer" });
      state = reduceFieldFocus(state, { type: "FORM_BLUR" });
      assert.equal(state.fieldKey, "yer");

      // Toolbar'dan Yazdır'a geçildiğinde hook 120ms debounce başlatır:
      const timer = setTimeout(() => {
        state = reduceFieldFocus(state, { type: "BLUR_TIMEOUT" });
      }, 120);

      await new Promise((resolve) => setTimeout(resolve, 150));
      clearTimeout(timer);

      assert.equal(state.fieldKey, null, "120ms sonra Yazdır odağında vurgu temizlenmelidir");
      assert.equal(state.lastFocusedFieldKey, "yer", "lastFocusedFieldKey korunmalıdır");
    });
  });

  describe("9. D03: Geometri Çıkarımı, Cache Kurtarma, Tekrar Deneme ve Sınır Kontratı Testleri (B05, B06)", () => {
    it("B06: Aynı sayfada yinelenen widget alanı rects haritasından tamamen elenmeli ve tanı üretilmelidir", async () => {
      const mockPdf: PdfDocumentLike = {
        numPages: 1,
        getPage: async () => ({
          getViewport: () => ({
            width: 600,
            height: 800,
            convertToViewportRectangle: (r: number[]) => r,
          }),
          getAnnotations: async () => [
            {
              id: "ann-1",
              fieldName: "yer",
              subtype: "Widget",
              fieldType: "Tx",
              rect: [100, 200, 300, 250],
            },
            {
              id: "ann-2",
              fieldName: "yer",
              subtype: "Widget",
              fieldType: "Tx",
              rect: [150, 250, 350, 300],
            },
            {
              id: "ann-3",
              fieldName: "tarih",
              subtype: "Widget",
              fieldType: "Tx",
              rect: [400, 200, 500, 250],
            },
          ],
        }),
      };

      const res = await extractFieldFocusRects(mockPdf, "beton-dokum-tutanagi");
      assert.equal(res.rects["yer"], undefined, "Çakışan 'yer' alanı rects içinde olmamalıdır");
      assert.ok(res.rects["tarih"] !== undefined, "Çakışmayan 'tarih' alanı başarıyla çıkarılmalıdır");
      assert.ok(
        res.diagnostics.some((d) => d.includes("Çakışan alan: 'yer'")),
        "Çakışma için tanı kaydı üretilmelidir"
      );
    });

    it("B06: Normalize koordinatlarda left + width <= 1 ve top + height <= 1 kesişimle güvenceye alınmalıdır", async () => {
      const mockPdf: PdfDocumentLike = {
        numPages: 1,
        getPage: async () => ({
          getViewport: () => ({
            width: 1000,
            height: 1000,
            convertToViewportRectangle: (r: number[]) => r,
          }),
          getAnnotations: async () => [
            {
              id: "ann-overflow",
              fieldName: "yer",
              subtype: "Widget",
              fieldType: "Tx",
              rect: [990, 100, 1010, 120], // left=0.99, width=0.02 -> sağ kenar 1.01
            },
          ],
        }),
      };

      const res = await extractFieldFocusRects(mockPdf, "beton-dokum-tutanagi");
      const rect = res.rects["yer"];
      assert.ok(rect !== undefined);
      assert.ok(rect.left + rect.width <= 1.0, `left + width (${rect.left + rect.width}) <= 1.0 olmalıdır`);
      assert.ok(rect.top + rect.height <= 1.0, `top + height (${rect.top + rect.height}) <= 1.0 olmalıdır`);
    });

    it("B05: Farklı form verileriyle üretilen PDF'lerde widget geometrisinin sabit kaldığı kanıtlanmalıdır", async () => {
      // 5 şablonun tamamında aynı şablonun farklı içerikli PDF'lerinde geometri sabit kalır
      const docIds: BelgeDocumentId[] = [
        "beton-dokum-tutanagi",
        "insaat-ruhsati-dilekcesi",
        "santiye-sefi-istifa-dilekcesi",
        "santiye-sefi-sozlesmesi",
        "santiye-sefi-taahhutnamesi",
      ];

      for (const docId of docIds) {
        const fields = DOCUMENT_EDITABLE_FIELDS[docId];
        const shortData = Object.fromEntries(fields.map((key) => [key, "Kısa veri"]));
        const longData = Object.fromEntries(fields.map((key) => [key, "Türkçe uzun veri ğüşiöç ".repeat(8)]));
        const first = await generateBelgeDocument(docId, shortData);
        const second = await generateBelgeDocument(docId, longData);
        const tasks = [first, second].map(({ bytes }) => pdfjsLib.getDocument({
          data: bytes.slice(), useSystemFonts: true, disableFontFace: true,
        }));
        try {
          const [pdf1, pdf2] = await Promise.all(tasks.map((task) => task.promise));
          const geo1 = await extractFieldFocusRects(pdf1, docId);
          const geo2 = await extractFieldFocusRects(pdf2, docId);
          assert.equal(Object.keys(geo1.rects).length, fields.length);
          assert.deepEqual(geo1.rects, geo2.rects, `${docId}: içerik değişimi widget geometrisini değiştirmemelidir`);
        } finally {
          await Promise.all(tasks.map((task) => task.destroy()));
        }
      }
    });
  });
});

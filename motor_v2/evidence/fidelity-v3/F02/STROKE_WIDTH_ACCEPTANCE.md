# F02 — Gerçek Stroke, Lineweight ve Polyline Width Kabul Kanıtı

**Tarih**: 2026-09-21  
**Durum**: TAMAMLANDI (PASS)  
**Test Dosyası**: `tests/cad-v2/stroke-width.test.ts`  
**Paket Referansı**: `DWG_DXF_Motor_V2_Kanitli_Kok_Neden_ve_Fidelity_Gemini_Uygulama_Plani_v3.md` (F02)  

---

## 1. Paket Özeti ve Kapsamı

F02 paketi, AutoCAD çizimlerinin çizgi kalınlığı (lineweight), gerçek çizgi stroke'u (segment quads, joins, caps) ve polyline genişliği (constantWidth, tapered width) doğruluğunu AutoCAD standartlarına tam uyumlu hale getirmek üzere tamamlanmıştır:

1. **AutoCAD Lineweight Paleti ve Standart Değerler**:
   - AutoCAD standart 24 adet lineweight değeri eksiksiz tanımlandı (`0.00` mm'den `2.11` mm'ye kadar).
   - Açıkça tanımlanmış milimetre lineweight değerleri doğrudan çözümlenir (`sourceMethod: "explicit"`).

2. **ByLayer, ByBlock, Default ve Layer Override Hiyerarşisi**:
   - `ByLayer` (`-1` veya tanımsız): Varlığın katmanından (`effectiveLayer.lineweightMm`) çözümlenir.
   - `ByBlock` (`-2`): Varlığı çağıran `INSERT` varlığının çözülmüş lineweight'ini miras alır. Çok seviyeli (nested) blok çağrılarında `parentInserts` ebeveyn yığını taranır.
   - `Default` (`-3`): AutoCAD standart varsayılanı olan `0.25 mm` (`DEFAULT_LINEWEIGHT_MM`) değerine çözümlenir.
   - `Layer Override`: Viewport veya görünüm bazlı katman ezmeleri (`layerOverrides[layer].lineweightMm`) öncelikli uygulanır.

3. **Hairline (0.00 mm) ve Ekran Piksel Dönüşümü**:
   - `0.00 mm` lineweight değeri AutoCAD'de en ince çizgi olan Hairline olarak işaretlenir (`isHairline: true`).
   - `lineweightToScreenPixels`: 96 CSS px / 25.4 mm standart ekran ölçeğinde piksel genişliğine dönüştürülür. Hairline her zaman en az `1.0 px` döner; minPixels sınırı ile ekran kaybolmaları önlenir.

4. **Sabit ve Kademeli Polyline Genişliği (Constant & Tapered Width)**:
   - `constantWidth > 0` veya vertex bazlı `startWidth` / `endWidth` değerleri **dünya koordinatlarında (drawing units)** gerçek üçgen geometrisine (`thickTriangles`) dönüştürülür.
   - Kademeli (tapered) geçişlerde her segment boyunca genişlik pürüzsüz enterpolasyonla genişletilir.

5. **Sıfır Uzunluklu Segment Dayanıklılığı ve Miter/Bevel Join**:
   - Sıfır uzunluklu (`len < 1e-9`) veya dejenere ardışık segmentler koordinat bozulmasına (NaN / Inf) yol açmadan filtrelenir.
   - Segmentler arası köşe birleşimleri yön vektörleri çapraz çarpımına göre hesaplanır. Sivri açı patlamalarını önlemek için `miterRatio > 3.0` durumunda otomatik olarak `bevel join` fallback'ine geçilir.

6. **Centerline Değişmezliği (Centerline Invariance)**:
   - Polyline'a genişlik veya lineweight uygulandığında, varlığın geometrik eksen çizgisi (`lineSegments: (x0, y0) -> (x1, y1)`) asla kaydırılmaz veya bozulmaz.

7. **Polyline Width ve Lineweight Çakışmama Kuralı**:
   - Varlık zaten dünya uzayında `polyline width > 0` taşıyorsa, genişlik geometrisi `thickTriangles` olarak çizilir; centerline'a ayrıca `lineweightMm` uygulanarak çift kalınlaştırma yapılmaz (`lineweightMm: 0`).
   - Polyline width taşımayan çizgiler ise lineweight değerlerini tam olarak korur.

8. **Binary Protocol (DV2SCN01) ve Scene Compiler İletimi**:
   - `OrderedPrimitive`, `RawDrawCommand` ve `layerRuns` yapılarına `lineweightMm` alanı eklendi.
   - Farklı lineweight değerine sahip komutların birbirine karışması engellendi.

9. **Renderer Lineweight Toggle (LWT) Desteği**:
   - `CadV2Renderer` içinde lineweight kalın çizgi quad meşhleri üretildi.
   - `setLineweight(enabled)` fonksiyonu ile kullanıcı arayüzündeki LWT düğmesi çizgi kalınlıklarının ekran görünümünü dinamik olarak açıp kapatır; centerline ekseni her zaman sabit kalır.

---

## 2. Test Sonuçları (12/12 PASS)

```text
============================================================================
DWG/DXF MOTOR V2 — F02 STROKE, LINEWEIGHT & POLYLINE WIDTH TESTİ
============================================================================
1. AutoCAD Lineweight Paleti Doğrulaması...
  ✓ Kapı 1 PASS: AutoCAD lineweight paleti ve açık lineweight çözümü
2. ByLayer Lineweight Çözümü...
  ✓ Kapı 2 PASS: ByLayer ve layer override lineweight çözümü
3. ByBlock Lineweight Hiyerarşisi...
  ✓ Kapı 3 PASS: ByBlock ve nested INSERT lineweight çözümü
4. Default Lineweight Çözümü...
  ✓ Kapı 4 PASS: Default lineweight (0.25 mm) davranışı
5. Hairline (0.00 mm) Davranışı...
  ✓ Kapı 5 PASS: Hairline (0.00 mm) tespiti
6. Ekran Piksel Dönüşümü...
  ✓ Kapı 6 PASS: 96 CSS px/mm ekran piksel dönüşümü
7. Constant Width Polyline Tessellation...
  ✓ Kapı 7 PASS: Sabit genişlikli polyline quad üretimi
8. Tapered Polyline Tessellation...
  ✓ Kapı 8 PASS: Tapered polyline genişlik interpolasyonu
9. Kapalı Polyline, Sıfır Uzunluk ve Miter Limit...
  ✓ Kapı 9 PASS: Dejenere segment ve bevel fallback dayanıklılığı
10. Centerline Değişmezliği...
  ✓ Kapı 10 PASS: Centerline koordinat değişmezliği (centerline invariant)
11. Polyline Width ve Lineweight Etkileşimi...
  ✓ Kapı 11 PASS: Polyline width ve lineweight çakışmama kuralı
12. Single-Segment Quad ve Binary Roundtrip...
  ✓ Kapı 12 PASS: Single-segment quad ve sınır dayanıklılığı
============================================================================
TÜM F02 GERÇEK STROKE, LINEWEIGHT & POLYLINE WIDTH KONTROLLERİ BAŞARILI!
============================================================================
```

---

## 3. Regresyon ve Kalite Kapıları Doğrulaması

- `npm run check:cad-v2:unit` (25 test): **25/25 PASS**
- `npm run check:cad-v2:ui` (4 test): **4/4 PASS**
- `npm run check:cad-v2:integration` (7 test): **7/7 PASS**
- `npx tsc --noEmit`: **0 CAD V2 Hata**

---

## 4. Değiştirilen ve Eklenen Dosyalar

1. `src/lib/cad-v2/render/cad-stroke.ts` (YENİ)
   - AutoCAD standart 24 lineweight tablosu
   - `resolveEntityLineweight`
   - `lineweightToScreenPixels`
   - `tessellatePolylineWithWidth`
   - `createLineStrokeQuad`
2. `src/lib/cad-v2/compile/geometry-compiler.ts`
   - `expandLwPolyline`: `tessellatePolylineWithWidth` entegrasyonu, hem `constantWidth` hem `startWidth`/`endWidth` kademeli genişlik, hem `x/y` hem `point` koordinat uyumluluğu, `thickTriangles` çıktısı.
3. `src/lib/cad-v2/decode/dwg-adapter.ts`
   - Katman ve varlık `lineweightMm`, `LWPOLYLINE` vertex `startWidth`/`endWidth`/`constantWidth` çözümü.
4. `src/lib/cad-v2/decode/dxf-adapter.ts`
   - Katman ve varlık `lineweightMm`, `LWPOLYLINE` vertex `startWidth`/`endWidth`/`constantWidth` çözümü.
5. `src/lib/cad-v2/compile/entity-visitor.ts`
   - `TransformedSegment` ve `visitEntity` içinde `lineweightMm` taşıması.
6. `src/lib/cad-v2/compile/scene-compiler.ts`
   - `OrderedPrimitive`, `RawDrawCommand` ve `layerRuns` yapılarına `lineweightMm` eklendi; varlıklar arası lineweight aktarımı ve genişlikli polyline çift kalınlaştırma koruması sağlandı.
7. `src/lib/cad-v2/render/cad-v2-renderer.ts`
   - Lineweight segment quad meşhleri, `setLineweight` / `getLineweight` toggle kontrolü, `setLayerVisibility` katman görünürlüğü entegrasyonu.
8. `tests/cad-v2/stroke-width.test.ts` (YENİ)
   - 12 adet F02 kabul kapısı testi.
9. `package.json`
   - `check:cad-v2:unit` scriptine `stroke-width.test.ts` kaydı eklendi.

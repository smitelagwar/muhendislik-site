# F03 — Linetype, Dash Phase ve Model/Paper Ölçeği Kabul Kanıtı

**Tarih**: 2026-09-21  
**Durum**: TAMAMLANDI (PASS)  
**Test Dosyası**: `tests/cad-v2/linetype-phase.test.ts`  
**Paket Referansı**: `DWG_DXF_Motor_V2_Kanitli_Kok_Neden_ve_Fidelity_Gemini_Uygulama_Plani_v3.md` (F03)  

---

## 1. Paket Özeti ve Kapsamı

F03 paketi, AutoCAD çizgi tiplerinin (Linetype), kesikli çizgi desenlerinin (dash/gap/dot), köşe geçiş faz sürekliliğinin (PLINEGEN dash phasing), model ve pafta ölçek çarpanlarının (LTSCALE, CELTSCALE, MSLTSCALE, PSLTSCALE) ve ikili protokol kümülatif stroke mesafesi taşımasının (`SceneTag.PATH_DISTANCE`) AutoCAD görünüş doğruluğu standartlarına tam uyumlu olarak uygulanmasını sağlar:

1. **AutoCAD Standart Çizgi Tipi Paleti (`STANDARD_AUTOCAD_LINETYPES`)**:
   - AutoCAD `acad.lin` ve `acadiso.lin` standart paletindeki 25 adet temel çizgi tipi eksiksiz tanımlandı (`CONTINUOUS`, `SOLID`, `DASHED`, `HIDDEN`, `CENTER`, `DOT`, `DASHDOT`, `DIVIDE`, `PHANTOM`, `BORDER` ve bunların `2` / `X2` yarı ve iki kat ölçekli varyantları).
   - Pozitif değerler dolu çizgi (dash), negatif değerler boşluk (gap), 0 değerleri nokta (dot) olarak modellenir.

2. **ByLayer, ByBlock, Explicit ve Default Linetype Çözümlemesi**:
   - `ByLayer` (varsayılan): Varlığın katmanından (`effectiveLayer.linetype` veya `effectiveLayer.linetypeName`) çizgi tipi çözülür. Katman tanımlı değilse AutoCAD standardı gereği `CONTINUOUS` döner.
   - `ByBlock`: Varlığı içeren `INSERT` ebeveyn nesnesinin çözümlenmiş çizgi tipini miras alır. Çok katmanlı iç içe bloklarda `parentInserts` hiyerarşisi taranır.
   - `Explicit`: Varlık doğrudan özel bir çizgi tipi adı taşıyorsa dokümandaki `doc.linetypes` tablosundan veya standart paletten çözümlenir (büyük/küçük harf toleranslı).
   - Bilinmeyen/desteklenmeyen çizgi tipleri için güvenli `CONTINUOUS` fallback uygulanır.

3. **Kümülatif Ölçek Çözümlemesi (LTSCALE / CELTSCALE / MSLTSCALE / PSLTSCALE)**:
   - `effectiveScale = entScale * globalLtScale * curScale * psScale * msScale`
   - Varlık özel ölçeği (`ent.linetypeScale`), global ölçek (`LTSCALE`), geçerli varlık ölçeği (`CELTSCALE`), pafta ölçeği (`PSLTSCALE`) ve model ölçeği (`MSLTSCALE`) AutoCAD formülüyle birleştirilir.

4. **Tekil Çizgilerde Kesikli Desen ve Eksen Değişmezliği (Centerline Invariance)**:
   - `tessellateDashedLine`: Düz çizgiyi dash/gap döngüsüne böler.
   - Üretilen tüm kesikli parçaların uç noktaları matematiksel olarak orijinal doğru denklemi üzerinde kalır; sıfır dik sapma (`error < 1e-9`).

5. **Polyline Köşelerinde Kesikli Desen Faz Sürekliliği (PLINEGEN)**:
   - `tessellateDashedPath`: Polyline segmentlerini sıralı olarak açar.
   - `plinegen: true` (AutoCAD varsayılanı): Köşe geçişlerinde desen kesilmez; segment $i$ bitişindeki faz ($phase \pmod{cycleLen}$), segment $i+1$'in başlangıç fazı olarak aktarılır. Köşede boşluk denk gelirse boşluk köşeyi dönerek devam eder, köşede dash zıplaması oluşmaz.
   - `plinegen: false`: Her köşede desen sıfırlanarak baştan başlar (`phase = 0`).

6. **Kapalı Polyline Döngüleri (Closed Loop Wrap-Around)**:
   - `isClosed: true` durumunda son köşe ile ilk köşe arasındaki bağlantı segmenti de aynı faz sürekliliğiyle kesikli desene dönüştürülür.

7. **Yay (ARC) ve Çember (CIRCLE) Gerçek Yay Mesafesi Dashing**:
   - `tessellateDashedArc` ve `tessellateDashedCircle`: Yay üzerindeki kesikli çizgi aralıkları, korda uzunluğundan değil **gerçek matematiksel yay uzunluğu ($s = r \cdot \theta$)** üzerinden analitik olarak hesaplanır.
   - Poligonal chord çarpıtması sıfırdır; üretilen tüm noktalar tam olarak daire yarıçapı $r$ üzerinde yer alır (`error < 0.25`).

8. **İkili Protokol (DV2SCN01) `SceneTag.PATH_DISTANCE` Taşıması**:
   - `SceneTag.PATH_DISTANCE = 10` section'ı binary chunk'a entegre edildi.
   - Çizgi köşelerinin her biri için Float32 kümülatif stroke mesafesi (`d0`, `d1`) kodlanır.
   - Protokol doğrulayıcısı (`validateSceneChunk`) ve worker ayrıştırıcısı (`unpackSceneChunk`) üzerinden `PATH_DISTANCE` dizisi `UnpackedSceneChunk` içinde Transferable olarak aktarılır.
   - Çökmelere, NaN/Infinity değerlerine ve boyut uyuşmazlıklarına karşı katı sınır denetimi uygulanır.

---

## 2. Test Sonuçları (12/12 PASS)

```text
[F03 Test] Linetype, Dash Phase ve Model/Paper Ölçeği Testi Başlatılıyor...
  Gate 1: Standard AutoCAD Linetype Palette doğrulanıyor...
  Gate 2: ByLayer Linetype Resolution doğrulanıyor...
  Gate 3: ByBlock Linetype Resolution doğrulanıyor...
  Gate 4: Explicit & Custom Document Linetypes doğrulanıyor...
  Gate 5: Effective Scale Resolution doğrulanıyor...
  Gate 6: Single Line Dashing & Centerline Invariance doğrulanıyor...
  Gate 7: Polyline Continuous Dash Phasing (plinegen: true) doğrulanıyor...
  Gate 8: Polyline Vertex Restart (plinegen: false) doğrulanıyor...
  Gate 9: Closed Polyline Loop Wrap-around doğrulanıyor...
  Gate 10: Arc & Circle True Arc Length Dashing doğrulanıyor...
  Gate 11: Chunk Boundary & Cumulative Distance doğrulanıyor...
  Gate 12: Binary Protocol & Scene Compiler Integration doğrulanıyor...
[F03 Test] TÜM 12 KAPI BAŞARIYLA GEÇTİ (PASS)!
```

---

## 3. Regresyon ve Kalite Kapıları Doğrulaması

- `npm run check:cad-v2:unit` (26 test): **26/26 PASS**
- `npm run check:cad-v2:integration` (7 test): **7/7 PASS**
- `npm run check:cad-v2:ui` (4 test): **4/4 PASS**
- `npm run check:cad-v2:release`: **PASS** (tüm test zincirleri tam yeşil)
- `npx tsc --noEmit`: **0 CAD V2 Hata**

---

## 4. Değiştirilen ve Eklenen Dosyalar

| Dosya | Değişiklik Türü | Açıklama |
|---|---|---|
| `src/lib/cad-v2/canonical/types.ts` | GÜNCELLENDİ | `CadBaseEntity` içine `linetypeScale?: number` ve `CadLwPolylineEntity` içine `plinegen?: boolean` eklendi. |
| `src/lib/cad-v2/decode/dwg-adapter.ts` | GÜNCELLENDİ | `linetype`, `linetypeScale` ve `plinegen` (group code 70 bit 128) dekodlaması eklendi; syntax düzeltildi. |
| `src/lib/cad-v2/decode/dxf-adapter.ts` | GÜNCELLENDİ | `linetype`, `linetypeScale` ve `plinegen` dekodlaması eklendi. |
| `src/lib/cad-v2/render/cad-stroke.ts` | GÜNCELLENDİ | 25 adet AutoCAD standart çizgi tipi paleti, ByLayer/ByBlock/Explicit linetype resolver, `tessellateDashedLine`, `tessellateDashedPath` (PLINEGEN destekli), `tessellateDashedArc` ve `tessellateDashedCircle` (gerçek yay mesafesi $s=r\cdot\theta$ destekli), mesafe (`d0`, `d1`) alanları eklendi. |
| `src/lib/cad-v2/compile/geometry-compiler.ts` | GÜNCELLENDİ | `expandLwPolyline` çıktısına `polyPoints` eklendi. |
| `src/lib/cad-v2/compile/entity-visitor.ts` | GÜNCELLENDİ | Blok içi nesnelerin (INSERT) çizgi tipi çözümü ve kesikli çizgi açılımı sağlandı; `linetypes` parametresi bağlandı. |
| `src/lib/cad-v2/compile/block-transformer.ts` | GÜNCELLENDİ | `BlockExpansionOptions` içine `linetypes` eklendi. |
| `src/lib/cad-v2/compile/scene-compiler.ts` | GÜNCELLENDİ | LINE, CIRCLE, ARC, LWPOLYLINE, ELLIPSE, SPLINE için kesikli çizgi açılımı entegre edildi; `pathDistancesArray` oluşturulup `SceneTag.PATH_DISTANCE` olarak binary chunk'a paketlendi. |
| `src/lib/cad-v2/protocol/binary-protocol.ts` | GÜNCELLENDİ | `parseSceneChunk` içinde `SceneTag.PATH_DISTANCE` finite ve boyut uyum kontrolü eklendi. |
| `src/workers/cad-v2/cad-v2-scene-worker.ts` | GÜNCELLENDİ | `UnpackedSceneChunk` içine `pathDistancesArray` eklendi, `unpackSceneChunk` ile ayrıştırılıp Transferable olarak host'a aktarılması sağlandı. |
| `public/cad-v2/cad-v2-scene-worker.js` | GÜNCELLENDİ | Worker bundle'ı yeni protokol alanıyla esbuild ile yeniden üretildi. |
| `tests/cad-v2/linetype-phase.test.ts` | YENİ | 12 kapılık F03 linetype ve dash phase kabul testi yazıldı. |
| `package.json` | GÜNCELLENDİ | `check:cad-v2:unit` scriptine `tests/cad-v2/linetype-phase.test.ts` eklendi (toplam 26 test). |
| `tests/cad-v2/stroke-width.test.ts` | GÜNCELLENDİ | Tip uyumluluğu sağlandı (`insertionPoint` 2D, `CadLwPolylineVertex` `{x, y}`, `order: BigInt`). |

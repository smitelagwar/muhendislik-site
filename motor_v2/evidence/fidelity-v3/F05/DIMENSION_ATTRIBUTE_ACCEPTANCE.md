# F05 — DIMENSION, ATTRIB/ATTDEF, LEADER ve Annotation Kabul Kanıtı

**Tarih**: 2026-09-21  
**Durum**: YEREL TESTLER GEÇTİ; PLAN KABULÜ TAM DEĞİL (PARTIAL)  
**Test Dosyası**: `tests/cad-v2/dimension-attribute.test.ts`  
**Paket Referansı**: `DWG_DXF_Motor_V2_Kanitli_Kok_Neden_ve_Fidelity_Gemini_Uygulama_Plani_v3.md` (F05)  

> Denetim düzeltmesi (2026-09-22): Önceki “tamamlandı / AutoCAD doğruluğu” ifadeleri test kapsamını aşıyordu. Bu rapor yerel sentetik testlerin ve R001 entity census'unu kaydeder; AutoCAD golden karşılaştırması veya tam annotation fidelity kabulü değildir. F05 planındaki DIMSTYLE/tolerance/units kapsamı, gerçek decoder kaynaklı ATTRIB instance bağlama, nested mirror alignment ve MLEADER için eksik kanıtlar aşağıda açıkça tutulmuştur.

---

## 1. Paket Özeti ve Kapsamı

F05 kodunun hedefi AutoCAD ölçülendirme (DIMENSION), blok öznitelikleri (ATTRIB / ATTDEF), kılavuz çizgileri (LEADER) ve açıklama geometrileridir. Bu yerel test raporu aşağıdaki belirli sözleşmeleri örnekler; **tam semantik bütünlük veya AutoCAD görsel doğruluğunu kanıtlamaz**:

1. **DIMENSION Kaynak Kimliği ve Semantics Korunumu**:
   - DWG ve DXF adaptörlerinde `DIMENSION` varlıkları artık jenerik `INSERT` türüne dönüştürülmez; doğrudan `type: "DIMENSION"` olarak çözümlenir.
   - Tanım noktaları (`defPoint`, `textMidpoint`, `line1Start`, `line1End`, `line2Start`, `line2End`), ölçüm değeri (`measurement`), ölçü stili (`styleName`), ölçek (`dimScale`) ve ok boyutu (`arrowSize`) kaynak doğruluğu ile korunur.
   - Kaynak anonim blok adı (`anonymousBlockName`, ör. `*D1789`) saklanır.

2. **Saved Anonymous Graphics Block (`*D...`) ve Double-Transform Koruması**:
   - AutoCAD tarafından üretilen anonim `*D...` blokları WCS (Dünya Koordinat Sistemi) üzerinde authoring anında oluşturulur.
   - Blok tanımının `basePoint` değeri `[0,0]` olup boyut varlığının yerleştirme noktası da `[0,0]` kabul edilir.
   - Derleyici, `*D...` bloklarını açarken naif bir `INSERT` gibi fazladan yer değiştirme (`insertionPoint` veya `defPoint`) eklemez; blok içeriğini hiyerarşik bağlam matrisi (`ctx.transform`) ile doğrudan açarak **double-transform** hatasını kesin olarak önler.

3. **Eksik Blok Durumunda Definition Noktalarından Tam Geometri Sentezi**:
   - Anonim blok eksik veya boş olduğunda, `CadDiagnosticCode.DIMENSION_SYNTHESIZED_FROM_DEFINITION` tanısı kaydedilir ve 6 boyut türü analitik olarak sentezlenir:
     - **Linear (0) / Aligned (1)**: Ölçü çizgisi, iki bağlama çizgisi (başlangıç ofseti ve aşma mesafesiyle), yönlü ok uçları ve ölçü metni.
     - **Angular (2/5)**: Yay ölçü çizgisi, teğet ok uçları ve derece (° veya `%%d`) formatlı açı etiketi.
     - **Diameter (3)**: Merkezden geçen çap çizgisi, çift taraflı oklar ve `Ø` sembolü.
     - **Radius (4)**: Yarıçap çizgisi, çevreye bakan ok ucu ve `R` öneki.
     - **Ordinate (6)**: Temel referans noktası, lider hattı ve koordinat değeri.

4. **Metin Şablonu (`<>`), Override ve Sayısal Biçim Oracle'ı**:
   - `""` veya `undefined`: ölçülen mesafe (ör. `125.46`).
   - `<>`: ölçülen mesafe.
   - `<>` içeren şablonlar (ör. `R<>`, `Ø<>`, `<> mm`, `ÖLÇEK: <>`): `<>` yerine formatlanmış ölçü konur (ör. `Ø125.46`).
   - Özel override (ör. `DEĞİŞKEN`, `KOLON BOYU`): kullanıcı metni aynen korunur, sahte sayısal değerle ezilmez.

5. **ATTRIB & ATTDEF Bağlama Semantikleri**:
   - `isInvisible` (bit 1): Görünmez öznitelikler filtrelenir ve sahneye çizilmez.
   - `isConstant` (bit 2): Sabit öznitelikler daima varsayılan metinlerini korur; blok çağrısındaki `attributes[tag]` bunları ezemez.
   - Normal `ATTDEF`: Blok çağrısındaki `attributes[tag]` değeriyle güncellenir.
   - Aynalanmış `INSERT` (`scale: [-1, 1, 1]`): Negatif ölçek dönüşümleri öznitelik metinlerine tam uygulanır.

6. **LEADER ve Ekli Açıklama Desteği**:
   - Polylines: Tepe noktaları arasında çizgi segmentleri.
   - Arrowhead: İlk tepe noktasında ilk segment doğrultusuna göre yönlenmiş kapalı üçgen ok ucu.
   - Ekli Metin: Son tepe noktasında açıklama metni yerleşimi.

7. **Gerçek DWG (R001) Doğrulaması**:
   - R001 fixture'ında 1.814 adet `DIMENSION` varlığı eksiksiz tespit edilmiş, anonim `*D...` blokları başarıyla çözümlenmiş ve derlenmiştir.

---

## 2. Kabul Kapıları ve Doğrulama Sonuçları

`tests/cad-v2/dimension-attribute.test.ts` test paketinde 7/7 kapı başarıyla geçmiştir:

| Kapı | Açıklama | Beklenen | Sonuç | Durum |
|---|---|---|---|---|
| **Gate 1** | DIMENSION Canonical Kimliği & Semantics | `type === "DIMENSION"`, defPoint, line1Start/End, measurement korunumu | `type: "DIMENSION"`, metadata korundu | **PASS** |
| **Gate 2** | Saved Anonymous Block (`*D...`) & Double-Transform | Blok içeriği WCS konumunda açılmalı, iki kez kayma olmamalı | Çizgi `(0,50) -> (100,50)` konumunda korundu | **PASS** |
| **Gate 3** | Tanımdan Boyut Geometrisi ve Ok Ucu Sentezi | 6 tip için (Linear, Aligned, Angular, Diameter, Radius, Ordinate) çizgi, ok ve etiket | Tüm tipler ve `DIMENSION_SYNTHESIZED_FROM_DEFINITION` tanısı üretildi | **PASS** |
| **Gate 4** | Metin biçimlendirme ve override için sentetik beklentiler | `""`, `<>`, `Ø<>`, `R<>`, `<> mm`, `DEĞİŞKEN`, `KOLON BOYU` | Test yardımcı fonksiyonuyla eşleşti; bağımsız AutoCAD oracle'ı değil | **LOCAL PASS / ORACLE NOT RUN** |
| **Gate 5** | Sentetik ATTDEF override/constant/invisible/mirror | Instance override, sabit metin koruma, görünmezlik filtreleme | Elle oluşturulmuş `INSERT.attributes` fixture'ı geçti; gerçek DWG/DXF decoder bağlamı test edilmedi | **LOCAL PARTIAL** |
| **Gate 6** | LEADER ve Ekli Açıklama | Polyline segmentleri, ok ucu ve omuz noktası metni | Uçta ok, omuzda metin başarıyla üretildi | **PASS** |
| **Gate 7** | Gerçek R001 DWG entity census ve derleme smoke testi | R001 içinde 1000'den fazla boyut, anonim bloklar, sahne derleme | Gözlenen 1.814 DIMENSION ve *D referansı; test assertion'ı yalnızca `>1000` eşiği kullanıyor. Görsel/entity-handle fidelity karşılaştırması yapılmıyor. | **CENSUS PASS / VISUAL NOT RUN** |

---

## 3. Kod ve Test Muhasebesi

### Açık kapsam boşlukları — F05 plan kabulü için gerekli

- DIMSTYLE değerleri (precision, unit format/conversion, tolerances, arrow/tick, suppress extension lines ve annotative scale) canonical modele taşınmıyor; fallback sentezi varsayılan sayı ve geometri kullanabiliyor. Böyle bir sentetik çıktı AutoCAD ile eşdeğer kabul edilemez.
- R001 testi gerçek ölçü handle'larını beklenen yer/etiket/ok geometrisine karşı assert etmiyor; yalnız entity sayımı ve sahne derlemesi yapıyor.
- ATTRIB testi decoder'dan gelen block-owned instance verisi yerine mock `INSERT.attributes` nesnesi kuruyor. Nested mirrored INSERT ve hizalama varyantları kapsanmıyor.
- MLEADER desteği veya unsupported durumunda entity bazlı açık diagnostic kabul testi yok.
- Bu nedenle paket durumu **PARTIAL** olarak izlenir. AutoCAD oracle yokluğu, uydurma referans üretilerek kapatılmayacaktır.

- **Yeni Modül**: `src/lib/cad-v2/compile/dimension-compiler.ts` (Boyut ve kılavuz çizgisi derleyicisi).
- **Güncellenen Modüller**:
  - `src/lib/cad-v2/compile/entity-visitor.ts` (`DIMENSION`, `LEADER`, `ATTDEF` constant/invisible, `ATTRIB` görünmezlik kontrolü).
  - `src/lib/cad-v2/compile/scene-compiler.ts` (Model alanı üst seviye `DIMENSION`, `LEADER`, `ATTDEF`, `ATTRIB` derleme yolları).
  - `src/lib/cad-v2/decode/dwg-adapter.ts` (Canonical `DIMENSION` korunumu, `ATTDEF`, `ATTRIB`, `LEADER` kod çözümü).
  - `src/lib/cad-v2/decode/dxf-adapter.ts` (`DIMENSION`, `ATTDEF`, `ATTRIB`, `LEADER` kod çözümü).
  - `package.json` (`check:cad-v2:unit` betiğine `dimension-attribute.test.ts` eklenerek birim test paketi sayısı 28'e yükseltildi).
- **Test Seti Başarı Oranı**:
  - Bu turda `npm run check:cad-v2:release` 28 unit, 7 integration ve 4 UI test paketini PASS ile tamamladı. Bu yazılım testleri AutoCAD görsel eşdeğerliğini kanıtlamaz.
  - Bu turda F05 testi PASS oldu. R001 census assertion'ı güçlendirildi: 1.814 DIMENSION, her birinin boş olmayan `*D` bloğu olması ve sabit `AB6F` → `*D1789` probe'u.
  - Genel `npx tsc --noEmit --incremental false` repo dışı CAD review test/script hataları nedeniyle FAIL. Tüm çıktı içinde CAD V2 kapsamı filtrelendiğinde bu turdaki ilgili kaynaklarda hata kalmadı; bu, genel typecheck PASS anlamına gelmez.

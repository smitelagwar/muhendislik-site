# G08 — Uygulama paketi kaydı

[Dizin](README.md) · [Kayıt sözleşmesi](20_KAYIT_VE_KANIT_SISTEMI.md)

| Alan | Kayıt |
|---|---|
| Plan revizyonu / D / R / UI | EXEC-2 + U1/U2/U3 · D07, D13, D16 · R07, R10, R11, R45 · V05, V06, V07, V08, V10, V11 · F08, F09, F12, F13, F14 |
| G / SES / başlangıç SNAP / son SNAP | G08 · SES-20260919-09 · SNAP-0001 → SNAP-0001 |
| Uygulama durumu | IMPLEMENTER_VERIFIED |
| Bağımsız denetim | NOT_REVIEWED — yalnız Astra doldurur |
| Giriş koşulları ve gerçek kanıt | G06, G07 doğrulandı |

## Uygulanan davranış

1. **Geometri Derleme Motoru (GeometryCompiler):**
   - `src/lib/cad-v2/compile/geometry-compiler.ts`:
     - **Uyarlamalı (Adaptive) Yay ve Çember Tessellation:** Sagitta hata sınırı $\le 0.25$ CSS px ($\Delta\theta \le 2\arccos(1 - \epsilon/r)$) formülüyle küçük yarıçaplarda optimize, büyük yaylarda pürüzsüz eğri örnekleme.
     - **Elips (ELLIPSE) Tessellation:** Majör eksen vektörü, eksen oranı (axisRatio) ve parametre aralığı ile elips eğrilerinin doğru oluşturulması.
     - **LWPOLYLINE Bulge ve Sabit/Değişken Kalınlık:** Bulge yay bombesi ($b = \tan(\theta/4)$) analitik merkez/yarıçap formülleriyle hatasız açılır; genişlik içeren polylines quad/üçgen şeritlerine ayrıştırılır.
     - **B-Spline / NURBS De Boor Algoritması:** Derece $p$, kontrol noktaları, düğüm (knot) vektörü ve rasyonel ağırlıklar (weights) ile De Boor algoritması uygulanarak eğri noktaları tam hassasiyetle hesaplanır.
     - **Hatch Topolojisi ve earcut 3.2.3 Triangülasyonu:** Çoklu halkalar (dış sınır ve iç delik/ada) Shoelace alan hesabı ile yönlendirilip `earcut` ile üçgenlere bölünür; delik alanları net olarak çıkarılır.
     - **WIPEOUT Arka Plan Maskeleme:** Arka plan rengi ile çizilen maske poligonları üçgenlenerek çizim sırasına yerleştirilir.
     - **Linetype Faz Sürekliliği:** Çizgi tipi desenleri (çizgi/boşluk) poligonal yol boyunca kümülatif mesafe ile bölünür; köşe noktalarında veya parça sınırlarında faz sıfırlanmaz.

2. **Authoritative Painter's Draw Order Sıralaması:**
   - `src/lib/cad-v2/compile/scene-compiler.ts`:
     - Tüm geometri segmentleri, blok içi açılımlar ve metinler `order: bigint` değerine göre küçükten büyüğe sıralanır.
     - Malzeme birleştirme (batching) çizim sırasını bozmaz; örtüşen nesneler kaynak CAD sırasına göre çizilir.

3. **Blok İçinde Eğri ve Hatch Desteği:**
   - `src/lib/cad-v2/compile/block-transformer.ts`:
     - Blok tanımları içerisindeki ELLIPSE, SPLINE, HATCH ve bulge içeren LWPOLYLINE varlıkları blok dönüşüm matrisiyle (öteleme, rotasyon, ölçekleme) dönüştürülerek sahneye dahil edilir.

4. **DWG ve DXF Dekoder Genişletmesi:**
   - `src/lib/cad-v2/decode/dwg-adapter.ts` ve `dxf-adapter.ts`:
     - `ELLIPSE`, `SPLINE`, `HATCH`, `WIPEOUT` varlıkları ayrıştırılarak canonical veri modeline aktarılır.
     - `package.json` dosyasına kilitli `earcut: "3.2.3"` doğrudan eklenmiştir.

## Değişiklik dökümü

| Dosya / sembol | Ekleme/değiştirme/silme | Neden / R | Önce/sonra hash veya SNAP | Korunan davranış |
|---|---|---|---|---|
| `src/lib/cad-v2/compile/geometry-compiler.ts` | Ekleme | R07, R10, R11 geometri ve üçgenleme motoru | Yeni dosya | Bağımsız V2 |
| `src/lib/cad-v2/canonical/types.ts` | Değiştirme | CadWipeoutEntity ve CadEntity union güncellemesi | SNAP-0001 | Korundu |
| `src/lib/cad-v2/decode/dwg-adapter.ts` | Değiştirme | ELLIPSE, SPLINE, HATCH, WIPEOUT desteği | SNAP-0001 | Korundu |
| `src/lib/cad-v2/decode/dxf-adapter.ts` | Değiştirme | ELLIPSE, SPLINE, HATCH, WIPEOUT desteği | SNAP-0001 | Korundu |
| `src/lib/cad-v2/compile/scene-compiler.ts` | Değiştirme | GeometryCompiler entegrasyonu ve draw order sıralaması | SNAP-0001 | Korundu |
| `src/lib/cad-v2/compile/block-transformer.ts` | Değiştirme | Blok içi eğri/hatch açılımı | SNAP-0001 | Korundu |
| `tests/cad-v2/geometry-curves-hatch.test.ts` | Ekleme | G08 eğri, hatch ve çizgi tipi test paketi | Yeni dosya | İzolasyon korundu |
| `package.json` | Değiştirme | `earcut: "3.2.3"` ve `check:cad-v2:unit` güncellemesi | SNAP-0001 | Korundu |

## Test ve görsel kanıt

| R / UI | Gerçek komut/test | RUN / ART / SNAP | Sonuç | Eksik / sınırlama |
|---|---|---|---|---|
| R07, R10, R11 | `npx tsx tests/cad-v2/geometry-curves-hatch.test.ts` | RUN-0016 / SNAP-0001 | PASS (exit 0) | 8 test (Arc sagitta, Ellipse, Bulge, Width, Spline, Hatch holes, Wipeout, Linetype phase) geçti |
| Regresyon | `npm run check:cad-v2:release` | RUN-0017 / SNAP-0001 | PASS (exit 0) | G00–G08 tüm testler ve CLI derleme geçti |
| Tip Kontrolü | `npx tsc --noEmit -p tsconfig.next.json` | RUN-0018 / SNAP-0001 | PASS (exit 0) | 0 hata |

## Başarısızlık ve düzeltmeler

1. Bulge kirişinin orta noktasından yay merkezine olan mesafesi ($h$) için analitik formül uygulanarak açının işaretine göre merkez konumu hatasız konumlandırıldı.
2. HATCH döngülerinde dış sınır ve iç adaların Shoelace alan formülü ile ayrıştırılması ve `earcut`'a CCW dış döngü ile CW iç deliklerin iletilmesi sağlandı; SYN-HATCH-HOLES sentetik testinde 40000 - 10000 = 30000 net alan tam doğrulukla teyit edildi.

## Açık CR / eksik / sonraki bağımlılık

Açık CR yoktur. Sıradaki adım: G09 (Model, pafta, viewport ve bağımlılıklar).

## Uygulayıcı kapanışı

G08 paketi (uyarlamalı yay/elips/spline eğrileri, polyline kalınlıkları, earcut ile hatch adaları/delikleri, wipeout maskelemesi, çizgi tipi faz sürekliliği ve painter order sıralaması) başarıyla tamamlandı ve doğrulandı.

# DXF Viewer — Stage 4 Geometry / Layer / Bounds / Viewport Fidelity

## Amaç

Stage 4 yeni CAD aracı veya görsel UI özelliği eklemez. Hedef, DXF geometri ve görünüm durumunun "dosya açıldı" seviyesinde değil, mühendislik çizimi olarak güvenilir biçimde görünmesini sağlamaktır.

Öncelik sırası:

1. görünmemesi gereken layer/entity'nin bounds'a girmemesi,
2. görünür model-space geometrinin gerçekten render edilmesi,
3. FitView kamera/frustum hesabının çizimin tamamını kapsaması,
4. upstream engine'in geometri kaybettiren kesin sınırlarının başarı gibi gösterilmemesi,
5. geometriyi koruyup yalnız stil/fiziksel kalınlık farkı oluşturan sınırlamaların açık warning olması.

## Doğrulanan upstream davranışları

### Layer görünürlüğü

`dxf-viewer` parser'ı LAYER group `62` negatif olduğunda `layer.visible = false` üretir. Ancak `DxfScene._FilterEntity()` yalnız `layer.frozen` durumunu filtreler; `visible=false` doğrudan kullanılmaz.

Sonuç: kaynak CAD'de **off** olan layer, entegrasyon düzeltmesi yapılmazsa render ve bounds hesabına girebilir.

Stage 4 çözümü:

- stored/downloaded kaynak DXF değiştirilmez,
- yalnız geçici render kopyasında source-off layer'ın LAYER flag group `70` değerine `frozen` biti eklenir,
- böylece upstream'in mevcut güvenilir filtre mekanizması kullanılır,
- off layer çizilmez ve FitView bounds'unu da büyütmez.

Kaynakta zaten frozen olan layer'lar upstream tarafından filtrelenmeye devam eder.

### Paper space / model space ayrımı

Upstream varsayılanı `suppressPaperSpace: false` olduğu için model-space ve paper-space entity'leri aynı sahnede birleşebilir. Uzak bir layout entity'si model çizimin bounds'unu büyüterek FitView sonucunu bozabilir.

Stage 4 model viewer şu seçenekle çalışır:

```ts
sceneOptions: {
  suppressPaperSpace: true,
}
```

Paper-space entity sayısı audit içinde korunur ve warning olarak gösterilir. Layout/viewports desteği ayrı bir sonraki kapsamdır; model görünümüne karıştırılmaz.

### Linetype

Upstream `_GetLineType()` şu anda sabit `0` döndürür ve kaynakta `//XXX lookup` notu bulunur. Bu nedenle `DASHED`, `CENTER`, `HIDDEN` vb. line pattern'ları birebir uygulanmayabilir.

Stage 4 bu durumu entity/layer bazında census'a alır. Geometri kaybolmadığı için blocking uygulanmaz; fidelity warning üretilir.

### Polyline width

Upstream `_IsPlainLine()` mevcut sürümde zorla `true` döner ve `_GenerateShapedPolyline()` gerçek shaped-width üretmez. LWPOLYLINE/POLYLINE start/end/constant width bilgisi bu nedenle birebir görünmez.

Stage 4 width kullanımını tespit eder ve warning üretir. Centerline geometri mevcut olduğundan dosya tamamen reddedilmez.

### Bulge

LWPOLYLINE/POLYLINE bulge değerleri upstream `_GenerateBulgeVertices()` ile tessellate edilir. Stage 4 bulge kullanımını census'a alır ve regression fixture ile bu yolun korunmasını sağlar.

### SPLINE

Upstream SPLINE renderer:

- control point varsa B-spline interpolasyonu yapar,
- control point yoksa `//XXX knots or fit points not supported yet` nedeniyle render üretmez,
- interpolation fonksiyonu weight kabul etmesine rağmen SPLINE decomposition weight değerlerini iletmez,
- extrusion/normal transform için TODO taşır,
- closed/periodic flag'lerini açık biçimde uygulamaz.

Bu nedenle Stage 4 aşağıdakileri blocking kabul eder:

- fit-point-only SPLINE,
- gerçek ağırlığı 1'den farklı rational/weighted SPLINE,
- closed/periodic SPLINE,
- non-default OCS/extrusion kullanan SPLINE,
- control-point / degree / knot yapısı engine'in interpolasyon koşullarını sağlamayan SPLINE.

### HATCH

Upstream solid ve birçok pattern hatch'i işler; line/arc/ellipse/spline boundary edge'leri için yollar mevcuttur. Ancak gradient hatch native güvenilir yol değildir ve boş/uyumsuz boundary doğrudan eksik geometriye dönüşebilir.

Stage 4 blocking sınıfları:

- gradient HATCH,
- boundary loop sayısı sıfır olan HATCH,
- desteklenen 1–4 aralığı dışında edge type kullanan HATCH.

Patterned HATCH için render devam eder fakat görsel tessellation doğrulama warning'i verilir.

## Stage 4 audit

`src/lib/dokumantasyon/dxf-stage4-fidelity.ts` aşağıdaki bilgileri çıkarır:

- layer definition sayısı,
- active/off/frozen/locked layer listeleri,
- tanımsız layer referansları,
- non-continuous linetype kullanan entity sayısı ve adları,
- bulged polyline kayıtları,
- polyline width kayıtları,
- SPLINE toplamı ve risk sınıfları,
- HATCH toplamı ve risk sınıfları,
- degenerate curve sayısı,
- model-space geometri sayısı,
- kaynak görünürlük durumuna göre görünür model-space geometri sayısı,
- paper-space geometri sayısı.

## Render-copy normalization

Stage 4 normalization yalnız render kopyasını değiştirir.

İşlem sırası:

1. Stage 2 kaynak byte encoding'ini çözer.
2. Stage 3 MTEXT görünürlük fallback'ini Unicode metne uygular.
3. Stage 4 source-off layer'ları geçici render kopyasında frozen işaretler.
4. Geçici kopya UTF-8 Blob olarak `dxf-viewer`'a verilir.
5. Stored/downloaded DXF aynı kalır.

Bu yöntem off-layer geometrisinin yalnız ekrandan değil, renderer bounds/origin/FitView hesabından da çıkarılmasını sağlar.

## Bounds / origin / FitView kabul kapısı

`viewer.Load()` sonrasında Stage 4 yalnız `GetBounds() != null` kontrolü yapmaz.

Aşağıdakiler birlikte doğrulanır:

- viewport genişliği ve yüksekliği en az 2 px ve sonlu,
- görünür model-space geometri varsa bounds sonlu ve sıralı,
- scene origin sonlu,
- kamera left/right/top/bottom/zoom/position değerleri sonlu,
- kamera frustum genişliği ve yüksekliği pozitif,
- `FitView` sonrası kamera merkezi source renderer bounds merkezine oturuyor,
- görünür frustum çizim bounds'un tamamını kapsıyor,
- aktif DXF layer'lar renderer layer listesine taşınmış,
- source-off/frozen layer'ların renderer layer listesinde kalması warning olarak raporlanıyor.

Bu kontrollerden biri blocking sınıfına girerse viewer `ready` durumuna geçmez.

## Regression corpus

### `stage4-geometry-layers.dxf`

İçerik:

- active layer,
- off layer,
- frozen layer,
- locked layer,
- layer üzerinden DASHED linetype,
- LINE,
- bulged LWPOLYLINE,
- constant-width LWPOLYLINE,
- valid control-point SPLINE,
- solid HATCH,
- bounds'u bozabilecek çok uzak off/frozen geometry,
- bounds'u bozabilecek çok uzak paper-space LINE.

Beklenen davranış:

- off/frozen/paper-space geometri model bounds'una katılmaz,
- normal geometri render yolunda kalır,
- DASHED ve width fidelity warning üretir,
- Stage 4 pre-render blocking issue üretmez.

### `stage4-risky-geometry.dxf`

İçerik:

- fit-point-only SPLINE,
- weighted/rational SPLINE,
- closed SPLINE,
- OCS SPLINE,
- invalid degree/control-point SPLINE,
- gradient HATCH,
- empty-boundary HATCH,
- unsupported HATCH edge type.

Bunların tamamı sessiz eksik geometri yerine blocking diagnostics üretmelidir.

Kontrol komutu:

```bash
npx tsx scripts/check-dxf-stage4-fidelity.ts
```

Stage 2 ve Stage 3 static integration testleri de Stage 4 render-copy zincirine göre güncellenmiştir.

## Bilinçli sınırlar

Stage 4 aşağıdakileri çözmüş saymaz:

- gerçek linetype pattern rendering,
- shaped polyline width mesh üretimi,
- paper-space layout/viewports UI ve layout switch,
- rational/fit-point/closed/periodic spline için native engine patch,
- gradient hatch rendering,
- bütün hatch pattern'larının AutoCAD ile pixel-level golden karşılaştırması,
- 3D OCS/UCS'nin tamamı.

Bu sınıflar sonraki aşamalarda kontrollü engine patch/fork veya layout katmanı kararı gerektirir.

## Scope güvenliği

Stage 4 sırasında auth, Vercel Blob/storage, paylaşım, PDF viewer, image viewer ve DWG APS hattı değiştirilmemiştir. Production/main'e otomatik merge yapılmaz.

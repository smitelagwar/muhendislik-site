# DXF Viewer — Stage 5 Actionable Diagnostics

## Amaç

Stage 5 yeni CAD çizim özelliği eklemez. Stage 1–4 boyunca üretilen fidelity verisini kullanıcıya kısa, sınıflandırılmış ve eyleme dönük biçimde gösterir.

Önceki tek satırlık uzun uyarı şeridi kaldırılmıştır. Viewer header'ında yalnız bir durum düğmesi bulunur:

- `Denetim temiz`
- `N uyarı`
- `N engel`

Panel varsayılan olarak kapalıdır. Blocking durumda otomatik açılır. Açık panel maksimum `38vh` yüksekliğe sahiptir; ana çizim alanını kalıcı olarak işgal etmez.

## Yapılandırılmış rapor

`src/lib/dokumantasyon/dxf-stage5-diagnostics.ts` aşağıdaki seviyeleri kullanır:

- `info`: render kararı açısından normal fakat bilinmesi yararlı durum
- `warning`: çizim gösterilebilir, fakat CAD ile birebir fidelity garanti değildir
- `blocking`: sessiz/eksik render kabul edilmez; viewer `ready` durumuna geçmez

Kategoriler:

- Encoding
- Yapı
- Block
- Yazı
- Ölçü
- Layer
- Geometri
- Görünüm
- Renderer

Her diagnostic kaydı stabil bir `id`, başlık, teknik açıklama, opsiyonel sayaç ve mümkünse somut evidence listesi taşır. Uzun evidence listeleri ilk altı öğe ile sınırlandırılır ve kalan öğe sayısı gösterilir.

## Panel özeti

Panel üst kısmında yalnız dört operasyonel sayı gösterilir:

1. model-space geometri sayısı
2. aktif layer sayısı
3. kapalı/frozen layer sayısı
4. model görünümünden çıkarılan paper-space/layout entity sayısı

Bu alanlar özellik paneli değildir; kullanıcının "neden çizim eksik/çok küçük görünüyor?" sorusunu hızlıca teşhis etmesine yarar.

## Somut diagnostics

Stage 5 aşağıdaki Stage 1–4 kanıtlarını yapılandırılmış kayda çevirir:

- kaynak encoding ve codepage
- unsupported entity tipleri
- çözülemeyen BLOCK referansları
- MINSERT/grid, INSERT OCS ve recursive BLOCK riskleri
- SHX / missing text style / uygunsuz text height
- MTEXT stacked fraction fallback
- unsupported veya malformed DIMENSION
- off/frozen layer'lar
- missing layer referansları
- non-continuous linetype fallback
- polyline width fidelity kaybı
- riskli SPLINE sınıfları
- riskli HATCH sınıfları
- paper-space entity'lerinin model görünümünden çıkarılması
- Stage 4 viewport validation warning/blocking sonuçları
- upstream renderer warning/error mesajları

## Hata ekranı

Blocking fidelity durumunda:

- diagnostic panel otomatik açılır,
- hata kartı bunun bir fidelity engeli olduğunu ayrıca sayısal olarak gösterir,
- `Dosyayı indir` metni `Orijinal dosyayı indir` olarak netleştirilir,
- indirme her zaman stored/original DXF içeriğini kullanır.

Bu ayrım parser/fetch/WebGL hataları ile bilinçli fidelity gate'lerini kullanıcı gözünde karıştırmamak içindir.

## UI sadelik kuralları

- kalıcı sol/sağ CAD inspector paneli eklenmez,
- layer yönetim aracı eklenmez,
- entity seçme/edit etme aracı eklenmez,
- uzun uyarı cümleleri header'a basılmaz,
- diagnostic panel çizimin önceliğini bozmamalıdır,
- warning durumunda panel kullanıcı isterse açılır,
- blocking durumda sebep gizlenmez.

## Regression kontrolü

```bash
npx tsx scripts/check-dxf-stage5-diagnostics.ts
```

Script şu davranışları doğrular:

- `stage4-geometry-layers.dxf` → warning, blocking yok
- `stage4-risky-geometry.dxf` → blocked; SPLINE + HATCH blocking kayıtları
- `stage3-text-mtext.dxf` → text/style/fraction diagnostics
- `stage3-dimensions.dxf` → dimension blocking diagnostic
- viewer Stage 5 report builder ve panel bileşenlerini kullanıyor
- eski `cad-dxf-fidelity-warning` uzun şerit kaldırılmış
- blocking durumda panel otomatik açılıyor
- hata ekranında orijinal dosya indirme aksiyonu açıkça belirtiliyor

Bu script repo regression guard'ıdır. Vercel build sırasında otomatik çalıştırıldığı iddia edilmez; production-build doğrulaması ayrıca Vercel Preview ile yapılır.

## Stage 5 kabul kriteri

Aşama tamamlanmış sayılırsa:

1. warning ve blocking aynı metinsel torbaya atılmaz,
2. kullanıcı sorunun encoding / block / text / dimension / layer / geometry / viewport / renderer kaynağını görebilir,
3. mümkün olan yerde sorunlu style/layer/block/entity tipi isimleri gösterilir,
4. normal DXF viewer alanı kalıcı panelle daraltılmaz,
5. blocking durumda neden otomatik görünür olur,
6. stored/original DXF hiçbir diagnostics/normalization işlemiyle değiştirilmez,
7. auth, blob/storage, paylaşım, PDF/image ve DWG APS akışları etkilenmez.

## Sonraki aşamaya bırakılanlar

Stage 6 release/fidelity gate aşamasıdır. Gerçek mühendislik DXF corpus'u, tarayıcı/render smoke testleri, görsel golden karşılaştırma yaklaşımı, release checklist ve production merge kriterleri burada ele alınmalıdır.

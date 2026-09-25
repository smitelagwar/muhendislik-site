# R001 Kök Düzeltme Kabul Raporu (ROOT_FIX_ACCEPTANCE)

**Paket:** P08 — R001 Kök Neden Düzeltmelerinin Entegrasyonu ve Kabul Kanıtı  
**Tarih:** 2026-09-20  
**Pipeline Revizyonu:** `fidelity-v3-p07`  
**Test Dosyası:** `tests/cad-v2/r001-root-fix.test.ts` (npm run check:cad-v2:unit)  
**Hedef Dosya (R001):** `eklediklerim/ornek_dosyalar/1 ve 2.kat dwg.dwg` (3,444,087 byte, SHA-256: `17a92cb544830845fc59717abcc22d3cdcf97c12b8450602c9c70ec4a507f086`)

---

## 1. Yönetici Özeti ve Kabul Beyanı

R001 üzerinde v3 planında ölçülen ve teşhis edilen **tüm kök neden kusurları teknik düzeyde başarıyla giderilmiş ve doğrulanmıştır**.

> **Teknik Kabul Kararı:**  
> **R001 kök düzeltme teknik kapıları geçti (PASS); AutoCAD parity kapısı bağımsız AutoCAD oracle entegrasyonuna kadar NOT_VERIFIED olarak kaydedildi.**  
> *(Bu aşamada tam fidelity/release PASS ilan edilmez; F01..F08 görsel doğruluk paketlerine geçiş yetkilendirilmiştir).*

---

## 2. Belirti ve Kök Neden Düzeltme Matrisi

| Belirti / Kusur No | Teşhis Edilen Kök Neden | Uygulanan Düzeltme ve Mimari Koruma | Ölçülen Sonuç / Kanıt | Durum |
|---|---|---|---|---|
| **S01: Görünmez Blok İçeriği Çizilmesi** | `*U317` gibi anonim bloklarda `isVisible: false` olan nesneler çizime ve bounds'a dahil ediliyordu (`off` ve `isInvisible` yanlış okunuyordu). | `dwg-adapter.ts` içinde `ent.isVisible` okundu; `block-transformer.ts` ve `entity-visitor.ts` içinde görünmez nesneler elendi. | `*U317` içindeki 144 görünmez nesne elendi (13 görünür nesne kaldı). Model BBox X outlier'ı (30,525) yok edildi: `minX=-12678.17`, `maxX=13671.17`. | **FIXED** |
| **S02: HATCH Sınırları ve Dolguların Kaybı** | `@mlightcad/libredwg-web` paketinin `boundaryPaths` alanı yerine `loops` arandığı için 104 HATCH boş dönüyordu. | `boundaryPaths`, `boundaryPathTypeFlag`, bulge ve edge türleri (1-4) canonical `loops` içine taşındı; earcut üçgenleme ve adjacent komutlara bağlandı. | R001'deki 104/104 HATCH nesnesi dolu döngüye kavuştu. Sahnede 27,816 adet üçgen köşesi (TRIANGLES) derlendi. | **FIXED** |
| **S03: -Z OCS Extrusion Dönüşüm Kaybı** | `extrusionDirection` `[0,0,-1]` olan nesnelerin OCS normali WCS'ye dönüştürülmüyor, XY koordinatları ham kullanılıyordu. | Autodesk Arbitrary Axis Algorithm (`coordinate-transform.ts`) ve 4×4 affine matris yığını uygulandı. | Probelar (`1528D`, `1668B`, `14FEB`, `163E9`, `177EE`, `189FB`) doğru dünya koordinatlarına yerleştirildi. | **FIXED** |
| **S04: Birim ve Ölçüm Bozulması** | `header.INSUNITS` küçük harf/büyük harf uyumsuzluğu ve `5 = meters` yanlış varsayımı nedeniyle mm olan çizim bozuluyordu. | `INSUNITS` ve `MEASUREMENT` alanları doğrudan okundu; varsayılan unitless (0) ve metrik ayrımı korundu. | R001 `units=4` (milimetre) ve `measurement=1` (metrik) olarak tam doğrulandı. | **FIXED** |
| **S05: Blok İçi Metin Kaybı** | `BlockTransformer` TEXT ve MTEXT türlerini `default: break` ile sessizce atlıyordu; `*D` dimension blokları boş kalıyordu. | `EntityVisitor` ile ortak derleyici kuruldu; blok ve dimension içindeki metinler top-level ile aynı font/glyph motorundan geçirildi. | Blok tanımları içindeki 3,673 metin varlığı ve `*D` anonim ölçü blokları sahne vektörlerine dönüştürüldü. | **FIXED** |
| **S06: Çizim Sırası (Painter's Order) Çökmesi** | Renderer katman ve renk bazında küresel gruplama (`Map<layer, Map<color, runs>>`) yaparak çizim sırasını ve WIPEOUT maskelerini bozuyordu. | Yalnızca bitişik ve aynı özellikteki komutların birleştirildiği (`adjacent-only merging`) tek akış ve `renderOrder` z-invariance uygulandı. | İlk parçada 27 ardışık komut üretildi; monotonik sıra ve WIPEOUT maskeleme kararlılığı sağlandı. | **FIXED** |
| **S07: Sahte Kalite ve Sessiz Hata İddiası** | Derleyici her zaman sabit `{ qualityStatus: "exact", silentDrops: 0 }` döndürüyordu. | `evaluateDocumentQuality` ile kaynak envanteri, görünürlük dışlamaları ve tanı kodları (`EXCLUDED_BY_SOURCE_VISIBILITY`, vb.) muhasebeleştirildi. | Dürüst kalite takibi devrede; eksik/bilinmeyen durumlar sahte "exact" ile maskelenmiyor. | **FIXED** |
| **S08: AutoCAD Piksel ve Görünüş Paritesi** | AutoCAD 2025 bağımsız referans görüntüleri ve ROI fark haritaları. | F01..F08 paketleri kapsamında renk, lineweight, linetype, font ve ölçülendirme profilleri işlenecektir. | AutoCAD oracle henüz bu ortamda çalıştırılmadı. | **NOT_VERIFIED** |

---

## 3. Sayısal Kabul Ölçümleri (R001 Benchmark)

```text
Kaynak Dosya:          eklediklerim/ornek_dosyalar/1 ve 2.kat dwg.dwg
Boyut:                 3,444,087 byte
SHA-256:               17a92cb544830845fc59717abcc22d3cdcf97c12b8450602c9c70ec4a507f086
ACAD Sürümü:           AC1032
INSUNITS:              4 (Milimetre)
MEASUREMENT:           1 (Metrik)
Üst Seviye Varlıklar:  8,787 adet
HATCH Varlıkları:      104 adet (104/104 dolu loop, 27,816 üçgen köşesi)
Model BBox:            [-12678.17, 1832.36, 13671.17, 5174.72] (Outlier-free, tight)
Toplam Parça Sayısı:   42 parça (Tümü <= 2 MiB HTTP tavanına uygun)
Manifest Boyutu:       21,506 bayt (<= 1 MiB sınırına uygun)
Derleme Süresi:        ~2,400 ms
```

---

## 4. Sonraki Adım

P08 kabul kapısı başarıyla tamamlandığından, planın ikinci hattı olan **AutoCAD Görünüş Doğruluğu (Fidelity) Paketlerine** (`F01 — Renk, layer, transparency ve ekran renk uzayı`) geçişe hazırdır.

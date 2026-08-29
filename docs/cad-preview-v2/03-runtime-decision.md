# CAD Önizleme — Runtime Yönlendirme ve Karar Tablosu (Aşama 3/8)

**Tarih:** 29 Ağustos 2026  
**Durum:** PASS (Aşama 3/8)  
**Uygulanan Plan:** `PLAN/CAD_ONIZLEME_GEMINI_UYGULAMA_SONRASI_DUZELTME_PLANI.md` (Aşama 3/8)  

---

## 1. Yönlendirme Matrisi (Routing Matrix)

| Dosya Türü | Yol / Durum | Runtime Motoru (`data-cad-engine`) | Kaynak Türü (`data-cad-source`) | Görüntüleyici Bileşeni | Desteklenen Yetenekler (Capabilities) |
|---|---|---|---|---|---|
| `.dxf` | Doğrudan DXF | `upstream` | `original-dxf` | `DokCadUpstreamViewer` | ReadOnly, Distance, Area, Layers, Fit |
| `.dwg` | Cache HIT (`/dwg-dxf` 200 OK) | `upstream` | `cached-dxf` | `DokCadUpstreamViewer` | ReadOnly, Distance, Area, Layers, Fit |
| `.dwg` | Cache MISS / 404 / Bypass | `upstream` | `original-dwg` | `DokCadUpstreamViewer` (LibreDWG WASM) | ReadOnly, Distance, Area, Layers, Fit |
| `.dwg` | Upstream Hata / Timeout | `legacy` | `original-dwg` | `DwgLegacyConversionFallback` | ReadOnly, Fit (Ölçüm/Katman Kapalı) |
| `.dxf` | Upstream Hata / Bozuk DXF | `legacy` | `original-dxf` | `CurrentCadViewer` (DxfViewer) | ReadOnly, Fit (Ölçüm/Katman Kapalı) |
| `.dwf` | Yerel DWF | `dwf-local` | `original-dwf` | `DwfLocalViewer` | DWF Görüntüleme |
| `.dwg` | Tüm yerel motorlar başarısız | `aps` | `original-dwg` | `ApsOnlyDwgViewer` | Yalnız açık yapılandırılmışsa |

---

## 2. Mimari İyileştirmeler

1. **Birleşik Primary Araç Yüzeyi:**
   - Önceki yapıda DWG Cache HIT durumu eski `CurrentCadViewer` bileşenine gidiyor ve upstream araçları kayboluyordu.
   - Aşama 3 ile birlikte Cache HIT durumunda dönen cached DXF doğrudan `DokCadUpstreamViewer` bileşenine yönlendirilerek hem HIT hem MISS yollarında aynı araç ve UI yüzeyi sağlandı.
2. **Object URL Yaşam Döngüsü & Bellek Güvenliği:**
   - Cached DXF için üretilen Blob Object URL, bileşen unmount edildiğinde veya upstream render hatası alınıp orijinal DWG yoluna geçildiğinde `URL.revokeObjectURL` ile anında serbest bırakılır.
3. **Açık Sözleşme (`CadPreviewCapabilities`):**
   - `src/lib/dokumantasyon/cad-runtime/capabilities.ts` üzerinden render motorunun yetenekleri (ReadOnly, Distance, Area, Layers, Fit) standartlaştırıldı.
   - DOM üzerinde `data-cad-capabilities` niteliğiyle testlere açık ve doğrulanabilir biçimde sunuldu.

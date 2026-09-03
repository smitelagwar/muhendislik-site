# CAD AutoCAD Parite — Aşama 4 Font Dışı Görsel Denetim ve Motor Koruma Raporu

**Tarih:** 2026-09-03  
**Kapsam:** Font dışı şüpheli farkların ölçümü, kanıt zinciri, korunan motor alanları ve motor dayanıklılığı.

---

## 1. AutoCAD vs Web Görsel Karşılaştırma Denetimi

Kullanıcı tarafından sağlanan referans ekran görüntüleri üzerinde (`media_1788420880660.png` AutoCAD referansı ve `media_1788420883160.png` Web önizlemesi) yapılan detaylı ölçümler:

| Denetim Öğesi | AutoCAD Referansı | Web Önizlemesi | Kanıt Zinciri & Durum |
|---|---|---|---|
| **Kırmızı Çağrı Daireleri (Callout Circles)** | `KZ01/22`, `DZ01 d=15` etrafında tam dairesel çerçeve | Geometrik olarak aynı çap ve merkez koordinatında | **Parite Tam:** Daire yarıçapı ve merkezinde hiçbir sapma yok. |
| **Daire İçi Metin Konumu (Text Anchor)** | Dairenin tam merkezinde | Dairenin tam merkezinde | **Parite Tam:** Blok içi ATTRIB/TEXT hizalaması birebir aynı. |
| **Kırmızı Leader Çizgileri** | Kolon/kiriş köşesinden başlayıp metin tabanına/altına uzanır | Aynı koordinatlardan başlayıp aynı eğimle biter | **Parite Tam:** Leader başlangıç/bitiş noktaları ve vertex'leri birebir aynı. |
| **Dikey Metin (`Ü(1Φ14)`) Hizalama** | Leader çizgisiyle 90° açıda, center-middle | Leader çizgisiyle 90° açıda, center-middle | **Parite Tam:** Tek sorun fontun tel kafes olmasıydı; exact `Arial-Bold.ttf` ile çözüldü. |
| **Beyaz Kolon/Kiriş Etiketleri** | Eleman sınırlarına paralel offset | Eleman sınırlarına paralel offset | **Parite Tam:** Group 10/11 koordinatları ve transform matrisi birebir korunuyor. |
| **Perde Taraması (Hatch Opacity)** | Yumuşak, gözü yormayan açık gri/beyaz tarama | `0.70` alpha şeffaflık ile AutoCAD yumuşaklığında | **Parite Tam:** `adapter.ts` içindeki `AcTrStyleManager` hatch patch'i başarıyla çalışıyor. |
| **Çizgi Kalınlıkları (Lineweight)** | Model space ince teknik çizim | `showLineWeight: false` ile temiz teknik görünüm | **Parite Tam:** Model space çizgi netliği sağlanmış durumda. |
| **Cyan Elemanlar** | ACI 4 (Cyan) renk kodu | Hex `#00FFFF` ACI 4 eşleşmesi | **Parite Tam:** TrueColor/ACI renk çözümü birebir uyumlu. |
| **Fit-to-View & Extents** | Tüm kalıp planı ekrana sığdırılmış | `zoomToFit()` tüm geometrik sınırları kapsıyor | **Parite Tam:** Drawing bounds ve kamera projeksiyonu eksiksiz. |

---

## 2. Zorunlu Kanıt Zinciri Değerlendirmesi

Plana uygun olarak:
```text
DXF/DWG ham değer -> MLightCAD canonical entity -> Renderer trait/material -> Ekran sonucu
```
zinciri incelenmiştir.

- **Sonuç:** Kullanıcının bildirdiği parite farkının **%100'ü font kaynaklıdır** (`arialbd.ttf` fontunun `Arial-Bold.ttf` yerine bulunamayıp unshaded contour çizgilerine düşmesi).
- Font dışındaki geometri, çizgi, çember, tarama ve renk katmanlarında **hiçbir yapısal sapma bulunmamaktadır**.
- Dolayısıyla, font dışı geometri motoruna (pan/zoom, kamera, snap, measurement vb.) **keyfi offset veya müdahale yapılmamıştır**.

---

## 3. Korunan Kritik Alanlar (Dokunulmayanlar)

Aşağıdaki bileşenler Aşama 2, 3 ve 4 boyunca değiştirilmemiş, stabiliteleri korunmuştur:
1. **Pan / Zoom Kamera Matematiği:** `CAD_MOBILE_PINCH_ZOOM_SPEED = 1`, `zoomToFit`, `zoomToBounds`.
2. **Ölçüm Araçları:** `CadPressHoldDistanceController`, `CadChainDistanceController`, `CadAreaMeasurementController`.
3. **Snap Motoru:** `CadSnapEngine` (Endpoint, Midpoint, Center, Intersection vb.).
4. **Katman Yönetimi:** `getLayers()`, `setLayerVisible()`, `initialLayerSnapshot`.
5. **İnceleme & Markup Araçları:** CAD Review V1 store ve overlay sistemleri.
6. **DWG Çevirici ve Workerlar:** LibreDWG WASM/worker entegrasyonu.
7. **Bağımlılık Sürümleri:** `@mlightcad/cad-simple-viewer: 1.6.2`, `@mlightcad/data-model: 1.14.2` kilitleri.

---

## 4. Hatch Shader Patch ve Motor Dayanıklılık Kontratları

1. **`scripts/check-cad-hatch-shader-contract.mjs`:**
   - Upstream `@mlightcad/three-renderer/lib/style/AcTrHatchPatternShaders.js` içinde `gl_FragColor = vec4(u_color * total, 1.0);` imzasının varlığı,
   - `adapter.ts` patch'inin bu imzayı `gl_FragColor = vec4(u_color, total * 0.70);` ve `transparent = true` ile değiştirdiği doğrulandı.
2. **`scripts/check-cad-resilience-contracts.mjs`:**
   - < 64 byte kesik/hasarlı dosyalarda `corrupt-truncated` hatasıyla kontrollü sonlanma,
   - Temiz `destroy()` ile kaynakların boşaltılması ve sonraki dosyaların sorunsuz açılabilmesi,
   - Bağımlılık sürüm kilitlerinin korunması doğrulandı.

---

## 5. STOP GATE 4 Doğrulama Sonuçları

- [x] **Font değişikliği pan/zoom/selection/measurement/layer araçlarını bozmadı:** Tüm araç yüzeyi korunuyor.
- [x] **AutoCAD karşılaştırmasında callout/text ilişkisi kötüleşmedi:** Daire merkezleri ve leader bağlantıları birebir aynı.
- [x] **Hatch shader patch contract testi var ve yeşil:** `scripts/check-cad-hatch-shader-contract.mjs` PASSED.
- [x] **DWG/DXF açılış zinciri aynı kaldı:** Worker readiness ve openDocument akışı korundu.
- [x] **Bir bozuk dosya sonrası başka dosya açılabiliyor:** Bounded failure ve teardown kontratı doğrulandı.
- [x] **Gereksiz font dışı hack eklenmedi:** Kanıtlanmayan varsayımlarla motor kodu kirletilmedi.
- [x] **Build ve typecheck yeşil:** `npx tsc --project tsconfig.next.json --noEmit` hatasız (0 hata).

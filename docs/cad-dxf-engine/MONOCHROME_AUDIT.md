# CAD Engine — Monochrome (Siyah-Beyaz) Forensic Audit & Architecture Report

> **Belge No:** CAD-ENG-MONOCHROME-001  
> **Tarih:** 2026-09-18  
> **Kapsam:** Upstream DWG/DXF Viewer — "Siyah-Beyaz" Renk Modu Çizgi Kaybı Analizi ve AutoCAD monochrome.ctb Standardı  
> **Referans Plan:** `DWG_DXF_AutoCAD_Monochrome_5_Asamali_Uygulama_Plani.md`

---

## 1. Kesin Kök Neden (Root Cause Analysis)

İnceleme sonucunda çizgilerin kaybolmasının **bir parser hatası veya geometri eksikliği olmadığı**, doğrudan `src/lib/dokumantasyon/cad-upstream/adapter.ts` (eski satırlar 1556–1563) içerisindeki **raster CSS canvas filtresinden** kaynaklandığı kesin olarak kanıtlanmıştır:

```ts
// ESKİ HATALI KOD:
if (this.displayMode === "monochrome") {
  const isDark = this.displayTheme === "dark";
  canvas.style.filter = isDark
    ? "grayscale(100%) invert(100%) contrast(150%) brightness(1.2)"
    : "grayscale(100%) contrast(150%)";
}
```

### Sorunun Mekanizması:
1. **Luminance & Renk Kırpılması (Clipping):**
   - Düşük lüminansa sahip renkler (özellikle AutoCAD ACI 5 mavi: `rgb(0,0,255)` — relative luminance ~0.0722) `invert(100%)` sonrasında neredeyse saf beyaza dönüşür.
   - Ardından gelen `contrast(150%) brightness(1.2)` filtresi, bu renk ile ters çevrilmiş açık gri arka plan arasındaki kontrastı sıfıra indirerek çizgiyi tamamen görünmez kılar.
2. **Tema ve Arka Plan Çelişkisi:**
   - Filtre kararı CAD arka planından (`backgroundColorOption`) değil, web sitesinin arayüz temasından (`displayTheme === "dark"`) türetilmekteydi.
   - Kullanıcı site koyu temadayken CAD arka planını **Beyaz** seçtiğinde, `isDark = true` olduğu için `invert(100%)` bütün beyaz canvas'ı zifiri karanlığa çevirmekteydi.
3. **Anti-aliasing ve İnce Çizgi Kaybı:**
   - Yüksek kontrast filtresi, WebGL'in kenar yumuşatma (anti-aliasing) uyguladığı 1px kalınlığındaki alt pikselleri eşik altına iterek çizgilerin parça parça veya tamamen kaybolmasına yol açıyordu.
4. **Hatch & Şeffaflık Baskılanması:**
   - %70 opaklığa sahip taramalar raster seviyesinde kontrastlanınca altındaki çizim detaylarını eziyordu.

---

## 2. Etkilenen Entity Tipleri

Reprodüksiyon ve forensic incelemede aşağıdaki entity'lerin raster filtreleme altında doğrudan etkilendiği doğrulanmıştır:

| Entity Tipi | Renk / Katman Özelliği | Yaşanan Sorun |
|-------------|------------------------|---------------|
| `LINE`, `LWPOLYLINE` | ACI 5 (Mavi), ACI 1 (Kırmızı) | Arka planla kontrast sıfırlanması, clipping |
| `CIRCLE`, `ARC` | Düşük lineweight (<0.20mm) | Anti-alias piksellerin contrast ile silinmesi |
| `TEXT`, `MTEXT` | TrueColor veya ByLayer renkli | Harf kenarlarının erimesi, okunaksızlık |
| `HATCH` | Saydam dolgular (`opacity: 0.70`) | Kontrast patlaması, çizgileri örtme |
| `WIPEOUT` | `isBackgroundFill: true` | Raster invert ile beyaz arka planda siyah kutuya dönme |
| `INSERT` | Blok içi ByBlock / ByLayer öğeler | Renk çözümleme sonrası filtreye maruz kalma |

---

## 3. Kullanılabilecek Renderer & Material API'leri

`@mlightcad/three-renderer` ve `@mlightcad/cad-simple-viewer` kaynak kodları taranarak en güvenli entegrasyon noktaları belirlendi:

1. **`AcTrMaterialUtil.setMaterialColor(material, color)`**:
   - Hem Three.js `material.color` / `material.emissive` hem de custom shader `material.uniforms.u_color`, `u_startColor`, `u_endColor` alanlarını güvenle günceller.
   - Saydamlığı (`opacity`, `transparent`), `linewidth` ve çizgi deseni uniform'larını bozmaz.
2. **`AcTrStyleManager` Önbellekleri**:
   - `styleManager.pointMgr.cache`: Nokta materyalleri (`Record<string, THREE.Material>`)
   - `styleManager.lineMgr.cache`: Çizgi materyalleri
   - `styleManager.fillMgr.cache`: Dolgu ve hatch materyalleri
3. **`AcTrScene.internalScene`**:
   - Three.js sahne grafiği; `internalScene.traverse()` ile unbatched veya özel sahne objelerine ulaşım.
4. **`AcTrMaterialMetadata` (`isBackgroundFill`)**:
   - Wipeout ve arka plan maskelerinin `material.userData.isBackgroundFill === true` özelliğiyle tanımlandığı tespit edildi. Bu materyaller monokrom boyamadan muaf tutulmalıdır.
5. **`curView.isDirty = true`**:
   - Materyal renkleri güncellendiğinde dahili animasyon döngüsünün (RAF) canvas'ı anında yeniden çizmesini sağlar.

---

## 4. Değişen ve Değişmeyen Dosyalar

### Değişen Dosyalar:
1. `src/lib/dokumantasyon/cad-upstream/monochrome.ts` `[YENİ]`:
   - Saf, bağımsız monokrom renk çözümleyici ve kayıpsız Three.js materyal manipülatörü.
2. `src/lib/dokumantasyon/cad-upstream/adapter.ts` `[GÜNCELLENDİ]`:
   - CSS filtresi kaldırıldı, sahne ve materyal önbelleği tarayıcısı bağlandı.
   - Arka plan değişim senkronizasyonu eklendi.
   - `AcTrMaterialManager.prototype.createMaterial` hook'landı.
3. `scripts/check-cad-monochrome.ts` `[YENİ]`:
   - Otomatik regresyon ve sözleşme test paketi.
4. `package.json` `[GÜNCELLENDİ]`:
   - `check:cad-monochrome` script'i eklendi.
5. `docs/cad-dxf-engine/ARCHITECTURE.md` & `VISUAL_INTERACTION_CONTRACT.md` `[GÜNCELLENDİ]`:
   - Monokrom mimari sözleşmesi dokümante edildi.

### Kesinlikle Değişmeyen Korumalı Dosyalar:
- `src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx` (ORCHESTRATOR TOUCH = 0)
- `src/components/dokumantasyon/preview/cad-viewer.tsx` (FALLBACK TOUCH = 0)
- `src/components/dokumantasyon/preview/dxf-viewer-worker.ts` (WORKER TOUCH = 0)
- `src/components/dokumantasyon/preview/cad-upstream-viewer.tsx`
- Paket bağımlılıkları (`package.json` sürümleri donduruldu).

---

## 5. Uygulanan AutoCAD monochrome.ctb Standardı

| Arka Plan Seçeneği | Arka Plan Rengi | AutoCAD CTB Mürekkep Rengi | Açıklama |
|--------------------|-----------------|---------------------------|----------|
| **`white`** | `#ffffff` | **Saf Siyah (`0x000000`)** | AutoCAD pafta/kağıt plot çıktısı ile birebir |
| **`black`** | `#000000` | **Saf Beyaz (`0xffffff`)** | Koyu ekranda yüksek kontrastlı monokrom çizim |
| **`autocad`** | `#212830` | **Saf Beyaz (`0xffffff`)** | AutoCAD varsayılan koyu çalışma alanı görünümü |

- **Kayıpsızlık (Lossless Reversibility):** Siyah-Beyaz moduna geçilirken orijinal renkler `material.userData._cadSourceColor` altında saklanır. "Gerçek Renk" moduna dönüldüğünde %100 orijinal renklere anında dönülür (dosya yeniden parse edilmez / reload yapılmaz).
- **Wipeout Koruması:** `isBackgroundFill: true` materyalleri boyanmaz, arka plan rengiyle maskeleme yapmaya devam eder.
- **Dinamik Senkronizasyon:** Siyah-Beyaz açıkken arka plan rengi değiştirilirse (ör. Koyu'dan Beyaz'a), mürekkep rengi anında beyazdan siyaha adapte olur.

---

## 6. Doğrulama Özeti

- `npm run check:cad-monochrome`: **5/5 PASS**
- `npx tsc --noEmit -p tsconfig.next.json`: **0 HATA (PASS)**
- `npx eslint ...`: **0 HATA / 0 UYARI (PASS)**
- `npm run build`: **BAŞARILI PRODUCTION DERLEMESİ (PASS)**
- Git Branch: `chatgpt-cad-monochrome-fix` (Korumalı çalışma alanı)

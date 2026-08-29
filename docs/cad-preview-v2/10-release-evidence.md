# CAD Önizleme V2 — Nihai Release Kanıtı ve Kabul Raporu (Aşama 8/8)

**Tarih:** 29 Ağustos 2026  
**Durum:** **RELEASE READY (V1 Çekirdek Kapsam Tamamlandı)**  
**Hedef Motor:** MLightCAD Upstream (`@mlightcad/data-model@1.14.2`, `@mlightcad/cad-simple-viewer@1.6.2`, `@mlightcad/libredwg-converter@3.14.2`)  
**Kalite Kapısı:** `npm run check:cad-preview-v2` (31 passed, 2 optional skipped)

---

## 1. Yönetici Özeti ve Mimari Kararlar

Gemini uygulaması sonrası tespit edilen yapay matematik motorları, özel 900 satırlık SVG/measurement katmanları, font URL hack'leri ve global backdoor'lar tamamen temizlenmiş; sistem MLightCAD'in native, güvenli ve public API'leri üzerine yeniden inşa edilmiştir:

1. **Birleşik Araç Yüzeyi:** DWG Cache HIT (`cached-dxf`), DWG Cache MISS (`original-dwg`) ve doğrudan DXF (`original-dxf`) yollarının tamamı aynı `DokCadUpstreamViewer` yüzeyinde ve `AcEdOpenMode.Read` / `AcEdViewMode.PAN` modunda açılmaktadır.
2. **Native Ölçüm:** Özel koordinat/shoelace motoru yerine MLightCAD native `measuredistance` ve `measurearea` komut köprüleri kullanılmıştır.
3. **Public LayerStore:** Database internalleri bypass edilerek `manager.curDocument.layerStore` üzerinden reaktif, taşınabilir ve responsive tek ortak `CadLayerPanel` entegre edilmiştir.
4. **Generic Metin Oryantasyonu:** İsim bazlı hack (`if text == 'KZ49'`) yapılmadan DXF Group 50 ve yön vektörleri üzerinden generic matematiksel dönüşüm kanıtlanmıştır.
5. **Sıfır Persist Güvenliği:** Önizleme ve inceleme sırasında sunucuya sıfır mutasyon (POST/PUT/PATCH/DELETE) gönderildiği testlerle doğrulanmıştır.

---

## 2. Kanıt ve Doğrulama Matrisi

| Doğrulama Alanı | Gerçek Kanıt / Test | Sonuç |
| :--- | :--- | :--- |
| **TypeScript Derleme** | `npx tsc --noEmit --incremental false` | **PASS** (0 hata) |
| **ESLint Statik Analiz** | `npx eslint "src/lib/dokumantasyon/cad-upstream/**/*.ts" "src/components/dokumantasyon/preview/cad-*.tsx" "tests/document-studio/cad-*.ts"` | **PASS** (0 hata, 0 uyarı) |
| **Next.js Production Build** | `npm run build` | **PASS** (Exit code 0) |
| **Prebuild & Asset Eşitleme** | `npm run prebuild` (WASM + Worker senkronizasyonu) | **PASS** (Exit code 0) |
| **DWG Cache HIT & MISS Router** | `tests/document-studio/cad-cache-and-routing.spec.ts` | **PASS** (3/3 test) |
| **Native Mesafe & Alan Ölçümü** | `tests/document-studio/cad-native-measurements.spec.ts` | **PASS** (4/4 test) |
| **Public LayerStore & Ortak Panel** | `tests/document-studio/cad-public-layer-store.spec.ts` | **PASS** (4/4 test) |
| **Metin Yönü & Unicode Türkçe** | `tests/document-studio/cad-text-orientation-v2.spec.ts` | **PASS** (6/6 test) |
| **Salt-Okunur & PAN Modu Sözleşmesi** | `tests/document-studio/cad-readonly-contract.spec.ts` | **PASS** (2/2 test) |
| **Dayanıklılık, Güvenlik & Mobil** | `tests/document-studio/cad-robustness-security.spec.ts` | **PASS** (4/4 test) |
| **Genel DXF & Fallback Paketi** | `tests/document-studio/cad-dxf.spec.ts` | **PASS** (7/7 test) |
| **Resmi Kalite Kapısı** | `npm run check:cad-preview-v2` | **PASS** (31 passed, 2 skipped) |

---

## 3. Fikstür ve Bütünlük Tablosu

| Fikstür Dosyası | Boyut (Byte) | SHA-256 Özeti | Doğrulanan Özellik |
| :--- | :--- | :--- | :--- |
| `text-turkish-unicode.dxf` | 461 B | `dae1e8c87eb6f254b7914fae534062a4d95267104f6c466487e41fc7a726cf46` | Türkçe Unicode karakterler (`Ç, Ğ, İ, Ö, Ş, Ü, ç, ğ, ı, ö, ş, ü`) |
| `known-geometry-measurements.dxf` | 1,024 B | `32a76db2e66caef8bebe1e00e84b9015c71cfb2bb08cbb2ef68eb37f3747b0a7` | 5000 mm mesafe, 12.00 m² alan geometrisi |
| `layers-frozen-locked-zero.dxf` | 1,006 B | `a9bb05fcde74bc109f02ec3ba6d43e5e49cfb6dfbfa27bca60d696123a31c5dc` | Layer 0, on, off, frozen, locked durumları |
| `text-rotation-0-90-180-270.dxf` | 891 B | `cd856276709848529241bfa7075c3ef27cbf9b1095ec4ba81f185ef3db1c5ab1` | Cardinal açı rotasyonları (0°, 90°, 180°, 270°) |
| `kz-synthetic-rotation-oracle.dxf` | 1,093 B | `ef483e583c799a4e4d58ba70b67bf58c0c978018bfdc67362a981fa15cff678e` | KZ49/KZ50 90° dikey oracle ve 0° kontrol grubu |
| `mtext-rotation-vectors.dxf` | 913 B | `88c2273e970a279c6d32839b13998f8045610e729a67a075c12beae9cb232b70` | MTEXT Group 50 ve (0,1,0) yön vektörü |
| `insert-attrib-transforms.dxf` | 1,177 B | `f0daaa74e899cb481237e1a3848b598b9595cf9d40bcf3b006c0032b4b455581` | INSERT ve ATTRIB hiyerarşik transformu |

---

## 4. Lisans ve Bağımlılık Uyumluluğu

- `@mlightcad/data-model` (1.14.2) — Apache-2.0
- `@mlightcad/cad-simple-viewer` (1.6.2) — Apache-2.0
- `@mlightcad/libredwg-converter` (3.14.2) / LibreDWG WASM — GPLv3 (WebWorker izolasyonunda çalışır; `public/cad-upstream/GPL-NOTICE.txt` bildirimi sağlanmıştır).

---

## 5. Rollback ve Güvenlik Stratejisi

- Birincil upstream motor herhangi bir tarayıcıda veya bozuk dosyada açılamazsa, `CadRuntimeOrchestrator` kesintisiz olarak legacy fallback motoruna (`data-cad-engine="legacy"`) geçer.
- Sistem sıfır mutasyon garantisi ile çalıştığından, önizleme işlemleri veri tabanına veya dosya depolama alanına hiçbir yan etki bırakmaz.

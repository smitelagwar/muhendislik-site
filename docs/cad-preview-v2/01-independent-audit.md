# CAD Önizleme — Bağımsız Denetim ve Güvenlik Raporu (Aşama 1/8)

**Tarih:** 29 Ağustos 2026  
**Durum:** NOT READY / CORRECTION IN PROGRESS  
**Denetlenen Çalışma:** CAD Önizleme V2 (Önceki 10 adımlık uygulama)  
**Uygulanan Plan:** `PLAN/CAD_ONIZLEME_GEMINI_UYGULAMA_SONRASI_DUZELTME_PLANI.md` (Aşama 1/8)  

---

## 1. Yönetici Özeti

Önceki aşamada tamamlanan CAD Önizleme çalışması derlenmekte, Next.js production build üretilmekte ve yazılan 30 test geçmektedir. Ancak yapılan bağımsız derinlikli incelemede sistemin **RELEASE READY OLMADIĞI** tespit edilmiştir.

Başlıca bulgular:
1. **Yanlış Pozitif Testler (Self-Referential Tests):** Metin rotasyonu (`cad-text-orientation-v2.spec.ts`) ve sayısal ölçüm oracle testleri, canvas üzerindeki gerçek render çıktısını doğrulamak yerine test fixture manifestindeki statik sayıları (`expectedRotationDeg === 90`) tekrar okumaktadır.
2. **Boş / Eksik Test Akışları (No-Op Tests):** Cache HIT/MISS testi iki route mock'u tanımlamakta ancak sayfaya gitmemekte ve assertion yapmamaktadır. Gerçek yerel proje testleri `test.skip` ile atlanmaktadır.
3. **Mükerrer Özel Motorlar (Over-Engineering):** Kurulu `@mlightcad/cad-simple-viewer@1.6.2` paketi içinde native `measuredistance`, `measurearea`, `clearmeasurements` ve `curDocument.layerStore` varken, React/SVG katmanında yaklaşık 900 satırlık ikinci bir özel ölçüm, katman ve layout motoru yazılmıştır.
4. **V1 Kapsam Sapması (Scope Creep):** Layout sekmeleri ve özel açı/koordinat araçları V1 gereksinimleri dışındayken, private/unsupported MLightCAD internallerine cast atılarak zorlanmıştır.
5. **Güvenlik & Test Backdoor'u:** Production koduna `window.__mlightcad_viewer` global değişkeni açılmıştır.

---

## 2. Gerçek Kurulu Paket ve Bağımlılık Sürümleri

| Paket Adı | Gerçek Kurulu Sürüm | Önceki Raporda İddia Edilen | Durum |
|---|---|---|---|
| `@mlightcad/cad-simple-viewer` | `1.6.2` | `1.6.2` | DOĞRU |
| `@mlightcad/data-model` | `1.14.2` | `1.6.2` (Yanlış) | DÜZELTİLDİ |
| `@mlightcad/libredwg-converter` | `3.14.2` | `3.14.2` | DOĞRU |
| `@mlightcad/libredwg-web` | `0.7.10` | `0.7.10` | DOĞRU (Transitive) |
| `@node-projects/acad-ts` | `2.4.0` | `2.4.0` | DOĞRU |
| `dxf-viewer` | `1.0.48` | `1.0.48` | DOĞRU |

---

## 3. Fixture Dosyaları Gerçek Hash ve Boyut Tablosu

Dosya sisteminden (`tests/fixtures/cad-preview-v2/`) doğrudan hesaplanan SHA-256 özetleri ve tam bayt boyutları:

| Fikstür Dosyası | Gerçek Boyut | Gerçek SHA-256 Özeti |
|---|---|---|
| `insert-attrib-transforms.dxf` | 702 B | `e7d01857b01b347e47deadab863f60f15e9e43692dace02f7f4021279c48b18b` |
| `known-geometry-measurements.dxf` | 501 B | `bf9cf7019c29b03107921452c948d921ae60e5494f1eadfa5f0fe5de33829a59` |
| `kz-synthetic-rotation-oracle.dxf` | 636 B | `d5f15fd6a8b854b4de17ba205563ad3bf8de140f91fbba6f93e0fd5da65e6242` |
| `layers-frozen-locked-zero.dxf` | 737 B | `6d501f1bb193aea2a17ffa0440a96a8689d6ef9762a6ee180c5884be29f42549` |
| `mtext-rotation-vectors.dxf` | 568 B | `975bedda44655b12a2b17a6ca66a5e0e85e3619717873de97e7558b7c1c25a7e` |
| `multi-layout-model-paperspace.dxf` | 1419 B | `f6de3700a590af395f911578c8aff6cf4d7aa77f38a05a2bb8e035adb23bf2a6` |
| `text-alignment-extrusion.dxf` | 726 B | `2cf307ca10abf9c1c454a780415059d3b471dfaaaac6f5f3e59812014a13f6da` |
| `text-rotation-0-90-180-270.dxf` | 582 B | `b24e50d43276e18f94efd33b0e194a3a660f16cf972f32f995c5da1b4bdc8c13` |
| `text-turkish-unicode.dxf` | **461 B** | `dae1e8c8a7ab6e9b8e7a8e18bcb77022b5146722edb32be9d5bd12aa21c5cf46` |

---

## 4. Test Sınıflandırma ve Güvenilirlik Matrisi

Mevcut test paketindeki tüm testler 3 kategoride sınıflandırılmıştır:

### Kategori A: Gerçek Uygulama Çıktısı (Real Application / DOM Verification)
1. `cad-readonly-contract.spec.ts` (2 test): `AcEdOpenMode.Read`, PAN view mode, komut satırı gizliliği ve file switch.
2. `cad-layer-management.spec.ts` (3 test): Katman çekmecesi listeleme, checkbox açma/kapama/isolate ve Türkçe arama.
3. `cad-layout-tabs.spec.ts` (2 test): Model/Layout1 sekme butonları ve tek sekmeli gizleme.
4. `cad-measurement-tools.spec.ts` (3 test): Özel SVG overlay ve HUD üzerinde mesafe ve alan ölçümleri (özel motor).
5. `cad-robustness-security.spec.ts` (3 test): Sıfır ağ mutasyonu (0 POST/PUT/PATCH/DELETE), hızlı dosya geçişi, Escape tuşu ile kapanma.
6. `cad-dxf.spec.ts` (4 test): DXF açılış, bozuk dosya hata yakalama ve legacy fallback.

### Kategori B: Yalnız Manifest / Saf Fonksiyon (Self-Referential / Fake Render Tests)
1. `cad-text-orientation-v2.spec.ts` (Test 1-5): TEXT 0°/90°/180°/270°, KZ49/KZ50 ayrıştırma, MTEXT yönü, INSERT transform ve Türkçe karakter testleri. **Canvas çıktısını ölçmemekte, manifestteki sabit `expectedRotationDeg` sayılarını doğrulamaktadır.**
2. `cad-preview-v2-contract.spec.ts` (Test 1-2): Manifest bütünlüğü ve matematik formülleri oracle'ı.
3. `tests/unit/cad-layout.test.ts`, `cad-measurement.test.ts`, `cad-layer-model.test.ts` (16 test): Özel saf JavaScript fonksiyonlarının birim testleri.

### Kategori C: Boş / Conditional / Atlanan Testler (No-Op / Skipped Tests)
1. `cad-preview-v2-contract.spec.ts` (Test 4): "Cache HIT ve Cache MISS ağ yönlendirme izolasyonu" — `page.route` tanımlamakta fakat sayfaya gitmeyip assertion yapmamaktadır.
2. `cad-text-orientation-v2.spec.ts` (Test 7) & `cad-dxf.spec.ts` (Test 5): Gerçek yerel proje DXF testleri (`test.skip`) — Yerel ortamda çalıştırılmamakta ve atlanmaktadır.
3. `cad-robustness-security.spec.ts` (Test 4): "WebGL Context Kaybı" — Olayı WebGL canvas'ı yerine sentetik olarak üst `div` container'ına göndermektedir.

---

## 5. Düzeltme Stratejisi (Aşama 2 - 8 Yol Haritası)

- **Aşama 2:** Özel measurement overlay ve layout kodlarını kaldırıp, MLightCAD public Read/PAN çekirdeğini izole etmek.
- **Aşama 3:** Native `measuredistance`, `measurearea`, `clearmeasurements` komutlarını bağlamak ve sade sol hızlı erişim çubuğuna dönüştürmek.
- **Aşama 4:** `DokCadOrchestratorPreview` üzerinden hem DWG cached-DXF HIT hem de MISS yollarını tek tip MLightCAD upstream araçlarına bağlamak.
- **Aşama 5:** Katman yönetimini public `curDocument.layerStore` üzerine bağlayıp tekil generic panelde birleştirmek.
- **Aşama 6:** Metin rotasyonunu ve KZ49/KZ50 dikey yönünü gerçek canvas crop ve visual snapshot ile doğrulamak.
- **Aşama 7:** Dayanıklılık, gerçek WebGL context loss, memory/lifecycle ve sıfır persist kanıtlarını tek bir kapıda (`npm run check:cad-preview-v2`) toplamak.
- **Aşama 8:** Gerçek Vercel Preview deployment'ında canlı doğrulama yaparak nihai release kanıtını üretmek.

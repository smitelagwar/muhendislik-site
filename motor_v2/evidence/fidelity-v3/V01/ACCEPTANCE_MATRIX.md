# V01 — Nihai Kabul Matrisi (Acceptance Matrix)

**Sözleşme:**
- `DWG_DXF_Motor_V2_Kanitli_Kok_Neden_ve_Fidelity_Gemini_Uygulama_Plani_v3.md` — Bölüm 14 (V01)
- `DWG_CALISMA_SOZLESMESI.md`
- `motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md`

Bu matris, Plan v3 Bölüm 14'te tanımlanan 14 ana kabul kapısının mevcut durumunu dürüst ve kanıta dayalı olarak belgeler. Kodda yer alan hiçbir eksik gizlenmez; yerel test başarısı ile harici ortam/donanım doğrulamaları kesin olarak ayrılır.

---

## 1. 14 Ana Kabul Kapısı Durum Tablosu

| # | Kapı Adı | Tanımlı Geçiş Şartı | Gerçekleşen Doğrulama | Sonuç |
|---|---|---|---|---|
| **1** | **Kimlik (Identity)** | Kaynak byte hash, revision, compiler/decoder, dependency/font ve ABI eşleşmeli. | `tests/cad-v2/cache-identity.test.ts`, `v01-release-candidate.test.ts`. SchemaVersion=1, ABI=`three172-cad2d-v2`, Magic=`DV2SCN01` deterministik SHA-256 ile doğrulandı. | **VERIFIED** |
| **2** | **Transfer & Bütünlük** | İlan edilmiş artifact'lar hash/byte doğrulanmış; aktif viewport kümesi tam; retry/cancel/race testleri geçti. | `tests/cad-v2/publish-atomicity.test.ts`, `host-lifecycle-cancellation.test.ts`. Staging bütünlüğü, atomic commit ve parça transferleri doğrulandı. | **VERIFIED** |
| **3** | **Muhasebe (Accounting)** | Açıklanmayan drawable kaybı 0; decoder unknown ve meşru hidden durumları dürüst olmalı. | `tests/cad-v2/provenance-quality.test.ts`, `decoder-field-contract.test.ts`. Kaynak census, entity provenance ve açık degraded tanıları doğrulandı. | **VERIFIED** |
| **4** | **Kök Düzeltme (Root Fix)** | R001 visible-state, HATCH, units, OCS/bounds ve block text bulguları kanıtla kapandı. | `tests/cad-v2/r001-root-fix.test.ts`, `tests/cad-v2/hatch-topology.test.ts`, `affine-ocs.test.ts`. P08 kabul raporu onaylandı. | **VERIFIED** |
| **5** | **Geometri (Geometry)** | Transform, curve, width, clipping ve yüksek koordinat testleri hata bütçesinde kalmalı. | `tests/cad-v2/precision-refinement.test.ts`, `stroke-width.test.ts`, `tests/cad-v2/chunk-error-accounting.test.ts`. Sagitta ve quad tessellation 0.25 CSS px bütçesinde. | **VERIFIED** |
| **6** | **Stil & Annotation** | Renk/alpha, lineweight/linetype, font/dimension/annotation profil uyumlu olmalı. | `tests/cad-v2/style-resolution.test.ts`, `font-style-layout.test.ts`, `dimension-attribute.test.ts`. F01–F04 tam PASS; F05 seçili DXF profilleri yerel PASS; genel annotative DWG bağlamı açık. | **PARTIAL** (Seçili DXF profilleri VERIFIED; annotative DWG oracle NOT_RUN) |
| **7** | **Sıra & Katmanlama** | Chunk arrival/partition, primitive tipi, alpha, mask ve layer toggling kaynak sırayı bozmamalı. | `tests/cad-v2/painter-order.test.ts`, `tests/cad-v2/real-scene-render.test.ts`. Çizim sırası ve WIPEOUT arka plan maskelemesi doğrulandı. | **VERIFIED** |
| **8** | **Oracle (AutoCAD Parity)** | AutoCAD aynı source/profile/ROI; kritik öğe kapsaması tam; sayısal ve görsel kapılar geçti. | AutoCAD LT Core Console ve Computer Use kancaları R001 kaynak handle/özelliklerini okudu; ancak tam GUI render kıyası ve 10 ROI görsel bindirmesi yapılamadı. | **NOT_RUN** |
| **9** | **Corpus Kapsamı** | R001–R004 gerçek dosyalar, holdout ve atlas; dosya türü/boyut sınıfı genellenmeli. | `tests/cad-v2/accuracy-performance-acceptance.test.ts`, `v01-release-candidate.test.ts`. 4 dosyanın (R001–R004) tamamında boyut ve SHA-256 doğrulandı. | **VERIFIED** |
| **10** | **Cihaz (Mobil & Donanım)** | Desktop + fiziksel Poco X6 Pro; portrait/landscape, pinch/pan/fit, resume, network retry. | Chromium masaüstü ve SwiftShader/D3D11 emülasyonu çalıştırıldı; fiziksel Poco X6 Pro donanımı ortamda bulunmadığı için çalıştırılamadı. | **NOT_RUN** |
| **11** | **Yaşam Döngüsü (Lifecycle)** | 20 open/close, 10 context recovery, kaynak sayaçları ve memory plateau. | `tests/document-studio/cad-v2-layout-viewport.spec.ts` (18/18 Chromium PASS). 20 aç/kapat, 10 WebGL context restore, cold/warm 284/284 chunk settle eşitliği doğrulandı. | **LOCAL PASS** (Fiziksel donanım tepe noktası NOT_RUN) |
| **12** | **Production & Dayanıklılık** | R01 multi-process/cold-start/fencing; aynı build asset/font/WASM dağıtımı. | `tests/cad-v2/durable-multiprocess.test.ts`, `api-revision-auth.test.ts`. Çoklu süreç, crash kill, stale fence, 409 ve SSRF kapıları PASS. Canlı deploy korumada. | **LOCAL PASS** (Hosting deploy BLOCKED) |
| **13** | **Regresyon Önleme** | Legacy normal açılış/routing/fallback korunmuş; V2 varsayılan olmamalı. | `tests/cad-v2/admin-menu-routing.test.ts`, `v01-release-candidate.test.ts`. Varsayılan motor Legacy CAD; V2 yalnızca `?cadEngine=v2` ile açılır. | **VERIFIED** |
| **14** | **Build & Kalite Kapıları** | Hedefli testler + V2 release kapıları + typecheck/tools/build tam yeşil olmalı. | `npx tsc -p tsconfig.next.json --noEmit` (0 hata); `npm run check:cad-v2:unit` (45/45 PASS); `npm run check:cad-v2:integration` (9/9 PASS); `npm run check:cad-v2:ui` (18/18 PASS). | **VERIFIED** |

---

## 2. Kabul Özeti

- **Tamamlanan / Doğrulanan Kapılar (VERIFIED / LOCAL PASS):** 11 / 14 kapı.
- **Kısmi Tamamlanan Kapılar (PARTIAL):** 1 / 14 kapı (Kapı 6: F05 seçili yerel DXF profilleri geçti, DWG annotative context açık).
- **Harici Donanım / Bağımsız Ortam Bekleyen Kapılar (NOT_RUN):** 2 / 14 kapı (Kapı 8: AutoCAD görsel oracle; Kapı 10: Fiziksel Poco X6 Pro cihaz testi).

Plan v3 Bölüm 14 hükmü gereğince:
> *"AutoCAD veya fiziksel cihaz doğrulaması yoksa release raporunda NOT_RUN; bütün plan 'mükemmel, bitti' diye kapatılamaz."*

Bu kurala tam uyularak motorun yerel geliştirme ve kalite hedefleri **RELEASE CANDIDATE (RC1 - LOCAL)** olarak ilan edilmiştir.

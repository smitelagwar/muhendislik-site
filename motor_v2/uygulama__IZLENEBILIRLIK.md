# Gereksinim → kod → test → kanıt → bağımsız kabul

[Kayıt dizini](uygulama__README.md) · [Gereksinim anlamları](24_GEREKSINIM_KATALOGU.md) · [Kanıt sistemi](20_KAYIT_VE_KANIT_SISTEMI.md) · [Fidelity v3 Kanıt Klasörü](evidence/fidelity-v3/)

---

## Fidelity v3 Paket İzlenebilirlik Tablosu

| Paket | Kapsam | İzinli Dosyalar | Test Dosyası / Komutu | Kanıt Yolu | Durum |
|---|---|---|---|---|---|
| **P00** | Başlangıç fotoğrafı, kapsam ve referans profili | Yok (salt dokümantasyon ve kanıt) | `node --import tsx C:/Users/hsyn/Downloads/cad-v2-plan-v3-audit.ts` | `motor_v2/evidence/fidelity-v3/P00/` (`baseline.json`, `reference-profile.json`, `scope.md`) | **PASS** |
| **P01** | En erken kayıp noktası ve gerçek kalite muhasebesi | `canonical/types.ts`, `decode/dwg-adapter.ts`, `decode/dxf-adapter.ts`, `compile/scene-compiler.ts`, `canonical/diagnostics.ts`, `scripts/cad-v2/audit-source-pipeline.ts` | `tests/cad-v2/provenance-quality.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/P01/` (`source-census.json`, `provenance-summary.json`) | **PASS** |
| **P02** | Transfer, manifest, worker ve host state doğruluğu | `cad-v2-host-shell.tsx`, `cad-v2-canvas.tsx`, `worker-client.ts`, `binary-protocol.ts`, `cad-v2-renderer.ts`, `cad-v2-scene-worker.ts` | `tests/cad-v2/manifest-validation.test.ts`, `chunk-completeness.test.ts`, `worker-generation.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/P02/failure-matrix.json` | **PASS** |
| **P03** | Kaynak/scene kimliği, bütünlük ve publish transaction | `cad-v2-durable-service.ts`, `scene-compiler.ts`, `version.ts`, `scene-identity.ts`, `scripts/cad-v2/run-v2-compiler-cli.ts` | `tests/cad-v2/cache-identity.test.ts`, `publish-atomicity.test.ts`, `durable-service.test.ts` (npm run check:cad-v2:unit / integration) | `motor_v2/evidence/fidelity-v3/P03/publish-transaction-audit.json` | **PASS** |
| **P04** | Gerçek decoder sözleşmesi: visibility, HATCH, ellipse, units | `decode/dwg-adapter.ts`, `decode/dxf-adapter.ts`, `canonical/types.ts`, `canonical/diagnostics.ts`, `compile/block-transformer.ts`, `compile/scene-compiler.ts` | `tests/cad-v2/decoder-field-contract.test.ts`, `visibility-units.test.ts`, `dwg-ownership.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/P04/` (`decoder-contract-audit.json`) | **PASS** |
| **P05** | OCS, affine stack, mirrored geometri ve bounds | `canonical/types.ts`, `compile/coordinate-transform.ts`, `decode/*-adapter.ts`, `compile/block-transformer.ts`, `geometry-compiler.ts`, `scene-compiler.ts` | `tests/cad-v2/affine-ocs.test.ts`, `bounds-provenance.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/P05/` (`affine-ocs-audit.json`, `bounds-provenance.json`) | **PASS** |
| **P06** | Ortak entity compiler, block text ve güvenli expansion | `compile/block-transformer.ts`, `scene-compiler.ts`, `geometry-compiler.ts`, `text/font-layout-engine.ts`, `canonical/types.ts`, `compile/entity-visitor.ts` | `tests/cad-v2/entity-instance-parity.test.ts`, `block-expansion-budget.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/P06/` (`entity-instance-parity.json`, `block-expansion-budget.json`) | **PASS** |
| **P07** | Gerçek sahne komutları, fill/maske ve kararlı çizim sırası | `protocol/binary-protocol.ts`, `compile/scene-compiler.ts`, `geometry-compiler.ts`, `canonical/types.ts`, `cad-v2-scene-worker.ts`, `worker-client.ts`, `cad-v2-renderer.ts`, `version.ts` | `tests/cad-v2/primitive-roundtrip.test.ts`, `hatch-topology.test.ts`, `painter-order.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/P07/` (`primitive-roundtrip.json`) | **PASS** |
| **P08** | R001 kök düzeltme kabulü | Yok (doğrulama/kabul paketi) | `scripts/cad-v2/audit-source-pipeline.ts`, `tests/cad-v2/r001-root-fix.test.ts` | `motor_v2/evidence/fidelity-v3/P08/ROOT_FIX_ACCEPTANCE.md` | **PASS** |
| **F01** | Renk, layer, transparency ve ekran renk uzayı | `compile/cad-color-resolver.ts`, `canonical/types.ts`, `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `decode/*-adapter.ts`, `render/cad-v2-renderer.ts` | `tests/cad-v2/style-resolution.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/F01/STYLE_RESOLUTION_ACCEPTANCE.md` | **PASS** |
| **F02** | Gerçek stroke, lineweight ve polyline width | `canonical/types.ts`, `render/cad-stroke.ts`, `compile/geometry-compiler.ts`, `compile/entity-visitor.ts`, `compile/block-transformer.ts`, `compile/scene-compiler.ts`, `render/cad-v2-renderer.ts` | `tests/cad-v2/stroke-width.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/F02/STROKE_WIDTH_ACCEPTANCE.md` | **PASS** |
| **F03** | Linetype, dash phase ve model/paper ölçeği | `canonical/types.ts`, `decode/*-adapter.ts`, `render/cad-stroke.ts`, `compile/geometry-compiler.ts`, `compile/scene-compiler.ts`, `compile/entity-visitor.ts`, `compile/block-transformer.ts`, `protocol/binary-protocol.ts`, `cad-v2-scene-worker.ts` | `tests/cad-v2/linetype-phase.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/F03/LINETYPE_PHASE_ACCEPTANCE.md` | **PASS** |
| **F04** | Font, TEXT, MTEXT ve Türkçe karakter doğruluğu | `canonical/types.ts`, `canonical/diagnostics.ts`, `decode/*-adapter.ts`, `text/font-layout-engine.ts`, `compile/block-transformer.ts`, `compile/entity-visitor.ts`, `compile/scene-compiler.ts` | `tests/cad-v2/font-style-layout.test.ts` (npm run check:cad-v2:unit) | `motor_v2/evidence/fidelity-v3/F04/FONT_STYLE_ACCEPTANCE.md` | **PASS** |
| **F05** | DIMENSION, ATTRIB/ATTDEF, LEADER ve annotation | `compile/dimension-compiler.ts`, `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `decode/*-adapter.ts`, `canonical/types.ts` | `tests/cad-v2/dimension-attribute.test.ts` (yerel sentetik + R001 entity census) | `motor_v2/evidence/fidelity-v3/F05/DIMENSION_ATTRIBUTE_ACCEPTANCE.md` | **PARTIAL — AutoCAD/DIMSTYLE/gerçek ATTRIB/MLEADER kapsamı eksik** |
| **F06** | Layout, viewport, XCLIP ve bağımlılık sınırları | `layout/layout-manager.ts`, `decode/dxf-xclip-pairs.ts`, `decode/dwg-adapter.ts`, canonical layout/viewports, scene compiler, renderer | `tests/cad-v2/layout-viewport.test.ts` (AutoCAD-authored normal/inverted/off DWG; ASCII + native binary DXF; XCLIPFRAME ayrımı; malformed/front-depth fail-closed; paper/model ownership; clip exact-segment); `tests/cad-v2/layout-viewport-render.test.ts` (iki paper layout, reused model, rotated/polygon viewport, frozen layer/style override, missing XREF degraded, renderer layout state); `tests/document-studio/cad-v2-layout-viewport.spec.ts` (Playwright/Chromium V2 host, worker/binary chunk/WebGL canvas layout switch); `npm run check:cad-v2:release` | `motor_v2/evidence/fidelity-v3/F06/LAYOUT_VIEWPORT_ACCEPTANCE.md` | **PASS — tanımlı 2D kabul kapsamı. Genel AutoCAD parity değil; unsupported OCS/clip/depth fail-closed, unresolved XREF degraded; same-source reference render V01'de açık.** |
| **F07** | Yüksek koordinat hassasiyeti, curve/refinement ve zoom hata bütçesi | `compile/geometry-compiler.ts`, `compile/coordinate-transform.ts`, `compile/entity-visitor.ts`, `compile/block-transformer.ts`, `compile/dimension-compiler.ts`, `compile/scene-compiler.ts`, `render/render-order.ts`, `render/chunk-visibility.ts`, `render/cad-v2-renderer.ts`, `canonical/diagnostics.ts`, `render/cad-stroke.ts`, `protocol/binary-protocol.ts`, `worker/curve-refinement.ts`, `worker/apply-curve-refinements.ts`, `workers/cad-v2/cad-v2-scene-worker.ts`, `lib/cad-v2/worker/worker-client.ts`, `components/dokumantasyon/cad-v2/cad-v2-host-shell.tsx` | `tests/cad-v2/precision-refinement.test.ts`; `tests/cad-v2/chunk-error-accounting.test.ts` (XY/TRIANGLES vertex, PATH_DISTANCE scalar, affine CURVE_DATA source F32 quantization, direct top-level CIRCLE/ARC, ELLIPSE and direct+nested/transformed standalone non-periodic SPLINE chord sagitta world/CSS accounting ve statik HATCH fill-boundary tessellation ve aynı fill triangle Float32 nicemlemesi/bileşik hata bound'u, CSS dönüşümü, degraded tanılar ve worker bütçe düşümü); `tests/cad-v2/curve-refinement.test.ts` (refined PATH_DISTANCE chord-length phase mapping); `tests/cad-v2/chunk-scheduler-cache.test.ts` (compiled bbox/index/validator/scheduler, lineweight padding); `tests/cad-v2/layout-viewport-render.test.ts` (camera bbox, renderer pan/layout viewport culling, legacy fail-open); `tests/cad-v2/manifest-validation.test.ts`; `tests/cad-v2/painter-order.test.ts`; `tests/cad-v2/worker-refinement-browser.test.ts`; remaining curve/stroke/protocol tests; `npm run check:cad-v2:unit`; `npm run check:cad-v2:ui` | `motor_v2/evidence/fidelity-v3/F07/PRECISION_REFINEMENT_ACCEPTANCE.md`, `RUNTIME_REFINEMENT_ARCHITECTURE.md` | **IN_PROGRESS — Lineweight-conservative bbox, XY/TRIANGLES, affine CURVE_DATA source, and PATH_DISTANCE Float32 quantization measurements flow into flat/index manifests; runtime refinement preserves interval endpoint phases and distributes intermediate PATH_DISTANCE by emitted chord length. PATH_DISTANCE is not consumed by the current renderer, so rendered dash parity remains open. Host provides bbox to camera-driven renderer culling with legacy fail-open. Sequential count partition/eager fetch, GPU/output transform and remaining tessellation, HATCH fill topology/runtime remesh ve diğer geometriler için bileşik hata muhasebesi, glyph/chunk-boundary accounting, periodic AutoCAD spline profile and same-source AutoCAD oracle remain open.** |
| **F08** | Bellek, performans ve yaşam döngüsü doğruluğu | F08 plan allowlist'i | F08 kabul testleri | `motor_v2/evidence/fidelity-v3/F08/` | TODO |
| **R01** | Production hazırlama ve çok süreç dayanıklılığı | V2 service, DB repository, API routes | `tests/cad-v2/durable-multiprocess.test.ts`, `api-revision-auth.test.ts` | `motor_v2/evidence/fidelity-v3/R01/` | TODO |
| **V01** | Son kabul ve release adayı | Yok (nihai kabul ve release raporu) | Tüm test zinciri + gerçek cihaz doğrulaması | `motor_v2/evidence/fidelity-v3/V01/` | TODO |

---

## Tarihsel R01–R48 İndeksi (EXEC-2 / Düzeltme Planı Kaydı)

Tarihsel kayıtlar korunmuştur.

| R | G | Kaynak dosya / sembol | Gerçek test / oracle | RUN / ART / SNAP | Uygulama | Test sonucu | Astra denetimi |
|---|---|---|---|---|---|---|---|
| R01 | G00,G13,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R02 | G13 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R03 | G02,G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R04 | G02 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R05 | G03,G06 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R06 | G06 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R07 | G05,G08 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R08 | G07 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R09 | G07,G09 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R10 | G08 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R11 | G08,G10 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R12 | G06,G09 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R13 | G09 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R14 | G09,G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R15 | G02,G09,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R16 | G03,G06 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R17 | G03,G10 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R18 | G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R19 | G11,G14 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R20 | G10,G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R21 | G05,G10,G11 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R22 | G05 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R23 | G12 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R24 | G05,G12 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R25 | G04,G12,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R26 | G12,G14 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R27 | G11,G12 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R28 | G03,G10,G12 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R29 | G01,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R30 | G12,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R31 | G01,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R32 | G04,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R33 | G04,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R34 | G04,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R35 | G04,G12,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R36 | G13 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R37 | G14 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R38 | G13,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R39 | G02,G07,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R40 | G00,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R41 | G00,G17 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R42 | G04,G16 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R43 | G11,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R44 | G15,G17 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R45 | G05,G08,G10 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R46 | G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R47 | G11,G15 | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |
| R48 | G17 ve denetim turları | — | — | — | NOT_STARTED | NOT_RUN | NOT_REVIEWED |

## F07 son izlenebilirlik güncellemesi (2026-09-24)

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Nested/transformed LWPOLYLINE BULGE static fallback centerline chord sagitta | `compile/geometry-compiler.ts`, `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `protocol/binary-protocol.ts`, `canonical/diagnostics.ts`, `version.ts` | `tests/cad-v2/chunk-error-accounting.test.ts`: `bulge=1`, `R=20` exact circle formula; iki nested seviye 2×3 + mirrored 4×1/rotation; 20.001 dense samples; cap, XCLIP, flat/index/validator | **PASS —** v23→v24; `DV2SCN01` schema v1 değişmedi. Yalnız continuous, widthless centerline fallback sagitta'sı. |

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Applied runtime refinement Float32 XY buffer CSS-space deviation + apply-bound validation | `worker/apply-curve-refinements.ts`, `worker/curve-refinement.ts`, `render/cad-v2-renderer.ts` | `tests/cad-v2/curve-refinement.test.ts`: high-origin compiled CIRCLE → worker refine → production apply → 20.001 exact-source samples projected through chunk-origin/camera offset + CSS units; invalid bound/NaN reject | **PASS —** ≤0.25 CSS px geometric buffer deviation; conservative worker metric covers measurement. Raster WebGL/device-pixel output and AutoCAD same-source oracle remain open; no compiler/cache revision. |

Bu dar PASS F07'yi kapatmaz. Periodic SPLINE AutoCAD fixture/desteği ve degree-2 çoklukları 1/2, degree-3 çoklukları 1/2/3, degree-4 çoklukları 1/2/3/4 ve degree-5 çoklukları 1/2/3/4/5 profilleri dışındaki knot/degree profilleri; HATCH runtime remesh/topology; bounded spatial partition/on-demand chunk yükleme; fill/glyph/chunk-boundary ve kalan bileşik hata muhasebesi; WebGL raster/device-pixel düzeyinde runtime-refined rendered error; aynı kaynak AutoCAD görüntü/ölçü oracle'ı açık kalır. F07 **IN_PROGRESS**; plan **14/19 (%74)**, **5/19 (%26)** paket açık.

### Nested affine runtime-buffer oracle'ı — 2026-09-24

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Nested/transformed CIRCLE, ARC, ELLIPSE, BULGE runtime-refined XY buffer | `worker/apply-curve-refinements.ts`, `tests/cad-v2/curve-refinement.test.ts` | 2 seviyeli INSERT altında 10 span; mirrored/non-uniform instance; apply sonrası vertex-shifted endpoint-pair slice; worker Float32 nokta eşitliği; span başına 20.001 sidecar-source örneği | **PASS —** ≤0.2 CSS px; conservative worker metric ölçümü kapsar. Nested SPLINE/HATCH, WebGL raster/device-pixel ve AutoCAD same-source oracle'ı açık. Compiler revision/cache değişmedi (v24), schema v1. |

Toplam plan **14/19 (%74)**, **5 paket (%26)** açık; F07 **IN_PROGRESS**.

### Direct/nested rational SPLINE runtime-buffer oracle'ı — 2026-09-24

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Direct ve nested non-periodic rational quadratic SPLINE post-apply XY | `worker/apply-curve-refinements.ts`, `tests/cad-v2/curve-refinement.test.ts` | 6 knot-span; mirrored/non-uniform INSERT; apply sonrası reindexed endpoint-pair extraction; worker Float32 birebirliği; span başına 20.001 rational Bezier samples | **PASS —** ≤0.2001 CSS px ve worker conservative bound kapsaması. Periodic spline/knot multiplicity, HATCH, raster/device-pixel ve AutoCAD oracle'ı açık; compiler revision/cache değişmedi (v24), schema v1. |


### Direct/nested HATCH ARC/BULGE/ELLIPSE post-apply boundary buffer oracle'ı — 2026-09-24

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| HATCH curved boundary source'larının runtime-refined renderer XY buffer'ı | worker/apply-curve-refinements.ts, tests/cad-v2/curve-refinement.test.ts | 5 direct/nested span; apply sonrası vertex-delta reindex; worker Float32 birebirliği; her affine source'a 20.001 örnek | **PASS —** ≤0.2001 CSS px; conservative worker bound ölçümü kapsar. Bu HATCH fill remesh/topology değildir. HATCH SPLINE post-apply, periodic SPLINE/knot multiplicity, spatial partition/on-demand loading, fill/glyph/chunk-boundary kalan composite accounting, WebGL raster/device-pixel ve same-source AutoCAD oracle'ları açık. Compiler/cache değişmedi (v24), schema v1. |

F07 **IN_PROGRESS**; toplam plan **14/19 (%74)**, **5 paket (%26)** açık.


### Direct/nested HATCH rational SPLINE post-apply boundary buffer oracle'ı — 2026-09-24

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| HATCH non-periodic rational SPLINE boundary'nin runtime-refined renderer XY buffer'ı | worker/apply-curve-refinements.ts, tests/cad-v2/curve-refinement.test.ts | 4 knot-span; iki direct ve bir nested mirrored/non-uniform INSERT; apply sonrası vertex-delta reindex; worker Float32 birebirliği; span başına 20.001 rational Bezier örneği | **PASS —** ≤0.2001 CSS px; conservative worker bound ölçümü kapsar. XCLIP/cap fail-closed kontrolleri mevcut testte sürer. HATCH fill remesh/topology, periodic SPLINE/knot multiplicity, spatial partition/on-demand loading, fill/glyph/chunk-boundary bileşik muhasebe, PATH_DISTANCE rendered dash, raster/device-pixel ve same-source AutoCAD oracle'ları açık. Compiler/cache değişmedi (v24), schema v1. |

F07 **IN_PROGRESS**; toplam plan **14/19 (%74)**, **5 paket (%26)** açık.

## F07 izlenebilirlik — curved-line encoded geometry composite (2026-09-24)

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Aynı curved line primitive'inde static chord sagitta + XY Float32 endpoint round-trip error | `compile/scene-compiler.ts`, `protocol/binary-protocol.ts`, `canonical/diagnostics.ts`, `version.ts` | `chunk-error-accounting.test.ts`: 1e9 origin / 1e8 radius CIRCLE; emitted segment count'undan analitik `R(1-cos(π/n))` sagitta; emitted XY + ORIGIN endpoint ölçümü; flat/index/validator/negative/conflict ve screen budget | **PASS —** ayrı terimler hedef altında, toplam hedef üstünde; diagnostic ile `degraded`. Compiler/cache v24→v25, schema v1. Yalnız statik curved-line fallback. |
| Curved HATCH boundary line chord sagitta + aynı line Float32 endpoint bileşik bound'u | `compile/geometry-compiler.ts`, `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `version.ts` | `chunk-error-accounting.test.ts`: büyük koordinat ARC semicircle; analitik `R(1-cos(π/(2n)))`; emitted XY + ORIGIN; nested two-level INSERT scale/reflection/rotation; paper viewport single-scale fixture; XCLIP-visible fragment | **PASS —** sagitta ve encoding ayrı ayrı 0.25 CSS px içinde, same-chord toplamı hedef dışında; nested bound INSERT singular scale'ini alır; viewport ölçeği bir kez eklenir; XCLIP source bound'u taşınmaz. Compiler/cache v25→v26, schema v1. Fill TRIANGLES/remesh kapsam dışı. |

## F07 izlenebilirlik — non-periodic rational SPLINE knot multiplicity oracle'ı (2026-09-24)

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Pozitif ağırlıklı non-periodic rational SPLINE: degree-2 iç knot çoklukları 1/2; degree-3 çoklukları 1/2/3; degree-4 çoklukları 1/2/3/4; degree-5 çoklukları 1/2/3/4/5 | `tests/cad-v2/precision-refinement.test.ts`: `testSplineInternalKnotMultiplicityAgainstIndependentDeBoorOracle` | 14 sentetik profil; bağımsız homojen De Boor evaluator; profil başına 20.001, toplam 280.014 kaynak örneği; iç knot noktalarının emitted polyline'da tutulması | **PASS —** kaynak-polyline sapması ≤0.03 world unit ve raporlanan `maxSagittaWorld`. Diğer degree/knot profilleri, periodic SPLINE AutoCAD fixture/desteği ve evaluator kıyası açık. Yalnız test değişti; compiler/cache v26, schema v1. |
| Nested mirrored/non-uniform LWPOLYLINE BULGE same-chord sagitta + XY Float32 endpoint composite | `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `tests/cad-v2/chunk-error-accounting.test.ts`: `testNestedBulgeTessellationErrorIncludesInsertTransforms` | İki seviyeli 8× affine INSERT; chord başına analytic transformed endpoint ↔ serialized `ORIGIN + XY` round-trip ölçümü; per-chord sagitta + endpoint maksimumu; 20.001 source sample, CSS/world, cap, XCLIP, flat/index validator | **PASS —** per-chord maximum `maxCurveEncodedGeometryErrorWorld/CssPixels` manifest ile eşleşir; test-only, compiler/cache v26 ve schema v1 sabit. Bu tek continuous widthless BULGE chord familyasıdır; residual cross-source/chunk/fill/glyph/runtime composite açık. |
| Nested non-uniform INSERT cubic SPLINE same-chord sagitta + XY Float32 endpoint composite | `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `tests/cad-v2/chunk-error-accounting.test.ts`: `testNestedSplineTessellationErrorIncludesInsertTransforms` | İki seviyeli 8× affine; source parameter aralıklarında cubic Bernstein endpoint ve türev oracle'ı; subcurve control-hull sagitta; chord başına serialized `ORIGIN + XY` endpoint error; CSS/world, cap, XCLIP | **PASS —** control-hull sagitta + aynı chord endpoint loss maksimumu manifest composite world/CSS ile eşleşir. Test-only; revision v26/schema v1 sabit. Periodic/AutoCAD SPLINE, other-source/chunk/fill/glyph ve rendered-pixel composite'leri açık. |
| Direct top-level ELLIPSE same-chord sagitta + XY Float32 endpoint composite | `tests/cad-v2/chunk-error-accounting.test.ts`: `testEllipseCurveTessellationErrorIsMeasuredAndBudgeted` | Analitik uniform interval sayısı ve `|majorVector| × Δt² / 8`; chord başına exact ellipse endpoints ↔ serialized `ORIGIN + XY`; target yakınındaki ayrı-term-fit / sum-overrun; CSS/world, cap, flat/index validator | **PASS —** en büyük analytic sagitta + aynı chord endpoint round-trip loss manifest/hash-index world/CSS composite ile eşleşir ve target aşımında degraded diagnostic üretir. Test-only; compiler/cache v26/schema v1 sabit. Nested ELLIPSE ve kalan composite/görsel kapıları açık. |
| Nested non-uniform INSERT ELLIPSE same-chord sagitta + XY Float32 endpoint composite | `compile/entity-visitor.ts`, `compile/scene-compiler.ts`, `tests/cad-v2/chunk-error-accounting.test.ts`: `testNestedEllipseTessellationErrorIncludesInsertTransforms` | İki seviyeli 8× singular value; analitik interval/endpoints ve chord başına serialized `ORIGIN + XY`; world/CSS, flat/index, budget diagnostic, paper viewport 0.15 ve partial XCLIP | **PASS —** world sagitta birleşik INSERT ölçeğiyle büyütülür, paper viewport bir kez uygulanır, same-chord composite manifest/hash-index ile eşleşir; XCLIP parçası kaynak bound'u taşımaz. Revision v26→v27, schema v1. Yalnız bu nested profil kapanır. |
| Döndürülmüş TEXT glyph stroke uç noktalarının Float32 XY nicemleme hata muhasebesi | `tests/cad-v2/chunk-error-accounting.test.ts`: `testTextGlyphEndpointsContributeToEncodedQuantizationBudget`; mevcut genel `scene-compiler.ts` vertex quantization lane'i | Türkçe glyph içeren, döndürülmüş/yüksek koordinatlı TEXT; `FontLayoutEngine` source stroke uçları; bağımsız bbox midpoint + `Math.fround` endpoint round-trip hesabı; flat/index/validator ve CSS bütçe/degraded kontrolü | **PASS —** bütün glyph stroke endpoint round-trip maksimumu chunk `maxQuantizationErrorWorld/CssPixels` alanıyla eşleşir ve hedef aşımında mevcut tanı kaliteyi degraded yapar. Yalnız encoding muhasebesi; glyph outline/AutoCAD şekil paritesi veya runtime refinement değildir. Test-only; compiler/cache v27 ve schema v1 sabit. |

HATCH fill runtime remesh/topology, glyph outline/refinement ve cross-primitive/chunk-boundary composite terms, visible PATH_DISTANCE dash, GPU raster/device-pixel ve same-source AutoCAD oracle'ı açık kalır. F07 **IN_PROGRESS**; plan **14/19 (%74)**, **5 paket (%26)** açık.

## F07 açık kapı yeniden kontrolü — 2026-09-24

| Kapı | Mevcut kod/test kanıtı | Durum |
|---|---|---|
| Periodic SPLINE + knot/AutoCAD oracle | Periodic spline testinde fail-closed/empty output; 14 degree-2–5 knot profili synthetic non-periodic. AutoCAD-authored periodic fixture ve evaluator karşılaştırması yok. | **OPEN** |
| HATCH runtime fill remesh/topology | `curve-refinement.test.ts` HATCH ARC/BULGE/ELLIPSE/SPLINE boundary output'larını ölçer; fill TRIANGLES compiler'da üretilir, worker fill remesh/topology kabul testi yok. | **OPEN** |
| Bounded spatial partition / camera-driven on-demand fetch | Manifest chunk bbox, renderer camera culling ve sınırlı scheduler/LRU kodu/testi mevcut; fakat `SpatialChunkScheduler` host akışında çağrılmıyor. `CadV2HostShell` başlangıçta bütün chunk'ları indiriyor; yalnız concurrency sınırı uygulanıyor. | **OPEN —** mevcut bbox/culling ve scheduler unit kapsamı F07 runtime refinement için on-demand fetch kanıtı değildir. |
| Kalan composite error | CIRCLE, curved HATCH boundary, direct/nested ELLIPSE, nested BULGE/SPLINE seçili same-chord kontrolleri; TEXT glyph endpoint quantization için dar oracle var. Cross-source/chunk, fill ve glyph outline/refinement toplamları hâlâ kapsanmıyor. | **OPEN** |
| Runtime-refined rendered error | Uygulanmış worker buffer için CPU/CSS projection bound testleri var; WebGL raster/anti-alias/device-pixel ölçümü yok. | **OPEN** |
| Same-source AutoCAD visual/measurement | F07 acceptance testlerinde eşleşen AutoCAD kaynak dosyası üzerinde görüntü/ölçü kıyası yok. | **OPEN** |

Doğrudan ELLIPSE checkpoint'i test-only idi; sonraki nested ELLIPSE v27 checkpoint'i compiler/cache metadata'sını değiştirdi. Nested ELLIPSE için yalnız belirtilen 8× INSERT/paper/XCLIP profili ölçülmüştür. F07 **IN_PROGRESS** ve toplam plan **14/19 (%74)**, **5/19 (%26)** paket açık kalır.

## F07 izlenebilirlik — TEXT glyph endpoint encoding (2026-09-24)

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Gerçek TEXT glyph stroke uçlarının Float32 endpoint nicemleme hatası | `compile/scene-compiler.ts` mevcut genel XY quantization metriği; `tests/cad-v2/chunk-error-accounting.test.ts`: `testTextGlyphEndpointsContributeToEncodedQuantizationBudget` | Döndürülmüş/yüksek koordinatlı Türkçe TEXT; FontLayoutEngine source endpoints; bağımsız bounds midpoint + `Math.fround`; flat/index/validator, CSS budget ve degraded diagnostic | **PASS —** endpoint maksimumu `maxQuantizationErrorWorld/CssPixels` ile eşleşir. Yalnız encoding; font outline, runtime glyph refinement ve cross-chunk bileşik hata açık. Test-only, revision v27/schema v1 sabit. |

F07 açık kapı güncellemesi: glyph stroke endpoint encoding muhasebesi için bağımsız test eklendi; glyph outline/AutoCAD eşdeğerliği, MTEXT/dimension varyantları, runtime refinement ve chunk-boundary kompozisyonu hâlâ kanıtlanmadı. Diğer açık kapılar: periodic SPLINE AutoCAD fixture/knot oracle'ı, HATCH fill runtime remesh/topology, host'a bağlı on-demand partition/fetch, kalan fill/glyph/chunk composite'leri, visible dash, WebGL raster/device-pixel ve same-source AutoCAD ölçü/görüntü.

### 2026-09-24 — Tek kaynak ARC'ın chunk seam hata zarfı

- **Dar kabul:** Ardışık aynı-kaynak circular ARC chord'ları ayrı chunk'lardadır; analitik endpoint/sagitta ve Float64 ORIGIN + Float32 XY decode hataları, ortak kaynak vertex'teki seam gap'i, manifest/hash-index/validator aktarımı. **Oracle:** testCurveEndpointRoundTripSeamIsBoundedAcrossChunks; compile/scene-compiler.ts içindeki mevcut tessellation ve composite alanları. **Sonuç: PASS** — seam iki komşu endpoint hata toplamı ve komşu local composite sınırları içinde. Genel chunk boundary/cross-source/clip/fill/glyph muhasebesi açık; test-only, revision v27/schema v1 sabit. F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) açık.

### 2026-09-24 — farklı LINE kaynaklarının chunk seam hata zarfı

Dar kabul: 1e9 koordinatlarında tam ortak vertex paylaşan iki ayrı LINE kaynağı ayrı chunk'lara derlenir. Oracle: testCrossSourceLineSeamIsBoundedAcrossChunks; chunk-local bounds midpoint, Float32 offset, decode endpoint round-trip ve CSS ölçeği bağımsız ölçülür. Sonuç: PASS — ölçülen seam gap iki ortak endpoint hata toplamı ve adjacent generic chunk quantization toplamı içinde; index/manifest aktarımı kontrol edilir. Kapsam iki LINE ile sınırlıdır; line-curve, clipping, fill/glyph ve genel chunk boundary composite'leri açık. Test-only, revision v27/schema v1 sabit; F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) açık.

### 2026-09-24 — LINE→ARC farklı kaynak seam ve ilk chord composite'i

Dar kabul: bir LINE kaynağının tam uç noktası ayrı ARC kaynağının analitik başlangıcıdır; her biri bağımsız chunk origin'iyle kodlanır. Oracle: testLineToArcSourceSeamIsBoundedAcrossChunks; local midpoint ORIGIN ve Float32 endpoint'leri bağımsız tekrar hesaplanır, seam boşluğu iki endpoint hatasıyla ölçülür, ilk ARC chord sagitta + endpoint composite'i world/CSS alanlarıyla eşleştirilir. Sonuç: PASS — seam endpoint envelope ve komşu local hata sınırları içinde; hash-index composite ve manifest dizisi doğrulanır. Yalnız bu tek yönlü LINE→ARC profili; genel cross-source/chunk, clip/fill/glyph ve diğer curve birleşimleri açık. Test-only, revision v27/schema v1 sabit; F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) açık.


### 2026-09-24 — WebGL'de önceden tessellate edilmiş dash görünürlüğü

Dar kabul: synthetic DV2SCN01 fixture'ının XY bölümüne kodlanmış beş kırmızı stroke ve dört boşluğun gerçek WebGL canvas screenshot'ında piksel örneklemesi. Oracle: pre-tessellated DASHED segments appear as alternating strokes and gaps in the WebGL frame; sonuç tam 5 kırmızı aralık, 4 boşluk ve minimum 8 px üstü gap — PASS. Binary fixture beklenen PATH_DISTANCE lane'ini korur, fakat mevcut renderer lane'i okumaz; bu nedenle dash phase/PATH_DISTANCE shader tüketimi veya compiler-to-renderer uçtan uca dash kabulü değildir. Hedefli Chromium 1/1, unit, UI/Chromium 3/3, runtime typecheck ve diff-check PASS; worker bundle hash'leri koruma kopyalarıyla aynı. Test-only, revision v27/schema v1 sabit. Runtime-refined device-pixel ve AutoCAD same-source oracle'ları ile diğer F07 kapıları açık; F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) açık.

### 2026-09-24 — gerçek compiler DASHED chunk'ının WebGL görünürlüğü

Dar kabul: canonical LINE ve özel [24,-16] dash pattern'i compileCanonicalToScene ile derlenir; gerçek compiler manifest/chunk'ı test browser'ına sunulur. Oracle, PATH_DISTANCE'ın beklenen 0/24/40/.../184 kümülatif değerlerini ve screenshot'taki beş kırmızı aralık/dört boşluğu doğrular. Sonuç: PASS — compiler-generated tessellated dash geometry Chromium WebGL pikselinde görünür. Renderer PATH_DISTANCE lane'ini tüketmiyor; shader lane/faz hesaplaması, runtime refine sırasında faz kararlılığı ve chunk seam sürekliliği bu dar oracle'ın dışında. Hedefli Chromium 1/1, unit, UI/Chromium 3/3, runtime typecheck ve diff-check PASS; child compiler timeout-bounded, worker hash'leri değişmedi. Test-only, compiler/cache v27/schema v1 sabit. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) açık.


## 2026-09-24 — F07 compiled DASHED chunk partition evidence

Evidence: `tests/cad-v2/f07-dash-render-scene.ts` compiles one canonical DASHED source into single-chunk and five-chunk manifests/binaries; `tests/document-studio/cad-v2-layout-viewport.spec.ts` serves both to Chromium and compares actual WebGL canvas pixels. The test checks `[0,24,40,64,80,104,120,144,160,184]` path distances, five red dash runs/four gaps in both scenes, and identical full canvas PNG SHA-256 plus run/gap intervals. Targeted 1/1 and full UI 3/3 passed; full unit, runtime typecheck, and diff-check also passed. This evidence supports only pre-tessellated LINE visibility under this tested chunk split. It does not support PATH_DISTANCE shader use, general phase behavior, runtime-refined pixel error, or AutoCAD parity. Test-only: revision v27/schema v1.

The plan remains 14/19 (74%), with 5/19 (26%) packages open. Periodic SPLINE fixture/evaluator and knot parity, HATCH fill runtime remesh/topology, host-integrated bounded/on-demand chunks, residual fill/glyph/chunk-boundary composites, PATH_DISTANCE GPU consumption, refined WebGL/device-pixel error, and same-source AutoCAD visual/measurement evidence remain unclosed.


## 2026-09-24 — direct LINE / nested BULGE source-seam evidence

Evidence: `testLineToNestedBulgeSourceSeamIsBoundedAcrossChunks` in `tests/cad-v2/chunk-error-accounting.test.ts`. It compiles a direct LINE joined exactly to a BULGE inside two INSERT levels with reflection/non-uniform scale and rotation; every primitive has a separate chunk origin. Its independent circle/affine oracle checks the transformed sagitta, each serialized Float32 endpoint loss, every chunk's world/CSS same-chord composite, and 20,001 transformed source samples. The actual decoded seam must fit both measured endpoint errors and adjacent chunk/composite bounds. Hash-index and manifest validation also retain the values. Targeted test, full CAD V2 unit, UI/Chromium 3/3, runtime typecheck, and diff-check passed. Scope is this one forward join profile; it does not close general chunk seams, fill/glyph boundaries, runtime WebGL pixel error, or AutoCAD parity. Test-only, revision v27/schema v1 unchanged.

F07 remains 14/19 (74%) with 5/19 (26%) packages open. Periodic SPLINE fixture/evaluator and periodic knot parity, HATCH runtime fill remesh/topology, host-integrated bounded/on-demand chunks, residual fill/glyph/chunk composites, PATH_DISTANCE shader consumption, runtime-refined device-pixel error, and same-source AutoCAD visual/measurement evidence remain unclosed.

## 2026-09-24 — ARC→LINE cross-source chunk seam

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| ARC'ın ardından gelen, ARC'ın analitik son vertex'inden başlayan ayrı LINE kaynağında chunk seam | tests/cad-v2/chunk-error-accounting.test.ts: testArcToLineSourceSeamIsBoundedAcrossChunks; production compiler değişmedi | Her chord/LINE için bağımsız local bounds midpoint + Float32 offset, decode endpoint hataları, son-chord circular sagitta + endpoint composite, world/CSS, hash-index ve manifest validator | PASS — ölçülen seam ortak uç kaybı ve adjacent chunk/composite sınırları içinde. Targeted/full unit, runtime typecheck, UI Chromium 3/3 ve diff-check geçti. Test-only; revision v27/schema v1 sabit. Genel cross-source/chunk, fill/glyph, runtime raster ve AutoCAD kapıları açık. |

F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) paket açık. Periodic SPLINE AutoCAD fixture/knot oracle'ı, HATCH fill remesh/topology, host on-demand partition, kalan bileşik hata, PATH_DISTANCE shader tüketimi, runtime-refined device-pixel ve same-source AutoCAD visual/measurement kapıları açık.

## 2026-09-24 — nested BULGE→LINE reverse seam

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| İki seviyeli mirrored/non-uniform INSERT altındaki BULGE'nin son chord'u ile sonraki top-level LINE arasında chunk sınırı | tests/cad-v2/chunk-error-accounting.test.ts: testNestedBulgeToLineSourceSeamIsBoundedAcrossChunks | Bağımsız semicircle endpoint/sagitta ve 8× affine oracle; chunk midpoint ORIGIN + Float32 round-trip; son chord composite; measured seam endpoint envelope; CSS/world, hash-index, manifest validation | PASS — ölçülen seam, ortak endpoint kayıpları ve komşu chunk/composite bound'ları içinde. Hedefli accounting, full unit, runtime typecheck, UI Chromium 3/3 ve diff-check geçti. Test-only; compiler/cache v27/schema v1 sabit. Yalnız bu ters yönlü nested profile; genel chunk/fill/glyph/raster/AutoCAD kapıları açık. |

F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) paket açık. Periodic SPLINE AutoCAD/evaluator/knot, HATCH fill remesh/topology, host on-demand partition, kalan fill/glyph/chunk-boundary composite'leri, PATH_DISTANCE shader, runtime rendered device-pixel ve same-source AutoCAD ölçü/görüntü kabul kapıları açık.


## 2026-09-24 — runtime-refined WebGL pixel-distance oracle

- Dar kabul: Idle refinement hedefi 0.25 CSS px'e geldiğinde gerçek CAD V2 WebGL canvas'ındaki quarter-circle rasterının kaynak yayla iki yönlü uzaklığı.
- Bağımsız oracle: Chromium screenshot'ından 494 renkli piksel merkezi; fit kamera üzerinden analitik yay izdüşümü; rendered→source maksimumu 0.9677 CSS px. Her 0.5 CSS px'te örneklenen kaynak yay→rendered maksimumu 0.7497 CSS px. Her ikisi 0.25 px refinement + 1 px raster payı = 1.25 CSS px altında.
- Doğrulama: Hedefli Chromium 1/1, tam CAD V2 unit, UI/Chromium 3/3, runtime typecheck ve git diff --check PASS; worker SHA-256 değerleri aynı. Test-only, compiler/cache v27 ve schema v1 değişmedi.
- Sınır: Bir quarter-circle ve 1280×672 Chromium canvas profili. Genel geometri/zoom/DPR/device rendered hata, fill/glyph/chunk composite'leri ve AutoCAD parity açık. F07 IN_PROGRESS, 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-24 — centered 125% runtime-rendered error profili

- Dar kabul: Önceki fit-camera screenshot ölçümüne ek olarak 125% UI zoom'da aynı quarter-circle'in gerçek WebGL raster/kaynak uzaklığı.
- Refinement: Zoom sonrası worker transient hedef 0.75 CSS px'i, ardından idle hedef 0.25 CSS px'i yanıtları teslim edilerek tamamlar. Kamera ölçeği UI 125% ve bağımsız fit U/1.25 ile kontrol edilir.
- Oracle: 610 renkli piksel; maksimum render→source uzaklığı 0.9612 CSS px, 0.5 px aralıklı source→render maksimumu 0.7642 CSS px. Her ikisi 1.25 px sınırında. Fit profiliyle beraber iki centered scale geçmiştir.
- Kontroller: Hedefli Chromium 1/1, full CAD V2 unit, UI/Chromium 3/3, runtime typecheck, diff-check PASS; worker hash'leri aynı. Test-only, v27/schema v1.
- Sınır: Higher zoom, pan camera, DPR/device, geometry/fill/glyph/chunk çeşitleri ve AutoCAD oracle'ı açık; diğer F07 gate'leri açık. F07 IN_PROGRESS, plan 14/19 (74%), 5/19 (26%) açık.


## 2026-09-24 — centered 80% runtime-refined raster profile

- Dar kabul: Mevcut gerçek WebGL quarter-circle screenshot oracle'ını centered 80% zoom-out ölçeğinde tekrarla.
- Refinement/oracle: UI 80%; transient 0.75 ve idle 0.25 CSS px yanıtları teslim edilir, bounded quiet/drain döngüsü sonrası screenshot. Bağımsız u=fitU/0.8=0.2055921053 world/CSS px.
- Ölçüm: 399 piksel; render→source maksimum 0.9819 CSS px, 0.5 CSS px aralıklı source→render maksimum 0.7193 CSS px. 1.25 CSS px eşiğinin altında. Üç centered profil: fit 494 px 0.9677/0.7497, 80% 399 px 0.9819/0.7193, 125% 610 px 0.9612/0.7642 (render→source/source→render).
- Kontroller: Hedefli Chromium 1/1, tam CAD V2 unit, UI/Chromium 3/3, runtime typecheck ve diff-check PASS; worker hash'leri aynı. Test-only; compiler/cache v27 ve schema v1 sabit.
- Sınır/açık kapılar: Tek sentetik quarter-circle, üç centered zoom, tek Chromium raster context. Higher zoom, pan, DPR/device, entity/fill/glyph/chunk çeşitleri, genel rendered hata ve AutoCAD same-source oracle'ı açık. Periodic SPLINE AutoCAD/evaluator/knot multiplicity, HATCH runtime remesh/topology, host bounded/on-demand partition/chunk yükleme, kalan composite error ve shader PATH_DISTANCE tüketimi açık. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-24 — translated 125% runtime-refined raster profile

- Dar kabul: Mevcut iki yönlü WebGL arc oracle'ını aynı idle 125% camera bucket'ında kontrollü pan sonrasında ölç.
- Kamera/oracle: Pointer drag +48,+24 CSS px; D3 dönüşümü aynı screen-space translation'ı verir. u=0.1315789474 world/CSS px korunur; held worker response yok ve idle hedef 0.25 CSS px quiet interval boyunca sabit kalır.
- Ölçüm: 610 pixel bbox centered [640,31]-[944,335] konumundan [688,55]-[992,359] konumuna taşındı. Render→source maksimum 0.9612 CSS px; source→render maksimum 0.7642 CSS px; eşik 1.25 CSS px.
- Kontroller: Hedefli Chromium 1/1, tam CAD V2 unit, UI/Chromium 3/3, runtime typecheck ve git diff --check PASS. DWG ve scene worker hash'leri koruma kopyalarıyla eşleşti. Test/evidence aşaması; compiler/cache v27, schema v1.
- Sınır/açık kapılar: Tek sentetik arc, pan offset'i, 125% ve Chromium bağlamı. Genel pan/zoom/DPR/device, diğer geometri/fill/glyph/chunk bileşikleri ve AutoCAD same-source oracle açık. Periodic SPLINE AutoCAD/evaluator/knot multiplicity, HATCH runtime remesh/topology, host bounded/on-demand chunks, kalan composite accounting ve PATH_DISTANCE shader tüketimi açık. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-24 — 195% pan edilmiş runtime ARC raster kabul kanıtı

| Dar kabul | Uygulama | Oracle / kontrol | Sonuç ve sınır |
|---|---|---|---|
| Idle refinement sonrasında yüksek zoom ve pan'de WebGL ARC raster hatası | tests/document-studio/cad-v2-layout-viewport.spec.ts, mevcut Chromium senaryosu | D3 (811,421.5,11.875), u=0.0842105263 world/CSS px; pan +171,+85.5. Görünür analitik yay [0.1591116695,1.0916057806]. 622 piksel: render→source 1.0113 px, visible source→render 0.7581 px; sınır 1.25 px. Idle .25 px, held response 0, max vertex 46. | PASS — yalnız sentetik quarter-circle / panned 195% / Chromium. Targeted Chromium 1/1, full unit, UI Chromium 3/3, runtime typecheck, diff-check. Test-only; worker hash'leri aynı, compiler/cache v27, schema v1. Genel rendered-error veya AutoCAD oracle'ı değildir. |

F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) açık paket. Periodic SPLINE AutoCAD fixture/evaluator/knot parity, HATCH runtime remesh/topology, host bounded spatial partition/on-demand chunking, fill/glyph/chunk-boundary ve diğer composite hata muhasebesi, shader PATH_DISTANCE, farklı geometri/zoom/pan/DPR profilleri ve aynı-kaynak AutoCAD visual/measurement oracle'ı açık.

## 2026-09-24 — runtime-refined raster DPR2 profili

- Dar kabul: Aynı bağımsız quarter-circle/WebGL oracle'ında gerçek Chromium `deviceScaleFactor=2` bağlamı.
- Kamera/refinement: Centered fit, `unitsPerCssPixel=0.1644736842`; CSS canvas 1280×672, DPR=2 drawing buffer 2560×1344. Worker hedefleri `[0.75,0.25]` CSS px; 2 refinement yanıtı, quiet snapshot sabit, `maxLineVertexCount=34`.
- Bağımsız raster ölçümü: Device-resolution screenshot'ta 981 seçili piksel; render→tam analitik yay maksimumu 0.6157362894 CSS px, kaynak→render maksimumu 0.4750552899 CSS px; kabul zarfı 1.25 CSS px.
- Doğrulama: `npm run check:cad-v2:unit` PASS; `npm run check:cad-v2:ui` Chromium **4/4 PASS**; `npx tsc --noEmit -p tsconfig.next.json --incremental false` ve `git diff --check` PASS. Worker SHA-256'ları koşu öncesi/sonrası aynı; compiler/cache v27, schema v1.
- Sınır: Tek sentetik ARC, centered fit ve DPR2. Farklı geometri, pan-at-DPR2 ve çeşitli cihaz/raster bağlamlarıyla genel runtime hata kapısı hâlâ **OPEN**. Periodic SPLINE AutoCAD/evaluator/knot, HATCH fill remesh/topology, host bounded/on-demand chunks, kalan fill/glyph/chunk composite'leri, shader `PATH_DISTANCE` ve same-source AutoCAD görsel/ölçü kapısı **OPEN**. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.

## 2026-09-24 — F07 ELLIPSE runtime raster alt-kabulü

| Alan | Kanıt |
|---|---|
| Profil | Sentetik ELLIPSE U=(40,0), V=(0,24), [0,π/2]; gerçek host/worker/refined XY/WebGL; DPR1 fit 1280×672; 0.1644736842 world/CSS px. |
| Refinement | 0.75→0.25 CSS px, 2 yanıt, quiet snapshot, max 34 line vertex. |
| Oracle | 4097 parametrik örnek, 378 piksel; render→source 0.9825281925 px, source→render 0.7467465149 px; eşik 1.25 px. |
| Kontroller | İlgili iki unit, Chromium 1/1, tam UI Chromium 5/5, runtime typecheck/diff-check PASS. Son retry C: ENOSPC nedeniyle sonuçsuz. |
| Kimlik/sınır | Worker hash aynı, v27/schema v1. Full unit, mevcut P05/P06 evidence JSON yazma yan etkisi nedeniyle tekrarlanmadı. |

Tek geometri/profil; genel rendered-error ve AutoCAD oracle'ı açık. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.
D-backed retry'ler test başlamadan durdu: ilkinde npm cache C: üzerindeydi; ikincisinde scripts/sync-cad-upstream-assets.mjs:61 C: diskinde ENOSPC verdi. Yeni D: çıktıları korundu.

### 2026-09-25 — rendered-error iz profili: DPR2 fit + pan

| Bağlam | Kamera | Raster | Worker durumu | Render→kaynak | Kaynak→render |
|---|---|---:|---|---:|---:|
| ARC, Chromium WebGL, DPR2 | fit, pan (+48,+24) CSS px; D3 (640,336,6.08) → (688,360,6.08) | 1280×672 CSS; 2560×1344 px; 981 seçili piksel | 0.75→0.25 CSS px; 2 yanıt; sessiz; 34 max line vertex | 0.6157362894 CSS px | 0.4750552899 CSS px |

İki yönlü bağımsız analitik quarter-circle raster oracle'ı 1.25 CSS px bütçesinin altında. Üç ilgili unit (`curve-refinement`, `precision-refinement`, `layout-viewport`), tam Chromium viewport dosyası 5/5, runtime typecheck ve diff-check geçti. Test-only; compiler/cache v27 ve DV2SCN01 v1, scene/DWG worker hash'leri değişmedi.

Bu iz yalnız bir geometri, fit zoom, sabit pan vektörü ve Chromium DPR2 içindir. F07 rendered-error genellemesi AÇIK/PARTIAL; periodic SPLINE AutoCAD/knot, HATCH remesh/topology, host bounded/on-demand chunks, fill/glyph/chunk bileşikleri, shader `PATH_DISTANCE` ve aynı-kaynak AutoCAD görsel/ölçü kapıları AÇIK; AutoCAD oracle'ı NOT_RUN. F07 14/19 (%74), 5/19 (%26) açık.
### 2026-09-25 — ELLIPSE runtime raster iz profili (DPR2 pan)

| Kaynak/oracle | Kamera | CSS / device raster | Refinement | Piksel sayısı | Render→kaynak | Kaynak→render |
|---|---|---|---|---:|---:|---:|
| Sentetik ELLIPSE, 4097 parametrik kaynak örneği | DPR2 fit, pan (+48,+24); D3 (640,336,6.08) → (688,360,6.08) | 1280×672 / 2560×1344 | 0.75→0.25 CSS px, 2 yanıt, sessiz, 34 max line vertex | 759 | 0.6081436225 CSS px | 0.4231605551 CSS px |

Bağımsız parametrik oracle iki yönü de 1.25 CSS px zarfında ölçtü; pan merkezini D3 dönüşüm farkıyla doğruladı. Üç ilgili unit, tam Chromium dosyası 6/6, runtime typecheck ve diff-check geçti. Test-only; compiler/cache v27, DV2SCN01 v1 ve iki worker hash'i değişmedi.

Rendered-error hâlâ kısmi: ARC ve ELLIPSE DPR2 fit/+48,+24 pan profilleri eklendi; tam geometri/zoom/pan/DPR/device matrisi yok. Periodic SPLINE AutoCAD/knot, HATCH runtime topology, host bounded/on-demand chunk, fill/glyph/chunk composite, shader `PATH_DISTANCE` ve same-source AutoCAD görsel/ölçü kapıları OPEN; AutoCAD oracle'ı NOT_RUN. F07 IN_PROGRESS, 14/19 (%74), 5/19 (%26) açık.
## 2026-09-25 — DPR2 ELLIPSE 125% ikinci pan: ölçüm ve açık kapı denetimi

| Profil | D3 kamera | Raster | Worker | Bağımsız parametrik oracle |
|---|---|---|---|---|
| 40×24 ELLIPSE, Chromium WebGL, DPR2, 125% | fit-pan (688,360,k=6.08) → zoom (700,366,k=7.6) → ikinci +48,+24 pan (748,390,k=7.6); net (+108,+54) CSS px | 1280×672 CSS; 2560×1344 device; 940 piksel | [0.75,0.25,0.75,0.25], 4 yanıt, quiet, 40 max line vertex | 4097 kaynak örneği; u=0.1315789474 world/CSS px; render→kaynak 0.5931555545 px, kaynak→render 0.4141058575 px (≤1.25) |

tests/document-studio/cad-v2-layout-viewport.spec.ts içindeki DPR2 ELLIPSE kabul senaryosu aynı testi fit-pan, merkezden 125% yakınlaştırma ve ikinci pan sırasıyla çalıştırır. Hedefli senaryo 1/1; dosyanın tüm Chromium senaryoları 6/6; curve-refinement, precision-refinement, layout-viewport unit'leri; runtime tsc --noEmit -p tsconfig.next.json --incremental false; git diff --check başarılıdır. Çıktılar D:\codex-cad-v2-f07-ellipse-pan-dpr2-125-20260925 altında saklandı; Next dev cache’i C: üzerinde yeni ve benzersiz dizindedir. Test/helper only; compiler/cache v27, DV2SCN01 v1 ve ölçülen scene/DWG worker hash'leri değişmedi.

### F07 kapıları — güncel kaynak/test taraması

| Kapı | Doğrulanan repo durumu | Kabul durumu |
|---|---|---|
| Periodic SPLINE AutoCAD fixture/desteği ve knot oracle | DXF/DWG adapter isPeriodic bilgisini taşır; geometry compiler periodic profili reddeder; precision testinde periodic giriş boş/fail-closed. De Boor knot oracle'ı sentetik non-periodic degree 2–5 profilleridir; AutoCAD periodic fixture yok. | AÇIK |
| HATCH runtime remesh/topology | HATCH curved-boundary sidecar testi çizgi XY buffer'ını ölçer; runtime fill remesh/topology testi veya runtime remesh yolu bulunmadı. Fill TRIANGLES statik compiler kapsamındadır. | AÇIK |
| Bounded spatial partition/on-demand chunk | Scheduler cache modülü ve unit'i var; host-shell scheduler'ı çağırmıyor. Host manifestteki chunk listesi üzerinde concurrency 6 fetch döngüsü çalıştırıyor. | AÇIK |
| Fill/glyph/chunk-boundary/kalan composite | Seçilmiş chord, encoded endpoint, glyph endpoint ve source-seam terimleri için dar testler var; fill TRIANGLES, glyph outline/refinement ve bütün çapraz chunk/fill etkileşimlerinin ortak muhasebesi yok. | AÇIK |
| Shader PATH_DISTANCE | Scene worker PATH_DISTANCE bölümünü decode/transfer ediyor; cad-v2-renderer içinde PATH_DISTANCE tüketicisi yok. | AÇIK |
| Geometri/zoom/pan/DPR/device rendered-error | ARC ve ELLIPSE için seçilmiş Chromium profilleri iki yönlü ölçüldü; bu belgeye eklenen profil ELLIPSE DPR2/125%/iki pan adımıdır. Genel geometri ve device matrisi tam değildir. | PARTIAL / AÇIK |
| Aynı-kaynak AutoCAD görüntü/ölçü oracle'ı | F07 browser raster testlerinde eş kaynak AutoCAD görüntüsü/ölçüsüyle eşleştirilmiş oracle yok. | AÇIK / NOT_RUN |

Plan 14/19 (%74), 5/19 (%26) paket açık; F07 IN_PROGRESS.
Güncel runtime raster profili envanteri: ARC — DPR1 fit/80%/125%, panned DPR1 125%/195%, ayrıca DPR2 fit ve +48,+24 pan; ELLIPSE — DPR1 fit, DPR2 fit kamera sonrası +48,+24 pan, DPR2 125% ve iki pan adımı. Önceki DPR2 pan eksikliği notları bu ek ölçümden önceki checkpoint'leri anlatır. Farklı geometri ve device bağlamlarının bütünü ölçülmediğinden genel kabul PARTIAL/AÇIK'tır.
## 2026-09-25 — ELLIPSE DPR2 80% panlı kamera raster ölçümü

| Profil | Kamera ve pan | Raster/oracle | Refined rendered-error |
|---|---|---|---|
| ELLIPSE, Chromium WebGL, DPR2, 80% | 125% panlı kamera (748,390,k=7.6) → merkezden 100% → 80%; son kamera (709.12,370.56,k=4.864), taşınmış net ofset (+69.12,+34.56) CSS px | 1280×672 CSS / 2560×1344 device; 4097 analitik kaynak örneği, 620 seçili piksel; u=0.2055921053 world/CSS px | render→kaynak 0.5127801495 CSS px; kaynak→render 0.3767122232 CSS px; ≤1.25 |

80% profili, mevcut +108,+54 panın merkez-ankorlu zoom ile ölçeklenmesini test eder; 80% noktasında ayrıca pointer drag uygulanmadı. 80% UI durumu, kamera ölçeği/ötelemesi, değişmiş canvas frame'i ve son idle refinement doğrulandı. Worker target listesi altı öğe [0.75,0.25] tekrarıdır; 6 yanıt, quiet ve maxLineVertexCount=40.

Hedefli Chromium 1/1, dosya Chromium 6/6, üç ilgili unit ve runtime typecheck PASS; git diff --check PASS. Yalnız test/helper değişti, C: yeni cache ve D: yeni/korunmuş test çıktıları kullanıldı; v27/schema v1 ve iki worker hash'i sabit.

Güncel F07 kapıları hâlâ açıktır: periodic SPLINE AutoCAD fixture/knot oracle; HATCH runtime remesh/topology; host'a bağlı bounded partition/on-demand fetch; fill/glyph/chunk-boundary kalan composite; shader PATH_DISTANCE; tam rendered-error geometry/zoom/pan/DPR/device matrisi (PARTIAL); aynı-kaynak AutoCAD görsel/ölçü oracle'ı (NOT_RUN). Nested BULGE seam/same-chord alt-oracle'ları zaten var ve bu turda yinelenmedi. Plan 14/19 (%74), 5/19 (%26) açık; F07 IN_PROGRESS.
## 2026-09-25 — DPR2 ELLIPSE 156% rendered-error ölçümü

| Profil | Kamera | Raster ve kaynak oracle'ı | Sonuç |
|---|---|---|---|
| ELLIPSE, Chromium WebGL, DPR2, 156% | 80% taşınmış kameradan merkez-ankorlu zoom-in: 100→125→156%; D3 (775,403.5,k=9.5); net ofset (+135,+67.5) CSS px | 1280×672 CSS / 2560×1344 device; u=0.1052631579 world/CSS px; 4097 parametrik kaynak örneği; 1190 piksel | render→kaynak 0.6348085456 CSS px; kaynak→render 0.4734169813 CSS px; her ikisi ≤1.25 |

Kaynak quarter-ellipse raster karede tamamen görünür kaldı; crop uygulanmadı. 156%’te ayrıca pointer drag yapılmadı; mevcut pan merkezi zoom ile taşındı. Worker hedefleri toplam [0.75,0.25]×4, 8 yanıt, quiet, maxLineVertexCount=42.

Hedefli browser 1/1, viewport Chromium dosyası 6/6, üç ilgili unit ve runtime typecheck PASS; diff-check PASS. Test/helper dışında prod kodu değişmedi; revision v27, schema v1, scene/DWG worker hash'leri sabit. Çıktı ve config D:\codex-cad-v2-f07-ellipse-dpr2-156-pan-20260925 altında; yeni C: cache ayrı ve korunuyor.

Yedi F07 kapısının audit durumu değişmedi: periodic SPLINE, HATCH remesh/topology, host bounded/on-demand fetch, kalan fill/glyph/chunk composite ve shader PATH_DISTANCE AÇIK; genel rendered-error matrisi PARTIAL/AÇIK; same-source AutoCAD görsel/ölçü AÇIK/NOT_RUN. Nested BULGE seçili same-chord ve iki seam yönünde zaten bağımsız ölçülmüş olduğundan yinelenmedi. F07 IN_PROGRESS, plan 14/19 (%74), 5/19 (%26) açık.

## 2026-09-25 — DPR1 ELLIPSE 156% + gerçek pan rendered-error kaydı

| Profil | Kamera | Bağımsız kaynak/raster oracle'ı | Sonuç |
|---|---|---|---|
| ELLIPSE, gerçek CAD V2 host/worker/WebGL, Chromium DPR1 | Fit (640,336,k=6.08); ardışık UI 125%→156%; son yüksek-zoom pan öncesi (640,336,k=9.5); gerçek pointer +48,+24 sonrası (688,360,k=9.5) | 1280×672 CSS/device px; u=0.1052631579 world/CSS px; tam görünür quarter-ellipse; 4097 parametrik analitik kaynak örneği ve 592 render pikseli | render→kaynak 0.9868434156 CSS px; kaynak→render 0.7490349703 CSS px; iki yön ≤1.25. Refinement [0.75,0.25]×3, 6/6 yanıt, quiet, max 42 line vertex |

DPR1 fit kabulü korunarak yeni 156% gerçek-pan profili eklendi. Her zoom seviyesinde son idle target 0.25 CSS px'e ulaşmadan sonraki adıma geçilmedi; hedef sayısı ve yanıt sayısı eşitlendi. Hedefli browser 1/1 (44.5 sn), viewport dosyası 6/6 (2.3 dk), üç ilgili unit, runtime TypeScript ve diff-check PASS. Yalnız test/helper değişti; compiler/cache v27, schema v1 ve iki worker hash'i değişmedi. Test çıktıları/config'i `D:\codex-cad-v2-f07-ellipse-dpr1-156-pan-20260925`; iki benzersiz C: cache kullanıldı.

| F07 kapısı yeniden denetlendi | Güncel kod/test kanıtı | Durum |
|---|---|---|
| Periodic SPLINE AutoCAD fixture/desteği ve knot multiplicity oracle'ı | Compiler periodic input'u reddediyor; bağımsız De Boor profilleri non-periodic sentetik spline'lar. AutoCAD periodic fixture/evaluator yok. | AÇIK |
| HATCH runtime remesh/topology | Worker curve-span refinement boundary line'ları güncelliyor; fill üçgenleri runtime topology remesh kabulünden geçmiyor. | AÇIK |
| Bounded spatial partition/on-demand chunk | Scheduler unit'leri mevcut ama host'a bağlanmamış; host manifest chunk'larını concurrency 6 ile fetch ediyor. | AÇIK |
| Kalan fill/glyph/chunk-boundary composite | Seçilmiş endpoint/seam/fill-boundary terimleri var; tam birleşik hata bütçesi kanıtı yok. | AÇIK |
| Shader `PATH_DISTANCE` tüketimi | Worker alanı açıp taşıyor; renderer okumuyor, mevcut dash rasterı tessellated XY'yi ölçüyor. | AÇIK |
| Runtime-refined rendered-error matrisi | ARC ve ELLIPSE için seçili DPR1/2, zoom/pan oracle'ları var; geometri ve device matrisi genel değil. | PARTIAL / AÇIK |
| Same-source AutoCAD görsel/ölçü oracle'ı | Eşleştirilmiş AutoCAD raster/ROI/ölçü kabul testi yok. | AÇIK / NOT_RUN |

Bu profil yalnızca sentetik ELLIPSE, tek canvas/Chromium ve seçili DPR1 kameraları için PASS'tır. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) paket açık.


### F07 — Rational SPLINE runtime raster ölçümü, 2026-09-25

| İzlenen kabul | Bu turdaki kanıt | Sonuç |
|---|---|---|
| Host→worker refinement→WebGL içinde SPLINE source metadata'sının korunması | Sentetik clamped single-span cubic rational SPLINE; binary chunk metadata'sı kontrol noktası ve ağırlıklarla round-trip doğrulandı. | Bu dar sentetik profil PASS |
| Worker refinement sonrası çizilen eğrinin kaynak geometrisine yakınlığı | 1280×672 DPR1 fit, D3 (640,336,k=6.08); iki yönlü raster/source oracle, 4097 bağımsız rasyonel Bernstein örneği ve 677 raster pikseli. | PASS: 0.8164272623 / 0.7307145792 CSS px; sınır 1.25 |
| Refinement yanıtının gerçekten uygulanması | Hedef dizisi [0.75,0.25], 2/2 yanıt, quiet snapshot ve 96 maksimum line vertex. | PASS |
| Suite ve tür denetimi | Hedefli Chromium 1/1; tam viewport Chromium 7/7; curve-refinement, precision-refinement, worker-refinement-browser; runtime TypeScript ve diff-check. | PASS |

Bu kanıt periodic AutoCAD SPLINE, knot multiplicity davranışı veya farklı device/zoom matrisi anlamına gelmez. Periodic SPLINE AutoCAD fixture/knot oracle, HATCH runtime remesh, bounded host chunk fetch, kalan fill/glyph/chunk composite muhasebesi, shader PATH_DISTANCE ve same-source AutoCAD görsel/ölçü kapıları AÇIK; genel rendered-error matrisi PARTIAL/AÇIK. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) paket açık.


### F07 — Rational SPLINE DPR2 pan kanıtı, 2026-09-25

| Kabul bağlantısı | Ölçüm | Sonuç |
|---|---|---|
| Gerçek pan ve D3 kamera doğrulaması | DPR2 fit (640,336,k=6.08) → gerçek +48,+24 CSS px pan → (688,360,k=6.08). Drawing buffer 2560×1344. | PASS |
| Kaynak spline → runtime raster iki yönlü envelope | 4097 bağımsız rational Bernstein örneği, 1348 raster pikseli; renderer source konumu gerçek D3 camera ile projekte edildi. | 0.4829010756 / 0.4292518924 CSS px; ≤1.25 |
| Refinement'ın pan sonrasında settled olması | [0.75,0.25] target dizisi; 2/2 cevap; pan öncesi/sonrası state quiet; max line vertex 96. | PASS |
| Değişiklik sonrası önceki DPR1 fit profilinin korunması | Kamera-aware oracle ile DPR1 fit aynı iki yönlü hatayı verdi: 0.8164272623 / 0.7307145792 CSS px. | PASS |
| Test ve tip denetimleri | Target Chromium 1/1; tam viewport Chromium 8/8; curve-refinement, precision-refinement, worker-refinement-browser; runtime TypeScript ve diff-check. | PASS |

Periodic SPLINE AutoCAD fixture/destek ve knot multiplicity oracle AÇIK; bu test non-periodic sentetik single-span cubic'dir. HATCH runtime remesh/topology AÇIK; host bounded spatial partition/on-demand chunk AÇIK; fill/glyph/chunk-boundary kalan composite AÇIK; shader PATH_DISTANCE AÇIK; geniş geometri/zoom/pan/DPR/device rendered-error matrisi PARTIAL/AÇIK; same-source AutoCAD görsel/ölçü AÇIK/NOT_RUN. Bu DPR2 pan profili genel kapıyı kapatmaz. F07 IN_PROGRESS, 14/19 (%74) tamam, 5/19 (%26) açık.


### F07 kanıt izi — rational SPLINE DPR2 125% zoom/pan (2026-09-25)

`tests/document-studio/cad-v2-layout-viewport.spec.ts` içindeki gerçek host→worker→refined line buffer→WebGL profili, DPR2 rasyonel Bernstein raster oracle'ını fit-pan, centered 125% zoom ve ikinci gerçek pan boyunca yürütür. D3 kamera sırası (640,336,6.08) → (688,360,6.08) → (700,366,7.6) → (748,390,7.6); son net pan ofseti (+108,+54) CSS px. 1280×672 CSS / 2560×1344 device; 4097 bağımsız source sample, 1702 raster pixel; iki yönlü hata 0.4689849332 / 0.4743416490 CSS px. Worker hedefleri `[0.75,0.25,0.75,0.25]`, 4/4 reply, quiet, max 110 line vertex. Bu yalnız tek sentetik, non-periodic rational SPLINE kamera profili için dar kabul sonucudur.

Seçilmiş Chromium raster kümesi 5/5 ve tam viewport Chromium dosyası 8/8; ilgili precision/curve/worker-browser testleri ve runtime typecheck geçti. `git diff --check` temiz. Test-only; compiler/cache v27, DV2SCN01 v1 ve iki worker SHA-256 sabit. Ayrı koşu konfigürasyonları, loglar ve sonuçlar yeni D: köklerinde tutuldu; C: Next cache'leri de ayrıdır. Düzeltilmiş suite konfigürasyonu `DOK_LOCAL_DATA_DIR` değerini per-run `TEMP` altına yerleştirdi. İlk suite config güvenli path korumasına takıldı; başarısız koşu ekleri korunmuş.

| F07 kapısı | Kod/test kanıtı | Durum |
|---|---|---|
| Periodic SPLINE AutoCAD fixture/desteği ve knot oracle | Mevcut periodic girdi fail-closed; De Boor multiplicity testleri sentetik non-periodic spline ile sınırlı. | **AÇIK** |
| HATCH runtime remesh/topology | Runtime curve boundary refinement fill triangle/topology remesh değildir. | **AÇIK** |
| Bounded spatial partition ve on-demand chunk | Scheduler host loading'e bağlanmamış; host manifest chunk'larını concurrency 6 ile getiriyor. | **AÇIK** |
| Fill/glyph/chunk-boundary ve kalan composite hesabı | Dar terimler mevcut; tam birleşik fill/glyph/chunk toplam kanıtı yok. | **AÇIK** |
| Shader `PATH_DISTANCE` | Renderer worker alanını tüketmiyor; dash rasterı tessellated XY kullanıyor. | **AÇIK** |
| Geometri/zoom/pan/DPR/device rendered-error | ARC/ELLIPSE/SPLINE için seçili profil var; tüm geometri ve cihaz matrisi tamam değil. | **PARTIAL / AÇIK** |
| Aynı-kaynak AutoCAD görsel/ölçü oracle'ı | Paired AutoCAD görüntü/ROI/measurement kabulü yok. | **AÇIK / NOT_RUN** |

F07 **IN_PROGRESS** kalır; plan ilerlemesi **14/19 (%74)**, açık paketler **5/19 (%26)**.


## F07 izlenebilirlik — Rational SPLINE DPR2 156% pan raster oracle

| Ölçülen kapsam | Kaynak ve oracle | Sonuç |
|---|---|---|
| DPR2 live host→worker→refined line buffer→WebGL rational SPLINE | `tests/document-studio/cad-v2-layout-viewport.spec.ts`; gerçek D3 camera; independent rational Bernstein evaluator; 4097 kaynak örneği ve screenshot device-pixel merkezleri | **PASS —** 156% centered zoom `(775,403.5,k=9.5)`, ardından gerçek `(+48,+24)` CSS pan `(823,427.5,k=9.5)`; 2124 raster piksel; 0.4907102356 px render→source ve 0.4090727048 px source→render, ≤1.25. |
| Settled refinement ve stale yanıt koruması | Aynı browser testinde pre-zoom target-count baseline; yeni hedef/yanıt, son 0.25 hedef ve sakin pending state | **PASS —** `[0.75,0.25,0.75,0.25,0.75,0.25]`, 6/6 reply, max line vertex 110. Önceki 125% cevabını yeni zoom cevabı sayan helper yarışı giderildi. |
| Doğrulama | Targeted Chromium; tam viewport browser dosyası; üç refinement unit dosyası; runtime TS; diff check | **PASS —** targeted 1/1; viewport 8/8; `precision-refinement`, `curve-refinement`, `worker-refinement-browser`; `tsc --noEmit -p tsconfig.next.json --incremental false`; temiz `git diff --check`. |

Test/helper-only değişiklik: compiler/cache v27, DV2SCN01 v1 ve scene/DWG worker hash'leri sabit. Loglar yeni `D:\codex-cad-v2-f07-spline-dpr2-156-pan-retry-20260925` ve `D:\codex-cad-v2-f07-spline-dpr2-156-pan-full-20260925` köklerinde tutuldu; önceki pan195 kökleri ve repo D-backed `test-output/` silinmedi.

| F07 kapısı | Durum |
|---|---|
| Periodic SPLINE AutoCAD fixture/desteği/knot oracle | **AÇIK** — mevcut multiplicity evaluator sentetik non-periodic profillerle sınırlı. |
| HATCH runtime remesh/topology | **AÇIK** |
| Bounded spatial partition ve on-demand chunk | **AÇIK** — scheduler host'a bağlı değil, host manifest chunk'larını concurrency 6 ile getiriyor. |
| Fill/glyph/chunk-boundary ve kalan composite | **AÇIK** |
| Shader `PATH_DISTANCE` tüketimi | **AÇIK** — renderer alanı tüketmiyor. |
| Genel geometri/zoom/pan/DPR/device rendered-error | **PARTIAL / AÇIK** |
| Same-source AutoCAD görsel/ölçü oracle'ı | **AÇIK / NOT_RUN** |

Nested/transformed BULGE same-chord ve iki seam-yönü oracle bu alt aşamada yeniden çalıştırılmadı. F07 **IN_PROGRESS**; plan **14/19 (%74)**, **5/19 (%26)** paket açık.


## F07 SPLINE DPR2 195% acceptance (2026-09-25)

| İzlenen bağ | Kaynak | Sonuç |
|---|---|---|
| 195% DPR2 kamera ve raster | tests/document-studio/cad-v2-layout-viewport.spec.ts; sentetik non-periodic rational cubic SPLINE; Chromium/WebGL gerçek device raster | PASS — D3 (868.75,450.375,k=11.875), viewport 1280×672 CSS, buffer 2560×1344, u=0.08421052631578949; 4097 rational Bernstein kaynak örneği / 2704 raster pikseli; render→source 0.5413191518506184, source→render 0.4506939094329671 CSS px (≤1.25). |
| Settled worker refinement | Aynı browser akışındaki hedef/yanıt sayacı, pending kuyruğu ve line buffer | PASS — hedefler [0.75,0.25]×4, 8 yanıt, son hedef 0.25 CSS px, pending 0, maxLineVertexCount 114. |
| Sentetik session heartbeat izolasyonu | F07 SPLINE ve ELLIPSE fixture route'ları | PASS — mock heartbeat 200 döner; gerçek API 410 kaynaklı prepare/fit yenilemesi engellenir. ELLIPSE zoom assert'leri ölçek ve yeni refinement cevabını denetler. |
| Doğrulama | Layout viewport Chromium; npm run check:cad-v2:unit; runtime TypeScript; git diff --check | PASS — Chromium 8/8 (190 s); unit exit 0; runtime tsc --noEmit -p tsconfig.next.json --incremental false exit 0; diff check temiz. |

Koşu log/config/results kökü: D:\codex-cad-v2-f07-spline-dpr2-195-zoom-final2-20260925. Test/helper-only değişiklik; compiler/cache v27, DV2SCN01 v1 ve preserved scene/DWG worker SHA-256 değerleri sabit. Kapılar: periodic AutoCAD SPLINE/knot, HATCH remesh/topology, bounded/on-demand chunk, kalan fill/glyph/chunk composite ve shader PATH_DISTANCE AÇIK; genel geometri/zoom/pan/DPR/device rendered-error PARTIAL / AÇIK; same-source AutoCAD AÇIK / NOT_RUN. F07 IN_PROGRESS, 14/19 (%74), 5/19 (%26) paket açık.


## F07 ELLIPSE DPR2 195% acceptance (2026-09-25)

| İzlenen bağ | Kaynak | Sonuç |
|---|---|---|
| Gerçek zoom, pan ve DPR2 raster | tests/document-studio/cad-v2-layout-viewport.spec.ts; parametrik ELLIPSE kaynak oracle'ı | PASS — D3 156% kamerası (775,403.5,k=9.5), pan (-10,-5), 195% kamera (796.25,414.125,k=11.875); net merkez pan (+156.25,+78.125) CSS px; 1280×672 CSS / 2560×1344 device; tam çeyrek ellipse görünür. |
| Bağımsız raster/source envelope | 4097 analitik örnek / 1476 DPR2 WebGL pikseli | PASS — render→source 0.6301951256486582, source→render 0.4610262730380537 CSS px; iki yön ≤1.25. |
| Settled refinement | Browser worker mesajları, line draw vertex sayacı ve quiet snapshot | PASS — 14 yanıt, son hedef 0.25 CSS px, pending 0, maxLineVertexCount 46. |
| Doğrulama | Targeted ve tam layout-viewport Chromium; precision/curve/worker refinement unit; runtime TS; diff check | PASS — 1/1, 8/8, ilgili üç unit ve typecheck geçti. |

Bu yalnız test/helper genişlemesidir; compiler/cache v27, binary schema v1 ve preserved worker hash'leri sabittir. Loglar D:\codex-cad-v2-f07-ellipse-dpr2-195-target-20260925 ve D:\codex-cad-v2-f07-ellipse-dpr2-195-full-20260925 altında korundu. Periodic AutoCAD SPLINE/knot, HATCH runtime topology, bounded/on-demand chunk, kalan fill/glyph/chunk composite ve shader PATH_DISTANCE AÇIK; genellenmiş rendered-error PARTIAL / AÇIK; same-source AutoCAD AÇIK / NOT_RUN. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) açık.

## 2026-09-25 — F07 DPR1 195% pan kanıt izi

Test: `tests/document-studio/cad-v2-layout-viewport.spec.ts`, DPR1 ELLIPSE kabul testi, zoom/pan bölümü ve raster assertion’ları (195% adımı yaklaşık satır 1540–1618). Fixture semimajor 40 / semiminor 24 çeyrek elipsidir. D3 kamera fit `(640,336,6.08)` → 156% pan `(688,360,9.5)` → 195% zoom `(700,366,11.875)` → son pan `(690,361,11.875)`. Raster oracle worker subdivision’ını kullanmaz; 4097 eşit parametrik analitik örnek ile PNG’den seçilmiş WebGL piksel merkezlerini ölçer. Son hata çift yönü `(1.0146941342, 0.7496648734)` CSS px; örnek sayısı 4097, raster sayısı 747.

Hedefli ve tam Chromium config/log/Playwright sonuçları `D:\codex-cad-v2-f07-ellipse-dpr1-195-pan-retry-20260925` altındadır: `playwright.target.config.ts`, `target.stdout.log`, `playwright.full.config.ts`, `full.stdout.log`, ve `results-target-20260925` / `results-full-20260925`. İlk koşunun timeout screenshot/video/context’i ayrıca `D:\codex-cad-v2-f07-ellipse-dpr1-195-pan-20260925\results-target-20260925` altında bırakıldı. Her koşu kendine ait C: Next cache ve D: TEMP/data dizini kullandı; test portları 43903–43906 artık dinlemiyor.

Doğrulama izi: hedefli Chromium 1/1; tam viewport Chromium 8/8; `npm run check:cad-v2:unit` 0; kamera etkileşimi, gerçek sahne render, worker refinement browser, host lifecycle ve UI quality alt testleri PASS; runtime `tsc --noEmit -p tsconfig.next.json --incremental false` PASS. `ui-subchecks.stdout.log` ve `runtime-tsc.stdout.log` aynı D: kökünde. Revision/cache kimliği `cad-v2-compiler-2026.09-v27`, schema v1; worker public bundle hash’leri bu test-only aşamada değişmedi.

Unit paketinin kaynak koddan gelen yazma yan etkisi: P05 `affine-ocs-audit.json`, P05 `bounds-provenance.json`, P06 `entity-instance-parity.json`, P06 `block-expansion-budget.json` dosyalarına testler çıktı yazdı (04:12:48–04:12:55, 2026-09-25); çıktıların tamamı ve unit logu korunuyor. Gelecek unit tekrarından önce bu test yan etkilerini izole etme gereği vardır.
### İzlenebilirlik düzeltmesi — hedef koşusu log dosyası

Başarılı hedefli Playwright koşusunun stdout’u D: dosyasına tee edilmedi; bu nedenle üstte anılan `target.stdout.log` mevcut değildir. Hedef koşusunun `1 passed` sonucu `results-target-20260925/.last-run.json` içindeki `status: passed, failedTests: []` ile doğrulanır; aynı testin tam Chromium dosya koşusundaki ayrıntılı raster ölçümü `full.stdout.log` içinde tutulur. İlk başarısız koşunun video, screenshot ve error context’i ayrı ilk-deneme kökünde korunmuştur.
### Unit evidence yazma yan etkisi — önemli not

`npm run check:cad-v2:unit` sırasında testler çalışma ağacında zaten bulunan dört P05/P06 JSON evidence dosyasını doğrudan yeniden yazdı. Çalışma öncesi bu dört dosyanın byte kopyası/hash’i alınmadığından eski byte içerikleri bu oturumda geri yüklenemiyor; testlerin ürettiği güncel PASS çıktıları ve unit logu yerinde bırakıldı. Bu, test otomasyonunun repo içi evidence yazma yan etkisidir ve gelecek geniş unit koşusundan önce ayrıca izole edilmelidir.
## F07 ARC DPR2 195% pan — izlenebilirlik kanıtı (2026-09-25)

| İzlenen bağ | Kaynak | Sonuç |
|---|---|---|
| Runtime refinement → gerçek kamera | `tests/document-studio/cad-v2-layout-viewport.spec.ts` içindeki DPR2 ARC testi (başlangıç satırı 1147) | PASS — fit `(640,336,6.08)`; fit pan `(+48,+24)`; 125% → 156% → 195% merkez zoom; 195% seviyesinde ikinci gerçek pan `(+48,+24)`; son D3 `(781.75,406.875,11.875)`, fit-relative `(+141.75,+70.875)` CSS px. |
| Canvas ve görünür analitik kaynak | Chromium WebGL2 screenshot; DPR2; bağımsız tam analitik çeyrek çember ve viewport ile kırpılmış görünür kaynak açıları | PASS — 1280×672 CSS / 2560×1344 device; `u=0.08421052631578949`; görünür kaynak açısı `[0,1.0286029931]`; rasterda 1363 seçilmiş mavi piksel. |
| İki yönlü raster/source hata | Screenshot piksel merkezleri ↔ bağımsız analitik kaynak yay | PASS — render→kaynak `0.6559628023` CSS px; kaynak→render `0.4458264123` CSS px; ikisi de ≤1.25. |
| Refinement sakinliği | Worker mesaj sayacı, son hedef ve WebGL line draw vertex sayacı | PASS — `[0.75,0.25]×4`; 8/8 yanıt; son hedef 0.25 CSS px; pending 0; maksimum line vertex 46. |
| Doğrulama | Hedefli/full Playwright, üç refinement unit/browser-worker ve beş UI alt testi, runtime TS | PASS — hedefli 1/1; viewport Chromium 8/8 (3.5 dk); yedi ilgili script; `tsc --noEmit -p tsconfig.next.json --incremental false`; `git diff --check`. |

Hedefli config/stdout/sonuçları `D:\codex-cad-v2-f07-arc-dpr2-195-20260925\pw-target.config.ts`, `target.stdout.log`, `results-target`; tam dosya config/stdout/sonuçları `pw-full.config.ts`, `full.stdout.log`, `results-full` altındadır. Yedi script logu ve typecheck logu aynı D: kökte saklıdır. Her koşunun izole D: temp/data ve ayrı C: Next cache'i vardı; 43927/43928 portlarında listener kalmadı. Test-only değişiklik compiler/cache v27, scene schema v1 ve her iki worker hash'ini değiştirmedi.

Bu kayıt rendered-error matrisi kapsamını ARC/DPR2/195%/pan profilinde artırır, fakat genellenmiş geometri/zoom/pan/DPR/device kapısını **PARTIAL / AÇIK** bırakır. Periodic AutoCAD SPLINE/knot, HATCH runtime topology, bounded/on-demand chunk, fill/glyph/chunk composite, shader `PATH_DISTANCE` ve same-source AutoCAD oracle kapıları **AÇIK** (AutoCAD oracle **NOT_RUN**); F07 **IN_PROGRESS**, 14/19 (%74), 5/19 (%26) açık.
## F07 rational SPLINE DPR1 195% pan — izlenebilirlik (2026-09-25)

| İzlenen bağ | Kaynak | Sonuç |
|---|---|---|
| UI zoom ve gerçek kamera panı | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, DPR1 rational SPLINE oracle testi (başlangıç satırı 1747) | PASS — fit `(640,336,k=6.08)`; merkez zoom 125% → 156% → 195%; 195% zoomda gerçek `(+48,+24)` pan; son D3 `(688,360,k=11.875)`. |
| Bağımsız kaynak ve DPR1 raster | 4097 örnekli rational Bernstein evaluator; 1280×672 WebGL screenshot | PASS — source bounds `[284.25,98.75]..[1091.75,573.75]` viewport içinde; 1350 seçilmiş piksel. |
| Bidirectional rendered error | Screenshot piksel merkezleri ↔ bağımsız rasyonel kaynak yay | PASS — render→kaynak `0.9300776279` CSS px; kaynak→render `0.7905694150` CSS px; iki yön ≤1.25. |
| Worker settle ve aynı bucket pan | Request/reply instrumentation, `maxLineVertexCount`, pan öncesi/sonrası state | PASS — hedef `[0.75,0.25]×4`, 8/8 reply, son 0.25 CSS px, pending 0, max line vertex 114; aynı bucket pan ek hedef üretmedi. |
| Doğrulama | Targeted ve tam Chromium, CAD refinement testleri, beş UI subcheck, runtime TS | PASS — 1/1; viewport dosyası 8/8; üç ilgili unit/browser-worker ve beş UI script; runtime typecheck ve diff check. |

Kanıt dizini `D:\codex-cad-v2-f07-spline-dpr1-195-pan-20260925-v2`: `pw-target.config.ts`, `target.stdout.log`, `results-target`; `pw-full.config.ts`, `full.stdout.log`, `results-full`; ilgili yedi script logu ve `runtime-tsc.log`. Target/full ayrı C: Next cache ve D: geçici data kullandı; portlar 43929/43930 kapalı, hedef süreç yok. Test-only aşamada compiler/cache v27, schema v1 ve önceki iki worker hash'i korundu.

DPR1 rational SPLINE/195% pan örneği rendered-error matrisini genişletir; genel geometri/zoom/pan/DPR/device kapısı **PARTIAL / AÇIK** kalır. Periodic AutoCAD SPLINE/knot oracle, HATCH runtime remesh, bounded/on-demand chunks, fill/glyph/chunk composite, shader `PATH_DISTANCE`, same-source AutoCAD visual/measurement kapıları **AÇIK** (AutoCAD oracle **NOT_RUN**). F07 **IN_PROGRESS**, 14/19 (%74), 5/19 (%26) paket açık.
## F07 DPR2 ELLIPSE 195% sonrası pan — izlenebilirlik (2026-09-25)

| İzlenen bağ | Kaynak | Sonuç |
|---|---|---|
| 195% sonrası gerçek pan ve kamera | `tests/document-studio/cad-v2-layout-viewport.spec.ts` DPR2 ELLIPSE testi (başlangıç satırı 2285; ek assertion yaklaşık satır 2839) | PASS — 195% zoom öncesi kamera `(796.25,414.125,k=11.875)`; gerçek `(-10,-5)` pan sonrası `(786.25,409.125,k=11.875)`; fit-relative offset `(+146.25,+73.125)` CSS px. |
| Tam görünür parametrik kaynak | ELLIPSE semimajor/semiminor projeksiyonu ve DPR2 viewport | PASS — 1280×672 CSS / 2560×1344 device; `u=0.0842105263`; kaynak çeyrek yay bounds'ı viewport içinde; kaynak açısı `[0,π/2]`. |
| Bağımsız raster/source oracle | 4097 parametrik analitik örnek ↔ 1476 WebGL pikseli | PASS — render→source `0.6301951256` CSS px; source→render `0.4610262730` CSS px; her ikisi ≤1.25. |
| Runtime refinement quiet | Worker hedef/yanıt sayaçları ve line draw vertex sayacı | PASS — `[0.75,0.25]×7`, 14/14 yanıt, son hedef 0.25 CSS px, pending 0, maxLineVertexCount 46; 195% sonrası pan bu state'i değiştirmedi. |
| Doğrulama | Hedefli/tam Chromium, ilgili unit/browser-worker ve beş UI alt testi, runtime TS | PASS — 1/1; tam viewport 8/8; `tsc --noEmit -p tsconfig.next.json --incremental false`; `git diff --check`. |

Hedefli ve tam koşu kanıtı `D:\codex-cad-v2-f07-ellipse-dpr2-195-postpan-20260925` içindedir (`target.stdout.log`, `full.stdout.log`, Playwright config/sonuçları, yedi script logu ve typecheck logu). Her koşu benzersiz C: cache ve ayrı D: temp/data kullandı; 43931/43932 listener'ı ve ilgili test process'i kalmadı. Production runtime/worker değişmedi; revision v27, schema v1 ve iki worker SHA-256 sabit.

Bu ölçüm DPR2 ELLIPSE/195% pan profilini genişletir; rendered-error matrisi genel olarak **PARTIAL / AÇIK** kalır. Periodic AutoCAD SPLINE/knot, HATCH topology, bounded/on-demand chunks, fill/glyph/chunk composite, shader `PATH_DISTANCE` ve same-source AutoCAD oracle açık; sonuncusu **NOT_RUN**. F07 **IN_PROGRESS**, 14/19 (%74), 5/19 (%26) açık.
## F07 DPR2 SPLINE 195% sonrası ek pan — izlenebilirlik (2026-09-25)

| İzlenen bağ | Kanıt | Sonuç |
|---|---|---|
| Test kaynağı ve gerçek etkileşim | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, `runtime-refined SPLINE pan raster error is bounded at DPR2` | PASS — 195% yakınlaştırma sonrasında gerçek `(-10,-5)` CSS px pan; kamera `(868.75,450.375,k=11.875)` → `(858.75,445.375,k=11.875)`. |
| DPR2 raster bağlamı ve görünür kaynak | 1280×672 CSS, 2560×1344 device; `u=0.0842105263` | PASS — 4097 rational Bernstein örneğinin bounds'ı `[455,184.125]..[1262.5,659.125]`, viewport içinde. |
| Bağımsız raster/source oracle | 4097 kaynak örneği ↔ 2704 seçilmiş WebGL pikseli | PASS — render→source `0.5413191519` CSS px; source→render `0.4506939094` CSS px; ikisi `≤1.25`. |
| Runtime refinement | target/reply ve line-vertex enstrümantasyonu | PASS — `[0.75,0.25]×4`, 8/8 reply, son hedef 0.25 CSS px, pending 0, maksimum 114 vertex; pan state'i yenilemedi. |
| Doğrulamalar | Hedef/tam Chromium, 7 odaklı unit/UI testi, runtime TypeScript | PASS — 1/1, viewport 8/8, focused 7/7, `tsc --noEmit ...`, `git diff --check`. |

Kanıt kökü `D:\codex-cad-v2-f07-spline-dpr2-195-postpan-20260925`: `target.stdout.log`, `full.stdout.log`, `results-target`, `results-full`, yedi test logu, `runtime-tsc.log` ve iki Playwright config. Her browser koşusu ayrı C: Next cache ve D: temp/data kullandı; 43933/43934 listener'ı veya test süreci kalmadı.

Kapı özeti: periodic AutoCAD SPLINE/knot, HATCH remesh/topology, bounded/on-demand chunk, fill/glyph/chunk composite, shader `PATH_DISTANCE` **AÇIK**; genellenmiş rendered-error matrisi **PARTIAL / AÇIK**; same-source AutoCAD visual/measurement **AÇIK / NOT_RUN**. F07 **IN_PROGRESS**; 14/19 (%74), 5/19 (%26) paket açık. Runtime/compiler/cache v27, pipeline `fidelity-v3-p07`, schema v1 ve iki worker hash'i değişmedi.
## F07 DPR2 SPLINE 80% zoom + pan — izlenebilirlik (2026-09-25)

| İzlenen bağ | Kanıt | Sonuç |
|---|---|---|
| UI zoom-out ve gerçek pan | `tests/document-studio/cad-v2-layout-viewport.spec.ts`, DPR2 SPLINE raster testi | PASS — 195%’ten 156/125/100/80% adımları; 80% gerçek `(-10,-5)` pan; kamera `(729.6,380.8,k=4.864)` → `(719.6,375.8,k=4.864)`. |
| DPR2 viewport ve kaynak görünürlüğü | 1280×672 CSS, 2560×1344 device; bağımsız tam SPLINE | PASS — `u=0.2055921053`; 4097 kaynak örneğinin bounds `[554.224,268.792]..[884.976,463.352]` viewport içinde. |
| Rasyonel kaynak/raster oracle | 4097 Bernstein örneği ↔ 1112 WebGL pikseli | PASS — render→source `0.4476090077` CSS px; source→render `0.3641466608` CSS px; ikisi `≤1.25`. |
| Refinement idle ve aynı bucket panı | Worker target/reply ve line vertex enstrümantasyonu | PASS — `[0.75,0.25]×5`, 10/10 reply, son hedef 0.25 CSS px, pending 0, maxLineVertexCount 114; 80% pan sonrası state aynı. |
| Kontroller | Hedef/tam Chromium, odaklı CAD unit/UI, runtime TS | PASS — 1/1, viewport 8/8, focused 7/7, `tsc --noEmit -p tsconfig.next.json --incremental false`, `git diff --check`. |

Kanıt kökü `D:\codex-cad-v2-f07-spline-dpr2-80-pan-20260925`: `target.stdout.log`, `full.stdout.log`, `results-target`, `results-full`, yedi focused script logu, `runtime-tsc.log` ve koşu config'leri. Ayrı C: Next cache / D: temp-data kökleri kullanıldı; 43935/43936 listener'ı ve test Node süreci kalmadı.

Bu hücre rendered-error matrisini genişletir, genel kapıyı kapatmaz. Periodic AutoCAD SPLINE/knot, HATCH runtime remesh/topology, bounded/on-demand chunk, kalan fill/glyph/chunk composite, shader `PATH_DISTANCE` açık; same-source AutoCAD visual/measurement açık/not run. F07 `IN_PROGRESS`, 14/19 (%74), 5/19 (%26) paket açık. Compiler/cache v27, pipeline `fidelity-v3-p07`, schema v1 ve iki worker hash'i değişmedi.
## 2026-09-25 — F07 DPR1 SPLINE 80% pan kanıt izi

| Kabul hücresi | Uygulama/test | Ölçüm | Sonuç |
|---|---|---|---|
| 195% pan sonrası düşük zoom DPR1 raster | tests/document-studio/cad-v2-layout-viewport.spec.ts, rational Bernstein kaynak oracle'ı | DPR1 1280×672; final kamera (649.6608,340.8304,k=4.864); 4097 kaynak örneği / 542 seçilmiş WebGL pikseli | render→source 0.7981910667 px; source→render 0.9082625171 px; eşik 1.25 px altında |
| Worker refinement sakinliği | Aynı Chromium senaryosu, zoom-out hedef geçmişi ve post-pan snapshot | 0.25 px son hedef; [0.75,0.25]×5; 10/10 yanıt; maxLineVertexCount=114; pending 0 | PASS |
| Tekrar doğrulama | Hedef Chromium; tam viewport Chromium; 2 refinement unit + 5 UI/worker test; runtime typecheck; diff check | 1/1; 8/8; 7/7; PASS; PASS | PASS |

Kanıt konumu: D:\codex-cad-v2-f07-spline-dpr1-80-pan-20260925 (target, full, focused, typecheck günlükleri; izole test artifact ve temp/data). Compiler/cache v27, pipeline p07, DV2SCN01 schema v1 ve worker hash'leri korundu. Test-only matris genişlemesi olduğundan runtime/compiler cache revision değişmedi.

Kapı denetimi: sentetik clamped spline knot birim testleri AutoCAD periodic fixture/runtime ve AutoCAD knot oracle'ı değildir; periodic/knot kapısı AÇIK. HATCH testleri statik mesh/topology ile sınırlı; runtime remesh AÇIK. Compiler bounded spatial partition üretmiyor ve host manifest chunk'larını eager yüklemeye devam ediyor; on-demand kapısı AÇIK. Static glyph ve fill nicemleme ölçümleri mevcut olsa da fill/glyph/chunk sınırı ve kalan bileşik hesap AÇIK. Renderer PATH_DISTANCE tüketmediğinden shader/dash kapısı AÇIK. Tarayıcı matrisi sentetik SwiftShader profilleriyle PARTIAL/AÇIK; native GPU/device ve AutoCAD eş-kaynak görüntü/ölçü oracle'ı NOT_RUN. F07 IN_PROGRESS; plan 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-25 — F07 DPR1 ELLIPSE 80% pan izlenebilirlik kaydı

| İz | Kanıt / sonuç |
|---|---|
| Test senaryosu | `tests/document-studio/cad-v2-layout-viewport.spec.ts:1468`; independent parametric ELLIPSE oracle senaryosu 80% zoom-out ve (-10,-5) CSS px panı kapsıyor. |
| Runtime/raster bağlamı | D3 camera `(650.48,341.24,4.864)`; CSS viewport ve DPR1 buffer `1280×672`; `u=0.2055921052631579` world/CSS px; 4097 analitik örnek / 299 WebGL pikseli. |
| İki yönlü ölçüm | Render→analitik kaynak maksimum `0.7860996134` CSS px; kaynak→render maksimum `0.8713208364` CSS px; eşik `1.25` CSS px. |
| Refinement | Hedef dizisi sonu 0.25 CSS px; 10 istek / 10 yanıt; `maxLineVertexCount=46`; post-pan 350 ms snapshot'ında ek yanıt yok, pending 0. |
| Tekrar doğrulama | Hedefli Chromium 1/1 (82.4 s); tam viewport Chromium 8/8 (275.5 s); odaklı unit/UI 7/7; runtime TS ve CRLF-aware diff check PASS. |
| Artifact ve çalışma ağacı | Başarılı log/artifact kökü `D:\codex-cad-v2-f07-ellipse-dpr1-80-pan-20260925`; C: Next cache'leri ayrı, D: temp/data izole. Başlangıç kurulumunda default `test-results` altına düşen başarısız upload artifact'i silinmeden korundu; sonraki koşular explicit D: `--output` kullandı. |
| Revision/cache | Compiler v27, pipeline p07, schema v1 sabit; public scene worker ve korunmuş conversion worker SHA-256 değerleri önceki checkpoint ile aynı. |

Kapılar: periodic AutoCAD SPLINE/knot **AÇIK**; HATCH runtime remesh/topology **AÇIK**; host bounded/on-demand chunks **AÇIK**; kalan fill/glyph/chunk-boundary composite accounting **AÇIK**; shader `PATH_DISTANCE` **AÇIK**; genel geometri/zoom/pan/DPR/device raster matrisi **PARTIAL / AÇIK**; same-source AutoCAD visual/measurement **AÇIK / NOT_RUN**. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) açık.


**Artifact notu:** İlk başarısız Playwright çağrısında PowerShell argüman aktarımı nedeniyle `--output` etkinleşmedi ve varsayılan repo `test-results` yoluna failure artifact yazıldı. Mevcut çıktı silinmedi/taşınmadı. Koşu öncesi aynı adlı artifact için hash/yedek alınmadığından, varsa önceki içeriğin korunup korunmadığı geriye dönük doğrulanamıyor. Bu başarısız deneme PASS sayımına dahil değildir.


## 2026-09-25 — F07 DPR1 ARC 80% pan izlenebilirlik kaydı

| Kabul izi | Uygulama ve sonuç |
|---|---|
| Test/oracle | `tests/document-studio/cad-v2-layout-viewport.spec.ts:704`; mevcut canlı zoom/stale-response testi, bağımsız analitik quarter-circle projeksiyonu ile DPR1 80% pan hücresi eklenerek genişletildi. |
| Kamera/raster | 80% zoom kamerası `(710.0416,371.0208,k=4.864)`; (+48,+24) CSS px pan sonrası `(758.0416,395.0208,k=4.864)`; viewport ve raster `1280×672`; `u=0.2055921052631579` world/CSS px. |
| Ölçüm | 383 seçilmiş WebGL pikseli; render→kaynak `0.8401740575` CSS px, kaynak→render `0.7087218739` CSS px; her iki yön `≤1.25` px. |
| Refinement | Son hedef 0.25 CSS px; son zoom-out profili `[0.75,0.25]`; pending yanıt 0; maksimum 46 line vertex. Pan sonrasında refinement snapshot'ı değişmedi. |
| Tekrar | Targeted Chromium 1/1; tam viewport Chromium 8/8; odaklı unit/UI 7/7; runtime TS ve diff check PASS. |
| Koşu izleri | Başarılı ve ilk başarısız hedef koşu çıktıları, tam suite, unit logları ve ayrı cache/temp konfigürasyonları `D:\codex-cad-v2-f07-arc-dpr1-80-pan-20260925` altında korundu. İlk assertion düzeltmesi runtime bug değildir; test zoom oranı çarpımına göre düzeltildi. |

Periyodik SPLINE/knot, HATCH runtime remesh, bounded/on-demand chunk, kalan fill/glyph/chunk composite, shader `PATH_DISTANCE`, genel raster matrisi ve same-source AutoCAD oracle kapıları açık/PARTIAL durumunu korur. F07 IN_PROGRESS; 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-25 — F07 DPR3 ELLIPSE cihaz-piksel izi

| İz | Kanıt / sonuç |
|---|---|
| Test ve oracle | tests/document-studio/cad-v2-layout-viewport.spec.ts:3545; yeni runtime-refined ELLIPSE kabul testi, bağımsız 4097 örnekli parametrik kaynak oracle'ı. |
| Cihaz ve renderer | DPR3; CSS viewport 1280×672; renderer canvas buffer 2560×1344 (2× cap); cihaz ölçekli screenshot 3840×2016. |
| Kamera / kaynak | Fit (640,336,k=6.08); gerçek (-10,-5) CSS px pan sonrası (630,331,k=6.08); u=0.16447368421052633 world/CSS px. |
| İki yönlü raster | 2198 seçilmiş WebGL pikseli; render→kaynak 0.7085877543 CSS px; kaynak→render 0.2589010743 CSS px; her ikisi ≤1.25 px. |
| Worker | Hedef geçmişi [0.75,0.25]; 2/2 cevap; son hedef 0.25 CSS px; aynı bucket pan sonrası yeni refinement yok; maxLineVertexCount=34. |
| Tekrar doğrulama | curve-refinement.test.ts PASS; precision-refinement.test.ts PASS; yeni Chromium senaryosu 1/1 PASS; runtime tsconfig.next.json typecheck PASS. Tam viewport dosyası bu turda çalıştırılmadı. |
| Artifact ve izolasyon | D: log/artifact kökü D:\codex-cad-v2-f07-dpr3-clamp-20260925; ayrı C: Next cache; uygulama fixture verisi izinli Temp yolunda saklandı; 43951 portu kapalı. İlk güvenli-yol kurulum hatasının dosyaları korunuyor. |
| Cache / ABI | Compiler v27, pipeline p07, schema v1, render ABI three172-cad2d-v1; scene worker SHA-256 1B6E80FD17A5A253DA166EDD685F8272E3193FBECD3A1C9307E81ED7EB18C280. |

Kapı sonucu: periodic AutoCAD SPLINE/knot AÇIK; HATCH runtime remesh/topology AÇIK; host bounded partition/on-demand chunk AÇIK; fill/glyph/chunk-boundary bileşik hesabı AÇIK; shader PATH_DISTANCE AÇIK; genel rendered-error matrisi PARTIAL/AÇIK; same-source AutoCAD visual/measurement AÇIK/NOT_RUN. Nested/transformed BULGE için mevcut dar oracle'lar bulunduğundan bu alt aşama olarak seçilmedi. F07 IN_PROGRESS, 14/19 (%74), 5/19 (%26) paket açık.


## 2026-09-25 — F07 DPR3 SPLINE ölçüm izi ve iç ilerleme metriği

İzlenen uçtan uca test: synthetic rational non-periodic SPLINE scene fixture → binary `CURVE_DATA`/`PATH_DISTANCE` fallback → host camera profile → `refine-curves` worker istek/yanıtları → Three line geometry → WebGL2 canvas screenshot → ayrı 4097 örnekli rational Bernstein ve raster nearest-distance hesabı. Test `tests/document-studio/cad-v2-layout-viewport.spec.ts:3655`; hedef 0.25 CSS px, son pan aynı bucket'ta no-op.

DPR/device kaydı birbirinden ayrıdır: 1280×672 CSS viewport, DPR3, 2560×1344 renderer buffer (2× cap), 3840×2016 device screenshot. 80% zoom `(k=4.864)` ve `(-10,-5)` CSS px pan `(x=630,y=331)` ile sonuçlandı. 4097 kaynak örneği / 3273 render pikseli için render→source `0.6668573448 px`, source→render `0.2322079741 px`. Worker `[0.75,0.25]×2`, 4/4 reply, pending 0, max line vertices 96.

Ölçüm ispat sınırı: kaynak AutoCAD-authored değildir; oracle testte sabitlenen rational Bernstein cubic kaynağından bağımsız değerlendirilir. Chromium config SwiftShader kullanır. Native GPU/cihaz veya AutoCAD same-source benzerliği çıkarımı yapılmaz.

F07 ilerleme raporu için planın altı ana gereksinim grubu üzerinden ortak tahmin kullanılır: 2 PASS + 4 PARTIAL; PARTIAL=0.5 ağırlıkla **(2 + 4×0.5)/6 ≈ %67 F07 iç ilerleme**. Yedi nihai kabul kapısının durumu ayrı tutulur ve F07 IN_PROGRESS kalır. Genel uygulama planı ayrıca 14/19 (%74), 5/19 açık paket durumundadır.

D: kanıtı: `D:\codex-cad-v2-f07-spline-dpr3-80-pan-20260925\playwright-run-002` ve `logs\playwright-run-002.log`; yanlış baseURL ile teste başlamayan ilk deneme `playwright-run-001` altında tutuldu. Ayrı Next cache `.next-f07-spline-dpr3-80-pan-20260925-retry`; test veri dizini silinmeden korundu.

## 2026-09-25 — PATH_DISTANCE → shader uçtan uca izi

Ölçülen zincir: canonical two-term DASHED LWPOLYLINE → full straight source segment pairs (31-unit path spans) → serialized `PATH_DISTANCE` F32 and `drawCommands[].dashStyle={24,16}` → worker unpack → renderer `lineDistance` vertex attribute → Three `LineDashedMaterial` shader → Chromium WebGL2 pixels. Tek chunk ile 6 chunk'ın 12 scalar endpoint değerleri aynı kaldı; shader-visible five-dash run'ları ve gap ölçümleri `[66–177],[275–420],[518–663],[762–907],[1005–1150]`, `[97,97,98,97]` px; screenshot hashes eşit. Bu profilin boşlukları kaynak XY'ye bake edilmemiştir.

Kanıt: `tests/cad-v2/f07-dash-render-scene.ts`, `tests/document-studio/cad-v2-layout-viewport.spec.ts` içindeki `compiler-produced DASHED WebGL output is invariant to chunk partition` ve `tests/cad-v2/linetype-phase.test.ts` metadata fallback kontrolleri. Son hedef koşu 1/1 Chromium PASS; görüntüler/log `D:\codex-cad-v2-f07-path-distance-line-shader-20260925\playwright-run-002` ve `logs\playwright-run-002.log` altında. Compiler v28 / pipeline p08 / render ABI v2; schema v1. Diğer pattern tipleri CPU fallback olduğundan nihai shader kapısı PARTIAL/AÇIK kalır.


## 2026-09-25 — Periodic SPLINE DXF alan izi

İz zinciri: DXF pair reader → group-5 handle → fields 70/71/72/73/40/41/10/20/30 → dxf-adapter canonical SPLINE → geometry validator/scene diagnostic. tests/cad-v2/dxf-periodic-spline.test.ts sentetik profilleri ASCII ve AcDbDxfFiler binary DXF üzerinden okur; flag, count, knot, control net, periodic domain kapanışı, continuity ve multiplicity 2/3 eşleşmesini sınar. Degree 0 canonical kayıtta tutulur ve tessellator tarafından reddedilir.

Fixture AutoCAD üretimi değildir. 90 s COM denemesi periodic DWG/DXF/property dump üretmedi; AutoCAD parity NOT_RUN, periodic runtime support fail-closed/AÇIK. D:\codex-cad-v2-f07-periodic-spline-acad-20260925 altında test logları ve Chromium run-003 korunur. Chromium 1/1 bu ağacın sentetik DPR1 ARC runtime regression ölçümüdür; periodic SPLINE raster testi değildir.

Güncel kimlik v29 / fidelity-v3-p08 / ABI v2 / schema v1. F07 iç metrik yaklaşık %67; genel plan 14/19=%74. Bunlar farklı paydalardır.


## 2026-09-25 — PATH_DISTANCE shader test izi

Compiler DASHED line path → PATH_DISTANCE F32 → renderer lineDistance attribute → Three LineDashedMaterial → WebGL framebuffer. Güncel testte source path 184 unit, source edge 31, dash/gap 24/16; scalar dizisi [0,31,31,62,62,93,93,124,124,155,155,184]. Tek chunk ve 6 chunk beş aynı raster run'ı ve 97/97/98/97 px gap üretti; iki framebuffer SHA-256 98878ef260eb93722877a39be4a72bc188dbbbfda24b36f83d1680980941e0a8.

linetype-phase.test.ts 12/12, hedefli Chromium 1/1. Kanıt D:\codex-cad-v2-f07-periodic-spline-acad-20260925\playwright-run-004 altında. Desteklenen dar profile doğrulandı; generic PATH_DISTANCE shader kapısı PARTIAL/OPEN. F07 iç ~%67, genel plan 14/19 (%74).


## 2026-09-25 — F07 periodic SPLINE runtime-refinement checkpoint

Trace: DXF flag/degree/knots/weights/control points → cyclic profile validation → per-span homogeneous fit → bounded source sidecar → scene binary → generation-aware Web Worker cache/fallback.

Synthetic periodic DXF SPLINE runtime refinement is now enabled for a bounded profile: degree 1–8, positive finite weights, cyclic control/weight tail, and closed active knot interval. Open/non-cyclic seams and degree 9+ fail-closed; non-periodic knot insertion is unchanged. This supersedes the earlier blanket periodic rejection only for these synthetic profiles.

Independent De Boor oracle: four 4-span profiles (F071/F074/F075/F077), 12,001 samples each (48,004 total), target 0.05 world units. Max errors 0.0188605 / 0.0326872 / 0.0364018 / 0.0361927; reported bounds 0.0254003 / 0.0441744 / 0.0488367 / 0.0482629. Simple/double/triple internal multiplicity and rational weights were included. Chromium worker refined 6 source segments to 64; bound met, stale generation dropped, LRU inline fallback passed, Float32 output 3,472 bytes.

Periodic AutoCAD-authored fixture/parity and periodic raster comparison are still missing: this gate remains PARTIAL/OPEN. A separate DPR3, 80%-zoomed-and-panned UI raster regression tested a non-periodic rational SPLINE only (3,273 pixels; render→source 0.666857 CSS px, source→render 0.232208 CSS px), so it does not close periodic or general runtime raster acceptance.

Current compiler/cache revision cad-v2-compiler-2026.09-v30; pipeline fidelity-v3-p08; DV2SCN01 schema v1 and three172-cad2d-v2 render ABI unchanged. Unit package exited 0, periodic unit and real-browser worker tests passed, runtime tsc --noEmit -p tsconfig.next.json --incremental false passed. Logs retained in D:\codex-cad-v2-f07-periodic-runtime-20260925. F07 remains IN_PROGRESS, internal estimate ~67% (2 PASS + 4 PARTIAL across 6 groups); plan 14/19 (74%), 5 packages open.


## 2026-09-25 — F07 nested affine BULGE DPR2 rendered-error checkpoint

Test izi: nested LWPOLYLINE bulge → two-level INSERT transform (inner non-uniform scale/rotation; outer mirrored non-uniform scale/rotation) → compiler CURVE_DATA/BULGE sidecar → scene binary → document host → real Web Worker refinement → WebGL2 DPR2 buffer → device screenshot.

Bağımsız kaynak oracle'ı DXF bulge ilişkisi theta=4*atan(b) ile yay merkez/radius'ını start/end/bulge'dan hesapladı; 4.097 kaynak noktasına iki INSERT affine dönüşümünü bağımsız uyguladı. %80 zoom ve +24,+12 CSS px pan sonrası kamera k=26.928623; CSS viewport 1280×672, buffer/screenshot 2560×1344. 3.105 boyalı piksel için azami render→source 0.5856469647 CSS px; source→render 0.4652905302 CSS px.

Runtime trace: 1 BULGE source ref; hedefler [0.75,0.25,0.75,0.25], 4 reply; maxLineVertexCount 98; pan'den sonra yeni istek yok ve bekleyen yanıt yok. Hedefli Playwright Chromium 1/1; chunk-error-accounting ve curve-refinement unit testleri PASS; runtime tsconfig.next typecheck PASS. Test-inclusive repo tsconfig.json tam kontrolü exit 2, yeni spec için hata vermedi fakat diğer mevcut UI testlerinde tip hataları var.

Kanıt ve test config: `D:\codex-cad-v2-f07-nested-bulge-raster-20260925`. Bu hücre rendered-error matrisine nested affine BULGE ekler; native GPU/device parity ve genel matrix tamamlanmadığı için kapı PARTIAL/OPEN. F07 ~%67; plan 14/19 (%74).

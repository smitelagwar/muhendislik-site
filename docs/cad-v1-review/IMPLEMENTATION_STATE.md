# CAD V1 Professional Review R2 — IMPLEMENTATION_STATE
Plan ID: CADV1-PRO-REVIEW-20261102
Plan revision: 2
Date: 2026-11-02 (Europe/Istanbul)
Planning status: PLAN_HAZIR
Execution status: ASAMA_08_HEDEFLI_TESTLER_PASS; GENEL_RELEASE_BEKLIYOR
Completed stages: ASAMA_01–05 (code checkpoints; partial runtime gates pending); ASAMA_06–08 (targeted build/TS/lint/Node/Chromium PASS; release gates open)
Active stage: none
Next stage: ASAMA_09 (ONLY after user says devam)
Stage 01 acceptance: DOCUMENTED_BASELINE; runtime/device verification NOT_RUN
Release-ready: NO
Branch: internal-cad-v1-pro-review-r2-20261102
Checkpoint: this document's containing branch HEAD (first stage checkpoint; see branch history)
Checkpoint parent: 32a1c818d06c5b191cdc5bd4efdeaf71407e6559
Plan source: attached revision 2 copied verbatim to PLAN.md
Deployment: Stage05 attempted exactly one Preview (Vercel resource provisioning ERROR; no build), production/main unchanged. Stage06 deployment separately recorded below.
Scope: ASAMA_01–05 data/measurements + ASAMA_06 markup selection, shapes, hit-test, movement, history; renderer/parser/worker/fallback frozen

## 1. Branch, source and engine freeze

- main HEAD before stage: 3df5e45924c6f83e2d5cbbdb81e5d02c3fe07dc4.
- Rule branch: internal-cad-v1-review-standard-20261102 at 32a1c818d06c5b191cdc5bd4efdeaf71407e6559; compare with main: ahead 1, behind 0, rules/docs only.
- Work branch starts exactly from that rule commit. Local Windows worktree status cannot be read by the connected GitHub API; remote source is not proof of absent unpushed local changes.
- Viewer entry: /dokumantasyon/dosya/[fileId] -> FilePreviewShell (previewKind cad) -> DokCadRuntimeOrchestrator -> DokCadUpstreamViewer; DXF upstream -> legacy fallback; DWG cached DXF -> upstream original -> legacy conversion -> APS fallback.
- Review feature flag: NEXT_PUBLIC_CAD_REVIEW_V1, default enabled unless false/0. Export flag: NEXT_PUBLIC_CAD_REVIEW_EXPORT_V1, same default. Live environment values and which route the user sees are NOT_RUN.
- Vercel gate: vercel.json sets git.deploymentEnabled internal-* = false and chatgpt-* = false. Build stays npm run build. No deployment requested or initiated.
- Golden IGNORE2 restore SHA is 909c59cb9dcac8e722b3bda4c66fd9d8a25755c8. For ordinary stage rollback revert only this stage changes, not whole repository to golden.

### Frozen protected blob SHA baseline (GitHub source, rule branch)

| Protected path | Blob SHA |
|---|---|
| src/components/dokumantasyon/preview/cad-runtime-orchestrator.tsx | 5ab11bd957b02e5348a02c172510cb24be30c73f |
| src/components/dokumantasyon/preview/cad-upstream-viewer.tsx | b102b4b8d64b372c31b9abca4faee6c9f62dd839 |
| src/components/dokumantasyon/preview/cad-viewer.tsx | 93c5e3db2ee3bd41eadc34f4f4f38600ca738d2c |
| src/components/dokumantasyon/preview/dxf-viewer-worker.ts | 4b43906928bfcb31d71038b01927d018022cad11 |
| src/lib/dokumantasyon/cad-upstream/adapter.ts | 4f00c7fc6f01c2b7ca27f48c3a7ff24563f3e9c8 |
| vercel.json | a77b0543579394f9b7955afaef64efe8d7da372b |

### Installed / resolved versions (package-lock.json)

- @mlightcad/cad-simple-viewer 1.6.2 (MIT), @mlightcad/data-model 1.14.2 (MIT).
- @mlightcad/libredwg-converter 3.14.2 (GPL-3.0), @mlightcad/libredwg-web 0.7.10 (GPL-3.0).
- dxf-viewer 1.0.48 (MPL-2.0).
- No upgrades, runtime replacements, vendor copies, parser, canvas or worker changes in ASAMA_01.

### Mandatory reference set reviewed

PROJECT.md; AGENTS.md; .agents/rules/cad-dxf-engine-koruma.md; .agents/rules/cad-v1-review-kurallari.md;
docs/cad-dxf-engine/README.md, BASELINE_MANIFEST.md, ARCHITECTURE.md,
VISUAL_INTERACTION_CONTRACT.md, AI_CHANGE_PROTOCOL.md; DOK_CONTEXT_MAP.md;
docs/DOKUMANTASYON_CAD_MIMARI_HAFIZA.md; docs/cad-review-architecture-decisions.md;
docs/cad-review-tools.md; .agents/rules/test-ve-otomasyon-standardi.md;
.agents/rules/vercel-kurallari.md; current source, test and lock entries.
Historical claims of RELEASE READY are not current live acceptance evidence.

## 2. Complete visible ribbon / review control inventory

For every row: source is src/components/dokumantasyon/preview/cad-studio-ribbon.tsx;
host callback is src/components/dokumantasyon/preview/cad-upstream-viewer.tsx;
world-screen conversion flows only through CadUpstreamAdapter.
Legend: V = view-only / no review data; S = session/local settings;
L = component-local result (not CadReviewStore); R = committed CadReviewStore item
-> CadReviewOverlay -> local JSON / available review-only exports.
These paths are *source-grounded wiring*, NOT browser PASS results.

| Visible control / selector | Callback -> controller / adapter -> output, history, persistence | Data |
|---|---|---|
| Seç / Gezin (cad-tool-select) | onSelectTool(select) or onPan -> handleSelectReviewTool / adapter navigation -> review selected state, source viewer | S/V |
| Ekrana Sığdır (cad-tool-fit) | onFitView -> handleZoomToFit -> adapter.zoomToFit | V |
| Gerçek Renk (cad-display-source) | onSelectDisplayMode(source) -> adapter display mode | V |
| Siyah-Beyaz (cad-display-monochrome) | onSelectDisplayMode(monochrome) -> adapter display mode | V |
| Çizgi Kalınlığı (cad-display-lineweight) | onToggleLineWeight -> adapter material/lineweight setting | V |
| Arka Plan (cad-tool-view-settings; cad-bg-autocad/black/white) | onSelectBackgroundColor -> adapter background; no source edit | V |
| Mesafe (cad-tool-distance) | onStartDistance -> adapter.startDistanceMeasurement -> CadPressHoldDistanceController + snap-engine -> distanceMeasurements -> CadDistanceOverlay. No review store commit shown | L |
| Zincir Mesafe (cad-tool-chain-distance) | onStartChainDistance -> adapter.startChainDistanceMeasurement -> CadChainDistanceController + snap-engine -> store.addItem(chain_distance) -> CadReviewOverlay, undo/local JSON, review export | R |
| Alan (cad-tool-area) | onStartArea -> adapter.startAreaMeasurement -> CadAreaMeasurementController + snap-engine -> areaMeasurements -> CadAreaOverlay. No review store commit shown | L |
| Ölçüm Birimi/Hassasiyet/Renk (cad-tool-measure-settings) | onUpdateMeasurementUnitSettings -> host local and CadReviewStore session; toolbar m/cm/mm and precision 0–3; measurement layer conversion requires verification | S |
| Ölçümleri Temizle (cad-tool-clear) | onClearMeasurements -> clears component distance/area + adapter.clearMeasurements; review chain is separate | L |
| Yorum Pini (cad-tool-pin; pin style menu) | onSelectTool(comment_pin) -> CadMarkupController -> CadMarkupFacade.addCommentPin -> review store/overlay; input currently window.prompt | R |
| Serbest Çizim (cad-tool-stroke; color/width/line menu) | onSelectTool(stroke) -> CadFreehandController -> facade.addStroke -> store/overlay | R |
| Şekiller (cad-tool-shapes; cad-tool-shape-rect/circle/cloud) | onSelectTool(shape_*) -> CadMarkupController -> facade.addShape -> store/overlay | R |
| Callout (cad-tool-callout; style menu) | onSelectTool(callout) -> CadMarkupController -> facade.addCallout -> store/overlay | R |
| Metin (cad-tool-text; style menu) | onSelectTool(text) -> CadMarkupController -> facade.addText -> store/overlay; input currently window.prompt | R |
| Silgi (cad-tool-eraser) | onSelectTool(eraser) -> CadFreehandController / CadMarkupFacade.eraseItemAtPoint -> store.removeItem; source entity untouched by this path | R |
| Katmanlar (cad-tool-layers) | onToggleLayerPanel -> CadLayerPanel -> adapter.setLayerVisible/isolateLayer/showAllLayers/hideAllLayers/resetLayersToSource | V |
| OSNAP (cad-tool-snap-settings) | onToggleSnapPanel -> CadSnapSettingsPanel -> handleSnapSettingsChange -> local snap settings + adapter.updateDistanceMeasurementSnapModes | S |
| Çizim İçi Metin Ara (cad-tool-search-panel) | onTogglePanelTab(search) -> CadReviewSidePanel -> handleSearchQueryChange -> adapter.searchCadText, select result -> zoomToBounds | V |
| Yorumlar (cad-tool-comments-panel) | onTogglePanelTab(comments) -> CadReviewSidePanel -> status update/delete/select via review store | R |
| Geri Al (cad-tool-undo) / Yinele (cad-tool-redo) | onUndo/onRedo -> CadReviewStore.undo/redo; local distance/area not in that store | R |
| Kayıt durumu (cad-save-status) | CadReviewStore subscribe -> saveLocalCadReview(fileId, doc) -> status saving/clean; server GET exists but no verified server write in inspected host flow | R |
| İndir (cad-tool-download-dropdown) -> Revizyonlu DXF (cad-download-dxf-rev) | onDownloadDxf -> exportReviewToDxf(store.getDocument()) -> review-only DXF blob | R |
| İndir -> Orijinal Çizimi İndir (cad-download-original) | onDownloadOriginal -> accessUrl/displayName as downloaded source | V |
| İndir -> Dışa Aktarma Merkezi (cad-open-export-dialog) | onOpenExportDialog -> CadExportDialog -> exportReviewToJson, exportReviewToDxf, captureReviewPngBlob for PNG/PDF (PDF path has confirmed defect below) | R |

Additional mobile/older CadReviewToolbar exposes select, distance, pin, stroke, eraser, search, comments, layers and desktop selection/shape controls. Its mounted path in current V1 must be established before asserting user exposure. The six enabled-by-default snap modes are endpoint, midpoint, intersection, center, nearest, perpendicular (snap-settings.ts / snap-engine.ts). CAD entity is owned by adapter; overlay committed geometry is owned by review store. The existing schema.ts is schemaVersion 1 and store.ts already implements undo/redo. No replacement schema/store is warranted.

## 3. Evidence / root-cause matrix

Each status distinguishes source *fact* from user-observed bug. A code defect may be confirmed by deterministic reading while actual user impact remains browser NOT_RUN.

| Symptom or claim | Minimal reproduction / actual source evidence | Root-cause level | Recommended stage / verification |
|---|---|---|---|
| PDF button yields a file with incorrect binary type | In cad-export-dialog.tsx, format pdf shares branch with png; lines 61-68 call captureReviewPngBlob then append .pdf extension. Inspect magic header after click | CODE-CONFIRMED (not browser tested) | ASAMA_08: genuine PDF generation or honest capability label; magic header test; NOT_RUN browser |
| Distance/area measurements missing from review undo/save/export | Host onComplete for distance at 932-943 pushes component distanceMeasurements; area at 983-994 pushes areaMeasurements; chain at 1029-1046 invokes reviewStore.addItem; export and undo read reviewStore | CODE-CONFIRMED split ownership; user outcome NOT_RUN | ASAMA_02 data contract, ASAMA_03–05 tools and ASAMA_08 reload/export |
| Review measurement labels may falsely say m, 2 decimals | cad-review-overlay.tsx labels for distance, chain, area at 138,174,213 explicitly pass m and 2, regardless of live session unit selector | CODE-CONFIRMED formatting path; correctness impact depends on source units | ASAMA_02 units snapshot + ASAMA_03–05 label tests |
| Server-loaded review appears but later edits not tracked | Host store subscription created on original store (line 371); lines 353-365 replace reviewStoreRef.current with new store after GET without subscribing to replacement; controller references captured initial store | CODE-CONFIRMED stale reference/subscription path; UI reproduction NOT_RUN | ASAMA_02/08: preserve one subscribed owner; test server GET -> edit -> save/reload |
| Source version binding can be placeholder rather than actual fingerprint | Host fallbackDoc at lines 322–327 assigns sourceVersionKey from fileId+accessUrl and sourceSha256 as sixty-four zeroes; reuse of existing local doc based on non-empty items | CODE-CONFIRMED fallback field; cross-version correctness impact NOT_RUN | ASAMA_02/08: verified fingerprint and compatibility; never delete stored user data |
| Clear/undo disagree across tools | Host clear empties local distance and area, store undo/redo only operates review items. Chain is committed separately | CODE-CONFIRMED divergent flow, not confirmed user-visible bug | ASAMA_02–05 and 08; include chain + local mixed fixture |
| Duplicate events / failed camera restore / ghost vertex | CadMarkupController and CadFreehandController each register host pointer and window keydown listeners; CadArea/Chain/DistanceController independently bind events; CadPointerRouter exists separately | ARCHITECTURAL OBSERVATION; root-cause UNPROVEN | ASAMA_03+: only introduce event arbiter if deterministic red repro |
| Pin/text entry interrupted on mobile | Host requestCommentInput and requestTextInput are window.prompt at lines 420–429 | CODE-CONFIRMED UX method; specific mobile failure NOT_RUN | ASAMA_07: designed in-app input, keyboard/focus test |
| Incorrect perpendicular/nested INSERT snap | Six modes exist; no current cross-device numerical failure captured | HYPOTHESIS | ASAMA_03 tests with rotated/mirrored INSERT and arc/layer |
| Pan/zoom/DPR changes overlay placement | Existing adapter.worldToScreen/screenToWorld established; no measured deviation | HYPOTHESIS | ASAMA_03–04 DPR 1/2 ≤0.5 CSS px target, E2E |
| Slow pointermove on dense drawings | Need performance trace before attributing to O(n) snap query | HYPOTHESIS | ASAMA_10 measured baseline before any optimization |

## 4. Frozen independent numeric oracle (source geometry, before implementation)

These are EXPECTED vectors, not evidence that current web application passes.

| ID | Input | Expected |
|---|---|---|
| O01 | (0,0) to (3,4) | 5 source units |
| O02 | 3 x 4 rect | area 12 square source units; closed perimeter 14 |
| O03 | rotate rectangle 37 degrees | area 12; perimeter 14 |
| O04 | translate rectangle near x=4,000,000 and y=4,000,000 | area 12 using reference-corner translated shoelace |
| O05 | 3 collinear / repeated corner / crossing polygon | reject or clearly mark invalid; no precise positive area |
| O06 | INSUNITS mm, cm, m, unitless | correct dimensional conversion or explicit unitless/uncertain label |
| O07 | calibration scale 2 | length 2x, area 4x; completed measurement calibration snapshot must not silently change |
| O08 | nested rotated 37 degree, mirrored, nonuniform INSERT | snap to actual world transformed geometric points |
| O09 | ARC / bulged polyline | do not label chord polygon as exact curved enclosed area |
| O10 | DPR 1 and 2 with supported zoom boundaries | world->screen->world nominal error ≤0.5 CSS px |
| O11 | close consecutive points, double click, cancel | max one committed item, zero phantom vertex/undo step |

Tolerance targets: normal finite arithmetic 1e-9 relative as appropriate, special high-offset area must use numerically stable method. No tolerances may be widened just to pass. On the isolated execution container, an independent arithmetic-only calculation showed PASS for O01–O04 and 2x scaling (O07). This was NOT a test of checked-out repo code, TSX, browser or real DXF. O05/O06/O08–O11 app tests: NOT_RUN.

### Test and fixture coverage map

- Desktop 3-4-5 fixture: tests/fixtures/cad-preview-v2/known-geometry-measurements.dxf; tests/document-studio/cad-stage5-distance-measurement.spec.ts includes 3000/4000 -> 5000 on CAD UI, plus cancel. Source inspected only, execution NOT_RUN.
- Existing 3000x4000 area UI oracle: cad-stage6-area-measurement.spec.ts expects 12,000,000 source units squared; source inspected, execution NOT_RUN.
- Chain/units: cad-chain-measurement.spec.ts tests chain machine 3000+4000=7000 and measurement facade, plus browser branch; cad-measurement-units.spec.ts tests physical mm/cm/m and area scale squared. Source inspected, execution NOT_RUN.
- Core/exports: cad-review-core.spec.ts (schema/history/source immutability) and cad-review-export.spec.ts (JSON roundtrip/DXF/entity invariance); neither currently proves PDF file signature.
- Additional targeted files available: cad-native-measurements, cad-markup-tools, cad-freehand-stroke, cad-review-rollback, cad-readonly-contract, cad-text-search, cad-public-layer-store, cad-a11y-responsive-ux, cad-cache-and-routing, cad-preview-v2-contract, and cad-mobile-stage8*.
- Fixtures exist for stage9-area-20m2.dxf, stage9-unitless-calibration.dxf, insert-attrib-transforms.dxf, layers-frozen-locked-zero.dxf, multi-layout-model-paperspace.dxf, plus DWG/other DXF, and manifest.ts.
- Test coverage gap: some cad-native-measurements tests only validate toolbar activation. Need confirm numeric commit, pointer event ownership, undo+reload, fixed actual PDF bytes and physical mobile acceptance.

### Verification statuses for ASAMA_01

| Gate | Result | Where / owner | SHA / evidence |
|---|---|---|---|
| GitHub branch/ref drift and protected baseline | PASS | GitHub API | initial rule SHA 32a1c818d06c5b191cdc5bd4efdeaf71407e6559 and blob SHA table |
| Required reference/test paths and lockfile resolved dependencies | PASS | GitHub API | rule SHA 32a1c818d06c5b191cdc5bd4efdeaf71407e6559 |
| Vercel branch auto-deploy disabled | PASS (configuration only) | GitHub vercel.json read | blob a77b0543579394f9b7955afaef64efe8d7da372b |
| Independent pure geometric reference values | PASS (NOT application) | isolated Python calculation, not repository runtime | O01–O04/O07 |
| Existing app TypeScript/Playwright tests | NOT_RUN | owner local CI/desktop test runner | need checkout exact checkpoint SHA |
| Real DXF/DWG browser visual/snap/click/refresh | NOT_RUN | owner browser-capable runner/user | known-geometry-measurements.dxf |
| Real smartphone/tablet touch/stylus/pinch | NOT_RUN | owner physical device/user | manual baseline below |
| Confirm produced Vercel worker/WASM and NOTICE bytes | NOT_RUN | owner deployed artifact audit / license reviewer | script and notices inspected, no deployed assets downloaded |
| Legal conclusion on GPL obligations | BLOCKED for release decision | owner project/legal review | factual conflict recorded in license addendum |

### Two-minute user baseline (no production code changes)

Desktop: Open the existing V1 CAD file with known-geometry-measurements.dxf; fit; enable distance; select endpoints (0,0) and (3000,4000) and record label 5000 *drawing units*, while noting the actual unit metadata before treating it as m; zoom/pan and confirm endpoint/overlay stability; Esc to cancel a new measurement; measure a 3-segment chain and cancel/finish; area around 3000×4000 rectangle should be 12,000,000 square drawing units; reload and report which items persist/which disappear. Test actual read-only original CAD separately.
Mobile: Open same test file; use distance and area, tap/long-press, Bitir/İptal, two-finger pinch while measuring, rotate and reload. Record any phantom added points and whether original drawing/pan remain usable.
Owner: user/CI with test file access. Results NOT_RUN until provided; screenshot or video optional, never fabricated. Source fixtures must be cleaned via existing Playwright setup/teardown on CI.

## 5. Upstream and license gate (P0)

- Installed MLightCAD CAD simple viewer: 1.6.2 (MIT), v1.6.2 tag exists, tag reference 499216fca00fa598b6586d54417a489e582cf89e. Source at this tag exports distance/area/angle/arc command modules and markup geometry/history/store from barrel exports; only package root exports is declared. Runtime use through installed public declaration/API NOT_RUN; do not access private internals.
- Upstream MLightCAD main HEAD b7c5020756bb09a286e49b603d9ebcf2374baf78 is newer: package version 1.7.8-preview.6. Its AcApMeasureContinuousCmd.ts exists, but the same path is NOT FOUND at v1.6.2; therefore DO NOT call it a supported installed 1.6.2 command. Reference its behavior only; keep existing local chain controller. No upgrade.
- CADCraft main HEAD 2034d6899eba72363028723ec75d4c36eacfceac. Rust crates/engine/src/snap.rs and crates/engine/src/cmd/inquiry.rs exist. MIT and Apache-2.0 license files exist. Their code can be reviewed for perpendicular/command algorithms but is not an authoritative oracle nor a drop-in TS runtime. No vendoring, new dependency or copied source in ASAMA_01.
- Decision per feature: distance/area/current snap = KEEP current public adapter, compare MIT upstream geometry where needed; chain = KEEP local controller and use upstream ContinuousCmd only as future design reference; markup = KEEP SVG/review facade; CADCraft = reference math only, independently test before any adaptation; no renderer/engine/worker code copied.
- GPL P0: THIRD_PARTY_NOTICES.md already records LibreDWG converter 3.14.2 and libredwg-web 0.7.10 GPL-3.0; scripts/sync-cad-upstream-assets.mjs copies libredwg-parser-worker.js and libredwg-web.wasm and generates GPL-NOTICE.txt (upstream corresponding source e3198a391b5c8599a94f1f1da285426443371451). public/cad-upstream is not a tracked GitHub folder because assets are built. Historical license decision from 2026-08-20 says production has no GPL; now inaccurate relative to lockfile and build script. Updated by a non-destructive dated addendum. No legal compliance claimed; verify actual artifact, obligations and source/NOTICE delivery before release. Do not disable working DWG route.
- Required license decision: project owner/legal review before final release when unresolved, not a reason to alter V1 engine during ASAMA_01.

## 6. UX/input contract recorded before UI changes

- Single clear active tool; phases idle/armed/placing-or-dragging/editing/completed-or-cancelled.
- Escape: cancel current incomplete gesture first; second Escape closes active tool. Enter/visible Bitir finalizes; Backspace removes last pending polygon/chain point; double click must not create a duplicate endpoint or extra commit.
- Pointer cancel, blur, tool switch, file switch, unmount, pending async input and pinch have explicit cleanup; pan/pinch never stranded under camera disabled.
- Show snap type-specific marker and contrast/halo, true live length, selected/draft/committed distinction. Screen pixel hit/snap tolerance distinct from world coordinates. Desktop mouse, keyboard focus isolation and mobile target-confirm/44px targets require later evidence.
- Labels in locale tr-TR must share raw quantity + captured source/display/calibration context between overlay, list, save and export; unitless drawings must not be silently reported as meters.

## 7. Checkpoint, rollback and stage boundary

Only files allowed in this stage: docs/cad-v1-review/PLAN.md, docs/cad-v1-review/IMPLEMENTATION_STATE.md and dated addendum to existing docs/cad-viewer-license-decision.md. No source, lock, fixture, tests, engine or Vercel configuration edits.
Rollback: revert only this stage commit on work branch while preserving rule-branch base; never reset the entire repo to IGNORE2. No main merge or deploy.
Stage 01 baseline/documentary acceptance is recorded here. Remaining browser/CI/physical-device and legal verification gates stay open; NOT_RUN is not PASS. ASAMA_02 may begin only on explicit user command devam; work must remain frozen until then.


## 8. ASAMA_02 — Veri, birim, tarihçe ve girdi sözleşmesi

Date: 2026-11-02 (Europe/Istanbul)
Execution: CODE CHECKPOINT; KOD_HAZIR_DOGRULAMA_BEKLIYOR, NOT RELEASE_READY.
Branch: internal-cad-v1-pro-review-r2-20261102; checkpoint is the stage commit containing this document. No main merge and no Preview/Production.

### Changed paths (strict stage boundary)

- src/lib/dokumantasyon/cad-review/schema.ts — optional Zod v1 measurementContext; legacy chain-/rev- IDs recognized.
- src/lib/dokumantasyon/cad-review/units.ts — source INSUNITS and calibration conversion, unknown status, squared area, captured formatters.
- src/lib/dokumantasyon/cad-review/store.ts — validated atomic add, addMeasuredItem, history/rejection safeguards, correct replacement undo, isolated session units and grouped color transaction.
- src/lib/dokumantasyon/cad-review/measurement-facade.ts — frozen context labels for new records; unchanged legacy format path.
- tests/document-studio/cad-review-stage02-contract.test.ts — pure Node/TSX regression cases.
- tests/document-studio/cad-measurement-units.spec.ts — test global-getter assumption corrected to existing per-store accessor.
- docs/cad-v1-review/IMPLEMENTATION_STATE.md — this evidence/status.

No parser, renderer, worker, fallback, host, adapter, routing, V2, dependencies, lock, server schema, fixtures or deployment settings changed.

### Source, display, legacy, calibration decision

- Zod envelope remains schemaVersion=1; optional context uses measurementContext.version=1. Existing JSON without a context remains readable, untouched and does not silently get reinterpreted.
- Source geometry and numeric distance/chain/area/perimeter remain raw CAD world units. New completed item can capture sourceUnit, origin, INSUNITS code, mmPerWorldUnit, calibrationRevision, chosen displayUnit and areaDisplayUnit and precision. New facade formatting reads the captured context, not later dropdown selections. Updating the saved context through ordinary item patch is rejected until an explicitly designed remeasurement action exists.
- INSUNITS known mappings: 1=inches, 2=feet, 4=mm, 5=cm, 6=m. Zero, missing and unsupported codes are unknown: no invented metres. Other codes require explicit checked mapping. User calibration gives explicit mm/world and revision.
- Distance conversion = raw world distance × mm/world ÷ mm/display. Area conversion = raw world area × (mm/world ÷ mm/display)². Calibration scale 2× increases length 2×, area 4×. No conversion overwrites raw world geometry.
- Existing host chain actually generates chain-epoch IDs, so UUID-only add validation would break a working button. The Zod item ID boundary now accepts UUID and narrowly bounded known legacy prefixes (including chain/rev/dist) to preserve current behavior. Unrelated malformed IDs still fail.
- Historic measurements without context retain existing numeric/label rendering; this does NOT validate an old metre label. Live drawing metadata, measurement overlay, new chain commitments and persistence are NOT wired yet: ASAMA_03–05/08.
- Existing host bugs unchanged due forbidden host path: component-local distance/area, placeholder file fingerprint and server GET replacement of subscribed store; release still blocked by these until later authorized stages.

### Single transaction / rejection rules

Committed document has undo/redo; session tool/selection/units are ephemeral; pointer draft is transient. One valid add => one history command. Invalid Zod, duplicate item id, over-capacity, malformed chain segment count, invalid patch and silent context replacement => zero history mutation. Accepted action clears redo; rejected action leaves redo unchanged. Commit/undo/redo draft reset does not emit an extra redundant store notification. Store update undo uses full item replacement so removing optional fields is reversible. Existing non-UUID legacy items can be renamed without ID rewriting. Unit selection alone is session-only; color change applies to existing measurements as one undoable grouped style transaction, and the chosen active color applies to subsequent measurements. No global settings singleton or parallel store is introduced.

### Tool phase and input contract — required, NOT browser verified

| Current state | Input | Required effect and history |
|---|---|---|
| select/idle | tool button | one logical armed tool; no commit |
| armed | pointerdown CAD | adapter snap+world coordinate; transient draft; no commit |
| placing | pointermove | preview and snap marker only; no history |
| placing chain/polygon | Backspace | remove last pending vertex only; no commit |
| placing valid result | Enter / Finish button | one Zod-valid item; exactly one undo |
| placing | double-click | finish once without duplicate endpoint/commit |
| armed/placing | first Escape | cancel draft, no commit |
| armed after cancel | second Escape | exit tool, restore select |
| gesture | tool/file switch, unmount, stale async callback | cancel and dispose state/listeners |
| gesture | pointercancel/lostcapture/blur | cancel or suspend and restore camera |
| gesture | pan/pinch/touch | navigation never commits ghost point; event ownership single |
| any | input/textarea focus | ignore tool shortcuts while typing |
| committed | undo/redo | revert or redo one logical edit; selection remains session UI |

No new global pointer coordinator is added: root cause of duplicate events has not been proved. ASAMA_03–07 must verify these behaviors with real pointer/touch events; this table is only a design contract.

### Verification records and gate

- Pure tests: npx tsx --test tests/document-studio/cad-review-stage02-contract.test.ts — NOT_RUN.
- Existing unit suite: npx playwright test --config=playwright.site.config.ts tests/document-studio/cad-measurement-units.spec.ts — NOT_RUN.
- Types: npx tsc --noEmit — NOT_RUN.
- Lint: npx eslint src/lib/dokumantasyon/cad-review/schema.ts src/lib/dokumantasyon/cad-review/units.ts src/lib/dokumantasyon/cad-review/store.ts src/lib/dokumantasyon/cad-review/measurement-facade.ts tests/document-studio/cad-review-stage02-contract.test.ts — NOT_RUN.
- Browser DXF/DWG, DPR, real mobile/stylus and export — NOT_RUN. Editing connector can create GitHub code/tree/commit but has no installed repository runtime. Isolated execution container has no checked-out repository or zod/tsx. Therefore tests have no fabricated PASS labels.
- Added test source covers v1 JSON round-trip, invalid NaN/schema, runtime chain-epoch ID, INSUNITS mm/cm/m/unknown, raw 3-4-5, square-area calibration, frozen revision/JSON, exactly one undo/redo, rejected action preserving history, grouped measurement color, legacy ID edit+undo.
- Two-minute owner/browser verification after a separate approved test environment: open known-geometry-measurements.dxf, click real chain tool through 3000+4000 geometry, check raw 7000 and source physical label, undo/redo once; change display unit, reload, cancel/double-click and ensure no duplicate vertex. Check desktop/mobil. Current production has NOT been modified.
- Remaining blockers: actual metadata wiring, all distance/area committed to one store, server GET stale reference, real export/PDF correctness, complete regression and physical tests, GPL deployed assets/legal review. No release approval.

Rollback is revert of ASAMA_02 atomic commit only; preserve ASAMA_01 and protected engine. STOP. Next ASAMA_03 only upon another explicit user command devam.


## 9. ASAMA_03 — Chain distance / OSNAP / ownership vertical slice

Date: 2026-11-02 Europe/Istanbul
Status: **KOD_HAZIR_DOGRULAMA_BEKLIYOR**. Source changes checkpointed; no TypeScript/Playwright or physical device PASS, no deployment. The stage's entire browser/reload/export acceptance is NOT YET SATISFIED.
Branch: internal-cad-v1-pro-review-r2-20261102. Atomic stage checkpoint SHA is the commit containing this state section.

### Scope and changes

- src/lib/dokumantasyon/cad-upstream/chain-distance.ts: one-shot chain finish and controller callback, transient segments/Backspace, double-click suppress second pointerdown within 5 CSS px and 380 ms, first ESC resets in-progress draft and second exits, keyboard typing isolation, pointercancel/blur/visibility/pagehide cleanup, normal pointerup+lostcapture safety, explicit touch aim and confirm button, last point as perpendicular snap origin.
- src/lib/dokumantasyon/cad-upstream/adapter.ts: narrow adapter bridge for previous snap origin, active chain getter, confirm-point/undo-point/update modes, read-only INSUNITS unit metadata lookup, and correct chain/area cancel on two-touch gesture. No renderer, parser, database mutation or viewer engine changes.
- src/lib/dokumantasyon/cad-upstream/snap-engine.ts: perpendicular foot must fall on segment; spatial-index duplicate ID replacement removes prior cell entries. Existing six OSNAP modes and grid are preserved.
- src/lib/dokumantasyon/cad-upstream/snap-catalog.ts: arc start/end transformed into world angles under rotations/mirrors; negative determinant reverses sweep. Polyline bulge recognized by vertex.get bulge/getBulgeAt and represented by circular arc rather than false straight chord. Cached polyline source vertices once per input; nested INSERT transform recursion retained.
- src/components/dokumantasyon/preview/cad-chain-distance-overlay.tsx: SVG transient connected segments and rubber band, OSNAP mode-dependent marker, dynamic source-aware total and point count; responsive explicit Point Add, Undo Point, Finish controls including touch aim-confirm.
- src/components/dokumantasyon/preview/cad-upstream-viewer.tsx: necessary bounded chain callback/overlay bridge, snap modes updates, source-aware measurementContext capture and single-store addMeasuredItem; chain review labels, ESC ownership, chain overlay pointer pass-through; stage02 unit defaults completed.
- src/components/dokumantasyon/preview/cad-review-overlay.tsx: frozen context display for persisted chain/distance/area items when available; old records retain legacy labels.
- src/components/dokumantasyon/preview/cad-studio-ribbon.tsx: narrowly restore required areaUnit/areaPrecision defaults for ASAMA_02 type compatibility. No ribbon controls removed or reorganized.
- tests/document-studio/cad-chain-stage03-contract.test.ts: pure Node/TSX oracle, snap, nested insertion, bulge and fake event-host/controller lifecycle plus in-memory store/JSON cycle.
- docs/cad-v1-review/IMPLEMENTATION_STATE.md: this stage audit.

### Root-cause/evidence (code-confirmed, live symptoms NOT_RUN)

1. Previous host chain callback had onSnapshot: () => {}, so live chain path was not rendered by host. Added dedicated ephemeral overlay instead of a new renderer.
2. Chain controller's complete could be invoked repeatedly while phase remained complete, and doubleclick's second pointerdown could add an extra vertex. One-shot finish + duplicate guard + dedicated regression source.
3. Previous adapter abortMeasurementForMultiTouch restored camera but did not cancel chain/area controller, allowing an active gesture to remain after pinch. Now calls proper cancel on those controller paths.
4. Chain's resolver did not provide the last committed point as origin, so "perpendicular" candidate in snap-engine could never apply to chain. Narrow resolver options bridge added.
5. Existing snap catalog used local arc start/end angles after a rotated or mirrored block insertion, and drew polyline bulges as straight edges. Now geometrically correct for uniform-scale circular arcs (bulge-based arcs included).
6. Snap index add(same id) left old grid membership. Corrected without rebuilding global spatial data or introducing dependencies.
7. Global host Escape key listener could cancel a chain while chain listener simultaneously processed the key; host now defers to active chain controller (no unproven new coordinator).
8. Existing source unit and review undo pathways split. Chain now makes one store transaction with the ASAMA_02 source+display snapshot. History/JSON of chain are covered in tests; actual persistence still subject to the known server GET replacement defect.

### Explicit technical limitations and performance

- Existing spatial grid already indexes world bounds. No runtime pointermove latency or query counts could be obtained here: **NOT_RUN**, so no speculative quadtree/new index was added. Pairwise intersection cost can rise for dense local clusters; sample before optimization in a browser runner.
- Database unit getter reads finite integer insunits when available. A missing or unverified value yields unitless/unknown and "çizim birimi" rather than invented metres. Whether a particular DWG/DXF parser's INSUNITS getter reflects a header default vs explicit source metadata requires real fixture validation; no physical-unit correctness PASS is claimed.
- Nonuniform-scale circles/elliptic arcs still use the pre-existing polyline approximation in snap catalog; this is NOT an exact curved snap guarantee. Must be investigated with recorded fixtures before enabling high-accuracy acceptance.
- Live server-load replacement of CadReviewStore and placeholder source hash are not resolved here; ASAMA_08 must implement consistent store owner and reliable fingerprint without data loss. Stage03 local JSON round-trip test does NOT prove browser F5/reload and server persistence.
- Review DXF export retains raw chain geometry but legacy DXF text/units and PDF binary bug remain for ASAMA_08. Do NOT claim truthful end-to-end export unit labels yet.
- For new records, raw world coordinates and segment total are persisted unchanged, and source/display context is captured. Old v1 review JSON is not destructively migrated.
- Touch flow: touching canvas aims preview, separate Add Point confirms; second touch cancels active chain and releases camera to navigation. Needs real browser/stylus/pinch verification; event tests are mocks, not physical device proof.
- Layer visibility uses existing adapter filter (visible = isOn && !isFrozen) and rebuild on layer-store change. Real layer-change event propagation needs runtime test.

### Test matrix (do not overclaim)

| Gate | Status | Evidence/owner |
|---|---|---|
| Relevant source diff within ASAMA_03 allowed boundaries | PASS (GitHub compare, after checkpoint) | GitHub ref, protected blob SHA |
| Pure Node/TSX test | NOT_RUN | npx tsx --test tests/document-studio/cad-chain-stage03-contract.test.ts |
| Existing machine+browser test | NOT_RUN | npx playwright test tests/document-studio/cad-chain-measurement.spec.ts |
| Existing distance and native measure smoke | NOT_RUN | cad-stage5-distance-measurement.spec.ts / cad-native-measurements.spec.ts |
| Typecheck and lint | NOT_RUN | npx tsc --noEmit / npx eslint (changed files) |
| Real snap + layer/arc/nested insert fixture | NOT_RUN | insert-attrib-transforms.dxf / layers-frozen-locked-zero.dxf / known-geometry-measurements.dxf |
| Mobile tap/confirm, double-click, ESC, multi touch/pinch | NOT_RUN | real Chromium and physical phone/tablet |
| Browser F5/reload and true export/reimport; PDF magic bytes | NOT_RUN; partially blocked by existing host/review export defects | ASAMA_08 |
| Snapshot/physical unit verified on actual INSUNITS source metadata | NOT_RUN | browser fixture + source metadata audit |
| Vercel Preview or Production | NOT_DEPLOYED | explicitly prohibited until user authorization |

### Two-minute real-user verification when an approved test runner is available

1. Open known-geometry-measurements.dxf (source mm), use chain clicks along a 3000 then 4000 segment: expect raw total 7000 source units (7 m if INSUNITS=4 verified), two segments, visible rubber-band/OSNAP.
2. Backspace removes the last temporary point. Doubleclick near the last point or use Finish: exactly one committed chain, no phantom point; Undo removes, Redo restores.
3. Hit F5 and inspect saved chain; export JSON and review-only DXF, verify raw geometry/label consistency; if server GET path swaps store, record failure without claiming release PASS.
4. On phone/tablet, touch targets for aim, press Nokta ekle for confirmation; two fingers while measuring cancels chain without a locked camera; test Escape and tool switch on desktop.
5. Verify straight distance/normal pan, layer visibility including frozen layer, inserted mirrored block snap and arc bulge cases. Report values, browser/device/version and screenshot only from actual run.

Rollback: revert **only ASAMA_03 checkpoint**, not main, golden renderer or ASAMA_01/02. No Preview/Production and no changes to parser/renderer/worker/fallback or MLightCAD dependencies. STOP after this stage; ASAMA_04 only with new user "devam".


## 10. ASAMA_04 — Düz mesafe hassasiyeti ve tek committed review kaynağı

Date: 2026-11-02 (Europe/Istanbul)
Status: **KOD_HAZIR_DOGRULAMA_BEKLIYOR**. Source changes prepared in this stage's atomic branch checkpoint; real TypeScript, Playwright, DWG/DXF and physical device verification are NOT_RUN. Not release ready.
Branch: `internal-cad-v1-pro-review-r2-20261102`.
Deployment: ZERO requested, ZERO created; main unchanged.

### Verified code root cause / changes

- Before this stage, `cad-upstream-viewer.tsx` appended completed distance only to local React `distanceMeasurements`, while chain measurements were committed to `CadReviewStore`; ReviewStore distance had a separate `CadReviewOverlay` renderer. This split prevented consistent Undo/Redo, JSON local reload, review export, side panel and item selection. This is code-confirmed, not a live reproduction claim.
- `src/lib/dokumantasyon/cad-upstream/distance-measurement.ts`: preserve existing mouse two-click and touch short-tap/500ms press-hold state machine. Add pure `isValidCadDistance(start,end)` world-coordinate oracle: finite points with absolute coordinate <=1e9; nonzero length above CAD/numeric precision epsilon; reject invalid world/zero/near-zero while leaving second point armed. Explicit mouse pointerId prevents unrelated pointerup. Pointer move >8 **CSS px** between down/up is pan, not a measurement commit. On window blur/hidden cancel active measurement and restore camera. No new renderer or controller.
- `src/components/dokumantasyon/preview/cad-distance-overlay.tsx`: keep existing precision lens, live two-point rubber band, snap preview and `data-cad-distance-complete` regression hooks. Live values use actual source-aware physical unit or truthful "çizim birimi" fallback; persisted measurements show captured display context, active color, selection and optional user label. Keyboard-accessible review selection. This is the **only completed distance SVG renderer** for active review mode.
- `src/components/dokumantasyon/preview/cad-upstream-viewer.tsx`: in review-enabled mode, completed valid distance writes **only one** `store.addMeasuredItem` transaction containing raw world start/end/length and frozen `measurementContext` (INSUNITS/calibration/display). Completed overlay derives from review items; `CadReviewOverlay` excludes distance to avoid double drawing. Side panel uses same captured formatter; completed/draft never enters a second local committed list. Feature-flag-off retains explicit local-only fallback for legacy distance UI. Custom item labels remain visible and length still shown.
- `src/lib/dokumantasyon/cad-review/store.ts`: add one-transaction `clearMeasurements()` for distance/chain/area (comments and markup untouched); Undo restores original item order. `hydrateFromServerIfPristine()` accepts a validated server document only when store is still empty/pristine, maintains **same store instance/listeners** and rejects stale server data after a local edit. Host replaced previous whole-store swap in GET callback; this corrects the source-confirmed stale subscription bug without redesigning routing, server APIs or storage.
- `src/lib/dokumantasyon/cad-upstream/adapter.ts`: very narrow `measurementCommandEpoch` fence in distance start, invalidated by cancel/tool switch, to prevent a delayed `ensureSnapReady` from reactivating stale distance after switching tools. Renderer/parser/canvas/worker methods unchanged.
- Host request token increments for distance/area/chain/pan/clear/file reset/Escape; late onSnapshot/onComplete callbacks check token and live adapter identity. No global event arbiter/monkeypatch.
- `tests/document-studio/cad-distance-stage04-contract.test.ts`: new pure Node/TSX regression tests for 3-4-5/physical 5m, nonzero/invalid/high-offset coordinates, hold/tap, double callback, mouse pan not commit, unrelated pointer ID, blur cleanup, same-store undo/redo/JSON, pristine server hydrate, one-step clear with unrelated pin retained; DXF header problem tracked as explicit TODO.
- `tests/document-studio/cad-stage5-distance-measurement.spec.ts`: existing real-browser test strengthened (not weakened) to assert fixture `INSUNITS=4` and raw=5000 vs physical label **5,00 m**, exactly one visible finished distance and zero duplicate `data-review-type=distance` overlays, Undo/Redo, F5 local restore, clear. Unchanged ESC and short mobile tap checks remain.

### Source / measurement / legacy contract

Fixture `tests/fixtures/cad-preview-v2/known-geometry-measurements.dxf` explicitly has `$INSUNITS / 70 / 4` (mm), a 0-to-3000 horizontal + 3000-to-4000 vertical geometry; diagonal endpoints (0,0) and (3000,4000) imply **5000 raw world mm**, displayed as 5,00 m with source context and display unit "m". Independent in-tool arithmetic `Math.hypot(3000,4000)=5000`, `5000/1000=5`, tr-TR formatter yields `5,00 m` — PASS **for the independent numerical calculation only**, not viewer runtime.

Persisted review points/length remain untouched CAD world values; source-dependent label is from captured context. Source-less legacy records keep raw values but are labelled "çizim birimi" instead of asserting an unsupported physical unit. Changing later dropdown choices does not silently rewrite a committed item's label.

**Review enabled** is the normal V1 default; completed distance is owned exclusively by ReviewStore and shown by one `CadDistanceOverlay`. **Review disabled** retains a nonpersistent local-only distance UI for backward behavior; this does not imply it supports Undo/export.

### Open gates / known issues

- This source checkpoint has **NO executed TypeScript compiler, ESLint, Playwright, device, FPS or real drawing test**. Merely creating tests does not establish PASS.
- `CadUpstreamAdapter.getSourceUnitContext()` is an existing ASAMA_03 read-only metadata bridge; real document getter must be validated against the opened parser and unit fixtures in a browser. If source metadata cannot be trusted, the UI safely says "çizim birimi"; **do not silently assume mm**.
- Local F5 recovery is exercised by the new Playwright source but NOT_RUN. Pristine initial server GET store replacement has a targeted fix; **remote server save/409 conflict, source fingerprint zeros, file-version swap, cross-device sync and full persistence remain open for ASAMA_08**. No complete server persistence guarantee.
- The review-only `export-dxf.ts` currently hardcodes `$INSUNITS=6` even when source geometry is mm (INSUNITS=4). Source DXF body still uses raw geometry. **Review DXF unit-correct export/reopen is BLOCKED until ASAMA_08**; do not label this release-safe. Existing PDF binary-vs-extension bug also remains ASAMA_08.
- Actual mobile touch, press-hold, pan/zoom/DPR, OSNAP precision marker, file switch, stale async interactions and unusual entity geometry require real browser/device verification. Stage03 chain event routing has not been runtime accepted.
- Existing historical review JSON can have IDs/formats not covered by newly strict item Zod; invalid server payloads will not overwrite a pristine document. Audit migration with real backups in ASAMA_08; do not destructively normalize old records.
- Earlier ASAMA_01/03 notes described the server GET replacement defect as open; **only that initial blank/pristine store replacement path is now changed by ASAMA_04**. Do not infer that complete server persistence is solved.

### Stage-specific verification matrix

| Gate | Status | Grounding |
|---|---|---|
| Independent 3-4-5 mm -> metre math | PASS, **arithmetic only** | 5000 world mm = 5 m; source fixture header=4 |
| Source diff limited to ASAMA_04 | Await GitHub compare after checkpoint | frozen engine, tests/docs, narrow host+adapter |
| Pure Node regression | NOT_RUN | `npx tsx --test tests/document-studio/cad-distance-stage04-contract.test.ts` |
| Existing browser gesture regression | NOT_RUN | `npx playwright test tests/document-studio/cad-stage5-distance-measurement.spec.ts` |
| Physical unit and native measure regression | NOT_RUN | `cad-measurement-units.spec.ts`, `cad-native-measurements.spec.ts` |
| TypeScript/lint | NOT_RUN | `npx tsc --noEmit`, ESLint changed files |
| Real desktop / zoom / high-offset / DPR / snap / touch | NOT_RUN | Chromium and real handset/stylus |
| F5 local persisted geometry and undo/redo | NOT_RUN | browser Playwright fixture |
| Server cross-device persistence / DWG round-trip / export | BLOCKED/NOT_RUN | required ASAMA_08 fixes and test |
| Preview / Production / main | NOT_DEPLOYED, unchanged | user restriction |

### User-side two-minute manual inspection after an explicitly approved test runner is available

1. Open `known-geometry-measurements.dxf`, choose distance. Click (0,0) and (3000,4000), inspect live marker and physical length 5,00 m (raw 5000 mm), one overlay only.
2. Undo removes one measurement, Redo restores it; click measure again and press ESC, confirm no new entry. Drag mouse >8 CSS px with left button (pan): no unintended measurement point.
3. F5 and verify the same completed distance from local data; click "Temizle", review-only measurements clear in one undo (notes remain). Test chain still works and clear does not mutate original DWG/DXF.
4. On mobile, tap twice, press-hold, pinch after an incomplete gesture and switch tools: no lost camera or duplicate commit. Test different DPR/zoom and mouse/trackpad.
5. Export and inspect raw coordinates; DO NOT trust review DXF physical units until `INSUNITS` header is fixed in ASAMA_08.

Rollback: revert **only ASAMA_04 checkpoint** on internal branch; leave ASAMA_01–03 and core V1 engine untouched. STOP. ASAMA_05 (manual area and perimeter) starts only on a fresh explicit `devam`.


## 11. ASAMA_05 — Manual area/perimeter, robust geometry and one store owner

Date: 2026-11-02 Europe/Istanbul.
Status: KOD_HAZIR_DOGRULAMA_BEKLIYOR (code checkpoint, NOT runtime PASS, NOT release-ready).
Branch: internal-cad-v1-pro-review-r2-20261102. No main promotion.
Developer/user agreement: from ASAMA_05 onward the user permits **at most one Preview OR Production deployment per stage**, OPTIONAL. Do not repeat failed deploys; prefer Preview solely for useful build/browser checks.

### Actual stage files

- src/lib/dokumantasyon/cad-upstream/polygon-geometry.ts (NEW): robust origin-shifted signed area, centroid, closed perimeter, valid simple straight polygon geometry. Rejects repeated vertices, self-intersection, short edge, invalid bounds and degenerate area; does not interpret arc/bulge as true curved area.
- src/lib/dokumantasyon/cad-upstream/area-measurement.ts: preserve existing polygon gestures; validate before Finish; show validationError and allow Backspace correction. Reject mouse pan drag (greater than 8 CSS pixels), duplicate doubleclick endpoint, lost pointer ownership, nonprimary touch, blur and visibility cancel without committed area. One-shot finish.
- src/components/dokumantasyon/preview/cad-area-overlay.tsx: source-aware area AND perimeter label, explicit 'düz kenarlı poligon' (not curved arc) notice, validation warning, accessible selection, mobile finish and undo-point buttons, existing test IDs preserved.
- src/components/dokumantasyon/preview/cad-upstream-viewer.tsx: store-only completed area in review mode. World points/area/perimeter persisted in one addMeasuredItem transaction with frozen source/display context; CadAreaOverlay is the only review-completed area renderer; side panel and Undo/Redo use same data. No simultaneous local + store committed item. When review flag is explicitly disabled, old local display-only fallback remains.
- src/lib/dokumantasyon/cad-upstream/adapter.ts: narrow popAreaMeasurementPoint and async start epoch fence. No low-level rendering, parser or viewer engine rewrite.
- tests/document-studio/cad-area-stage05-contract.test.ts (NEW): Stage 05 independent source tests for 12m2, 20m2, unitless scale, UTM +4e6, 37-degree rotation, mirror, CW/CCW, self-cross, tiny edges, pointer clicks/touch/ESC/Backspace, one review item + undo/redo/JSON.
- tests/document-studio/cad-stage6-area-measurement.spec.ts: existing browser fixture strengthened to check 12.00m2 + 14m physical display, 12,000,000 world mm2 + 14,000 world mm, single item, Undo/Redo, F5, clear.
- docs/cad-v1-review/IMPLEMENTATION_STATE.md: this state/checklist.

### Fixture and math contract (source-supported, no live PASS claimed)

- known-geometry-measurements.dxf: INSUNITS=4 (mm), corners (0,0),(3000,0),(3000,4000),(0,4000): raw area 12,000,000, raw closed perimeter 14,000; at physical display m/m2 -> 12m2 and 14m.
- stage9-area-20m2.dxf: INSUNITS=4, 5000 x 4000 source-mm: area 20m2, perimeter 18m.
- stage9-unitless-calibration.dxf: INSUNITS=0, 400 x 600 raw source units. Must report raw area 240,000 drawing-unit-squared until calibrated. Calibration known 100 world = 50cm gives 5mm per world unit => area 6m2.
- Area algorithm shifts each vertex by the first vertex before summing oriented triangles: signed area flips CW/CCW and negative mirror; absolute area remains same; perimeter includes closing edge. Reference offset centroid is similarly translated. Pure math oracle is source-guided but running the repository test is a different gate.
- Invalid polygon cannot be saved or displayed as valid; toast/diagnostic remains editable for Backspace. Closed shape has >=3 distinct vertices. Only picked straight edges are measured; no unverified curved/bulge precision or original entity mutation.
- One completed valid area -> one Zod-validated world item, one history command; review list, SVG, local cached JSON and later Undo/Redo reuse the same store. A saved item captures INSUNITS/physical scale, area/linear display unit and revisions. No destructive reuniting/migration for legacy items.
- Existing Stage04 initial GET hydration bug was narrowly corrected but complete server POST/409/conflict/versioning is STILL open. Review-only DXF export still writes hardcoded INSUNITS=6 regardless of source; PDF binary issue deferred to ASAMA_08. DO NOT claim round-trip export PASS.
- Existing Stage03 and Stage04 tests were NOT_RUN, so the ASAMA_05 entry condition of accepted full runtime behavior is not asserted.

### Input / behavior contract

Mouse click primary down/up within 8 CSS pixels -> one vertex. Press-drag or pan -> no extra vertex. Dblclick second release near same point within 380ms/5px -> no duplicate vertex; Enter, click/tap first vertex after 3 points or Finish button validates and commits once. ESC or second touch cancels. Backspace / Geri removes unfinished vertex. Pointercancel, blur or hidden tab cancels gesture. On tool switch and unmount no stale area callback commits. No parallel event coordinator was introduced.

### Verification matrix

- GitHub changed-path scope, protected blob hashes and branch HEAD: VERIFY after checkpoint.
- New Node/TSX test: NOT_RUN. Command: npx tsx --test tests/document-studio/cad-area-stage05-contract.test.ts
- Existing area browser: NOT_RUN. Command: npx playwright test tests/document-studio/cad-stage6-area-measurement.spec.ts
- Typecheck: NOT_RUN (npx tsc --noEmit).
- ESLint: NOT_RUN (changed files).
- Actual DXF/DWG area and WCS/UTM/bulge, mobile touch/stylus/pinch, F5 and server recovery: NOT_RUN.
- One optional Vercel Preview deployment: user-authorized, not yet requested at commit creation. Check the actual result; no retry without a NEW stage/explicit permission.
- Main and Production must stay unchanged unless a separately justified release authorization exists.

### Acceptance blockers

Release-ready stays NO until full TypeScript/build tests, actual device and fixture checks, correct export INSUNITS header, remote server persistence/version and fallback regression pass. A preview build does not prove all browser scenarios.
Rollback: revert ONLY the ASAMA_05 stage commit; preserve the original renderer/parser/fallback and stages01-04. STOP; next ASAMA_06 only upon explicit subsequent 'devam'.


## 12. ASAMA_06 — Review-only selection, shape geometry, callout arrow and atomic markup history

Date: 2026-11-02 Europe/Istanbul.
Branch: internal-cad-v1-pro-review-r2-20261102
Stage code status: **KOD_HAZIR_DOGRULAMA_BEKLIYOR**. Runtime/playwright/TS verification may update only after actually executed. Not a release signoff.
User's deployment authorization updated: Vercel errors may be diagnosed, corrected and redeployed when justified. No uncontrolled repeated deploys or automatic Production promotion; each deployment state must be reported.

### Code-confirmed root causes, decisions, narrow diff

1. Existing src/lib/dokumantasyon/cad-review/hit-test.ts used **circle center=p1 and radius=|p2−p1|**, but src/components/dokumantasyon/preview/cad-review-overlay.tsx painted circle at midpoint(p1,p2), radius=half max axis delta. Result: circles could be picked in the wrong location. Now both use p1 as center and p2 as circumference point, preserving the intended stored circle geometry and world radius in review v1; render stroke is CSS-pixel stable.
2. The old cloud renderer generated an unbounded number of independent arc commands from rectangle dimensions in pixels, while hit-test selected a rectangle not the cloud outline. Existing cloud-generator.ts was improved with bounded radius/step/scallop count and rejecting degenerate cases. The actual SVG uses generateRevisionCloudSvgPath on projected CSS-pixel corners, and the hit-test uses the same generated points. A bounding box negative filter guards needless tessellation for distant clicks. Reversed drag produces the same cloud shape.
3. Review SVG markup group had pointerEvents:auto on click, while CadMarkupController listened on the underlying viewer viewport sibling: overlay swallowed some input before the controller could process it. ReviewItemRenderer SVG now stays pointer-events:none. Native viewport controller owns review hit-test; this does NOT enable source CAD object editing.
4. Previous markup controller only selected item on pointerdown; selectedItemIds and hoveredItemId were not passed from the parent into CADReviewOverlay, so selected/hover state and handles were not reliably visible. Parent now binds store session selected and hovered state, while the controller supports Shift+click multiple selections and displays a **real** center move grip only on selected editable shape items, not fake resize handles.
5. New own-world-geometry translation helper (markup-facade.ts) moves independent review pins, text, strokes, rectangle, circle, revision cloud, and callout tip+anchor. It NEVER touches source CAD entities and refuses move on measurement items or a closed review item. Mouse drag produces a transient draft preview (old source item hidden during move); releasing executes exactly **one store.updateItem** undoable transaction. Shift-click multi-selection is supported for selection + batch delete, not a misleading simultaneous multi-object move. Drag movement is calculated through the existing screenToWorld adapter, not hardcoded zoom scale.
6. New CadReviewStore.removeItems(ids) narrow bridge groups Delete of multiple selected review records into a SINGLE undo command restoring original indexes on Undo. Freehand eraser now targets only markup, not an overlapping measurement. Existing original-DWG entity data remains read-only; this is purely review geometry.
7. Pointed comment-pin, callout arrow, text and shape creation all check store.addItem success; rejected items cannot leave a phantom selected ID. The callout leader now draws a visible arrowhead toward its tip. Slow asynchronous prompt results are discarded when the controller is destroyed, canceled or tool switched. Invalid/oversize points, tiny shape dimensions and input capture/window blur/visibility/pointercancel are guarded. Shape review operations remain independent of MLightCAD's parser/renderer.
8. The review overlay displays statuses separately: hover stroke vs selected outline and editable selected MOVE grip; closed items remain selectable for inspection but do not offer moving grips until reopened. Active review layoutId is respected in hit-test and visible overlay. **There is no persistent generic visibility/readOnly item flag in the current v1 Zod schema**; this stage does not invent an incompatible migration or confuse source CAD layer visibility with review visibility.
9. src/components/dokumantasyon/preview/cad-upstream-viewer.tsx changed only necessary binding: session-selected/hovered IDs and active layout, safe markup error toast callback, read-only closed-item predicate and one-call multi-delete; no DWG worker/render or conversion edits.

### MLightCAD 1.6.2 version/license comparison (source references, no external code copied)

- Version-locked package @mlightcad/cad-simple-viewer 1.6.2 declares MIT. Repository LICENSE MIT:
  https://github.com/mlightcad/cad-viewer/blob/v1.6.2/LICENSE
  License blob SHA: ddef7211081889f7b1ef9c734a6d9907853f0008.
- Circle uses center + positive radius via AcApMarkupCircleCmd:
  https://github.com/mlightcad/cad-viewer/blob/v1.6.2/packages/cad-simple-viewer/src/command/markup/AcApMarkupCircleCmd.ts
  Blob SHA 0399070a4c8daef29cb3b4ebdf0a2cf912a2e3c6.
- Markup shape builder sizes cloud lobes by CSS pixels via view projection:
  https://github.com/mlightcad/cad-viewer/blob/v1.6.2/packages/cad-simple-viewer/src/command/markup/AcApMarkupShapeBuilder.ts
  Blob SHA 011d1c62b10ce64f1983f74b5361bfcd47dbceb0.
- Translation / hit test geometry:
  https://github.com/mlightcad/cad-viewer/blob/v1.6.2/packages/cad-simple-viewer/src/command/markup/AcApMarkupGeometry.ts
  Blob SHA 905b84f7800b6c0270fab122f58e416d8cb3d518.
- Existing in-repository cloud-generator algorithm and own small translation helpers were adjusted independently. **No upstream source vendored or verbatim ported; the links above are attribution to reference behavior, not code copies.** The GPL-3.0 converter/WASM distribution question from Stage01 remains separate P0 and is not resolved by upstream markup's MIT license.

### Test source created (NOT yet executed)

- tests/document-studio/cad-markup-stage06-contract.test.ts: pure node/tsx contract (10 tests), circle center/radius consistency, cloud bounded and reversed, controller draft→commit→undo, selected grip translation and one move undo, Shift multiselect + one batch-delete undo, layout/read-only separation, ESC/pointercancel/lostcapture/blur, tool switch, eraser preserves measurement, closed review lock.
- tests/document-studio/cad-markup-stage06-browser.spec.ts: physical CAD viewport desktop fixture, rectangle reverse drag, one SVG and one review store record, selected drag and Undo/Redo, F5 local recovery, original database entity count unchanged.
- Existing tests to re-run: tests/document-studio/cad-markup-tools.spec.ts, cad-review-core.spec.ts, cad-stage3-review-tools.spec.ts. Some pre-existing tests mention schema.fillOpacity, clearMarkupItems or active-store helpers not implemented in this stage; do not silently claim those tests passed or rewrite expectations to hide missing features.
- Recommended commands: npx tsx --test tests/document-studio/cad-markup-stage06-contract.test.ts ; npx playwright test tests/document-studio/cad-markup-stage06-browser.spec.ts ; npx playwright test tests/document-studio/cad-markup-tools.spec.ts tests/document-studio/cad-review-core.spec.ts tests/document-studio/cad-stage3-review-tools.spec.ts ; npx tsc --noEmit ; npm run build.
- All above stay **NOT_RUN** until actual runtime evidence. Structural GitHub compare verifies changed paths, not TypeScript semantics or actual mobile UX.

### Regression and acceptance safeguards

- SVG zoom pan, reverse drag and pixel hit tolerance have pure test coverage but real browser/device result must be recorded. Source entity selection remains outside this review hit-test; source CAD erase/move/copy not used. Markup move is only for independent review records, not source geometry or measurement world anchors.
- Multi-selection supports Shift toggle and atomic Delete. Only one actively selected review item is moved by drag; no unimplemented batch move or resize control is shown.
- Failed Add/Update now reports an error via host toast, without fake saved items. Markup store v1 retains raw world coordinates, style, status, review JSON and single command history.
- Stage03 OSNAP, Stage04 distance, Stage05 area runtime gates remain open. Existing Stage05 Preview deployment dpl_7SgMRPgehVXN1p9nAkT4Bpump6Rc failed with Vercel 'Resource provisioning failed' before build logs (not a verified TS error). Do not treat lack of logs as a successful build.
- No customer data migration, worker/plugin dependency update, or Preview->Production promotion. Continue release gate only after verified build, unit fixture tests and source unchanged.

### Checkpoint, deploy, rollback

Stage06 atomic code checkpoint: 5545f29232897ebd112d80e69831dcde396f6220 (10 scoped source/test/doc files), followed by this docs-only post-deploy outcome note. GitHub compare must show no protected code changes in docs-only update.
Preview ASAMA_06: CREATED deployment dpl_vaXMNnEkihGdtJVoVbfAaBfXkPXX from commit 5545f29232897ebd112d80e69831dcde396f6220. Result ERROR / BUILD_FAILED: "Resource provisioning failed" before any available build log (events=[]). Preview URL https://muhendislik-site-ei919ixw4-huseying5713-2819s-projects.vercel.app is NOT a verified functional preview. Earlier ASAMA_05 deployment dpl_7SgMRPgehVXN1p9nAkT4Bpump6Rc showed the same provisioning failure. Vercel project linked GitHub repo is correct; project connector list [] and account/project integration configuration list [] (read-only checks); team plan hobby; official status page shows no global Nov 02 incident. Root cause not determined; platform Git-source provisioning / account setup is a possibility, NOT a proven diagnosis. No build logs or TypeScript error, so code cannot be blamed nor declared PASS. No second deployment triggered without a concrete remediation. User allows retry after fixing a demonstrable error; random configuration changes prohibited. Production/main unchanged.
Rollback: revert ONLY ASAMA_06 changes on internal branch, keep ASAMA_01–05 and all frozen engine files. Stop until a new user 'devam' for ASAMA_07.


### Post-commit deployment failure evidence (ASAMA_06)

- Deployment ID: dpl_vaXMNnEkihGdtJVoVbfAaBfXkPXX; created once for Preview. State: ERROR, errorCode BUILD_FAILED, errorMessage Resource provisioning failed; events log empty.
- Matched error during ASAMA_05: dpl_7SgMRPgehVXN1p9nAkT4Bpump6Rc. Stage06 did not trigger additional deployments after unsuccessful provisioning.
- Vercel staff reference: https://community.vercel.com/t/vercel-deployments-failing-with-resource-provisioning-failed-and-0ms-build-time/32451/6 states that suspended third-party integrations can cause this error; project connector/integration configuration lists returned none, so this does **not** establish the cause here.
- Official public status https://www.vercel-status.com/ reported no incident on Nov 2, 2026; absence of a global notice does not prove project health.
- No usable Preview URL, no actual CAD viewer screenshots, no runtime/tests/TS PASS. Do not auto-deploy or touch production settings. Once a stable source build can provision, execute the exact Stage06 tests and review earlier Stage03–05 regressions.


## 13. ASAMA_06 FINAL — Actual deploy and test evidence (2026-11-02)

This is the later ACTUALLY EXECUTED verification record and supersedes older ASAMA_06 notes above saying NOT_RUN or showing the first failed Vercel Preview. Historical failed attempts are retained for audit. This stage is targeted-acceptance complete, but overall release-ready remains NO.

### Vercel Preview / commits

- Production and main were never changed. Branch: internal-cad-v1-pro-review-r2-20261102.
- User reported Neon configuration corrected in another chat: Production neon-bronze-engine, Preview/Development belgeler-stage13-neon-test, automatic Neon Preview branch creation OFF. Secret DB values were NOT decrypted/read or modified here; only the subsequent Vercel build demonstrated the previous provisioning blocker had cleared.
- Verification Preview dpl_FjfN29yVrowqgkBY9yqchvnKpHuh: builder provisioned, Git cloned, npm installed, TypeScript failed with TS2393 duplicate popAreaMeasurementPoint in adapter.ts (two implementations).
- Corrective source commit 9e4942282c3098ae2caae851e45d9b56000f6907 removed one redundant unguarded adapter method, retaining the existing guarded implementation; Preview dpl_CTcNDJy32tNU1aRoHaeukUVqo6QY READY.
- Corrective source commit 0377884d3d24bfe98e9e6911dbbc997ba977403b: (1) area pointer-click first-vertex completion tolerance 20 CSS px -> 5 CSS px, (2) optional legacy lineDash no longer filled with synthetic default and legacy JSON round-trips losslessly, (3) review host uses React state snapshots for ready CAD adapter and selected/hovered/layout instead of mutable ref.current inside render. This eliminated all 24 reported react-hooks/refs lint errors without altering protected renderer/parser/worker.
- Final latest source Preview dpl_EWc9zfT4BgEyAjDHTq3qFdBPosiS from source SHA 0377884d3d24bfe98e9e6911dbbc997ba977403b is READY; completed Next.js production build and TypeScript. Preview URL: https://muhendislik-site-167tsjzy3-huseying5713-2819s-projects.vercel.app. Preview is SSO-protected; successful deployment is not an external unauthenticated access test.
- Test-only commit ebf82b9a579e36d21f56c91b9f372af5843b4f9b and test-only commit 7f30174a2ca98b7aef8e55bb1aedbf4b5ffc1f36 do not change runtime app files or Preview source. Tests are excluded from Preview uploads by .vercelignore. A docs-only audit commit follows.
- Stage06 original shape/hit-test/selection source commit 5545f29232897ebd112d80e69831dcde396f6220. No production deployment, no main merge.

### ACTUAL verification matrix

| Gate | Outcome | Exact basis |
|---|---|---|
| Vercel provisioning and full Preview build | **PASS** | dpl_EWc9zfT4BgEyAjDHTq3qFdBPosiS READY |
| TypeScript | **PASS** | isolated environment: tsc -p tsconfig.next.json --noEmit --incremental false, exit 0 |
| Changed source and Stage06 spec ESLint | **PASS** | ESLint --quiet 0 errors; later modified test specs ESLint --quiet exit 0 |
| Stage06 pure Node/TSX shape, hit-test, history and gestures | **10/10 PASS** | real isolated Sandbox execution |
| ASAMA_02 to ASAMA_06 combined Node/TSX contracts | **47 PASS, 0 FAIL, 1 TODO (48 tests)** | one explicit TODO for Stage08 incorrect DXF export INSUNITS; no silent PASS |
| New ASAMA_06 Chromium Playwright E2E | **1/1 PASS** | real local DXF fixture upload, reverse rectangle drawing/draft, one record and one SVG item, move, Undo/Redo, F5 restore, original CAD database entity count unchanged |
| Existing cad-markup-tools and cad-review-core Chromium | **8/8 PASS** | real local DXF, markups, selections, source immutability, isolated server GET/PUT/409 |
| Older cad-stage3-review-tools spec | **BLOCKED before collection** | imports nonexistent src/lib/dokumantasyon/cad-review/active-store and also expects unsupported older store methods / fillOpacity; not marked PASS |
| Additional real DWG corpus, real mobile/stylus, export DXF reimport, cross-device persistence | **NOT_RUN / BLOCKED** | outside completed Stage06 targeted browser test; later stages and release verification required |
| Production, main and Production Neon | **UNCHANGED** | no source merge, prod deploy or prod data mutation |

### Browser test corrections and scope

- New Stage06 browser spec originally read the adapter from the outer section; the real V1 adapter is exposed on window.__cadAdapter / inner viewport. Fixed to read the existing real adapter rather than introduce a debug API.
- New Stage06 browser spec initially opened the Shapes dropdown and drew behind the still-open popover. It now uses the primary Shapes button, which selects rectangle directly, so CAD viewport receives pointerdown without a menu intercepting it.
- Browser CSS pixel dispatch plus inverse world projection produced approx 2500.00004015 instead of mathematically exact 2500. Test now uses absolute 0.0005 CAD world-unit numeric tolerance (toBeCloseTo(...,3)), with raw point geometry assertions retained.
- Two historical browser specs also incorrectly accessed the adapter on the outer section. Fixed test-only. CAD readiness.bounds was sometimes null when the visual host was marked ready; the legacy immutability test now waits for real computed source bounds and then compares both source entityCount and full before/after bounds without weakening the geometry oracle.
- No changes to V1 parser/renderer/worker/fallback, snappers, dependencies, existing CAD fixture data, user data, or production configuration. Markup edit is confined to review records.

### Open gates and explicit stop

- The historical cad-stage3-review-tools.spec.ts cannot be collected because the referenced active-store module does not exist; also outdated test contracts differ from current v1 schema. This remains a LEGACY TEST MAINTENANCE BLOCKER, not a new runtime failure. Do not add a global store shim merely to make an obsolete test pass.
- Review DXF export still has the known wrong INSUNITS=6 header for raw millimeter drawings; Stage08 open TODO. Server source-hash synchronization/remote conflict recovery/cross-device save is not proved by isolated local API 409.
- Real mobile, real DWG and browser variability tests must still be run before overall release. The source DWG V1 engine and existing production remain protected. GPL distribution notice/WASM risk separate P0.
- **STOP AFTER ASAMA_06.** ASAMA_07 must not begin without the user's separate explicit "devam".

## 14. ASAMA_07 — completed, verified, STOP (2026-11-02)

Work branch: `internal-cad-v1-pro-review-r2-20261102`.
Source commit: `0c093b8733f658825a20dc5283bfaafc2b34522d`.
Runtime source paths changed only within the review controller, freehand simplifier/facade, small review-input dialog and narrow in-app viewer binding. Test files were added. No parser/renderer/worker/fallback or dependency changes and no modifications to source CAD entities.

### Implemented
- Replaced review pin, text and callout `window.prompt` with accessible in-app Radix dialog and textarea. Save/cancel/empty validation, length limits and sanitization; asynchronous responses fenced on tool change, Escape, cancellation and viewer teardown; focus management. Other app dialogs/prompt calls untouched.
- Review freehand stroke takes mouse, pen/coalesced events and touch pointer samples; filters/simplifies in **CSS pixels** while preserving stored world-space vertices. Bound of 5000 samples per stroke; live draft notifications via requestAnimationFrame when supported. One committed history transaction.
- Review eraser uses review-only hit testing and one undoable batch deletion per gesture. Measurement annotations and original CAD source entities are never eraser targets.
- Gesture hygiene: pointer identity, pointer capture release, second-touch rejection, Escape, lost capture, blur, backgrounding, tool switches and cancellation; avoid late or partial commits.

### Actual test evidence
- `tsx --test` across stage02, stage03, stage04, stage05, stage06, stage07 contracts in isolated Vercel sandbox: **55 total, 54 passed, 0 failed, 1 planned TODO** (known Stage08 DXF INSUNITS bug).
- New Stage07 contracts: **7/7 PASS**, including 4e6-offset/zoom cases, coalesced stylus input, multi-touch cancellation, single-undo eraser and async text/pin stale-result safety.
- Independent `tsc -p tsconfig.next.json --noEmit --incremental false`: **PASS**, exit 0.
- Targeted ESLint on changed source and contract tests: **PASS**, exit 0.
- New `cad-stage07-browser.spec.ts` on isolated development server with Chromium and real DXF fixtures: **2/2 PASS** — pin/text dialog validation, save/cancel and sanitization, Undo/Redo and F5 recovery, freehand stroke then erase/Undo/Redo, original DXF entity count unchanged.
- Browser tests were run against the sandbox source before GitHub upload, and GitHub source commit records these exact seven scoped files. The stage07 GitHub commit was already present when final branch validation began; do not re-apply it.
- **No ASAMA_07 Preview or Production deploy**. Latest ready Preview from ASAMA_06 is not the Stage07 code; branch-only test verification is the basis of this checkpoint.

### Outstanding, not claimed passing
- Real physical touch/stylus devices and the broad DWG file corpus were not exercised. Browser real-DXF desktop and pure touch pointer contracts passed, not physical mobile acceptance.
- Pre-existing `cad-stage3-review-tools.spec.ts` remains uncollectable due to nonexistent `active-store` module. This is a legacy test-maintenance item, not a stage07 runtime PASS.
- DXF export `$INSUNITS`/review export, persistence reconciliation, remote revision handling remain Stage08 work. Cross-device release not accepted.
- Production, `main`, existing DWG viewer/renderer and DB left unchanged.
- **STOP. ASAMA_08 ONLY AFTER NEXT USER `devam`.**


## 15. ASAMA_08 — review persistence, backwards compatibility, valid exports; targeted tests PASS (2026-11-02)

Work branch: `internal-cad-v1-pro-review-r2-20261102`. Parent before this stage: `4b454ffe4d0850e3ff48bb3b3753220a6547a52f`. Stage source + tests + this record will be checkpointed as one atomic GitHub commit. **Do not treat this as production acceptance**.

### Root causes and changes

1. DXF review exporter previously wrote `$INSUNITS=6` unconditionally, silently interpreting raw millimeter or unitless world coordinates as metres. Now exporter takes the actual CAD adapter unit context (mm=4, cm=5, m=6, in=1, ft=2, unknown/calibrated raw-unit=0), or safely infers only an unambiguous persisted source measurement context; older records with no reliable unit remain unitless. Toolbar quick-DXF and review export modal use the same source-unit argument. Review-only entities retain unscaled world coordinates; original DWG/DXF unchanged.
2. Export dialog previously created a PNG Blob and named it `.pdf`, which was not a PDF file. Existing `pdf-lib` is reused to embed captured CAD+review PNG in an actual one-page PDF. No new dependency. PNG/PDF capture now passes the overlay SVG for committed review items, excludes drafts, hover move grips, and respects enabled export filters; unsuccessful capture remains an error rather than a false download success.
3. Previously the viewer requested `GET /api/dokumantasyon/files/:id/review` with no required source SHA and expected the wrong response envelope; no server PUT happened in normal review sessions. The stage introduces conservative conditional synchronization: obtain real file-version SHA-256 via existing authorized version endpoint, fetch matching `{document}` with both keys, keep the existing subscribed store, debounce PUT with `expectedRevision`, acknowledge only the sent item snapshot, retain late edits, stop on 409 or divergent local/cloud data, never overwrite a competing revision. Local copies are Zod-validated and scoped by stable original source version (not signed URL). Cache entry from a different source revision cannot be silently reanchored; old cache data remains intact for recovery.
4. **Important remaining limitation, not concealed:** Initial v1 file-version records in `getFileVersions` often carry `sha256_hash=null`; without a trustworthy source hash, the client deliberately cannot claim safe server synchronization and remains local-only. A future verified SHA backfill from actual source bytes is needed for complete cross-device persistence. The current stage does not pretend a hash-of-path is a hash-of-file, does not mutate production databases, and does not silently discard divergent records.
5. A legacy browser export test looked for an adapter on the outer host and waited for nonnull `bounds` on a TEXT-only fixture. Test-only fix uses the actual exposed `window.__cadAdapter` and waits for exactly **4 real source entities**, then asserts equal before/after. This fixes a test harness error, not source rendering.

### Actually executed verification — sandbox source before GitHub transfer

- Full Next.js `npm run build`: **PASS**, exit 0.
- `npx tsc -p tsconfig.next.json --noEmit --incremental false`: **PASS**, exit 0.
- Targeted ESLint `--quiet`: **PASS**; `git diff --check` clean.
- Stage02–08 Node/tsx contract suite: **61/61 PASS, 0 fail, 0 TODO**. The former Stage04->Stage08 hardcoded INSUNITS TODO is now a real positive regression test, not hidden.
- Existing `cad-review-core.spec.ts` Chromium: **4/4 PASS**, including local test API GET/PUT/409 and original source immutability.
- Existing `cad-review-export.spec.ts` Chromium: **3/3 PASS** (2 initial passes, third passed after correcting test host/ready oracle), includes strict four-TEXT-entity source immutability.
- New `cad-stage08-browser.spec.ts` Chromium: **1/1 PASS** on real uploaded DXF. Pin/text -> F5 persisted, actual downloaded JSON and DXF, actual PNG signature `89504e470d0a1a0a`, actual PDF magic `%PDF-` and pdf-lib page parsing; original source entity count before/after unchanged.
- Browser dependencies were initially absent in universal sandbox (missing `libglib-2.0.so.0`). Installed only into **isolated test sandbox**; first unlaunchable attempt is **environment BLOCKED**, not application FAIL. Following Chrome dependency fix, targeted E2E tests passed as above.
- No Preview deploy, Production deploy, main merge, data/schema migration, renderer/parser/worker/fallback or dependency changes. Sandbox builds/tests are NOT deployments. Stage08 deploy count: **0/1**.

### Remaining release gates / risks

- **NOT_RUN**: physical iOS/Android/stylus, cross-device/server autosave when legacy v1 SHA is absent, production Neon version reconciliation, source-versus-review image pixel comparison across DPR, full DWG regression corpus, DXF reimport in independent CAD. Earlier legacy `cad-stage3-review-tools.spec.ts` imports missing `active-store` and remains a test maintenance blocker, not a new Stage08 runtime failure.
- **P0 from ASAMA_01 still open:** GPL-3.0 converter worker/WASM distribution notice / legal review; not changed here.
- Original CAD file bytes are not saved back or edited by Stage08 review workflows. Source entityCount was verified in browser fixture; no claim of a full DWG-byte hash check on customer content.
- Roll back this stage's scoped source/test/docs diff only if needed; previous Stage01–07 checkpoints and Production are preserved.
- **STOP:** ASAMA_09 only after the user's next explicit `devam`. Overall `RELEASE_READY=NO` until open evidence gates are closed.

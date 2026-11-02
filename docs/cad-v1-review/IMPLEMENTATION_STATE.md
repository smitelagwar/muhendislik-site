# CAD V1 Professional Review R2 — IMPLEMENTATION_STATE
Plan ID: CADV1-PRO-REVIEW-20261102
Plan revision: 2
Date: 2026-11-02 (Europe/Istanbul)
Planning status: PLAN_HAZIR
Execution status: KOD_HAZIR_DOGRULAMA_BEKLIYOR
Completed stages: ASAMA_01, ASAMA_02 (code checkpoint; runtime verification pending)
Active stage: none
Next stage: ASAMA_03 (ONLY after user says devam)
Stage 01 acceptance: DOCUMENTED_BASELINE; runtime/device verification NOT_RUN
Release-ready: NO
Branch: internal-cad-v1-pro-review-r2-20261102
Checkpoint: this document's containing branch HEAD (first stage checkpoint; see branch history)
Checkpoint parent: 32a1c818d06c5b191cdc5bd4efdeaf71407e6559
Plan source: attached revision 2 copied verbatim to PLAN.md
Deployment: no Preview, no Production, no main merge
Scope: ASAMA_01 documented baseline + ASAMA_02 additive review data, unit, history and test contract; engine frozen

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

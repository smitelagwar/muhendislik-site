# L10 local layout, stale-chunk, and external-reference acceptance

**Date:** 2026-10-18  
**Scope:** local L10 work group only; this does not close the L10 native/same-source exit gate.  
**Candidate:** `codex/srdr-dwg-motor-v2-fidelity`, HEAD `4b51ebe6b1470c6a247e03158dfe4b5359621c97` (dirty worktree preserved)  
**Compiler:** `cad-v2-compiler-2026.09-v71`

## Accepted local behavior

- A Chromium camera regression was first run against the previous implementation and failed: after zoom/pan on Model, switching to a sheet and back restored `k=6.08, x=640` instead of the Model view `k=9.5, x=600`. Camera state and fit scale are now stored per layout and restored when returning to that layout. The regression passes after the change.
- A delayed `SHEET_A` chunk was held while switching back to Model. The old response is now diagnosed as `stale-visibility`; the active Model canvas pixel hash before and after release is identical. The debounce captures layout/camera generation so a prior layout cannot append visible content after switching.
- DXF pair scanning now preserves diagnostic visibility for `IMAGE`, `PDFUNDERLAY`, `DWFUNDERLAY`, `DGNUNDERLAY`, `OLE2FRAME`, and `OLEFRAME` records that the data-model entity iterator can omit. It emits unsupported diagnostics only and does not invent image, underlay, or OLE geometry. Synthetic missing-companion cases retain a normal source `LINE` and compiled Model chunk while reporting the expected unsupported handles/types and degraded quality.
- The unsupported external-entity regression is part of `check:cad-v2:unit`. Existing local viewport/layer/XCLIP fail-closed coverage remains in that gate; it does not establish AutoCAD parity.

## Verification

- Before/after browser regression: camera restore test **PASS**; stale layout chunk test **PASS**.
- Isolated Chromium group (`DOK_LOCAL_DATA_DIR=.test-data/cad-v2-l10-layout-acceptance-20261018-r1`, fixture preservation enabled): `tests/document-studio/cad-v2-layout-viewport.spec.ts`, filter `L10|pafta seçimi WebGL host içindeki aktif layout chunk'larını değiştirir|aktif pafta yalnız görünür fill ve glyph chunk'larını ister` — **4 passed**.
- `npx tsx tests/cad-v2/unsupported-entity-diagnostics.test.ts` — **PASS**.
- `npm run check:cad-v2:unit` with the new diagnostic test included — **exit 0 / PASS**.
- `npx tsc --noEmit --incremental false -p tsconfig.next.json` — **exit 0 / PASS** after resolving the ES target compatibility in the new source-order counter.
- Scoped `git diff --check` for the changed camera, decoder, browser spec, unit test, and package manifest — **exit 0 / PASS**.

## Open acceptance boundary

This group accepts selected local Model/Layout camera restore, stale response isolation, and fail-closed external-reference diagnostics. The full L10 exit criteria remain **OPEN**: supported-layout AutoCAD ROI/oracle comparison, same-source viewport scale/twist/clip/draw-order parity, and external-reference companion behavior were not run against the original screenshot source. As already recorded for L06, the original DXF bytes and SHA-256, sanitized HAR plus deployment/source digest, and a valid Autodesk-supported AutoCAD LT executable are still required. The supplied screenshots are observational evidence of `prepare` HTTP 200 followed by chunk 404 / missing `chunk_model_004`; they do not provide those inputs. No external input was re-searched in this group.

The synthetic DXF tests prove omission detection and safe degradation, not availability or rendering fidelity of external payloads. LibreDWG error 68 and local fixtures do not count as a clean native decode or a native oracle.

No reset, stash, merge, commit, push, PR, deployment, production-data test, or default-engine change was performed.

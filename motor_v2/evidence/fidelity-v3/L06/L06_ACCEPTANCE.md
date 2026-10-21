# L06 — REA research and AutoCAD reference set

Plan: `C:\Users\hsyn\Desktop\muhendis-mimar-portali\PLAN\DWG_DXF_MOTOR_V2_GPT_6_LUNA_EXTRA_HIGH_PLANI.md`  
Recorded: 2026-10-17 UTC / 2026-10-18 local. Candidate: `codex/srdr-dwg-motor-v2-fidelity` at `4b51ebe6b1470c6a247e03158dfe4b5359621c97`.

## Completed local work

- Verified R001–R004 exact corpus byte counts and SHA-256 values against `tests/cad-v2/fixtures-manifest.json`. Detailed candidate compiler reports are in `browser-census-R001.json` through `browser-census-R004.json`; no native oracle values were invented.
- Ran the repository G15 corpus/service acceptance in isolated `test-output/cad-v2-tmp/g15-56840-1792271587179` storage. Default Node heap first failed with exit 134/OOM at R003. The same test passed with inherited `NODE_OPTIONS=--max-old-space-size=12288` in 214.3 s. R001/R002 warm prepare improvements were 98.3% and 98.9%; 436 chunks passed byte-length/SHA verification. G15 output SHA-256: `59A15F5C26B21B313E2E000F39E1FA3BB7D51A648F1A6C12E4D272469079FB1D`.
- The detailed census found candidate `qualityStatus=degraded` for all four corpus files. Missing-font counts were R001 1,017, R002 0, R003 2,333, R004 3,398. Unsupported entity counts were R001 0, R002 0, R003 123, R004 1. Candidate Model type/layout/style/diagnostic data and chunk sizes are in each JSON report.
- Every candidate report exposed 2–3 layout records but zero canonical viewport records. Their compiled layout bboxes are candidate output, not independent native measurements. Native Model/Layout full-view and ROI comparison therefore remains open.
- Added a read-only camera/profile/ROI PNG comparison CLI and tests; added an AutoLISP inventory script and startup script for verified AutoCAD LT, plus a static safety test. No reference drawing was modified. Four SHA-identical read-only copies were prepared outside the repo.
- Isolated browser worker build exactly matched the dirty candidate `public/cad-v2/cad-v2-scene-worker.js` hash. Compiler service isolated outputs and current ignored local `dist/` hashes differ; exact data is in `REA_STATIC_ANALYSIS.md`.

## Acceptance matrix

| L06 item | State | Evidence/limit |
|---|---|---|
| Candidate REA static run | **PARTIAL — not PASS** | Browser worker/child-entry graph produced. The 6.48 MB compiler entry hit REA heap limit; three focused retries, including a 4 GiB worker attempt, still hit `Maximum call stack size exceeded` under REA's fixed 2 MiB analyzer-worker stack. Exact results and hashes are in `REA_STATIC_ANALYSIS.md`. |
| Network/HAR separation | **HAR NOT_RUN** | Only the two supplied screenshots are available. `NETWORK_HAR_OBSERVATIONS.md` keeps them separate from static graph findings. |
| Source/build/worker relation | **Browser worker PASS; compiler deploy correlation OPEN** | Fresh worker bundle equals public asset. Current ignored compiler `dist` differs from isolated current-source output; no repository image-build/source digest or deployment digest was found. This does not prove what production served. |
| AutoCAD LT capability/runtime | **Capability documented; native runtime NOT_RUN** | `acadlt.exe` is R26.0.60.0.0 but Authenticode reports `HashMismatch`, so no GUI process was launched. `accoreconsole.exe` signature is valid but no LT headless support was assumed. |
| R001–R004 native Model/Layout references, full images, ≥10 ROIs, numeric oracle | **NOT_RUN** | No native image or numeric measurements were captured. Candidate census and synthetic harness tests do not substitute for this gate. |
| Browser camera/scale/viewport/profile harness | **Local harness PASS; native parity NOT_RUN** | 5/5 harness and safety tests PASS; fixed thresholds and blank-canvas rejection are enforced. Synthetic cases only. |

## Verification

- `npx tsc -p tsconfig.next.json --noEmit --incremental false` — PASS.
- `node --max-old-space-size=6144 node_modules/typescript/bin/tsc --noEmit --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler --types node scripts/cad-v2/run-l06-browser-census.ts` — PASS.
- `node --test tests/cad-v2/reference-comparison-harness.test.mjs tests/cad-v2/autocad-readonly-script-safety.test.mjs` — **5/5 PASS**.
- `node --check scripts/cad-v2/compare-reference-profiles.mjs` — PASS.
- Scoped `git diff --check` on the L06 files — PASS.

## L06 disposition

Independent local work is complete. L06 is **not closed**: native references are `NOT_RUN`; production request/HAR/source correlation is `OPEN`; full REA compiler-index coverage remains constrained. To close those gates, provide (1) an Autodesk-verified valid LT GUI executable, (2) the exact FAIL-404 DXF bytes and SHA, and (3) a sanitized failure HAR with its deployment/source digest. No request is made to weaken thresholds.

Next local package after this group: L07 decode/census work may proceed while these external/native gates remain explicitly open. Commit, push, deployment, Docker image publish, and default-engine change: none.

# L08 local acceptance slice — source-backed HATCH runtime refinement

Date: 2026-10-18
Plan: `C:\Users\hsyn\Desktop\muhendis-mimar-portali\PLAN\DWG_DXF_MOTOR_V2_GPT_6_LUNA_EXTRA_HIGH_PLANI.md`
Candidate: `C:\Users\hsyn\.codex\worktrees\91a0\muhendis-mimar-portali`, branch `codex/srdr-dwg-motor-v2-fidelity`, HEAD `4b51ebe6b1470c6a247e03158dfe4b5359621c97`
Compiler identity: `cad-v2-compiler-2026.09-v71`; pipeline `fidelity-v3-p08`; render ABI `three172-cad2d-v2`.

## Scope implemented

- The compiler retains bounded, immutable HATCH source loops only for eligible direct standalone solid fills. The source fill must start within 16,384 triangles; each source is capped at 128 KiB and aggregate source metadata at 512 KiB per chunk. Stable source IDs keep each fill's command range isolated.
- The browser host sends eligible fills through the scene worker refinement request. Refinement derives world tolerance from the current camera scale and the 0.25 CSS-pixel target, returns Float64 vertices, and checks the encoded Float32 world/chunk-local error and boundary error before installation.
- Fresh fill triangles and dependent painter-order/draw-command indexes and triangle runs are replaced atomically. HATCH and curve refinements share the host update path. Failed, stale, unsupported, or over-budget work leaves the already-rendered fill visible and reports degraded quality.
- Peak memory admission accounts for old and new GPU resources, worker output, metadata scratch, and retained source. Accepted replacements update the renderer cache cost and quality diagnostics.
- Nested or mirrored INSERTs, clipping/XCLIP, paper viewports, spatially split fills, patterned fills, and oversized sources do not advertise an untransformed source. They retain the static mesh and stay outside this runtime-refinement acceptance slice.

## Verification

- `npx tsx tests/cad-v2/hatch-fill-runtime-integration.test.ts` — PASS on the current candidate; source metadata, worker-ready remesh, Float32 error check, atomic command replacement, peak budget, and fail-closed nested/viewport cases.
- `npm run check:cad-v2:unit` — PASS, exit 0 on the current candidate, including HATCH topology, quality, refinement, and runtime integration tests. LibreDWG R001 error-code-68 messages remain warnings and are not clean-decode evidence.
- `npm run check:cad-v2:ui` — PASS, 28/28 Chromium scenarios, exit 0; includes the live source-backed HATCH render/zoom regression and the L05 lifecycle/listener test.
- `npx tsc --noEmit --incremental false -p tsconfig.next.json` — PASS.
- Scoped ESLint for the new HATCH remesh/runtime modules and associated tests — PASS. Broader lint on the already-dirty worker-client test still reports its existing `any` findings; no broad lint pass is claimed.
- Scoped `git diff --check` for the runtime, tests, and package registration — PASS.

## Open acceptance

L08 remains OPEN. This slice proves the runtime path only for the explicitly eligible direct standalone solid HATCH profile. The plan's remaining geometry/topology profiles and independent native AutoCAD numeric/raster/ROI comparison are not accepted by this evidence. Unsupported transformed, clipped, viewport, partitioned, or patterned contexts remain static and fail closed for runtime remeshing. Native same-source AutoCAD evidence is still blocked by the L06 inputs recorded in `DWG_PLAN_DURUMU.md`; no exactness or full-native-parity claim is made.

## Follow-up — unsupported patterned HATCH fail-closed behavior

- Red evidence: the new scene-level regression failed before the fix because the non-solid ANSI31 fixture was compiled with qualityStatus exact.
- The compiler now suppresses triangle fill emission for non-solid patterned HATCH entities, retains the transformed boundary, and marks the scene degraded with UNSUPPORTED_HATCH_PATTERN. The same rule and diagnostic propagate through mirrored/nested INSERT expansion.
- Pattern origin/angle/scale line rendering is still unsupported. These fields are no longer misrepresented as a solid fill or exact result.
- Verification: the direct and nested compilation regression passes; the full npm run check:cad-v2:unit gate passes; the focused Chromium canvas regression passes 1/1 and confirms a visible boundary with an empty interior; TypeScript and scoped diff checks pass. ESLint passes for the new unit test. Broader lint on the existing dirty scene/entity/browser files remains blocked by pre-existing any/prefer-const findings.
- This follow-up does not close L08 or establish native pattern parity.

## Follow-up — invalid HATCH boundaries and bounded validation

- The compiler now validates HATCH boundary coordinates, degenerate/zero-length edges, anchored signed area, zero-area loops, and self-intersections before triangulation. The sweep-line comparison budget is capped at 500,000 segment comparisons; boundary vertex validation is capped at 16,384 vertices.
- A bowtie/self-intersection boundary is classified `HATCH_BOUNDARY_INVALID`, produces no fill, and retains its finite outline. A non-finite coordinate produces no unsafe mesh or outline stroke. A 16,385-vertex boundary is classified `HATCH_BOUNDARY_VALIDATION_LIMIT_REACHED` and produces neither mesh nor unsafe outline. Scene quality is degraded and the manifest exposes the diagnostic.
- Red→green regression coverage exercises the patterned-false-solid defect, bowtie, NaN, and vertex-cap path. The current run: `npm run check:cad-v2:unit` — PASS, exit 0; `npx tsc --noEmit --incremental false -p tsconfig.next.json` — PASS, exit 0; new unit test ESLint — PASS; scoped `git diff --check` — PASS. The focused Chromium canvas regression — PASS 1/1 (14.3 s test time, 44.9 s process); visible outline ink remains while center fill ink stays absent.
- A first attempt to import the real compiler into the Playwright browser spec failed during test discovery because the current `@mlightcad/shx-parser` bundle raises `ReferenceError: exports is not defined in ES module scope`. That import was reverted; compiler behavior remains covered by the unit regression and renderer behavior by the passing canvas regression. This harness import failure is not counted as a product-test pass.
- Broad ESLint across the already-dirty compiler/visitor/scene/browser files still reports existing `any`, `prefer-const`, and unused findings. No broad lint pass is claimed.
- Pattern origin/angle/scale line rendering, independent numeric geometry profiles, full DPR/Model-Paper seam/draw-order gates, and same-source AutoCAD raster/numeric/ROI parity remain open; this evidence does not close L08.

No commit, push, pull request, deployment, or default-engine change was made.

## Follow-up — bounded dashless patterned HATCH rendering and work cap

Date: 2026-10-18
Plan: `C:\Users\hsyn\Desktop\muhendis-mimar-portali\PLAN\DWG_DXF_MOTOR_V2_GPT_6_LUNA_EXTRA_HIGH_PLANI.md`
Candidate: `C:\Users\hsyn\.codex\worktrees\91a0\muhendis-mimar-portali`, branch `codex/srdr-dwg-motor-v2-fidelity`, HEAD `4b51ebe6b1470c6a247e03158dfe4b5359621c97`
Compiler: `cad-v2-compiler-2026.09-v71`; pipeline `fidelity-v3-p08`; schema `1`; render ABI `three172-cad2d-v2`.

### Implementation and support boundary

- DXF/DWG decoder adapters preserve pattern definition angle, base, offset and dash data. DWG entity pattern angle is normalized from radians; explicit DXF definition angles are not rotated a second time. Missing dash arrays remain missing. Effective definition-line spacing is used as decoded; the entity pattern angle rotates the definition frame.
- `src/lib/cad-v2/compile/hatch-pattern-geometry.ts` clips continuous dashless line families against validated closed HATCH loops with odd-parity intersections, including holes. A half-open crossing rule counts shared vertices once and ignores a line coincident with a boundary edge. Projection bounds are computed from local point projections, so a small drawing at a large world origin does not expand work or lose clipping precision.
- Supported profile is deliberately bounded: at most 16 line families, 2,048 repeated lines per family, 50,000 output segments, and 500,000 family-line × boundary-edge intersection checks. Dashed/malformed/missing pattern data, zero spacing, non-normal hatch style, double patterns, open/invalid loops, and any cap overflow return unsupported/limit with no pattern segments. The scene retains safe boundary linework, emits no solid triangles for patterned fill, and stays degraded with `HATCH_PATTERN_NATIVE_PARITY_UNVERIFIED` or the explicit unsupported/limit diagnostic.
- Initial scanline testing exposed an odd intersection count at polygon corners; the half-open crossing fix made the rectangle and hole regressions pass. The added 16,384-edge circle regression verifies that intersection-work exhaustion returns `limit` before an unbounded scan begins.

### Verification on this candidate

- `npx tsx tests/cad-v2/hatch-pattern-rendering.test.ts` — PASS, including rectangle clipping, a fully empty hole interval, 45° perpendicular spacing, entity rotation, 1e9 world origin, missing/dashed source fields, family cap, and the new intersection-work cap.
- `npm run check:cad-v2:unit` — PASS, exit 0 after the cap regression was added. This run also included `chunk-composite-precision.test.ts`, curve/spline/affine/HATCH coverage, and the broader CAD V2 unit gates. LibreDWG error-code-68 output from R001 remains explicitly not clean-decode evidence.
- `npx tsc --noEmit --incremental false -p tsconfig.next.json` — PASS, exit 0.
- Scoped ESLint for `hatch-pattern-rendering.test.ts`, `hatch-pattern-geometry.ts`, and `hatch-pattern-record.ts` — PASS. Scoped `git diff --check` for those files — PASS.
- Candidate `npm run check:cad-v2:ui` — PASS, 30/30 Chromium scenarios (11.1 minutes); it includes the bounded patterned-HATCH canvas case and selected DPR 1/2/3 curve-raster and affine-glyph scenarios. The dedicated bounded-pattern browser regression was also PASS 1/1. The final change after that UI run was the pure intersection-budget guard and its unit regression; UI was not rerun for that unit-only cap.
- Browser server teardown logged the existing local test-DB `share_items` missing-table errors from unrelated documentation trash/delete helpers; they did not fail the CAD tests and were not changed here.

### AutoCAD capability and integrity check

Autodesk's official AutoCAD LT 2027 references describe LT as a 2D drafting product, document `MEASUREGEOM` distance/radius/angle/area calculations, and document drawing output to PDF. These capabilities are suitable in principle for independent 2D visual and numeric reference work: [AutoCAD vs. AutoCAD LT](https://www.autodesk.com/support/technical/article/caas/sfdcarticles/sfdcarticles/AutoCAD-vs-AutoCAD-LT.html), [MEASUREGEOM command](https://help.autodesk.com/cloudhelp/2027/ENU/AutoCAD-LT-MAC/files/GUID-5D5B0EE1-DD90-47AE-8A55-642FBFF5E4E4.htm), [AutoCAD LT 2027 Plot and Publish](https://help.autodesk.com/cloudhelp/2027/ENU/AutoCAD-LT/files/GUID-C2E4D720-8958-4E89-9817-80611B32FF97.htm).

The local `C:\Program Files\Autodesk\AutoCAD LT 2027\acadlt.exe` reports file/product version `R26.0.60.0.0`, but the read-only Authenticode query returned `HashMismatch` (signer subject Autodesk, Inc.). The executable was not launched and no native drawing/raster/measurement result is claimed. Autodesk-supported repair followed by a fresh `Valid` signature check is required before using this binary as an oracle.

### Acceptance status

This follow-up closes the local bounded dashless-pattern implementation, its error/work limits, and the unit/UI checks recorded above. It does **not** establish AutoCAD native parity or close L08. Same-source AutoCAD numeric/raster/ROI validation remains NOT RUN because the local LT executable failed integrity verification and because the screenshot's original DXF bytes/SHA-256, sanitized HAR, and deployment/source artifact digest are still absent. Those inputs were not re-searched in this follow-up. No exactness/full-parity claim is made.

Current file SHA-256 values for candidate matching:

- `src/lib/cad-v2/compile/hatch-pattern-geometry.ts`: `C6C6C2BA025793A6732A7F76A5ABE6B6AFE8E738092E266A595E08FCB16BEB48`
- `src/lib/cad-v2/decode/hatch-pattern-record.ts`: `9B1C66A3F52CC2AA69514D2F7F7D94EC689319B8253B54B0805617C813370AFA`
- `tests/cad-v2/hatch-pattern-rendering.test.ts`: `C9084495DA289700A5985C875C12F7D190CBE731909EF47186A1346FCFBDDD8C`
- Built scene worker `public/cad-v2/cad-v2-scene-worker.js`: `462EFC1C62E8B6A8F3EB9A0629F273913C1AA3D684D223780B26DB319CA03BAF`

No commit, push, pull request, deployment, or default-engine change was made.



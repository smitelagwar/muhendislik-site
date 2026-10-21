# L09 local acceptance — font byte identity and reversible source/monochrome rendering

Date: 2026-10-18
Plan: `C:\Users\hsyn\Desktop\muhendis-mimar-portali\PLAN\DWG_DXF_MOTOR_V2_GPT_6_LUNA_EXTRA_HIGH_PLANI.md`
Candidate: `C:\Users\hsyn\.codex\worktrees\91a0\muhendis-mimar-portali`, branch `codex/srdr-dwg-motor-v2-fidelity`, HEAD `4b51ebe6b1470c6a247e03158dfe4b5359621c97`
Compiler: `cad-v2-compiler-2026.09-v71`; pipeline `fidelity-v3-p08`; render ABI `three172-cad2d-v2`.

## Implemented local scope

- Scene identity now uses the actual loaded font-catalog byte digest in durable-service prepare/execute/publish paths, loaded-manifest/cache guards, deferred artifact dedupe, the compiler CLI, and the compiler child. The durable service rejects a manifest whose dependency digest differs from the font catalog digest captured for that operation.
- Added `tests/cad-v2/font-scene-identity.test.ts`. With a fixed source/revision and two different valid TTF byte sets under the same font filename, service, CLI, compiler child, and deferred no-source-SHA durable jobs produce distinct identities/artifacts. Each compiled geometry fixture still has four finite LINE entities with nonzero bounds. The durable-job assertion uses isolated in-memory PGlite and temporary font/storage paths.
- The visible WebGL renderer restores a child's source color from material metadata when the child object has no color metadata, including lineweight meshes. ACI-7 metadata falls back with nullish precedence so an explicit object-level false is retained. The same restoration rule is used when changing the background while monochrome is enabled.
- Added a Chromium canvas acceptance in `cad-v2-layout-viewport.spec.ts`: it verifies a real colored source frame, a visibly different monochrome frame, exact PNG SHA-256 restoration, unchanged source-color pixel count, and no extra prepare/manifest/chunk request across both toggles. The test hides the settings overlay during captures and waits for stable consecutive canvas frames.
- Updated the prepare/chunk-404 regression's fallback identity to use the actual font digest. Corrected the publish/reconcile test fixture to expire its observer session in storage instead of calling the production last-observer cancellation path before asserting that the job remains running.

## Red/green evidence

- Font identity regression failed before the service/CLI/child changes: changing font bytes while retaining the same source identity reused the same scene ID. It passes with each surface returning a new scene ID/dependency digest and preserving valid geometry.
- Source/monochrome browser regression failed before the renderer restoration fix: the returned source frame had `1,944` red pixels at baseline but `0` after toggling back; the exact canvas hash also differed. With the fix, the same real Chromium/WebGL test passes: source and restored PNG hashes match, restored red-pixel count equals the source count, monochrome has a nonzero pixel delta, and request counts remain `{ prepare: 1, manifest: 1, chunks: 1 }`.

## Verification

- `npx tsx tests/cad-v2/font-scene-identity.test.ts` — PASS.
- `npm run check:cad-v2:unit` — PASS, exit 0.
- `npm run check:cad-v2:integration` — PASS, exit 0 after fixing the test-derived fallback scene identity and the contradictory publish/reconcile fixture. The gate includes durable repository/service, auth/share, atomic publish, compiler child/CLI, V01/G00/G15, and the new font-byte identity regression. G15's 30 warm repetitions, cold/warm comparison, and 436 chunk integrity checks passed. LibreDWG R001/R003 warnings are not clean-decode evidence.
- `npx tsx tests/cad-v2/durable-service.test.ts` and `npx tsx tests/cad-v2/prepare-chunk-404-repro.test.ts` — PASS. The latter verifies failed immutable publish never exposes READY/manifest, retry and a separate cold reader return the ready manifest/chunks, and foreign/expired/revoked/password/session cases retain their expected access results.
- `npx playwright test tests/document-studio/cad-v2-layout-viewport.spec.ts --project=chromium -g "kaynak ve tek renk görünüşü"` — PASS, 1/1; source/monochrome/source screenshot comparison is exact.
- `npx playwright test tests/document-studio/cad-v2-affine-glyph-raster.spec.ts --project=chromium` — PASS, 1/1; affine SHX curved-glyph raster is invariant to Model/Paper chunk partition. This is browser raster evidence, not native font parity.
- `npx tsc --noEmit --incremental false -p tsconfig.next.json` — PASS, exit 0 after the renderer and browser-test edits.
- Scoped ESLint without overriding existing rules still reports pre-existing `prefer-const`/unused `visibilityState` in the large browser spec; the broader dirty durable-service lint also has existing `no-explicit-any` errors. With those legacy rules suppressed, the changed renderer/spec scope has no lint errors and reports the existing unused-variable warning. No broad lint PASS is claimed.
- Scoped `git diff --check` — PASS.
- Chromium test-server teardown continued to log the isolated test database's missing `share_items` array in unrelated documentation trash/delete helpers. The CAD browser assertion passed; those unrelated helpers were not modified in this L09 slice.

## Acceptance boundary

This evidence closes the selected local font-byte cache identity and reversible source/monochrome renderer profiles. It does not close L09 or the overall plan. AutoCAD native ROI/font/measure parity, real-source text/style/dimension/attribute profiles, the screenshot's original DXF bytes/SHA, and source↔native numeric/raster comparison remain OPEN or NOT_RUN. The local AutoCAD LT executable has the previously recorded Authenticode `HashMismatch`; no native launch or parity claim is made. The user's screenshots remain observational evidence of prepare `200` followed by chunk `404`/`chunk_model_004` missing and do not supply a HAR or source/deployment digest.

Current candidate file SHA-256 values:

- `src/lib/cad-v2/service/cad-v2-durable-service.ts`: `DE2F7D833959A5BA47DDD9D8F5B76646292039CA0719E7A65B3FCAD4AD48C912`
- `scripts/cad-v2/run-v2-compiler-cli.ts`: `220DBDB8230AC4107F47A4FF9833B6A3445B2B54BC5E881F33FFC07D7041017E`
- `services/cad-v2-compiler/src/compiler-child.ts`: `4023EED14714F31C2BFEFC051903615D0D5301FB7440D3483FE926F64E2B613E`
- `src/lib/cad-v2/render/cad-v2-renderer.ts`: `4C4F9CBD30B304D52BD162E2C02B5BF148EBCAF79ADBC3A660D1A642A1C2EC92`
- `tests/cad-v2/font-scene-identity.test.ts`: `CFFD62BC226E24A173699CEFFCD9A69EC8684CE9EB7228E0F0CC420D9E3070F6`
- `tests/document-studio/cad-v2-layout-viewport.spec.ts`: `9139190BE9B54271C1D14ED2502FD111AF9ACB00A9AC5FA3D31F321CA9823BD7`
- `package.json`: `984D7001C9A7DF1CCCBF134A52990AC08ECDCBED3765BC385EB20486BFA34A0C`

No reset, stash, merge, commit, push, PR, deployment, or default-engine change was made.

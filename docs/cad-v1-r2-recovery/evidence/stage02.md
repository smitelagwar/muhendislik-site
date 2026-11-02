# ASAMA_02 — Test and gate reproducibility

**Base commit:** `b9dbd93f7fd3f045b4353ec8475e1ada550f454e`
**Runtime:** Node 24.15.0, npm 11.12.1, Next 16.4.2, Windows 11
**Playwright:** Chromium or mobile Chromium, one worker, sequential ports 3102–3115, isolated `.test-data/run-*` stores, `.next-playwright` dev build
**Full results:** [`stage02-results.json`](stage02-results.json)

## Repairs

- Removed the nonexistent `active-store` test dependency and verified that listeners stay scoped to their explicit `CadReviewStore`.
- Updated CAD review browser helpers to the current revision-scoped localStorage key.
- Replaced obsolete CAD toolbar/display expectations with current ribbon controls, visible menu items, and current `aria-pressed` behavior. The test no longer assumes the background dropdown opens a separate panel which currently has no user trigger.
- Reworked the stale stroke E2E around controls the product actually exposes: color palette, width, dash. It verifies the persisted review item and undo/redo without asserting nonexistent custom HEX or opacity controls.
- Seeded a ready DWG derivative only in the isolated Playwright database for deterministic Cache HIT/MISS browser cases. An 8-byte fake DWG without that derivative correctly caused the server page to send `ready:false`, which bypasses the mocked browser endpoint.
- Enabled opt-in first-failure Playwright trace retention with `CAD_TEST_EVIDENCE=1`; aligned test-worker local-storage mode with the isolated web-server environment.
- Added an explicitly labelled synthetic contract runner and an authorization guard for both real-user release scripts. The guard stops before database reads or evidence writes unless `CAD_REAL_USER_RELEASE_AUTHORIZED=1` is set.
- Added step logs to the Pin/Text/F5 scenario and geometry diagnostics when the pinch assertion fails.

## Verification

- Pure synthetic contracts: **66/66 pass**. The prior 65 tests remain intact; the additional test covers release-gate separation.
- TypeScript: **PASS**.
- Targeted ESLint on changed CAD tests, gate scripts, helpers, and Playwright config: **PASS** (0 diagnostics).
- Whole-repository ESLint: **FAIL**, 675 errors and 765 warnings. This includes unrelated repository files; they were not mass-edited.
- `npm run build`: **PASS** on Next 16.4.2, including 684 static pages. Production-only account migration was skipped. Generated build/worker/font assets are ignored local output.
- Playwright: Pin/Text/F5 1/1 pass; corrected Cache HIT/MISS 2/2 pass; API 409 concurrency 1/1 pass; current DXF ribbon/dropdown 3-fixture test 1/1 pass; corrected stroke palette/width/dash/persistence/undo E2E 1/1 pass; explicit-store subscription contract 1/1 pass.
- Pinch: **FAIL reproduced**. With the touch spread increased from 80 px to 120 px, the projected measurement stayed at 90 px (`zoomRatio=1.0`) and its first endpoint moved 20 px. Trace/video/screenshot are in ignored `test-results/`; P0-01 remains open.
- Both real-user release gate commands: **BLOCKED**, exit 2, because explicit dataset authorization was absent. The guard ran before `.data/dok_db.json` access.
- `git diff --check`: **PASS** for the modified tree.

## Interpretation

Cache HIT/MISS passes prove the controlled browser routing contract when a ready derivative is present in the isolated test store. They do not prove conversion fidelity for real DWG files. The 409 request test proves single-environment server concurrency behavior, not cross-device synchronization. The remaining 38-control matrix, large real-repository drawings, physical devices, real-user data gate, and release acceptance are not complete.

No CAD V1 engine/parser source, real fixture, user data, `main`, Production, merge, or deployment was changed in this stage.

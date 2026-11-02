# CAD V1 R2 Recovery — State

Plan ID: `CADV1-R2-FORENSIC-RECOVERY-20261102`
Updated: 2026-11-02 (Europe/Istanbul)
Execution status: `CHECKPOINT_COMPLETE`
Active stage: `none`
Completed stages: `ASAMA_01`, `ASAMA_02`, `ASAMA_03`
Next stage: `ASAMA_04` — starts only after the user's explicit `devam`.

## Verified repositories and branches

| Item | Verified value |
|---|---|
| Main checkout | `C:/Users/hsyn/Desktop/muhendis-mimar-portali` |
| Main local / `origin/main` | `3df5e45924c6f83e2d5cbbdb81e5d02c3fe07dc4` |
| Main worktree state | Two untracked user files; not edited. One existing stash; not touched. |
| Remote R2 branch | `origin/internal-cad-v1-pro-review-r2-20261102` |
| Recovery worktree branch | `internal-cad-v1-r2-recovery-20261102` |
| Recovery branch before ASAMA_02 | `b9dbd93f7fd3f045b4353ec8475e1ada550f454e` |
| Pull | `git pull --ff-only origin internal-cad-v1-pro-review-r2-20261102` → `Already up to date` |
| Merge base | `3df5e45924c6f83e2d5cbbdb81e5d02c3fe07dc4` |
| R2 ahead / behind main | 20 / 0 commits |
| R2 diff from main | 70 paths: 32 product source, 21 tests, 17 docs/policy; +6514 / -1040 lines |

## Deployment snapshot (read-only, 2026-11-02 22:17 Europe/Istanbul)

- R2 commit `555b89a…`: Vercel deployment `dpl_3GFWfwdsvuXn6478pVg4HgpmtfzC`, `READY`, Preview/non-production, branch `internal-cad-v1-pro-review-r2-20261102`. Its generated URL redirects with HTTP 302 to Vercel SSO, so no live CAD interaction was performed.
- Vercel commit status for `555b89a…`: `success` (“Deployment has completed”). This verifies deployment metadata only.
- The account currently lists 6 deployments for this R2 branch: 3 `READY`, 3 `ERROR`. The `[skip ci]`/`[skip vercel]` commit suffixes did not prevent all deployments; several were manual previews recorded in the previous state report.
- Latest Production deployment: `dpl_H1nMyKpGxNnNJ1kbkagomR6x2CXH`, `READY`, target `production`, branch `main`, commit `3df5e459…`. `https://muhendislik-site.vercel.app` returned HTTP 200.
- No deployment, alias change, merge, database access/write, or production action was performed in this stage.

## Stage 01 result

The current R2 snapshot is frozen and the 70-file diff inventory includes each path and Git blob SHA in `evidence/diff-inventory.json`. The historical ASAMA_08 repair changed 11 paths; at the repair commit it restored full source/test files after a commit with 4310 deletions. At current HEAD, 9 of those 11 blobs still equal the repaired commit; the host and implementation-state report subsequently changed in ASAMA_09/10. See `evidence/stage08-integrity.json`.

The primary orchestrator, legacy fallback viewer, dedicated DXF worker and view-settings panel match `main` at this snapshot. Review host/adapter/snap/ribbon files differ from `main`; they are itemized in `evidence/protected-blob-comparison.json`. No parser package, worker, fallback viewer or primary orchestrator path is in the 70-path source diff. The upstream host itself changed, so this Git evidence does not prove behavioral render equivalence or justify saying all CAD V1 code was untouched.

The four large real-repository fixture files are not present under this checkout's `tests/fixtures` at the reference sizes, and `CAD_REAL_REPO_FIXTURE_DIR` is not configured. The local worktree has no `node_modules`. No application test, typecheck, lint, or build was run in this stage. Existing 65/65 contract, typecheck, lint, and build results are historical claims in `IMPLEMENTATION_STATE.md` §17, not fresh results for this checkout. The browser-repository test is therefore `BLOCKED` by missing fixture input; physical device, independent CAD re-import, and cross-device acceptance remain `NOT_RUN`/`BLOCKED` as previously recorded.

`git diff --check origin/main...HEAD` returned exit 2 from trailing whitespace in the pre-existing `docs/cad-v1-review/PLAN.md` and `FINAL_ACCEPTANCE.md` files. The staged ASAMA_01 docs check passes when the exact-copy `PLAN.md` is excluded; the full staged check flags the source plan's existing Markdown hard-break spaces. The copy is intentionally byte-identical and was not normalized. The exact user-provided plan copy matches its source SHA-256 (`ca219d02a532ab15503b2bc0c1e3a9bf2fa14e3d0457d69bd8d75ea76a40295`).

## Stage 02 result

See [`evidence/stage02.md`](evidence/stage02.md) and [`evidence/stage02-results.json`](evidence/stage02-results.json). The reproducible synthetic Node/TSX contract command now runs 66 tests (66 pass, 0 fail); TypeScript, targeted ESLint on changed test/gate files, the production build, and selected current Chromium browser contracts pass. The whole-repository lint still fails (675 errors / 765 warnings at baseline), so no full-lint PASS is claimed.

Stale test contracts were corrected to explicit-store subscriptions, revision-scoped localStorage, current ribbon/dropdown controls, current `aria-pressed` semantics, and supported palette/width/dash options. The cache HIT/MISS fixtures now seed only the isolated `.test-data` local database so the server-rendered readiness hint matches the browser response scenario. The corrected cache HIT/MISS, Pin/Text/F5, 409 conflict, view controls, and selected review-tool E2E checks passed. A mobile Chromium pinch reproducer still FAILS: the 80→120 px gesture leaves the rendered measurement at 90 px and shifts its first endpoint 20 px; P0-01 remains open.

Both user-data release scripts stop before reading `.data/dok_db.json` or writing evidence unless `CAD_REAL_USER_RELEASE_AUTHORIZED=1` is present. They returned `BLOCKED` with exit 2 in this checkout. No real-user dataset was read or changed; no synthetic PASS is promoted to real-user acceptance. The 38-control matrix, large real-repository CAD files, physical devices, cross-device sync, and overall release acceptance remain incomplete.

## Stage 03 result

See [`evidence/stage03.md`](evidence/stage03.md) and [`evidence/stage03-results.json`](evidence/stage03-results.json). Installed MLightCAD 1.6.2 binds OrbitControls to the renderer canvas while review SVGs are sibling layers. A second touch that began on a selectable review line therefore bypassed the camera's two-pointer chain. A narrow host bridge now forwards overlay-origin touch pointerdown to the canvas and captures the pointer; selectable review distance/area groups use `touch-action:none` so the browser does not take over the gesture. A second touch cancels in-progress review drafts before navigation can commit them.

The targeted contract suite passed 27/27. Mobile Chromium E2E passed 4/4, including a stable-span two-finger pan and a pinch on Pixel 7 plus a separate iPhone 13 emulation. Camera zoom and review line screen projection changed together; both endpoints matched `projectWorldPoint` within 1 CSS px. Desktop left/middle pan and wheel zoom passed. Targeted ESLint had 0 errors and 3 pre-existing warnings. Repository-wide `npx tsc --noEmit` failed with 563 errors at this run; none of the five changed Stage03 code/test files appeared in the filtered diagnostics. Local production build and `git diff --check` passed.

The first single-contact CDP pan attempt emitted changed touch coordinates but left OrbitControls' pointer pan delta unchanged, so it was rejected as a valid product oracle. A constant-span two-contact pan is the passing camera movement oracle. Physical iOS/Android, physical trackpad, and physical stylus remain `NOT_RUN`. Release acceptance remains `false`; no merge/deploy/Production action occurred.

## Stage checkpoints

### ASAMA_01

- Commit: `b9dbd93f7fd3f045b4353ec8475e1ada550f454e`.
- Changed paths: `docs/cad-v1-r2-recovery/**` only.
- Verified base SHA: `3df5e45924c6f83e2d5cbbdb81e5d02c3fe07dc4`.
- R2 source snapshot SHA: `555b89ae6b5d14659905af49dcd88c303da881c0`.

### ASAMA_02

- Commit SHA: recorded in the final response for this stage. The state file cannot contain the resulting commit SHA without a second commit.
- Changed paths and verification: [`evidence/stage02.md`](evidence/stage02.md), [`evidence/stage02-results.json`](evidence/stage02-results.json).
- Rollback: revert the single ASAMA_02 checkpoint on the recovery branch; no product engine or user data changed.
- No merge, deployment, Production action, or `main` update was performed.
- Release ready: `false`.
- Open critical issues include reproducible P0-01 pinch failure, large real-CAD render, cross-device sync, real-user gate, and the 38-control matrix.

### ASAMA_03

- Status: targeted implementation, local verification, isolated-branch checkpoint and remote synchronization complete.
- Evidence: [`evidence/stage03.md`](evidence/stage03.md), [`evidence/stage03-results.json`](evidence/stage03-results.json).
- `main` and Production are unchanged. No merge or deployment was performed.

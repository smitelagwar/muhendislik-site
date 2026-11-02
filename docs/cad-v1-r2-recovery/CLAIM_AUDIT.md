# CAD V1 R2 Recovery — Claim Audit

Sources are the original R2 `PLAN.md`, `IMPLEMENTATION_STATE.md`, `FINAL_ACCEPTANCE.md`, `ROLLBACK.md`, current Git history/tree, and current read-only deployment metadata. `DOGRULANDI` means the specific narrow claim is supported; it does not upgrade a reported UI test to a fresh PASS.

| Claim | Classification | Current evidence and limit |
|---|---|---|
| R2 branch is 20 commits ahead of main, with no commits behind and 70 changed files. | `DOGRULANDI` | Current `origin/main...origin/internal-cad-v1-pro-review-r2-20261102`: 0 left / 20 right; 70 paths and +6514/-1040. |
| R2 commit `555b89a…` is deployed as Production. | `YANLIS` | Vercel inspect identifies it as `READY`, target `preview`; SSO returns 302. Production record is `dpl_H1n...`, `main`, commit `3df5e…`. |
| Vercel success proves CAD behavior works. | `YANLIS` | GitHub commit status says only “Deployment has completed”; browser interaction is not covered. |
| R2 changes no CAD V1 motor code. | `YANLIS` (too broad) | `cad-upstream-viewer.tsx`, `cad-upstream/adapter.ts`, snap catalog/engine and review controllers are changed. No parser package, worker, legacy fallback viewer or primary orchestrator path changed, but the upstream host changed and its behavior is not proven equivalent. |
| Working V1 renderer/fallback behavior is wholly preserved. | `KISMEN` | Orchestrator, legacy `cad-viewer.tsx`, DXF worker and view-settings panel match main in checked blobs. The upstream host and adapter do not; current evidence is not a live visual comparison. |
| ASAMA_08 first transfer was truncated and then restored. | `DOGRULANDI` (historical) | Git diff `f3e81a55`→`f3bc8983` shows 11 paths, -4310/+4625. At `f3bc8983` the files are full; later host/state blobs changed again in later stages. |
| ASAMA_08 source and tests were behaviorally correct after restore. | `KISMEN` | Historical Stage08 report records contract/E2E/build results from an isolated sandbox. This Windows checkout did not rerun those tests, and two files evolved after restore. |
| The 65/65 contract suite plus TS, lint and build currently pass. | `KISMEN` | `IMPLEMENTATION_STATE.md` §17 reports them as executed at a previous isolated SHA. Current local `node_modules` is absent; no fresh test run at `555b89a…`. |
| All 38 controls have passed. | `YANLIS` | The previous acceptance matrix includes FAIL/BLOCKED/NOT_RUN, notably pinch, Pin/Text/F5, cache/fallback, large corpus, cross-device, physical-device, and release gates. |
| Pinch regression is only an overlay redraw issue. | `YANLIS` | Historical diagnostic says camera zoom remained unchanged while camera position/world projection moved; the reported symptom is pan, not a stale overlay-only redraw. Root cause still unresolved. |
| Pin/Text/F5 timeout has a known product cause. | `BILINMIYOR` | A 100s timeout is documented; failing step and product-vs-test/environment cause are unresolved. |
| Stage 06 used only one Preview or no deploy. | `YANLIS` if asserted | Current Vercel list has six R2 deployments (three ready, three errors); stage report records manual and failed attempts. Each deployment needs separate interpretation. |
| R2 deployment is SSO-protected. | `DOGRULANDI` (current check) | HEAD request to the deployment URL returned 302 to Vercel SSO. No authenticated browser test was attempted. |
| Production remains on main commit `3df5e…`. | `DOGRULANDI` (current metadata) | Latest listed Production is READY on main SHA `3df5e…`; production domain HTTP status is 200. HTTP 200 alone is not CAD acceptance. |
| Four large corpus files completed rendering. | `YANLIS` | Prior report records `ERR_ABORTED`/`Channel closed`; current required fixtures are not configured/present at the expected reference sizes. |
| Source file hashes were unchanged through attempted large-file tests. | `KISMEN` | Previous report records before/after SHA matches. It supports byte immutability, not successful render. This stage could not independently locate the four inputs. |
| GET/PUT/409 coverage proves real two-device synchronization. | `YANLIS` | Prior report explicitly leaves cross-device synchronization blocked, including legacy null-SHA records. |
| The release gate's missing 50 files means there is no real user data. | `YANLIS` | It proves only the isolated test precondition was absent. The report explicitly avoids inferring user-data absence. |
| Pinch root cause is definitively in the product camera handler. | `BILINMIYOR` | Gesture evidence confirms camera did not zoom; source-level diagnosis was not completed. |
| CADCraft is integrated into R2. | `KANIT_YOK` | Documents cite it as a reference; no integration claim is supported by the 70-path diff or dependency evidence reviewed. |
| New R2 changes were deployed to Production by this audit. | `YANLIS` | This audit made no deploy or merge; existing Production mapping stayed at main. |

## Per-stage summary

| R2 stage | Reported outcome | Independent audit classification |
|---|---|---|
| ASAMA_01 | Baseline and scope inventory documented. | `KISMEN`: branch and diff claims independently refreshed here; R2 stage's runtime/device checks were themselves `NOT_RUN`. |
| ASAMA_02 | Units, history and schema contract implemented. | `KISMEN`: code/tests exist; historical report says some stage-specific browser/type/lint gates were `NOT_RUN`; old pure test status is not a fresh run. |
| ASAMA_03 | Chain distance, snap geometry and event handling. | `KISMEN`: code changes and contract test exist; report explicitly distinguishes mocked event tests from browser/device proof. |
| ASAMA_04 | Distance state and review-store integration. | `KISMEN`: numerical 3-4-5 arithmetic reported; browser/F5 and real unit verification remained `NOT_RUN` at stage checkpoint. |
| ASAMA_05 | Polygon geometry and area/perimeter. | `KISMEN`: implementation and assertions documented; initial Preview provisioning error and later verification must not be flattened into an all-green stage. |
| ASAMA_06 | Markup, selection, shapes, history. | `KISMEN`: tests and Preview status appear in later records; there are multiple failed/ready Preview records. `READY` is not tool acceptance. |
| ASAMA_07 | Pin/text/freehand/eraser. | `KISMEN`: historical isolated tests report targeted passes, but Stage11's combined Pin/Text/F5 timed out, invalidating broad acceptance. |
| ASAMA_08 | Persistence and JSON/DXF/PNG/PDF. | `KISMEN`: restore after a proven truncated commit; targeted sandbox tests reported passes; independent DXF reimport/pixel/cross-device acceptance remains untested. |
| ASAMA_09 | Responsive controls, search/layers/keyboard. | `KISMEN`: reported targeted tests passed; pinch remained a measured failure and physical devices were not run. |
| ASAMA_10 | Performance, large-file and resilience audit. | `KISMEN`: bounded timings and tests reported; large-file render blocked, 10× test required 3.2 minutes after timeout override, broad suite had failures and was interrupted. |
| ASAMA_11 | Final independent acceptance report. | `DOGRULANDI` as an audit artifact; release decision `RELEASE_READY=NO` is consistent with open FAIL/BLOCKED/NOT_RUN evidence. It is not a product acceptance pass. |

This is an audit of claims and evidence types, not a determination of intentional fabrication. Unsupported or over-broad conclusions are labeled as such without alleging fabricated data.

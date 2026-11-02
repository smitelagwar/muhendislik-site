# CAD V1 R2 Recovery — Acceptance Matrix (Baseline)

These are **ASAMA_01 statuses**, not final product results. Every control starts `UNKNOWN` for the new plan. “Prior report” preserves the old state only as a search lead; it is not carried forward as a fresh PASS.

| # | Control | Prior report candidate | ASAMA_01 status | Required evidence later |
|---:|---|---|---|---|
| 1 | Selection vs source selection | PASS targeted | UNKNOWN | Review selection does not mutate source entity. |
| 2 | Camera / zoom-to-fit | NOT_RUN | UNKNOWN | Real bounds, fit, pan/zoom consistency. |
| 3 | Color / monochrome / lineweight / background | BLOCKED | UNKNOWN | Renderer changes with source geometry intact. |
| 4 | Straight distance | PASS targeted | UNKNOWN | 3-4-5 world value matches overlay/store/unit. |
| 5 | Chain distance | PASS targeted | UNKNOWN | Segment/total, undo point/finish and one commit. |
| 6 | Area / perimeter | PASS targeted | UNKNOWN | Correct values, reject self-intersection and degeneracy. |
| 7 | Clear measurements | NOT_RUN | UNKNOWN | Correct scope, one undo, reload consistency. |
| 8 | Units / precision / calibration | PASS arithmetic only | UNKNOWN | Unitless handling, 2× length and 4× area, historical snapshot. |
| 9 | Six OSNAP modes | PASS targeted/emulator | UNKNOWN | Hover equals commit; transforms, hidden layers, CSS tolerance. |
| 10 | Layer visibility / locked / frozen | PASS targeted | UNKNOWN | UI, render and snap state agree. |
| 11 | Text search / focus result | PASS targeted | UNKNOWN | Real entity kinds and extraction limits. |
| 12 | Comment panel / status | NOT_RUN | UNKNOWN | UI→store→reload status round-trip. |
| 13 | Pin | BLOCKED combined acceptance | UNKNOWN | Dialog, save/F5 and source version. |
| 14 | Text note | BLOCKED combined acceptance | UNKNOWN | Unicode, cancel/edit/F5. |
| 15 | Callout / arrow | PASS pure test | UNKNOWN | Anchor, arrow geometry and undo. |
| 16 | Rectangle | PASS targeted | UNKNOWN | Both drag directions and reload. |
| 17 | Circle | PASS arithmetic/hit-test | UNKNOWN | Preview, hit-test and committed geometry agree. |
| 18 | Revision cloud | PASS pure test | UNKNOWN | World geometry and rendering fidelity. |
| 19 | Freehand | PASS targeted | UNKNOWN | Touch/pen, bounded stroke and world position. |
| 20 | Eraser | PASS targeted | UNKNOWN | Removes review only; source remains unchanged. |
| 21 | Undo / redo | PASS targeted | UNKNOWN | Cross-tool atomic history. |
| 22 | ESC / Enter / Delete / focus | PASS pure + UI | UNKNOWN | Dialog/input isolation and command cancellation. |
| 23 | Mobile 44×44 controls | PASS 375px emulator | UNKNOWN | Tap target, keyboard and safe area. |
| 24 | Long press / second finger | PASS emulator | UNKNOWN | Draft cancellation, no accidental commit; physical test separate. |
| 25 | Pinch zoom | FAIL emulator/CDP | UNKNOWN | Camera zoom changes numerically in correct direction. |
| 26 | F5 local review | BLOCKED combined acceptance | UNKNOWN | Correct file/revision key and data survives reload. |
| 27 | GET / PUT / 409 | PASS test API | UNKNOWN | Revision race/conflict behavior. |
| 28 | Cross-device sync | BLOCKED | UNKNOWN | Two contexts/devices, source SHA and real revision sync. |
| 29 | JSON import / export | PASS targeted | UNKNOWN | Unicode plus geometry round-trip. |
| 30 | Review-only DXF | PASS targeted; independent reimport NOT_RUN | UNKNOWN | Independent CAD re-import and units/layers. |
| 31 | PNG | PASS signature check only | UNKNOWN | Source + review pixel composition. |
| 32 | PDF | PASS signature/parser/page only | UNKNOWN | Layout, font, content and page geometry. |
| 33 | Original DWG/DXF download | NOT_RUN | UNKNOWN | Permission checks and byte SHA equality. |
| 34 | DWG cache / fallback | FAIL / investigate | UNKNOWN | Deterministic HIT/MISS/APS/fallback matrix. |
| 35 | Large real DWG/DXF | BLOCKED | UNKNOWN | Each of four files opens, camera/render and SHA. |
| 36 | 10× teardown / WebGL | PASS limited, 3.2 min | UNKNOWN | Repeatable lifecycle and memory/context evidence. |
| 37 | Source SHA immutability | PASS reported for 4 fixtures | UNKNOWN | Independent before/after byte hashes. |
| 38 | Production / physical mobile / tablet | NOT_RUN | UNKNOWN | Separate production metadata and real-device acceptance. |

Prior status references: `docs/cad-v1-review/FINAL_ACCEPTANCE.md` §2 and `IMPLEMENTATION_STATE.md` §§14–18. Current deployment metadata is captured in `evidence/remote-deployment-snapshot.json`; it does not change any control to PASS.

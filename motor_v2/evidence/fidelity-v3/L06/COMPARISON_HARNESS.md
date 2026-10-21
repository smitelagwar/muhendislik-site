# L06 — Native/browser comparison harness

`scripts/cad-v2/compare-reference-profiles.mjs` accepts two JSON manifests and their PNG captures. Each manifest records the exact source SHA, native/browser build identity, Model or Layout view, CSS viewport, device scale, world camera rectangle, background, visual settings, and at least ten semantic ROIs. Critical ROIs carry source-handle identities and exact critical text values.

The harness rejects mismatched source/build profiles and mismatched viewport dimensions. It registers only a global pan/scale derived from the camera world rectangles; it does not warp geometry. It reports full-view and per-ROI foreground counts and symmetric edge distances. A blank full view or blank critical ROI fails. Critical handle/text changes fail even if the global raster score is good. Limits are fixed at camera/geometry `0.25 CSS px` and raster edge-distance `1.25 CSS px`; the tool never updates or writes goldens.

Validation: `node --test tests/cad-v2/reference-comparison-harness.test.mjs` passed 4 synthetic contract cases: identical 10-ROI captures, missing critical stroke, two blank captures, and text/camera mismatch. The separate AutoLISP safety test also passed. These are harness tests only; no AutoCAD image was captured and no native parity result is claimed.

`motor_v2/evidence/fidelity-v3/P00/reference-profile.json` contains ten provisional R001 ROI estimates. They are not native screenshots or accepted oracle measurements. R002–R004 have no L06 native ROI profiles yet. Use the comparison harness only after valid AutoCAD captures and matching browser captures exist.

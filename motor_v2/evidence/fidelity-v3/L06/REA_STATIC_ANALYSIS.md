# L06 — REA static evidence

Run date: 2026-10-17 UTC. REA is an inspection tool here; this is not runtime or production evidence.

## Candidate identity

- Candidate: `C:\Users\hsyn\.codex\worktrees\91a0\muhendis-mimar-portali`, branch `codex/srdr-dwg-motor-v2-fidelity`, HEAD `4b51ebe6b1470c6a247e03158dfe4b5359621c97`.
- Compiler: `cad-v2-compiler-2026.09-v71`; pipeline `fidelity-v3-p08`; schema 1; render ABI `three172-cad2d-v2`.
- REA source clone HEAD: `376eeca770820b31f7f8d4c5fcc397315621643e`; package/CLI `rea-agents 6.5.0`; Node `v24.15.0`.

## Run `cad-v2-l06-candidate-20261017T210354Z-618d1bd2`

The analyzer input directory contains the isolated candidate compiler `index.js` and `compiler-child-entry.js` bundles, the candidate browser scene worker, and the worker build metafile. REA inventoried the whole directory (`root_artifact_sha256=5da5273bfb26e66e9d78258818dce043e47d9e885c13078dbf376077aa761b05`). The immutable full result is outside the repository at:

`C:\Users\hsyn\Desktop\cad-engine-references\analysis\cad-v2-l06-candidate-20261017T210354Z-618d1bd2\worker-analysis.json`

Its SHA-256 is `80FA30E4D4478FE0F9490BFC8D3D04A12BBC1E667364A495B6B4391FEB8436F1` (109,580,133 bytes). REA returned 539 graph nodes, 550 edges, 2 parsed JavaScript files, 591,801 visited AST nodes, zero parser failures, and a partial graph. The `worker` node and module graph are static evidence only; REA did not execute bundle bootstrap code or confirm runtime fetches.

The compiler `index.js` did not finish in this run: its analyzer worker exceeded the configured 512 MiB heap. This run is **PARTIAL**, not a full REA PASS.

## Focused compiler-index attempts

The exact fresh compiler `index.js` was analyzed in three focused attempts: two isolated 1 GiB/180 s runs (the second limited to 2,000 semantic nodes), then a 4 GiB/240 s worker run with a 32 MiB parent stack and the same semantic-node cap. The latest run parsed 864,410 AST nodes with zero parser failures and reported 580 modules/627 findings, but REA still returned partial graph and semantic coverage with `Maximum call stack size exceeded`. Inspection of the installed REA 6.5.0 worker launcher showed it starts its isolated analyzer with a fixed `--stack_size=2048`; the parent `--stack-size=32768` does not change that worker limit. Larger worker heap therefore does not close the static-graph gap.

- `cad-v2-l06-compiler-index-20261017T210354Z-618d1bd2\analysis.json`, SHA-256 `BB70AEC30B527CEC880E2089DFCF09875D6DA3F95730DC68F62AC8E5C9A7D36C`.
- `cad-v2-l06-compiler-index-bounded-20261017T212257Z-618d1bd2\analysis.json`, SHA-256 `434C112E6DB4739750C8381953B0D287DF0487ECE95D4F0883E04F8D409C4FD6`.
- `cad-v2-l06-compiler-index-stack-20261018T181800Z\analysis.json`, 4,042,777 bytes, SHA-256 `EB01E1F4A5502FD022F6A75E55879CA05E8D64405B0D7CBA81038AEE6E65B35D` (unique output directory ID; not a runtime timestamp).

Both outputs remain under `C:\Users\hsyn\Desktop\cad-engine-references\analysis\`. No tool limitation is interpreted as absence of imports or relationships.

## Source → build → worker checks

The browser worker build was reproduced outside the candidate tree with esbuild 0.27.4 and the same browser bundle options as `scripts/build-dwg-dxf-worker.mjs`. It produced 43,319 bytes with SHA-256 `07C6C4B77DED1BC1518B35E76ECFC86C9659389C5505469BB6E65858426540B0`, byte-for-byte equal to `public/cad-v2/cad-v2-scene-worker.js`.

- Source `src/workers/cad-v2/cad-v2-scene-worker.ts`: SHA-256 `F88066B272C91505A985E01C89E0F00D95DB1B72DE54FBBC0FD2655F2C41F413`.
- Version source `src/lib/cad-v2/version.ts`: SHA-256 `A5532340643E035A3B37C4BFA8E8FDAE7C789D2B3AC04AC92BA3521F4242D94E`.
- Isolated compiler build outputs: `index.js` 6,480,243 bytes, SHA-256 `A14091B3BCDB4CC2B09D68CD482F53926ECE9C52941D28DDF9C3D88A6DCAA92B`; `compiler-child-entry.js` 4,327,459 bytes, SHA-256 `53812355FE9666A6C4CB8FA3823CD10E3E0194D8FBDEA70EA0AB1C30D98EE514`.
- Existing ignored local `services/cad-v2-compiler/dist/index.js` and `dist/compiler-child-entry.js` do **not** match those isolated outputs: 6,487,360 bytes / SHA-256 `2E527F3489025C0370B258113BE42CE9B01390D44A69043825154E1E656E94FC`, and 4,330,635 bytes / SHA-256 `DA562EA98606CB2FCBC442DC14B4362ABB6BF77DC2C04267D8C1B091821EDCE8`. A 4,315,776-byte ignored `dist/compiler-child.js` also exists, but the current supervisor selects `compiler-child-entry.js`.
- The candidate `Dockerfile` copies `dist/` and starts `dist/index.js`; it does not build source in the image. No repository workflow or script that binds a Docker image digest to this source build was found. The local ignored `dist/` mismatch is a provenance gap; it does not by itself prove what artifact was deployed.

The candidate public worker matches its source. A production deployment/image SHA is unavailable, so no claim is made that the screenshot's production requests used this candidate or its worker bundle.

# ASAMA_01 command evidence

Timestamp basis: Windows client time, Europe/Istanbul, 2026-11-02. No credential/token values were read or recorded.

| Command / operation | Observed result | Scope |
|---|---|---|
| `git rev-parse --show-toplevel`; `git remote -v`; `git status --short`; `git branch --show-current`; `git worktree list`; `git stash list`; `git rev-parse HEAD`; `git show -s --format=... HEAD` | Main checkout is `main` at `3df5e459…`; two untracked user scripts and one pre-existing stash were found and left untouched. | Read-only; main workspace preserved. |
| `git fetch origin` | Updated local remote-tracking refs; R2 branch exists. | Read-only remote fetch; no ref write to GitHub. |
| `git worktree add -b internal-cad-v1-r2-recovery-20261102 <new-path> origin/internal-cad-v1-pro-review-r2-20261102` | Created separate worktree from R2 SHA `555b89ae…`; clean before report creation. | Local worktree/branch only. |
| `git pull --ff-only origin internal-cad-v1-pro-review-r2-20261102` | `Already up to date`; HEAD stayed `555b89ae…`. | R2 recovery worktree; no push. |
| `git rev-parse origin/main`; `git rev-parse origin/internal-cad-v1-pro-review-r2-20261102`; `git merge-base`; `git rev-list --left-right --count`; `git diff --stat` | Main `3df5e459…`; R2 `555b89ae…`; merge-base main; 0/20; 70 changed paths, +6514/-1040. | Read-only Git comparison. |
| `git diff --name-status origin/main...HEAD`; `git rev-parse HEAD:<path>` | All 70 files classified by path/domain and current/base blob IDs in `diff-inventory.json`. | Read-only. |
| `git show --stat f3e81a55…`; `git show --stat f3bc8983…`; `git diff --name-status f3e81a55… f3bc8983…`; blob comparisons | Historical transfer: 11 paths, 4310 deleted lines; restore: 11 paths, 4625 added lines. 9 current blobs still equal the restore; host and state file have subsequent edits. | Read-only history. |
| `git diff --check origin/main...HEAD` | Exit 2; trailing whitespace in prior R2 `docs/cad-v1-review/PLAN.md` and `FINAL_ACCEPTANCE.md`. The verbatim new `PLAN.md` also preserves source hard-break whitespace. | Read-only check; old docs and source copy were not normalized. |
| `gh api repos/smitelagwar/muhendislik-site/commits/555b89ae…/status --jq ...` | Overall `success`; `Vercel` says “Deployment has completed.” | Read-only GitHub API. |
| `vercel whoami`; `vercel list muhendislik-site ...`; `vercel inspect <deployment> --json` | Authenticated Vercel CLI read; six R2 branch records, current R2 READY Preview, current Production READY on main. | Read-only metadata. |
| `curl.exe -sS -I --max-time 10 https://muhendislik-site.vercel.app`; same for R2 generated URL | Production domain HTTP 200; R2 generated deployment HTTP 302 to Vercel SSO. | Read-only HTTP headers; no app/browser interaction. |
| `Get-FileHash` for supplied plan and repo copy | Both SHA-256 `ca219d02a532ab15503b2bc0c1e3a9bf2fa14e3d0457d69bd8d75ea76a40295`. | Read-only file integrity. |
| Scan `tests/fixtures` for DWG/DXF files at four expected byte sizes | No matching inputs found. `CAD_REAL_REPO_FIXTURE_DIR` is unset; repository E2E spec exists but requires that external directory. | Read-only; fixture hashes not calculated because inputs are unavailable. |
| `node --version`; `npm --version`; `git --version`; `npx playwright --version`; `vercel --version` | Node 24.15.0; npm 11.12.1; Git 2.53.0.windows.2; Vercel CLI 59.1.4. `npx` resolved Playwright 1.64.1 through npm exec fallback because local `node_modules` is absent. | Environment inventory. |

No npm test, TypeScript, lint, Playwright browser suite or production build was run for ASAMA_01. This stage changes audit documents only; it does not contain a code repair to test. Historical commands/results are summarized in `CLAIM_AUDIT.md` and remain attributed to their previous sandbox/run SHA. No DB, Blob, user CAD data, source fixture bytes, production code, deployment or remote branch was changed.

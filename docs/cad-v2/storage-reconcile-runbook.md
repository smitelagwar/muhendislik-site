# CAD V2 staging generation reconcile runbook

This runbook applies only to immutable CAD V2 objects under `cad-v2/scenes/*/objects/*/`. It is separate from `npm run reconcile:dokumantasyon` and does not manage documentation uploads, compatibility manifest aliases, or arbitrary Blob objects.

## Safety contract

- A publisher creates a durable generation lease before its first immutable Blob write and renews it before each object write. The final database transaction requires the same owner, fence, generation, active lease, and complete object set before it can set a scene/job to `ready`.
- The default command is report-only. Cleanup requires both `--apply` and `CAD_V2_RECONCILE_CONFIRM=DELETE_EXPIRED_CAD_V2_GENERATIONS`.
- A generation is eligible only after its lease has been expired for the configured 24-hour grace and it has no unexpired viewer session or READY scene pointer. Claiming it fences the old job, expires its current attempt, and quarantines a matching staging scene as `orphaned`.
- The cleanup walks only the exact immutable generation prefix. It checks current database references and gives each object another full grace period from its Blob `uploadedAt`. Recent, invalid, or still referenced objects are retained.
- Failed deletion leaves the lease in `reconciling`; rerunning is idempotent. A completed `reconciled` tombstone is checked again after another grace interval so an in-flight late write remains discoverable. Schedule an operator report/apply pass daily while stale generations may exist.
- The database pointer/object rows and Blob bytes are separate. This command never changes a READY pointer, deletes a READY generation, or repairs a missing READY object.

## Before using a real isolated target

1. Confirm the candidate branch/HEAD, compiler revision, Neon database, and Blob store identity out-of-band. This checkout has not been accepted against live Neon/Private Blob. Do not point the command at production during local testing.
2. Set `DATABASE_URL` to the explicitly provisioned isolated PostgreSQL/Neon test database and `BLOB_READ_WRITE_TOKEN` to a token scoped to the matching test store. Keep `VERCEL` unset; this CLI rejects serverless execution and local Blob access uses a scoped token.
3. Back up the CAD V2 relational pointer/object set before `--apply`:

   ```powershell
   $backupPath = Join-Path $PWD ("cad-v2-state-{0}.dump" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
   pg_dump --format=custom --data-only --dbname="$env:DATABASE_URL" `
     --table=cad_v2_jobs --table=cad_v2_job_attempts --table=cad_v2_view_sessions `
     --table=cad_v2_scenes --table=cad_v2_scene_objects `
     --table=cad_v2_publish_leases --table=cad_v2_schema_migrations `
     --file=$backupPath
   ```

   This dump contains relational pointers, hashes, generations, and audit state; it does **not** copy Blob bytes. A real destructive cleanup additionally requires the operator's approved Blob backup/restore coverage for the same store. No such CAD V2 Blob snapshot is produced by this script.

## Report and review

Run the read-only pass and retain its JSON output with the candidate and database/store identity:

```powershell
npm run reconcile:cad-v2
```

Review each `sceneId`, `storageGeneration`, exact `prefix`, listed/deletable/recent/referenced counts, and lease/job state. An empty list is not evidence that every historical untracked object is safe or removed; this tool only handles generations with durable publish leases.

## Apply and recover

Only after reviewing the report, confirming the isolated target and backups, run:

```powershell
$env:CAD_V2_RECONCILE_CONFIRM = "DELETE_EXPIRED_CAD_V2_GENERATIONS"
npm run reconcile:cad-v2 -- --apply
Remove-Item Env:CAD_V2_RECONCILE_CONFIRM
```

Keep the output. `deleted` counts exact generation objects removed; `completed: true` means that prefix was empty and its DB lease tombstone was closed. A false/partial result remains `reconciling` for the next pass. If Blob list/delete or Postgres fails, stop, preserve the JSON/error, restore connectivity, and rerun the same reviewed target; do not manually delete scene rows or compatibility aliases.

After apply, rerun report mode and verify no candidate remains for the just-cleaned generation. Independently query the expected READY scene and object count before and after; those values must be unchanged. If an object appears after a generation was closed, the recurring tombstone pass reopens it for review after the next grace interval.

## Local acceptance

`npx tsx tests/cad-v2/publish-lease-reconcile.test.ts` exercises report-only behavior, active-session protection, lease fencing and attempt expiry, staging quarantine, exact-prefix deletion, late-object grace/retry, and READY pointer/object preservation using PGlite plus an in-memory Blob store. It does not connect to Neon, Vercel Blob, or production data.

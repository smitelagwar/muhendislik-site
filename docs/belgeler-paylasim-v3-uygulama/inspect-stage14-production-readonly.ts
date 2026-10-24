import assert from "node:assert/strict";
import { Pool } from "@neondatabase/serverless";

const timeout = setTimeout(() => {
  console.error("ASAMA_14 read-only Production snapshot exceeded 30 seconds.");
  process.exit(124);
}, 30_000);

const number = (value: unknown) => Number(value ?? 0);

async function main() {
  assert.equal(
    process.env.BELGE_STAGE14_TEST_SCOPE,
    "vercel-production-read-only",
    "Explicit read-only Production scope marker is required.",
  );
  const databaseUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
  assert.ok(databaseUrl, "Production database URL is required.");

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 7_000,
    idleTimeoutMillis: 5_000,
  });
  let client: Awaited<ReturnType<typeof pool.connect>> | undefined;
  let transactionOpen = false;

  try {
    client = await pool.connect();
    await client.query("BEGIN TRANSACTION READ ONLY");
    transactionOpen = true;
    await client.query("SET LOCAL statement_timeout = '7s'");
    await client.query("SET LOCAL idle_in_transaction_session_timeout = '20s'");

    const readOnly = await client.query<{ read_only: string }>(
      "SELECT current_setting('transaction_read_only') AS read_only",
    );
    assert.equal(readOnly.rows[0]?.read_only, "on", "Database transaction must be read-only.");

    const tableResult = await client.query<{ table_name: string }>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'belge_paylasim_schema_version',
          'belge_paylasim_links',
          'belge_paylasim_daily_quotas',
          'belge_paylasim_blob_obligations',
          'belge_paylasim_cleanup_state'
        )
      ORDER BY table_name
    `);
    const tables = new Set(tableResult.rows.map((row) => row.table_name));
    const expected = [
      "belge_paylasim_schema_version",
      "belge_paylasim_links",
      "belge_paylasim_daily_quotas",
      "belge_paylasim_blob_obligations",
      "belge_paylasim_cleanup_state",
    ];
    const presentTables = expected.filter((table) => tables.has(table));
    const missingTables = expected.filter((table) => !tables.has(table));

    if (!tables.has("belge_paylasim_schema_version")) {
      console.log(JSON.stringify({
        scope: "vercel-production-read-only",
        databaseTransactionReadOnly: true,
        v3TablesPresent: presentTables,
        v3TablesMissing: missingTables,
        schemaVersion: null,
      }));
      return;
    }

    const versionResult = await client.query<{ schema_version: number }>(
      "SELECT schema_version FROM belge_paylasim_schema_version WHERE singleton = TRUE",
    );
    const schemaVersion = Number(versionResult.rows[0]?.schema_version ?? 0);
    if (schemaVersion < 9 || missingTables.length > 0) {
      console.log(JSON.stringify({
        scope: "vercel-production-read-only",
        databaseTransactionReadOnly: true,
        v3TablesPresent: presentTables,
        v3TablesMissing: missingTables,
        schemaVersion,
        requiredSchemaVersion: 9,
        fullCountsAvailable: false,
      }));
      return;
    }

    const [linksResult, quotasResult, obligationsResult, cleanupResult] = await Promise.all([
      client.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE environment_key = 'production') AS production_environment,
          COUNT(*) FILTER (WHERE environment_key IS DISTINCT FROM 'production') AS other_or_legacy_environment,
          COUNT(*) FILTER (WHERE status = 'pending') AS pending,
          COUNT(*) FILTER (WHERE status = 'ready' AND revoked_at IS NULL AND expires_at > NOW()) AS active_ready,
          COUNT(*) FILTER (WHERE status = 'ready' AND expires_at <= NOW()) AS expired_ready,
          COUNT(*) FILTER (WHERE status = 'revoked') AS revoked,
          COUNT(*) FILTER (WHERE status = 'purged') AS purged,
          COUNT(*) FILTER (WHERE status = 'failed') AS failed,
          COUNT(*) FILTER (WHERE lease_until > NOW()) AS active_leases,
          COALESCE(SUM(size_bytes) FILTER (WHERE status = 'ready' AND revoked_at IS NULL AND expires_at > NOW()), 0) AS active_ready_bytes
        FROM belge_paylasim_links
      `),
      client.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE environment_key = 'production') AS production_environment,
          COUNT(*) FILTER (WHERE environment_key IS DISTINCT FROM 'production') AS other_or_legacy_environment,
          COALESCE(SUM(used_links) FILTER (WHERE environment_key = 'production'), 0) AS production_used_links,
          COALESCE(SUM(reserved_links) FILTER (WHERE environment_key = 'production'), 0) AS production_reserved_links,
          COALESCE(SUM(committed_bytes) FILTER (WHERE environment_key = 'production'), 0) AS production_committed_bytes,
          COALESCE(SUM(reserved_bytes) FILTER (WHERE environment_key = 'production'), 0) AS production_reserved_bytes,
          COALESCE(SUM(deletion_pending_bytes) FILTER (WHERE environment_key = 'production'), 0) AS production_deletion_pending_bytes,
          COALESCE(SUM(unknown_upload_bytes) FILTER (WHERE environment_key = 'production'), 0) AS production_unknown_upload_bytes
        FROM belge_paylasim_daily_quotas
      `),
      client.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE environment_key = 'production') AS production_environment,
          COUNT(*) FILTER (WHERE environment_key IS DISTINCT FROM 'production') AS other_or_legacy_environment,
          COUNT(*) FILTER (WHERE environment_key = 'production' AND byte_state = 'reserved') AS production_reserved,
          COUNT(*) FILTER (WHERE environment_key = 'production' AND byte_state = 'committed') AS production_committed,
          COUNT(*) FILTER (WHERE environment_key = 'production' AND byte_state = 'deletion_pending') AS production_deletion_pending,
          COUNT(*) FILTER (WHERE environment_key = 'production' AND byte_state = 'unknown') AS production_unknown,
          COUNT(*) FILTER (WHERE environment_key = 'production' AND byte_state = 'deleted') AS production_deleted,
          COUNT(*) FILTER (
            WHERE environment_key = 'production'
              AND byte_state IN ('deletion_pending', 'unknown')
              AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
          ) AS production_due_for_cleanup,
          COUNT(*) FILTER (WHERE environment_key = 'production' AND cleanup_lease_until > NOW()) AS production_active_leases,
          COALESCE(SUM(liable_bytes) FILTER (WHERE environment_key = 'production' AND byte_state <> 'deleted'), 0) AS production_liable_bytes,
          COALESCE(SUM(actual_bytes) FILTER (WHERE environment_key = 'production' AND byte_state <> 'deleted'), 0) AS production_actual_bytes,
          MIN(cleanup_requested_at) FILTER (
            WHERE environment_key = 'production' AND byte_state IN ('deletion_pending', 'unknown')
          ) AS oldest_production_cleanup_requested_at
        FROM belge_paylasim_blob_obligations
      `),
      client.query(`
        SELECT
          (lease_until IS NOT NULL AND lease_until > NOW()) AS lease_active,
          (blob_cursor IS NOT NULL) AS blob_cursor_present,
          blob_scan_started_at,
          last_successful_at,
          last_outcome
        FROM belge_paylasim_cleanup_state
        WHERE singleton = TRUE
      `),
    ]);

    const row = (result: { rows: Record<string, unknown>[] }) => result.rows[0] ?? {};
    const links = row(linksResult);
    const quotas = row(quotasResult);
    const obligations = row(obligationsResult);
    const cleanup = row(cleanupResult);
    const safeDate = (value: unknown) => value instanceof Date ? value.toISOString() : value ?? null;

    console.log(JSON.stringify({
      scope: "vercel-production-read-only",
      databaseTransactionReadOnly: true,
      schemaVersion,
      v3TablesPresent: presentTables,
      v3TablesMissing: missingTables,
      links: Object.fromEntries(Object.entries(links).map(([key, value]) => [key, number(value)])),
      quotas: Object.fromEntries(Object.entries(quotas).map(([key, value]) => [key, number(value)])),
      obligations: Object.fromEntries(Object.entries(obligations).map(([key, value]) => [
        key.endsWith("_at") ? key : key,
        key.endsWith("_at") ? safeDate(value) : number(value),
      ])),
      cleanup: {
        leaseActive: Boolean(cleanup.lease_active),
        blobCursorPresent: Boolean(cleanup.blob_cursor_present),
        blobScanStartedAt: safeDate(cleanup.blob_scan_started_at),
        lastSuccessfulAt: safeDate(cleanup.last_successful_at),
        lastOutcome: cleanup.last_outcome ?? null,
      },
    }));
  } finally {
    if (client && transactionOpen) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // The read-only transaction is discarded when its connection closes.
      }
    }
    client?.release();
    await pool.end();
    clearTimeout(timeout);
  }
}

void main().then(() => {
  process.exit(0);
}).catch((error: unknown) => {
  const code = error && typeof error === "object" && "code" in error
    ? String((error as { code: unknown }).code)
    : "snapshot_failed";
  console.error(`ASAMA_14 read-only Production snapshot failed (${code}).`);
  process.exit(1);
});

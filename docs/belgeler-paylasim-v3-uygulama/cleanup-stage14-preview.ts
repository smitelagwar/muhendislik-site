import assert from "node:assert/strict";
import { Pool } from "@neondatabase/serverless";

const ISOLATED_PREVIEW_BLOB_STORE_ID = "store_fnCz97b5poIneDPq";

const timeout = setTimeout(() => {
  console.error("ASAMA_14 Preview cleanup exceeded the 30-second safety limit.");
  process.exit(124);
}, 30_000);

function countRows(row: Record<string, string>) {
  return {
    links: Number(row.links),
    quotas: Number(row.quotas),
    obligations: Number(row.obligations),
  };
}

async function main() {
  assert.equal(process.env.BELGE_STAGE14_PREVIEW_CLEANUP, "1", "Explicit Preview cleanup flag is required.");
  assert.equal(process.env.BELGE_STAGE14_DB_SCOPE, "development", "Cleanup is permitted only against the isolated Development database.");
  assert.equal(process.env.BELGE_STAGE14_BLOB_SCOPE, "preview-only-store", "Explicit isolated Preview Blob store scope is required.");
  assert.equal(process.env.BELGE_STAGE14_BLOB_STORE_ID, ISOLATED_PREVIEW_BLOB_STORE_ID, "Unexpected Blob store; refusing cleanup.");
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
  assert.ok(connectionString, "Vercel Development database URL is required.");
  const hostname = new URL(connectionString).hostname;
  assert.match(hostname, /\.neon\.(tech|build)$/i, "Only the isolated Neon Development database may be cleaned.");

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000,
  });
  let client: Awaited<ReturnType<typeof pool.connect>> | undefined;

  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const version = await client.query(
      "SELECT schema_version FROM belge_paylasim_schema_version WHERE singleton = TRUE",
    );
    assert.equal(Number(version.rows[0]?.schema_version), 9, "Only the isolated V3 schema version 9 may be cleaned.");

    const environments = await client.query(`
      SELECT environment_key FROM belge_paylasim_links
      UNION SELECT environment_key FROM belge_paylasim_daily_quotas
      UNION SELECT environment_key FROM belge_paylasim_blob_obligations
    `);
    const otherEnvironments = environments.rows
      .map((row) => String((row as { environment_key: string }).environment_key))
      .filter((key) => key !== "development" && key !== "preview");
    assert.deepEqual(otherEnvironments, [], "Unexpected environment rows found; refusing cleanup.");

    const beforeResult = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM belge_paylasim_links WHERE environment_key = 'preview') AS links,
        (SELECT COUNT(*) FROM belge_paylasim_daily_quotas WHERE environment_key = 'preview') AS quotas,
        (SELECT COUNT(*) FROM belge_paylasim_blob_obligations WHERE environment_key = 'preview') AS obligations
    `);
    const before = countRows(beforeResult.rows[0] as Record<string, string>);

    const deletedObligations = await client.query(
      "DELETE FROM belge_paylasim_blob_obligations WHERE environment_key = 'preview'",
    );
    const deletedQuotas = await client.query(
      "DELETE FROM belge_paylasim_daily_quotas WHERE environment_key = 'preview'",
    );
    const deletedLinks = await client.query(
      "DELETE FROM belge_paylasim_links WHERE environment_key = 'preview'",
    );

    const afterResult = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM belge_paylasim_links WHERE environment_key = 'preview') AS links,
        (SELECT COUNT(*) FROM belge_paylasim_daily_quotas WHERE environment_key = 'preview') AS quotas,
        (SELECT COUNT(*) FROM belge_paylasim_blob_obligations WHERE environment_key = 'preview') AS obligations
    `);
    const after = countRows(afterResult.rows[0] as Record<string, string>);
    assert.deepEqual(after, { links: 0, quotas: 0, obligations: 0 }, "Preview rows remain after cleanup.");
    await client.query("COMMIT");

    console.log(JSON.stringify({
      scope: "isolated-development-database/preview-namespace",
      blobScope: "preview-only-private-store",
      blobStoreId: ISOLATED_PREVIEW_BLOB_STORE_ID,
      schemaVersion: 9,
      before,
      deleted: {
        links: deletedLinks.rowCount ?? 0,
        quotas: deletedQuotas.rowCount ?? 0,
        obligations: deletedObligations.rowCount ?? 0,
      },
      after,
    }));
  } catch (error) {
    await client?.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client?.release();
    await pool.end();
    clearTimeout(timeout);
  }
}

void main().then(() => process.exit(0)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "ASAMA_14 Preview cleanup failed.");
  process.exit(1);
});

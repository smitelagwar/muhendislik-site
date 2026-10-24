import assert from "node:assert/strict";
import { list } from "@vercel/blob";
import { Pool } from "@neondatabase/serverless";

const timeout = setTimeout(() => {
  console.error("ASAMA_14 Development snapshot exceeded 30 seconds.");
  process.exit(124);
}, 30_000);

async function main() {
  assert.equal(process.env.BELGE_STAGE14_TEST_SCOPE, "development", "Explicit Development-only scope marker is required.");
  const databaseUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  assert.ok(databaseUrl, "Vercel Development database URL is required.");
  assert.ok(blobToken, "Vercel Development private Blob token is required.");

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000,
  });
  let client: Awaited<ReturnType<typeof pool.connect>> | undefined;

  try {
    client = await pool.connect();
    const versionResult = await client.query(
      "SELECT schema_version FROM belge_paylasim_schema_version WHERE singleton = TRUE",
    );
    const countsResult = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM belge_paylasim_links) AS links,
        (SELECT COUNT(*) FROM belge_paylasim_daily_quotas) AS quotas,
        (SELECT COUNT(*) FROM belge_paylasim_blob_obligations) AS obligations,
        (SELECT COUNT(*) FROM belge_paylasim_links WHERE environment_key IS DISTINCT FROM 'development') AS nonDevelopmentLinks,
        (SELECT COUNT(*) FROM belge_paylasim_daily_quotas WHERE environment_key <> 'development') AS nonDevelopmentQuotas,
        (SELECT COUNT(*) FROM belge_paylasim_blob_obligations WHERE environment_key <> 'development') AS nonDevelopmentObligations
    `);

    let cursor: string | undefined;
    let blobObjects = 0;
    do {
      const page = await list({ prefix: "belge_paylasim/", cursor, limit: 1000, token: blobToken });
      blobObjects += page.blobs.length;
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    const counts = Object.fromEntries(
      Object.entries(countsResult.rows[0] as Record<string, string>).map(([key, value]) => [key, Number(value)]),
    );
    console.log(JSON.stringify({
      scope: "vercel-development",
      schemaVersion: Number((versionResult.rows[0] as { schema_version: number }).schema_version),
      ...counts,
      privateSharePrefixObjects: blobObjects,
    }));
  } finally {
    client?.release();
    await pool.end();
    clearTimeout(timeout);
  }
}

void main().then(() => {
  process.exit(0);
}).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "ASAMA_14 Development snapshot failed.");
  process.exit(1);
});

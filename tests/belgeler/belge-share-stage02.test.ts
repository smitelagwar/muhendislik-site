import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";
import { test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import { POST as createShareRoute } from "../../src/app/api/belgeler/paylasim/route";
import { POST as bootstrapQuotaRoute } from "../../src/app/api/belgeler/paylasim/kota/route";
import { DELETE as revokeShareRoute } from "../../src/app/api/belgeler/paylasim/[token]/route";
import { GET as getPdfStreamRoute } from "../../src/app/api/belgeler/paylasim/[token]/pdf/route";
import {
  BelgeShareRuntimeError,
} from "../../src/lib/belge-paylasim/config";
import {
  assertBelgeShareSchemaReady,
  getBelgePaylasimRepository,
  MemoryBelgePaylasimRepository,
  NeonBelgePaylasimRepository,
  setBelgePaylasimRepositoryForTest,
} from "../../src/lib/belge-paylasim/repository";
import {
  getBelgeBlobStore,
  MemoryBelgeBlobStore,
  setBelgeBlobStoreForTest,
} from "../../src/lib/belge-paylasim/blob-store";
import { sha256Hex } from "../../src/lib/belge-paylasim/tokens";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const migrationFilesBeforeV3 = [
  "001_dokumantasyon_base.sql",
  "002_upload_integrity.sql",
  "004_cad_aps_derivatives.sql",
  "005_belge_paylasim.sql",
];

function restoreEnvironmentValue(name: string, value: string | undefined): void {
  if (value === undefined) Reflect.deleteProperty(process.env, name);
  else Reflect.set(process.env, name, value);
}

async function applyMigrations(database: PGlite, files: string[]): Promise<void> {
  for (const file of files) {
    const source = await readFile(path.join(projectRoot, "db/migrations", file), "utf8");
    await database.exec(source);
  }
}

async function applyV3Schema(database: PGlite): Promise<void> {
  const source = await readFile(path.join(projectRoot, "db/migrations/006_belge_paylasim_v3_runtime.sql"), "utf8");
  await database.exec(source);
  const tokenKeyVersion = await readFile(path.join(projectRoot, "db/migrations/007_belge_paylasim_token_key_version.sql"), "utf8");
  await database.exec(tokenKeyVersion);
  const atomicQuota = await readFile(path.join(projectRoot, "db/migrations/008_belge_paylasim_atomic_quota.sql"), "utf8");
  await database.exec(atomicQuota);
  const cleanupQueue = await readFile(path.join(projectRoot, "db/migrations/009_belge_paylasim_cleanup_queue.sql"), "utf8");
  await database.exec(cleanupQueue);
}

async function withDatabase<T>(run: (database: PGlite) => Promise<T>): Promise<T> {
  const database = new PGlite();
  try {
    return await run(database);
  } finally {
    await database.close();
  }
}

test("ASAMA_02/04: boş PostgreSQL veritabanında 001→007 kurulumu ve migration tekrar çalıştırma", async () => {
  await withDatabase(async (database) => {
    await applyMigrations(database, migrationFilesBeforeV3);
    await applyV3Schema(database);
    await applyV3Schema(database);

    const version = await database.query<{ schema_version: number }>(
      "SELECT schema_version FROM belge_paylasim_schema_version WHERE singleton = TRUE"
    );
    assert.equal(Number(version.rows[0]?.schema_version), 9);

    const columns = await database.query<{ column_name: string }>(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'belge_paylasim_links'"
    );
    const columnNames = new Set(columns.rows.map((row) => row.column_name));
    for (const name of [
      "owner_hash",
      "request_version",
      "proof_hash",
      "token_version",
      "token_key_version",
      "reservation_nonce",
      "attempt_id",
      "attempt_version",
      "ready_at",
      "quota_day",
      "quota_accounting_status",
      "purge_reason",
    ]) {
      assert.ok(columnNames.has(name), `missing ${name}`);
    }
  });
});

test("ASAMA_02: legacy kaydın kimliği, token hashleri ve süresi korunur; eski okuma/iptal SQL'i çalışır", async () => {
  await withDatabase(async (database) => {
    await applyMigrations(database, migrationFilesBeforeV3);
    await database.query(
      `INSERT INTO belge_paylasim_links (
         id, request_id_hash, payload_digest, token_hash, manage_token_hash,
         document_id, blob_pathname, status, creator_ip_hash, created_at, expires_at
       ) VALUES (
         $1, $2, $3, $4, $5, 'beton-dokum-tutanagi', 'belge_paylasim/legacy.pdf',
         'ready', $6, '2026-10-01T12:00:00Z', '2027-01-01T12:00:00Z'
       )`,
      ["00000000-0000-4000-8000-000000000005", "a".repeat(64), "b".repeat(64), "c".repeat(64), "d".repeat(64), "e".repeat(64)]
    );

    await applyV3Schema(database);
    await applyV3Schema(database);

    const legacy = await database.query<{
      id: string;
      status: string;
      token_hash: string;
      manage_token_hash: string;
      expires_at: Date;
      owner_hash: string | null;
      proof_hash: string | null;
      reservation_nonce: Uint8Array | null;
      quota_day: Date | null;
    }>(
      `SELECT id, status, token_hash, manage_token_hash, expires_at,
              owner_hash, proof_hash, reservation_nonce, quota_day
       FROM belge_paylasim_links WHERE id = $1`,
      ["00000000-0000-4000-8000-000000000005"]
    );
    assert.equal(legacy.rows.length, 1);
    assert.equal(legacy.rows[0]?.status, "ready");
    assert.equal(legacy.rows[0]?.token_hash, "c".repeat(64));
    assert.equal(legacy.rows[0]?.manage_token_hash, "d".repeat(64));
    assert.equal(new Date(legacy.rows[0]!.expires_at).toISOString(), "2027-01-01T12:00:00.000Z");
    assert.equal(legacy.rows[0]?.owner_hash, null);
    assert.equal(legacy.rows[0]?.proof_hash, null);
    assert.equal(legacy.rows[0]?.reservation_nonce, null);
    assert.equal(legacy.rows[0]?.quota_day, null);

    // 005 kullanan eski sürümün SELECT ve revoke mutasyonu ek sütunlar olmadan da çalışır.
    await database.query(
      "UPDATE belge_paylasim_links SET status = 'revoked', revoked_at = NOW() WHERE token_hash = $1",
      ["c".repeat(64)]
    );
    const revoked = await database.query<{ status: string; expires_at: Date; revoked_at: Date | null }>(
      "SELECT status, expires_at, revoked_at FROM belge_paylasim_links WHERE manage_token_hash = $1",
      ["d".repeat(64)]
    );
    assert.equal(revoked.rows[0]?.status, "revoked");
    assert.equal(new Date(revoked.rows[0]!.expires_at).toISOString(), "2027-01-01T12:00:00.000Z");
    assert.ok(revoked.rows[0]?.revoked_at);
  });
});

test("ASAMA_02: günlük quota UNIQUE ve tüm sayaçların negatif olmayan kısıtları uygulanır", async () => {
  await withDatabase(async (database) => {
    await applyMigrations(database, migrationFilesBeforeV3);
    await applyV3Schema(database);
    const ownerHash = "f".repeat(64);

    await database.query(
      `INSERT INTO belge_paylasim_daily_quotas (environment_key, owner_hash, quota_day)
       VALUES ('production', $1, DATE '2026-10-23')`,
      [ownerHash]
    );
    await assert.rejects(
      database.query(
        `INSERT INTO belge_paylasim_daily_quotas (environment_key, owner_hash, quota_day)
         VALUES ('production', $1, DATE '2026-10-23')`,
        [ownerHash]
      ),
      /duplicate key|unique/i
    );

    for (const column of [
      "reserved_links",
      "used_links",
      "reserved_bytes",
      "committed_bytes",
      "deletion_pending_bytes",
      "unknown_upload_bytes",
    ]) {
      await assert.rejects(
        database.query(
          `UPDATE belge_paylasim_daily_quotas SET ${column} = -1 WHERE owner_hash = $1`,
          [ownerHash]
        ),
        /check constraint/i,
        `${column} must reject negative values`
      );
    }
  });
});

test("ASAMA_02: silinmemiş Blob byte borcu tombstone silinince ilişkisiz kalır ve korunur", async () => {
  await withDatabase(async (database) => {
    await applyMigrations(database, migrationFilesBeforeV3);
    await applyV3Schema(database);
    const shareId = "00000000-0000-4000-8000-000000000006";
    await database.query(
      `INSERT INTO belge_paylasim_links (
         id, request_id_hash, payload_digest, token_hash, manage_token_hash,
         document_id, blob_pathname, status, creator_ip_hash, expires_at, purged_at
       ) VALUES ($1, $2, $3, $4, $5, 'beton-dokum-tutanagi', 'belge_paylasim/old.pdf',
                 'purged', $6, NOW(), NOW())`,
      [shareId, "1".repeat(64), "2".repeat(64), "3".repeat(64), "4".repeat(64), "5".repeat(64)]
    );
    await assert.rejects(
      database.query(
        `INSERT INTO belge_paylasim_blob_obligations (
           share_id, environment_key, blob_pathname, byte_state, liable_bytes
         ) VALUES ($1, 'preview', 'belge_paylasim/negative.pdf', 'reserved', -1)`,
        [shareId]
      ),
      /check constraint/i
    );
    await database.query(
      `INSERT INTO belge_paylasim_blob_obligations (
         share_id, environment_key, blob_pathname, byte_state, liable_bytes, purge_reason
       ) VALUES ($1, 'preview', 'belge_paylasim/old.pdf', 'deletion_pending', 4096, 'revoke')`,
      [shareId]
    );

    await database.query("DELETE FROM belge_paylasim_links WHERE id = $1", [shareId]);
    const obligation = await database.query<{ share_id: string | null; liable_bytes: number; byte_state: string }>(
      "SELECT share_id, liable_bytes, byte_state FROM belge_paylasim_blob_obligations WHERE blob_pathname = $1",
      ["belge_paylasim/old.pdf"]
    );
    assert.equal(obligation.rows[0]?.share_id, null);
    assert.equal(Number(obligation.rows[0]?.liable_bytes), 4096);
    assert.equal(obligation.rows[0]?.byte_state, "deletion_pending");
  });
});

test("ASAMA_02: schema readiness yalnız SELECT yapar ve eksik/eski sürümü güvenli 503'e çevirir", async () => {
  let statement = "";
  await assertBelgeShareSchemaReady(async (sql) => {
    statement = sql;
    return [{ schema_version: 9 }];
  });
  assert.match(statement, /^SELECT\b/i);
  assert.doesNotMatch(statement, /\b(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE)\b/i);

  await assert.rejects(
    assertBelgeShareSchemaReady(async () => []),
    (error: unknown) => error instanceof BelgeShareRuntimeError && error.code === "SCHEMA_NOT_READY" && error.statusCode === 503
  );
  await assert.rejects(
    assertBelgeShareSchemaReady(async () => {
      throw new Error("database details must not escape");
    }),
    (error: unknown) => error instanceof BelgeShareRuntimeError && error.code === "SCHEMA_NOT_READY" && !error.message.includes("database details")
  );
});

test("ASAMA_02: Neon public token GET önce salt-okunur readiness sorgusu yapar, runtime DDL çalıştırmaz", async () => {
  const statements: string[] = [];
  const client = Object.assign(
    async (parts: TemplateStringsArray) => {
      statements.push(parts.join("?"));
      return [];
    },
    {
      query: async (statement: string) => {
        statements.push(statement);
        return [{ schema_version: 9 }];
      },
    }
  ) as unknown as NeonQueryFunction<false, false>;
  const repository = new NeonBelgePaylasimRepository(undefined, client);

  assert.equal(await repository.findByTokenHash("a".repeat(64)), null);
  assert.equal(statements.length, 2);
  assert.match(statements[0] ?? "", /^SELECT\b/i);
  assert.match(statements[1] ?? "", /^\s*SELECT\b/i);
  assert.doesNotMatch(statements.join("\n"), /\b(CREATE|ALTER|DROP)\s+(TABLE|INDEX)\b/i);
});

test("ASAMA_02: production modunda Vercel dışında otomatik Memory fallback yok; explicit test adaptörü production'da reddedilir", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousVercel = process.env.VERCEL;
  const databaseEnvNames = Object.keys(process.env).filter((name) =>
    /DATABASE_URL|POSTGRES_URL|NEON_URL|^PG(HOST|USER|PASSWORD|DATABASE)$/i.test(name)
  );
  const blobEnvNames = Object.keys(process.env).filter((name) => /BLOB_(READ_WRITE_TOKEN|TOKEN)|BLOB_STORE_ID/i.test(name));
  const savedValues = new Map([...databaseEnvNames, ...blobEnvNames].map((name) => [name, process.env[name]]));

  try {
    Reflect.set(process.env, "NODE_ENV", "production");
    Reflect.deleteProperty(process.env, "VERCEL");
    for (const name of [...databaseEnvNames, ...blobEnvNames]) delete process.env[name];
    setBelgePaylasimRepositoryForTest(null);
    setBelgeBlobStoreForTest(null);

    assert.throws(
      () => getBelgePaylasimRepository(),
      (error: unknown) => error instanceof BelgeShareRuntimeError && error.code === "DATABASE_NOT_CONFIGURED" && error.statusCode === 503
    );
    assert.throws(
      () => getBelgeBlobStore(),
      (error: unknown) => error instanceof BelgeShareRuntimeError && error.code === "BLOB_NOT_CONFIGURED" && error.statusCode === 503
    );
    assert.throws(
      () => setBelgePaylasimRepositoryForTest(new MemoryBelgePaylasimRepository()),
      (error: unknown) => error instanceof BelgeShareRuntimeError && error.code === "TEST_ADAPTER_FORBIDDEN"
    );
    assert.throws(
      () => setBelgeBlobStoreForTest(new MemoryBelgeBlobStore()),
      (error: unknown) => error instanceof BelgeShareRuntimeError && error.code === "TEST_ADAPTER_FORBIDDEN"
    );
  } finally {
    setBelgePaylasimRepositoryForTest(null);
    setBelgeBlobStoreForTest(null);
    restoreEnvironmentValue("NODE_ENV", previousNodeEnv);
    restoreEnvironmentValue("VERCEL", previousVercel);
    for (const name of [...databaseEnvNames, ...blobEnvNames]) {
      const value = savedValues.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

test("ASAMA_02: share POST/DELETE/PDF GET eksik DB veya Blob konfigürasyonunda ayrıntısız 503 döndürür", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousVercel = process.env.VERCEL;
  const serviceEnvNames = Object.keys(process.env).filter((name) =>
    /DATABASE|POSTGRES|NEON|BLOB|VERCEL/i.test(name)
  );
  const savedValues = new Map(serviceEnvNames.map((name) => [name, process.env[name]]));

  try {
    Reflect.set(process.env, "NODE_ENV", "test");
    Reflect.deleteProperty(process.env, "VERCEL");
    for (const name of serviceEnvNames) delete process.env[name];
    setBelgePaylasimRepositoryForTest(null);
    setBelgeBlobStoreForTest(null);

    const bootstrapResponse = await bootstrapQuotaRoute(
      new Request("http://localhost:3000/api/belgeler/paylasim/kota", {
        method: "POST",
        headers: { origin: "http://localhost:3000", host: "localhost:3000" },
      })
    );
    const browserCookie = bootstrapResponse.headers.get("set-cookie")?.split(";", 1)[0];
    assert.ok(browserCookie);

    const createResponse = await createShareRoute(
      new Request("http://localhost:3000/api/belgeler/paylasim", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          host: "localhost:3000",
          cookie: browserCookie,
          "x-belge-share-replay-proof": Buffer.alloc(32, 11).toString("base64url"),
        },
        body: JSON.stringify({ clientRequestId: Buffer.alloc(32, 77).toString("base64url"), documentId: "beton-dokum-tutanagi", values: {} }),
      })
    );
    assert.equal(createResponse.status, 503);
    assert.equal((await createResponse.json()).code, "DATABASE_NOT_CONFIGURED");

    const viewToken = Buffer.alloc(32, 78).toString("base64url");
    const revokeResponse = await revokeShareRoute(
      new Request(`http://localhost:3000/api/belgeler/paylasim/${viewToken}`, {
        method: "DELETE",
        headers: {
          origin: "http://localhost:3000",
          host: "localhost:3000",
          "x-manage-token": Buffer.alloc(32, 79).toString("base64url"),
        },
      }),
      { params: Promise.resolve({ token: viewToken }) }
    );
    assert.equal(revokeResponse.status, 503);
    assert.equal((await revokeResponse.json()).code, "DATABASE_NOT_CONFIGURED");

    const repository = new MemoryBelgePaylasimRepository();
    setBelgePaylasimRepositoryForTest(repository);
    const pdfToken = Buffer.alloc(32, 80).toString("base64url");
    const record = await repository.createPendingReservation({
      requestIdHash: "a".repeat(64),
      payloadDigest: "b".repeat(64),
      tokenHash: sha256Hex(pdfToken),
      manageTokenHash: "d".repeat(64),
      documentId: "beton-dokum-tutanagi",
      blobPathname: "belge_paylasim/stage02.pdf",
      creatorIpHash: "e".repeat(64),
      expiresAt: new Date(Date.now() + 60_000),
    });
    await repository.finalizeReady(record.id, 128, "f".repeat(64));
    const pdfResponse = await getPdfStreamRoute(
      new Request(`http://localhost:3000/api/belgeler/paylasim/${pdfToken}/pdf`),
      { params: Promise.resolve({ token: pdfToken }) }
    );
    assert.equal(pdfResponse.status, 503);
    assert.match(pdfResponse.headers.get("cache-control") ?? "", /no-store/);
    assert.equal((await pdfResponse.json()).code, "BLOB_NOT_CONFIGURED");
  } finally {
    setBelgePaylasimRepositoryForTest(null);
    setBelgeBlobStoreForTest(null);
    restoreEnvironmentValue("NODE_ENV", previousNodeEnv);
    restoreEnvironmentValue("VERCEL", previousVercel);
    for (const name of serviceEnvNames) {
      const value = savedValues.get(name);
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

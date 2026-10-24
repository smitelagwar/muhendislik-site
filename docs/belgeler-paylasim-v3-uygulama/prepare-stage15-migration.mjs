import fs from "node:fs";
import { createHash } from "node:crypto";
const paths = ["006_belge_paylasim_v3_runtime.sql", "007_belge_paylasim_token_key_version.sql", "008_belge_paylasim_atomic_quota.sql", "009_belge_paylasim_cleanup_queue.sql"].map((name) => `db/migrations/${name}`);
const before = `DO $v3_release_migration$
DECLARE stage15_before_links BIGINT; stage15_before_active BIGINT; stage15_before_bytes BIGINT;
BEGIN
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '45s';
LOCK TABLE belge_paylasim_links IN ACCESS EXCLUSIVE MODE;
SELECT COUNT(*), COUNT(*) FILTER (WHERE status='ready' AND revoked_at IS NULL AND expires_at>NOW()),
COALESCE(SUM(size_bytes) FILTER (WHERE status='ready' AND revoked_at IS NULL AND expires_at>NOW()),0)
INTO stage15_before_links, stage15_before_active, stage15_before_bytes FROM belge_paylasim_links;
`;
const after = `
IF stage15_before_links <> (SELECT COUNT(*) FROM belge_paylasim_links)
OR stage15_before_active <> (SELECT COUNT(*) FROM belge_paylasim_links WHERE status='ready' AND revoked_at IS NULL AND expires_at>NOW())
OR stage15_before_bytes <> (SELECT COALESCE(SUM(size_bytes),0) FROM belge_paylasim_links WHERE status='ready' AND revoked_at IS NULL AND expires_at>NOW())
THEN RAISE EXCEPTION 'V3 release preservation check failed'; END IF;
IF (SELECT schema_version FROM belge_paylasim_schema_version WHERE singleton=TRUE) <> 9
THEN RAISE EXCEPTION 'V3 schema version check failed'; END IF;
END;
$v3_release_migration$;
`;
const contents = paths.map((file) => fs.readFileSync(file, "utf8"));
const sql = before + contents.join("\n\n") + after;
fs.mkdirSync(".tmp", { recursive: true });
fs.writeFileSync(".tmp/stage15-production-migration.sql", sql);
fs.writeFileSync("docs/belgeler-paylasim-v3-uygulama/ASAMA_15_migration_inputs.json", JSON.stringify({ inputs: paths.map((file, i) => ({ file, sha256: createHash("sha256").update(contents[i]).digest("hex") })), combinedSha256: createHash("sha256").update(sql).digest("hex"), transaction: "single atomic PostgreSQL DO statement", lockTimeoutSeconds: 5, statementTimeoutSeconds: 45, preservesExistingRowsAndActiveBytes: true, executed: false }, null, 2) + "\n");
console.log(JSON.stringify({ prepared: true, sqlBytes: Buffer.byteLength(sql), migrations: paths.length, source: ".tmp/stage15-production-migration.sql" }));

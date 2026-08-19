// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — VERİTABANI MİGRASYON ÇALIŞTIRICI
// ============================================================================

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { neon } from "@neondatabase/serverless";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, "..", "db", "migrations");

export const LATEST_REQUIRED_SCHEMA_VERSION = "002";

export function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  if (process.env.POSTGRES_PRISMA_URL) return process.env.POSTGRES_PRISMA_URL;
  if (process.env.POSTGRES_URL_NON_POOLING) return process.env.POSTGRES_URL_NON_POOLING;
  if (process.env.NEON_DATABASE_URL) return process.env.NEON_DATABASE_URL;

  for (const [key, value] of Object.entries(process.env)) {
    if (!value || typeof value !== "string") continue;
    if (key.includes("DATABASE_URL") || key.includes("POSTGRES_URL")) {
      return value;
    }
  }

  return undefined;
}

export async function runMigrations(sql) {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.warn("[Migrate] Migrations dizini bulunamadı:", MIGRATIONS_DIR);
    return { applied: [], currentVersion: "none" };
  }

  // 1. Migration tablosunun varlığını garanti et
  await sql`
    CREATE TABLE IF NOT EXISTS dok_schema_migrations (
      version VARCHAR(64) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  const appliedRows = await sql`
    SELECT version FROM dok_schema_migrations ORDER BY version ASC;
  `;
  const appliedSet = new Set(appliedRows.map((r) => r.version));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const newlyApplied = [];

  for (const file of files) {
    const version = file.split("_")[0];
    if (appliedSet.has(version)) {
      continue;
    }

    const filePath = path.join(MIGRATIONS_DIR, file);
    const sqlContent = fs.readFileSync(filePath, "utf-8");

    // SQL ifadelerini tek tek böl ve çalıştır
    const statements = sqlContent
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`[Migrate] Uygulanıyor: ${file} (${statements.length} ifade)...`);

    for (const stmt of statements) {
      if (stmt.startsWith("--")) continue;
      // Ham SQL çalıştırma
      await sql(stmt);
    }

    await sql`
      INSERT INTO dok_schema_migrations (version, applied_at)
      VALUES (${version}, NOW())
      ON CONFLICT (version) DO NOTHING;
    `;

    newlyApplied.push(version);
    console.log(`✓ [Migrate] Başarıyla tamamlandı: ${file}`);
  }

  const latestRows = await sql`
    SELECT version FROM dok_schema_migrations ORDER BY version DESC LIMIT 1;
  `;
  const currentVersion = latestRows[0]?.version || "none";

  return {
    applied: newlyApplied,
    currentVersion,
    isUpToDate: currentVersion >= LATEST_REQUIRED_SCHEMA_VERSION,
  };
}

// CLI olarak doğrudan çağrıldığında
if (process.argv[1] === __filename) {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    console.error("❌ Hata: DATABASE_URL veya POSTGRES_URL ortam değişkeni tanımlı değil.");
    process.exit(1);
  }

  const sql = neon(dbUrl);
  runMigrations(sql)
    .then((result) => {
      console.log(`\n🎉 Migrasyon süreci tamamlandı. Güncel sürüm: ${result.currentVersion}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("\n❌ Migrasyon sırasında hata oluştu:", err);
      process.exit(1);
    });
}

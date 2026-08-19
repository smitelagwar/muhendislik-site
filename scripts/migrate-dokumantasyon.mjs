import fs from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";

// Load .env.local if present
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("HATA: DATABASE_URL tanımlı değil. Lütfen .env.local veya ortam değişkenlerinde tanımlayın.");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function runMigrations() {
  console.log("Dökümantasyon modülü veritabanı migrasyonları başlatılıyor...");

  // 1. Migrasyon tablosunu oluştur
  await sql`
    CREATE TABLE IF NOT EXISTS dok_schema_migrations (
      version VARCHAR(64) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // 2. Uygulanmış migrasyonları al
  const appliedRows = await sql`SELECT version FROM dok_schema_migrations;`;
  const appliedSet = new Set(appliedRows.map((r) => r.version));

  // 3. db/dokumantasyon dizinindeki dosyaları oku
  const migrationsDir = path.resolve(process.cwd(), "db", "dokumantasyon");
  if (!fs.existsSync(migrationsDir)) {
    console.log("Migrasyon dizini bulunamadı:", migrationsDir);
    return;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const version = path.basename(file, ".sql");
    if (appliedSet.has(version)) {
      console.log(`- ${file} zaten uygulanmış (atlanıyor)`);
      continue;
    }

    console.log(`+ Uygulanıyor: ${file}...`);
    const filePath = path.join(migrationsDir, file);
    const sqlContent = fs.readFileSync(filePath, "utf-8");

    // SQL dosyalarını çalıştır
    // neon serverless client accepts raw string queries via template or function call
    await sql(sqlContent);
    await sql`INSERT INTO dok_schema_migrations (version) VALUES (${version});`;
    console.log(`✓ ${file} başarıyla uygulandı.`);
  }

  console.log("Tüm migrasyonlar güncel!");
}

runMigrations().catch((err) => {
  console.error("Migrasyon sırasında hata oluştu:", err);
  process.exit(1);
});

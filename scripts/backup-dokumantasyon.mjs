// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — YEDEKLEME SCRİPTİ (BACKUP)
// ============================================================================

import fs from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";

// .env.local yükle
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

async function runBackup() {
  console.log("Dökümantasyon Modülü Veritabanı ve Metadata Yedeği Alınıyor...\n");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("HATA: DATABASE_URL ortam değişkeni bulunamadı.");
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  try {
    const [folders, files, shareLinks, shareItems] = await Promise.all([
      sql`SELECT * FROM dok_folders ORDER BY created_at ASC;`,
      sql`SELECT * FROM dok_files ORDER BY created_at ASC;`,
      sql`SELECT * FROM dok_share_links ORDER BY created_at ASC;`,
      sql`SELECT * FROM dok_share_items ORDER BY id ASC;`,
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      stats: {
        totalFolders: folders.length,
        totalFiles: files.length,
        totalShareLinks: shareLinks.length,
        totalShareItems: shareItems.length,
      },
      tables: {
        dok_folders: folders,
        dok_files: files,
        dok_share_links: shareLinks,
        dok_share_items: shareItems,
      },
    };

    const backupDir = path.resolve(process.cwd(), "backups", "dokumantasyon");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestampStr = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFilePath = path.join(backupDir, `backup_${timestampStr}.json`);

    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), "utf8");

    console.log(`✓ Yedekleme Başarılı!`);
    console.log(`  Dosya Yolu: ${backupFilePath}`);
    console.log(`  Klasörler: ${folders.length}`);
    console.log(`  Dosyalar: ${files.length}`);
    console.log(`  Paylaşım Linkleri: ${shareLinks.length}`);
    console.log(`  Snapshot Öğeleri: ${shareItems.length}\n`);
  } catch (err) {
    console.error("Yedekleme sırasında hata oluştu:", err);
    process.exit(1);
  }
}

runBackup();

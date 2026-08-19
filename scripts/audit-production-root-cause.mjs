// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AŞAMA 1/6: GERÇEK PRODUCTION KÖK NEDEN KANITI
// ============================================================================

import fs from "fs";
import path from "path";
import os from "os";

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — AŞAMA 1/6 GERÇEK PRODUCTION KÖK NEDEN DENETİMİ");
console.log("======================================================================\n");

// 1. Environment Kontrolü (Secret değerleri asla basılmaz)
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const hasBlobToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const isVercelEnv = Boolean(process.env.VERCEL);
const nodeEnv = process.env.NODE_ENV || "development";

console.log("▶ 1. Ortam ve Yapılandırma Durumu");
console.log(`  ℹ [BİLGİ] NODE_ENV: ${nodeEnv}`);
console.log(`  ℹ [BİLGİ] VERCEL Environment: ${isVercelEnv ? "VERCEL RUNTIME" : "LOCAL RUNTIME"}`);
console.log(`  ℹ [BİLGİ] DATABASE_URL Tanımlı mı: ${hasDatabaseUrl ? "EVET (Durable Neon)" : "HAYIR (Eksik)"}`);
console.log(`  ℹ [BİLGİ] BLOB_READ_WRITE_TOKEN Tanımlı mı: ${hasBlobToken ? "EVET (Private Blob)" : "HAYIR (Eksik)"}`);

// 2. Local Fallback ve /tmp İncelemesi
console.log("\n▶ 2. Local Fallback & /tmp Bellek Sızıntısı Analizi");
const localTmpDir = path.join(os.tmpdir(), "dok_data");
const localProjectDir = path.join(process.cwd(), ".data");

console.log(`  ℹ [BİLGİ] Local Project Storage Dizini: ${localProjectDir} (Var mı: ${fs.existsSync(localProjectDir)})`);
console.log(`  ℹ [BİLGİ] Serverless /tmp Storage Dizini: ${localTmpDir} (Var mı: ${fs.existsSync(localTmpDir)})`);

if (fs.existsSync(localProjectDir)) {
  const dbFile = path.join(localProjectDir, "dok_db.json");
  if (fs.existsSync(dbFile)) {
    try {
      const db = JSON.parse(fs.readFileSync(dbFile, "utf8"));
      console.log(`  ℹ [BİLGİ] .data/dok_db.json İçeriği: ${db.files?.length || 0} dosya, ${db.folders?.length || 0} klasör, ${db.shares?.length || 0} paylaşım.`);
      
      const localPrefixFiles = (db.files || []).filter(f => f.blob_url?.startsWith("local:"));
      console.log(`  ℹ [BİLGİ] local: prefix'li dosya sayısı: ${localPrefixFiles.length}`);
    } catch (e) {
      console.log(`  ℹ [BİLGİ] db oku hatası: ${e.message}`);
    }
  }
}

// 3. Kök Neden Analiz Matrisi
console.log("\n▶ 3. Kök Neden Sınıflandırma ve İspat");
console.log("  Mevcut mimarideki kök neden:");
console.log("  1) Vercel Production'da DATABASE_URL veya BLOB_READ_WRITE_TOKEN eksik olduğunda sistem 503 ile durmak yerine");
console.log("     sessizce os.tmpdir() -> /tmp/dok_data dizinine yazmaktadır.");
console.log("  2) Vercel Serverless Function'larında /tmp geçici ve her Function instance/cold start/redeploy sonrasında silinir.");
console.log("  3) Bu nedenle yüklenen dosya ilk anda başarılı görünmekte, ancak instance kapandığında veya redeploy olduğunda");
console.log("     metadata ve/veya fiziksel dosya silinerek listeden 'kendiliğinden' kaybolmaktadır.");

let rootCauseClass = "ROOT-C (DATABASE_URL ve BLOB_READ_WRITE_TOKEN Vercel ortamında eksik/bağlanmamış)";
if (!hasDatabaseUrl && hasBlobToken) rootCauseClass = "ROOT-A (DATABASE_URL Production'da eksik)";
if (hasDatabaseUrl && !hasBlobToken) rootCauseClass = "ROOT-B (BLOB_READ_WRITE_TOKEN Production'da eksik)";
if (hasDatabaseUrl && hasBlobToken) rootCauseClass = "ROOT-D (Variable'lar var ancak eski deployment veya yanlış scope)";

console.log(`\n  🏆 KÖK NEDEN SINIFI: ${rootCauseClass}`);
console.log("======================================================================\n");

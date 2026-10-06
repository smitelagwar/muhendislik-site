import fs from "node:fs";
import path from "node:path";

export default async function globalSetup(): Promise<void> {
  const testBaseDir = path.resolve(process.cwd(), ".test-data");
  if (!fs.existsSync(testBaseDir)) {
    fs.mkdirSync(testBaseDir, { recursive: true });
  }

  const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const runDataDir = path.join(testBaseDir, runId);
  fs.mkdirSync(runDataDir, { recursive: true });

  const pointerFile = path.join(testBaseDir, "active-test-dir.txt");
  fs.writeFileSync(pointerFile, runDataDir, "utf8");

  // Seeded test veritabanını test klasörüne kopyala
  const sourceDb = path.resolve(process.cwd(), ".data/dok_db.json");
  const sourceStorage = path.resolve(process.cwd(), ".data/dok_storage");
  if (fs.existsSync(sourceDb)) {
    fs.copyFileSync(sourceDb, path.join(runDataDir, "dok_db.json"));
  }
  if (fs.existsSync(sourceStorage)) {
    fs.cpSync(sourceStorage, path.join(runDataDir, "dok_storage"), { recursive: true });
  }

  const lockFile = path.resolve(process.cwd(), ".next-playwright/dev/lock");
  if (fs.existsSync(lockFile)) {
    try {
      fs.rmSync(lockFile, { force: true });
    } catch {
      // ignore
    }
  }

  process.env.DOK_LOCAL_DATA_DIR = runDataDir;
}

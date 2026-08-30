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

  process.env.DOK_LOCAL_DATA_DIR = runDataDir;
}

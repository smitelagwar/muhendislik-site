import fs from "node:fs";
import path from "node:path";

export default async function globalSetup(): Promise<void> {
  const testBaseDir = path.resolve(process.cwd(), ".test-data");
  if (!fs.existsSync(testBaseDir)) {
    fs.mkdirSync(testBaseDir, { recursive: true });
  }

  const configuredRunDir = process.env.DOK_LOCAL_DATA_DIR?.trim();
  if (!configuredRunDir) throw new Error("Playwright config did not allocate isolated DOK_LOCAL_DATA_DIR before server startup.");
  const runDataDir = path.resolve(configuredRunDir);
  const relativeRunDir = path.relative(testBaseDir, runDataDir);
  if (!relativeRunDir || relativeRunDir === ".." || relativeRunDir.startsWith(`..${path.sep}`) || path.isAbsolute(relativeRunDir)) {
    throw new Error(`Playwright DOK_LOCAL_DATA_DIR must be inside .test-data: ${runDataDir}`);
  }
  if (path.resolve(process.cwd(), ".data") === runDataDir) {
    throw new Error("Playwright must never use production .data as DOK_LOCAL_DATA_DIR.");
  }
  fs.mkdirSync(runDataDir, { recursive: true });

  const pointerFile = path.join(testBaseDir, "active-test-dir.txt");
  fs.writeFileSync(pointerFile, runDataDir, "utf8");

  const sourceDataDir = path.resolve(process.cwd(), ".data");
  if (fs.existsSync(sourceDataDir)) {
    for (const entry of ["dok_db.json", "dok_storage", "cad-v2-scenes"]) {
      const source = path.join(sourceDataDir, entry);
      const target = path.join(runDataDir, entry);
      if (!fs.existsSync(source)) continue;
      if (fs.existsSync(target)) throw new Error(`Isolated Playwright data already contains ${entry}: ${target}`);
      fs.cpSync(source, target, { recursive: true });
    }
  }

  const lockFile = path.resolve(process.cwd(), ".next-playwright/dev/lock");
  if (fs.existsSync(lockFile)) {
    try {
      fs.rmSync(lockFile, { force: true });
    } catch {
      // ignore
    }
  }
}

import fs from "node:fs";
import path from "node:path";

export default async function globalTeardown(): Promise<void> {
  const testBaseDir = path.resolve(process.cwd(), ".test-data");
  const pointerFile = path.join(testBaseDir, "active-test-dir.txt");

  let targetDirToRemove: string | null = null;

  if (fs.existsSync(pointerFile)) {
    try {
      const dir = fs.readFileSync(pointerFile, "utf8").trim();
      if (dir) {
        targetDirToRemove = dir;
      }
    } catch {
      // ignore read error
    }

    try {
      fs.unlinkSync(pointerFile);
    } catch {
      // ignore unlink error
    }
  }

  if (!targetDirToRemove && process.env.DOK_LOCAL_DATA_DIR) {
    targetDirToRemove = process.env.DOK_LOCAL_DATA_DIR;
  }

  if (targetDirToRemove) {
    const resolved = path.resolve(targetDirToRemove);
    // Strict safety verification: must be a direct child directory inside .test-data
    if (resolved.startsWith(testBaseDir + path.sep) && resolved !== testBaseDir) {
      try {
        fs.rmSync(resolved, { recursive: true, force: true });
      } catch {
        // ignore removal error
      }
    }
  }
}

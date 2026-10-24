import { spawn } from "node:child_process";
import { createWriteStream, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evidenceDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(evidenceDir, "../..");
const testFiles = [
  "tests/belgeler/belge-filename.test.ts",
  "tests/belgeler/belge-share-api.test.ts",
  "tests/belgeler/belge-share-cleanup.test.ts",
  "tests/belgeler/belge-share-client.test.ts",
  "tests/belgeler/belge-share-server.test.ts",
  "tests/belgeler/belge-share-ui.test.ts",
  "tests/belgeler/belge-share-viewer.test.ts",
  "tests/belgeler/belge-share-stage02.test.ts",
];
const timeoutMs = 180_000;
const logPath = resolve(evidenceDir, "ASAMA_02_tests.tap");
const reportPath = resolve(evidenceDir, "ASAMA_02_tests.json");
const removedEnvironmentNames = Object.keys(process.env).filter((name) =>
  /DATABASE|POSTGRES|NEON|BLOB|VERCEL|BELGE_SHARE_SECRET|CRON_SECRET|SHARE_TOKEN_ENCRYPTION_KEY|NODE_OPTIONS|NODE_PATH/i.test(name),
);
const childEnvironment = { ...process.env, NODE_ENV: "test" };
for (const name of removedEnvironmentNames) delete childEnvironment[name];
childEnvironment.NODE_ENV = "test";

const log = createWriteStream(logPath);
const startedAt = Date.now();
const child = spawn(process.execPath, ["--import", "tsx", "--test", ...testFiles], {
  cwd: projectRoot,
  env: childEnvironment,
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});

child.stdout.pipe(log, { end: false });
child.stderr.pipe(log, { end: false });

let timedOut = false;
const timeout = setTimeout(() => {
  timedOut = true;
  if (process.platform === "win32" && child.pid) {
    const killer = spawn("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
    killer.unref();
  } else {
    child.kill("SIGKILL");
  }
}, timeoutMs);

child.on("error", (error) => log.write(`runner error: ${error.message}\n`));
child.on("close", (childExitCode) => {
  clearTimeout(timeout);
  log.end(() => {
    const tap = readFileSync(logPath, "utf8");
    const readCount = (label) => Number(tap.match(new RegExp(`^ℹ ${label} (\\d+)$`, "m"))?.[1] ?? 0);
    const report = {
      command: `node --import tsx --test ${testFiles.join(" ")}`,
      environment: "local Node test process; NODE_ENV=test; cloud and secret variable names removed; PGlite in-memory PostgreSQL; explicit Memory adapters in fixture tests",
      files: testFiles,
      exitCode: timedOut ? 124 : childExitCode ?? 1,
      timedOut,
      timeoutMs,
      durationMs: Date.now() - startedAt,
      tests: readCount("tests"),
      suites: readCount("suites"),
      passed: readCount("pass"),
      failed: readCount("fail"),
      skipped: readCount("skipped"),
      todo: readCount("todo"),
      removedEnvironmentNames,
      logPath,
    };
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.exitCode;
  });
});

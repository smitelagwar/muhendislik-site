import { spawn } from "node:child_process";
import { createWriteStream, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evidenceDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(evidenceDir, "../..");
const files = [
  "src/lib/belge-paylasim/config.ts",
  "src/lib/belge-paylasim/types.ts",
  "src/lib/belge-paylasim/repository.ts",
  "src/lib/belge-paylasim/blob-store.ts",
  "src/app/api/belgeler/paylasim/route.ts",
  "src/app/api/belgeler/paylasim/[token]/route.ts",
  "src/app/api/belgeler/paylasim/[token]/pdf/route.ts",
  "src/app/api/cron/belge-paylasim-temizlik/route.ts",
  "tests/belgeler/belge-share-stage02.test.ts",
  "docs/belgeler-paylasim-v3-uygulama/run-stage02-tests.mjs",
  "docs/belgeler-paylasim-v3-uygulama/run-stage02-runtime-tsc.mjs",
  "docs/belgeler-paylasim-v3-uygulama/run-stage02-lint.mjs",
];
const commandArgs = ["node_modules/eslint/bin/eslint.js", ...files];
const timeoutMs = 180_000;
const logPath = resolve(evidenceDir, "ASAMA_02_lint.log");
const reportPath = resolve(evidenceDir, "ASAMA_02_lint.json");
const removedEnvironmentNames = Object.keys(process.env).filter((name) =>
  /DATABASE|POSTGRES|NEON|BLOB|VERCEL|BELGE_SHARE_SECRET|CRON_SECRET|SHARE_TOKEN_ENCRYPTION_KEY|NODE_OPTIONS|NODE_PATH/i.test(name),
);
const childEnvironment = { ...process.env, NODE_ENV: "test" };
for (const name of removedEnvironmentNames) delete childEnvironment[name];
childEnvironment.NODE_ENV = "test";

const log = createWriteStream(logPath);
const startedAt = Date.now();
const child = spawn(process.execPath, commandArgs, {
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
    const report = {
      command: `node ${commandArgs.join(" ")}`,
      environment: "local ESLint on changed source, migration tests, and evidence runners; cloud and secret variable names removed",
      files,
      exitCode: timedOut ? 124 : childExitCode ?? 1,
      timedOut,
      timeoutMs,
      durationMs: Date.now() - startedAt,
      removedEnvironmentNames,
      logPath,
    };
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.exitCode;
  });
});

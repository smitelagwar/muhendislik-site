import { spawn } from "node:child_process";
import { createWriteStream, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evidenceDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(evidenceDir, "../..");
const files = [
  "src/lib/belge-paylasim/config.ts",
  "src/lib/belge-paylasim/tokens.ts",
  "src/lib/belge-paylasim/types.ts",
  "src/lib/belge-paylasim/repository.ts",
  "src/lib/belge-paylasim/service-core.ts",
  "src/app/api/belgeler/paylasim/route.ts",
  "src/app/api/belgeler/paylasim/[token]/route.ts",
  "src/app/api/belgeler/paylasim/islem/[requestId]/route.ts",
  "tests/belgeler/belge-share-api.test.ts",
  "tests/belgeler/belge-share-server.test.ts",
  "tests/belgeler/belge-share-stage02.test.ts",
  "tests/belgeler/belge-share-stage04.test.ts",
  "docs/belgeler-paylasim-v3-uygulama/run-stage04-tests.mjs",
  "docs/belgeler-paylasim-v3-uygulama/run-stage04-runtime-tsc.mjs",
  "docs/belgeler-paylasim-v3-uygulama/run-stage04-lint.mjs",
];
const args = ["node_modules/eslint/bin/eslint.js", ...files];
const timeoutMs = 180_000;
const logPath = resolve(evidenceDir, "ASAMA_04_lint.log");
const reportPath = resolve(evidenceDir, "ASAMA_04_lint.json");
const removedEnvironmentNames = Object.keys(process.env).filter((name) =>
  /DATABASE|POSTGRES|NEON|BLOB|VERCEL|BELGE_SHARE_SECRET|CRON_SECRET|SHARE_TOKEN_ENCRYPTION_KEY|NODE_OPTIONS|NODE_PATH/i.test(name),
);
const childEnvironment = { ...process.env, NODE_ENV: "test" };
for (const name of removedEnvironmentNames) delete childEnvironment[name];
childEnvironment.NODE_ENV = "test";
const log = createWriteStream(logPath);
const startedAt = Date.now();
const child = spawn(process.execPath, args, { cwd: projectRoot, env: childEnvironment, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
child.stdout.pipe(log, { end: false });
child.stderr.pipe(log, { end: false });
let timedOut = false;
const timeout = setTimeout(() => {
  timedOut = true;
  if (process.platform === "win32" && child.pid) {
    const killer = spawn("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    killer.unref();
  } else child.kill("SIGKILL");
}, timeoutMs);
child.on("error", () => log.write("runner error: child process could not start\n"));
child.on("close", (exitCode) => {
  clearTimeout(timeout);
  log.end(() => {
    const report = {
      command: `node ${args.join(" ")}`,
      environment: "ESLint over changed ASAMA_04 source, API, regression tests and bounded evidence runners; cloud/database/blob/secret variable names removed",
      files,
      exitCode: timedOut ? 124 : exitCode ?? 1,
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

import { spawn } from "node:child_process";
import { createWriteStream, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evidenceDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(evidenceDir, "../..");
const args = ["node_modules/typescript/bin/tsc", "-p", "tsconfig.next.json", "--noEmit", "--incremental", "false"];
const timeoutMs = 180_000;
const logPath = resolve(evidenceDir, "ASAMA_05_runtime-tsc.log");
const reportPath = resolve(evidenceDir, "ASAMA_05_runtime-tsc.json");
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
      environment: "runtime TypeScript scope; NODE_ENV=test; cloud/database/blob/secret variable names removed",
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

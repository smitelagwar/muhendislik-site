import { spawn } from "node:child_process";
import { createWriteStream, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const evidenceDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(evidenceDir, "../..");
const distDir = ".next-stage06";
const buildDir = resolve(projectRoot, distDir);
const logPath = resolve(evidenceDir, "ASAMA_06_prod-build.log");
const reportPath = resolve(evidenceDir, "ASAMA_06_prod-trace.json");
const manifestCopyPath = resolve(evidenceDir, "ASAMA_06_prod-route.js.nft.json");
const timeoutMs = 600_000;
const timeoutGuard = "C:\\Users\\hsyn\\Desktop\\muhendis-mimar-portali\\";
if (!buildDir.toLowerCase().startsWith(timeoutGuard.toLowerCase()) || buildDir === projectRoot) {
  throw new Error("Unsafe build output directory; refusing to clear the workspace root.");
}

const sensitiveName = /DATABASE|POSTGRES|NEON|BLOB|VERCEL|SECRET|TOKEN|PASSWORD|CRON|SESSION|AUTH|ADMIN|SALT|KEY/i;
const env = { ...process.env, NODE_ENV: "production", NEXT_DIST_DIR: distDir, CI: "1", NEXT_TELEMETRY_DISABLED: "1" };
const removedEnvironmentNames = Object.keys(env).filter((name) => sensitiveName.test(name));
for (const name of removedEnvironmentNames) delete env[name];

// Next loads .env.local during a build. Replace only credential-like names with
// fixed non-credential sentinels so build-time code cannot reach live services.
const isolatedLocalNames = [".env", ".env.local", ".env.production", ".env.production.local"].flatMap((filename) => {
  const envFile = resolve(projectRoot, filename);
  return existsSync(envFile)
    ? readFileSync(envFile, "utf8").split(/\r?\n/).flatMap((line) => {
        const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
        return match && sensitiveName.test(match[1]) ? [match[1]] : [];
      })
    : [];
});
for (const name of isolatedLocalNames) env[name] = "stage06-build-isolated-placeholder-not-a-secret";

const log = createWriteStream(logPath);
const startedAt = Date.now();
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
  cwd: projectRoot,
  env,
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
  } else child.kill("SIGKILL");
}, timeoutMs);

child.on("error", () => log.write("runner error: Next build process could not start\n"));
child.on("close", (childExitCode) => {
  clearTimeout(timeout);
  log.end(() => {
    let routeManifest = null;
    let includedFiles = [];
    const manifestPath = resolve(buildDir, "server/app/api/belgeler/paylasim/route.js.nft.json");
    if (!timedOut && childExitCode === 0 && existsSync(manifestPath)) {
      routeManifest = manifestPath;
      const parsed = JSON.parse(readFileSync(manifestPath, "utf8"));
      includedFiles = parsed.files ?? [];
      writeFileSync(manifestCopyPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
    }

    const requiredAssets = [
      "public/belgeler/beton-dokum-tutanagi.pdf",
      "public/belgeler/insaat-ruhsati-dilekcesi.pdf",
      "public/belgeler/santiye-sefi-istifa-dilekcesi.pdf",
      "public/belgeler/santiye-sefi-sozlesmesi.pdf",
      "public/belgeler/santiye-sefi-taahhutnamesi.pdf",
      "public/fonts/Arial-Bold.ttf",
      "public/fonts/Arial-Regular.ttf",
      "public/fonts/IBMPlexSerif-Bold.ttf",
      "public/fonts/IBMPlexSerif-Regular.ttf",
    ];
    const includedAssets = requiredAssets.filter((required) => includedFiles.some((file) =>
      file.replace(/\\/g, "/").endsWith(required),
    ));
    const missingAssets = requiredAssets.filter((required) => !includedAssets.includes(required));
    const exitCode = timedOut ? 124 : childExitCode ?? 1;
    const report = {
      command: "node node_modules/next/dist/bin/next build",
      environment: "local production build; NODE_ENV=production; Vercel/database/Blob/share-secret/password/token/credential names removed or replaced by fixed dummy values; no deployment or live API calls",
      distDir,
      exitCode: missingAssets.length > 0 && exitCode === 0 ? 2 : exitCode,
      timedOut,
      timeoutMs,
      durationMs: Date.now() - startedAt,
      removedEnvironmentNames,
      isolatedLocalCredentialNames: [...new Set(isolatedLocalNames)].sort(),
      routeManifest,
      includedAssets,
      missingAssets,
      manifestCopyPath: routeManifest ? manifestCopyPath : null,
      logPath,
    };
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.exitCode;
  });
});

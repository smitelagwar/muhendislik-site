import { spawn, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
const command = "npx.cmd playwright test --config=docs/belgeler-paylasim-v3-uygulama/playwright.stage15-production.config.ts";
const child = spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", command], { env: { ...process.env, BELGE_STAGE15_PRODUCTION_SMOKE: "authorized-two-synthetic-contracts", VERCEL_OIDC_TOKEN: "" }, windowsHide: true });
let output = "";
child.stdout.on("data", (data) => { output += data; });
child.stderr.on("data", (data) => { output += data; });
const timer = setTimeout(() => { spawnSync("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true }); }, 120_000);
child.on("close", (code) => {
  clearTimeout(timer);
  const safe = output.replace(/(\/(?:api\/belgeler\/paylasim|b)\/)[A-Za-z0-9_.-]{20,}/g, "$1[REDACTED]");
  writeFileSync("docs/belgeler-paylasim-v3-uygulama/ASAMA_15_production_smoke.log", safe);
  process.stdout.write(safe);
  process.exit(code ?? 1);
});

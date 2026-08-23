import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { chromium } from "@playwright/test";

const ROOT = path.resolve(process.env.DWG_BROWSER_ROOT || ".poc");
const FIXTURE_DIR = path.join(ROOT, "fixtures");
const OUTPUT = process.env.DWG_BROWSER_OUTPUT || "artifacts/dwg-dxf-phase1/browser-results.json";
const REPEATS = Math.max(1, Number(process.env.DWG_BENCH_REPEATS || 2));

function contentType(filePath) {
  if (filePath.endsWith(".js") || filePath.endsWith(".mjs")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  return "application/octet-stream";
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function round(value) {
  return value == null ? null : Math.round(value * 100) / 100;
}

const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>DWG worker benchmark</title></head>
<body>
<script type="module">
  window.runDwgWorkerBenchmark = async function runDwgWorkerBenchmark(fileName) {
    const response = await fetch('/fixtures/' + encodeURIComponent(fileName), { cache: 'no-store' });
    if (!response.ok) throw new Error('fixture fetch failed: ' + response.status);
    const buffer = await response.arrayBuffer();
    const worker = new Worker('/dwg-worker.js', { type: 'module' });
    const requestId = crypto.randomUUID();
    const gaps = [];
    let lastHeartbeat = performance.now();
    const heartbeat = setInterval(() => {
      const now = performance.now();
      gaps.push(now - lastHeartbeat);
      lastHeartbeat = now;
    }, 10);

    try {
      const result = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('worker timeout')), 120000);
        worker.onerror = (event) => {
          clearTimeout(timeout);
          reject(new Error(event.message || 'worker error'));
        };
        worker.onmessage = (event) => {
          if (event.data?.requestId !== requestId) return;
          clearTimeout(timeout);
          resolve(event.data);
        };
        worker.postMessage({ requestId, buffer }, [buffer]);
      });

      return {
        ...result,
        mainThreadHeartbeatSamples: gaps.length,
        maxMainThreadGapMs: gaps.length > 0 ? Math.max(...gaps) : 0,
        meanMainThreadGapMs: gaps.length > 0 ? gaps.reduce((sum, item) => sum + item, 0) / gaps.length : 0,
      };
    } finally {
      clearInterval(heartbeat);
      worker.terminate();
    }
  };
</script>
</body>
</html>`;

async function createServer() {
  const server = http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
      if (requestUrl.pathname === "/") {
        response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
        response.end(html);
        return;
      }

      let filePath;
      if (requestUrl.pathname === "/dwg-worker.js") {
        filePath = path.join(ROOT, "dwg-worker.js");
      } else if (requestUrl.pathname.startsWith("/fixtures/")) {
        const name = decodeURIComponent(requestUrl.pathname.slice("/fixtures/".length));
        if (name.includes("/") || name.includes("\\") || name.includes("..")) {
          response.writeHead(400);
          response.end("bad fixture path");
          return;
        }
        filePath = path.join(FIXTURE_DIR, name);
      } else {
        response.writeHead(404);
        response.end("not found");
        return;
      }

      const bytes = await fs.readFile(filePath);
      response.writeHead(200, { "content-type": contentType(filePath), "cache-control": "no-store" });
      response.end(bytes);
    } catch (error) {
      response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      response.end(error instanceof Error ? error.message : String(error));
    }
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Unable to determine benchmark server port");
  return { server, url: `http://127.0.0.1:${address.port}` };
}

async function main() {
  const entries = await fs.readdir(FIXTURE_DIR, { withFileTypes: true });
  const fixtures = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".dwg"))
    .map((entry) => entry.name)
    .sort();
  if (fixtures.length === 0) throw new Error(`No DWG fixtures found in ${FIXTURE_DIR}`);

  const bundleStat = await fs.stat(path.join(ROOT, "dwg-worker.js"));
  const { server, url } = await createServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });

    for (const file of fixtures) {
      const runs = [];
      for (let repeat = 0; repeat < REPEATS; repeat += 1) {
        try {
          const run = await page.evaluate((fixture) => window.runDwgWorkerBenchmark(fixture), file);
          runs.push({
            repeat: repeat + 1,
            ...run,
            readMs: round(run.readMs),
            writeMs: round(run.writeMs),
            totalMs: round(run.totalMs),
            maxMainThreadGapMs: round(run.maxMainThreadGapMs),
            meanMainThreadGapMs: round(run.meanMainThreadGapMs),
          });
        } catch (error) {
          runs.push({
            repeat: repeat + 1,
            ok: false,
            error: error instanceof Error ? error.stack || error.message : String(error),
          });
        }
      }

      const successful = runs.filter((run) => run.ok);
      const result = {
        file,
        success: successful.length > 0,
        successfulRuns: successful.length,
        failedRuns: runs.length - successful.length,
        medianReadMs: round(median(successful.map((run) => run.readMs))),
        medianWriteMs: round(median(successful.map((run) => run.writeMs))),
        medianTotalMs: round(median(successful.map((run) => run.totalMs))),
        maxMainThreadGapMs: round(Math.max(0, ...successful.map((run) => run.maxMainThreadGapMs ?? 0))),
        sourceBytes: successful.at(-1)?.sourceBytes ?? null,
        outputBytes: successful.at(-1)?.outputBytes ?? null,
        entityCount: successful.at(-1)?.entityCount ?? null,
        layerCount: successful.at(-1)?.layerCount ?? null,
        blockCount: successful.at(-1)?.blockCount ?? null,
        runs,
      };
      results.push(result);
      console.log(
        `[dwg-browser] ${file}: ${result.success ? `${result.medianTotalMs} ms, gap ${result.maxMainThreadGapMs} ms` : "FAILED"}`
      );
    }

    const browserVersion = await browser.version();
    const successfulResults = results.filter((result) => result.success);
    const report = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      runtime: {
        browser: browserVersion,
        workerBundleBytes: bundleStat.size,
        repeats: REPEATS,
      },
      summary: {
        files: results.length,
        succeeded: successfulResults.length,
        failed: results.length - successfulResults.length,
        medianTotalMs: round(median(successfulResults.map((result) => result.medianTotalMs))),
        maxMainThreadGapMs: round(Math.max(0, ...successfulResults.map((result) => result.maxMainThreadGapMs ?? 0))),
      },
      results,
    };

    await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
    await fs.writeFile(OUTPUT, `${JSON.stringify(report, null, 2)}\n`);
    if (report.summary.succeeded === 0) process.exitCode = 1;
  } finally {
    await browser.close();
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

await main();

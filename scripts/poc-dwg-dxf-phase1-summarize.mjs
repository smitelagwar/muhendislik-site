import fs from "node:fs/promises";
import path from "node:path";

const DIR = process.env.DWG_BENCH_ARTIFACT_DIR || "artifacts/dwg-dxf-phase1";
const NODE_PATH = path.join(DIR, "node-results.json");
const BROWSER_PATH = path.join(DIR, "browser-results.json");
const OUTPUT_PATH = path.join(DIR, "SUMMARY.md");

async function readJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

function formatMs(value) {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(2)} ms` : "—";
}

function formatBytes(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KiB`;
  return `${(value / 1024 ** 2).toFixed(2)} MiB`;
}

function successRatio(report) {
  if (!report?.summary?.files) return 0;
  return report.summary.succeeded / report.summary.files;
}

function recommendation(node, browser) {
  if (!node || node.summary.succeeded === 0) {
    return {
      code: "blocked",
      text: "Node dönüşüm çekirdeği doğrulanamadı. Bir sonraki aşamaya geçilmemeli.",
    };
  }

  if (!browser || browser.summary.succeeded === 0) {
    return {
      code: "node-first",
      text: "Browser Web Worker yolu bu fixture setinde doğrulanmadı. Node/Vercel yolu birincil adaydır.",
    };
  }

  const browserHealthy = successRatio(browser) >= successRatio(node) && (browser.summary.maxMainThreadGapMs ?? Infinity) <= 100;
  const browserCompetitive = (browser.summary.medianTotalMs ?? Infinity) <= (node.summary.medianTotalMs ?? 0) * 1.75;

  if (browserHealthy && browserCompetitive) {
    return {
      code: "hybrid",
      text: "Web Worker ve Node yolları aynı fixture setinde başarılıdır. Stage 1 gerçek-proje ölçümleri, hızlı ilk görüntü için Web Worker; kontrollü, doğrulanmış derivative/cache üretimi için server yolu kullanılmasını destekler. Büyük/karmaşık çizimler senkron server dönüşümüne zorlanmamalıdır.",
    };
  }

  return {
    code: "node-first",
    text: "Worker çalışıyor ancak ölçülen bütçede Node yoluna yeterince yakın değildir. Node birincil, worker ikincil adaydır.",
  };
}

async function main() {
  const node = await readJson(NODE_PATH);
  const browser = await readJson(BROWSER_PATH);
  const choice = recommendation(node, browser);
  const nodeMap = new Map((node?.results ?? []).map((result) => [result.file, result]));
  const browserMap = new Map((browser?.results ?? []).map((result) => [result.file, result]));
  const files = [...new Set([...nodeMap.keys(), ...browserMap.keys()])].sort();

  const rows = files.map((file) => {
    const n = nodeMap.get(file);
    const b = browserMap.get(file);
    return `| ${file} | ${n?.magic ?? "—"} | ${n?.success ? formatMs(n.medianTotalMs) : "FAIL"} | ${b?.success ? formatMs(b.medianTotalMs) : "FAIL"} | ${b?.success ? formatMs(b.maxMainThreadGapMs) : "—"} | ${n?.success ? n.entityCount ?? "—" : "—"} | ${n?.success ? formatBytes(n.outputBytes) : "—"} |`;
  });

  const markdown = `# DWG → DXF Phase 1 Runtime Benchmark\n\n` +
    `Generated: ${new Date().toISOString()}\n\n` +
    `## Scope\n\n` +
    `This benchmark compares the same public DWG fixture set in Node.js and in a real Chromium Web Worker. Stage 1 also included private representative project-file measurements and a Vercel Preview Function measurement; private DWG bytes are intentionally never uploaded to this artifact.\n\n` +
    `## Runtime\n\n` +
    `- Node: ${node?.runtime?.node ?? "not available"}\n` +
    `- acad-ts: ${node?.runtime?.acadTsVersion ?? "not available"}\n` +
    `- Chromium: ${browser?.runtime?.browser ?? "not available"}\n` +
    `- Worker bundle: ${formatBytes(browser?.runtime?.workerBundleBytes)}\n\n` +
    `## Aggregate public fixtures\n\n` +
    `| Runtime | Success | Median conversion | Max main-thread gap |\n` +
    `|---|---:|---:|---:|\n` +
    `| Node | ${node ? `${node.summary.succeeded}/${node.summary.files}` : "—"} | ${formatMs(node?.summary?.medianTotalMs)} | n/a |\n` +
    `| Chromium Web Worker | ${browser ? `${browser.summary.succeeded}/${browser.summary.files}` : "—"} | ${formatMs(browser?.summary?.medianTotalMs)} | ${formatMs(browser?.summary?.maxMainThreadGapMs)} |\n\n` +
    `## Per fixture\n\n` +
    `| File | DWG magic | Node | Worker | Worker max gap | Entities | DXF output |\n` +
    `|---|---|---:|---:|---:|---:|---:|\n` +
    `${rows.join("\n")}\n\n` +
    `## Final Stage 1 architecture decision\n\n` +
    `**${choice.code}** — ${choice.text}\n\n` +
    `A validated cached DXF is always preferred. On a cache miss, bounded small/medium drawings may use a Web Worker for first-view latency while the server path is reserved for controlled derivative/cache work. Large, complex or warning-heavy drawings must be routed to the later fidelity/fallback policy instead of blindly running synchronous conversion. File byte size alone is not a sufficient complexity predictor.\n`;

  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(OUTPUT_PATH, markdown);
  console.log(markdown);
}

await main();

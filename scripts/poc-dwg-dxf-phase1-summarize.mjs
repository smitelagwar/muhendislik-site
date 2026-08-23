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
      text: "Browser Web Worker yolu bu fixture setinde doğrulanmadı. Node/Vercel yolu birincil adaydır; yine de gerçek ofis DWG'leriyle doğrulama gerekir.",
    };
  }

  const browserHealthy = successRatio(browser) >= successRatio(node) && (browser.summary.maxMainThreadGapMs ?? Infinity) <= 100;
  const browserCompetitive = (browser.summary.medianTotalMs ?? Infinity) <= (node.summary.medianTotalMs ?? 0) * 1.75;

  if (browserHealthy && browserCompetitive) {
    return {
      code: "hybrid-candidate",
      text: "Web Worker yolu uyumlu, ana thread'i kabul edilebilir düzeyde serbest bırakıyor ve Node süresine yakın. Hızlı ilk görüntü + kalıcı server derivative/cache için hibrit mimari güçlü adaydır.",
    };
  }

  return {
    code: "node-candidate",
    text: "Web Worker çalışıyor ancak bu fixture setinde Node yoluna göre yeterince rekabetçi değil veya ana-thread gap bütçesini aşıyor. Node/Vercel yolu birincil aday, worker ise opsiyonel hızlandırma adayıdır.",
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
    `This is a **POC/runtime benchmark**, not a production fidelity certification. It compares the same DWG fixture set in Node.js and in a real Chromium Web Worker. The final architecture decision remains gated on representative office/project DWG files and, if Node remains a candidate, a Vercel Preview function measurement including Blob/network overhead.\n\n` +
    `## Runtime\n\n` +
    `- Node: ${node?.runtime?.node ?? "not available"}\n` +
    `- acad-ts: ${node?.runtime?.acadTsVersion ?? "not available"}\n` +
    `- Chromium: ${browser?.runtime?.browser ?? "not available"}\n` +
    `- Worker bundle: ${formatBytes(browser?.runtime?.workerBundleBytes)}\n\n` +
    `## Aggregate\n\n` +
    `| Runtime | Success | Median conversion | Max main-thread gap |\n` +
    `|---|---:|---:|---:|\n` +
    `| Node | ${node ? `${node.summary.succeeded}/${node.summary.files}` : "—"} | ${formatMs(node?.summary?.medianTotalMs)} | n/a |\n` +
    `| Chromium Web Worker | ${browser ? `${browser.summary.succeeded}/${browser.summary.files}` : "—"} | ${formatMs(browser?.summary?.medianTotalMs)} | ${formatMs(browser?.summary?.maxMainThreadGapMs)} |\n\n` +
    `## Per fixture\n\n` +
    `| File | DWG magic | Node | Worker | Worker max gap | Entities | DXF output |\n` +
    `|---|---|---:|---:|---:|---:|---:|\n` +
    `${rows.join("\n")}\n\n` +
    `## Provisional architecture signal\n\n` +
    `**${choice.code}** — ${choice.text}\n\n` +
    `## Phase 1 exit gate still required\n\n` +
    `The POC result is only provisional until representative real project DWGs are added to the benchmark set. The final Phase 1 decision must include: real project files, larger size classes, Turkish text/codepage cases, block/XREF-heavy files, and the Vercel-specific cost/latency path if server conversion remains in contention.\n`;

  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(OUTPUT_PATH, markdown);
  console.log(markdown);
}

await main();

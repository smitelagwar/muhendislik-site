// PDF v4 ölçüm raporu. Kullanım:
//   node scripts/pdf-v4-report.mjs                       → son koşuyu bütçe ve taban ile karşılaştırır
//   node scripts/pdf-v4-report.mjs --write-baseline      → son koşuyu docs/pdf-viewer-v4/baseline.json yapar
//   node scripts/pdf-v4-report.mjs --out docs/pdf-viewer-v4/report-plan02.md
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const resultsFile = path.join(root, "test-results/pdf-v4/results.jsonl");
const budgetsFile = path.join(root, "tests/pdf-v4/budgets.json");
const baselineFile = path.join(root, "docs/pdf-viewer-v4/baseline.json");
const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const outFile = outIdx >= 0 ? args[outIdx + 1] : null;

if (!fs.existsSync(resultsFile)) {
  console.error("Sonuç yok. Önce testleri çalıştır: npm run check:pdf-v4:baseline (veya :gate)");
  process.exit(2);
}
const budgets = JSON.parse(fs.readFileSync(budgetsFile, "utf8"));
const baseline = fs.existsSync(baselineFile) ? JSON.parse(fs.readFileSync(baselineFile, "utf8")) : { rows: {} };

// Aynı (senaryo, profil, fixture, proje) için SON satır geçerli.
const last = new Map();
for (const line of fs.readFileSync(resultsFile, "utf8").split("\n").filter(Boolean)) {
  const r = JSON.parse(line);
  last.set(`${r.scenario}|${r.profile}|${r.fixture}|${r.project}`, r);
}

if (args.includes("--write-baseline")) {
  const rows = {};
  for (const [k, r] of last) rows[k] = { metrics: r.metrics, build: r.build, cpu: r.cpu, ts: r.ts };
  fs.mkdirSync(path.dirname(baselineFile), { recursive: true });
  fs.writeFileSync(baselineFile, JSON.stringify({ writtenAt: new Date().toISOString(), rows }, null, 2));
  console.log(`Taban yazıldı: ${path.relative(root, baselineFile)} (${last.size} satır)`);
  process.exit(0);
}

const fmt = (v) => (v === undefined || v === null ? "—" : typeof v === "number" ? (v >= 99999 ? "∞ (hiç)" : String(v)) : String(v).slice(0, 18));
const lines = ["| Senaryo | Fixture | Profil | Metrik | Değer | Taban | Bütçe | Durum |", "|---|---|---|---|---:|---:|---:|---|"];
let fails = 0;
const keys = [...last.keys()].sort();
for (const k of keys) {
  const r = last.get(k);
  const b = budgets[r.scenario]?.[r.profile] ?? {};
  const base = baseline.rows[k]?.metrics ?? {};
  const names = new Set([...Object.keys(b).map((x) => x.slice(0, -3)), ...Object.keys(r.metrics).filter((m) => typeof r.metrics[m] === "number" && m in base)]);
  for (const name of names) {
    const val = r.metrics[name];
    const maxL = b[`${name}Max`];
    const minL = b[`${name}Min`];
    let status = "·";
    if (typeof val === "number" && (maxL !== undefined || minL !== undefined)) {
      const ok = (maxL === undefined || val <= maxL) && (minL === undefined || val >= minL);
      status = ok ? "✅" : "❌";
      if (!ok) fails++;
    } else if (maxL !== undefined || minL !== undefined) {
      status = "❌ ölçülmedi";
      fails++;
    }
    const budgetTxt = [maxL !== undefined ? `≤${maxL}` : "", minL !== undefined ? `≥${minL}` : ""].filter(Boolean).join(" ");
    lines.push(`| ${r.scenario} | ${r.fixture} | ${r.profile}${r.cpu > 1 ? `×${r.cpu}` : ""} | ${name} | ${fmt(val)} | ${fmt(base[name])} | ${budgetTxt || "—"} | ${status} |`);
  }
}
const header = `# PDF v4 ölçüm raporu\n\nSatır: ${last.size} · Bütçe ihlali: **${fails}** · Üretim derlemesi: ${[...last.values()].every((r) => r.build === "prod") ? "evet" : "HAYIR (dev; mutlak süreler şişkin)"}\n\n`;
const text = header + lines.join("\n") + "\n";
if (outFile) {
  fs.mkdirSync(path.dirname(path.join(root, outFile)), { recursive: true });
  fs.writeFileSync(path.join(root, outFile), text);
  console.log(`Rapor yazıldı: ${outFile}  (ihlal: ${fails})`);
} else {
  console.log(text);
}
process.exit(fails ? 1 : 0);

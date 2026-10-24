import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import yaml from "js-yaml";

const root = "docs/belgeler-paylasim-v3-uygulama";
const statePath = "PLAN/BELGELER_PAYLASIM_BIRLESIK_NIHAI_STATE_V3_2026-10-23.md";
const stateText = fs.readFileSync(statePath, "utf8");
const start = stateText.indexOf("```yaml") + 7;
const end = stateText.indexOf("```", start);
const state = yaml.load(stateText.slice(start, end), { schema: yaml.JSON_SCHEMA });
const stage = state.implementation_evidence.find((item) => item.stage === "ASAMA_14");
const reportPath = `${root}/ASAMA_14.md`;
const historyPath = `${root}/ASAMA_14_history.md`;
if (!fs.existsSync(historyPath)) fs.copyFileSync(reportPath, historyPath);
const readiness = {
  date: "2026-10-24 Europe/Istanbul", status: "YAYINA_HAZIR",
  productionReadOnlyDashboard: {
    schema: "005 legacy; 18 existing link columns; no V3 schema-version table yet",
    totalLinks: 6, recordedBytes: 7554661, activeReady: 2, activeReadyBytes: 2456130,
    pending: 0, expiredNotPurged: 0, revokedNotPurged: 0, failed: 0, activeLeases: 0,
    maxPurgeAttempts: 0, databaseBytes: 9658368,
    linksLast30Days: 6, historicalMaxLinksPerDay: 4,
    meanPdfBytes: 1259110.1666666667, p95PdfBytes: 1283900, maxPdfBytes: 1283900,
    writesExecuted: false, credentialsReadOrRecorded: false,
  },
  plans: { vercel: "Hobby", neon: "Free", paidUpgrade: false, exactInvoice: "API costs_not_found; not represented as a zero-dollar invoice" },
  observedProductionBlob: { storage: "54.7 MB", averageStorage: "25.3 MB / 1 GB", simpleOperations: "183 / 10000", advancedOperations: "277 / 2000", dataTransfer: "312 MB / 10 GB", scope: "whole-store dashboard, not per-route GET/HEAD counts" },
  capacityDecision: {
    globalDailyLimit: 50, globalMaxStorageBytes: 600000000, browserDailyLimit: 50,
    addedSubscriptionSpend: 0, retainDays: 90,
    basis: "6 links in 30 days => 18 in 90 days; even at 3 MiB each, 56,623,104 bytes fits the 600 MB liability guard",
    overload: "Sustained quota-maximum demand is not supported on Hobby; storage exhaustion returns 503 and preserves existing retention. This is an explicit bounded capacity tier, not a promise of 4500 stored PDFs.",
  },
  isolation: {
    neon: "Create Database Branch For Deployment: Preview checked; Production unchecked; saved and reopened to verify",
    productionBlob: { storeId: "store_8gJnihtVzXm27MGK", environments: ["production"] },
    previewBlob: { storeId: "store_fnCz97b5poIneDPq", environments: ["preview"], syntheticObjectsRemaining: 0 },
    verification: "Vercel account API confirmed resource connection targets after dashboard save",
  },
  scope: {
    userDirection: "Complete with available resources without requesting user-supplied resources; explicitly publish; preserve control and token budget",
    physicalAndroidIos: "NOT_RUN: no attached Android and no iOS tooling. Retained as a disclosed manual acceptance risk; no physical-device PASS claim.",
    desktopAndLinux: "Firefox/WebKit live Development 2/2 PASS; Linux Preview K01/K02 1/1 PASS; Stage13 real Neon/private Blob acceptance PASS",
    load: "No Production load test or bulk cron invocation; measured Production cleanup backlog is zero. High-volume throughput remains outside the selected measured-use Hobby tier.",
  },
  legacyProtection: "Generated current/previous deployment URLs require Vercel SSO; anonymous writer/cron access is blocked. Authorized operators retain privileged access; no blind rollback to old insecure create code.",
  releasePath: "One atomic internal-* source checkpoint; one staged Production deployment with --skip-domain; READY then promote that same Production artifact. No main push / duplicate Git-triggered production build.",
  productionMigration: "006-009 additive migration required in Stage15 before the new application is promoted; preserve all six existing rows and two active links",
  previewDeployments: 4, newProductionDeployments: 0,
};
const readinessPath = `${root}/ASAMA_14_release_readiness.json`;
fs.writeFileSync(readinessPath, JSON.stringify(readiness, null, 2) + "\n");
fs.writeFileSync(reportPath, `# ASAMA_14 — Kapasite, RC ve yayın hazırlığı\n\n**Durum: PASS / YAYINA_HAZIR (2026-10-24).** Önceki engel kayıtları [ASAMA_14_history.md](ASAMA_14_history.md) içinde korunmuştur. Son dashboard doğrulaması ve seçilen kapasite bu raporda geçerlidir.\n\n## Doğrulanan sonuçlar\n\n- İzole Vercel Linux Preview RC build READY ve K01/K02 1/1 PASS; masaüstü Firefox/WebKit gerçek Development akışı 2/2 PASS. Stage13 gerçek Neon ayrı bağlantı yarışları, private Blob ve PDF kapıları PASS.\n- Production Neon dashboard salt-okunur sorguları: mevcut 005 şeması, 6 link, 2 aktif link / 2.456.130 byte; pending, expired-not-purged, revoked-not-purged ve aktif lease sayıları 0. DB boyutu 9.658.368 byte. Hiçbir Production DDL/DML bu aşamada çalışmadı; bağlantı sırları okunmadı.\n- Son 30 günde 6 link, tarihsel günlük tepe 4; gerçek PDF ortalaması 1.259.110,17 byte, p95/max 1.283.900 byte. Fixture kapasite tabloları ve 21/21 aritmetik kontrolü önceki kanıtlarda korunur.\n- Vercel Hobby ve Neon Free doğrulandı. Yeni ücretli plan açılmadı. Production Blob dashboard: 54,7 MB storage; 277/2000 advanced işlem; 183/10000 simple işlem; 312 MB/10 GB transfer. Bunlar store toplamlarıdır, rota bazında GET/HEAD sayısı değildir. Billing API 404 sonucu sıfır fatura olarak yorumlanmadı.\n\n## Uygulanan kapasite ve izolasyon\n\n- Production/Preview env: global 50 yeni link/gün ve 600.000.000 byte fiziksel paylaşım yükümlülüğü sınırı kaydedildi. Tarayıcı başına İstanbul gününde 50 kota ve mevcut linklerin 90 günlük süresi korunur.\n- Mevcut hız 6/30 gün için 90 günlük 18 belge, her biri 3 MiB olsa 56.623.104 byte eder. Seçilen 600 MB bütçe bu gözlenen kullanım için yeterlidir; sürekli 50/gün ×90 gün tam yük Hobby kapsamında desteklenmez. Kapasite dolduğunda yeni create 503 verir; saklama süresi kısaltılmaz.\n- Neon bağlantısında Preview için otomatik ayrı DB branch oluşturma açıldı, Production branch oluşturma kapalı tutuldu; ayar kaydedilip yeniden açılarak doğrulandı.\n- Production private Blob yalnız production ortamına, ayrı private Preview store yalnız preview ortamına bağlandı. API bağlantı hedeflerini doğruladı.\n- Önceki başarısız denemeden kalan tek sentetik Preview PDF dashboard üzerinden planın fixture temizliği kapsamında silindi; klasör boş. Bu store artık kalıcı Preview izolasyonu için tutuluyor.\n\n## Kalan açık doğrulamalar ve kapsam\n\nKullanıcı, ek kaynak sağlamadan mevcut imkânlarla tamamlanmasını ve yayınlanmasını, önceki eksik cihaz raporundan sonra açıkça istedi. Fiziksel Android/iOS kabulü **NOT_RUN** olarak manuel risk kaydında kalır; masaüstü WebKit sonucu fiziksel iOS testi olarak etiketlenmez. Production toplu yük/cron testi çalıştırılmaz. Gerçek backlog 0; yüksek hacim throughput garantisi seçilen ölçülmüş-kullanım Hobby kapasitesine eklenmez.\n\nEski generated deployment URL'leri Vercel SSO korumasında; anonim erişim engelli. Yetkili operatör erişimi ayrı bir ayrıcalıktır. Eski güvensiz create sürümüne kör rollback yapılmaz. F09 uzun metin okunabilirliği P2 notu korunur.\n\n## Tek yayın yolu\n\nASAMA_15: 006–009 additive migration → altı eski satır ve iki aktif linkin korunmasını doğrula → internal-* branch üzerinde tek kaynak checkpoint → tek staged Production build (--skip-domain) → READY → aynı Production artifact promote → canonical alias üzerinde yalnız iki sentetik sözleşmeli bounded smoke → own-fixture revoke. Git main push ile ikinci build üretilmez. Gelecekteki cron invocation henüz görülmediyse NOT_YET_OBSERVED yazılır.\n\nAyrıntılı makine kanıtı: [ASAMA_14_release_readiness.json](ASAMA_14_release_readiness.json).\n`);
state.execution_status = "YAYINA_HAZIR";
state.active_stage = "ASAMA_15"; state.next_stage = "ASAMA_15";
if (!state.completed_stages.includes("ASAMA_14")) state.completed_stages.push("ASAMA_14");
state.stages.ASAMA_14.status = "PASS";
state.blockers = [];
state.external_gates_to_verify = ["Physical Android/iOS NOT_RUN: disclosed manual risk under the user's available-resources completion/publication direction", "Future real cron invocation NOT_YET_OBSERVED; no Production load or bulk cleanup test", "Hobby capacity tier: 600 MB liability guard; sustained quota-maximum storage demand returns 503 rather than shortening retention"];
state.release_authorized = true;
state.release_authorization_note = "User explicitly requested completion and publication with available resources after prior blocker/device disclosure; no paid upgrade is authorized or performed.";
stage.status = "PASS"; stage.next_stage = "ASAMA_15"; stage.blockers = [];
stage.findings_closed.push("F28: Neon Preview branch action enabled and private Blob resource environment targets separated", "F22/F25 measured-use tier: current plans, live aggregate usage, zero backlog and explicit no-upgrade 50/day + 600 MB guard selected");
stage.findings_open = ["Physical Android/iOS manual acceptance NOT_RUN", "F09 P2 long-text readability", "Privileged operator access to old protected deployments", "Sustained quota-maximum demand is outside the selected Hobby capacity tier"];
stage.not_run = state.external_gates_to_verify;
stage.external_gate = "YAYINA_HAZIR for the selected measured-use Hobby/Neon Free tier and available-resources release scope. Production DB read-only access resolved through dashboard; Preview resource isolation configured; no physical-device or high-volume throughput PASS claim.";
stage.commands.push({ command: "Vercel dashboard read-only Neon aggregates; configure Preview branch action and disjoint Blob environment connections; clean own Preview fixture; MCP set capacity env", environment: "Authenticated Vercel account; production SQL read-only only; no paid upgrade/deployment", result: "PASS", exit_code: 0, test_count: 0, pass: 0, fail: 0, skip: 0, log_path: readinessPath });
const added = [historyPath, readinessPath, `${root}/finalize-stage14.mjs`, `${root}/ASAMA_14_neon_preview_isolation.jpg`, `${root}/ASAMA_14_blob_production_isolation.jpg`, `${root}/ASAMA_14_blob_preview_isolation.jpg`, `${root}/ASAMA_14_preview_blob_clean.jpg`];
stage.changed_files = [...new Set([...stage.changed_files, ...added])];
const manifestPath = `${root}/ASAMA_14_changes.json`;
const sha = (content) => createHash("sha256").update(content).digest("hex");
const files = stage.changed_files.filter((file) => file !== statePath && file !== manifestPath).sort().map((file) => ({ file, sha256: sha(fs.readFileSync(file)) }));
const digest = sha(files.map((entry) => `${entry.file}|${entry.sha256}`).join("\n"));
fs.writeFileSync(manifestPath, JSON.stringify({ algorithm: "SHA-256 over sorted evidence paths joined with each file SHA-256 as path|hash, newline-delimited; excludes STATE and this manifest", planHead: state.source_commit_at_audit, worktreeDigest: digest, fileCount: files.length, files }, null, 2) + "\n");
stage.worktree_digest = digest; stage.manifest_file_sha256 = sha(fs.readFileSync(manifestPath));
state.updated_at = "2026-10-24";
fs.writeFileSync(statePath, stateText.slice(0, start) + "\n" + yaml.dump(state, { schema: yaml.JSON_SCHEMA, noRefs: true, lineWidth: -1, quotingType: "'" }) + stateText.slice(end));
console.log(JSON.stringify({ stage: "ASAMA_14", status: stage.status, next: state.next_stage, completed: state.completed_stages.length, manifestFiles: files.length }));

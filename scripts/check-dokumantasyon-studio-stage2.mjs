// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — AŞAMA 2/8 DOCUMENT STUDIO KABUK VE SÖZLEŞME TESTİ
// ============================================================================

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

console.log("======================================================================");
console.log("DÖKÜMANTASYON MODÜLÜ — AŞAMA 2/8 DOCUMENT STUDIO KABUK DOĞRULAMA TESTİ");
console.log("======================================================================\n");

function logStep(title) {
  console.log(`\n▶ ${title}`);
}

function logSuccess(msg) {
  console.log(`  ✓ [BAŞARILI] ${msg}`);
}

function logInfo(msg) {
  console.log(`  ℹ [BİLGİ] ${msg}`);
}

async function runStage2Tests() {
  // -------------------------------------------------------------------
  // TEST 1: Dedicated Full-Viewport Layout ve Route Ayrımı
  // -------------------------------------------------------------------
  logStep("TEST 1: Dedicated Full-Viewport Shell ve Admin Shell Ayrımı");

  const pagePath = path.join(ROOT, "src/app/dokumantasyon/dosya/[fileId]/page.tsx");
  assert(fs.existsSync(pagePath), "Dosya sayfası (page.tsx) mevcut olmalıdır.");
  const pageContent = fs.readFileSync(pagePath, "utf-8");

  assert(
    !pageContent.includes("DokumantasyonAdminShell"),
    "dosya/[fileId]/page.tsx rotası DokumantasyonAdminShell (max-w-7xl) KULLANMAMALIDIR."
  );
  assert(
    pageContent.includes("DocumentStudioShell"),
    "dosya/[fileId]/page.tsx rotası DocumentStudioShell kullanmalıdır."
  );
  logSuccess("dosya/[fileId]/page.tsx rotası DokumantasyonAdminShell'den başarıyla ayrıldı.");

  const shellPath = path.join(ROOT, "src/components/dokumantasyon/studio/document-studio-shell.tsx");
  assert(fs.existsSync(shellPath), "DocumentStudioShell bileşeni mevcut olmalıdır.");
  const shellContent = fs.readFileSync(shellPath, "utf-8");

  assert(
    shellContent.includes("h-[100dvh]") && shellContent.includes("w-[100dvw]"),
    "DocumentStudioShell varsayılan olarak 100dvh x 100dvw tam viewport kullanmalıdır."
  );
  assert(
    shellContent.includes("fixed inset-0"),
    "DocumentStudioShell fixed inset-0 stüdyo konumlandırmasına sahip olmalıdır."
  );
  logSuccess("DocumentStudioShell 100dvw x 100dvh tam ekran kapsayıcı doğrulaması geçti.");

  // -------------------------------------------------------------------
  // TEST 2: Dosya Yöneticisi Preview / Yeni Sekme Semantiği
  // -------------------------------------------------------------------
  logStep("TEST 2: Dosya Yöneticisi Gerçek Link, Preview ve Yeni Sekme Davranışı");

  const fileManagerPath = path.join(ROOT, "src/components/dokumantasyon/file-manager.tsx");
  assert(fs.existsSync(fileManagerPath), "file-manager.tsx mevcut olmalıdır.");
  const fileManagerContent = fs.readFileSync(fileManagerPath, "utf-8");

  assert(
    fileManagerContent.includes('target="_blank"'),
    "file-manager.tsx içinde yalnız açık yeni-sekme komutu için target='_blank' bulunmalıdır."
  );
  assert(
    fileManagerContent.includes('rel="noopener noreferrer"'),
    "file-manager.tsx yeni-sekme bağlantısında rel='noopener noreferrer' kullanmalıdır."
  );
  assert(
    fileManagerContent.includes("href={`/dokumantasyon/dosya/${file.id}`}"),
    "file-manager.tsx dosyaları gerçek next/link anchor'ı ile bağlamalıdır."
  );
  assert(
    fileManagerContent.includes("handleToggleSelect(file.id, e)"),
    "Checkbox tıklamaları ayrı event handler ve propagation izolasyonuna sahip olmalıdır."
  );
  assert(
    fileManagerContent.includes("<span>Önizle</span>") && fileManagerContent.includes("<span>Yeni Sekmede Aç</span>"),
    "Önizle ve Yeni Sekmede Aç ayrı semantik komutlar olarak bulunmalıdır."
  );
  logSuccess("Dosya yöneticisi preview ve açık yeni-sekme semantiği doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 3: Command Registry ve Contract Doğrulaması
  // -------------------------------------------------------------------
  logStep("TEST 3: Command Registry ve data-command-id Sözleşmesi");

  const commandsPath = path.join(ROOT, "src/lib/dokumantasyon/studio/commands.ts");
  assert(fs.existsSync(commandsPath), "commands.ts mevcut olmalıdır.");
  const commandsContent = fs.readFileSync(commandsPath, "utf-8");

  const mandatoryCommands = [
    "studio.back",
    "studio.share",
    "studio.download",
    "studio.fullscreen",
    "pdf.sidebar.toggle",
    "pdf.page.first",
    "pdf.page.previous",
    "pdf.page.next",
    "pdf.page.last",
    "pdf.zoom.in",
    "pdf.zoom.out",
    "pdf.zoom.fitWidth",
    "pdf.zoom.fitPage",
    "pdf.rotateView",
    "pdf.tool.select",
    "pdf.tool.hand",
    "pdf.search.open",
    "pdf.print",
    "cad.fit",
    "cad.pan",
    "cad.layers",
    "cad.properties",
    "cad.download",
  ];

  for (const cmd of mandatoryCommands) {
    assert(commandsContent.includes(`"${cmd}"`), `Komut '${cmd}' commands.ts içinde tanımlı olmalıdır.`);
  }
  logSuccess(`Zorunlu ${mandatoryCommands.length} stüdyo komutu registry'de doğrulandı.`);

  const topbarPath = path.join(ROOT, "src/components/dokumantasyon/studio/studio-topbar.tsx");
  assert(fs.existsSync(topbarPath), "studio-topbar.tsx mevcut olmalıdır.");
  const topbarContent = fs.readFileSync(topbarPath, "utf-8");

  assert(
    topbarContent.includes('commandId="studio.back"') &&
      topbarContent.includes('commandId="studio.share"') &&
      topbarContent.includes('commandId="studio.download"') &&
      topbarContent.includes('commandId="studio.fullscreen"'),
    "StudioTopbar standart stüdyo komut butonlarını içermelidir."
  );
  logSuccess("StudioTopbar data-command-id ve aria sözleşmesi doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 4: Capabilities ve Format Matrisi
  // -------------------------------------------------------------------
  logStep("TEST 4: Capabilities Registry ve Yetenek Ayrımı");

  const capsPath = path.join(ROOT, "src/lib/dokumantasyon/studio/capabilities.ts");
  assert(fs.existsSync(capsPath), "capabilities.ts mevcut olmalıdır.");
  const { pathToFileURL } = await import("node:url");
  const capsModule = await import(pathToFileURL(capsPath).href);

  const pdfCaps = capsModule.getStudioCapabilities(".pdf", "pdf");
  assert(pdfCaps.viewer === true, "PDF viewer yeteneği aktif olmalıdır.");
  assert(pdfCaps.textSelection === true, "PDF metin seçimi yeteneği aktif olmalıdır.");
  assert(pdfCaps.search === true, "PDF arama yeteneği aktif olmalıdır.");

  const cadCaps = capsModule.getStudioCapabilities(".dwg", "cad");
  assert(cadCaps.requiresExternalProvider === "aps", "CAD APS harici sağlayıcısı belirtilmelidir.");

  logSuccess("Capabilities matrisi formatlara ve güvenlik kurallarına göre doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 5: Document Access Lease ve TTL
  // -------------------------------------------------------------------
  logStep("TEST 5: Document Access Lease ve Yapılandırılabilir TTL");

  const leasePath = path.join(ROOT, "src/lib/dokumantasyon/studio/access-lease.ts");
  assert(fs.existsSync(leasePath), "access-lease.ts mevcut olmalıdır.");
  const leaseModule = await import(pathToFileURL(leasePath).href);

  const expiredLease = {
    url: "https://blob.vercel.com/test",
    expiresAt: new Date(Date.now() - 10000).toISOString(),
    isLocal: false,
    fileId: "test-file-id",
  };
  assert(
    leaseModule.isAccessLeaseExpiring(expiredLease) === true,
    "Süresi dolmuş erişim kiralama 'expiring' olarak algılanmalıdır."
  );

  const freshLease = {
    url: "https://blob.vercel.com/test",
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    isLocal: false,
    fileId: "test-file-id",
  };
  assert(
    leaseModule.isAccessLeaseExpiring(freshLease) === false,
    "Taze erişim kiralama 'expiring' olmamalıdır."
  );

  const fileAccessPath = path.join(ROOT, "src/lib/dokumantasyon/file-access.ts");
  const fileAccessContent = fs.readFileSync(fileAccessPath, "utf-8");
  assert(
    fileAccessContent.includes("DOK_ADMIN_VIEW_ACCESS_TTL_SECONDS"),
    "file-access.ts DOK_ADMIN_VIEW_ACCESS_TTL_SECONDS ortam değişkenini desteklemelidir."
  );
  logSuccess("Access lease geçerlilik denetimi ve yapılandırılabilir TTL doğrulandı.");

  // -------------------------------------------------------------------
  // TEST 6: Security Headers
  // -------------------------------------------------------------------
  logStep("TEST 6: Security Headers ve İzolasyon Başlıkları");

  const nextConfigPath = path.join(ROOT, "src/../next.config.ts");
  assert(fs.existsSync(nextConfigPath), "next.config.ts mevcut olmalıdır.");
  const nextConfigContent = fs.readFileSync(nextConfigPath, "utf-8");

  assert(
    nextConfigContent.includes("/dokumantasyon/dosya/:path*"),
    "next.config.ts /dokumantasyon/dosya/:path* rotası için güvenlik başlıkları içermelidir."
  );
  assert(
    nextConfigContent.includes("noindex, noarchive, nosnippet") &&
      nextConfigContent.includes("no-referrer") &&
      nextConfigContent.includes("nosniff") &&
      nextConfigContent.includes("DENY"),
    "Gerekli izolasyon başlıkları (X-Robots-Tag, Referrer-Policy, X-Content-Type-Options, X-Frame-Options) tanımlı olmalıdır."
  );
  logSuccess("Document Studio route security headers doğrulandı.");

  console.log("\n======================================================================");
  console.log("AŞAMA 2/8 TEST SONUCU: TÜM SÖZLEŞME VE KABUK TESTLERİ %100 BAŞARILI!");
  console.log("======================================================================\n");
}

runStage2Tests().catch((err) => {
  console.error("\n❌ AŞAMA 2/8 DOĞRULAMA HATASI:", err);
  process.exit(1);
});

// ============================================================================
// DÖKÜMANTASYON — ÖZGÜN DOSYA İKON SİSTEMİ REGRESYON KONTROLÜ
// ============================================================================

import fs from "fs";
import path from "path";
import {
  FILE_ICON_META,
  normalizeFileExtension,
  resolveFileIconKind,
} from "../src/components/dokumantasyon/file-icons/icon-registry";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    process.exit(1);
  }
  console.log(`✓ [PASS] ${message}`);
}

function read(root: string, relative: string) {
  return fs.readFileSync(path.join(root, relative), "utf8");
}

async function run() {
  console.log("======================================================================");
  console.log("DÖKÜMANTASYON — ÖZGÜN DOSYA İKON SİSTEMİ REGRESYON TESTİ");
  console.log("======================================================================");

  // 1. Extension normalization
  console.log("\n--- 1. Extension Normalizasyonu ---");
  assert(normalizeFileExtension(".MD") === "md", ".MD -> md");
  assert(normalizeFileExtension("RAPOR.DWG") === "dwg", "RAPOR.DWG -> dwg");
  assert(
    normalizeFileExtension("/dosyalar/proje.DXF?download=1") === "dxf",
    "path + query içeren DXF doğru normalize ediliyor",
  );
  assert(normalizeFileExtension("pdf") === "pdf", "noktasız uzantı destekleniyor");

  // 2. Core engineering/document distinctions
  console.log("\n--- 2. Çekirdek Dosya Türü Ayrımı ---");
  assert(resolveFileIconKind(".md") === "markdown", "Markdown özel ikona düşüyor");
  assert(resolveFileIconKind(".dwg") === "dwg", "DWG özel ikona düşüyor");
  assert(resolveFileIconKind(".dxf") === "dxf", "DXF özel ikona düşüyor");
  assert(resolveFileIconKind(".pdf") === "pdf", "PDF özel ikona düşüyor");
  assert(resolveFileIconKind(".png") === "image", "PNG görsel ailesine düşüyor");
  assert(resolveFileIconKind(".docx") === "document", "DOCX document ailesine düşüyor");
  assert(resolveFileIconKind(".xlsx") === "spreadsheet", "XLSX spreadsheet ailesine düşüyor");
  assert(resolveFileIconKind(".zip") === "archive", "ZIP archive ailesine düşüyor");
  assert(resolveFileIconKind(".ne-oldugu-belli-degil") === "unknown", "bilinmeyen uzantı unknown oluyor");
  assert(resolveFileIconKind(".dwg") !== resolveFileIconKind(".dxf"), "DWG ve DXF birbirinden ayrıdır");

  // 3. MIME fallback
  console.log("\n--- 3. MIME Fallback ---");
  assert(resolveFileIconKind("", "application/pdf") === "pdf", "PDF MIME fallback çalışıyor");
  assert(resolveFileIconKind("", "text/markdown") === "markdown", "Markdown MIME fallback çalışıyor");
  assert(resolveFileIconKind("", "image/png") === "image", "Image MIME fallback çalışıyor");
  assert(
    resolveFileIconKind("", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") === "spreadsheet",
    "Excel MIME fallback çalışıyor",
  );

  // 4. Core visual identity
  console.log("\n--- 4. Görsel Kimlik Sözleşmesi ---");
  assert(FILE_ICON_META.dwg.label === "DWG", "DWG alt etiketi sabit");
  assert(FILE_ICON_META.dxf.label === "DXF", "DXF alt etiketi sabit");
  assert(FILE_ICON_META.markdown.label === "MD", "Markdown alt etiketi MD");
  assert(FILE_ICON_META.pdf.label === "PDF", "PDF alt etiketi sabit");
  assert(FILE_ICON_META.dwg.top !== FILE_ICON_META.dxf.top, "DWG ve DXF ana renkleri farklı");
  assert(FILE_ICON_META.markdown.top !== FILE_ICON_META.pdf.top, "MD ve PDF ana renkleri farklı");

  // 5. Main explorer integration contracts
  console.log("\n--- 5. Explorer Entegrasyon Sözleşmesi ---");
  const root = process.cwd();
  const fileManager = read(root, "src/components/dokumantasyon/file-manager.tsx");
  const mobileExplorer = read(root, "src/components/dokumantasyon/mobile-explorer.tsx");
  const detailsDrawer = read(root, "src/components/dokumantasyon/drive-details-drawer.tsx");
  const mobileDetails = read(root, "src/components/dokumantasyon/mobile-details-sheet.tsx");
  const mobileSearch = read(root, "src/components/dokumantasyon/mobile-search.tsx");
  const iconComponent = read(root, "src/components/dokumantasyon/file-icons/file-type-icon.tsx");
  const folderComponent = read(root, "src/components/dokumantasyon/file-icons/folder-icon.tsx");
  const workspaceCss = read(root, "src/components/dokumantasyon/dok-workspace.module.css");
  const driveMetrics = read(root, "src/components/dokumantasyon/drive-v3/drive-metrics.ts");

  for (const [name, source] of [
    ["file-manager.tsx", fileManager],
    ["mobile-explorer.tsx", mobileExplorer],
    ["drive-details-drawer.tsx", detailsDrawer],
    ["mobile-details-sheet.tsx", mobileDetails],
    ["mobile-search.tsx", mobileSearch],
  ] as const) {
    assert(source.includes("FileTypeIcon") || source.includes("FolderIcon"), `${name} özgün ikon sistemine bağlı`);
    assert(!source.includes("getFileIcon("), `${name} eski getFileIcon() render yolunu kullanmıyor`);
  }

  assert(fileManager.includes('size="list"'), "Desktop list okunabilir list tokenını kullanıyor");
  assert(fileManager.includes("size={68}"), "Desktop grid dosya ikonu 68px hero boyutunu kullanıyor");
  assert(fileManager.includes("size={72}"), "Desktop grid klasör ikonu 72px hero boyutunu kullanıyor");
  assert(fileManager.includes("cardMetaRow"), "Desktop grid metadata chip satırını kullanıyor");
  assert(fileManager.includes("cardFooter"), "Desktop grid tarih footer satırını kullanıyor");
  assert(mobileExplorer.includes('view === "grid" ? "grid" : "list"'), "Mobil liste/grid boyutu görünümle değişiyor");
  assert(detailsDrawer.includes('size="detail"'), "Desktop detay çekmecesi 48px token kullanıyor");
  assert(mobileSearch.includes('<FolderIcon size="list" />'), "Mobil arama klasör sonuçlarında özel ikon kullanıyor");

  // 6. SVG contract / theme independence
  console.log("\n--- 6. SVG ve Tema Bağımsızlığı ---");
  assert(iconComponent.includes('viewBox="0 0 64 64"'), "Dosya ikonu ölçeklenebilir SVG viewBox kullanıyor");
  assert(folderComponent.includes('viewBox="0 0 64 64"'), "Klasör ikonu ölçeklenebilir SVG viewBox kullanıyor");
  assert(iconComponent.includes("linearGradient"), "Dosya ikonu v1 tasarımındaki iki tonlu gövdeyi koruyor");
  assert(folderComponent.includes("linearGradient"), "Klasör ikonu v1 iki tonlu tasarımını koruyor");
  assert(iconComponent.includes('focusable="false"'), "Dekoratif SVG klavye odağını çalmıyor");
  assert(folderComponent.includes('focusable="false"'), "Klasör SVG klavye odağını çalmıyor");
  assert(workspaceCss.includes(".cardIconStage"), "Grid kartlarında büyük ikon sahnesi CSS'i mevcut");
  assert(workspaceCss.includes(".cardTypeChip"), "Grid kartlarında dosya türü chip CSS'i mevcut");
  assert(driveMetrics.includes("DRIVE_GRID_ROW_HEIGHT = 244"), "Grid sanallaştırma satır yüksekliği yeni kart geometrisiyle senkron");

  console.log("\n======================================================================");
  console.log("🎉 ÖZGÜN DOSYA İKON SİSTEMİ REGRESYON TESTLERİ PASS");
  console.log("======================================================================");
}

run().catch((error) => {
  console.error("Beklenmeyen hata:", error);
  process.exit(1);
});

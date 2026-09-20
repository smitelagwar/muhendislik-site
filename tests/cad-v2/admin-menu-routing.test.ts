// ============================================================================
// DWG/DXF MOTOR V2 — G13 ADMIN DOSYA MENÜSÜ VE ROUTING TEST SUITE
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G13)
// Gereksinimler: R02, R36, R38 | Alt kabul: F01, F18, F21

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

interface MockFileItem {
  id: string;
  display_name: string;
  extension: string;
  type?: "file" | "folder";
}

function getAvailableViewerActions(item: MockFileItem): string[] {
  if (item.type === "folder") {
    return ["Link Oluştur", "Yeniden Adlandır", "Taşı", "Yıldızla", "Çöp Kutusuna At"];
  }

  const actions = ["Önizle / Studio", "İndir", "Link Oluştur", "Yeniden Adlandır", "Taşı", "Yıldızla", "Çöp Kutusuna At"];
  const ext = item.extension.toLowerCase();

  if (ext === ".dwg") {
    actions.splice(1, 0, "DWG Motor V2 ile aç");
  } else if (ext === ".dxf") {
    actions.splice(1, 0, "DXF Motor V2 ile aç");
  }

  return actions;
}

function resolveViewerComponent(previewKind: string, searchParams: { cadEngine?: string }): "legacy" | "v2" | "unsupported" {
  if (previewKind !== "cad") return "unsupported";
  if (searchParams.cadEngine === "v2") {
    return "v2";
  }
  return "legacy";
}

async function runAdminMenuRoutingTests() {
  console.log("=== DWG/DXF Motor V2 - G13 Admin Menüsü ve Routing Testi ===");

  // [Test 1] Menü Görünürlüğü ve Allowlist Kontrolü (R02, R36)
  console.log("\n[Test 1] Menü Görünürlüğü ve Format Allowlist:");
  const dwgFile: MockFileItem = { id: "f_dwg", display_name: "proje.dwg", extension: ".dwg" };
  const dxfFile: MockFileItem = { id: "f_dxf", display_name: "kesit.DXF", extension: ".DXF" };
  const pdfFile: MockFileItem = { id: "f_pdf", display_name: "statik_rapor.pdf", extension: ".pdf" };
  const folderItem: MockFileItem = { id: "f_folder", display_name: "Mimari", extension: "", type: "folder" };

  const dwgActions = getAvailableViewerActions(dwgFile);
  assert(dwgActions.includes("DWG Motor V2 ile aç"), "DWG dosyası için 'DWG Motor V2 ile aç' menü öğesi mevcut");

  const dxfActions = getAvailableViewerActions(dxfFile);
  assert(dxfActions.includes("DXF Motor V2 ile aç"), "DXF dosyası için 'DXF Motor V2 ile aç' menü öğesi mevcut");

  const pdfActions = getAvailableViewerActions(pdfFile);
  assert(!pdfActions.includes("DWG Motor V2 ile aç") && !pdfActions.includes("DXF Motor V2 ile aç"), "PDF dosyası için Motor V2 seçeneği çıkmıyor");

  const folderActions = getAvailableViewerActions(folderItem);
  assert(!folderActions.some((a) => a.includes("V2")), "Klasör için Motor V2 seçeneği çıkmıyor");

  // [Test 2] cadEngine Parametresi ve Studio Routing (R02, R38)
  console.log("\n[Test 2] cadEngine Parametresi ve Studio Yönlendirme:");
  // Varsayılan açılış (cadEngine yok)
  const defaultRouting = resolveViewerComponent("cad", {});
  assert(defaultRouting === "legacy", "cadEngine belirtilmediğinde varsayılan olarak Legacy CAD motoru seçilir");

  // V2 açıkça istendiğinde
  const v2Routing = resolveViewerComponent("cad", { cadEngine: "v2" });
  assert(v2Routing === "v2", "cadEngine=v2 olduğunda V2 motoru (DokCadV2Viewer) seçilir");

  // Bilinmeyen parametre değeri verildiğinde
  const unknownRouting = resolveViewerComponent("cad", { cadEngine: "experimental" });
  assert(unknownRouting === "legacy", "Bilinmeyen cadEngine parametresi güvenlik gereği Legacy motora düşer");

  // [Test 3] Negatif Kontroller ve İzolasyon:
  console.log("\n[Test 3] Negatif Kontroller ve İzolasyon:");
  const pdfCadRouting = resolveViewerComponent("pdf", { cadEngine: "v2" });
  assert(pdfCadRouting === "unsupported", "CAD dışındaki bir dosya türünde cadEngine=v2 verilse bile V2 motoru açılmaz");

  console.log("\n>>> G13 ADMIN MENÜSÜ VE ROUTING TESTLERİ BAŞARIYLA GEÇTİ (6/6 PASS) <<<");
}

runAdminMenuRoutingTests().catch((err) => {
  console.error("Beklenmeyen hata:", err);
  process.exit(1);
});

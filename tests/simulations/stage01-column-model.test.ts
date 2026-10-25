import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  getLiveSimulations,
  getSimulationCatalogItem,
  isLiveSimulationSlug,
  SIMULATION_CATALOG,
} from "../../src/lib/simulations/catalog";
import {
  buildColumnDetailModel,
  C1_COLUMN_SPEC,
  computeZoneStirrupElevationsMm,
} from "../../src/lib/simulations/scenes/column-c1";
import { loadSimulationSceneModel } from "../../src/lib/simulations/scene-loaders";

async function main() {
  console.log("=== Simülasyon Kütüphanesi Aşama 01 Model ve Sınır Testleri ===");

  // 1. Katalog sözleşmesi: kolon sahnesi yayında ve bilinmeyen slug tanımsız
  const liveItems = getLiveSimulations();
  assert.ok(liveItems.length >= 1, "En az 1 canlı simülasyon olmalı");
  assert.equal(liveItems[0].slug, "kolon-detayi");
  assert.equal(isLiveSimulationSlug("kolon-detayi"), true);
  assert.equal(getSimulationCatalogItem("bilinmeyen-sahne"), undefined);
  assert.ok(SIMULATION_CATALOG.length >= 1);

  // 2. C1 kolon modeli doğrulaması
  const model = buildColumnDetailModel(C1_COLUMN_SPEC);
  assert.equal(model.slug, "kolon-detayi");
  assert.equal(model.dimensionsMm.widthX, 300);
  assert.equal(model.dimensionsMm.depthY, 300);
  assert.equal(model.dimensionsMm.concreteHeightZ, 3200);
  assert.equal(model.dimensionsMm.dowelLengthZ, 1080);
  assert.equal(model.dimensionsMm.totalHeightZ, 4280);

  // Parça sayıları: 1 beton + 4 boyuna + 4 filiz + 27 etriye = 36 parça
  assert.equal(model.counts.concreteParts, 1);
  assert.equal(model.counts.longitudinalBars, 4);
  assert.equal(model.counts.dowels, 4);
  assert.equal(model.counts.stirrups, 27);
  assert.equal(model.counts.totalParts, 36);
  assert.equal(model.parts.length, 36);

  // Benzersiz partId kontrolü
  const partIds = new Set(model.parts.map((p) => p.id));
  assert.equal(partIds.size, model.parts.length, "Tüm parça kimlikleri benzersiz olmalı");

  // Bölgesel etriye sayıları: 6 + 10 + 6 + 5 = 27
  const zoneCounts = model.zones.map((z) => z.stirrupCount);
  assert.deepEqual(zoneCounts, [6, 10, 6, 5]);

  const zAlt = computeZoneStirrupElevationsMm(0, 600, 100);
  assert.deepEqual(zAlt, [50, 150, 250, 350, 450, 550]);

  const zOrta = computeZoneStirrupElevationsMm(600, 2100, 150);
  assert.equal(zOrta[0], 675);
  assert.equal(zOrta[zOrta.length - 1], 2025);
  assert.equal(zOrta.length, 10);

  // Lazy scene loader doğrulaması
  const loadedModel = await loadSimulationSceneModel("kolon-detayi");
  assert.equal(loadedModel.counts.stirrups, 27);

  // 3. Kaynakta 3B lazy import sınırı doğrulaması:
  // catalog.ts, simulation-catalog.tsx ve route page.tsx dosyaları 'three' import etmemeli
  const root = process.cwd();
  const nonThreeFiles = [
    "src/lib/simulations/catalog.ts",
    "src/components/simulations/simulation-catalog.tsx",
    "src/app/kategori/araclar/simulasyonlar/page.tsx",
    "src/app/kategori/araclar/simulasyonlar/[slug]/page.tsx",
    "src/components/simulations/simulation-workspace.tsx",
  ];

  for (const relPath of nonThreeFiles) {
    const content = fs.readFileSync(path.join(root, relPath), "utf8");
    assert.equal(
      /from\s+["']three["']/.test(content),
      false,
      `${relPath} doğrudan 'three' import etmemelidir!`,
    );
  }

  // Workspace içinde ssr: false ile lazy viewer kullanıldığı doğrulanır
  const workspaceSource = fs.readFileSync(
    path.join(root, "src/components/simulations/simulation-workspace.tsx"),
    "utf8",
  );
  assert.equal(
    workspaceSource.includes("ssr: false"),
    true,
    "simulation-workspace.tsx Client sınırında dynamic(..., { ssr: false }) kullanmalıdır",
  );

  console.log("✅ Aşama 01 model ve lazy-import sınır kontrolleri başarıyla geçti.");
}

main().catch((err) => {
  console.error("❌ Model testi hatası:", err);
  process.exit(1);
});

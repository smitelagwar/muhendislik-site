import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CAD_SNAP_MODES,
  CAD_SNAP_SETTINGS_STORAGE_KEY,
  createDefaultCadSnapSettings,
  getEnabledCadSnapModes,
  loadCadSnapSettings,
  normalizeCadSnapSettings,
  saveCadSnapSettings,
  setCadSnapEnabled,
  setCadSnapMode,
  type CadSnapSettingsStorage,
} from "../src/lib/dokumantasyon/cad-upstream/snap-settings";

class MemoryStorage implements CadSnapSettingsStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const defaults = createDefaultCadSnapSettings();
assert.equal(defaults.enabled, true);
assert.deepEqual(CAD_SNAP_MODES, [
  "endpoint",
  "midpoint",
  "intersection",
  "center",
  "nearest",
]);
for (const mode of CAD_SNAP_MODES) assert.equal(defaults.modes[mode], true);

const storage = new MemoryStorage();
const configured = setCadSnapMode(
  setCadSnapMode(setCadSnapEnabled(defaults, false), "nearest", false),
  "center",
  false
);
assert.equal(saveCadSnapSettings(storage, configured), true);
assert.deepEqual(loadCadSnapSettings(storage), configured);
assert.ok(storage.getItem(CAD_SNAP_SETTINGS_STORAGE_KEY));

const disabledModes = getEnabledCadSnapModes(configured);
assert.equal(disabledModes.size, 0, "Master Snap kapalıyken aktif mod kalmamalı.");

const reenabled = setCadSnapEnabled(configured, true);
assert.equal(reenabled.modes.nearest, false, "Master toggle alt tercihleri silmemeli.");
assert.equal(reenabled.modes.center, false, "Master toggle alt tercihleri silmemeli.");
assert.deepEqual([...getEnabledCadSnapModes(reenabled)], [
  "endpoint",
  "midpoint",
  "intersection",
]);

const partial = normalizeCadSnapSettings({
  enabled: false,
  modes: { endpoint: false, nearest: true, unknown: false },
});
assert.equal(partial.enabled, false);
assert.equal(partial.modes.endpoint, false);
assert.equal(partial.modes.nearest, true);
assert.equal(partial.modes.midpoint, true, "Eksik alanlar güvenli varsayılana dönmeli.");

storage.setItem(CAD_SNAP_SETTINGS_STORAGE_KEY, "{bozuk-json");
assert.deepEqual(
  loadCadSnapSettings(storage),
  createDefaultCadSnapSettings(),
  "Bozuk localStorage kaydı viewer'ı bozmamalı."
);

const viewerSource = readFileSync(
  "src/components/dokumantasyon/preview/cad-upstream-viewer.tsx",
  "utf8"
);
const panelSource = readFileSync(
  "src/components/dokumantasyon/preview/cad-snap-settings-panel.tsx",
  "utf8"
);

for (const token of [
  "CadSnapSettingsPanel",
  "loadCadSnapSettings",
  "saveCadSnapSettings",
  "data-cad-snap-enabled",
  "data-cad-snap-modes",
  "cad-tool-snap-settings",
]) {
  assert.ok(viewerSource.includes(token), `Viewer entegrasyon tokenı eksik: ${token}`);
}

for (const token of [
  "cad-snap-master-toggle",
  "cad-snap-mode-${mode}",
  "CAD_SNAP_MODES.map",
  "Nesne Yakalama",
  "Uç Nokta",
  "Orta Nokta",
  "Kesişim",
  "Merkez",
  "En Yakın",
]) {
  assert.ok(panelSource.includes(token), `Snap panel tokenı eksik: ${token}`);
}

const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8")) as {
  git?: { deploymentEnabled?: unknown };
};
assert.equal(
  vercelConfig.git?.deploymentEnabled,
  false,
  "Stage 5 branch push'ları Vercel deployment tetiklememeli."
);

console.log(
  "GATE: PASS — Stage 5 Snap ayarları master toggle, 5 mod, localStorage persistence ve deploy kilidiyle tamamlandı."
);

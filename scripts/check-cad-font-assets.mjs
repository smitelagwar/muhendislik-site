#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function checkCadFontAssets() {
  console.log("[check-cad-font-assets] Validating CAD font manifest and assets...");

  // 1. Manifest Dosyası
  const manifestPath = join(root, "src", "lib", "dokumantasyon", "cad-font-manifest.json");
  const manifestRaw = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestRaw);

  assert.ok(Array.isArray(manifest), "cad-font-manifest.json dizi olmalıdır");
  assert.ok(manifest.length > 0, "cad-font-manifest.json en az 1 font içermelidir");

  const seenAliases = new Map();

  for (const item of manifest) {
    // Zorunlu alanlar
    assert.ok(typeof item.file === "string" && item.file.length > 0, `Geçersiz font dosyası adı: ${item.file}`);
    assert.ok(Array.isArray(item.names) && item.names.length > 0, `${item.file} için en az 1 alias olmalıdır`);
    assert.ok(item.type === "shx" || item.type === "mesh", `${item.file} tipi 'shx' veya 'mesh' olmalıdır`);
    assert.ok(typeof item.exact === "boolean", `${item.file} exact alanı boolean olmalıdır`);
    assert.ok(typeof item.licenseId === "string" && item.licenseId.length > 0, `${item.file} licenseId boş olamaz`);
    assert.ok(typeof item.sourceNote === "string" && item.sourceNote.length > 0, `${item.file} sourceNote boş olamaz`);

    // Uzantı ve tip uyumu
    const lowerFile = item.file.toLowerCase();
    if (lowerFile.endsWith(".shx")) {
      assert.equal(item.type, "shx", `${item.file} SHX dosyası olduğu için type: 'shx' olmalıdır`);
    } else if (lowerFile.endsWith(".ttf") || lowerFile.endsWith(".otf") || lowerFile.endsWith(".woff")) {
      assert.equal(item.type, "mesh", `${item.file} TTF/OTF/WOFF dosyası olduğu için type: 'mesh' olmalıdır`);
    }

    // Dosya varlığı ve boyutu (> 0)
    const candidatePaths = [
      join(root, "public", "fonts", item.file),
      join(root, "public", "fonts", "cad", item.file),
    ];

    let foundStat = null;
    let foundPath = null;
    for (const cand of candidatePaths) {
      const s = await stat(cand).catch(() => null);
      if (s?.isFile() && s.size > 0) {
        foundStat = s;
        foundPath = cand;
        break;
      }
    }

    assert.ok(
      foundStat !== null,
      `Font dosyası public/fonts/ veya public/fonts/cad/ içinde bulunamadı veya boş: ${item.file}`
    );
    assert.ok(foundStat.size > 0, `Font dosyası boyutu 0 olamaz: ${foundPath}`);

    // Alias çakışma kontrolü
    for (const alias of item.names) {
      const normalized = alias.trim().toLowerCase();
      assert.ok(normalized.length > 0, `${item.file} içinde boş alias bulunamaz`);
      if (seenAliases.has(normalized)) {
        const prev = seenAliases.get(normalized);
        assert.equal(
          prev,
          item.file,
          `Çakışan font alias'ı: "${alias}" hem "${prev}" hem de "${item.file}" dosyasına atanmış!`
        );
      }
      seenAliases.set(normalized, item.file);
    }
  }

  // 2. Senkronize public/cad-upstream/fonts/fonts.json Kontrolü
  const syncedJsonPath = join(root, "public", "cad-upstream", "fonts", "fonts.json");
  const syncedRaw = await readFile(syncedJsonPath, "utf8");
  const synced = JSON.parse(syncedRaw);

  assert.ok(Array.isArray(synced), "fonts.json bir dizi olmalıdır");
  assert.equal(synced.length, manifest.length, "fonts.json eleman sayısı manifest ile eşleşmelidir");

  // Deterministik sıralama kontrolü
  for (let i = 0; i < synced.length - 1; i++) {
    const cmp = synced[i].file.localeCompare(synced[i + 1].file);
    assert.ok(cmp <= 0, `fonts.json deterministik sıralı değil: ${synced[i].file} > ${synced[i + 1].file}`);
  }

  // Senkronize font dosyalarının varlığı ve boyut kontrolü
  for (const entry of synced) {
    const upstreamFilePath = join(root, "public", "cad-upstream", "fonts", entry.file);
    const s = await stat(upstreamFilePath).catch(() => null);
    assert.ok(s?.isFile(), `Senkronize font dosyası eksik: ${upstreamFilePath}`);
    assert.ok(s.size > 0, `Senkronize font dosyası boş: ${upstreamFilePath}`);
  }

  console.log(`[check-cad-font-assets] OK: ${manifest.length} font ve ${seenAliases.size} alias doğrulandı.`);
}

checkCadFontAssets().catch((err) => {
  console.error("[check-cad-font-assets] FAILED:", err.message);
  process.exit(1);
});

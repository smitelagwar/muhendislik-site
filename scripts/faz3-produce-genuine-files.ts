import fs from "fs";
import path from "path";
import { synthesizeIdeFile } from "../src/lib/hsyncad/ide-write/synthesize";
import { parseIde10 } from "../src/lib/hsyncad/ide-import/index";
import { verifyIdeHeaderChecksum } from "../src/lib/hsyncad/ide-import/ide-binary-codec";

async function main() {
  const sonDir = "C:/Users/hsyn/Desktop/SON";
  const hsyncadPath = path.join(sonDir, "7_KAT_5000M2_BINA.hsyncad");
  const ide10Path = path.join(sonDir, "7_KAT_5000M2_BINA.ide10");
  const ide11Path = path.join(sonDir, "7_KAT_5000M2_BINA.ide11");

  console.log("=== FAZ 3: GENUINE ideCAD DOSYA ÜRETİMİ VE DOĞRULAMA ===");
  console.log("Kaynak dosya:", hsyncadPath);

  if (!fs.existsSync(hsyncadPath)) {
    throw new Error(`Kaynak model bulunamadı: ${hsyncadPath}`);
  }

  // 1. Back up old bloated donor files if not already backed up
  const ide10Backup = `${ide10Path}.donor_backup`;
  const ide11Backup = `${ide11Path}.donor_backup`;
  if (fs.existsSync(ide10Path) && !fs.existsSync(ide10Backup)) {
    console.log("Eski 145MB donor ide10 yedekleniyor...");
    fs.copyFileSync(ide10Path, ide10Backup);
  }
  if (fs.existsSync(ide11Path) && !fs.existsSync(ide11Backup)) {
    console.log("Eski 146MB donor ide11 yedekleniyor...");
    fs.copyFileSync(ide11Path, ide11Backup);
  }

  // 2. Read CadModel from .hsyncad
  const rawJson = fs.readFileSync(hsyncadPath, "utf8");
  const model = JSON.parse(rawJson);
  console.log(`Model yüklendi: "${model.name}"`);
  console.log(`Kat sayısı: ${model.floors.length}, Eleman sayısı: ${model.elements.length}`);

  // 3. Synthesize .ide11
  const t0 = Date.now();
  const bytes11 = synthesizeIdeFile(model, "ide11");
  const dt11 = Date.now() - t0;
  fs.writeFileSync(ide11Path, bytes11);
  console.log(`\n1. .ide11 Sentezlendi (${dt11} ms):`);
  console.log(`   Dosya: ${ide11Path}`);
  console.log(`   Boyut: ${bytes11.byteLength} bayt (${(bytes11.byteLength / 1024).toFixed(1)} KB)`);

  const crc11 = verifyIdeHeaderChecksum(bytes11);
  console.log(`   CRC32 geçerli mi: ${crc11.valid} (Kayıtlı: 0x${crc11.stored.toString(16)})`);

  // 4. Synthesize .ide10
  const t1 = Date.now();
  const bytes10 = synthesizeIdeFile(model, "ide10");
  const dt10 = Date.now() - t1;
  fs.writeFileSync(ide10Path, bytes10);
  console.log(`\n2. .ide10 Sentezlendi (${dt10} ms):`);
  console.log(`   Dosya: ${ide10Path}`);
  console.log(`   Boyut: ${bytes10.byteLength} bayt (${(bytes10.byteLength / 1024).toFixed(1)} KB)`);

  const crc10 = verifyIdeHeaderChecksum(bytes10);
  console.log(`   CRC32 geçerli mi: ${crc10.valid} (Kayıtlı: 0x${crc10.stored.toString(16)})`);

  // 5. Round-trip geri okuma doğrulaması
  console.log("\n3. Geri Okuma (Round-Trip) Doğrulaması:");
  const project11 = parseIde10(
    bytes11.buffer.slice(bytes11.byteOffset, bytes11.byteOffset + bytes11.byteLength) as ArrayBuffer,
    "7_KAT_5000M2_BINA.ide11",
  );
  console.log(`   .ide11 Geri Okuma: ${project11.floors.length} kat, ${project11.elements.length} eleman`);

  const project10 = parseIde10(
    bytes10.buffer.slice(bytes10.byteOffset, bytes10.byteOffset + bytes10.byteLength) as ArrayBuffer,
    "7_KAT_5000M2_BINA.ide10",
  );
  console.log(`   .ide10 Geri Okuma: ${project10.floors.length} kat, ${project10.elements.length} eleman`);

  // 6. Anti-sahtelik / İsim sızıntısı denetimi
  console.log("\n4. Anti-Sahtelik ve Sızıntı Denetimi:");
  const text11 = new TextDecoder("latin1").decode(bytes11);
  const text10 = new TextDecoder("latin1").decode(bytes10);

  const mustafa11 = (text11.match(/MUSTAFA/gi) || []).length;
  const selvi11 = (text11.match(/SELV[İI]/gi) || []).length;
  const mustafa10 = (text10.match(/MUSTAFA/gi) || []).length;
  const selvi10 = (text10.match(/SELV[İI]/gi) || []).length;

  console.log(`   .ide11 içinde MUSTAFA sayısı: ${mustafa11}, SELVİ sayısı: ${selvi11}`);
  console.log(`   .ide10 içinde MUSTAFA sayısı: ${mustafa10}, SELVİ sayısı: ${selvi10}`);

  if (mustafa11 !== 0 || selvi11 !== 0 || mustafa10 !== 0 || selvi10 !== 0) {
    throw new Error("SAHTELİK TESTİ BAŞARISIZ: Dosyalarda eski donör isimleri bulundu!");
  }

  // 7. Detaylı Eleman Tip Dağılımı
  const byType: Record<string, number> = {};
  for (const e of project11.elements) {
    byType[e.type] = (byType[e.type] || 0) + 1;
  }
  console.log("\n5. .ide11 Çözümlenen Eleman Türleri Dağılımı:");
  for (const [t, count] of Object.entries(byType)) {
    console.log(`   - ${t}: ${count}`);
  }

  console.log("\nKat Listesi:");
  for (const f of project11.floors) {
    console.log(`   - ${f.name} (Kot: +${f.elevation.toFixed(2)} m, Kat Yüksekliği: ${f.height.toFixed(2)} m)`);
  }

  console.log("\n=== FAZ 3 BAŞARIYLA TAMAMLANDI ===");
}

main().catch(err => {
  console.error("Hata:", err);
  process.exit(1);
});

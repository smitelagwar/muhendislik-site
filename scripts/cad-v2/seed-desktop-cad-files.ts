// ============================================================================
// DÖKÜMANTASYON SİSTEMİ — MASAÜSTÜ 5 CAD DOSYASINI ENJEKTE ETME (SEED) SCRİPTİ
// ============================================================================

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import type { DokFile } from "../../src/lib/dokumantasyon/types";

interface TargetCADFile {
  label: string;
  sourcePath: string;
}

const TARGET_FILES: TargetCADFile[] = [
  {
    label: "Mimari Kat Planı DWG",
    sourcePath: "C:\\Users\\hsyn\\Desktop\\1 ve 2.kat dwg.dwg",
  },
  {
    label: "Kalıp Planı Zemin Kat DXF",
    sourcePath: "C:\\Users\\hsyn\\Desktop\\kalip_plani_zeminkat.dxf",
  },
  {
    label: "Mustafa Selvi Mimari DWG",
    sourcePath: "C:\\Users\\hsyn\\Desktop\\mustafa selvimimariiiii.dwg",
  },
  {
    label: "Süheyla Kara Statik DWG",
    sourcePath: "C:\\Users\\hsyn\\Desktop\\SÜHEYLA KARA STATİK (HAFİF) - Kopya.dwg",
  },
  {
    label: "Süheyla Kara Statik DXF",
    sourcePath: "C:\\Users\\hsyn\\Desktop\\SÜHEYLA KARA STATİK (HAFİF) - Kopya.dxf",
  },
];

const DATA_DIR = path.resolve(process.cwd(), ".data");
const DOK_STORAGE_DIR = path.join(DATA_DIR, "dok_storage");
const DOK_DB_PATH = path.join(DATA_DIR, "dok_db.json");

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DOK_STORAGE_DIR)) fs.mkdirSync(DOK_STORAGE_DIR, { recursive: true });
}

function loadDokDb(): { folders: unknown[]; files: DokFile[] } {
  if (fs.existsSync(DOK_DB_PATH)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DOK_DB_PATH, "utf-8"));
      return {
        folders: parsed.folders || [],
        files: parsed.files || [],
      };
    } catch {
      // ignore
    }
  }
  return { folders: [], files: [] };
}

function saveDokDb(db: { folders: unknown[]; files: DokFile[] }) {
  fs.writeFileSync(DOK_DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function seedDesktopCadFiles() {
  console.log("\n============================================================================");
  console.log("📦 DÖKÜMANTASYON SİSTEMİNE 5 ADET MASAÜSTÜ CAD DOSYASI YÜKLENİYOR");
  console.log("============================================================================\n");

  ensureDirectories();
  const db = loadDokDb();
  const seededFiles: Array<{ fileId: string; name: string; size: string }> = [];

  for (const item of TARGET_FILES) {
    if (!fs.existsSync(item.sourcePath)) {
      console.warn(`[UYARI] Dosya bulunamadı, atlanıyor: ${item.sourcePath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(item.sourcePath);
    const sizeBytes = fileBuffer.byteLength;
    const baseName = path.basename(item.sourcePath);
    const ext = path.extname(baseName).toLowerCase();
    const mimeType = ext === ".dxf" ? "application/dxf" : "application/x-dwg";

    const existing = db.files.find((f) => f.display_name === baseName && !f.deleted_at);
    let fileId: string;

    if (existing) {
      fileId = existing.id;
      console.log(`• [MEVCUT GÜNCELLENDİ] ${baseName} (ID: ${fileId}, ${formatBytes(sizeBytes)})`);
    } else {
      fileId = crypto.randomUUID();
      console.log(`• [YENİ EKLENDİ] ${baseName} (ID: ${fileId}, ${formatBytes(sizeBytes)})`);
    }

    const fileNameOnDisk = `${fileId}${ext}`;
    const targetStoragePath = path.join(DOK_STORAGE_DIR, fileNameOnDisk);

    // .data/dok_storage altına kopyala
    fs.writeFileSync(targetStoragePath, fileBuffer);

    const now = new Date().toISOString();
    const dokFileRecord: DokFile = {
      id: fileId,
      folder_id: null,
      display_name: baseName,
      blob_pathname: `dok_storage/${fileNameOnDisk}`,
      blob_url: `local:${fileNameOnDisk}`,
      size_bytes: sizeBytes,
      mime_type: mimeType,
      extension: ext,
      created_at: existing ? existing.created_at : now,
      updated_at: now,
      deleted_at: null,
      is_starred: false,
      current_version_number: 1,
    } as unknown;

    if (existing) {
      const idx = db.files.findIndex((f) => f.id === fileId);
      db.files[idx] = dokFileRecord;
    } else {
      db.files.push(dokFileRecord);
    }

    seededFiles.push({ fileId, name: baseName, size: formatBytes(sizeBytes) });
  }

  saveDokDb(db);
  console.log(`\n✔ BAŞARILI: Toplam ${seededFiles.length} dosya .data/dok_db.json içine kaydedildi.`);
  return seededFiles;
}

if (process.argv[1]?.endsWith("seed-desktop-cad-files.ts")) {
  seedDesktopCadFiles().catch(console.error);
}

// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — YEREL GELİŞTİRME DEPOSU VE VERİTABANI
// ============================================================================

import fs from "fs";
import path from "path";
import { DokActivityEvent, DokCadDerivative, DokDwgDxfDerivative, DokFile, DokFolder, DokShareItem, DokShareLink, DokFileVersion } from "./types";

import { isExplicitLocalDokMode, DokRuntimeConfigError } from "./runtime-mode";

interface LocalDatabaseState {
  folders: DokFolder[];
  files: DokFile[];
  file_versions?: DokFileVersion[];
  cad_derivatives?: DokCadDerivative[];
  dwg_dxf_derivatives?: DokDwgDxfDerivative[];
  shares: DokShareLink[];
  share_items: DokShareItem[];
  activity_log?: DokActivityEvent[];
}

function resolveDataDir(): string {
  if (process.env.VERCEL) {
    throw new DokRuntimeConfigError("LOCAL_STORAGE_FORBIDDEN");
  }
  if (!isExplicitLocalDokMode()) {
    throw new DokRuntimeConfigError("DATABASE_NOT_CONFIGURED");
  }
  return path.join(process.cwd(), ".data");
}

function getDbFile(): string {
  return path.join(resolveDataDir(), "dok_db.json");
}

function getStorageDir(): string {
  return path.join(resolveDataDir(), "dok_storage");
}

function ensureDirs() {
  const dataDir = resolveDataDir();
  const storageDir = getStorageDir();
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
}

export function getLocalStorageDir(): string {
  ensureDirs();
  return getStorageDir();
}

export function readLocalDb(): LocalDatabaseState {
  ensureDirs();
  const dbFile = getDbFile();
  if (!fs.existsSync(dbFile)) {
    const initialState: LocalDatabaseState = {
      folders: [],
      files: [],
      cad_derivatives: [],
      dwg_dxf_derivatives: [],
      shares: [],
      share_items: [],
      activity_log: [],
    };
    fs.writeFileSync(dbFile, JSON.stringify(initialState, null, 2), "utf8");
    return initialState;
  }

  try {
    const content = fs.readFileSync(dbFile, "utf8");
    return JSON.parse(content);
  } catch {
    return {
      folders: [],
      files: [],
      cad_derivatives: [],
      dwg_dxf_derivatives: [],
      shares: [],
      share_items: [],
      activity_log: [],
    };
  }
}

export function writeLocalDb(data: LocalDatabaseState): void {
  ensureDirs();
  fs.writeFileSync(getDbFile(), JSON.stringify(data, null, 2), "utf8");
}
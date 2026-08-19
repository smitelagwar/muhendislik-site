// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — YEREL GELİŞTİRME DEPOSU VE VERİTABANI
// ============================================================================

import fs from "fs";
import path from "path";
import os from "os";
import { DokFile, DokFolder, DokShareItem, DokShareLink } from "./types";

interface LocalDatabaseState {
  folders: DokFolder[];
  files: DokFile[];
  shares: DokShareLink[];
  share_items: DokShareItem[];
}

function resolveDataDir(): string {
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), "dok_data");
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
      shares: [],
      share_items: [],
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
      shares: [],
      share_items: [],
    };
  }
}

export function writeLocalDb(data: LocalDatabaseState): void {
  ensureDirs();
  fs.writeFileSync(getDbFile(), JSON.stringify(data, null, 2), "utf8");
}

// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — YEREL GELİŞTİRME DEPOSU VE VERİTABANI
// ============================================================================

import fs from "fs";
import path from "path";
import { DokFile, DokFolder, DokShareItem, DokShareLink } from "./types";

interface LocalDatabaseState {
  folders: DokFolder[];
  files: DokFile[];
  shares: DokShareLink[];
  share_items: DokShareItem[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "dok_db.json");
const STORAGE_DIR = path.join(DATA_DIR, "dok_storage");

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

export function getLocalStorageDir(): string {
  ensureDirs();
  return STORAGE_DIR;
}

export function readLocalDb(): LocalDatabaseState {
  ensureDirs();
  if (!fs.existsSync(DB_FILE)) {
    const initialState: LocalDatabaseState = {
      folders: [],
      files: [],
      shares: [],
      share_items: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialState, null, 2), "utf8");
    return initialState;
  }

  try {
    const content = fs.readFileSync(DB_FILE, "utf8");
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
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

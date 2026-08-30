// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — YEREL GELİŞTİRME DEPOSU VE VERİTABANI
// ============================================================================

import fs from "fs";
import os from "os";
import path from "path";
import { DokActivityEvent, DokCadDerivative, DokDwgDxfDerivative, DokFile, DokFolder, DokShareItem, DokShareLink, DokFileVersion, DokCadReview } from "./types";

import { isExplicitLocalDokMode, DokRuntimeConfigError } from "./runtime-mode";

interface LocalDatabaseState {
  folders: DokFolder[];
  files: DokFile[];
  file_versions?: DokFileVersion[];
  cad_derivatives?: DokCadDerivative[];
  dwg_dxf_derivatives?: DokDwgDxfDerivative[];
  cad_reviews?: DokCadReview[];
  shares: DokShareLink[];
  share_items: DokShareItem[];
  activity_log?: DokActivityEvent[];
}


function resolveSafeTestDataDir(rawDir: string): string {
  const resolved = path.isAbsolute(rawDir)
    ? path.resolve(rawDir)
    : path.resolve(process.cwd(), rawDir);
  const cwd = path.resolve(process.cwd());
  const tmp = path.resolve(os.tmpdir());
  const root = path.parse(resolved).root;

  // Root or user home directory is strictly forbidden for cleanup safety
  if (resolved === root || resolved === path.resolve(os.homedir())) {
    throw new Error(`UNSAFE_TEST_DATA_DIR: Cannot use root or home directory as test data root: ${resolved}`);
  }

  // Must reside either within process.cwd() or under os.tmpdir()
  const isInsideCwd = resolved.startsWith(cwd + path.sep) || resolved === cwd;
  const isInsideTmp = resolved.startsWith(tmp + path.sep);

  if (!isInsideCwd && !isInsideTmp) {
    throw new Error(`UNSAFE_TEST_DATA_DIR: Test data directory must reside inside workspace or temp folder: ${resolved}`);
  }

  return resolved;
}

function resolveDataDir(): string {
  if (process.env.VERCEL) {
    throw new DokRuntimeConfigError("LOCAL_STORAGE_FORBIDDEN");
  }
  if (!isExplicitLocalDokMode()) {
    throw new DokRuntimeConfigError("DATABASE_NOT_CONFIGURED");
  }

  // 1. Explicit environment variable
  const envDir = process.env.DOK_LOCAL_DATA_DIR?.trim();
  if (envDir) {
    return resolveSafeTestDataDir(envDir);
  }

  // 2. Active test session pointer file (for running tests against dev server without process.env pollution)
  const pointerFile = path.join(process.cwd(), ".test-data", "active-test-dir.txt");
  if (fs.existsSync(pointerFile)) {
    try {
      const pointerDir = fs.readFileSync(pointerFile, "utf8").trim();
      if (pointerDir) {
        return resolveSafeTestDataDir(pointerDir);
      }
    } catch {
      // ignore reading error, fallback to default .data
    }
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
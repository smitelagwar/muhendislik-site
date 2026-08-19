// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — ARAMA SERVİSİ (WITH LOCAL FALLBACK)
// ============================================================================

import { getDb } from "./db";
import { DokFile, DokFolder } from "./types";
import { readLocalDb } from "./local-store";
import { hasDatabaseUrl } from "./runtime-mode";

/**
 * SQL LIKE joker karakterlerini (% ve _) güvenli biçimde escape eder
 */
function escapeLikeString(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}

export async function searchItems(
  query: string,
  limit = 50
): Promise<{ files: DokFile[]; folders: DokFolder[] }> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { files: [], folders: [] };
  }

  if (!hasDatabaseUrl()) {
    const db = readLocalDb();
    const lower = trimmed.toLowerCase();
    const folders = db.folders
      .filter((f) => !f.deleted_at && f.name.toLowerCase().includes(lower))
      .slice(0, limit);
    const files = db.files
      .filter((f) => !f.deleted_at && f.display_name.toLowerCase().includes(lower))
      .slice(0, limit);

    return { folders, files };
  }

  const sql = getDb();
  const escaped = escapeLikeString(trimmed);
  const pattern = `%${escaped}%`;

  const folderRows = await sql`
    SELECT * FROM dok_folders
    WHERE name ILIKE ${pattern} AND deleted_at IS NULL
    ORDER BY name ASC
    LIMIT ${limit};
  `;

  const fileRows = await sql`
    SELECT * FROM dok_files
    WHERE display_name ILIKE ${pattern} AND deleted_at IS NULL
    ORDER BY display_name ASC
    LIMIT ${limit};
  `;

  return {
    folders: folderRows as DokFolder[],
    files: fileRows as DokFile[],
  };
}

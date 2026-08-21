// ============================================================================
// DÖKÜMANTASYON — MİNİMAL ETKİNLİK KAYDI
// ============================================================================

import { ensureDatabaseTables, getDb } from "./db";
import { readLocalDb, writeLocalDb } from "./local-store";
import { hasDatabaseUrl } from "./runtime-mode";
import { DokActivityEvent } from "./types";

export type DokActivityAction = DokActivityEvent["action"];

export async function recordDokActivity(event: Omit<DokActivityEvent, "id" | "created_at">): Promise<void> {
  try {
    if (!hasDatabaseUrl()) {
      const db = readLocalDb();
      const log = db.activity_log || [];
      log.unshift({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...event });
      db.activity_log = log.slice(0, 500);
      writeLocalDb(db);
      return;
    }

    const sql = getDb();
    await ensureDatabaseTables(sql);
    await sql`
      INSERT INTO dok_activity_log (action, item_type, item_id, display_name)
      VALUES (${event.action}, ${event.item_type}, ${event.item_id}, ${event.display_name});
    `;
  } catch (error) {
    // Etkinlik kaydı ana işlemi bozmaz; veri işlemi kendi güvenlik sözleşmesini korur.
    console.warn("Dökümantasyon etkinlik kaydı yazılamadı:", error);
  }
}

export async function getRecentDokActivity(limit = 50): Promise<DokActivityEvent[]> {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 100);
  if (!hasDatabaseUrl()) {
    return (readLocalDb().activity_log || []).slice(0, safeLimit);
  }
  const sql = getDb();
  await ensureDatabaseTables(sql);
  return (await sql`
    SELECT id, action, item_type, item_id, display_name, created_at
    FROM dok_activity_log
    ORDER BY created_at DESC
    LIMIT ${safeLimit};
  `) as DokActivityEvent[];
}

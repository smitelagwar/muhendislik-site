// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF SON OKUNAN KONUMU HATIRLAMA YÖNETİCİSİ
// ============================================================================

const STORAGE_KEY = "dok-pdf-reading-positions:v1";
const SETTINGS_KEY = "dok-pdf-reader-settings:v1";

interface PositionRecord {
  page: number;
  timestamp: number;
}

interface ReaderSettings {
  rememberPosition: boolean;
}

export function getPdfRememberSettings(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return true; // Varsayılan: AÇIK
    const parsed: ReaderSettings = JSON.parse(raw);
    return parsed.rememberPosition !== false;
  } catch {
    return true;
  }
}

export function setPdfRememberSettings(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const settings: ReaderSettings = { rememberPosition: enabled };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn("PDF ayarları kaydedilemedi:", err);
  }
}

export function getPdfReadingPosition(fileId: string): number | null {
  if (typeof window === "undefined" || !fileId) return null;
  if (!getPdfRememberSettings()) return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const positions: Record<string, PositionRecord> = JSON.parse(raw);
    const record = positions[fileId];
    if (record && typeof record.page === "number" && record.page >= 1) {
      return record.page;
    }
    return null;
  } catch {
    return null;
  }
}

export function savePdfReadingPosition(fileId: string, page: number): void {
  if (typeof window === "undefined" || !fileId || page < 1) return;
  if (!getPdfRememberSettings()) return;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const positions: Record<string, PositionRecord> = raw ? JSON.parse(raw) : {};

    positions[fileId] = {
      page,
      timestamp: Date.now(),
    };

    // Bellekte en fazla 50 dosya tut, daha eskileri temizle
    const entries = Object.entries(positions);
    if (entries.length > 50) {
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      const trimmed = Object.fromEntries(entries.slice(0, 50));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    }
  } catch (err) {
    console.warn("PDF okuma konumu kaydedilemedi:", err);
  }
}

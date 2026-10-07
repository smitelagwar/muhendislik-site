// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF OKUMA KONUMU VE AYARLAR YÖNETİCİSİ (FAZ H)
// dok-pdf-reading-position:v2 & dok-pdf-settings:v2
// ============================================================================

export const STORAGE_KEY_V2 = "dok-pdf-reading-position:v2";
export const SETTINGS_KEY_V2 = "dok-pdf-settings:v2";

export interface PdfViewerSettings {
  rememberPosition: boolean; // Son konumdan devam et (varsayılan: true)
  defaultViewMode: "fit-width" | "fit-page"; // Varsayılan görünüm modu
  reduceMotion: "system" | "on" | "off"; // Hareketleri azalt
  nightMode: boolean; // Gece modu (varsayılan: false)
  autoRepairText: boolean; // Bozuk harf eşlemesini otomatik onar (varsayılan: true)
}

export interface PdfReadingPositionRecord {
  page: number;
  offsetRatio: number; // Sayfa içi dikey kaydırma oranı (0 - 1)
  scaleMode?: "custom" | "actual-size" | "fit-width" | "fit-page";
  scale?: number;
  rotation?: 0 | 90 | 180 | 270;
  sidebarOpen?: boolean;
  sidebarTab?: "thumbnails" | "outline";
  handTool?: boolean;
  nightMode?: boolean;
  fileVersion?: string; // updatedAt / boyut / etag bileşimi
  updatedAt: number;
}

const DEFAULT_SETTINGS: PdfViewerSettings = {
  rememberPosition: true,
  defaultViewMode: "fit-width",
  reduceMotion: "system",
  nightMode: false,
  autoRepairText: true,
};

// ----------------------------------------------------------------------------
// AYARLAR (SETTINGS) YÖNETİMİ
// ----------------------------------------------------------------------------

export function getPdfSettings(): PdfViewerSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY_V2);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      rememberPosition: typeof parsed.rememberPosition === "boolean" ? parsed.rememberPosition : DEFAULT_SETTINGS.rememberPosition,
      defaultViewMode: parsed.defaultViewMode === "fit-page" ? "fit-page" : "fit-width",
      reduceMotion: parsed.reduceMotion === "on" || parsed.reduceMotion === "off" ? parsed.reduceMotion : "system",
      nightMode: typeof parsed.nightMode === "boolean" ? parsed.nightMode : DEFAULT_SETTINGS.nightMode,
      autoRepairText: typeof parsed.autoRepairText === "boolean" ? parsed.autoRepairText : DEFAULT_SETTINGS.autoRepairText,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function setPdfSettings(partial: Partial<PdfViewerSettings>): PdfViewerSettings {
  const current = getPdfSettings();
  const next: PdfViewerSettings = { ...current, ...partial };
  if (typeof window === "undefined") return next;
  try {
    localStorage.setItem(SETTINGS_KEY_V2, JSON.stringify(next));
  } catch (err) {
    console.warn("[pdf-settings] Ayarlar localStorage'a kaydedilemedi:", err);
  }
  return next;
}

// Geriye dönük uyumluluk köprüleri
export function getPdfRememberSettings(): boolean {
  return getPdfSettings().rememberPosition;
}

export function setPdfRememberSettings(enabled: boolean): void {
  setPdfSettings({ rememberPosition: enabled });
}

// ----------------------------------------------------------------------------
// OKUMA KONUMU (READING POSITION) YÖNETİMİ
// ----------------------------------------------------------------------------

export function getPdfReadingPosition(
  fileId: string,
  currentFileVersion?: string
): PdfReadingPositionRecord | null {
  if (typeof window === "undefined" || !fileId) return null;
  const settings = getPdfSettings();
  if (!settings.rememberPosition) return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_V2);
    if (!raw) return null;
    const positions: Record<string, PdfReadingPositionRecord> = JSON.parse(raw);
    const record = positions[fileId];
    if (!record || typeof record.page !== "number" || record.page < 1) {
      return null;
    }

    // Dosya sürümü değişmişse konumu geçersiz say (yanlış yere atlamayı engelle)
    if (
      record.fileVersion &&
      currentFileVersion &&
      record.fileVersion !== currentFileVersion
    ) {
      return null;
    }

    const validMode =
      record.scaleMode === "custom" ||
      record.scaleMode === "actual-size" ||
      record.scaleMode === "fit-width" ||
      record.scaleMode === "fit-page";
    const validRotation =
      record.rotation === 0 ||
      record.rotation === 90 ||
      record.rotation === 180 ||
      record.rotation === 270;
    return {
      ...record,
      scaleMode: validMode ? record.scaleMode : undefined,
      scale: typeof record.scale === "number" && Number.isFinite(record.scale) && record.scale > 0 && record.scale < 8
        ? record.scale
        : undefined,
      rotation: validRotation ? record.rotation : undefined,
      sidebarOpen: typeof record.sidebarOpen === "boolean" ? record.sidebarOpen : undefined,
      sidebarTab: record.sidebarTab === "outline" ? "outline" : record.sidebarTab === "thumbnails" ? "thumbnails" : undefined,
      handTool: typeof record.handTool === "boolean" ? record.handTool : undefined,
      nightMode: typeof record.nightMode === "boolean" ? record.nightMode : undefined,
    };
  } catch {
    return null;
  }
}

export function savePdfReadingPosition(
  fileId: string,
  record: {
    page: number;
    offsetRatio?: number;
    scaleMode?: "custom" | "actual-size" | "fit-width" | "fit-page";
    scale?: number;
    rotation?: 0 | 90 | 180 | 270;
    sidebarOpen?: boolean;
    sidebarTab?: "thumbnails" | "outline";
    handTool?: boolean;
    nightMode?: boolean;
    fileVersion?: string;
    updatedAt?: number;
  }
): void {
  if (typeof window === "undefined" || !fileId || record.page < 1) return;
  const settings = getPdfSettings();
  if (!settings.rememberPosition) return;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_V2);
    const positions: Record<string, PdfReadingPositionRecord> = raw ? JSON.parse(raw) : {};

    const cleanRatio =
      typeof record.offsetRatio === "number" && !isNaN(record.offsetRatio)
        ? Math.min(Math.max(record.offsetRatio, 0), 1)
        : 0;

    positions[fileId] = {
      page: record.page,
      offsetRatio: cleanRatio,
      scaleMode: record.scaleMode,
      scale: record.scale,
      rotation: record.rotation,
      sidebarOpen: record.sidebarOpen,
      sidebarTab: record.sidebarTab,
      handTool: record.handTool,
      nightMode: record.nightMode,
      fileVersion: record.fileVersion,
      updatedAt: typeof record.updatedAt === "number" ? record.updatedAt : Date.now(),
    };

    // Bellekte en fazla 50 dosya tut, daha eskileri temizle (Plandaki kural)
    const entries = Object.entries(positions);
    if (entries.length > 50) {
      entries.sort((a, b) => b[1].updatedAt - a[1].updatedAt);
      const trimmed = Object.fromEntries(entries.slice(0, 50));
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(positions));
    }
  } catch (err) {
    console.warn("[pdf-reading-position] Okuma konumu kaydedilemedi:", err);
  }
}

/** Kayıtlı okuma konumunu siler (W4: 'Baştan başla' için) */
export function clearPdfReadingPosition(fileId: string): void {
  if (typeof window === "undefined" || !fileId) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V2);
    if (!raw) return;
    const positions: Record<string, PdfReadingPositionRecord> = JSON.parse(raw);
    delete positions[fileId];
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(positions));
  } catch (err) {
    console.warn("[pdf-reading-position] Okuma konumu silinemedi:", err);
  }
}

/** Sekme yenilenmesi ve çökme koruması için senkron sessionStorage yazımı (Plan 05 W2) */
export function saveSessionReadingPosition(fileId: string, page: number, offsetRatio = 0): void {
  if (typeof window === "undefined" || !fileId) return;
  try {
    sessionStorage.setItem(`dok:pos:${fileId}`, JSON.stringify({ page, offsetRatio, t: Date.now() }));
  } catch {}
}

/** sessionStorage'dan son konumu okur (Plan 05 W2) */
export function getSessionReadingPosition(fileId: string): { page: number; offsetRatio: number } | null {
  if (typeof window === "undefined" || !fileId) return null;
  try {
    const raw = sessionStorage.getItem(`dok:pos:${fileId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

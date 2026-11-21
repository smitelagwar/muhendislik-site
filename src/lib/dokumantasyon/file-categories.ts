// ============================================================================
// DÖKÜMANTASYON — TEK KAYNAKLI DOSYA KATEGORİSİ, BOYUT, TARİH VE ARAMA KURALLARI
// ============================================================================

export const CAD_EXTENSIONS = ["dwg", "dxf", "dwf"] as const;
export const PDF_EXTENSIONS = ["pdf"] as const;
export const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "svg", "gif"] as const;
export const DOCUMENT_EXTENSIONS = [
  "md",
  "txt",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
  "json",
  "xml",
  "html",
  "css",
  "ts",
  "js",
] as const;

export type DokFileCategory = "cad" | "pdf" | "image" | "other";
export type DokGroupFileBucket = "cad" | "pdf" | "image" | "document" | "other";

const MB = 1024 * 1024;

export const FILE_SIZE_THRESHOLDS = {
  MB,
  SMALL_MAX_BYTES: 5 * MB,
  LARGE_MIN_BYTES: 100 * MB,
  BUCKET_MEDIUM_MAX_BYTES: 25 * MB,
} as const;

const CAD_SET = new Set<string>(CAD_EXTENSIONS);
const PDF_SET = new Set<string>(PDF_EXTENSIONS);
const IMAGE_SET = new Set<string>(IMAGE_EXTENSIONS);
const DOCUMENT_SET = new Set<string>(DOCUMENT_EXTENSIONS);

/**
 * Uzantıyı veya dosya adını noktasız, küçük harf uzantıya normalize eder.
 */
export function normalizeExtension(extensionOrName?: string | null): string {
  if (!extensionOrName) return "";
  const trimmed = extensionOrName.trim().toLowerCase();
  if (!trimmed) return "";
  if (trimmed.startsWith(".") && !trimmed.slice(1).includes(".")) {
    return trimmed.slice(1);
  }
  const lastDot = trimmed.lastIndexOf(".");
  if (lastDot >= 0 && lastDot < trimmed.length - 1) {
    return trimmed.slice(lastDot + 1);
  }
  return trimmed.replace(/^\.+/, "");
}

/**
 * Dosyayı 4 ana filtre kategorisinden birine sınıflandırır.
 */
export function getFileCategory(extensionOrName?: string | null): DokFileCategory {
  const ext = normalizeExtension(extensionOrName);
  if (CAD_SET.has(ext)) return "cad";
  if (PDF_SET.has(ext)) return "pdf";
  if (IMAGE_SET.has(ext)) return "image";
  return "other";
}

/**
 * Dosyayı gruplama görünümü için alt kovaya sınıflandırır.
 */
export function getGroupFileBucket(extensionOrName?: string | null): DokGroupFileBucket {
  const ext = normalizeExtension(extensionOrName);
  if (CAD_SET.has(ext)) return "cad";
  if (PDF_SET.has(ext)) return "pdf";
  if (IMAGE_SET.has(ext)) return "image";
  if (DOCUMENT_SET.has(ext)) return "document";
  return "other";
}

export function matchesTypeFilter(
  extensionOrName: string | null | undefined,
  typeFilter?: string
): boolean {
  if (!typeFilter || typeFilter === "all") return true;
  return getFileCategory(extensionOrName) === typeFilter;
}

export function matchesSizeFilter(
  sizeBytes: number | string | null | undefined,
  sizeFilter?: string
): boolean {
  if (!sizeFilter || sizeFilter === "all") return true;
  const bytes = Number(sizeBytes || 0);
  if (sizeFilter === "small") return bytes < FILE_SIZE_THRESHOLDS.SMALL_MAX_BYTES;
  if (sizeFilter === "medium") {
    return (
      bytes >= FILE_SIZE_THRESHOLDS.SMALL_MAX_BYTES &&
      bytes < FILE_SIZE_THRESHOLDS.LARGE_MIN_BYTES
    );
  }
  if (sizeFilter === "large") return bytes >= FILE_SIZE_THRESHOLDS.LARGE_MIN_BYTES;
  return true;
}

export function getEffectiveItemTimestamp(item: {
  updated_at?: string | null;
  created_at?: string | null;
}): number {
  const raw = item.updated_at || item.created_at;
  if (!raw) return 0;
  const ts = new Date(raw).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

export function matchesDateFilter(
  item: { updated_at?: string | null; created_at?: string | null },
  dateFilter?: string,
  nowMs: number = Date.now()
): boolean {
  if (!dateFilter || dateFilter === "all") return true;
  const itemTime = getEffectiveItemTimestamp(item);
  if (!itemTime) return false;
  const ONE_DAY = 24 * 60 * 60 * 1000;
  if (dateFilter === "today") return nowMs - itemTime <= ONE_DAY;
  if (dateFilter === "week") return nowMs - itemTime <= 7 * ONE_DAY;
  if (dateFilter === "month") return nowMs - itemTime <= 30 * ONE_DAY;
  return true;
}

/**
 * Türkçe büyük/küçük harf uyumlu arama normalizasyonu (İ/ı/I/i).
 */
export function normalizeTrSearch(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR").replace(/\u0307/g, "");
}

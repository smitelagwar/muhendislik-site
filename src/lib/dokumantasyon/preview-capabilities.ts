// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — ÖNİZLEME YETENEKLERİ VE FORMAT KAYDI (CAPABILITY REGISTRY)
// ============================================================================

export type PreviewKind =
  | "pdf"
  | "image"
  | "text"
  | "markdown"
  | "json"
  | "csv"
  | "cad"
  | "spreadsheet"
  | "unsupported";

export interface FormatCapability {
  extension: string;
  kind: PreviewKind;
  displayName: string;
  defaultMime: string;
  canPreviewAdmin: boolean;
  canPreviewPublic: boolean;
  maxPreviewSizeBytes: number; // Önizleme için kabul edilebilir maksimum boyut
}

export const SUPPORTED_FORMAT_CAPABILITIES: Record<string, FormatCapability> = {
  // 1. PDF
  ".pdf": {
    extension: ".pdf",
    kind: "pdf",
    displayName: "PDF Dokümanı",
    defaultMime: "application/pdf",
    canPreviewAdmin: true,
    canPreviewPublic: true,
    maxPreviewSizeBytes: 100 * 1024 * 1024, // 100 MB
  },

  // 2. Görseller
  ".jpg": {
    extension: ".jpg",
    kind: "image",
    displayName: "JPEG Görseli",
    defaultMime: "image/jpeg",
    canPreviewAdmin: true,
    canPreviewPublic: true,
    maxPreviewSizeBytes: 30 * 1024 * 1024, // 30 MB
  },
  ".jpeg": {
    extension: ".jpeg",
    kind: "image",
    displayName: "JPEG Görseli",
    defaultMime: "image/jpeg",
    canPreviewAdmin: true,
    canPreviewPublic: true,
    maxPreviewSizeBytes: 30 * 1024 * 1024,
  },
  ".png": {
    extension: ".png",
    kind: "image",
    displayName: "PNG Görseli",
    defaultMime: "image/png",
    canPreviewAdmin: true,
    canPreviewPublic: true,
    maxPreviewSizeBytes: 30 * 1024 * 1024,
  },
  ".webp": {
    extension: ".webp",
    kind: "image",
    displayName: "WEBP Görseli",
    defaultMime: "image/webp",
    canPreviewAdmin: true,
    canPreviewPublic: true,
    maxPreviewSizeBytes: 30 * 1024 * 1024,
  },

  // 3. Metin ve İşaretleme
  ".txt": {
    extension: ".txt",
    kind: "text",
    displayName: "Düz Metin",
    defaultMime: "text/plain",
    canPreviewAdmin: true,
    canPreviewPublic: true,
    maxPreviewSizeBytes: 5 * 1024 * 1024, // 5 MB
  },
  ".log": {
    extension: ".log",
    kind: "text",
    displayName: "Log Dosyası",
    defaultMime: "text/plain",
    canPreviewAdmin: true,
    canPreviewPublic: true,
    maxPreviewSizeBytes: 5 * 1024 * 1024,
  },
  ".md": {
    extension: ".md",
    kind: "markdown",
    displayName: "Markdown Dokümanı",
    defaultMime: "text/markdown",
    canPreviewAdmin: true,
    canPreviewPublic: true,
    maxPreviewSizeBytes: 5 * 1024 * 1024,
  },
  ".json": {
    extension: ".json",
    kind: "json",
    displayName: "JSON Verisi",
    defaultMime: "application/json",
    canPreviewAdmin: true,
    canPreviewPublic: true,
    maxPreviewSizeBytes: 5 * 1024 * 1024,
  },
  ".csv": {
    extension: ".csv",
    kind: "csv",
    displayName: "CSV Tablosu",
    defaultMime: "text/csv",
    canPreviewAdmin: true,
    canPreviewPublic: true,
    maxPreviewSizeBytes: 10 * 1024 * 1024,
  },
  ".yml": {
    extension: ".yml",
    kind: "text",
    displayName: "YAML Yapılandırması",
    defaultMime: "text/yaml",
    canPreviewAdmin: true,
    canPreviewPublic: true,
    maxPreviewSizeBytes: 5 * 1024 * 1024,
  },
  ".yaml": {
    extension: ".yaml",
    kind: "text",
    displayName: "YAML Yapılandırması",
    defaultMime: "text/yaml",
    canPreviewAdmin: true,
    canPreviewPublic: true,
    maxPreviewSizeBytes: 5 * 1024 * 1024,
  },

  // 4. CAD Formatları
  ".dwg": {
    extension: ".dwg",
    kind: "cad",
    displayName: "AutoCAD Çizimi",
    defaultMime: "application/acad",
    canPreviewAdmin: true,
    canPreviewPublic: false, // İlk sürümde CAD public preview kapalı (güvenlik)
    maxPreviewSizeBytes: 100 * 1024 * 1024,
  },
  ".dxf": {
    extension: ".dxf",
    kind: "cad",
    displayName: "DXF CAD Çizimi",
    defaultMime: "application/dxf",
    canPreviewAdmin: true,
    canPreviewPublic: false,
    maxPreviewSizeBytes: 100 * 1024 * 1024,
  },
  ".dwf": {
    extension: ".dwf",
    kind: "cad",
    displayName: "Autodesk DWF Çizimi",
    defaultMime: "model/vnd.dwf",
    canPreviewAdmin: true,
    canPreviewPublic: false,
    maxPreviewSizeBytes: 100 * 1024 * 1024,
  },

  // 5. Office ve Arşivler (Önizleme Aşama 7+ / İndirme Destekli)
  ".doc": {
    extension: ".doc",
    kind: "unsupported",
    displayName: "Word Belgesi",
    defaultMime: "application/msword",
    canPreviewAdmin: false,
    canPreviewPublic: false,
    maxPreviewSizeBytes: 50 * 1024 * 1024,
  },
  ".docx": {
    extension: ".docx",
    kind: "unsupported",
    displayName: "Word Belgesi (DOCX)",
    defaultMime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    canPreviewAdmin: false,
    canPreviewPublic: false,
    maxPreviewSizeBytes: 50 * 1024 * 1024,
  },
  ".xls": {
    extension: ".xls",
    kind: "spreadsheet",
    displayName: "Excel Tablosu",
    defaultMime: "application/vnd.ms-excel",
    canPreviewAdmin: false,
    canPreviewPublic: false,
    maxPreviewSizeBytes: 50 * 1024 * 1024,
  },
  ".xlsx": {
    extension: ".xlsx",
    kind: "spreadsheet",
    displayName: "Excel Tablosu (XLSX)",
    defaultMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    canPreviewAdmin: false,
    canPreviewPublic: false,
    maxPreviewSizeBytes: 50 * 1024 * 1024,
  },
  ".zip": {
    extension: ".zip",
    kind: "unsupported",
    displayName: "ZIP Arşivi",
    defaultMime: "application/zip",
    canPreviewAdmin: false,
    canPreviewPublic: false,
    maxPreviewSizeBytes: 100 * 1024 * 1024,
  },
};

/**
 * Dosya uzantısına göre önizleme türünü (PreviewKind) belirler
 */
export function getPreviewKind(extension: string): PreviewKind {
  const normExt = normalizeExtension(extension);
  const cap = SUPPORTED_FORMAT_CAPABILITIES[normExt];
  return cap ? cap.kind : "unsupported";
}

/**
 * Dosyanın admin panelinde önizlenebilir olup olmadığını kontrol eder
 */
export function isPreviewableForAdmin(extension: string): boolean {
  const normExt = normalizeExtension(extension);
  const cap = SUPPORTED_FORMAT_CAPABILITIES[normExt];
  return !!cap && cap.canPreviewAdmin && cap.kind !== "unsupported";
}

/**
 * Dosyanın public paylaşım bağlantısında önizlenebilir olup olmadığını kontrol eder
 */
export function isPreviewableForPublic(extension: string): boolean {
  const normExt = normalizeExtension(extension);
  const cap = SUPPORTED_FORMAT_CAPABILITIES[normExt];
  return !!cap && cap.canPreviewPublic && cap.kind !== "unsupported";
}

/**
 * Dosya uzantısı için varsayılan MIME tipini getirir
 */
export function getDefaultMimeType(extension: string): string {
  const normExt = normalizeExtension(extension);
  return SUPPORTED_FORMAT_CAPABILITIES[normExt]?.defaultMime || "application/octet-stream";
}

/**
 * Uzantıyı normalize eder (örn: 'PDF' -> '.pdf', 'dwg' -> '.dwg')
 */
export function normalizeExtension(ext: string): string {
  if (!ext) return "";
  let clean = ext.trim().toLowerCase();
  if (!clean.startsWith(".")) {
    clean = `.${clean}`;
  }
  return clean;
}

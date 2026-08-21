// ============================================================================
// DÖKÜMANTASYON — TARAYICI KLASÖR YÜKLEME PLANLAYICISI
// ============================================================================

export type BrowserFolderFile = File & { webkitRelativePath?: string };

export interface FolderUploadEntry {
  file: File;
  directories: string[];
  relativePath: string;
}

/**
 * Tarayıcıdan gelen relative path'i yalnız klasör segmentlerine dönüştürür.
 * Sunucu pathname'iyle karıştırılmaz; `..`, mutlak yol ve NUL kesinlikle kabul edilmez.
 */
export function getSafeUploadDirectories(file: BrowserFolderFile): string[] {
  const rawPath = (file.webkitRelativePath || "").replaceAll("\\", "/");
  if (!rawPath) return [];
  if (rawPath.startsWith("/") || rawPath.includes("\0")) {
    throw new Error(`Geçersiz klasör yolu: ${file.name}`);
  }

  const segments = rawPath.split("/");
  if (segments.length < 2 || segments.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("\0") || segment.length > 255 || /[\\:*?"<>|]/.test(segment))) {
    throw new Error(`Güvenli olmayan klasör yolu reddedildi: ${file.name}`);
  }

  return segments.slice(0, -1);
}

export function makeFolderUploadPlan(files: FileList | File[]): FolderUploadEntry[] {
  return Array.from(files).map((file) => {
    const directories = getSafeUploadDirectories(file as BrowserFolderFile);
    return {
      file,
      directories,
      relativePath: directories.length > 0 ? `${directories.join("/")}/${file.name}` : file.name,
    };
  });
}

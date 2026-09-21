import { FileTypeIcon } from "./file-icons";

export function formatBytes(bytes: number | string | undefined, decimals = 1): string {
  if (!bytes) return "0 B";
  const num = typeof bytes === "string" ? parseFloat(bytes) : bytes;
  if (isNaN(num) || num <= 0) return "0 B";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(num) / Math.log(k));
  return `${parseFloat((num / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

/** @deprecated Use FileTypeIcon directly for new surfaces. */
export function getFileIcon(extension: string, mimeType?: string) {
  return <FileTypeIcon extension={extension} mimeType={mimeType} size={20} />;
}

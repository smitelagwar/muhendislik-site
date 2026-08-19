import React from "react";
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  FileCode,
  File,
  Folder,
} from "lucide-react";

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

export function getFileIcon(extension: string, mimeType?: string) {
  const ext = (extension || "").toLowerCase();

  if (ext === ".pdf" || mimeType?.includes("pdf")) {
    return <FileText className="h-5 w-5 text-red-500" />;
  }

  if ([".xls", ".xlsx", ".csv"].includes(ext) || mimeType?.includes("spreadsheet") || mimeType?.includes("excel")) {
    return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
  }

  if ([".doc", ".docx"].includes(ext) || mimeType?.includes("word")) {
    return <FileText className="h-5 w-5 text-blue-500" />;
  }

  if ([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext) || mimeType?.startsWith("image/")) {
    return <FileImage className="h-5 w-5 text-amber-500" />;
  }

  if ([".zip", ".rar", ".7z", ".tar", ".gz"].includes(ext) || mimeType?.includes("zip") || mimeType?.includes("archive")) {
    return <FileArchive className="h-5 w-5 text-purple-500" />;
  }

  if ([".dwg", ".dxf"].includes(ext)) {
    return <FileCode className="h-5 w-5 text-cyan-500" />;
  }

  return <File className="h-5 w-5 text-muted-foreground" />;
}

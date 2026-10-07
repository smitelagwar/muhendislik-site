export type PdfErrorKind =
  | "network"
  | "expired"
  | "corrupt"
  | "password"
  | "unsupported"
  | "memory"
  | "render"
  | "unknown";

/**
 * Hata sınıflarını deterministik olarak sınıflandırır (Plan 05 W2).
 * HTTP 403/401 -> expired
 * fetch TypeError / ağ kopması -> network
 * PasswordException -> password
 * InvalidPDFException -> corrupt
 * vb.
 */
export function classifyPdfError(err: unknown, statusCode?: number): PdfErrorKind {
  if (statusCode === 401 || statusCode === 403) return "expired";
  if (statusCode === 404 || statusCode === 410) return "network";

  if (err && typeof err === "object") {
    const errorObj = err as { name?: string; message?: string; status?: number };
    if (errorObj.status === 401 || errorObj.status === 403) return "expired";

    const name = errorObj.name || "";
    const msg = errorObj.message || "";

    if (name === "PasswordException" || msg.toLowerCase().includes("password") || msg.includes("Need password")) {
      return "password";
    }
    if (
      name === "InvalidPDFException" ||
      msg.includes("Invalid PDF") ||
      msg.includes("corrupted") ||
      msg.includes("trailer")
    ) {
      return "corrupt";
    }
    if (name === "MissingPDFException") {
      return "network";
    }
    if (name === "AbortException" || name === "RenderingCancelledException") {
      return "render";
    }
    if (
      err instanceof TypeError &&
      (msg.includes("fetch") || msg.includes("network") || msg.includes("Failed to fetch"))
    ) {
      return "network";
    }
    if (
      msg.includes("QuotaExceeded") ||
      msg.toLowerCase().includes("out of memory") ||
      name === "RangeError"
    ) {
      return "memory";
    }
    if (msg.includes("unsupported") || msg.includes("desteklenmiyor")) {
      return "unsupported";
    }
  }

  if (typeof err === "string") {
    const lower = err.toLowerCase();
    if (lower.includes("network") || lower.includes("bağlantı") || lower.includes("offline")) return "network";
    if (lower.includes("expired") || lower.includes("oturum") || lower.includes("403")) return "expired";
    if (lower.includes("corrupt") || lower.includes("bozuk")) return "corrupt";
    if (lower.includes("password") || lower.includes("şifre")) return "password";
  }

  return "unknown";
}

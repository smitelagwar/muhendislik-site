export type PdfEngineFlag = "v3" | "v4";

export function readPdfEngineFlag(): PdfEngineFlag {
  try {
    if (typeof window === "undefined") {
      return process.env.NEXT_PUBLIC_PDF_ENGINE === "v4" ? "v4" : "v3";
    }
    const q = new URLSearchParams(window.location.search).get("pdfEngine");
    if (q === "v4" || q === "v3") {
      try {
        window.localStorage.setItem("dok:pdfEngine", q);
      } catch {}
      return q;
    }
    const s = window.localStorage.getItem("dok:pdfEngine");
    if (s === "v4" || s === "v3") return s;
  } catch {
    /* gizli pencere veya depolama kısıtları */
  }
  return process.env.NEXT_PUBLIC_PDF_ENGINE === "v4" ? "v4" : "v3";
}

export function setPdfEngineFlag(flag: PdfEngineFlag): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("dok:pdfEngine", flag);
    }
  } catch {}
}

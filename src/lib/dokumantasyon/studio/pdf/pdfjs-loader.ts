// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — PDF.JS GÜVENLİ YÜKLEYİCİ VE YAŞAM DÖNGÜSÜ
// ============================================================================

export interface SafePdfDocumentOptions {
  url: string;
  isEvalSupported?: boolean;
  enableScripting?: boolean;
}

/**
 * Self-hosted PDF.js kütüphanesini yükler
 * Güvenlik kuralı: CDN fallback YASAKTIR.
 */
export async function loadSecurePdfJs(): Promise<any> {
  if (typeof window === "undefined") return null;
  if ((window as any).pdfjsLib) {
    return (window as any).pdfjsLib;
  }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById("secure-pdfjs-script");
    if (existing) {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
      } else {
        existing.addEventListener("load", () => resolve((window as any).pdfjsLib));
        existing.addEventListener("error", () => reject(new Error("PDF.js yüklenemedi")));
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "secure-pdfjs-script";
    script.src = "/vendor/pdfjs/pdf.min.js";
    script.onload = () => {
      const pdfjs = (window as any).pdfjsLib;
      if (pdfjs) {
        pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.js";
        resolve(pdfjs);
      } else {
        reject(new Error("pdfjsLib bulunamadı."));
      }
    };
    script.onerror = () => {
      reject(new Error("Self-hosted /vendor/pdfjs/pdf.min.js yüklenemedi."));
    };
    document.head.appendChild(script);
  });
}

/**
 * CVE-2024-4367 ve CVE-2026-16633 korumalı güvenli PDF Document yükleme görevi oluşturur
 */
export async function createSecurePdfLoadingTask(url: string): Promise<any> {
  const pdfjs = await loadSecurePdfJs();
  if (!pdfjs) throw new Error("PDF.js başlatılamadı.");

  return pdfjs.getDocument({
    url,
    isEvalSupported: false, // CVE-2024-4367 Güvenlik Koruması
    enableScripting: false, // Malicious PDF JavaScript koruması
  });
}

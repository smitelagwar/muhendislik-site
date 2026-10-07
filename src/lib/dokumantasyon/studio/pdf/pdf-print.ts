/**
 * PDF Yazdırma Motoru (Plan 05 W3).
 * Baytlardan Blob URL üreterek imzalı accessUrl süresinden bağımsız ve iOS uyumlu yazdırma.
 */

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export async function printPdfBytes(
  getBytes: () => Promise<Uint8Array>,
  opts: { ios?: boolean } = {}
): Promise<void> {
  const isIos = opts.ios ?? isIosDevice();
  const bytes = await getBytes();
  const blob = new Blob([bytes as any], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  if (isIos || !("print" in window)) {
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  const f = document.createElement("iframe");
  f.id = "pdf-print-iframe";
  f.setAttribute("data-testid", "pdf-print-iframe");
  Object.assign(f.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    visibility: "hidden",
  });

  f.onload = () => {
    try {
      f.contentWindow?.focus();
      f.contentWindow?.print();
    } catch {
      window.open(url, "_blank", "noopener");
    }
  };

  f.src = url;
  document.body.appendChild(f);

  const cleanup = () => {
    f.remove();
    URL.revokeObjectURL(url);
  };

  window.addEventListener("afterprint", cleanup, { once: true });
  setTimeout(cleanup, 5 * 60_000);
}

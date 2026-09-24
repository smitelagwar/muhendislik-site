interface PrintPdfOptions {
  blobUrl: string | null;
  isReady: boolean;
}

export function printPdfFromBlobUrl({
  blobUrl,
  isReady,
}: PrintPdfOptions): void {
  if (!blobUrl || !isReady) {
    window.alert("PDF henüz hazır değil. Önizleme hazır olduğunda tekrar deneyin.");
    return;
  }

  const printWindow = window.open(blobUrl, "_blank");

  if (!printWindow) {
    window.alert(
      "Yazdırma penceresi tarayıcı tarafından engellendi. Açılır pencerelere izin verip tekrar deneyin."
    );
    return;
  }

  let printTriggered = false;

  const triggerPrint = () => {
    if (printTriggered || printWindow.closed) return;
    printTriggered = true;

    try {
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      console.error("PDF print error:", error);
      window.alert("PDF yazdırma başlatılamadı. Lütfen tekrar deneyin.");
    }
  };

  printWindow.addEventListener("load", triggerPrint, { once: true });

  try {
    if (printWindow.document.readyState === "complete") {
      triggerPrint();
    }
  } catch {
    // PDF viewer document state may not be readable; load event remains the source of truth.
  }
}

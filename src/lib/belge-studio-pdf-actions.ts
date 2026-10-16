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

  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    window.alert(
      "Yazdırma penceresi tarayıcı tarafından engellendi. Açılır pencerelere izin verip tekrar deneyin."
    );
    return;
  }

  let printTriggered = false;
  let loadTimeout = 0;

  const triggerPrint = () => {
    if (printTriggered || printWindow.closed) return;
    if (printWindow.location.href !== blobUrl) return;
    printTriggered = true;
    window.clearTimeout(loadTimeout);

    try {
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      console.error("PDF print error:", error);
      window.alert("PDF yazdırma başlatılamadı. Lütfen tekrar deneyin.");
    }
  };

  try {
    printWindow.addEventListener("load", triggerPrint);
    printWindow.location.href = blobUrl;
    loadTimeout = window.setTimeout(() => {
      printWindow.removeEventListener("load", triggerPrint);
      if (!printTriggered && !printWindow.closed) {
        window.alert("PDF yazdırma penceresinde açıldı. Yazdırma penceresindeki yazdır düğmesini kullanın.");
      }
    }, 20_000);
  } catch (error) {
    window.clearTimeout(loadTimeout);
    printWindow.removeEventListener("load", triggerPrint);
    console.error("PDF yazdırma penceresi açılamadı:", error);
    window.alert("PDF yazdırma penceresi açılamadı. Lütfen tekrar deneyin.");
  }
}

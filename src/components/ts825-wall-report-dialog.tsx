"use client";

import { useEffect, useState } from "react";
import { Download, Eye, FileImage, FileText, LoaderCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { InsulationCalculationResult } from "@/lib/ts825/types";

interface Ts825WallReportDialogProps {
  calculation: InsulationCalculationResult;
  wallPresetName: string;
}

function filenameSlug(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function downloadUrl(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function Ts825WallReportDialog({
  calculation,
  wallPresetName,
}: Ts825WallReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pdf");
  const [pdfUrl, setPdfUrl] = useState<string>();
  const [imageUrl, setImageUrl] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const slug = filenameSlug(calculation.location.province.name) || "hesap";

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let currentPdfUrl = "";
    let currentImageUrl = "";

    async function createPreviews() {
      setBusy(true);
      setError(undefined);
      try {
        const [{ createTs825WallPdfDocument }, { canvasToPngBlob, createTs825WallImageCanvas }] =
          await Promise.all([
            import("@/lib/ts825/reporting"),
            import("@/lib/ts825/image-reporting"),
          ]);
        const input = { calculation, wallPresetName };
        const pdfBlob = createTs825WallPdfDocument(input).output("blob");
        const imageBlob = await canvasToPngBlob(createTs825WallImageCanvas(input));
        currentPdfUrl = URL.createObjectURL(pdfBlob);
        currentImageUrl = URL.createObjectURL(imageBlob);
        if (cancelled) {
          URL.revokeObjectURL(currentPdfUrl);
          URL.revokeObjectURL(currentImageUrl);
          return;
        }
        setPdfUrl(currentPdfUrl);
        setImageUrl(currentImageUrl);
      } catch {
        if (!cancelled) setError("Önizleme hazırlanamadı. Lütfen yeniden deneyin.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    void createPreviews();
    return () => {
      cancelled = true;
      if (currentPdfUrl) URL.revokeObjectURL(currentPdfUrl);
      if (currentImageUrl) URL.revokeObjectURL(currentImageUrl);
      setPdfUrl(undefined);
      setImageUrl(undefined);
    };
  }, [calculation, open, wallPresetName]);

  function printPdf() {
    setError(undefined);
    try {
      if (!pdfUrl) throw new Error("PDF hazır değil.");
      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error("Yazdırma penceresi açılamadı.");
      printWindow.location.href = pdfUrl;
      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 1000);
    } catch {
      setError("Yazdırma penceresi açılamadı. Tarayıcının açılır pencere iznini kontrol edin.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="home-button-secondary" data-testid="ts825-report-preview-trigger">
          <Eye className="h-4 w-4" /> Çıktıyı önizle
        </Button>
      </DialogTrigger>
      <DialogContent
        className="z-[181] flex max-h-[92vh] max-w-5xl flex-col overflow-hidden p-0"
        overlayClassName="z-[180]"
      >
        <DialogHeader className="border-b border-border px-5 py-4 pr-14 sm:px-6">
          <DialogTitle>Hesap föyü önizlemesi</DialogTitle>
          <DialogDescription>
            PDF’yi kontrol edin, yazdırın veya yüksek çözünürlüklü görsel olarak indirin.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <TabsList className="grid w-full grid-cols-2 sm:w-[320px]">
              <TabsTrigger value="pdf" data-testid="ts825-pdf-preview-tab">
                <FileText className="h-4 w-4" /> PDF önizleme
              </TabsTrigger>
              <TabsTrigger value="image" data-testid="ts825-image-preview-tab">
                <FileImage className="h-4 w-4" /> Görsel önizleme
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap gap-2">
              {activeTab === "pdf" ? (
                <>
                  <Button type="button" variant="outline" size="sm" onClick={printPdf} disabled={!pdfUrl || busy}>
                    <Printer className="h-4 w-4" /> Yazdır
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => pdfUrl && downloadUrl(pdfUrl, `ts825-dis-duvar-${slug}.pdf`)}
                    disabled={!pdfUrl || busy}
                  >
                    <Download className="h-4 w-4" /> PDF indir
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => imageUrl && downloadUrl(imageUrl, `ts825-dis-duvar-${slug}-300dpi.png`)}
                  disabled={!imageUrl || busy}
                >
                  <Download className="h-4 w-4" /> PNG indir
                </Button>
              )}
            </div>
          </div>

          {error ? <p className="mx-5 mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-950/25 dark:text-red-300 sm:mx-6">{error}</p> : null}

          <TabsContent value="pdf" className="m-0 min-h-0 flex-1 overflow-auto bg-zinc-200/70 p-3 dark:bg-black/30 sm:p-5">
            {busy ? (
              <PreviewLoading />
            ) : pdfUrl ? (
              <iframe
                src={`${pdfUrl}#view=FitH&toolbar=0&navpanes=0`}
                title="TS 825 PDF hesap föyü önizlemesi"
                className="mx-auto h-[62vh] min-h-[440px] w-full max-w-[820px] rounded-lg border border-border bg-white shadow-xl"
                data-testid="ts825-pdf-preview-frame"
              />
            ) : null}
          </TabsContent>

          <TabsContent value="image" className="m-0 min-h-0 flex-1 overflow-auto bg-zinc-200/70 p-3 dark:bg-black/30 sm:p-5">
            {busy ? (
              <PreviewLoading />
            ) : imageUrl ? (
              <figure className="mx-auto max-w-[720px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="TS 825 dış duvar hesap föyü görsel önizlemesi"
                  className="h-auto w-full rounded-lg border border-border bg-white shadow-xl"
                  data-testid="ts825-image-preview"
                />
                <figcaption className="mt-3 text-center font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  PNG · 2480 × 3508 px · A4 / 300 DPI
                </figcaption>
              </figure>
            ) : null}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function PreviewLoading() {
  return (
    <div className="mx-auto flex min-h-[440px] max-w-[820px] items-center justify-center rounded-lg border border-border bg-white text-slate-600 shadow-xl">
      <div className="text-center">
        <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-blue-600" />
        <p className="mt-3 text-sm font-bold">Önizleme hazırlanıyor</p>
      </div>
    </div>
  );
}

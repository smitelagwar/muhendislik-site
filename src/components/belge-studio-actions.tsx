"use client";

import { useRef, useState } from "react";
import { generateBlankBelgePdf } from "@/lib/pdf-engine";
import type { BelgeDocumentId } from "@/lib/belgeler-pdf-profiles";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BelgeStudioFormViewMenu } from "@/components/belge-studio-form-view-menu";
import type { BelgeStudioFormViewControls } from "@/hooks/use-belge-studio-form-view";
import {
  BelgeBackIcon,
  BelgeBlankFormIcon,
  BelgeClearIcon,
  BelgeDownloadPdfIcon,
  BelgeFormEditIcon,
  BelgeMoreIcon,
  BelgePreviewEyeIcon,
  BelgePrintIcon,
  BelgeResetIcon,
  BelgeShareIcon,
  BelgeUndoIcon,
} from "@/components/belge-studio-icons";

type BelgeStudioActionsProps = {
  activeTab: "form" | "preview";
  onToggleTab: () => void;
  onReset: () => void;
  onClear: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onPrint: () => void;
  onShare?: () => void;
  onDownload: () => void;
  ready: boolean;
  downloading: boolean;
  documentId: BelgeDocumentId;
  templateFilename: string;
  formView?: BelgeStudioFormViewControls;
};

/**
 * Belge Stüdyosu — Alt Eylem Çubuğu (V3 Sözleşmesi)
 *
 * Kurallar:
 * 1. Masaüstü eylem sırası:
 *    Sol: [Sıfırla] [Temizle] [Geri al]
 *    Sağ: [Form Görünümü] [Boş form indir] [Yazdır] [Paylaş] [PDF İndir]
 *    Form Görünümü ve Boş form indir yan yana ve bitişiktir, araya başka öğe girmez.
 * 2. Mobil eylem sırası:
 *    [⋯] [Form Görünümü ikonu (44px)] [Boş form indir ikonu (44px)] [Formu Düzenle/Önizle] [PDF İndir]
 * 3. Popover alt bardan yukarıya (side="top") açılır, viewport dışına taşmaz.
 */
export function BelgeStudioActions(props: BelgeStudioActionsProps) {
  const { ready, downloading } = props;
  const [blankDownloading, setBlankDownloading] = useState(false);
  const blankInFlight = useRef(false);

  const downloadBlank = async () => {
    if (blankInFlight.current) return;
    blankInFlight.current = true;
    setBlankDownloading(true);
    try {
      const bytes = await generateBlankBelgePdf(props.documentId);
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = props.templateFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      window.alert("Boş PDF oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      blankInFlight.current = false;
      setBlankDownloading(false);
    }
  };

  const downloadIcon = downloading ? <Loader2 className="size-4 animate-spin" /> : <BelgeDownloadPdfIcon className="size-4" />;
  const downloadClass = "min-h-11 gap-2 border-amber-700 bg-amber-700 font-bold text-white hover:border-amber-800 hover:bg-amber-800 dark:border-amber-500 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400";

  return (
    <footer
      data-testid="belge-studio-actions"
      aria-label="Belge işlemleri"
      className="belge-studio-action-bar shrink-0 border-t border-border bg-background px-2.5 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-3"
    >
      {/* Mobil ve Tablet Alt Barı (< 1024px) */}
      <div
        data-testid="belge-studio-mobile-actions"
        className="belge-studio-mobile-actions flex min-w-0 items-center gap-1.5 sm:gap-2 lg:hidden"
      >
        {/* 1. Diğer Belge İşlemleri (⋯) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] w-[44px] shrink-0 self-stretch rounded-xl border-border/80 bg-card/90 p-0 hover:border-amber-500/50 dark:bg-zinc-900 cursor-pointer"
              aria-label="Diğer belge işlemleri"
              title="Belgelere dön, yazdır, sıfırla ve temizle"
            >
              <BelgeMoreIcon className="h-[20px] w-[20px]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={10}
            className="w-60 max-w-[calc(100vw-1rem)] rounded-2xl border-border/80 bg-popover/95 p-1.5 shadow-2xl backdrop-blur-xl z-50"
          >
            <DropdownMenuItem asChild className="min-h-11 rounded-xl font-semibold">
              <Link href="/belgeler" aria-label="Tüm belgelere dön">
                <BelgeBackIcon className="size-4" />
                Belgelere dön
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {props.onShare && (
              <DropdownMenuItem
                className="min-h-11 rounded-xl cursor-pointer"
                disabled={!ready}
                onSelect={props.onShare}
                data-testid="belge-mobile-menu-share-btn"
              >
                <BelgeShareIcon className="size-4 text-amber-500" />
                Paylaş
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              className="min-h-11 rounded-xl cursor-pointer"
              disabled={!ready}
              onSelect={props.onPrint}
            >
              <BelgePrintIcon className="size-4" />
              Yazdır
            </DropdownMenuItem>

            <DropdownMenuItem
              className="min-h-11 rounded-xl cursor-pointer"
              disabled={blankDownloading}
              onSelect={() => void downloadBlank()}
            >
              <BelgeBlankFormIcon className="size-4" />
              Boş form indir
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="min-h-11 rounded-xl cursor-pointer"
              onSelect={props.onReset}
            >
              <BelgeResetIcon className="size-4" />
              Örnek verilere sıfırla
            </DropdownMenuItem>

            <DropdownMenuItem
              className="min-h-11 rounded-xl cursor-pointer text-rose-600 focus:bg-rose-500/10 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-400"
              onSelect={props.onClear}
            >
              <BelgeClearIcon className="size-4 text-current" />
              Tüm alanları temizle
            </DropdownMenuItem>

            <DropdownMenuItem
              className="min-h-11 rounded-xl cursor-pointer"
              disabled={!props.canUndo}
              onSelect={props.onUndo}
            >
              <BelgeUndoIcon className="size-4" />
              Son işlemi geri al
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 2. Form Görünümü (44x44px İkon) */}
        {props.formView && (
          <BelgeStudioFormViewMenu
            mode={props.formView.mode}
            manualScale={props.formView.manualScale}
            density={props.formView.density}
            appliedScale={props.formView.appliedScale}
            fitStatus={props.formView.fitStatus}
            onChooseScale={props.formView.onChooseScale}
            onToggleCompact={props.formView.onToggleCompact}
            onFit={props.formView.onFit}
            onReset={props.formView.onReset}
            side="top"
            align="start"
            iconOnly={true}
          />
        )}

        {/* 3. Boş Form İndir (44x44px İkon) */}
        <Button
          type="button"
          variant="outline"
          disabled={blankDownloading}
          onClick={() => void downloadBlank()}
          className="min-h-[44px] w-[44px] shrink-0 self-stretch rounded-xl border-border/80 bg-card/90 p-0 hover:border-amber-500/50 dark:bg-zinc-900 cursor-pointer"
          aria-label="Boş form indir"
          title="Boş form şablonu indir"
          data-testid="belge-mobile-blank-download-btn"
        >
          {blankDownloading ? (
            <Loader2 className="h-[20px] w-[20px] animate-spin text-amber-500" />
          ) : (
            <BelgeBlankFormIcon className="h-[20px] w-[20px] text-amber-500" />
          )}
        </Button>

        {/* 4. Formu Düzenle / Canlı PDF Önizle Geçişi */}
        <Button
          type="button"
          variant="outline"
          onClick={props.onToggleTab}
          className={`min-h-[44px] min-w-0 flex-1 gap-[6px] whitespace-normal rounded-xl border-border/80 bg-card/90 px-[8px] py-[8px] text-xs font-bold leading-tight hover:border-amber-500/50 dark:bg-zinc-900 cursor-pointer ${
            props.activeTab === "preview" ? "belge-form-edit-glow" : ""
          }`}
          aria-label={props.activeTab === "form" ? "Canlı PDF Önizle" : "Formu Düzenle"}
        >
          {props.activeTab === "form" ? (
            <BelgePreviewEyeIcon className="h-[16px] w-[16px] shrink-0 text-amber-500" />
          ) : (
            <BelgeFormEditIcon className="h-[16px] w-[16px] shrink-0 text-amber-500" />
          )}
          <span className="min-w-0 wrap-anywhere">
            {props.activeTab === "form" ? "PDF Önizle" : "Formu Düzenle"}
          </span>
        </Button>

        {/* 5. PDF İndir (Birincil Aksiyon) */}
        <Button
          type="button"
          onClick={props.onDownload}
          disabled={!ready || downloading}
          className={`${downloadClass} min-h-[44px] min-w-0 flex-1 gap-[6px] whitespace-normal rounded-xl px-[8px] py-[8px] text-xs font-extrabold leading-tight shadow-sm shadow-amber-500/20 [&_svg]:h-[16px] [&_svg]:w-[16px] cursor-pointer`}
        >
          {downloadIcon}
          <span className="min-w-0 wrap-anywhere">PDF İndir</span>
        </Button>
      </div>

      {/* Masaüstü Alt Barı (>= 1024px) */}
      <div
        data-testid="belge-studio-desktop-actions"
        className="hidden flex-wrap items-center justify-between gap-3 lg:flex"
      >
        {/* Sol Grup: Sıfırla, Temizle, Geri al */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={props.onReset}
            className="min-h-11 gap-2 text-xs"
            title="Tüm alanları örnek verilere sıfırla"
          >
            <BelgeResetIcon className="size-4" />
            Sıfırla
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={props.onClear}
            className="min-h-11 gap-2 text-xs hover:text-rose-600 dark:hover:text-rose-400"
          >
            <BelgeClearIcon className="size-4" />
            Temizle
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={props.onUndo}
            disabled={!props.canUndo}
            className="min-h-11 gap-2 text-xs"
            title="Son sıfırlama veya temizlemeyi geri al"
          >
            <BelgeUndoIcon className="size-4" />
            Geri al
          </Button>
        </div>

        {/* Sağ Grup: [Form Görünümü] [Boş form indir] [Yazdır] [Paylaş] [PDF İndir] */}
        <div className="flex items-center gap-2">
          {/* Form Görünümü ve Boş form indir kesinlikle yan yana, bölünmez alt grup */}
          <div className="inline-flex items-center gap-2 shrink-0">
            {props.formView && (
              <BelgeStudioFormViewMenu
                mode={props.formView.mode}
                manualScale={props.formView.manualScale}
                density={props.formView.density}
                appliedScale={props.formView.appliedScale}
                fitStatus={props.formView.fitStatus}
                onChooseScale={props.formView.onChooseScale}
                onToggleCompact={props.formView.onToggleCompact}
                onFit={props.formView.onFit}
                onReset={props.formView.onReset}
                side="top"
                align="end"
                iconOnly={false}
              />
            )}
            <Button
              type="button"
              variant="outline"
              disabled={blankDownloading}
              onClick={() => void downloadBlank()}
              className="min-h-11 gap-2 text-xs"
              data-testid="belge-desktop-blank-download-btn"
            >
              {blankDownloading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <BelgeBlankFormIcon className="size-4" />
              )}
              Boş form indir
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={props.onPrint}
            disabled={!ready}
            className="min-h-11 gap-2 text-xs"
          >
            <BelgePrintIcon className="size-4" />
            Yazdır
          </Button>

          {props.onShare && (
            <Button
              type="button"
              variant="outline"
              onClick={props.onShare}
              disabled={!ready}
              className="min-h-11 gap-2 text-xs"
              data-testid="belge-desktop-share-btn"
            >
              <BelgeShareIcon className="size-4 text-amber-500" />
              Paylaş
            </Button>
          )}

          <Button
            type="button"
            onClick={props.onDownload}
            disabled={!ready || downloading}
            className={downloadClass}
          >
            {downloadIcon}
            PDF İndir
          </Button>
        </div>
      </div>
    </footer>
  );
}

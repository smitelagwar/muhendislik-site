"use client";

import { Eye, FileDown, FileEdit, Loader2, MoreHorizontal, Printer, RotateCcw, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type BelgeStudioActionsProps = {
  activeTab: "form" | "preview";
  onToggleTab: () => void;
  onReset: () => void;
  onClear: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onPrint: () => void;
  onDownload: () => void;
  ready: boolean;
  downloading: boolean;
  templateUrl: string;
  templateFilename: string;
};

export function BelgeStudioActions(props: BelgeStudioActionsProps) {
  const { ready, downloading } = props;
  const downloadIcon = downloading ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />;
  const downloadClass = "min-h-11 gap-2 bg-amber-600 font-semibold text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400";

  return (
    <footer data-testid="belge-studio-actions" aria-label="Belge işlemleri" className="belge-studio-action-bar shrink-0 border-t border-border bg-background px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-3">
      <div data-testid="belge-studio-mobile-actions" className="belge-studio-mobile-actions flex min-w-0 items-center gap-2 lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="min-h-[44px] w-[44px] shrink-0 self-stretch p-0" aria-label="Diğer belge işlemleri" title="Yazdır, boş form, sıfırla ve temizle">
              <MoreHorizontal className="h-[20px] w-[20px]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" sideOffset={10} className="w-60 max-w-[calc(100vw-1rem)]">
            <DropdownMenuItem className="min-h-11" disabled={!ready} onSelect={props.onPrint}><Printer />Yazdır</DropdownMenuItem>
            <DropdownMenuItem asChild className="min-h-11"><a href={props.templateUrl} download={props.templateFilename}><FileDown />Boş form indir</a></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="min-h-11" onSelect={props.onReset}><RotateCcw />Örnek verilere sıfırla</DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 text-rose-600 focus:bg-rose-500/10 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-400" onSelect={props.onClear}><Trash2 className="text-current" />Tüm alanları temizle</DropdownMenuItem>
            <DropdownMenuItem className="min-h-11" disabled={!props.canUndo} onSelect={props.onUndo}><Undo2 />Son işlemi geri al</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button type="button" variant="outline" onClick={props.onToggleTab} className="min-h-[44px] min-w-0 flex-1 gap-[6px] whitespace-normal px-[8px] py-[8px] text-xs leading-tight" aria-label={props.activeTab === "form" ? "Canlı PDF Önizle" : "Formu Düzenle"}>
          {props.activeTab === "form" ? <Eye className="h-[16px] w-[16px] shrink-0 text-amber-500" /> : <FileEdit className="h-[16px] w-[16px] shrink-0 text-amber-500" />}
          <span className="min-w-0 wrap-anywhere">{props.activeTab === "form" ? "PDF Önizle" : "Formu Düzenle"}</span>
        </Button>
        <Button type="button" onClick={props.onDownload} disabled={!ready || downloading} className={`${downloadClass} min-h-[44px] min-w-0 flex-1 gap-[6px] whitespace-normal px-[8px] py-[8px] text-xs leading-tight [&_svg]:h-[16px] [&_svg]:w-[16px]`}>
          {downloadIcon}<span className="min-w-0 wrap-anywhere">PDF İndir</span>
        </Button>
      </div>
      <div data-testid="belge-studio-desktop-actions" className="hidden flex-wrap items-center justify-between gap-3 lg:flex">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={props.onReset} className="min-h-11 gap-2 text-xs" title="Tüm alanları örnek verilere sıfırla"><RotateCcw className="size-4" />Sıfırla</Button>
          <Button type="button" variant="outline" onClick={props.onClear} className="min-h-11 gap-2 text-xs hover:text-rose-600 dark:hover:text-rose-400"><Trash2 className="size-4" />Temizle</Button>
          <Button type="button" variant="ghost" onClick={props.onUndo} disabled={!props.canUndo} className="min-h-11 gap-2 text-xs" title="Son sıfırlama veya temizlemeyi geri al"><Undo2 className="size-4" />Geri al</Button>
        </div>
        <div className="flex items-center gap-2">
          <a href={props.templateUrl} download={props.templateFilename} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-xs font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"><FileDown className="size-4" />Boş form indir</a>
          <Button type="button" variant="outline" onClick={props.onPrint} disabled={!ready} className="min-h-11 gap-2 text-xs"><Printer className="size-4" />Yazdır</Button>
          <Button type="button" onClick={props.onDownload} disabled={!ready || downloading} className={downloadClass}>{downloadIcon}PDF İndir</Button>
        </div>
      </div>
    </footer>
  );
}

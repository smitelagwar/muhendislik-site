"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BelgeBackIcon,
  BelgeBlankFormIcon,
  BelgeClearIcon,
  BelgeDownloadPdfIcon,
  BelgeFormEditIcon,
  BelgeMoonIcon,
  BelgeMoreIcon,
  BelgePreviewEyeIcon,
  BelgePrintIcon,
  BelgeResetIcon,
  BelgeSunIcon,
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
  onDownload: () => void;
  ready: boolean;
  downloading: boolean;
  templateUrl: string;
  templateFilename: string;
};

export function BelgeStudioActions(props: BelgeStudioActionsProps) {
  const { ready, downloading } = props;
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const handleToggleTheme = () => {
    const currentlyDark = mounted
      ? resolvedTheme === "dark"
      : typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    setTheme(currentlyDark ? "light" : "dark");
  };

  const downloadIcon = downloading ? <Loader2 className="size-4 animate-spin" /> : <BelgeDownloadPdfIcon className="size-4" />;
  const downloadClass = "min-h-11 gap-2 border-amber-700 bg-amber-700 font-bold text-white hover:border-amber-800 hover:bg-amber-800 dark:border-amber-500 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400";

  return (
    <footer data-testid="belge-studio-actions" aria-label="Belge işlemleri" className="belge-studio-action-bar shrink-0 border-t border-border bg-background px-2.5 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-3">
      <div data-testid="belge-studio-mobile-actions" className="belge-studio-mobile-actions flex min-w-0 items-center gap-2 lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="min-h-[44px] w-[44px] shrink-0 self-stretch rounded-xl border-border/80 bg-card/90 p-0 hover:border-amber-500/50 dark:bg-zinc-900" aria-label="Diğer belge işlemleri" title="Belgelere dön, yazdır, boş form, sıfırla ve temizle">
              <BelgeMoreIcon className="h-[20px] w-[20px]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" sideOffset={10} className="w-60 max-w-[calc(100vw-1rem)] rounded-2xl border-border/80 bg-popover/95 p-1.5 shadow-2xl backdrop-blur-xl">
            <DropdownMenuItem asChild className="min-h-11 rounded-xl font-semibold">
              <Link href="/belgeler" aria-label="Tüm belgelere dön">
                <BelgeBackIcon className="size-4" />
                Belgelere dön
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="min-h-11 rounded-xl" onSelect={handleToggleTheme}>
              {isDark ? <BelgeSunIcon className="size-4 text-amber-400" /> : <BelgeMoonIcon className="size-4 text-amber-600" />}
              {isDark ? "Aydınlık temaya geç" : "Koyu temaya geç"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="min-h-11 rounded-xl" disabled={!ready} onSelect={props.onPrint}><BelgePrintIcon className="size-4" />Yazdır</DropdownMenuItem>
            <DropdownMenuItem asChild className="min-h-11 rounded-xl"><a href={props.templateUrl} download={props.templateFilename}><BelgeBlankFormIcon className="size-4" />Boş form indir</a></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="min-h-11 rounded-xl" onSelect={props.onReset}><BelgeResetIcon className="size-4" />Örnek verilere sıfırla</DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 rounded-xl text-rose-600 focus:bg-rose-500/10 focus:text-rose-600 dark:text-rose-400 dark:focus:text-rose-400" onSelect={props.onClear}><BelgeClearIcon className="size-4 text-current" />Tüm alanları temizle</DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 rounded-xl" disabled={!props.canUndo} onSelect={props.onUndo}><BelgeUndoIcon className="size-4" />Son işlemi geri al</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button type="button" variant="outline" onClick={props.onToggleTab} className="min-h-[44px] min-w-0 flex-1 gap-[6px] whitespace-normal rounded-xl border-border/80 bg-card/90 px-[8px] py-[8px] text-xs font-bold leading-tight hover:border-amber-500/50 dark:bg-zinc-900" aria-label={props.activeTab === "form" ? "Canlı PDF Önizle" : "Formu Düzenle"}>
          {props.activeTab === "form" ? <BelgePreviewEyeIcon className="h-[16px] w-[16px] shrink-0 text-amber-500" /> : <BelgeFormEditIcon className="h-[16px] w-[16px] shrink-0 text-amber-500" />}
          <span className="min-w-0 wrap-anywhere">{props.activeTab === "form" ? "PDF Önizle" : "Formu Düzenle"}</span>
        </Button>
        <Button type="button" onClick={props.onDownload} disabled={!ready || downloading} className={`${downloadClass} min-h-[44px] min-w-0 flex-1 gap-[6px] whitespace-normal rounded-xl px-[8px] py-[8px] text-xs font-extrabold leading-tight shadow-sm shadow-amber-500/20 [&_svg]:h-[16px] [&_svg]:w-[16px]`}>
          {downloadIcon}<span className="min-w-0 wrap-anywhere">PDF İndir</span>
        </Button>
      </div>
      <div data-testid="belge-studio-desktop-actions" className="hidden flex-wrap items-center justify-between gap-3 lg:flex">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={props.onReset} className="min-h-11 gap-2 text-xs" title="Tüm alanları örnek verilere sıfırla"><BelgeResetIcon className="size-4" />Sıfırla</Button>
          <Button type="button" variant="outline" onClick={props.onClear} className="min-h-11 gap-2 text-xs hover:text-rose-600 dark:hover:text-rose-400"><BelgeClearIcon className="size-4" />Temizle</Button>
          <Button type="button" variant="ghost" onClick={props.onUndo} disabled={!props.canUndo} className="min-h-11 gap-2 text-xs" title="Son sıfırlama veya temizlemeyi geri al"><BelgeUndoIcon className="size-4" />Geri al</Button>
        </div>
        <div className="flex items-center gap-2">
          <a href={props.templateUrl} download={props.templateFilename} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3 text-xs font-medium text-foreground hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"><BelgeBlankFormIcon className="size-4" />Boş form indir</a>
          <Button type="button" variant="outline" onClick={props.onPrint} disabled={!ready} className="min-h-11 gap-2 text-xs"><BelgePrintIcon className="size-4" />Yazdır</Button>
          <Button type="button" onClick={props.onDownload} disabled={!ready || downloading} className={downloadClass}>{downloadIcon}PDF İndir</Button>
        </div>
      </div>
    </footer>
  );
}

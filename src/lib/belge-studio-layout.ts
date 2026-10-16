/**
 * Belge stüdyolarının ortak tam ekran / mobil layout sözleşmesi.
 *
 * Bu sınıflar beş ayrı PDF stüdyosunun viewport ve scroll davranışının
 * zamanla birbirinden sapmasını önlemek için tek yerde tutulur.
 */
export const BELGE_STUDIO_MAIN_SPLIT_CLASS =
  "relative flex flex-col lg:flex-row flex-1 min-h-0 min-w-0 max-w-full overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border";

export const BELGE_STUDIO_FORM_SCROLL_CLASS =
  "w-full max-w-full lg:w-[410px] xl:w-[450px] shrink-0 h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain touch-pan-y scroll-pt-4 scroll-pb-4 p-2.5 sm:p-3.5 space-y-2.5";

export const BELGE_STUDIO_MOBILE_TABLIST_CLASS =
  "flex h-[52px] lg:hidden shrink-0 items-center gap-1.5 border-b border-border bg-muted/60 p-1.5 dark:bg-zinc-900/90";

export const BELGE_STUDIO_MOBILE_TAB_CLASS =
  "flex h-10 min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-xl px-1.5 text-center text-[11px] font-bold leading-none transition-all sm:gap-1.5 sm:px-2 sm:text-xs";

export const BELGE_STUDIO_PREVIEW_PANEL_CLASS =
  "belge-preview-panel flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden bg-muted/20 p-1 sm:p-1.5 lg:p-2";

export const BELGE_STUDIO_PREVIEW_TOOLBAR_CLASS =
  "belge-preview-controls mb-1 shrink-0 sm:mb-2";

export const BELGE_STUDIO_PREVIEW_CANVAS_CLASS =
  "relative flex-1 min-h-0 min-w-0 w-full overflow-auto overscroll-contain rounded-lg bg-zinc-200 p-0 shadow-inner dark:bg-zinc-900";

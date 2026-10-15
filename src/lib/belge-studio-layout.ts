/**
 * Belge stüdyolarının ortak tam ekran / mobil layout sözleşmesi.
 *
 * Bu sınıflar beş ayrı PDF stüdyosunun viewport ve scroll davranışının
 * zamanla birbirinden sapmasını önlemek için tek yerde tutulur.
 */
export const BELGE_STUDIO_MAIN_SPLIT_CLASS =
  "flex flex-col lg:flex-row flex-1 min-h-0 min-w-0 max-w-full overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border";

export const BELGE_STUDIO_FORM_SCROLL_CLASS =
  "w-full max-w-full lg:w-[410px] xl:w-[450px] shrink-0 h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain touch-pan-y scroll-pt-4 scroll-pb-[calc(5rem+env(safe-area-inset-bottom))] p-2.5 sm:p-3.5 space-y-2.5";

export const BELGE_STUDIO_MOBILE_ACTIONS_CLASS =
  "flex lg:hidden min-w-0 items-center justify-between gap-2 border-t border-border bg-background/95 backdrop-blur-md pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shrink-0 shadow-lg z-20";

export const BELGE_STUDIO_MOBILE_TABLIST_CLASS =
  "flex h-[53px] lg:hidden shrink-0 items-center gap-1 border-b border-border bg-muted/50 p-1";

export const BELGE_STUDIO_MOBILE_TAB_CLASS =
  "flex h-11 min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg px-1.5 text-center text-[11px] font-bold leading-none transition-all sm:gap-1.5 sm:px-2 sm:text-xs";

export const BELGE_STUDIO_PREVIEW_PANEL_CLASS =
  "flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden bg-muted/20 p-1 sm:p-1.5 lg:p-2";

export const BELGE_STUDIO_PREVIEW_TOOLBAR_CLASS =
  "mb-1 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] grid-rows-[44px_44px] items-center gap-x-1 gap-y-1 min-[400px]:mb-2 min-[400px]:flex min-[400px]:items-center min-[400px]:justify-between min-[400px]:gap-1 min-[400px]:px-1 lg:mb-2 lg:flex lg:items-center lg:justify-between lg:gap-1 lg:px-1";

export const BELGE_STUDIO_PREVIEW_CANVAS_CLASS =
  "relative flex-1 min-h-0 min-w-0 w-full overflow-auto rounded-lg bg-zinc-850 p-1 shadow-inner dark:bg-zinc-900";

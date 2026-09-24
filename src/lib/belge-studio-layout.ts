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


export const BELGE_STUDIO_MOBILE_TAB_CLASS =
  "flex-1 min-w-0 min-h-11 px-2 py-2 text-center text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-normal break-words leading-tight";

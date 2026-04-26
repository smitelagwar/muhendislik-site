"use client";

import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Calculator, Command, FileText, Layers, Map, Search, X, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { CALCULATIONS_HUB_HREF } from "@/lib/calculation-pages";
import { normalizeSearchValue } from "@/lib/search-utils";
import type { SearchIndexItem, SearchItemType } from "@/lib/search-types";
import { TOOLS_HUB_HREF } from "@/lib/tools-data";
import { cn } from "@/lib/utils";

const LISTBOX_ID = "command-palette-listbox";

const SHORTCUT_LINKS: Array<{ label: string; href: string; icon: LucideIcon }> = [
  { label: "Bina Aşamaları", href: "/kategori/bina-asamalari", icon: Map },
  { label: "Araçlar", href: TOOLS_HUB_HREF, icon: Calculator },
  { label: "Hesaplamalar", href: CALCULATIONS_HUB_HREF, icon: BarChart3 },
  { label: "Konu Haritası", href: "/konu-haritasi", icon: Layers },
];

type PaletteEntry =
  | {
      kind: "result";
      id: string;
      href: string;
      title: string;
      category: string;
      description: string;
      itemType: SearchItemType;
      icon: LucideIcon;
    }
  | {
      kind: "shortcut";
      id: string;
      href: string;
      title: string;
      icon: LucideIcon;
    };

function getOptionId(index: number) {
  return `command-palette-option-${index}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) {
    return <>{text}</>;
  }

  const escapedQuery = escapeRegExp(query.trim());
  // Türkçe I/İ farkı için görsel eşleşme kontrolü ayrıca normalize ediliyor.
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch =
          part.toLocaleLowerCase("tr-TR") === query.trim().toLocaleLowerCase("tr-TR") ||
          normalizeSearchValue(part) === normalizeSearchValue(query.trim());

        return isMatch ? (
          <span key={index} className="rounded-sm bg-teal-500/20 px-0.5 text-teal-200">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </>
  );
}

function getItemTypeLabel(type: SearchItemType): string {
  switch (type) {
    case "article":
      return "Makale";
    case "topic":
      return "Konu";
    case "tool":
      return "Araç";
    case "calculation":
      return "Hesap";
    case "section":
      return "Kategori";
    default:
      return "Sonuç";
  }
}

function getItemIcon(type: SearchItemType) {
  switch (type) {
    case "tool":
    case "calculation":
      return Calculator;
    case "topic":
      return Map;
    case "section":
      return Layers;
    case "article":
    default:
      return FileText;
  }
}

function scoreItem(item: SearchIndexItem, normalizedQuery: string): number {
  if (!normalizedQuery) {
    return item.priority;
  }

  const title = normalizeSearchValue(item.title);
  const category = normalizeSearchValue(item.category);
  const description = normalizeSearchValue(item.description);
  const href = normalizeSearchValue(item.href);
  let score = 0;

  if (title === normalizedQuery) {
    score += 1600;
  }

  if (title.startsWith(normalizedQuery)) {
    score += 1000;
  } else if (title.includes(normalizedQuery)) {
    score += 760;
  }

  if (category.startsWith(normalizedQuery)) {
    score += 320;
  } else if (category.includes(normalizedQuery)) {
    score += 240;
  }

  if (description.includes(normalizedQuery)) {
    score += 180;
  }

  if (href.includes(normalizedQuery)) {
    score += 140;
  }

  if (item.searchText.includes(normalizedQuery)) {
    score += 120;
  }

  return score > 0 ? score + item.priority : -1;
}

interface CommandPaletteProps {
  openSignal?: number;
  toggleSignal?: number;
}

export function CommandPalette({ openSignal = 0, toggleSignal = 0 }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchIndexItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [activeOptionIndex, setActiveOptionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFocusedElementRef = useRef<HTMLElement | null>(null);
  const handledOpenSignalRef = useRef(0);
  const handledToggleSignalRef = useRef(0);
  const router = useRouter();
  const deferredQuery = useDeferredValue(query);

  const openPalette = useCallback(() => {
    if (!isOpen && document.activeElement instanceof HTMLElement) {
      lastFocusedElementRef.current = document.activeElement;
    }

    setLoadFailed(false);
    setActiveOptionIndex(0);
    if (items.length === 0) {
      setIsLoading(true);
    }
    setIsOpen(true);
  }, [isOpen, items.length]);

  const closePalette = useCallback(() => {
    setIsOpen(false);
    setIsLoading(false);
    setQuery("");
    setActiveOptionIndex(0);

    const previousElement = lastFocusedElementRef.current;
    lastFocusedElementRef.current = null;

    if (previousElement && document.contains(previousElement)) {
      requestAnimationFrame(() => {
        previousElement.focus({ preventScroll: true });
      });
    }
  }, []);

  useEffect(() => {
    if (openSignal === 0 || handledOpenSignalRef.current === openSignal) {
      return;
    }

    handledOpenSignalRef.current = openSignal;
    queueMicrotask(openPalette);
  }, [openPalette, openSignal]);

  useEffect(() => {
    if (toggleSignal === 0 || handledToggleSignalRef.current === toggleSignal) {
      return;
    }

    handledToggleSignalRef.current = toggleSignal;

    if (isOpen) {
      queueMicrotask(closePalette);
      return;
    }

    queueMicrotask(openPalette);
  }, [closePalette, isOpen, openPalette, toggleSignal]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePalette();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePalette, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || items.length > 0 || (loadFailed && !isLoading)) {
      return;
    }

    const controller = new AbortController();

    fetch("/api/search", { cache: "force-cache", signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Search index request failed");
        }

        return response.json() as Promise<SearchIndexItem[]>;
      })
      .then((payload) => {
        startTransition(() => {
          setItems(payload);
        });
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }

        setLoadFailed(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [isLoading, isOpen, items.length, loadFailed]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(deferredQuery);

    if (!normalizedQuery) {
      return [...items]
        .sort((left, right) => right.priority - left.priority || left.title.localeCompare(right.title, "tr-TR"))
        .slice(0, 8);
    }

    return items
      .map((item) => ({ item, score: scoreItem(item, normalizedQuery) }))
      .filter((entry) => entry.score > -1)
      .sort(
        (left, right) =>
          right.score - left.score ||
          right.item.priority - left.item.priority ||
          left.item.title.localeCompare(right.item.title, "tr-TR"),
      )
      .slice(0, 12)
      .map((entry) => entry.item);
  }, [deferredQuery, items]);

  const showShortcuts = !query.trim();

  const shortcutEntries = useMemo<PaletteEntry[]>(
    () =>
      SHORTCUT_LINKS.map((link) => ({
        kind: "shortcut",
        id: `shortcut:${link.href}`,
        href: link.href,
        title: link.label,
        icon: link.icon,
      })),
    [],
  );

  const paletteEntries = useMemo<PaletteEntry[]>(() => {
    const resultEntries = filteredItems.map<PaletteEntry>((item) => ({
      kind: "result",
      id: item.id,
      href: item.href,
      title: item.title,
      category: item.category,
      description: item.description,
      itemType: item.type,
      icon: getItemIcon(item.type),
    }));

    return showShortcuts ? [...resultEntries, ...shortcutEntries] : resultEntries;
  }, [filteredItems, shortcutEntries, showShortcuts]);

  const activeIndex = paletteEntries.length === 0 ? -1 : Math.min(activeOptionIndex, paletteEntries.length - 1);
  const activeEntry = activeIndex > -1 ? paletteEntries[activeIndex] : null;

  const openRoute = useCallback(
    (href: string) => {
      router.push(href);
      closePalette();
    },
    [closePalette, router],
  );

  const handlePaletteKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.nativeEvent.isComposing) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (paletteEntries.length > 0) {
          setActiveOptionIndex(activeIndex >= paletteEntries.length - 1 ? 0 : activeIndex + 1);
        }
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (paletteEntries.length > 0) {
          setActiveOptionIndex(activeIndex <= 0 ? paletteEntries.length - 1 : activeIndex - 1);
        }
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        setActiveOptionIndex(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        setActiveOptionIndex(Math.max(paletteEntries.length - 1, 0));
        return;
      }

      if (event.key === "Enter" && activeEntry) {
        event.preventDefault();
        openRoute(activeEntry.href);
      }
    },
    [activeEntry, activeIndex, openRoute, paletteEntries.length],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[6vh] sm:pt-[12vh]" data-command-palette>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePalette}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            id="command-palette-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="command-palette-title"
            className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950 shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/90 px-4 py-4">
              <Search className="h-5 w-5 text-zinc-500" />
              <div className="flex-1">
                <p id="command-palette-title" className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  Hızlı Arama
                </p>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  role="combobox"
                  aria-label="Site içinde ara"
                  aria-autocomplete="list"
                  aria-expanded="true"
                  aria-controls={LISTBOX_ID}
                  aria-activedescendant={activeIndex > -1 ? getOptionId(activeIndex) : undefined}
                  onKeyDown={handlePaletteKeyDown}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveOptionIndex(0);
                  }}
                  placeholder="İçerik, araç veya konu ara..."
                  className="mt-1 w-full border-none bg-transparent text-lg text-zinc-100 outline-none placeholder:text-zinc-500"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-md border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500">
                  ESC
                </span>
                <button
                  type="button"
                  onClick={closePalette}
                  aria-label="Arama penceresini kapat"
                  className="rounded-md p-1 outline-none transition-colors hover:text-teal-200 focus-visible:ring-2 focus-visible:ring-teal-500/40"
                >
                  <X className="h-5 w-5 text-zinc-500 transition-colors hover:text-teal-200" />
                </button>
              </div>
            </div>

            <div id={LISTBOX_ID} role="listbox" aria-label="Arama sonuçları ve kısayollar" className="max-h-[75vh] overflow-y-auto p-2 scrollbar-hide sm:max-h-[60vh]">
              <div className="mb-4">
                <h3 className="mb-1 mt-2 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Sonuçlar</h3>
                {isLoading && items.length === 0 ? <div className="p-6 text-sm text-zinc-500" role="status">Arama dizini yükleniyor...</div> : null}
                {filteredItems.map((item, index) => {
                  const ItemIcon = getItemIcon(item.type);
                  const isActive = activeIndex === index;

                  return (
                    <button
                      key={item.id}
                      id={getOptionId(index)}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      tabIndex={-1}
                      onClick={() => openRoute(item.href)}
                      onMouseEnter={() => setActiveOptionIndex(index)}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-2xl p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-500/40",
                        isActive ? "bg-zinc-900 ring-1 ring-teal-400/35" : "hover:bg-zinc-900",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-500 transition-colors group-hover:border-teal-400/30 group-hover:text-teal-200",
                          isActive && "border-teal-400/40 text-teal-200",
                        )}
                      >
                        <ItemIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-bold text-zinc-100">
                            <HighlightText text={item.title} query={query} />
                          </p>
                          <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                            {getItemTypeLabel(item.type)}
                          </span>
                        </div>
                        <p className="truncate text-xs text-zinc-400">
                          <HighlightText text={item.category} query={query} />
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          <HighlightText text={item.description} query={query} />
                        </p>
                      </div>
                      <Command className={cn("h-4 w-4 text-zinc-700 transition-colors group-hover:text-teal-200", isActive && "text-teal-200")} />
                    </button>
                  );
                })}
                {isLoading && items.length > 0 ? <div className="px-3 pt-2 text-xs text-zinc-500" role="status">Arama dizini güncelleniyor...</div> : null}
                {loadFailed ? <div className="p-6 text-sm text-zinc-500" role="status">Arama dizini yüklenemedi. Tekrar deneyin.</div> : null}
                {!isLoading && !loadFailed && filteredItems.length === 0 ? (
                  <div className="p-10 text-center text-sm italic text-zinc-500" role="status">
                    {query.trim() ? "Eşleşen sonuç bulunamadı." : "Yazmaya başlayın veya kısayollardan ilerleyin."}
                  </div>
                ) : null}
              </div>

              {showShortcuts ? (
                <div className="mb-2 border-t border-zinc-800 pt-3">
                  <h3 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Kısayollar</h3>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {SHORTCUT_LINKS.map((link, index) => {
                      const optionIndex = filteredItems.length + index;
                      const isActive = activeIndex === optionIndex;

                      return (
                        <button
                          key={link.href}
                          id={getOptionId(optionIndex)}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          tabIndex={-1}
                          onClick={() => openRoute(link.href)}
                          onMouseEnter={() => setActiveOptionIndex(optionIndex)}
                          className={cn(
                            "group flex items-center gap-3 rounded-2xl p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-500/40",
                            isActive ? "bg-zinc-900 ring-1 ring-teal-400/35" : "hover:bg-zinc-900",
                          )}
                        >
                          <link.icon className={cn("h-4 w-4 text-zinc-500 transition-colors group-hover:text-teal-200", isActive && "text-teal-200")} />
                          <span className="text-xs font-medium text-zinc-200">{link.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="hidden items-center justify-between border-t border-zinc-800 bg-zinc-950/90 px-4 py-3 text-[11px] text-zinc-500 sm:flex">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5">Up/Down</span>
                  Gezin
                </span>
                <span className="flex items-center gap-1">
                  <span className="rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5">Enter</span>
                  Aç
                </span>
              </div>
              <span className="flex items-center gap-1">
                <Command className="h-3 w-3" /> + K
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

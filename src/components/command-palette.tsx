"use client";

import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calculator, Command, FileText, Layers, Map, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { CALCULATIONS_HUB_HREF } from "@/lib/calculation-pages";
import type { SearchIndexItem, SearchItemType } from "@/lib/search-types";
import { normalizeSearchValue } from "@/lib/search-utils";
import { TOOLS_HUB_HREF } from "@/lib/tools-data";

const SHORTCUT_LINKS = [
  { label: "Bina Aşamaları", href: "/kategori/bina-asamalari", icon: Map },
  { label: "Araçlar", href: TOOLS_HUB_HREF, icon: Calculator },
  { label: "Hesaplamalar", href: CALCULATIONS_HUB_HREF, icon: Calculator },
  { label: "Konu Haritası", href: "/konu-haritasi", icon: Layers },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) {
    return <>{text}</>;
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={index} className="rounded-sm bg-blue-600/20 px-0.5 text-blue-700 dark:text-blue-400">
            {part}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
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

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchIndexItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const deferredQuery = useDeferredValue(query);

  const openPalette = useCallback(() => {
    setLoadFailed(false);
    if (items.length === 0) {
      setIsLoading(true);
    }
    setIsOpen(true);
  }, [items.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((current) => {
          const next = !current;

          if (next && items.length === 0) {
            setLoadFailed(false);
            setIsLoading(true);
          }

          if (!next) {
            setIsLoading(false);
          }

          return next;
        });
      }

      if (event.key === "Escape") {
        setIsOpen(false);
        setIsLoading(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", openPalette);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", openPalette);
    };
  }, [items.length, openPalette]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || items.length > 0 || (loadFailed && !isLoading)) {
      return;
    }

    const controller = new AbortController();

    fetch("/api/search", { signal: controller.signal })
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
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Command palette search load failed:", error);
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

  const closePalette = () => {
    setIsOpen(false);
    setIsLoading(false);
    setQuery("");
  };

  const openRoute = (href: string) => {
    router.push(href);
    closePalette();
  };

  const showShortcuts = !query.trim();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePalette}
            className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-50/50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <Search className="h-5 w-5 text-zinc-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="İçerik, araç veya konu ara..."
                className="flex-1 border-none bg-transparent text-lg text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
              />
              <div className="flex items-center gap-1.5">
                <span className="rounded-md border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-bold text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">
                  ESC
                </span>
                <button type="button" onClick={closePalette}>
                  <X className="h-5 w-5 text-zinc-400 transition-colors hover:text-zinc-600" />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
              <div className="mb-4">
                <h3 className="mb-1 mt-2 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Sonuçlar</h3>
                {isLoading && items.length === 0 ? <div className="p-6 text-sm text-zinc-500">Arama dizini yükleniyor...</div> : null}
                {filteredItems.map((item) => {
                  const ItemIcon = getItemIcon(item.type);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openRoute(item.href)}
                      className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-colors group-hover:text-blue-600 dark:bg-zinc-800">
                        <ItemIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            <HighlightText text={item.title} query={query} />
                          </p>
                          <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 dark:border-zinc-700">
                            {getItemTypeLabel(item.type)}
                          </span>
                        </div>
                        <p className="truncate text-xs text-zinc-500">
                          <HighlightText text={item.category} query={query} />
                        </p>
                        <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">
                          <HighlightText text={item.description} query={query} />
                        </p>
                      </div>
                      <Command className="h-4 w-4 text-zinc-300 transition-colors group-hover:text-zinc-500" />
                    </button>
                  );
                })}
                {isLoading && items.length > 0 ? <div className="px-3 pt-2 text-xs text-zinc-500">Arama dizini güncelleniyor...</div> : null}
                {loadFailed ? <div className="p-6 text-sm text-zinc-500">Arama dizini yüklenemedi. Tekrar deneyin.</div> : null}
                {!isLoading && !loadFailed && filteredItems.length === 0 ? (
                  <div className="p-10 text-center text-sm italic text-zinc-500">
                    {query.trim() ? "Eşleşen sonuç bulunamadı." : "Yazmaya başlayın veya kısayollardan ilerleyin."}
                  </div>
                ) : null}
              </div>

              {showShortcuts ? (
                <div className="mb-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <h3 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Kısayollar</h3>
                  <div className="grid gap-1 sm:grid-cols-2">
                    {SHORTCUT_LINKS.map((link) => (
                      <button
                        key={link.href}
                        type="button"
                        onClick={() => openRoute(link.href)}
                        className="group flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <link.icon className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-blue-600" />
                        <span className="text-xs font-medium">{link.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-4 py-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="rounded border border-zinc-300 bg-white px-1 py-0.5 dark:border-zinc-700 dark:bg-zinc-800">Up/Down</span>
                  Gezin
                </span>
                <span className="flex items-center gap-1">
                  <span className="rounded border border-zinc-300 bg-white px-1 py-0.5 dark:border-zinc-700 dark:bg-zinc-800">Enter</span>
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

"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calculator, Command, FileText, Map, Scale, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { ToolIcon } from "@/components/tool-icon";
import { TOOLS_HUB_HREF, getLiveTools } from "@/lib/tools-data";

interface SearchItem {
  title: string;
  slug: string;
  category: string;
  description: string;
}

const DISCOVERY_LINKS = [
  { label: "Yapi", href: "/kategori/yapi-tasarimi", icon: <FileText className="h-4 w-4" /> },
  { label: "Yonetmelikler", href: "/kategori/deprem-yonetmelik", icon: <Scale className="h-4 w-4" /> },
  { label: "Site Haritasi", href: "/konu-haritasi", icon: <Map className="h-4 w-4" /> },
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

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const tools = useMemo(() => getLiveTools(), []);
  const deferredQuery = useDeferredValue(query);
  const isLoading = isOpen && !hasLoaded && !loadFailed;

  useEffect(() => {
    const openPalette = () => {
      setLoadFailed(false);
      setIsOpen(true);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((current) => {
          const next = !current;

          if (next) {
            setLoadFailed(false);
          }

          return next;
        });
      }

      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", openPalette);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", openPalette);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || hasLoaded || loadFailed) {
      return;
    }

    const controller = new AbortController();

    fetch("/api/articles?scope=search", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Search index request failed");
        }

        return response.json() as Promise<SearchItem[]>;
      })
      .then((payload) => {
        startTransition(() => {
          setItems(payload);
          setHasLoaded(true);
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Command palette search load failed:", error);
        setLoadFailed(true);
      });

    return () => controller.abort();
  }, [hasLoaded, isOpen, loadFailed]);

  const filteredArticles = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return items.slice(0, 5);
    }

    return items
      .filter((article) => {
        return (
          article.title.toLowerCase().includes(normalizedQuery) ||
          article.category.toLowerCase().includes(normalizedQuery) ||
          article.description.toLowerCase().includes(normalizedQuery)
        );
      })
      .slice(0, 8);
  }, [deferredQuery, items]);

  const closePalette = () => {
    setIsOpen(false);
    setQuery("");
  };

  const openRoute = (href: string) => {
    router.push(href);
    closePalette();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[15vh]">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closePalette} className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm" />

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
                placeholder="Icerik, arac veya konu ara..."
                className="flex-1 border-none bg-transparent text-lg text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
              />
              <div className="flex items-center gap-1.5">
                <span className="rounded-md border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-bold text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800">ESC</span>
                <button type="button" onClick={closePalette}>
                  <X className="h-5 w-5 text-zinc-400 transition-colors hover:text-zinc-600" />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
              <div className="mb-4">
                <h3 className="mb-1 mt-2 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Icerikler</h3>
                {isLoading ? <div className="p-6 text-sm text-zinc-500">Arama dizini yukleniyor...</div> : null}
                {filteredArticles.map((article) => (
                  <button
                    key={article.slug}
                    type="button"
                    onClick={() => openRoute(`/${article.slug}`)}
                    className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-colors group-hover:text-blue-600 dark:bg-zinc-800">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        <HighlightText text={article.title} query={query} />
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        <HighlightText text={article.category} query={query} />
                      </p>
                    </div>
                    <Command className="h-4 w-4 text-zinc-300 transition-colors group-hover:text-zinc-500" />
                  </button>
                ))}
                {loadFailed ? <div className="p-6 text-sm text-zinc-500">Arama dizini yuklenemedi. Tekrar deneyin.</div> : null}
                {!isLoading && !loadFailed && filteredArticles.length === 0 ? <div className="p-10 text-center text-sm italic text-zinc-500">Eslesen sonuc bulunamadi.</div> : null}
              </div>

              <div className="mb-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <h3 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Araclar</h3>
                <div className="grid gap-1 sm:grid-cols-2">
                  <button type="button" onClick={() => openRoute(TOOLS_HUB_HREF)} className="group flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <Calculator className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-blue-600" />
                    <span className="text-xs font-medium">Tum hesap araclari</span>
                  </button>
                  {tools.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => openRoute(tool.href)}
                      className="group flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <ToolIcon iconKey={tool.iconKey} className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-blue-600" />
                      <span className="text-xs font-medium">{tool.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <h3 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Kesif</h3>
                <div className="grid gap-1 sm:grid-cols-3">
                  {DISCOVERY_LINKS.map((link) => (
                    <button
                      key={link.href}
                      type="button"
                      onClick={() => openRoute(link.href)}
                      className="group flex items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <span className="text-zinc-400 transition-colors group-hover:text-blue-600">{link.icon}</span>
                      <span className="text-xs font-medium">{link.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-4 py-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="rounded border border-zinc-300 bg-white px-1 py-0.5 dark:border-zinc-700 dark:bg-zinc-800">↑↓</span>
                  Navigasyon
                </span>
                <span className="flex items-center gap-1">
                  <span className="rounded border border-zinc-300 bg-white px-1 py-0.5 dark:border-zinc-700 dark:bg-zinc-800">Enter</span>
                  Ac
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

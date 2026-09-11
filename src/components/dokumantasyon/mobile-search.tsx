"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, X, MoreVertical } from "lucide-react";
import type { DokFile, DokFolder } from "@/lib/dokumantasyon/types";
import { useVisibleViewport } from "./drive-v3/use-visible-viewport";
import { mobileMetadata } from "./mobile-explorer";
import { OverlayPortal } from "./drive-v3/overlay-portal";
import s from "./mobile-workspace.module.css";
const searchPositions = new Map<string, number>();
export function MobileSearch({
  query,
  onQuery,
  onClose,
  onOpen,
  onFolder,
  menu,
  onMenu,
}: {
  menu: DokFile | null;
  onMenu: (file: DokFile | null) => void;
  query: string;
  onQuery: (s: string) => void;
  onClose: () => void;
  onOpen: (f: DokFile) => void;
  onFolder: (id: string | null) => void;
}) {
  const [result, setResult] = useState<{
    files: DokFile[];
    folders: DokFolder[];
  }>({ files: [], folders: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [resultQuery, setResultQuery] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const visibleResult =
    resultQuery === query ? result : { files: [], folders: [] };
  const input = useRef<HTMLInputElement>(null);
  const viewport = useVisibleViewport(true);
  useEffect(() => {
    input.current?.focus();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setError("");
      setResult({ files: [], folders: [] });
      if (!query.trim()) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(
          `/api/dokumantasyon/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!response.ok)
          throw new Error(
            response.status === 401
              ? "Oturumunuzu yenileyin."
              : "Arama tamamlanamadı. Tekrar deneyin.",
          );
        const data = await response.json();
        if (!controller.signal.aborted) {
          setResult({ files: data.files || [], folders: data.folders || [] });
          setResultQuery(query);
        }
      } catch (e) {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Arama tamamlanamadı.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, retry]);
  useLayoutEffect(() => {
    if (resultQuery === query && resultsRef.current) {
      resultsRef.current.scrollTop = searchPositions.get(query) ?? 0;
    }
  }, [query, resultQuery, result]);
  return (
    <section
      aria-label="Dosya arama"
      className={s.searchSurface}
      style={
        viewport
          ? { top: viewport.top, height: viewport.height, bottom: "auto" }
          : undefined
      }
    >
      <div className={s.bar}>
        <button className={s.icon} aria-label="Aramadan çık" onClick={onClose}>
          <ChevronLeft size={20} />
        </button>
        <input
          ref={input}
          className={s.search}
          aria-label="Tüm dosyalarda ara"
          placeholder="Tüm dosyalarda ara…"
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
        />
        <button
          className={s.icon}
          aria-label="Aramayı temizle"
          onClick={() => {
            onQuery("");
            input.current?.focus();
          }}
        >
          <X size={20} />
        </button>
      </div>
      <div
        ref={resultsRef}
        className={s.results}
        data-testid="dok-search-results"
        onScroll={(event) => {
          if (
            resultQuery !== query ||
            (!visibleResult.files.length && !visibleResult.folders.length)
          )
            return;
          searchPositions.set(query, event.currentTarget.scrollTop);
          if (searchPositions.size > 20)
            searchPositions.delete(searchPositions.keys().next().value!);
        }}
      >
        <div role="status" className={s.notice}>
          {loading || (!!query.trim() && resultQuery !== query && !error)
            ? "Aranıyor…"
            : error ||
              (!query.trim()
                ? "Dosya veya klasör adı yazın."
                : visibleResult.files.length + visibleResult.folders.length ===
                    0
                  ? "Eşleşen dosya veya klasör bulunamadı."
                  : `${visibleResult.files.length + visibleResult.folders.length} sonuç`)}
        </div>
        {error && (
          <button className={s.action} onClick={() => setRetry((x) => x + 1)}>
            Tekrar dene
          </button>
        )}
        {visibleResult.folders.map((f) => (
          <button
            key={f.id}
            className={s.action}
            onClick={() => onFolder(f.id)}
          >
            {f.name}
          </button>
        ))}
        {visibleResult.files.map((f) => (
          <div className={s.row} key={f.id}>
            <button className={s.content} onClick={() => onOpen(f)}>
              <span className={s.name}>{f.display_name}</span>
              <span className={s.meta}>{mobileMetadata(f)}</span>
            </button>
            <button
              className={s.icon}
              aria-label={`${f.display_name} arama işlemleri`}
              onClick={(event) => {
                event.currentTarget.focus({ preventScroll: true });
                onMenu(f);
              }}
            >
              <MoreVertical size={20} />
            </button>
          </div>
        ))}
      </div>
      <OverlayPortal
        isOpen={!!menu}
        onClose={() => onMenu(null)}
        title="Arama sonucu işlemleri"
        presentation="sheet"
      >
        <div className={s.panel}>
          <h2>{menu?.display_name}</h2>
          <button
            className={s.action}
            onClick={() => {
              if (menu) onFolder(menu.folder_id);
              onMenu(null);
            }}
          >
            Bulunduğu klasöre git
          </button>
        </div>
      </OverlayPortal>
    </section>
  );
}

// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — GÜVENLİ MARKDOWN GÖRÜNTÜLEYİCİ (MARKDOWN VIEWER)
// ============================================================================

"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText,
  Code2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DokMarkdownViewerProps {
  accessUrl: string;
  displayName: string;
}

export function DokMarkdownViewer({ accessUrl, displayName }: DokMarkdownViewerProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"preview" | "raw">("preview");
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(accessUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Markdown dokümanı indirilemedi.");
        return res.text();
      })
      .then((text) => {
        if (!isMounted) return;
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Markdown okuma hatası:", err);
        setError("Markdown dokümanı yüklenirken bir hata oluştu.");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [accessUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Kopyalama başarısız");
    }
  };

  return (
    <div className="flex h-full min-h-[550px] w-full flex-col bg-zinc-950 text-zinc-100">
      {/* Üst Araç Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900/90 px-4 py-2 text-xs backdrop-blur-md">
        {/* Sol Alan: Mod Geçişi */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMode("preview")}
              className={`h-7 gap-1.5 px-3 text-[11px] font-medium ${
                mode === "preview" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Önizleme</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMode("raw")}
              className={`h-7 gap-1.5 px-3 text-[11px] font-medium ${
                mode === "raw" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Ham Kaynak (Raw)</span>
            </Button>
          </div>
        </div>

        {/* Sağ Alan: Kopyala Butonu */}
        <Button
          size="sm"
          onClick={handleCopy}
          disabled={loading || !content}
          className="h-7 gap-1.5 bg-amber-500 px-3 text-[11px] font-bold text-zinc-950 hover:bg-amber-400 shadow-sm"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Kopyalandı</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Tümünü Kopyala</span>
            </>
          )}
        </Button>
      </div>

      {/* Ana İçerik Alanı */}
      <div className="relative flex-1 overflow-auto p-6 sm:p-10 select-text">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
            <span className="text-sm font-medium">Markdown yükleniyor...</span>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-md rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center text-red-400 shadow-xl">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
            <h3 className="text-sm font-bold text-red-300">Yüklenemedi</h3>
            <p className="mt-1 text-xs text-zinc-400">{error}</p>
          </div>
        )}

        {!loading && !error && mode === "preview" && (
          <div className="mx-auto max-w-4xl text-zinc-200">
            <article className="prose prose-invert prose-amber max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-table:border-collapse prose-table:w-full prose-th:border prose-th:border-zinc-800 prose-th:bg-zinc-900 prose-th:p-2 prose-td:border prose-td:border-zinc-800/60 prose-td:p-2 prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-xl prose-code:text-amber-400 prose-blockquote:border-l-amber-500 prose-blockquote:bg-secondary/20 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg">
              <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml={true}>
                {content}
              </ReactMarkdown>
            </article>
          </div>
        )}

        {!loading && !error && mode === "raw" && (
          <div className="mx-auto max-w-4xl font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            {content}
          </div>
        )}
      </div>
    </div>
  );
}

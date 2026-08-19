// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — GÜVENLİ METİN, KOD, JSON VE CSV GÖRÜNTÜLEYİCİ
// ============================================================================

"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Copy,
  Check,
  Table as TableIcon,
  FileCode,
  Search,
  Loader2,
  AlertCircle,
  WrapText,
  AlignLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DokTextViewerProps {
  accessUrl: string;
  displayName: string;
  extension: string;
}

export function DokTextViewer({ accessUrl, displayName, extension }: DokTextViewerProps) {
  const [rawText, setRawText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [copied, setCopied] = useState<boolean>(false);
  const [wrapLines, setWrapLines] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"text" | "table" | "formatted_json">(
    extension === ".csv" ? "table" : extension === ".json" ? "formatted_json" : "text"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");

  const isJson = extension === ".json";
  const isCsv = extension === ".csv";

  // 1. Metin İçeriğini Fetch Et
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(accessUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Metin dosyası indirilemedi.");
        return res.text();
      })
      .then((text) => {
        if (!isMounted) return;
        setRawText(text);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Metin okuma hatası:", err);
        setError("Metin dosyası yüklenirken bir hata oluştu.");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [accessUrl]);

  // 2. Metin Kopyalama
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Kopyalama başarısız");
    }
  };

  // 3. JSON Biçimlendirme
  const formattedJsonText = useMemo(() => {
    if (!isJson || !rawText) return rawText;
    try {
      const parsed = JSON.parse(rawText);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return rawText;
    }
  }, [isJson, rawText]);

  // 4. CSV Ayrıştırma (Basit ve Güvenli Tablo Ayrıştırıcı)
  const csvData = useMemo(() => {
    if (!isCsv || !rawText) return { headers: [], rows: [] };

    const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    // Delimiter tespiti (virgül veya noktalı virgül)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(";") ? ";" : ",";

    const parseLine = (line: string) => {
      const row: string[] = [];
      let inQuotes = false;
      let cur = "";

      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === delimiter && !inQuotes) {
          row.push(cur.trim());
          cur = "";
        } else {
          cur += c;
        }
      }
      row.push(cur.trim());
      return row;
    };

    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(parseLine);

    return { headers, rows };
  }, [isCsv, rawText]);

  // 5. Gösterilecek Satırlar
  const activeContent = isJson && viewMode === "formatted_json" ? formattedJsonText : rawText;
  const lines = useMemo(() => activeContent.split(/\r?\n/), [activeContent]);

  const stats = useMemo(() => {
    const chars = activeContent.length;
    const words = activeContent.trim() ? activeContent.trim().split(/\s+/).length : 0;
    return { linesCount: lines.length, chars, words };
  }, [activeContent, lines]);

  return (
    <div className="flex h-full min-h-[550px] w-full flex-col bg-zinc-950 text-zinc-100 font-mono text-xs">
      {/* Üst Araç Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900/90 px-4 py-2 backdrop-blur-md">
        {/* Sol Alan: Mod Seçimi ve Arama */}
        <div className="flex items-center gap-2">
          {isCsv && (
            <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewMode("table")}
                className={`h-7 gap-1.5 px-2.5 text-[11px] font-medium ${
                  viewMode === "table" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Tablo</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewMode("text")}
                className={`h-7 gap-1.5 px-2.5 text-[11px] font-medium ${
                  viewMode === "text" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                <AlignLeft className="h-3.5 w-3.5" />
                <span>Ham Metin</span>
              </Button>
            </div>
          )}

          {isJson && (
            <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-950 p-0.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewMode("formatted_json")}
                className={`h-7 gap-1.5 px-2.5 text-[11px] font-medium ${
                  viewMode === "formatted_json" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>Biçimlendirilmiş</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewMode("text")}
                className={`h-7 gap-1.5 px-2.5 text-[11px] font-medium ${
                  viewMode === "text" ? "bg-amber-500 text-zinc-950 font-bold" : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                <AlignLeft className="h-3.5 w-3.5" />
                <span>Ham JSON</span>
              </Button>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-zinc-400">
            <span>{stats.linesCount} satır</span>
            <span>•</span>
            <span>{stats.words} kelime</span>
            <span>•</span>
            <span>{stats.chars} karakter</span>
          </div>
        </div>

        {/* Sağ Alan: Satır Kaydırma ve Kopyalama */}
        <div className="flex items-center gap-2">
          {viewMode !== "table" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setWrapLines((w) => !w)}
              className={`h-7 gap-1.5 px-2 text-[11px] ${wrapLines ? "bg-amber-500/20 text-amber-400" : "text-zinc-400 hover:text-zinc-100"}`}
              title="Satır Kaydırmayı Aç/Kapat"
            >
              <WrapText className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Kaydır</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleCopy}
            disabled={loading || !rawText}
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
      </div>

      {/* Ana İçerik Alanı */}
      <div className="relative flex-1 overflow-auto bg-zinc-950 p-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-3" />
            <span className="text-sm font-medium">Metin yükleniyor...</span>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-md rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center text-red-400 shadow-xl">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
            <h3 className="text-sm font-bold text-red-300">Yüklenemedi</h3>
            <p className="mt-1 text-xs text-zinc-400">{error}</p>
          </div>
        )}

        {!loading && !error && viewMode === "table" && isCsv && (
          <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/40">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/90 text-amber-400 font-bold">
                  <th className="px-3 py-2 text-center text-zinc-600 w-12">#</th>
                  {csvData.headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 border-r border-zinc-800/60 last:border-r-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40 font-sans">
                {csvData.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-3 py-1.5 text-center text-zinc-500 font-mono text-[11px]">
                      {rIdx + 1}
                    </td>
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="px-3 py-1.5 text-zinc-300 border-r border-zinc-800/40 last:border-r-0 max-w-xs truncate"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && viewMode !== "table" && (
          <div className="flex select-text font-mono text-xs leading-relaxed">
            {/* Satır Numaraları */}
            <div className="shrink-0 select-none pr-4 text-right text-zinc-600 border-r border-zinc-800/80 mr-4 space-y-0.5">
              {lines.map((_, idx) => (
                <div key={idx} className="h-5 text-[11px]">
                  {idx + 1}
                </div>
              ))}
            </div>

            {/* Metin Satırları */}
            <div
              className={`flex-1 text-zinc-300 space-y-0.5 ${
                wrapLines ? "break-words whitespace-pre-wrap" : "whitespace-pre overflow-x-auto"
              }`}
            >
              {lines.map((line, idx) => (
                <div key={idx} className="h-5">
                  {line || " "}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

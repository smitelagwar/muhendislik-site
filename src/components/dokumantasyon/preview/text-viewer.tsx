// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — GÜVENLİ METİN, KOD, JSON VE CSV GÖRÜNTÜLEYİCİ / EDİTÖR
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
  Edit3,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudioCommandButton } from "../studio/studio-command-button";

interface DokTextViewerProps {
  accessUrl: string;
  displayName: string;
  extension: string;
  onContentChange?: (newContent: string) => void;
}

export function DokTextViewer({
  accessUrl,
  displayName,
  extension,
  onContentChange,
}: DokTextViewerProps) {
  const [rawText, setRawText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [wrapLines, setWrapLines] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<"text" | "table" | "formatted_json">(
    extension === ".csv" ? "table" : extension === ".json" ? "formatted_json" : "text"
  );

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

  const handleTextEditChange = (newVal: string) => {
    setRawText(newVal);
    onContentChange?.(newVal);
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

  // 4. CSV Ayrıştırma
  const csvData = useMemo(() => {
    if (!isCsv || !rawText) return { headers: [], rows: [] };

    const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

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
  const activeContent = isJson && viewMode === "formatted_json" && !isEditing ? formattedJsonText : rawText;
  const lines = useMemo(() => activeContent.split(/\r?\n/), [activeContent]);

  const stats = useMemo(() => {
    const chars = activeContent.length;
    const words = activeContent.trim() ? activeContent.trim().split(/\s+/).length : 0;
    return { linesCount: lines.length, chars, words };
  }, [activeContent, lines]);

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground font-mono text-xs select-none">
      {/* Üst Araç Çubuğu */}
      <div className="z-30 flex h-12 flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-card/85 px-4 py-1.5 backdrop-blur-md">
        {/* Sol Alan: Mod Seçimi ve Düzenleme Toggle */}
        <div className="flex items-center gap-2">
          {onContentChange && (
            <Button
              size="sm"
              variant={isEditing ? "default" : "outline"}
              onClick={() => setIsEditing((e) => !e)}
              className={`h-8 gap-1.5 px-3 text-xs font-semibold rounded-xl border-border/80 ${
                isEditing
                  ? "bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {isEditing ? <Eye className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5 text-amber-500" />}
              <span>{isEditing ? "Önizlemeye Dön" : "Metni Düzenle"}</span>
            </Button>
          )}

          {isCsv && !isEditing && (
            <div className="flex items-center rounded-xl border border-border/80 bg-background/80 p-0.5 shadow-inner">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewMode("table")}
                className={`h-7 gap-1.5 px-3 text-[11px] font-semibold rounded-lg transition-all ${
                  viewMode === "table" ? "bg-amber-500 text-zinc-950 font-bold shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Tablo</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewMode("text")}
                className={`h-7 gap-1.5 px-3 text-[11px] font-semibold rounded-lg transition-all ${
                  viewMode === "text" ? "bg-amber-500 text-zinc-950 font-bold shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileCode className="h-3.5 w-3.5" />
                <span>Ham Metin</span>
              </Button>
            </div>
          )}

          {isJson && !isEditing && (
            <div className="flex items-center rounded-xl border border-border/80 bg-background/80 p-0.5 shadow-inner">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewMode("formatted_json")}
                className={`h-7 gap-1.5 px-3 text-[11px] font-semibold rounded-lg transition-all ${
                  viewMode === "formatted_json"
                    ? "bg-amber-500 text-zinc-950 font-bold shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Biçimlendirilmiş JSON</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewMode("text")}
                className={`h-7 gap-1.5 px-3 text-[11px] font-semibold rounded-lg transition-all ${
                  viewMode === "text" ? "bg-amber-500 text-zinc-950 font-bold shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Ham JSON</span>
              </Button>
            </div>
          )}
        </div>

        {/* Sağ Alan: İstatistikler, Satır Kaydırma ve Kopyala */}
        <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
          <div className="hidden items-center gap-2 text-[11px] text-muted-foreground md:flex">
            <span>{stats.linesCount} satır</span>
            <span>•</span>
            <span>{stats.words} kelime</span>
            <span>•</span>
            <span>{stats.chars} karakter</span>
          </div>

          <div className="hidden h-4 w-px bg-border/80 md:block" />

          {/* Satır Kaydırma Toggle */}
          <button
            onClick={() => setWrapLines((w) => !w)}
            aria-label="Satır kaydırmayı aç/kapat"
            title={wrapLines ? "Satır kaydırmayı kapat" : "Satır kaydırmayı aç"}
            className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-colors ${
              wrapLines
                ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
                : "border-border/80 text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {wrapLines ? <WrapText className="h-3.5 w-3.5" /> : <AlignLeft className="h-3.5 w-3.5" />}
          </button>

          <StudioCommandButton
            commandId="text.copy"
            onClick={handleCopy}
            disabled={loading || !rawText}
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 px-3 text-xs rounded-xl border-border/80 hover:bg-secondary"
            icon={copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-amber-500" />}
            label={copied ? "Kopyalandı" : "Metni Kopyala"}
            showLabel={true}
          />
        </div>
      </div>

      {/* Ana Metin / Tablo / Düzenleyici Alanı */}
      <div className="relative flex-1 overflow-auto bg-zinc-950 select-text">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
            <Loader2 className="h-9 w-9 animate-spin text-amber-500 mb-3" />
            <span className="text-sm font-medium">Metin yükleniyor...</span>
          </div>
        )}

        {error && (
          <div className="mx-auto max-w-md rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-center text-red-400 shadow-xl backdrop-blur-md mt-10">
            <AlertCircle className="mx-auto h-9 w-9 text-red-500 mb-2" />
            <h3 className="text-sm font-bold text-red-300">Yükleme Hatası</h3>
            <p className="mt-1 text-xs text-zinc-400">{error}</p>
          </div>
        )}

        {!loading && !error && isEditing && (
          <div className="flex h-full w-full p-4">
            <textarea
              value={rawText}
              onChange={(e) => handleTextEditChange(e.target.value)}
              className="h-full w-full resize-none border-0 bg-transparent p-0 font-mono text-xs leading-6 text-zinc-100 focus:outline-none focus:ring-0 select-text"
              placeholder="Metni düzenleyin..."
              spellCheck={false}
            />
          </div>
        )}

        {!loading && !error && !isEditing && viewMode === "table" && isCsv && (
          <div className="p-4 overflow-auto">
            <table className="w-full border-collapse text-left text-xs text-zinc-300">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80 sticky top-0">
                  <th className="p-2 text-[10px] font-bold text-zinc-500 w-12 text-center border-r border-zinc-800">
                    #
                  </th>
                  {csvData.headers.map((h, i) => (
                    <th key={i} className="p-2.5 font-bold text-amber-400 border-r border-zinc-800/60 last:border-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {csvData.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="p-2 text-[10px] text-zinc-500 font-mono text-center border-r border-zinc-800 bg-zinc-950/40">
                      {rIdx + 1}
                    </td>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-2.5 border-r border-zinc-800/40 last:border-0 truncate max-w-xs">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && !isEditing && viewMode !== "table" && (
          <div className="flex min-w-full p-4">
            {/* Satır Numaraları */}
            <div className="flex flex-col pr-4 text-right text-zinc-600 select-none border-r border-zinc-800/80">
              {lines.map((_, i) => (
                <span key={i} className="leading-6 text-[11px] h-6">
                  {i + 1}
                </span>
              ))}
            </div>

            {/* Metin Satırları */}
            <div
              className={`flex-1 pl-4 text-zinc-300 leading-6 text-[11px] ${
                wrapLines ? "whitespace-pre-wrap break-all" : "whitespace-pre overflow-x-auto"
              }`}
            >
              {lines.map((line, i) => (
                <div key={i} className="h-6">
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

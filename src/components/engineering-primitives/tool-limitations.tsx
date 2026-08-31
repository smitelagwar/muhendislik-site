"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

interface ToolLimitationsProps {
  scope: string[];
  limitations: string[];
  inputProvenance?: string;
  defaultOpen?: boolean;
  className?: string;
}

export function ToolLimitations({
  scope,
  limitations,
  inputProvenance,
  defaultOpen = false,
  className = "",
}: ToolLimitationsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 overflow-hidden transition-all ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[44px] flex items-center justify-between p-4 text-left font-bold text-xs uppercase tracking-wider text-muted-foreground dark:text-zinc-300 hover:bg-muted/30 transition-colors"
      >
        <span className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-purple-400" />
          Hesap Kapsamı, Sınırları ve Doğrulama Şartları
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="p-4 pt-0 border-t border-border/60 dark:border-white/5 grid gap-4 sm:grid-cols-2 text-xs">
          <div className="space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Bu Araç Neyi Hesaplarken Kullanılır?
            </h4>
            <ul className="space-y-1 list-disc list-inside text-muted-foreground dark:text-zinc-300">
              {scope.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5" /> Bu Araç Neyi Hesaplamaz? (Kapsam Sınırları)
            </h4>
            <ul className="space-y-1 list-disc list-inside text-muted-foreground dark:text-zinc-300">
              {limitations.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          {inputProvenance && (
            <div className="sm:col-span-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground dark:text-zinc-400">
              <strong>Girdi Kaynağı:</strong> {inputProvenance}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
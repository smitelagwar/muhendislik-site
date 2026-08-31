"use client";

import React, { useState } from "react";
import { Copy, CheckCircle2, Printer } from "lucide-react";

export interface ToolReportActionsProps {
  reportText?: string;
  onCopy?: () => void;
  onPrint?: () => void;
  className?: string;
  showPrint?: boolean;
}

export function ToolReportActions({
  reportText,
  onCopy,
  onPrint,
  className = "",
  showPrint = true,
}: ToolReportActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    if (reportText && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className={`no-print inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20 transition-all active:scale-95"
        title="Mühendislik hesap özetini panoya kopyala"
      >
        {copied ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        <span>{copied ? "Kopyalandı" : "Raporu Kopyala"}</span>
      </button>

      {showPrint && (
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20 transition-all active:scale-95"
          title="Mühendislik hesap çıktısını yazdır veya PDF olarak kaydet"
        >
          <Printer className="h-3.5 w-3.5 text-purple-300" />
          <span>Yazdır / PDF</span>
        </button>
      )}
    </div>
  );
}

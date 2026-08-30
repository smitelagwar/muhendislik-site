"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Copy,
  Check,
  Share2,
  QrCode,
  X,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";
import { formatDate, formatBytes } from "../ui-helpers";

interface ShareResultModalProps {
  isOpen: boolean;
  result: {
    shareUrl: string;
    rawToken: string;
    expiresAt: string;
    totalFiles: number;
    totalSizeBytes: number;
    title?: string | null;
  } | null;
  onClose: () => void;
}

export function ShareResultModal({
  isOpen,
  result,
  onClose,
}: ShareResultModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (result?.shareUrl) {
      QRCode.toDataURL(result.shareUrl, {
        width: 256,
        margin: 1.5,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR kod üretim hatası:", err));
    }
  }, [result?.shareUrl]);

  if (!isOpen || !result) return null;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(result.shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
        return;
      }
      throw new Error("Clipboard API unavailable");
    } catch {
      // Fallback: Geçici textarea ile kopyala
      try {
        const textarea = document.createElement("textarea");
        textarea.value = result.shareUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (err) {
        console.warn("Kopyalama başarısız oldu:", err);
      }
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: result.title || "Dökümantasyon Paylaşım Bağlantısı",
          text: "Dosyaları indirmek için aşağıdaki bağlantıyı kullanabilirsiniz:",
          url: result.shareUrl,
        });
      } catch {
        // Kullanıcı iptal etti
      }
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in"
    >
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2.5 font-bold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <span className="text-base">Paylaşım Linki Hazır!</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {result.title && (
            <div className="text-sm font-bold text-foreground">
              {result.title}
            </div>
          )}

          {/* Bağlantı Kutusu */}
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 shadow-sm">
            <label className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Paylaşım Bağlantısı
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={result.shareUrl}
                className="w-full truncate rounded-xl border border-input bg-background/90 px-3 py-2 text-xs text-foreground font-mono select-all focus:outline-none shadow-inner"
              />
              <Button
                size="sm"
                onClick={handleCopy}
                className="shrink-0 gap-1.5 bg-amber-500 text-xs font-bold text-zinc-950 hover:bg-amber-400 rounded-xl h-9 px-3.5 shadow-sm"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Kopyalandı!" : "Kopyala"}</span>
              </Button>
            </div>
          </div>

          {/* Bilgi Özeti */}
          <div className="grid grid-cols-2 gap-2.5 text-xs rounded-xl border border-border/80 bg-background/80 p-3.5 shadow-inner">
            <div className="space-y-1">
              <span className="text-muted-foreground font-medium">Kapsam:</span>
              <div className="font-bold text-foreground">
                {result.totalFiles} Dosya ({formatBytes(result.totalSizeBytes)})
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground font-medium">Son Geçerlilik:</span>
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span>{formatDate(result.expiresAt)}</span>
              </div>
            </div>
          </div>

          {/* QR Kod Alanı */}
          {showQr && qrDataUrl && (
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-white text-black shadow-md">
              <img
                src={qrDataUrl}
                alt="Paylaşım QR Kodu"
                className="h-44 w-44 object-contain rounded"
              />
              <span className="text-[11px] text-zinc-600 mt-2 text-center">
                Kamera ile okutarak doğrudan indirme sayfasına ulaşın
              </span>
            </div>
          )}

          {/* Alt Aksiyon Butonları */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowQr(!showQr)}
                className="gap-1.5 text-xs rounded-xl h-9"
              >
                <QrCode className="h-3.5 w-3.5 text-amber-500" />
                <span>{showQr ? "QR Gizle" : "QR Göster"}</span>
              </Button>

              {typeof navigator !== "undefined" && "share" in navigator && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleNativeShare}
                  className="gap-1.5 text-xs rounded-xl h-9"
                >
                  <Share2 className="h-3.5 w-3.5 text-blue-500" />
                  <span>Paylaş</span>
                </Button>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-semibold rounded-xl h-9 px-4"
            >
              Kapat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

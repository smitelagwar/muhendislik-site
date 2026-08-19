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
  ExternalLink,
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
      await navigator.clipboard.writeText(result.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span>Paylaşım Linki Hazır!</span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {result.title && (
            <div className="text-sm font-semibold text-foreground">
              {result.title}
            </div>
          )}

          {/* Bağlantı Kutusu */}
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Paylaşım URL'si
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={result.shareUrl}
                className="w-full truncate rounded border border-input bg-background px-2.5 py-1.5 text-xs text-foreground font-mono select-all focus:outline-none"
              />
              <Button
                size="sm"
                onClick={handleCopy}
                className="shrink-0 gap-1 bg-amber-500 text-xs font-semibold text-zinc-950 hover:bg-amber-400"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Kopyalandı!" : "Kopyala"}</span>
              </Button>
            </div>
          </div>

          {/* Bilgi Özeti */}
          <div className="grid grid-cols-2 gap-2 text-xs rounded-lg border border-border bg-background p-3">
            <div className="space-y-0.5">
              <span className="text-muted-foreground">Kapsam:</span>
              <div className="font-semibold text-foreground">
                {result.totalFiles} Dosya ({formatBytes(result.totalSizeBytes)})
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-muted-foreground">Son Geçerlilik:</span>
              <div className="font-semibold text-foreground flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                <span>{formatDate(result.expiresAt)}</span>
              </div>
            </div>
          </div>

          {/* QR Kod Alanı */}
          {showQr && qrDataUrl && (
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-border bg-white text-black">
              <img
                src={qrDataUrl}
                alt="Paylaşım QR Kodu"
                className="h-44 w-44 object-contain"
              />
              <span className="text-[11px] text-zinc-600 mt-1">
                Kamera ile okutarak doğrudan indirme sayfasına ulaşın
              </span>
            </div>
          )}

          {/* Alt Aksiyon Butonları */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/80">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowQr(!showQr)}
                className="gap-1 text-xs"
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
                  className="gap-1 text-xs"
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
              className="text-xs font-semibold"
            >
              Kapat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

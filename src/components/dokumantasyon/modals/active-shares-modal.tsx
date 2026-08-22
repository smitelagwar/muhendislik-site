"use client";

import { useState, useEffect } from "react";
import {
  Link2,
  X,
  Loader2,
  Copy,
  Check,
  QrCode,
  AlertTriangle,
  Clock,
  Download,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";
import { formatDate, formatBytes } from "../ui-helpers";
import { requestDokMutation } from "@/lib/dokumantasyon/client-mutation";

interface ShareLinkItem {
  id: string;
  token_hash: string;
  title: string | null;
  expires_at: string;
  password_hash: string | null;
  max_downloads: number | null;
  download_count: number;
  created_at: string;
  revoked_at: string | null;
  total_files: number;
  total_size_bytes: number;
  decrypted_token: string | null;
  shareUrl: string | null;
  is_expired: boolean;
  is_active: boolean;
}

interface ActiveSharesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ActiveSharesModal({ isOpen, onClose }: ActiveSharesModalProps) {
  const [links, setLinks] = useState<ShareLinkItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [qrModalData, setQrModalData] = useState<{ url: string; qrSrc: string; title: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchShares();
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  const fetchShares = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dokumantasyon/shares");
      const data = await res.json().catch(() => ({}));
      if (res.ok) setLinks(data.links || []);
      else setError(data.error || "Paylaşım bağlantıları listelenemedi.");
    } catch {
      setError("Paylaşım bağlantıları listelenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (link: ShareLinkItem) => {
    if (!link.shareUrl) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link.shareUrl);
        setCopiedId(link.id);
        setTimeout(() => setCopiedId(null), 3000);
        return;
      }
      throw new Error("Clipboard API unavailable");
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = link.shareUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopiedId(link.id);
        setTimeout(() => setCopiedId(null), 3000);
      } catch (err) {
        console.warn("Kopyalama başarısız oldu:", err);
      }
    }
  };

  const handleShowQr = async (link: ShareLinkItem) => {
    if (!link.shareUrl) return;

    try {
      const qrSrc = await QRCode.toDataURL(link.shareUrl, { width: 256, margin: 1.5 });
      setQrModalData({
        url: link.shareUrl,
        qrSrc,
        title: link.title || "Paylaşım Bağlantısı",
      });
    } catch (err) {
      console.error("QR oluşturma hatası:", err);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Bu paylaşım bağlantısını iptal etmek istediğinize emin misiniz? İndirme erişimi derhal kesilecektir.")) {
      return;
    }

    setRevokingId(id);
    setError(null);
    try {
      const result = await requestDokMutation(`/api/dokumantasyon/shares/${id}/revoke`, {
        method: "POST",
      });
      if (result.ok) {
        fetchShares();
      } else {
        setError(result.message);
      }
    } finally {
      setRevokingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in"
    >
      <div className="w-full max-w-4xl rounded-2xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2.5 font-bold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Link2 className="h-4 w-4" />
            </div>
            <span className="text-base">Paylaşım Bağlantıları ({links.length})</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Liste */}
        <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
              <span className="text-xs">Bağlantılar yükleniyor...</span>
            </div>
          ) : links.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Henüz oluşturulmuş bir paylaşım bağlantısı bulunmuyor.
            </div>
          ) : (
            links.map((link) => (
              <div
                key={link.id}
                className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/70 p-4 transition-all hover:border-border hover:bg-card shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1.5 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-foreground truncate max-w-xs sm:max-w-md">
                      {link.title || "İsimsiz Paylaşım"}
                    </span>

                    {/* Durum Rozetleri */}
                    {link.is_active ? (
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
                        Aktif
                      </span>
                    ) : link.revoked_at ? (
                      <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-[10px] font-bold text-red-500">
                        İptal Edildi
                      </span>
                    ) : (
                      <span className="rounded-full bg-zinc-500/15 border border-zinc-500/30 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                        Süresi Doldu
                      </span>
                    )}

                    {link.password_hash && (
                      <span className="rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-medium text-blue-400">
                        Şifreli
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-mono">{link.total_files} Dosya ({formatBytes(link.total_size_bytes)})</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{link.download_count}{link.max_downloads ? `/${link.max_downloads}` : ""} İndirme</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span>Bitiş: {formatDate(link.expires_at)}</span>
                    </span>
                  </div>
                </div>

                {/* Aksiyon Butonları */}
                <div className="flex items-center gap-2 shrink-0 border-t border-border/40 pt-2 sm:border-t-0 sm:pt-0">
                  {link.shareUrl && link.is_active && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyLink(link)}
                        className="gap-1.5 text-xs border-amber-500/40 hover:bg-amber-500/10 rounded-xl h-9"
                      >
                        {copiedId === link.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        <span className="font-semibold">{copiedId === link.id ? "Kopyalandı!" : "Linki Kopyala"}</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShowQr(link)}
                        className="p-2 border-border/80 rounded-xl h-9 w-9"
                        aria-label="QR Kod Göster"
                      >
                        <QrCode className="h-4 w-4 text-foreground" />
                      </Button>
                    </>
                  )}

                  {link.is_active && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevoke(link.id)}
                      disabled={revokingId === link.id}
                      className="gap-1.5 text-xs text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-xl h-9 font-medium"
                    >
                      {revokingId === link.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Ban className="h-3.5 w-3.5" />
                      )}
                      <span>İptal Et</span>
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* QR Önizleme Alt Modalı */}
        {qrModalData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-card p-5 text-center shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-sm font-bold text-foreground truncate">
                  {qrModalData.title}
                </span>
                <button
                  onClick={() => setQrModalData(null)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex justify-center p-4 rounded-xl bg-white shadow-inner">
                <img src={qrModalData.qrSrc} alt="QR Kod" className="h-44 w-44 object-contain rounded" />
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setQrModalData(null)}
                className="w-full text-xs rounded-xl h-9 font-semibold"
              >
                Kapat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

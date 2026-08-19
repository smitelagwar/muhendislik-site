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

  useEffect(() => {
    if (isOpen) {
      fetchShares();
    }
  }, [isOpen]);

  const fetchShares = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dokumantasyon/shares");
      const data = await res.json();
      if (res.ok) {
        setLinks(data.links || []);
      }
    } catch (err) {
      console.error("Paylaşım linkleri yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (link: ShareLinkItem) => {
    if (!link.decrypted_token) return;
    const siteUrl = window.location.origin;
    const fullUrl = `${siteUrl}/p/${link.decrypted_token}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 3000);
    } catch {
      // Fallback
    }
  };

  const handleShowQr = async (link: ShareLinkItem) => {
    if (!link.decrypted_token) return;
    const siteUrl = window.location.origin;
    const fullUrl = `${siteUrl}/p/${link.decrypted_token}`;

    try {
      const qrSrc = await QRCode.toDataURL(fullUrl, { width: 256, margin: 1.5 });
      setQrModalData({
        url: fullUrl,
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
    try {
      const res = await fetch(`/api/dokumantasyon/shares/${id}/revoke`, {
        method: "POST",
      });
      if (res.ok) {
        fetchShares();
      }
    } catch (err) {
      console.error("Link iptal hatası:", err);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-4xl rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Link2 className="h-5 w-5 text-amber-500" />
            <span>Paylaşım Bağlantıları ({links.length})</span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Liste */}
        <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Bağlantılar yükleniyor...</span>
            </div>
          ) : links.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Henüz oluşturulmuş bir paylaşım bağlantısı bulunmuyor.
            </div>
          ) : (
            links.map((link) => (
              <div
                key={link.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground truncate max-w-xs sm:max-w-md">
                      {link.title || "İsimsiz Paylaşım"}
                    </span>

                    {/* Durum Rozetleri */}
                    {link.is_active ? (
                      <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                        Aktif
                      </span>
                    ) : link.revoked_at ? (
                      <span className="rounded bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-500">
                        İptal Edildi
                      </span>
                    ) : (
                      <span className="rounded bg-zinc-500/15 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        Süresi Doldu
                      </span>
                    )}

                    {link.password_hash && (
                      <span className="rounded bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                        Şifreli
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{link.total_files} Dosya ({formatBytes(link.total_size_bytes)})</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      <span>{link.download_count}{link.max_downloads ? `/${link.max_downloads}` : ""} İndirme</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-500" />
                      <span>Bitiş: {formatDate(link.expires_at)}</span>
                    </span>
                  </div>
                </div>

                {/* Aksiyon Butonları */}
                <div className="flex items-center gap-2 shrink-0 border-t border-border/40 pt-2 sm:border-t-0 sm:pt-0">
                  {link.decrypted_token && link.is_active && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyLink(link)}
                        className="gap-1 text-xs border-amber-500/30 hover:bg-amber-500/10"
                      >
                        {copiedId === link.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        <span>{copiedId === link.id ? "Kopyalandı!" : "Linki Kopyala"}</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShowQr(link)}
                        className="p-2 border-border"
                        aria-label="QR Kod Göster"
                      >
                        <QrCode className="h-3.5 w-3.5 text-foreground" />
                      </Button>
                    </>
                  )}

                  {link.is_active && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevoke(link.id)}
                      disabled={revokingId === link.id}
                      className="gap-1 text-xs text-red-500 hover:bg-red-500/10 hover:text-red-600"
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
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 text-center shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm font-bold text-foreground truncate">
                  {qrModalData.title}
                </span>
                <button
                  onClick={() => setQrModalData(null)}
                  className="rounded p-1 text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex justify-center p-3 rounded bg-white">
                <img src={qrModalData.qrSrc} alt="QR Kod" className="h-44 w-44" />
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setQrModalData(null)}
                className="w-full text-xs"
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

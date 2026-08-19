"use client";

import { useState } from "react";
import {
  Link2,
  X,
  Loader2,
  Clock,
  KeyRound,
  Download,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DokFile, DokFolder } from "@/lib/dokumantasyon/types";
import { formatBytes } from "../ui-helpers";

interface CreateShareModalProps {
  isOpen: boolean;
  selectedItems: Array<{ id: string; type: "file" | "folder"; name?: string; size?: number }>;
  onClose: () => void;
  onSuccess: (result: {
    shareUrl: string;
    rawToken: string;
    expiresAt: string;
    totalFiles: number;
    totalSizeBytes: number;
    title?: string | null;
  }) => void;
}

export function CreateShareModal({
  isOpen,
  selectedItems,
  onClose,
  onSuccess,
}: CreateShareModalProps) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState<
    "1_DAY" | "3_DAYS" | "1_WEEK" | "1_MONTH" | "CUSTOM"
  >("1_DAY");
  const [customDate, setCustomDate] = useState("");
  const [password, setPassword] = useState("");
  const [maxDownloads, setMaxDownloads] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || selectedItems.length === 0) return null;

  const totalApproxSize = selectedItems.reduce((acc, item) => acc + (item.size || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let customExpiresAtIso: string | undefined;
      if (duration === "CUSTOM") {
        if (!customDate) {
          throw new Error("Lütfen özel bitiş tarihi seçin.");
        }
        customExpiresAtIso = new Date(customDate).toISOString();
      }

      const res = await fetch("/api/dokumantasyon/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedItems.map((i) => ({ id: i.id, type: i.type })),
          duration,
          customExpiresAt: customExpiresAtIso,
          title: title.trim() || null,
          password: password.trim() || null,
          maxDownloads: maxDownloads ? parseInt(maxDownloads, 10) : null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Paylaşım linki oluşturulamadı.");
      }

      onSuccess({
        shareUrl: data.shareUrl,
        rawToken: data.rawToken,
        expiresAt: data.shareLink.expires_at,
        totalFiles: data.totalFiles,
        totalSizeBytes: data.totalSizeBytes,
        title: data.shareLink.title,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Link oluşturulamadı.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Link2 className="h-5 w-5 text-amber-500" />
            <span>Süreli Paylaşım Linki Oluştur</span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Seçili Öğeler Özeti */}
          <div className="rounded-lg border border-border/80 bg-secondary/30 p-3 text-xs">
            <div className="flex items-center justify-between font-semibold text-foreground">
              <span>Seçilen Öğeler:</span>
              <span className="text-amber-500">
                {selectedItems.length} Öğe ({formatBytes(totalApproxSize)})
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground truncate">
              {selectedItems.map((i) => i.name).filter(Boolean).join(", ")}
            </p>
          </div>

          {/* Başlık (Opsiyonel) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Paylaşım Başlığı (Opsiyonel)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Ruhsat Projeleri - Mimar Ahmet Bey"
              className="mt-1 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Süre Seçenekleri */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>Bağlantı Geçerlilik Süresi</span>
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { id: "1_DAY", label: "1 Gün" },
                { id: "3_DAYS", label: "3 Gün" },
                { id: "1_WEEK", label: "1 Hafta" },
                { id: "1_MONTH", label: "1 Ay" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDuration(opt.id as any)}
                  className={`rounded-lg border px-3 py-2 text-center text-xs font-medium transition-colors ${
                    duration === opt.id
                      ? "border-amber-500 bg-amber-500/15 text-foreground font-bold"
                      : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Özel Tarih Seçici */}
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setDuration("CUSTOM")}
                className={`w-full rounded-lg border px-3 py-1.5 text-center text-xs font-medium transition-colors ${
                  duration === "CUSTOM"
                    ? "border-amber-500 bg-amber-500/15 text-foreground font-bold"
                    : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                Özel Tarih Belirle
              </button>

              {duration === "CUSTOM" && (
                <input
                  type="datetime-local"
                  required
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-xs text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              )}
            </div>
          </div>

          {/* Ek Güvenlik Seçenekleri (Şifre ve İndirme Sınırı) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
            <div>
              <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                <span>Ek Şifre (Opsiyonel)</span>
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Örn: 2026!Proje"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Download className="h-3.5 w-3.5 text-amber-500" />
                <span>İndirme Sınırı (Opsiyonel)</span>
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={maxDownloads}
                onChange={(e) => setMaxDownloads(e.target.value)}
                placeholder="Örn: 3 kez"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="gap-1.5 bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-400"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Oluşturuluyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Link Oluştur</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

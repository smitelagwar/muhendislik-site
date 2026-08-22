"use client";

import { useState, useEffect } from "react";
import { Edit3, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestDokMutation } from "@/lib/dokumantasyon/client-mutation";

interface RenameModalProps {
  isOpen: boolean;
  item: { id: string; name: string; type: "file" | "folder" } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function RenameModal({
  isOpen,
  item,
  onClose,
  onSuccess,
}: RenameModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setError(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const endpoint =
        item.type === "folder"
          ? `/api/dokumantasyon/folders/${item.id}`
          : `/api/dokumantasyon/files/${item.id}`;

      const body =
        item.type === "folder"
          ? { name: name.trim() }
          : { displayName: name.trim() };

      const result = await requestDokMutation(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
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
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Edit3 className="h-4 w-4" />
            </div>
            <span className="text-base">
              {item.type === "folder" ? "Klasörü Yeniden Adlandır" : "Dosyayı Yeniden Adlandır"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Yeni İsim
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input bg-background/80 px-3.5 py-2.5 text-sm text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl h-10 px-4 text-xs font-medium border-border/80"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim() || name.trim() === item.name}
              className="bg-amber-500 font-bold text-zinc-950 hover:bg-amber-400 rounded-xl h-10 px-5 text-xs shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <span>Kaydet</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

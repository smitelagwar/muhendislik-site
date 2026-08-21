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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Edit3 className="h-5 w-5 text-amber-500" />
            <span>
              {item.type === "folder" ? "Klasörü Yeniden Adlandır" : "Dosyayı Yeniden Adlandır"}
            </span>
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
              className="mt-1 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
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
              disabled={loading || !name.trim() || name.trim() === item.name}
              className="bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-400"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
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

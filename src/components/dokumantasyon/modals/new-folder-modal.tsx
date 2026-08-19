"use client";

import { useState } from "react";
import { FolderPlus, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NewFolderModalProps {
  isOpen: boolean;
  currentFolderId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewFolderModal({
  isOpen,
  currentFolderId,
  onClose,
  onSuccess,
}: NewFolderModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dokumantasyon/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          parentId: currentFolderId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Klasör oluşturulamadı.");
        setLoading(false);
        return;
      }

      setName("");
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
            <FolderPlus className="h-5 w-5 text-amber-500" />
            <span>Yeni Klasör Oluştur</span>
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
              Klasör Adı
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: 2026 Statik Projeleri"
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
              disabled={loading || !name.trim()}
              className="bg-amber-500 font-semibold text-zinc-950 hover:bg-amber-400"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Oluşturuluyor...</span>
                </>
              ) : (
                <span>Oluştur</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

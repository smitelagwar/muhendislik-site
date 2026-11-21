"use client";

import { useEffect, useState } from "react";
import { FolderPlus, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestDokMutation } from "@/lib/dokumantasyon/client-mutation";
import { DokFolder } from "@/lib/dokumantasyon/types";
import { OverlayPortal } from "../drive-v3/overlay-portal";

interface NewFolderModalProps {
  isOpen: boolean;
  currentFolderId: string | null;
  onClose: () => void;
  onSuccess: () => void;
  onStartPending?: (pendingFolder: DokFolder) => void;
  onCreatedFolder?: (tempId: string, folder: DokFolder) => void;
  onCancelPending?: (tempId: string) => void;
}

export function NewFolderModal({
  isOpen,
  currentFolderId,
  onClose,
  onSuccess,
  onStartPending,
  onCreatedFolder,
  onCancelPending,
}: NewFolderModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || loading) return;

    setLoading(true);
    setError(null);

    const tempId = `pending:${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const pendingFolder: DokFolder = {
      id: tempId,
      name: trimmedName,
      parent_id: currentFolderId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      pending: true,
    };

    onStartPending?.(pendingFolder);

    try {
      const result = await requestDokMutation<{ success: boolean; folder: DokFolder }>("/api/dokumantasyon/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          parentId: currentFolderId,
        }),
      });

      if (!result.ok) {
        onCancelPending?.(tempId);
        setError(result.message);
        return;
      }

      setName("");
      if (result.data?.folder) {
        onCreatedFolder?.(tempId, result.data.folder);
      }
      toast.success(`"${trimmedName}" klasörü oluşturuldu.`);
      onSuccess();
      onClose();
    } catch {
      onCancelPending?.(tempId);
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <OverlayPortal isOpen={isOpen} onClose={onClose} title="Yeni Klasör Oluştur">
      {/* z-[90] overlay standard */}
      <div
        data-testid="dok-dialog-content"
        className="w-full max-w-md rounded-2xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-xl z-[90]"
      >
        <div className="flex items-center border-b border-border/60 pb-3.5 pr-10">
          <div className="flex items-center gap-2.5 font-bold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <FolderPlus className="h-4 w-4" />
            </div>
            <span className="text-base">Yeni Klasör Oluştur</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
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
              disabled={loading || !name.trim()}
              className="bg-amber-500 font-bold text-zinc-950 hover:bg-amber-400 rounded-xl h-10 px-5 text-xs shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none mr-1.5" />
                  <span>Oluşturuluyor...</span>
                </>
              ) : (
                <span>Oluştur</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </OverlayPortal>
  );
}

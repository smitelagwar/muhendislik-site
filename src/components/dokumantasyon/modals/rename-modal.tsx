"use client";

import { useState, useEffect, useRef } from "react";
import { Edit3, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { requestDokMutation } from "@/lib/dokumantasyon/client-mutation";
import { OverlayPortal } from "../drive-v3/overlay-portal";

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen || !item) return;
    setName(item.name);
    setError(null);
    const frameId = requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      if (item.type === "file") {
        const dotIndex = item.name.lastIndexOf(".");
        if (dotIndex > 0) {
          input.setSelectionRange(0, dotIndex);
          return;
        }
      }
      input.select();
    });
    return () => cancelAnimationFrame(frameId);
  }, [isOpen, item]);

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

      toast.success(`"${name.trim()}" olarak yeniden adlandırıldı.`);
      onSuccess();
      onClose();
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const title = item.type === "folder" ? "Klasörü Yeniden Adlandır" : "Dosyayı Yeniden Adlandır";

  return (
    <OverlayPortal isOpen={isOpen} onClose={onClose} title={title} initialFocusRef={inputRef}>
      {/* z-[90] overlay standard */}
      <div
        data-testid="dok-dialog-content"
        className="w-full max-w-md rounded-2xl border border-border/80 bg-card/95 p-6 shadow-2xl backdrop-blur-xl z-[90]"
      >
        <div className="flex items-center border-b border-border/60 pb-3.5 pr-10">
          <div className="flex items-center gap-2.5 font-bold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Edit3 className="h-4 w-4" />
            </div>
            <span className="text-base">{title}</span>
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
              Yeni İsim
            </label>
            <input
              ref={inputRef}
              type="text"
              required
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
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none mr-1.5" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <span>Kaydet</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </OverlayPortal>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { MAX_COMMENT_LENGTH, MAX_TEXT_LENGTH } from "@/lib/dokumantasyon/cad-review/schema";
import { sanitizeReviewText } from "@/lib/dokumantasyon/cad-review/security";

export type CadReviewInputKind = "comment" | "text";

/** CAD review text editor; never writes to a source CAD entity or uses browser prompt. */
export function CadReviewInputDialog({
  kind, onSave, onCancel,
}: {
  kind: CadReviewInputKind;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const isComment = kind === "comment";
  const limit = isComment ? MAX_COMMENT_LENGTH : MAX_TEXT_LENGTH;
  const clean = sanitizeReviewText(value);
  const valid = clean.length > 0 && clean.length <= limit;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (valid) onSave(clean);
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-md rounded-2xl p-5 sm:p-6"
        data-testid="cad-review-input-dialog"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {isComment ? "Yorum pini ekle" : "Çizime metin ekle"}
          </DialogTitle>
          <DialogDescription>
            {isComment
              ? "Yorumu yalnızca inceleme katmanına kaydedin."
              : "Metin yalnızca inceleme katmanına eklenir."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" data-testid="cad-review-input-form">
          <div className="space-y-2">
            <label htmlFor="cad-review-input-text" className="text-sm font-medium">
              {isComment ? "Yorum" : "Metin"}
            </label>
            <textarea
              id="cad-review-input-text"
              data-testid="cad-review-input-text"
              autoFocus
              value={value}
              onChange={(event) => setValue(event.target.value)}
              maxLength={limit}
              rows={3}
              className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder={isComment ? "Yorumunuzu yazın…" : "Metninizi yazın…"}
            />
            <p className="text-right text-xs text-muted-foreground">{value.length}/{limit}</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} data-testid="cad-review-input-cancel">İptal</Button>
            <Button type="submit" disabled={!valid} data-testid="cad-review-input-save">Kaydet</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

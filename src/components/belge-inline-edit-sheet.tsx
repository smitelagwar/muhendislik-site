"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { createPortal, flushSync } from "react-dom";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { BelgeDocumentId, InlineFieldDescriptor } from "@/lib/belge-studio-inline-field-map";
import type { PdfFieldLayout } from "@/lib/belgeler-pdf-layout";
import { BelgeFieldGuidanceView } from "@/components/belge-field-guidance";
import { useBelgeInlineDraft } from "@/hooks/use-belge-inline-draft";
import { useVisualViewportInset } from "@/hooks/use-visual-viewport-inset";
import { BELGE_INLINE_SHEET_DISMISS_DRAG, getInlineFieldInputProps } from "@/lib/belge-inline-mobile";

export type BelgeInlineSheetNavTarget =
  | { kind: "field"; label: string }
  | { kind: "page"; pageNumber: number }
  | null;

export type BelgeInlineSheetPosition = {
  index: number;
  total: number;
  pageNumber: number;
  pageCount: number;
};

export interface BelgeInlineEditSheetProps {
  documentId?: BelgeDocumentId;
  field: InlineFieldDescriptor;
  position: BelgeInlineSheetPosition;
  prevTarget: BelgeInlineSheetNavTarget;
  nextTarget: BelgeInlineSheetNavTarget;
  currentValue: string;
  layout?: PdfFieldLayout;
  attentionToken: number;
  onCommit: (fieldKey: string, value: string) => void;
  onNavigate: (direction: -1 | 1) => void;
  onClose: () => void;
  onRequestDismiss: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onSheetTopChange: (top: number | null) => void;
}

function getNavLabel(direction: -1 | 1, target: BelgeInlineSheetNavTarget): string {
  if (!target) return direction === 1 ? "Sonraki alan yok" : "Önceki alan yok";
  if (target.kind === "page") return `${target.pageNumber}. sayfaya geç`;
  return direction === 1 ? `Sonraki alan: ${target.label}` : `Önceki alan: ${target.label}`;
}

type SheetBodyProps = Omit<BelgeInlineEditSheetProps, "onRequestDismiss" | "onSheetTopChange"> & { titleId: string };

function BelgeInlineSheetBody({
  documentId,
  field,
  position,
  prevTarget,
  nextTarget,
  currentValue,
  layout,
  attentionToken,
  titleId,
  onCommit,
  onNavigate,
  onClose,
  onDirtyChange,
}: SheetBodyProps) {
  const commitValue = useCallback((value: string) => onCommit(field.fieldKey, value), [onCommit, field.fieldKey]);
  const {
    draft,
    setDraft,
    isDirty,
    conflictError,
    copiedNotification,
    guidance,
    guidanceId,
    tryCommit,
    handleLoadCurrentValue,
    handleCopyDraft,
  } = useBelgeInlineDraft({ documentId, field, currentValue, layout, onCommit: commitValue, onCancel: onClose });
  // Bu gövde açıldığındaki uyarı sayacı; sonraki artışlar uyarıyı gösterir.
  const [baseAttention] = useState(attentionToken);
  const showAttention = attentionToken !== baseAttention;
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const inputProps = getInlineFieldInputProps(field.documentId, field.fieldKey);

  // Senkron odak: dokunma olayı içinde (flushSync) çalıştığı için iOS klavyesi açılır.
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus({ preventScroll: true });
    const length = input.value.length;
    input.setSelectionRange(length, length);
  }, []);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const commitAndClose = () => {
    if (!isDirty) {
      onClose();
      return;
    }
    if (tryCommit()) onClose();
  };

  const navigate = (direction: -1 | 1) => {
    const target = direction === 1 ? nextTarget : prevTarget;
    if (!target) return;
    if (isDirty && !tryCommit()) return;
    flushSync(() => onNavigate(direction));
  };

  // Gezinme düğmeleri odağı input'tan çalmaz; Android klavyesi kapanmaz.
  const keepInputFocus = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Enter") return;
    if (!field.multiline) {
      event.preventDefault();
      event.stopPropagation();
      if (nextTarget?.kind === "field") navigate(1);
      else commitAndClose();
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      event.stopPropagation();
      commitAndClose();
    }
  };

  const inputClass =
    "block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:border-amber-500";
  const navButtonClass =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";

  return (
    <>
      <div className="flex items-start gap-2 pb-2">
        <div className="min-w-0 flex-1">
          <p id={titleId} data-testid="belge-inline-sheet-title" className="truncate text-sm font-semibold text-foreground">
            {field.label}
          </p>
          <p data-testid="belge-inline-sheet-counter" className="text-[11px] font-medium text-muted-foreground">
            {position.index + 1} / {position.total}
            {position.pageCount > 1 ? ` · Sayfa ${position.pageNumber}` : ""}
          </p>
        </div>
        {isDirty && (
          <span className="mt-0.5 shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
            Değiştirildi
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          data-testid="belge-inline-sheet-close"
          className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {showAttention && (
        <div
          key={attentionToken}
          role="alert"
          data-testid="belge-inline-sheet-attention"
          className="belge-inline-sheet-shake mb-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-800 dark:text-amber-300"
        >
          Kaydedilmemiş değişiklik var. Önce Kaydet veya Vazgeç düğmesine dokunun.
        </div>
      )}

      {conflictError && (
        <div
          role="alert"
          data-testid="belge-inline-conflict-alert"
          className="mb-2 flex flex-col gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs"
        >
          <div className="font-medium leading-relaxed text-amber-700 dark:text-amber-400">{conflictError}</div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleLoadCurrentValue}
              data-testid="belge-inline-conflict-load-current"
              className="min-h-11 rounded-lg bg-amber-500/20 px-3 text-xs font-semibold text-amber-700 hover:bg-amber-500/30 dark:text-amber-400"
            >
              Güncel Değeri Yükle
            </button>
            <button
              type="button"
              onClick={handleCopyDraft}
              data-testid="belge-inline-conflict-copy-draft"
              className="min-h-11 rounded-lg border border-border bg-background px-3 text-xs text-foreground hover:bg-accent"
            >
              {copiedNotification ? "Kopyalandı!" : "Taslağı Kopyala"}
            </button>
          </div>
        </div>
      )}

      {field.multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          rows={3}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={field.placeholder || `${field.label} girin...`}
          data-testid="belge-inline-edit-textarea"
          aria-label={field.label}
          aria-describedby={guidance ? guidanceId : undefined}
          autoComplete={inputProps.autoComplete}
          autoCapitalize={inputProps.autoCapitalize}
          autoCorrect="off"
          spellCheck={false}
          className={`${inputClass} max-h-[30dvh] min-h-24 resize-none`}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={field.placeholder || `${field.label} girin...`}
          data-testid="belge-inline-edit-input"
          aria-label={field.label}
          aria-describedby={guidance ? guidanceId : undefined}
          inputMode={inputProps.inputMode}
          autoComplete={inputProps.autoComplete}
          autoCapitalize={inputProps.autoCapitalize}
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint={nextTarget?.kind === "field" ? "next" : "done"}
          className={`${inputClass} min-h-12`}
        />
      )}

      <BelgeFieldGuidanceView id={guidanceId} guidance={guidance} />
      <p className="mt-1 text-[11px] text-muted-foreground">Kaydettiğinizde PDF ve form birlikte güncellenir.</p>

      <div className="mt-2 flex items-center gap-2 border-t border-border/60 pt-2">
        <button
          type="button"
          onPointerDown={keepInputFocus}
          onClick={() => navigate(-1)}
          disabled={!prevTarget}
          aria-label={getNavLabel(-1, prevTarget)}
          title={getNavLabel(-1, prevTarget)}
          data-testid="belge-inline-sheet-prev"
          className={navButtonClass}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onPointerDown={keepInputFocus}
          onClick={() => navigate(1)}
          disabled={!nextTarget}
          aria-label={getNavLabel(1, nextTarget)}
          title={getNavLabel(1, nextTarget)}
          data-testid="belge-inline-sheet-next"
          className={navButtonClass}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1" />
        <button
          type="button"
          onClick={onClose}
          data-testid="belge-inline-edit-cancel"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          Vazgeç
        </button>
        <button
          type="button"
          onClick={commitAndClose}
          data-testid="belge-inline-edit-apply"
          className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg bg-amber-500 px-4 text-sm font-semibold text-zinc-950 shadow-sm hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <Check className="h-4 w-4 stroke-[2.5]" />
          <span>Kaydet</span>
        </button>
      </div>
    </>
  );
}

/**
 * Mobil PDF üzerinde düzenleme alt sayfası.
 * - document.body'ye portal edilir; non-modal'dır, PDF etkileşimli kalır.
 * - Klavye açıldığında visualViewport'a göre yukarı taşınır.
 * - Gövde alan anahtarıyla key'lenir; alan değişince taslak sıfırdan başlar, kabuk sabit kalır.
 */
export function BelgeInlineEditSheet(props: BelgeInlineEditSheetProps) {
  const { field, onSheetTopChange, onRequestDismiss, ...bodyProps } = props;
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const { keyboardInset, viewportHeight } = useVisualViewportInset(true);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{ id: number; y: number } | null>(null);
  const titleId = `belge-inline-sheet-title-${field.fieldKey}`;

  const reportTop = useCallback(() => {
    const element = sheetRef.current;
    onSheetTopChange(element ? Math.round(element.getBoundingClientRect().top) : null);
  }, [onSheetTopChange]);

  useLayoutEffect(() => {
    reportTop();
  }, [reportTop, keyboardInset, viewportHeight]);

  useEffect(() => {
    const element = sheetRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => reportTop());
    observer.observe(element);
    return () => {
      observer.disconnect();
      onSheetTopChange(null);
    };
  }, [reportTop, onSheetTopChange]);

  const handleDragStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = { id: event.pointerId, y: event.clientY };
    setDragging(true);
  };

  const handleDragMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start || start.id !== event.pointerId) return;
    setDragOffset(Math.max(0, event.clientY - start.y));
  };

  const handleDragEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start || start.id !== event.pointerId) return;
    dragStartRef.current = null;
    const distance = Math.max(0, event.clientY - start.y);
    setDragging(false);
    setDragOffset(0);
    if (event.type === "pointerup" && distance >= BELGE_INLINE_SHEET_DISMISS_DRAG) onRequestDismiss();
  };

  const style: CSSProperties = {
    transform: `translate3d(0, ${dragOffset - keyboardInset}px, 0)`,
    transition: dragging ? "none" : "transform 160ms ease-out",
    maxHeight: viewportHeight > 0 ? `${Math.max(180, viewportHeight - 64)}px` : "85dvh",
    paddingBottom: keyboardInset > 0 ? "8px" : "max(12px, env(safe-area-inset-bottom))",
    touchAction: "manipulation",
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={sheetRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      data-testid="belge-inline-edit-sheet"
      onTransitionEnd={reportTop}
      onAnimationEnd={reportTop}
      style={style}
      className="fixed inset-x-0 bottom-0 z-[100] mx-auto flex w-full max-w-[560px] flex-col rounded-t-2xl border border-b-0 border-border bg-popover text-popover-foreground shadow-[0_-12px_40px_rgba(0,0,0,0.28)] animate-in fade-in slide-in-from-bottom-4 duration-150 motion-reduce:animate-none"
    >
      <div
        data-testid="belge-inline-sheet-handle"
        aria-hidden="true"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        className="flex h-6 shrink-0 cursor-grab touch-none items-center justify-center"
      >
        <span className="h-1.5 w-10 rounded-full bg-muted-foreground/40" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3">
        <BelgeInlineSheetBody key={`${field.pageNumber}-${field.fieldKey}`} field={field} titleId={titleId} {...bodyProps} />
      </div>
    </div>,
    document.body
  );
}

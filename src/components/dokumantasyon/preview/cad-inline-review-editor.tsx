"use client";

import * as React from "react";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CadReviewItemStatus } from "@/lib/dokumantasyon/cad-review/schema";
import type { CadActiveMarkupStyle } from "@/lib/dokumantasyon/cad-review/store";
import { cn } from "@/lib/utils";
import { CadColorControl, CadFillControl } from "./cad-ribbon";
import { CAD_MARKUP_COLORS, CAD_TEXT_SIZES } from "./cad-ribbon/cad-review-tool-menus";

export type CadInlineReviewEditorKind = "text" | "callout" | "comment_pin";

export interface CadInlineReviewEditorRequest {
  id: string;
  kind: CadInlineReviewEditorKind;
  screenPoint: { x: number; y: number };
}

export type CadInlineReviewEditorResult =
  | {
      kind: "comment_pin";
      title: string;
      comment: string;
      status: CadReviewItemStatus;
    }
  | {
      kind: "text" | "callout";
      text: string;
      rotationDeg: number;
    };

const PIN_STATUSES: Array<{ value: CadReviewItemStatus; label: string; color: string }> = [
  { value: "open", label: "Açık", color: "#ef4444" },
  { value: "question", label: "İncelemede", color: "#f59e0b" },
  { value: "answered", label: "Cevaplandı", color: "#3b82f6" },
  { value: "closed", label: "Çözüldü", color: "#10b981" },
];

export function CadInlineReviewEditor({
  request,
  style,
  containerSize,
  onStyleChange,
  onSubmit,
  onCancel,
}: {
  request: CadInlineReviewEditorRequest;
  style: CadActiveMarkupStyle;
  containerSize: { width: number; height: number };
  onStyleChange: (patch: Partial<CadActiveMarkupStyle>) => void;
  onSubmit: (result: CadInlineReviewEditorResult) => void;
  onCancel: () => void;
}) {
  const [text, setText] = React.useState("");
  const [title, setTitle] = React.useState("Yorum");
  const [comment, setComment] = React.useState("");
  const [status, setStatus] = React.useState<CadReviewItemStatus>("open");
  const [rotationDeg, setRotationDeg] = React.useState(style.textRotationDeg ?? 0);

  const submit = React.useCallback(() => {
    if (request.kind === "comment_pin") {
      if (!comment.trim()) return;
      onSubmit({
        kind: "comment_pin",
        title: title.trim() || "Yorum",
        comment: comment.trim(),
        status,
      });
      return;
    }

    if (!text.trim()) return;
    onStyleChange({ textRotationDeg: rotationDeg });
    onSubmit({
      kind: request.kind,
      text: text.trim(),
      rotationDeg,
    });
  }, [comment, onStyleChange, onSubmit, request.kind, rotationDeg, status, text, title]);

  const editorWidth = request.kind === "comment_pin" ? 340 : 360;
  const editorHeight = request.kind === "comment_pin" ? 330 : 410;
  const left = Math.max(8, Math.min(request.screenPoint.x + 12, containerSize.width - editorWidth - 8));
  const top = Math.max(8, Math.min(request.screenPoint.y + 12, containerSize.height - editorHeight - 8));

  return (
    <section
      className="pointer-events-auto absolute z-[65] max-h-[calc(100%-16px)] overflow-y-auto rounded-xl border border-border/90 bg-popover/98 p-3 text-popover-foreground shadow-2xl backdrop-blur-xl"
      style={{ left, top, width: editorWidth }}
      data-testid="cad-inline-review-editor"
      data-cad-inline-editor={request.kind}
      role="dialog"
      aria-modal="false"
      aria-label={request.kind === "comment_pin" ? "Yorum oluştur" : request.kind === "callout" ? "Callout metni" : "Metin oluştur"}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onKeyDownCapture={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onCancel();
          return;
        }
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          event.stopPropagation();
          submit();
        }
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">
            {request.kind === "comment_pin" ? "Yorum Pini" : request.kind === "callout" ? "Callout" : "Metin"}
          </h3>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Esc iptal · Ctrl/Cmd+Enter kaydet</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="flex size-7 items-center justify-center rounded-md outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="İptal"
          data-testid="cad-inline-editor-cancel"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {request.kind === "comment_pin" ? (
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground">Başlık</span>
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="cad-inline-editor-title"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground">Yorum</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="min-h-24 w-full resize-y rounded-md border border-border bg-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Kontrol veya revizyon notunu yazın..."
              data-testid="cad-inline-editor-comment"
            />
          </label>
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-muted-foreground">Durum</div>
            <div className="grid grid-cols-2 gap-1">
              {PIN_STATUSES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={status === option.value}
                  aria-label={`Durum: ${option.label}`}
                  onClick={() => setStatus(option.value)}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-md border border-border px-2 text-xs outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                    status === option.value && "border-primary/45 bg-primary/10"
                  )}
                  data-testid={`cad-inline-editor-status-${option.value}`}
                >
                  <span className="size-2 rounded-full" style={{ backgroundColor: option.color }} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground">
              {request.kind === "callout" ? "Callout Metni" : "Not"}
            </span>
            <textarea
              autoFocus
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-h-20 w-full resize-y rounded-md border border-border bg-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Notunuzu yazın..."
              data-testid="cad-inline-editor-text"
            />
          </label>

          <div className="grid grid-cols-5 gap-1">
            {CAD_TEXT_SIZES.map((size) => (
              <button
                key={size.value}
                type="button"
                onClick={() => onStyleChange({ fontSize: size.value })}
                aria-pressed={(style.fontSize ?? 16) === size.value}
                className="h-8 rounded-md border border-border text-[10px] outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary/40 aria-pressed:bg-primary/10"
                data-testid={`cad-inline-editor-font-${size.value}`}
              >
                {size.value}
              </button>
            ))}
          </div>

          <CadColorControl
            label="Metin Rengi"
            colors={CAD_MARKUP_COLORS}
            value={style.color}
            onChange={(color) => onStyleChange({ color })}
            testIdPrefix="cad-inline-text-color"
          />

          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-muted-foreground">Arka Plan</div>
            <div className="grid grid-cols-3 gap-1">
              <button type="button" onClick={() => onStyleChange({ fillOpacity: 0 })} className="h-8 rounded-md border border-border text-[10px] outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring" data-testid="cad-inline-bg-transparent">Şeffaf</button>
              <button type="button" onClick={() => onStyleChange({ fillColor: "#111827", fillOpacity: Math.max(style.fillOpacity ?? 0, 0.8) })} className="h-8 rounded-md border border-border bg-zinc-900 text-[10px] text-white outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid="cad-inline-bg-dark">Koyu</button>
              <button type="button" onClick={() => onStyleChange({ fillColor: "#ffffff", fillOpacity: Math.max(style.fillOpacity ?? 0, 0.8) })} className="h-8 rounded-md border border-border bg-white text-[10px] text-black outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid="cad-inline-bg-light">Açık</button>
            </div>
            <CadFillControl label="Arka Plan Dolgusu" fillColor={style.fillColor} fillOpacity={style.fillOpacity} fallbackColor={style.color} colors={CAD_MARKUP_COLORS} onChange={onStyleChange} testIdPrefix="cad-inline-bg" />
          </div>

          {request.kind === "text" ? (
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-muted-foreground">Döndürme</div>
              <div className="grid grid-cols-4 gap-1">
                {[0, 45, 90].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => { setRotationDeg(deg); onStyleChange({ textRotationDeg: deg }); }}
                    aria-pressed={rotationDeg === deg}
                    className="h-8 rounded-md border border-border text-[10px] outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary/40 aria-pressed:bg-primary/10"
                    data-testid={`cad-inline-editor-rotation-${deg}`}
                  >
                    {deg}°
                  </button>
                ))}
                <label className="relative">
                  <span className="sr-only">Custom döndürme</span>
                  <input
                    type="number"
                    min={-360}
                    max={360}
                    step={1}
                    value={rotationDeg}
                    onChange={(event) => { const next = Number(event.target.value); if (!Number.isFinite(next)) return; setRotationDeg(next); onStyleChange({ textRotationDeg: next }); }}
                    className="h-8 w-full rounded-md border border-border bg-background px-1 text-center text-[10px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    data-testid="cad-inline-editor-rotation-custom"
                  />
                </label>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-3 flex justify-end gap-2 border-t border-border/60 pt-3">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>İptal</Button>
        <Button type="button" size="sm" onClick={submit} disabled={request.kind === "comment_pin" ? !comment.trim() : !text.trim()} data-testid="cad-inline-editor-save">
          <Check className="size-3.5" /> Kaydet
        </Button>
      </div>
    </section>
  );
}

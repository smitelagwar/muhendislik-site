"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import type { InlineFieldDescriptor } from "@/lib/belge-studio-inline-field-map";

export interface BelgeStudioInlineEditLayerProps {
  fields: readonly InlineFieldDescriptor[];
  visible?: boolean;
  values?: Record<string, string>;
  onCommit?: (fieldKey: string, value: string) => void;
  frameWidth?: number;
  frameHeight?: number;
  selectedField?: InlineFieldDescriptor | null;
  onSelectField?: (field: InlineFieldDescriptor | null) => void;
}

interface BelgeInlineDraftPopoverProps {
  field: InlineFieldDescriptor;
  initialValue: string;
  currentValue: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
  style: React.CSSProperties;
}

/**
 * Isolated draft editor popover.
 * Rendered with key={field.fieldKey} so state is freshly initialized on open
 * without triggering cascading renders or setState inside useEffect.
 */
function BelgeInlineDraftPopover({
  field,
  initialValue,
  currentValue,
  onCommit,
  onCancel,
  style,
}: BelgeInlineDraftPopoverProps) {
  const [draft, setDraft] = useState(initialValue);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const popoverRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Auto-focus input when popover mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, []);

  // Click outside detection: cancels draft without committing
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onCancel();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onCancel]);

  const handleApply = () => {
    // 1. Concurrent modification check: If canonical form changed externally while popover was open
    if (currentValue !== initialValue) {
      setConflictError("Bu alan dışarıdan güncellendi. Taslak iptal edildi.");
      setTimeout(() => {
        onCancel();
      }, 1600);
      return;
    }

    // 2. Read-only guard
    if (field.readOnly) {
      onCancel();
      return;
    }

    // 3. Atomically commit confirmed draft to canonical form
    onCommit(draft);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) {
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
      return;
    }

    if (e.key === "Enter") {
      if (field.multiline) {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleApply();
        }
      } else {
        e.preventDefault();
        handleApply();
      }
    }
  };

  return (
    <div
      ref={popoverRef}
      style={style}
      role="dialog"
      aria-label={`${field.label} alanını düzenle`}
      aria-modal="true"
      data-testid="belge-inline-edit-popover"
      className="pointer-events-auto z-30 flex flex-col gap-2 rounded-lg border border-border bg-popover/98 p-3 shadow-2xl backdrop-blur text-popover-foreground animate-in fade-in zoom-in-95 duration-100"
    >
      {/* Popover Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-1.5">
        <span className="text-xs font-semibold text-foreground truncate">
          {field.label}
        </span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Kapat"
          className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Conflict Error Message */}
      {conflictError && (
        <div
          role="alert"
          className="rounded bg-destructive/15 border border-destructive/30 px-2 py-1 text-[11px] font-medium text-destructive"
        >
          {conflictError}
        </div>
      )}

      {/* Input / Textarea Editor */}
      <div className="flex flex-col gap-1">
        {field.multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={field.placeholder || `${field.label} girin...`}
            data-testid="belge-inline-edit-textarea"
            aria-label={field.label}
            className="w-full resize-y rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:border-amber-500"
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={field.placeholder || `${field.label} girin...`}
            data-testid="belge-inline-edit-input"
            aria-label={field.label}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:border-amber-500"
          />
        )}

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            {field.multiline
              ? "Ctrl+Enter: Kaydet | Enter: Alt satır"
              : "Enter: Kaydet | Esc: Vazgeç"}
          </span>
          {draft !== initialValue && (
            <span className="text-amber-500 font-medium">Değiştirildi</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
        <button
          type="button"
          onClick={onCancel}
          data-testid="belge-inline-edit-cancel"
          className="inline-flex min-h-[36px] items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 cursor-pointer"
        >
          Vazgeç
        </button>
        <button
          type="button"
          onClick={handleApply}
          data-testid="belge-inline-edit-apply"
          className="inline-flex min-h-[36px] items-center justify-center gap-1 rounded-md bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer shadow-sm"
        >
          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Uygula</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Overlay layer positioned directly above the PDF canvas inside `.belge-preview-frame`.
 * Manages both interactive hotspots and the secure, isolated draft edit popover.
 *
 * Technical Contract:
 * - Kept strictly separate from canvas render / PDF.js lifecycle.
 * - Typing mutates ONLY local draft state; zero calls to `useBelgeStudioDocument` while typing.
 * - `onCommit` called exactly once upon explicit user confirmation (`Uygula`, single-line Enter, multi-line Ctrl+Enter).
 * - `Vazgeç` / `Escape` / click outside discards draft with ZERO formData mutations.
 * - Concurrent external changes cancel draft safely without overwriting.
 * - Supports controlled selectedField from parent (e.g. mobile short-tap detector) or internal state.
 */
export const BelgeStudioInlineEditLayer = memo(function BelgeStudioInlineEditLayer({
  fields,
  visible = true,
  values,
  onCommit,
  frameWidth = 600,
  frameHeight = 842,
  selectedField: controlledSelectedField,
  onSelectField,
}: BelgeStudioInlineEditLayerProps) {
  const [internalSelectedField, setInternalSelectedField] = useState<InlineFieldDescriptor | null>(null);
  const selectedField = controlledSelectedField !== undefined ? controlledSelectedField : internalSelectedField;
  const lastFocusedHotspotRef = useRef<HTMLElement | null>(null);

  const setSelectedField = useCallback(
    (field: InlineFieldDescriptor | null) => {
      setInternalSelectedField(field);
      onSelectField?.(field);
    },
    [onSelectField]
  );

  const handleSelectField = useCallback(
    (field: InlineFieldDescriptor) => {
      lastFocusedHotspotRef.current = document.activeElement as HTMLElement | null;
      setSelectedField(field);
    },
    [setSelectedField]
  );

  if (!visible || fields.length === 0) {
    return null;
  }

  // Calculate popover positioning to avoid viewport edge overflow on all viewports (320px - 1920px)
  let popoverStyle: React.CSSProperties = {};
  if (selectedField) {
    const vr = selectedField.viewportRect;
    const estWidth = Math.min(Math.max(260, vr.width + 24), Math.max(240, frameWidth - 16));
    const estHeight = selectedField.multiline ? 190 : 130;

    let top = vr.bottom + 6;
    if (top + estHeight > frameHeight - 12) {
      top = Math.max(8, vr.top - estHeight - 6);
    }

    let left = vr.left;
    if (left + estWidth > frameWidth - 8) {
      left = Math.max(8, frameWidth - estWidth - 8);
    }
    left = Math.max(8, left);

    popoverStyle = {
      position: "absolute",
      left: `${left}px`,
      top: `${top}px`,
      width: `${estWidth}px`,
      maxWidth: "calc(100% - 16px)",
      boxSizing: "border-box",
    };
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-[5]"
      aria-label="PDF üzerinde düzenlenebilir alanlar katmanı"
      data-testid="belge-inline-edit-layer"
    >
      {/* 1. Interactive Hotspots */}
      {fields.map((field) => {
        const isSelected = selectedField?.fieldKey === field.fieldKey;
        const { left, top, width, height } = field.viewportRect;

        return (
          <button
            key={`${field.pageNumber}-${field.fieldKey}`}
            type="button"
            data-testid={`belge-inline-hotspot-${field.fieldKey}`}
            aria-label={`${field.label} alanını düzenle`}
            tabIndex={0}
            onClick={() => handleSelectField(field)}
            style={{
              position: "absolute",
              left: `${left}px`,
              top: `${top}px`,
              width: `${width}px`,
              height: `${height}px`,
            }}
            className={`pointer-events-auto group rounded-[2px] border transition-all duration-150 text-left
              ${
                isSelected
                  ? "border-amber-500 bg-amber-500/25 ring-2 ring-amber-500/60"
                  : "border-amber-500/20 bg-amber-500/[0.03] hover:border-amber-500/80 hover:bg-amber-500/15"
              }
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:border-amber-500 focus-visible:bg-amber-500/20 cursor-pointer`}
          >
            {/* Tooltip / Label indicator on hover or focus */}
            <span
              className="pointer-events-none absolute -top-6 left-0 hidden group-hover:inline-flex group-focus-visible:inline-flex items-center gap-1 rounded bg-popover/95 px-1.5 py-0.5 text-[10px] font-medium text-popover-foreground shadow-md border border-border whitespace-nowrap z-20 backdrop-blur-sm"
              aria-hidden="true"
            >
              {field.label}
              {field.multiline && <span className="text-[9px] text-amber-500 font-mono">(Çok satırlı)</span>}
            </span>
          </button>
        );
      })}

      {/* 2. Isolated Draft Edit Popover */}
      {selectedField && (
        <BelgeInlineDraftPopover
          key={`${selectedField.pageNumber}-${selectedField.fieldKey}`}
          field={selectedField}
          initialValue={values?.[selectedField.fieldKey] ?? ""}
          currentValue={values?.[selectedField.fieldKey] ?? ""}
          onCommit={(confirmedValue) => {
            onCommit?.(selectedField.fieldKey, confirmedValue);
            setSelectedField(null);
            lastFocusedHotspotRef.current?.focus();
          }}
          onCancel={() => {
            setSelectedField(null);
            lastFocusedHotspotRef.current?.focus();
          }}
          style={popoverStyle}
        />
      )}
    </div>
  );
});

"use client";

import * as React from "react";
import { RotateCcw, Trash2 } from "lucide-react";

import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import type { CadReviewItemStatus } from "@/lib/dokumantasyon/cad-review/schema";
import type {
  CadActiveMarkupStyle,
  CadCalloutLeaderDirection,
  CadEraserRadiusPx,
} from "@/lib/dokumantasyon/cad-review/store";
import { cn } from "@/lib/utils";
import { CadColorControl } from "./cad-color-control";
import { CadFillControl } from "./cad-fill-control";
import { CadLineStyleControl } from "./cad-line-style-control";
import { CadLineWidthControl } from "./cad-line-width-control";
import { CadOpacityControl } from "./cad-opacity-control";

export const CAD_MARKUP_COLORS = [
  { name: "Kırmızı", hex: "#ef4444" },
  { name: "Turuncu", hex: "#f97316" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Sarı", hex: "#eab308" },
  { name: "Yeşil", hex: "#10b981" },
  { name: "Mavi", hex: "#3b82f6" },
  { name: "Mor", hex: "#a855f7" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Beyaz", hex: "#ffffff" },
  { name: "Siyah", hex: "#000000" },
] as const;

export const CAD_STROKE_WIDTHS = [
  { label: "1px", value: 1, desc: "İnce" },
  { label: "2px", value: 2, desc: "Standart" },
  { label: "3px", value: 3, desc: "Orta" },
  { label: "5px", value: 5, desc: "Kalın" },
  { label: "8px", value: 8, desc: "Vurgu" },
] as const;

export const CAD_LINE_STYLES = [
  { label: "Düz", value: "continuous" as const },
  { label: "Kesikli", value: "dashed" as const },
  { label: "Noktalı", value: "dotted" as const },
] as const;

export const CAD_TEXT_SIZES = [
  { label: "12px", value: 12, desc: "Küçük" },
  { label: "16px", value: 16, desc: "Standart" },
  { label: "20px", value: 20, desc: "Büyük" },
  { label: "28px", value: 28, desc: "Başlık" },
  { label: "36px", value: 36, desc: "Vurgu" },
] as const;

export const CAD_PIN_STATUSES: Array<{ label: string; value: CadReviewItemStatus; color: string }> = [
  { label: "Açık", value: "open", color: "#ef4444" },
  { label: "İncelemede", value: "question", color: "#f59e0b" },
  { label: "Cevaplandı", value: "answered", color: "#3b82f6" },
  { label: "Çözüldü", value: "closed", color: "#10b981" },
];

function SelectionBanner({ visible }: { visible?: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1.5 text-[10px] font-medium text-foreground"
      data-testid="cad-selected-style-mode"
    >
      Seçili review nesnesi düzenleniyor
    </div>
  );
}

export function CadMarkupStyleMenu({
  style,
  onChange,
  selectionMode,
  testIdPrefix = "cad-markup",
}: {
  style: CadActiveMarkupStyle;
  onChange: (patch: Partial<CadActiveMarkupStyle>) => void;
  selectionMode?: boolean;
  testIdPrefix?: string;
}) {
  return (
    <div className="w-64 space-y-3" data-cad-review-property-menu="markup">
      <SelectionBanner visible={selectionMode} />
      <CadColorControl
        colors={CAD_MARKUP_COLORS}
        value={style.color}
        onChange={(color) => onChange({ color })}
        testIdPrefix={`${testIdPrefix}-color`}
      />
      <DropdownMenuSeparator />
      <CadLineWidthControl
        value={style.strokeWidth}
        options={CAD_STROKE_WIDTHS}
        onChange={(strokeWidth) => onChange({ strokeWidth })}
        testIdPrefix={`${testIdPrefix}-width`}
      />
      <DropdownMenuSeparator />
      <CadLineStyleControl
        value={style.lineDash}
        options={CAD_LINE_STYLES}
        onChange={(lineDash) => onChange({ lineDash })}
        testIdPrefix={`${testIdPrefix}-line`}
      />
      <DropdownMenuSeparator />
      <CadOpacityControl
        value={style.opacity}
        onChange={(opacity) => onChange({ opacity })}
        testId={`${testIdPrefix}-opacity`}
      />
    </div>
  );
}

export function CadShapeStyleMenu({
  style,
  onChange,
  selectionMode,
}: {
  style: CadActiveMarkupStyle;
  onChange: (patch: Partial<CadActiveMarkupStyle>) => void;
  selectionMode?: boolean;
}) {
  return (
    <div className="space-y-3">
      <CadMarkupStyleMenu
        style={style}
        onChange={onChange}
        selectionMode={selectionMode}
        testIdPrefix="cad-shape"
      />
      <DropdownMenuSeparator />
      <CadFillControl
        fillColor={style.fillColor}
        fillOpacity={style.fillOpacity}
        fallbackColor={style.color}
        colors={CAD_MARKUP_COLORS}
        onChange={onChange}
        testIdPrefix="cad-shape-fill"
      />
    </div>
  );
}

export function CadTextStyleMenu({
  style,
  onChange,
  selectionMode,
}: {
  style: CadActiveMarkupStyle;
  onChange: (patch: Partial<CadActiveMarkupStyle>) => void;
  selectionMode?: boolean;
}) {
  const rotation = style.textRotationDeg ?? 0;
  return (
    <div className="w-64 space-y-3" data-cad-review-property-menu="text">
      <SelectionBanner visible={selectionMode} />
      <CadColorControl
        label="Metin Rengi"
        colors={CAD_MARKUP_COLORS}
        value={style.color}
        onChange={(color) => onChange({ color })}
        testIdPrefix="cad-text-color"
      />
      <DropdownMenuSeparator />
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-muted-foreground">Yazı Boyutu</div>
        <div className="grid grid-cols-5 gap-1">
          {CAD_TEXT_SIZES.map((size) => (
            <button
              key={size.value}
              type="button"
              onClick={() => onChange({ fontSize: size.value })}
              aria-pressed={(style.fontSize ?? 16) === size.value}
              className="h-8 rounded-md border border-border text-[10px] outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary/40 aria-pressed:bg-primary/10"
              data-testid={`cad-text-font-${size.value}`}
            >
              {size.value}
            </button>
          ))}
        </div>
      </div>
      <DropdownMenuSeparator />
      <CadFillControl
        label="Metin Arka Planı"
        fillColor={style.fillColor}
        fillOpacity={style.fillOpacity}
        fallbackColor="#111827"
        colors={CAD_MARKUP_COLORS}
        onChange={onChange}
        testIdPrefix="cad-text-bg"
      />
      <DropdownMenuSeparator />
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-muted-foreground">Döndürme</div>
        <div className="grid grid-cols-4 gap-1">
          {[0, 45, 90].map((deg) => (
            <button
              key={deg}
              type="button"
              onClick={() => onChange({ textRotationDeg: deg })}
              aria-pressed={rotation === deg}
              className="h-8 rounded-md border border-border text-[10px] outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary/40 aria-pressed:bg-primary/10"
              data-testid={`cad-text-rotation-${deg}`}
            >
              {deg}°
            </button>
          ))}
          <input
            type="number"
            min={-360}
            max={360}
            value={rotation}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isFinite(next)) onChange({ textRotationDeg: next });
            }}
            onKeyDown={(event) => event.stopPropagation()}
            aria-label="Custom metin döndürme"
            className="h-8 w-full rounded-md border border-border bg-background px-1 text-center text-[10px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="cad-text-rotation-custom"
          />
        </div>
      </div>
    </div>
  );
}

const LEADER_DIRECTIONS: Array<{ value: CadCalloutLeaderDirection; label: string }> = [
  { value: "free", label: "Serbest" },
  { value: "right", label: "Sağ" },
  { value: "left", label: "Sol" },
  { value: "up", label: "Yukarı" },
  { value: "down", label: "Aşağı" },
];

export function CadCalloutStyleMenu({
  style,
  onChange,
  selectionMode,
}: {
  style: CadActiveMarkupStyle;
  onChange: (patch: Partial<CadActiveMarkupStyle>) => void;
  selectionMode?: boolean;
}) {
  return (
    <div className="w-64 space-y-3" data-cad-review-property-menu="callout">
      <CadMarkupStyleMenu
        style={style}
        onChange={onChange}
        selectionMode={selectionMode}
        testIdPrefix="cad-callout"
      />
      <DropdownMenuSeparator />
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-muted-foreground">Yazı Boyutu</div>
        <div className="grid grid-cols-5 gap-1">
          {CAD_TEXT_SIZES.map((size) => (
            <button
              key={size.value}
              type="button"
              onClick={() => onChange({ fontSize: size.value })}
              aria-pressed={(style.fontSize ?? 16) === size.value}
              className="h-8 rounded-md border border-border text-[10px] outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary/40 aria-pressed:bg-primary/10"
              data-testid={`cad-callout-font-${size.value}`}
            >
              {size.value}
            </button>
          ))}
        </div>
      </div>
      <DropdownMenuSeparator />
      <CadFillControl
        label="Metin Balonu"
        fillColor={style.fillColor}
        fillOpacity={(style.fillOpacity ?? 0) > 0 ? style.fillOpacity : 0.92}
        fallbackColor={style.color}
        colors={CAD_MARKUP_COLORS}
        onChange={onChange}
        testIdPrefix="cad-callout-bg"
      />
      <DropdownMenuSeparator />
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-muted-foreground">Leader Yönü</div>
        <div className="grid grid-cols-3 gap-1">
          {LEADER_DIRECTIONS.map((direction) => (
            <button
              key={direction.value}
              type="button"
              onClick={() => onChange({ calloutLeaderDirection: direction.value })}
              aria-pressed={(style.calloutLeaderDirection ?? "free") === direction.value}
              className="h-8 rounded-md border border-border text-[10px] outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary/40 aria-pressed:bg-primary/10"
              data-testid={`cad-callout-direction-${direction.value}`}
            >
              {direction.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CadPinStyleMenu({
  style,
  onChange,
  selectionMode,
}: {
  style: CadActiveMarkupStyle;
  onChange: (patch: Partial<CadActiveMarkupStyle>) => void;
  selectionMode?: boolean;
}) {
  return (
    <div className="w-60 space-y-3" data-cad-review-property-menu="pin">
      <SelectionBanner visible={selectionMode} />
      <CadColorControl
        colors={CAD_MARKUP_COLORS}
        value={style.color}
        onChange={(color) => onChange({ color })}
        testIdPrefix="cad-pin-color"
      />
      <DropdownMenuSeparator />
      <div className="space-y-1">
        <div className="text-[11px] font-semibold text-muted-foreground">Durum göstergeleri</div>
        {CAD_PIN_STATUSES.map((status) => (
          <div
            key={status.value}
            className="flex h-7 items-center gap-2 rounded-md px-2 text-xs text-muted-foreground"
            aria-label={`${status.label} durumu`}
          >
            <span className="size-2 rounded-full" style={{ backgroundColor: status.color }} />
            {status.label}
          </div>
        ))}
      </div>
    </div>
  );
}

const ERASER_RADII: Array<{ value: CadEraserRadiusPx; label: string; dot: number }> = [
  { value: 8, label: "Küçük", dot: 8 },
  { value: 16, label: "Orta", dot: 14 },
  { value: 28, label: "Büyük", dot: 20 },
];

export function CadEraserMenu({
  radius,
  onRadiusChange,
  canUndo,
  onUndo,
  onRequestClear,
}: {
  radius: CadEraserRadiusPx;
  onRadiusChange: (radius: CadEraserRadiusPx) => void;
  canUndo?: boolean;
  onUndo?: () => void;
  onRequestClear?: () => void;
}) {
  return (
    <div className="w-60 space-y-3" data-cad-review-property-menu="eraser">
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-muted-foreground">Silgi Boyutu</div>
        {ERASER_RADII.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onRadiusChange(option.value)}
            aria-pressed={radius === option.value}
            className={cn(
              "flex h-9 w-full items-center gap-3 rounded-md border border-transparent px-2 text-xs outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
              radius === option.value && "border-primary/30 bg-primary/10"
            )}
            data-testid={`cad-eraser-radius-${option.value}`}
          >
            <span
              className="rounded-full border-2 border-current"
              style={{ width: option.dot, height: option.dot }}
              aria-hidden="true"
            />
            <span>{option.label}</span>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">{option.value}px</span>
          </button>
        ))}
      </div>
      <DropdownMenuSeparator />
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo || !onUndo}
        className="flex h-9 w-full items-center gap-2 rounded-md px-2 text-xs outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
        data-testid="cad-eraser-undo"
      >
        <RotateCcw className="size-3.5" />
        Son İşaretlemeyi Geri Al
      </button>
      <DropdownMenuItem
        onSelect={onRequestClear}
        disabled={!onRequestClear}
        className="h-9 cursor-pointer gap-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
        data-testid="cad-eraser-clear-all"
      >
        <Trash2 className="size-3.5" />
        Tüm İşaretlemeleri Temizle...
      </DropdownMenuItem>
    </div>
  );
}

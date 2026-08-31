"use client";

import * as React from "react";
import { Check, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CadColorOption {
  name: string;
  hex: string;
}

const RECENT_COLORS_KEY = "cad-review-recent-colors-v1";
const MAX_RECENT_COLORS = 5;

export function normalizeCadHexColor(value: string): string | null {
  const normalized = value.trim().toUpperCase();
  if (/^#[0-9A-F]{6}$/.test(normalized)) return normalized;
  if (/^[0-9A-F]{6}$/.test(normalized)) return `#${normalized}`;
  return null;
}

function readRecentColors(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_COLORS_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => normalizeCadHexColor(String(value)))
      .filter((value): value is string => Boolean(value))
      .slice(0, MAX_RECENT_COLORS);
  } catch {
    return [];
  }
}

function saveRecentColors(colors: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(colors.slice(0, MAX_RECENT_COLORS)));
  } catch {
    // Storage is optional UI convenience only.
  }
}

export function CadColorControl({
  value,
  onChange,
  colors,
  label = "Renk",
  testIdPrefix = "cad-color",
  showRecent = true,
  showCustom = true,
}: {
  value: string;
  onChange: (color: string) => void;
  colors: readonly CadColorOption[];
  label?: string;
  testIdPrefix?: string;
  showRecent?: boolean;
  showCustom?: boolean;
}) {
  const [recentColors, setRecentColors] = React.useState<string[]>([]);
  const [customHex, setCustomHex] = React.useState(value.toUpperCase());
  const normalizedValue = normalizeCadHexColor(value) ?? value.toUpperCase();

  React.useEffect(() => {
    setRecentColors(readRecentColors());
  }, []);

  React.useEffect(() => {
    setCustomHex(value.toUpperCase());
  }, [value]);

  const commitColor = React.useCallback(
    (next: string) => {
      const normalized = normalizeCadHexColor(next);
      if (!normalized) return false;
      setCustomHex(normalized);
      setRecentColors((current) => {
        const nextRecent = [
          normalized,
          ...current.filter((item) => item.toUpperCase() !== normalized),
        ].slice(0, MAX_RECENT_COLORS);
        saveRecentColors(nextRecent);
        return nextRecent;
      });
      onChange(normalized.toLowerCase());
      return true;
    },
    [onChange]
  );

  return (
    <fieldset className="space-y-2" data-cad-color-control="true">
      <legend className="text-[11px] font-semibold text-muted-foreground">{label}</legend>
      <div className="grid grid-cols-5 gap-1.5">
        {colors.map((color) => {
          const selected = color.hex.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={color.hex}
              type="button"
              className={cn(
                "relative flex size-8 items-center justify-center rounded-md border border-border/80 outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring",
                selected && "ring-2 ring-primary/70"
              )}
              style={{ backgroundColor: color.hex }}
              onClick={() => commitColor(color.hex)}
              aria-label={`${color.name} seç`}
              aria-pressed={selected}
              data-cad-color={color.hex}
              data-testid={`${testIdPrefix}-preset-${color.hex.slice(1).toLowerCase()}`}
            >
              {selected ? <Check className="size-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]" /> : null}
            </button>
          );
        })}
      </div>

      {showRecent && recentColors.length > 0 ? (
        <div className="space-y-1.5" data-testid={`${testIdPrefix}-recent`}>
          <div className="text-[10px] font-medium text-muted-foreground">Son kullanılanlar</div>
          <div className="flex flex-wrap gap-1.5">
            {recentColors.map((color) => (
              <button
                key={color}
                type="button"
                className="size-7 rounded-md border border-border/80 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ backgroundColor: color }}
                onClick={() => commitColor(color)}
                aria-label={`Son kullanılan ${color}`}
                data-testid={`${testIdPrefix}-recent-${color.slice(1).toLowerCase()}`}
              />
            ))}
          </div>
        </div>
      ) : null}

      {showCustom ? (
        <div className="space-y-1.5">
          <div className="text-[10px] font-medium text-muted-foreground">Custom HEX</div>
          <div className="flex items-center gap-1.5">
            <label
              className="relative size-8 shrink-0 overflow-hidden rounded-md border border-border/80"
              aria-label="Özel renk seçici"
            >
              <input
                type="color"
                value={normalizeCadHexColor(customHex) ?? normalizedValue}
                onChange={(event) => commitColor(event.target.value)}
                className="absolute -inset-2 size-12 cursor-pointer border-0 bg-transparent p-0"
                data-testid={`${testIdPrefix}-native`}
              />
            </label>
            <input
              type="text"
              value={customHex}
              onChange={(event) => setCustomHex(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitColor(customHex);
                }
              }}
              onBlur={() => {
                const normalized = normalizeCadHexColor(customHex);
                if (normalized) commitColor(normalized);
              }}
              spellCheck={false}
              inputMode="text"
              aria-label="Custom HEX renk"
              className={cn(
                "h-8 min-w-0 flex-1 rounded-md border bg-background px-2 font-mono text-xs uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring",
                normalizeCadHexColor(customHex) ? "border-border" : "border-destructive/60"
              )}
              placeholder="#EF4444"
              data-testid={`${testIdPrefix}-hex`}
            />
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-md border border-border bg-background outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => commitColor(customHex)}
              disabled={!normalizeCadHexColor(customHex)}
              aria-label="Custom HEX uygula"
              data-testid={`${testIdPrefix}-apply`}
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </fieldset>
  );
}

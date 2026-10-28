"use client";

import type { CSSProperties, HTMLAttributes, KeyboardEvent } from "react";
import { Move, X } from "lucide-react";
import type { Point } from "@/lib/hsyncad/model";
import styles from "./coordinate-box.module.css";

export type NativeCoordinateBoxProps = {
  coords: { x: string; y: string };
  onCoords: (value: { x: string; y: string }) => void;
  mode: string;
  onMode: (mode: string) => void;
  unit: "m" | "cm";
  cursor: Point;
  anchor: Point;
  elevation: number;
  onSubmit: () => void;
  xLocked: boolean;
  yLocked: boolean;
  onToggleX: () => void;
  onToggleY: () => void;
  lengthText: string;
  directionText: string;
  onLength: (value: string) => void;
  onDirection: (value: string) => void;
  onToggleLength: () => void;
  onToggleDirection: () => void;
  style?: CSSProperties;
  compactOpen: boolean;
  headerDragProps?: HTMLAttributes<HTMLDivElement>;
  onClose: () => void;
  hasLocalFrame: boolean;
};

const number = (value: number) => Number.isFinite(value) ? String(+value.toFixed(6)) : "";
const parse = (value: string) => value.trim() ? Number(value.replace(",", ".")) : NaN;

/** Controlled coordinate input: lock constraints and model coordinates live in the workbench. */
export default function NativeCoordinateBox(p: NativeCoordinateBoxProps) {
  const factor = p.unit === "cm" ? 100 : 1;
  const dx = p.cursor.x - p.anchor.x, dy = p.cursor.y - p.anchor.y;
  const length = Math.hypot(dx, dy), angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const lengthLocked = Number.isFinite(parse(p.lengthText)) && parse(p.lengthText) > 0;
  const directionLocked = Number.isFinite(parse(p.directionText));
  const cartesianPair = p.xLocked && p.yLocked;
  const polarPair = lengthLocked && directionLocked;
  const enterLock = (event: KeyboardEvent<HTMLInputElement>, locked: boolean, toggle: () => void) => {
    if (event.key !== "Enter") return;
    // Enter accepts the displayed value as a constraint; it must not accidentally
    // release an already accepted lock or place an additional model point.
    event.preventDefault(); event.stopPropagation();
    const value = parse(event.currentTarget.value);
    if (!locked && Number.isFinite(value) && (event.currentTarget.id !== "hcad-coordinate-length" || value > 0)) toggle();
  };
  return <form id="hsyncad-coordinate-form" className={`hcad-coordinate-box hcad-native-coordinates ${styles.box}`}
    aria-label="Koordinat kutusu" data-testid="hsyncad-native-coordinates"
    data-compact-open={p.compactOpen} style={{ width: 220, ...p.style }} noValidate
    onSubmit={event => { event.preventDefault(); p.onSubmit(); }}>
    <div {...p.headerDragProps} className={`hcad-coordinate-title ${styles.title} ${p.headerDragProps?.className ?? ""}`}
      title={p.headerDragProps?.title ?? "Koordinat kutusunu sürükleyin"}
      style={{ cursor: "move", touchAction: "none", ...p.headerDragProps?.style }}>
      <Move size={10} aria-hidden="true" /><strong>Koordinat Kutusu</strong>
      <button type="button" className={`hcad-coordinate-close ${styles.close}`} aria-label="Koordinat kutusunu kapat"
        title="Koordinat kutusunu kapat" onPointerDown={event => event.stopPropagation()}
        onClick={p.onClose}><X size={11} aria-hidden="true" /></button>
    </div>
    <section className={`hcad-coordinate-fields ${styles.fields}`} aria-label="Koordinat değerleri">
      <div className={`hcad-coordinate-field ${styles.field}`} data-coordinate="x" data-locked={p.xLocked}>
        <input type="checkbox" aria-label="X koordinatını kilitle" title={polarPair ? "X/Y kilidi için önce L veya A kilidini kaldırın" : "X koordinatını kilitle · Enter"} disabled={polarPair} checked={p.xLocked} onChange={p.onToggleX} />
        <label htmlFor="hcad-coordinate-x">{p.mode === "polar" ? "L" : p.mode === "relative" ? "ΔX" : p.mode === "local" ? "X′" : "X"}</label>
        <input id="hcad-coordinate-x" aria-label="X koordinatı" data-testid="coordinate-x" inputMode="decimal" autoComplete="off"
          disabled={polarPair} title="Değeri yazın, Enter ile kilitleyin; nokta için ↵ düğmesini kullanın"
          value={p.coords.x} onChange={event => { event.target.setCustomValidity(""); p.onCoords({ ...p.coords, x: event.target.value }); }}
          onKeyDown={event => enterLock(event, p.xLocked, p.onToggleX)} />
      </div>
      <div className={`hcad-coordinate-field ${styles.field}`} data-coordinate="length" data-locked={lengthLocked}>
        <input type="checkbox" aria-label="Uzunluğu kilitle" title={cartesianPair ? "L/A kilidi için önce X veya Y kilidini kaldırın" : "Uzunluğu kilitle · Enter"} disabled={cartesianPair} checked={lengthLocked} onChange={p.onToggleLength} />
        <label htmlFor="hcad-coordinate-length">L</label>
        <input id="hcad-coordinate-length" aria-label="L koordinatı" inputMode="decimal" autoComplete="off"
          disabled={cartesianPair} title={`Son noktadan uzunluk (${p.unit}); yazılan değer çizimi kilitler`}
          value={p.lengthText || number(length * factor)} onChange={event => { event.target.setCustomValidity(""); p.onLength(event.target.value); }}
          onKeyDown={event => enterLock(event, lengthLocked, p.onToggleLength)} />
      </div>
      <div className={`hcad-coordinate-field ${styles.field}`} data-coordinate="y" data-locked={p.yLocked}>
        <input type="checkbox" aria-label="Y koordinatını kilitle" title={polarPair ? "X/Y kilidi için önce L veya A kilidini kaldırın" : "Y koordinatını kilitle · Enter"} disabled={polarPair} checked={p.yLocked} onChange={p.onToggleY} />
        <label htmlFor="hcad-coordinate-y">{p.mode === "polar" ? "A" : p.mode === "relative" ? "ΔY" : p.mode === "local" ? "Y′" : "Y"}</label>
        <input id="hcad-coordinate-y" aria-label="Y koordinatı" data-testid="coordinate-y" inputMode="decimal" autoComplete="off"
          disabled={polarPair} title="Değeri yazın, Enter ile kilitleyin; nokta için ↵ düğmesini kullanın"
          value={p.coords.y} onChange={event => { event.target.setCustomValidity(""); p.onCoords({ ...p.coords, y: event.target.value }); }}
          onKeyDown={event => enterLock(event, p.yLocked, p.onToggleY)} />
      </div>
      <div className={`hcad-coordinate-field ${styles.field}`} data-coordinate="angle" data-locked={directionLocked}>
        <input type="checkbox" aria-label="Açıyı kilitle" title={cartesianPair ? "L/A kilidi için önce X veya Y kilidini kaldırın" : "Açıyı kilitle · Enter"} disabled={cartesianPair} checked={directionLocked} onChange={p.onToggleDirection} />
        <label htmlFor="hcad-coordinate-angle">A</label>
        <input id="hcad-coordinate-angle" aria-label="A koordinatı" inputMode="decimal" autoComplete="off"
          disabled={cartesianPair} title="Global X yönünden açı (°); yazılan değer çizimi kilitler"
          value={p.directionText || number(angle)} onChange={event => { event.target.setCustomValidity(""); p.onDirection(event.target.value); }}
          onKeyDown={event => enterLock(event, directionLocked, p.onToggleDirection)} />
      </div>
      <div className={`hcad-coordinate-field ${styles.field}`} data-coordinate="z">
        <span className={styles.spacer} aria-hidden="true" />
        <label htmlFor="hcad-coordinate-z">Z</label><input id="hcad-coordinate-z" aria-label="Z kotu" value={number(p.elevation * factor)} readOnly />
      </div>
      <div className={`hcad-coordinate-entry ${styles.entry}`}>
        <select aria-label="Koordinat giriş yöntemi" title="Koordinat giriş yöntemi" value={p.mode === "local" && !p.hasLocalFrame ? "xy" : p.mode} onChange={event => p.onMode(event.target.value)}>
          <option value="xy">X/Y</option><option value="local" disabled={!p.hasLocalFrame}>X′/Y′</option>
          <option value="relative">ΔX/ΔY</option><option value="polar">L/A</option>
        </select><span title="Giriş birimi">{p.unit}</span>
        <button type="submit" data-testid="coordinate-place" aria-label="Nokta ekle" title="Girilen koordinatı kullan">↵<span className="sr-only">Nokta ekle</span></button>
      </div>
    </section>
    <small className={styles.help}>Enter: kilitle · ↵: nokta ekle</small>
  </form>;
}

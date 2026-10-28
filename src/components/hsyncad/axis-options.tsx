"use client";

import { useMemo, useState } from "react";
import type { AxisElement, CadElement } from "@/lib/hsyncad/model";
import { buildAxisGrid, nextAxisName, parseAxisSpacings, type AxisDrawingOptions, type AxisGridInput } from "@/lib/hsyncad/axes";
import styles from "./axis-options.module.css";
import { AxisSettings } from "./element-settings";

type Props = {
  options: AxisDrawingOptions;
  onChange: (options: AxisDrawingOptions) => void;
  elements: CadElement[];
  floorId: string;
  materialId: string;
  selectedId?: string | null;
  onCreateGrid: (axes: AxisElement[]) => void;
  unit: "m" | "cm"; offsetDistance: number; onOffsetDistance: (distance: number) => void; onOffset: () => void;
};

const number = (value: string) => value.trim() ? Number(value.trim().replace(",", ".")) : Number.NaN;
const metre = (value: number) => value.toLocaleString("tr-TR", { maximumFractionDigits: 3 });

function GridPreview({ axes, input }: { axes: AxisElement[]; input: AxisGridInput }) {
  const width = input.xSpacings.reduce((sum, value) => sum + value, 0);
  const height = input.ySpacings.reduce((sum, value) => sum + value, 0);
  const scale = Math.min(245 / width, 115 / height);
  const x = (value: number) => 35 + (value - input.origin.x) * scale;
  const y = (value: number) => 145 - (value - input.origin.y) * scale;
  const vertical = axes.filter((axis) => axis.orientation === "vertical");
  const horizontal = axes.filter((axis) => axis.orientation === "horizontal");
  return <div className={styles.preview}>
    <svg viewBox="0 0 330 190" role="img" aria-label={`${vertical.length} düşey ve ${horizontal.length} yatay aks, ${metre(width)} × ${metre(height)} metre önizleme`} data-testid="hsyncad-axis-grid-preview">
      <title>Ölçülü aks sistemi önizlemesi</title>
      {axes.map((axis) => <g key={axis.id}>
        <line x1={x(axis.start.x)} y1={y(axis.start.y)} x2={x(axis.end.x)} y2={y(axis.end.y)} stroke="var(--hc-muted)" strokeDasharray="6 3 1 3" />
        <circle cx={axis.orientation === "vertical" ? x(axis.end.x) : x(axis.start.x) - 16} cy={axis.orientation === "vertical" ? y(axis.end.y) - 16 : y(axis.start.y)} r={10} fill="var(--hc-panel)" stroke="var(--hc-accent)" />
        <text x={axis.orientation === "vertical" ? x(axis.end.x) : x(axis.start.x) - 16} y={(axis.orientation === "vertical" ? y(axis.end.y) - 16 : y(axis.start.y)) + 3} fill="var(--hc-text)" fontSize={8} textAnchor="middle">{axis.name}</text>
      </g>)}
      <line x1={35} y1={162} x2={35 + width * scale} y2={162} stroke="var(--hc-muted)" />
      {vertical.map((axis, index) => <g key={axis.id}>
        <line x1={x(axis.start.x)} y1={156} x2={x(axis.start.x)} y2={166} stroke="var(--hc-muted)" />
        {index < input.xSpacings.length && <text x={x(axis.start.x + input.xSpacings[index] / 2)} y={177} fill="var(--hc-text)" fontSize={8} textAnchor="middle">{metre(input.xSpacings[index])} m</text>}
      </g>)}
      <line x1={47 + width * scale} y1={145} x2={47 + width * scale} y2={145 - height * scale} stroke="var(--hc-muted)" />
      {horizontal.map((axis, index) => <g key={axis.id}>
        <line x1={43 + width * scale} y1={y(axis.start.y)} x2={51 + width * scale} y2={y(axis.start.y)} stroke="var(--hc-muted)" />
        {index < input.ySpacings.length && <text x={53 + width * scale} y={y(axis.start.y + input.ySpacings[index] / 2) + 3} fill="var(--hc-text)" fontSize={8}>{metre(input.ySpacings[index])}</text>}
      </g>)}
    </svg>
    <p data-testid="hsyncad-axis-grid-summary"><b>{axes.length} aks</b> · {vertical.length} düşey / {horizontal.length} yatay · <b>{metre(width)} × {metre(height)} m</b></p>
  </div>;
}

export default function AxisOptions({ options, onChange, elements, floorId, materialId, selectedId, onCreateGrid, unit, offsetDistance, onOffsetDistance, onOffset }: Props) {
  const [xSpacings, setXSpacings] = useState("4;4");
  const [ySpacings, setYSpacings] = useState("3;5");
  const [originX, setOriginX] = useState("0");
  const [originY, setOriginY] = useState("0");
  const [actionError, setActionError] = useState<string | null>(null);
  const suggestedName = nextAxisName(elements, options.direction, floorId);
  const axes = elements.filter((element): element is AxisElement => element.type === "axis" && element.floorId === floorId);
  const parallelSource = axes.find((axis) => axis.id === selectedId) ?? axes[axes.length - 1];
  const grid = useMemo(() => {
    try {
      const input: AxisGridInput = {
        ...options, name: undefined,
        origin: { x: number(originX), y: number(originY) },
        xSpacings: parseAxisSpacings(xSpacings), ySpacings: parseAxisSpacings(ySpacings),
        extension: options.extension, labelSide: options.labelSide, floorId, materialId,
      };
      return { input, axes: buildAxisGrid(input, elements), error: null };
    } catch (error) { return { input: null, axes: [], error: error instanceof Error ? error.message : "Aks sistemi değerlerini kontrol edin." }; }
  }, [originX, originY, xSpacings, ySpacings, options, floorId, materialId, elements]);

  function createGrid() {
    if (!grid.input) return;
    try {
      const additions = buildAxisGrid(grid.input, elements);
      onCreateGrid(additions);
      setActionError(null);
    } catch (error) { setActionError(error instanceof Error ? error.message : "Aks sistemi oluşturulamadı."); }
  }

  function createParallel() {
    onOffset();
  }

  return <section className={styles.root} aria-label="Aks oluşturma seçenekleri" data-testid="hsyncad-axis-options">
    <details className="hcad-axis-advanced"><summary>Aks genel ayarları</summary><AxisSettings draft={{ ...options, id: "new-axis", type: "axis", start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, floorId, materialId, layer: "Akslar" }} onChange={next => { const keys = ["suffix", "minor", "extensionStart", "extensionEnd", "drawInside", "drawOutside", "outsideColor", "outsideLineStyle", "straighten", "color", "lineStyle"] as const; onChange({ ...options, ...Object.fromEntries(keys.map(key => [key, next[key]])) }); }} /></details>
    <div className={styles.mainRow}>
      <div className={styles.modeGroup}>
        <span className={styles.caption}>AKS YÖNÜ</span>
        <div className={styles.modes} role="group" aria-label="Aks yönü">
          {([{ direction: "horizontal", label: "Yatay", glyph: "─" }, { direction: "vertical", label: "Düşey", glyph: "│" }, { direction: "free", label: "İki nokta", glyph: "╱" }] as const).map(({ direction, label, glyph }) => <button key={direction} type="button" data-testid={`hsyncad-axis-${direction}`} aria-pressed={options.direction === direction} className={options.direction === direction ? "active" : ""} onClick={() => { onChange({ ...options, direction }); setActionError(null); }}><span aria-hidden="true">{glyph}</span>{label}</button>)}
        </div>
      </div>
      <label className={styles.field}><span>Ofset ({unit}) · sayı + Enter</span><input aria-label="Aks ofset mesafesi" data-testid="axis-offset-input" inputMode="decimal" value={Number.isFinite(offsetDistance) ? +(offsetDistance * (unit === "cm" ? 100 : 1)).toFixed(6) : ""} onChange={event => onOffsetDistance(number(event.target.value) * (unit === "cm" ? 0.01 : 1))} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); createParallel(); } }} /></label>
      <button type="button" onClick={createParallel} title="Son veya seçili akstan devam">Ofset oluştur ↵</button>
      <label className={styles.field}><span>Aks adı</span><input data-testid="hsyncad-axis-name" value={options.name} placeholder={`${suggestedName} (otomatik)`} maxLength={160} onChange={(event) => onChange({ ...options, name: event.target.value })} /><small>Sonraki: {suggestedName}</small></label>
      <label className={styles.field}><span>Ortak uç uzatma (m)</span><input data-testid="hsyncad-axis-extension" type="number" step="0.1" min="0" max="1000000" value={Number.isFinite(options.extension) ? options.extension : ""} onChange={(event) => onChange({ ...options, extension: event.target.value === "" ? Number.NaN : Number(event.target.value), extensionStart: undefined, extensionEnd: undefined })} /></label>
      <label className={styles.field}><span>Aks başlığı</span><select data-testid="hsyncad-axis-label-side" value={options.labelSide} onChange={(event) => onChange({ ...options, labelSide: event.target.value as AxisDrawingOptions["labelSide"] })}><option value="both">İki uçta</option><option value="start">Başlangıçta</option><option value="end">Bitişte</option><option value="none">Başlıksız</option></select></label>
      <p className={styles.guide}>{options.direction === "free" ? "Başlangıç ve bitiş için iki nokta seçin." : `${options.direction === "horizontal" ? "Yatay" : "Düşey"} aksı yerleştirmek için tek nokta seçin.`}<small>Boşluk: yön değiştir · Esc: iptal · Tüm ölçüler metre</small></p>
    </div>
    <div className={styles.extensions}>
      <details className={styles.gridDetails}>
        <summary data-testid="hsyncad-axis-grid-toggle">Ölçülü aks sistemi oluştur</summary>
        <div className={styles.gridLayout}>
          <div className={styles.gridFields}>
            <p className={styles.note}>Açıklıkları <b>;</b> ile ayırın. X açıklıkları düşey, Y açıklıkları yatay aksları belirler. Örnek: <b>4;4,5;3</b>.</p>
            <label className={styles.field}><span>X açıklıkları (m)</span><input data-testid="hsyncad-axis-x-spacings" value={xSpacings} onChange={(event) => setXSpacings(event.target.value)} placeholder="4;4" /></label>
            <label className={styles.field}><span>Y açıklıkları (m)</span><input data-testid="hsyncad-axis-y-spacings" value={ySpacings} onChange={(event) => setYSpacings(event.target.value)} placeholder="3;5" /></label>
            <label className={styles.field}><span>Başlangıç X (m)</span><input data-testid="hsyncad-axis-origin-x" inputMode="decimal" value={originX} onChange={(event) => setOriginX(event.target.value)} /></label>
            <label className={styles.field}><span>Başlangıç Y (m)</span><input data-testid="hsyncad-axis-origin-y" inputMode="decimal" value={originY} onChange={(event) => setOriginY(event.target.value)} /></label>
            <button type="button" className={styles.createButton} data-testid="hsyncad-axis-grid-create" disabled={!!grid.error} onClick={createGrid}>Aks sistemini oluştur</button>
            <small className={styles.note}>Aktif kata tek işlemde eklenir; bir kez Geri al ile kaldırılır.</small>
            {grid.error && <p className={styles.error} role="status" data-testid="hsyncad-axis-grid-error">{grid.error}</p>}
          </div>
          {grid.input && <GridPreview axes={grid.axes} input={grid.input} />}
        </div>
      </details>
      <details className={styles.parallelDetails}>
        <summary data-testid="hsyncad-axis-parallel-toggle">Mesafeyle paralel aks</summary>
        <div className={styles.parallelBody}>
          <p className={styles.note}>{parallelSource ? <>Referans: <b>{parallelSource.name}</b> ({parallelSource.id === selectedId ? "seçili aks" : "bu kattaki son aks"}). Pozitif mesafe yatayda +Y, düşeyde +X; serbest aksta sol yöndür.</> : "Önce aktif katta bir aks oluşturun."}</p>
          <label className={styles.field}><span>Referanstan mesafe ({unit})</span><input data-testid="hsyncad-axis-parallel-distance" inputMode="decimal" value={Number.isFinite(offsetDistance) ? +(offsetDistance * (unit === "cm" ? 100 : 1)).toFixed(6) : ""} onChange={event => onOffsetDistance(number(event.target.value) * (unit === "cm" ? 0.01 : 1))} /></label>
          <button type="button" data-testid="hsyncad-axis-parallel-create" disabled={!parallelSource || !Number.isFinite(options.extension) || options.extension < 0} onClick={createParallel}>Paralel aks oluştur</button>
        </div>
      </details>
    </div>
    {actionError && <p className={styles.error} role="alert">{actionError}</p>}
  </section>;
}

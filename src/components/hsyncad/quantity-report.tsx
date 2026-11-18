"use client";

import { useMemo, useState } from "react";
import type { CadModel } from "@/lib/hsyncad/model";
import type { JunctionResult } from "@/lib/hsyncad/junctions";
import type { AnalysisResult } from "@/lib/hsyncad/analysis";
import { ELEMENT_NAMES, quantityReport, reportCsv, downloadQuantityReportPdf, type ReportOptions, type ReportGrouping } from "@/lib/hsyncad/reports";
import { calculateFullTakeoff } from "@/lib/hsyncad/quantities";

interface QuantityReportProps {
  model: CadModel; junctions: JunctionResult; analysisResult?: AnalysisResult | null; onRunAnalysis?: () => void; onOpenUnifiedReport?: () => void;
}
const format = (value: number | null) => value === null || !Number.isFinite(value) ? "Bilinmiyor" : value.toLocaleString("tr-TR", { maximumFractionDigits: 3 });

export default function QuantityReport({ model, junctions, onOpenUnifiedReport }: QuantityReportProps) {
  const [options, setOptions] = useState<ReportOptions>({ grouping: "floor-type", floorId: "", types: ["column", "beam", "wall", "slab"] });
  const [downloadState, setDownloadState] = useState<"idle" | "busy">("idle");
  const [error, setError] = useState("");
  const rows = useMemo(() => quantityReport(model, junctions, options), [model, junctions, options]);
  const takeoff = useMemo(() => calculateFullTakeoff(model, undefined, junctions), [model, junctions]);
  async function downloadPdf() {
    setDownloadState("busy"); setError("");
    try { await downloadQuantityReportPdf(model, takeoff); }
    catch (e) { setError(e instanceof Error ? e.message : "PDF üretilemedi."); }
    finally { setDownloadState("idle"); }
  }
  function downloadCsv() {
    const url = URL.createObjectURL(new Blob([reportCsv(rows)], { type: "text/csv;charset=utf-8" }));
    try { const a = document.createElement("a"); a.href = url; a.download = "hsyncad-taslak-metraj.csv"; a.click(); }
    finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
  }
  return <div className="hcad-property-form" data-testid="quantity-report-root">
    <p role="note" data-testid="takeoff-integrity-status">Taslak metraj: beton mevcut net geometriye, kalıp brüt geometriye dayanır. Gerçek donatı kesim listesi doğrulanmadı. Bilinmeyen miktar sıfır değildir.</p>
    <dl className="hcad-fields">
      <div><dt>Net beton (m³)</dt><dd data-testid="takeoff-concrete">{format(takeoff.concreteVolumeM3.total)}</dd></div>
      <div><dt>Brüt kalıp (m²)</dt><dd>{format(takeoff.formworkAreaM2.total)}</dd></div>
      <div><dt>Beyan donatı toplamı (kg)</dt><dd data-testid="takeoff-rebar">{format(takeoff.rebarTonnage.totalKg)}</dd></div>
      <div><dt>Bilinen beyan ara toplamı (kg)</dt><dd>{format(takeoff.rebarTonnage.knownSubtotalKg)}</dd></div>
      <div><dt>Donatısı eksik eleman</dt><dd>{takeoff.rebarTonnage.missingElementIds.length}</dd></div>
    </dl>
    <p>Donatı çapı ve ince/kalın dağılımı: bilinmiyor. Beyan kütlesi bu dağılımı veya kesim boyunu sağlamaz.</p>
    <div className="hcad-settings-actions">
      <button type="button" className="hcad-btn-secondary" data-testid="download-metraj-pdf" disabled={downloadState === "busy"} onClick={downloadPdf}>{downloadState === "busy" ? "Hazırlanıyor…" : "Taslak Metraj İndir (PDF)"}</button>
      <button type="button" className="hcad-btn-secondary" onClick={downloadCsv}>CSV Metraj İndir</button>
      {onOpenUnifiedReport && <button type="button" className="hcad-btn-secondary" data-testid="open-unified-report-btn" onClick={onOpenUnifiedReport}>Statik &amp; Metraj Raporu (Tek PDF)</button>}
    </div>
    {error && <p role="alert" className="hcad-warning">{error}</p>}
    <div className="hcad-fields">
      <label className="hcad-field"><span>Metraj gruplaması</span><select value={options.grouping} onChange={e => setOptions({ ...options, grouping: e.target.value as ReportGrouping })}>
        {Object.entries({ type: "Eleman tipine göre", floor: "Kata göre", "floor-type": "Kat → eleman tipi", "type-floor": "Eleman tipi → kat", material: "Malzemeye göre", element: "Detaylı · tek tek eleman" }).map(([v, label]) => <option value={v} key={v}>{label}</option>)}
      </select></label>
      <label className="hcad-field"><span>Rapor katı</span><select value={options.floorId} onChange={e => setOptions({ ...options, floorId: e.target.value })}><option value="">Tüm katlar</option>{model.floors.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
    </div>
    <div className="hcad-settings-actions">{Object.entries(ELEMENT_NAMES).map(([type, name]) => <label className="hcad-toggle" key={type}>
      <input type="checkbox" checked={options.types.includes(type as typeof options.types[number])} onChange={e => setOptions({ ...options, types: e.target.checked ? [...options.types, type as typeof options.types[number]] : options.types.filter(t => t !== type) })} />{name}
    </label>)}</div>
    {junctions.status === "failed" && <p role="alert" className="hcad-warning">{junctions.error} Net hacimler gösterilmiyor.</p>}
    <div className="hcad-settings-table"><table data-testid="hsyncad-report"><thead><tr><th>Grup</th><th>Adet</th><th>Brüt m³</th><th>Net m³</th><th>Brüt kalıp m²</th><th>Beyan donatı kg</th></tr></thead><tbody>
      {rows.map(row => <tr key={row.id}><td>{row.key}</td><td>{row.count}</td><td>{format(row.gross)}</td><td>{format(row.net)}</td><td>{format(row.formwork)}</td><td>{format(row.rebarKg)}</td></tr>)}
    </tbody></table></div>
    <ul>{takeoff.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul>
  </div>;
}

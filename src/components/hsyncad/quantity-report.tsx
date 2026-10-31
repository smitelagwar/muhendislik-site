"use client";

import { useMemo, useState } from "react";
import type { CadModel } from "@/lib/hsyncad/model";
import type { JunctionResult } from "@/lib/hsyncad/junctions";
import type { AnalysisResult } from "@/lib/hsyncad/analysis";
import {
  ELEMENT_NAMES,
  quantityReport,
  reportCsv,
  downloadQuantityReportPdf,
  type ReportOptions,
  type ReportGrouping,
} from "@/lib/hsyncad/reports";
import { calculateFullTakeoff } from "@/lib/hsyncad/quantities";

interface QuantityReportProps {
  model: CadModel;
  junctions: JunctionResult;
  analysisResult?: AnalysisResult | null;
  onRunAnalysis?: () => void;
}

export default function QuantityReport({
  model,
  junctions,
  analysisResult,
  onRunAnalysis,
}: QuantityReportProps) {
  const [options, setOptions] = useState<ReportOptions>({
    grouping: "floor-type",
    floorId: "",
    types: ["column", "beam", "wall", "slab"],
  });

  const rows = useMemo(() => quantityReport(model, junctions, options), [model, junctions, options]);
  const takeoff = useMemo(
    () => calculateFullTakeoff(model, analysisResult?.designResult, junctions),
    [model, analysisResult, junctions]
  );

  const n = (v: number | null) => (v === null ? "—" : v.toLocaleString("tr-TR", { maximumFractionDigits: 3 }));

  function downloadCsv() {
    const url = URL.createObjectURL(new Blob([reportCsv(rows)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "hsyncad-metraj.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function handleDownloadPdf() {
    downloadQuantityReportPdf(model, takeoff);
  }

  // Active rebar diameters with non-zero or standard range
  const rebarDiameterEntries = Object.entries(takeoff.rebarTonnage.byDiameter)
    .map(([dia, kg]) => ({ dia: Number(dia), kg }))
    .sort((a, b) => a.dia - b.dia);

  return (
    <div className="hcad-property-form" data-testid="quantity-report-root">
      {/* KPI Cards Grid */}
      <div
        className="hcad-metraj-kpis"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Beton Hacmi</span>
          <strong style={{ fontSize: "14px", color: "#0f172a" }}>
            {takeoff.concreteVolumeM3.total.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} m³
          </strong>
        </div>
        <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Kalıp Alanı</span>
          <strong style={{ fontSize: "14px", color: "#0f172a" }}>
            {takeoff.formworkAreaM2.total.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} m²
          </strong>
        </div>
        <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Toplam Donatı</span>
          <strong style={{ fontSize: "14px", color: "#1e3a8a" }}>
            {takeoff.rebarTonnage.totalTons.toLocaleString("tr-TR", { maximumFractionDigits: 3 })} ton
          </strong>
        </div>
        <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>İnce Donatı (≤Ø12)</span>
          <strong style={{ fontSize: "14px", color: "#047857" }}>
            {(takeoff.rebarTonnage.thinKg / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 3 })} ton
          </strong>
        </div>
        <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Kalın Donatı (≥Ø14)</span>
          <strong style={{ fontSize: "14px", color: "#b45309" }}>
            {(takeoff.rebarTonnage.thickKg / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 3 })} ton
          </strong>
        </div>
        <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "4px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Donatı Oranı</span>
          <strong style={{ fontSize: "14px", color: "#475569" }}>
            {takeoff.summary.steelDensityKgM3.toFixed(1)} kg/m³
          </strong>
        </div>
      </div>

      {/* PDF & Action Bar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", alignItems: "center" }}>
        <button
          type="button"
          data-testid="download-metraj-pdf"
          onClick={handleDownloadPdf}
          style={{
            background: "#1e3a8a",
            color: "#ffffff",
            padding: "6px 12px",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          📄 Metraj Raporu İndir (PDF)
        </button>
        <button
          type="button"
          onClick={downloadCsv}
          style={{
            background: "#f1f5f9",
            color: "#334155",
            padding: "6px 12px",
            borderRadius: "4px",
            border: "1px solid #cbd5e1",
            cursor: "pointer",
          }}
        >
          CSV Metraj İndir
        </button>
        {!analysisResult && onRunAnalysis && (
          <button
            type="button"
            onClick={onRunAnalysis}
            style={{
              marginLeft: "auto",
              background: "#059669",
              color: "#ffffff",
              padding: "6px 10px",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            ⚡ Donatı Detay Analizini Çalıştır
          </button>
        )}
      </div>

      {/* Rebar Diameter Distribution Table */}
      <div style={{ marginBottom: "16px" }}>
        <h4 style={{ fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
          Donatı Çap Dağılımı Tablosu (Ø8 - Ø32)
        </h4>
        <div className="hcad-settings-table" style={{ maxHeight: "140px", overflowY: "auto" }}>
          <table style={{ width: "100%", fontSize: "11px" }}>
            <thead>
              <tr>
                <th>Donatı Çapı</th>
                <th>Sınıf</th>
                <th>Miktar (kg)</th>
                <th>Tonaj (ton)</th>
                <th>Oran (%)</th>
              </tr>
            </thead>
            <tbody>
              {rebarDiameterEntries.map(e => {
                const isThin = e.dia <= 12;
                const pct = takeoff.rebarTonnage.totalKg > 0 ? (e.kg / takeoff.rebarTonnage.totalKg) * 100 : 0;
                return (
                  <tr key={e.dia}>
                    <td>
                      <strong>Ø{e.dia}</strong>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "1px 4px",
                          borderRadius: "2px",
                          background: isThin ? "#ecfdf5" : "#fffbeb",
                          color: isThin ? "#065f46" : "#92400e",
                        }}
                      >
                        {isThin ? "İnce Donatı" : "Kalın Donatı"}
                      </span>
                    </td>
                    <td>{e.kg.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} kg</td>
                    <td>{(e.kg / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 3 })} ton</td>
                    <td>%{pct.toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legacy Filter Bar */}
      <div className="hcad-fields">
        <label className="hcad-field">
          <span>Metraj gruplaması</span>
          <select
            value={options.grouping}
            onChange={e => setOptions({ ...options, grouping: e.target.value as ReportGrouping })}
          >
            {Object.entries({
              type: "Eleman tipine göre",
              floor: "Kata göre",
              "floor-type": "Kat → eleman tipi",
              "type-floor": "Eleman tipi → kat",
              material: "Malzemeye göre",
              element: "Detaylı · tek tek eleman",
            }).map(([v, label]) => (
              <option value={v} key={v}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="hcad-field">
          <span>Rapor katı</span>
          <select value={options.floorId} onChange={e => setOptions({ ...options, floorId: e.target.value })}>
            <option value="">Tüm katlar</option>
            {model.floors.map(f => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="hcad-settings-actions">
        {Object.entries(ELEMENT_NAMES).map(([type, name]) => (
          <label className="hcad-toggle" key={type}>
            <input
              type="checkbox"
              checked={options.types.includes(type as typeof options.types[number])}
              onChange={e =>
                setOptions({
                  ...options,
                  types: e.target.checked
                    ? [...options.types, type as typeof options.types[number]]
                    : options.types.filter(t => t !== type),
                })
              }
            />
            {name}
          </label>
        ))}
      </div>

      {junctions.status === "failed" && (
        <p role="alert" className="hcad-warning">
          {junctions.error} Net hacimler gösterilmiyor.
        </p>
      )}

      {/* Existing Report Table */}
      <div className="hcad-settings-table">
        <table data-testid="hsyncad-report">
          <thead>
            <tr>
              <th>Grup</th>
              <th>Adet</th>
              <th>Brüt m³</th>
              <th>Net m³</th>
              <th>Kalıp m²</th>
              <th>Donatı kg *</th>
              <th>Kaplama kN</th>
              <th>Hareketli kN</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <th>{r.key}</th>
                <td>{r.count}</td>
                <td>{n(r.gross)}</td>
                <td>{n(r.net)}</td>
                <td>{n(r.formwork)}</td>
                <td>{n(r.rebarKg)}</td>
                <td>{n(r.finishKN)}</td>
                <td>{n(r.liveKN)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th>Toplam</th>
              <td>{rows.reduce((s, r) => s + r.count, 0)}</td>
              {(["gross", "net", "formwork", "rebarKg", "finishKN", "liveKN"] as const).map(k => (
                <td key={k}>
                  {n(k === "net" && junctions.status === "failed" ? null : rows.reduce((s, r) => s + (r[k] ?? 0), 0))}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {!rows.length && <p>Seçilen filtrelerde eleman yok.</p>}
      <p className="hcad-fine">
        Net hacim, bütün modelin birleşiminden sonra ilgili elemanlara atanır; filtreleme birleşim önceliğini
        değiştirmez. Kalıp brüttür. * Donatı yalnız elle girilen miktardır. Yükler plan alanına göre toplanır; analiz
        sonucu değildir.
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Eye, Activity, BarChart2, Layers, ChevronDown, ChevronUp, X } from "lucide-react";
import type { AnalysisResult } from "@/lib/hsyncad/analysis";
import styles from "./analysis-controls.module.css";

export type AnalysisViewMode = "model" | "deformed" | "diagrams" | "dcr_heatmap";
export type DiagramForceType = "M3" | "V2" | "N";

export interface AnalysisControlsBarProps {
  viewMode: AnalysisViewMode;
  onViewModeChange: (mode: AnalysisViewMode) => void;
  diagramType: DiagramForceType;
  onDiagramTypeChange: (type: DiagramForceType) => void;
  activeCombination: string;
  onCombinationChange: (combo: string) => void;
  combinations: { name: string; description: string }[];
  deformationScale: number;
  onDeformationScaleChange: (scale: number) => void;
  diagramScale: number;
  onDiagramScaleChange: (scale: number) => void;
  onClose?: () => void;
}

export function AnalysisControlsBar({
  viewMode,
  onViewModeChange,
  diagramType,
  onDiagramTypeChange,
  activeCombination,
  onCombinationChange,
  combinations,
  deformationScale,
  onDeformationScaleChange,
  diagramScale,
  onDiagramScaleChange,
  onClose,
}: AnalysisControlsBarProps) {
  return (
    <div className={styles.controlsBar} data-testid="hsyncad-analysis-controls">
      {/* Primary Mode Selector */}
      <div className={styles.modeButtonGroup}>
        <button
          type="button"
          className={`${styles.modeButton} ${viewMode === "model" ? styles.modeButtonActive : ""}`}
          onClick={() => onViewModeChange("model")}
          title="Standart Katı Model"
        >
          <Layers size={13} />
          Katı Model
        </button>
        <button
          type="button"
          className={`${styles.modeButton} ${viewMode === "deformed" ? styles.modeButtonActive : ""}`}
          onClick={() => onViewModeChange("deformed")}
          title="Ölçekli Deforme Şekil"
        >
          <Activity size={13} />
          Deformasyon
        </button>
        <button
          type="button"
          className={`${styles.modeButton} ${viewMode === "diagrams" ? styles.modeButtonActive : ""}`}
          onClick={() => onViewModeChange("diagrams")}
          title="İç Kuvvet Diyagramları"
        >
          <BarChart2 size={13} />
          Diyagramlar
        </button>
        <button
          type="button"
          className={`${styles.modeButton} ${viewMode === "dcr_heatmap" ? styles.modeButtonActive : ""}`}
          onClick={() => onViewModeChange("dcr_heatmap")}
          title="Kapasite Oranı (DCR) Isı Haritası"
        >
          <Eye size={13} />
          DCR Haritası
        </button>
      </div>

      {/* Sub-selector for diagrams */}
      {viewMode === "diagrams" && (
        <div className={styles.subGroup}>
          <button
            type="button"
            className={`${styles.diagramTypePill} ${diagramType === "M3" ? styles.diagramTypePillActive : ""}`}
            onClick={() => onDiagramTypeChange("M3")}
            title="Eğilme Momenti 3-3 (kNm)"
          >
            M₃ Moment
          </button>
          <button
            type="button"
            className={`${styles.diagramTypePill} ${diagramType === "V2" ? styles.diagramTypePillActive : ""}`}
            onClick={() => onDiagramTypeChange("V2")}
            title="Kesme Kuvveti 2-2 (kN)"
          >
            V₂ Kesme
          </button>
          <button
            type="button"
            className={`${styles.diagramTypePill} ${diagramType === "N" ? styles.diagramTypePillActive : ""}`}
            onClick={() => onDiagramTypeChange("N")}
            title="Eksenel Kuvvet (kN)"
          >
            N Eksenel
          </button>
        </div>
      )}

      {/* Combination dropdown */}
      {(viewMode === "deformed" || viewMode === "diagrams") && (
        <div className={styles.subGroup}>
          <select
            className={styles.comboSelect}
            value={activeCombination}
            onChange={(e) => onCombinationChange(e.target.value)}
            title="Yükleme Kombinasyonu"
          >
            <option value="Zarf">Zarf (Envelope / En Gayri Müsait)</option>
            {combinations.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.description})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scale controls */}
      {viewMode === "deformed" && (
        <div className={styles.scaleControls}>
          <span>Büyütme:</span>
          <button
            type="button"
            className={styles.scaleButton}
            onClick={() => onDeformationScaleChange(Math.max(10, Math.round(deformationScale / 1.5)))}
            title="Deformasyon ölçeğini küçült"
          >
            -
          </button>
          <span className={styles.scaleValue}>{deformationScale}×</span>
          <button
            type="button"
            className={styles.scaleButton}
            onClick={() => onDeformationScaleChange(Math.min(2000, Math.round(deformationScale * 1.5)))}
            title="Deformasyon ölçeğini büyüt"
          >
            +
          </button>
        </div>
      )}

      {viewMode === "diagrams" && (
        <div className={styles.scaleControls}>
          <span>Ölçek:</span>
          <button
            type="button"
            className={styles.scaleButton}
            onClick={() => onDiagramScaleChange(Math.max(0.2, Number((diagramScale - 0.2).toFixed(1))))}
            title="Diyagram yüksekliğini küçült"
          >
            -
          </button>
          <span className={styles.scaleValue}>{diagramScale.toFixed(1)}×</span>
          <button
            type="button"
            className={styles.scaleButton}
            onClick={() => onDiagramScaleChange(Math.min(5.0, Number((diagramScale + 0.2).toFixed(1))))}
            title="Diyagram yüksekliğini büyüt"
          >
            +
          </button>
        </div>
      )}

      {onClose && (
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          title="Analiz görünümünü kapat"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export interface AnalysisHudProps {
  result: AnalysisResult;
  activeCombination: string;
  viewMode: AnalysisViewMode;
}

export function AnalysisHud({ result, activeCombination, viewMode }: AnalysisHudProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (viewMode === "model") return null;

  const tx = result.naturalPeriods?.[0] ?? 0.428;
  const ty = result.naturalPeriods?.[1] ?? 0.364;
  const driftPercent = (result.maxDriftRatio * 100).toFixed(3);
  const driftLimit = 0.800; // %0.80 TBDY 2018
  const driftPass = (result.maxDriftRatio * 100) <= driftLimit;

  return (
    <div className={styles.hudCard} data-testid="hsyncad-analysis-hud">
      <div className={styles.hudHeader}>
        <div className={styles.hudTitle}>
          <Activity size={13} color="#38bdf8" />
          <span>Statik / Dinamik Özet</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className={result.overallPass ? styles.hudBadgeOk : styles.hudBadgeWarn}>
            {result.overallPass ? "UYGUN" : "YETERSİZ"}
          </span>
          <button
            type="button"
            style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Genişlet" : "Daralt"}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className={styles.hudRow}>
            <span className={styles.hudLabel}>Kombinasyon:</span>
            <span className={styles.hudValue}>{activeCombination}</span>
          </div>
          <div className={styles.hudRow}>
            <span className={styles.hudLabel}>Hakim Periyotlar:</span>
            <span className={styles.hudValue}>T₁={tx.toFixed(2)}s · T₂={ty.toFixed(2)}s</span>
          </div>
          <div className={styles.hudRow}>
            <span className={styles.hudLabel}>Maks. Kat Ötelemesi:</span>
            <span className={styles.hudValue} style={{ color: driftPass ? "#4ade80" : "#f87171" }}>
              %{driftPercent} / %{driftLimit.toFixed(2)}
            </span>
          </div>
          <div className={styles.hudRow}>
            <span className={styles.hudLabel}>Taban Kesmesi (Vtx):</span>
            <span className={styles.hudValue}>
              {Math.round(result.baseShears?.Vtx ?? result.baseShearKn ?? 0)} kN
            </span>
          </div>
          <div className={styles.hudRow}>
            <span className={styles.hudLabel}>Toplam Ağırlık (W):</span>
            <span className={styles.hudValue}>{Math.round(result.totalWeightKn ?? 0)} kN</span>
          </div>
          <div className={styles.hudRow}>
            <span className={styles.hudLabel}>Maks. Kapasite (DCR):</span>
            <span
              className={styles.hudValue}
              style={{
                color: (result.maxCapacityRatio ?? 0) > 1.0 ? "#ef4444" : (result.maxCapacityRatio ?? 0) > 0.70 ? "#f59e0b" : "#22c55e",
              }}
            >
              %{((result.maxCapacityRatio ?? 0) * 100).toFixed(0)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export interface AnalysisLegendProps {
  viewMode: AnalysisViewMode;
  diagramType: DiagramForceType;
  deformationScale: number;
  result: AnalysisResult;
}

export function AnalysisLegend({ viewMode, diagramType, deformationScale, result }: AnalysisLegendProps) {
  if (viewMode === "model") return null;

  // Count capacity ratios
  let safeCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (const member of Object.values(result.members ?? {})) {
    const dcr = member.capacityRatio ?? 0;
    if (dcr > 1.0) failCount++;
    else if (dcr > 0.70) warnCount++;
    else safeCount++;
  }

  return (
    <div className={styles.legendCard} data-testid="hsyncad-analysis-legend">
      {viewMode === "dcr_heatmap" && (
        <>
          <div style={{ fontWeight: 600, color: "#f8fafc" }}>Betonarme Kapasite Oranları (DCR)</div>
          <div className={styles.dcrGradientBar} />
          <div className={styles.dcrLabels}>
            <span>0.00 (Güvenli)</span>
            <span>0.70</span>
            <span>1.00 (Sınır)</span>
            <span>1.20+ (Yetersiz)</span>
          </div>
          <div className={styles.legendCounts}>
            <span className={styles.safeCount}>● {safeCount} Güvenli (≤ 0.70)</span>
            <span className={styles.warningCount}>● {warnCount} Sınırda (0.70-1.00)</span>
            {failCount > 0 && <span className={styles.criticalCount}>● {failCount} Yetersiz (&gt; 1.00)</span>}
          </div>
        </>
      )}

      {viewMode === "deformed" && (
        <>
          <div style={{ fontWeight: 600, color: "#f8fafc" }}>Deforme Şekil (3B / 2B)</div>
          <div style={{ marginTop: 4, color: "#94a3b8", fontSize: 10 }}>
            Büyütme Çarpanı: <strong style={{ color: "#38bdf8" }}>{deformationScale}×</strong>
          </div>
          <div style={{ color: "#94a3b8", fontSize: 10 }}>
            Maks. Kat Ötelemesi: <strong style={{ color: "#f8fafc" }}>{(result.maxDriftRatio * 100).toFixed(3)}%</strong>
          </div>
          <div style={{ marginTop: 4, display: "flex", gap: 10, fontSize: 10 }}>
            <span style={{ color: "#64748b" }}>■ Orijinal Geometri</span>
            <span style={{ color: "#38bdf8" }}>■ Deforme Tel Çerçeve</span>
          </div>
        </>
      )}

      {viewMode === "diagrams" && (
        <>
          <div style={{ fontWeight: 600, color: "#f8fafc" }}>
            {diagramType === "M3" ? "Eğilme Momenti M₃ (kNm)" : diagramType === "V2" ? "Kesme Kuvveti V₂ (kN)" : "Eksenel Kuvvet N (kN)"}
          </div>
          <div style={{ marginTop: 4, color: "#94a3b8", fontSize: 10 }}>
            {diagramType === "M3"
              ? "TS 500 / TBDY 2018 Çekme Yüzü Kuralı (Pozitif moment alt lifte, negatif moment mesnette üst lifte çizilir)"
              : diagramType === "V2"
              ? "Kesme kuvveti diyagramı ordinatları ve uç mesnet kesme değerleri"
              : "Eksenel kuvvet diyagramı (+ Çekme, - Basınç)"}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type { CadModel, AxisElement, ColumnElement, WallElement, BeamElement, SlabElement } from "../../lib/hsyncad/model";
import { elementFootprint } from "../../lib/hsyncad/geometry";
import {
  generateProjectPaftas,
  type SheetFormat,
  type ProjectMetadata,
  DEFAULT_PROJECT_METADATA,
} from "../../lib/hsyncad/pafta-engine";
import { exportPaftaToDxf } from "../../lib/hsyncad/pafta-dxf";
import styles from "./pafta-viewer.module.css";
import {
  Download,
  Printer,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Edit3,
  Layers,
  X,
  Check,
} from "lucide-react";

interface PaftaViewerProps {
  model: CadModel;
  onClose?: () => void;
}

export default function PaftaViewer({ model, onClose }: PaftaViewerProps) {
  const [selectedFormat, setSelectedFormat] = useState<SheetFormat>("Roll-90x210");
  const [metadata, setMetadata] = useState<ProjectMetadata>(() => ({ ...DEFAULT_PROJECT_METADATA, projectName: model.name }));
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [editMetaOpen, setEditMetaOpen] = useState(false);

  // Pan and Zoom states
  const [zoom, setZoom] = useState(0.65);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate multi-sheet pafta suite
  const sheets = useMemo(() => {
    return generateProjectPaftas(model, selectedFormat, metadata);
  }, [model, selectedFormat, metadata]);

  const activeSheet = sheets[activeSheetIndex] || sheets[0];
  const { widthMm: W, heightMm: H, marginLeftMm: ml, marginRightMm: mr, marginTopMm: mt, marginBottomMm: mb } = activeSheet.dimensions;

  // Fit to screen on initial mount or format change
  const fitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth - 80;
    const ch = containerRef.current.clientHeight - 80;
    if (cw <= 0 || ch <= 0) return;
    const scale = Math.min(cw / W, ch / H, 1.2);
    setZoom(scale);
    setPan({ x: 0, y: 0 });
  }, [W, H]);

  useEffect(() => {
    fitToScreen();
  }, [fitToScreen]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom(z => Math.max(0.15, Math.min(3.5, z * factor)));
  };

  // Download active pafta as AutoCAD ASCII DXF
  const handleDownloadDxf = () => {
    const dxfContent = exportPaftaToDxf(activeSheet, model);
    const blob = new Blob([dxfContent], { type: "application/dxf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeSheet.sheetNo}_${activeSheet.title.replace(/\s+/g, "_")}.dxf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print sheet (browser print standard)
  const handlePrint = () => {
    window.print();
  };

  // ----------------------------------------------------
  // Coordinate calculations for Plan Viewport
  // ----------------------------------------------------
  const innerX = ml;
  const innerY = mb;
  const innerW = W - ml - mr;
  const innerH = H - mt - mb;

  const antetW = 380;
  const antetH = 220;
  const antetX = W - mr - antetW;
  const antetY = mb;

  const pCardW = 380;
  const pCardH = 110;
  const pCardX = antetX;
  const pCardY = antetY + antetH + 10;

  const notesW = 380;
  const notesH = 190;
  const notesX = antetX;
  const notesY = pCardY + pCardH + 10;

  const vpX = innerX + 15;
  const vpY = mb + 15;
  const vpW = W > 1800 ? 1100 : (activeSheet.type === "rebar_schedule" ? 750 : 720);
  const vpH = H - mt - mb - 30;

  // Model bounding box calculation
  const { minMx, maxMx, minMy, maxMy } = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const el of model.elements) {
      if (el.type === "axis") {
        const ax = el as AxisElement;
        minX = Math.min(minX, ax.start.x, ax.end.x);
        maxX = Math.max(maxX, ax.start.x, ax.end.x);
        minY = Math.min(minY, ax.start.y, ax.end.y);
        maxY = Math.max(maxY, ax.start.y, ax.end.y);
      } else if (el.type === "column") {
        const c = el as ColumnElement;
        minX = Math.min(minX, c.position.x);
        maxX = Math.max(maxX, c.position.x);
        minY = Math.min(minY, c.position.y);
        maxY = Math.max(maxY, c.position.y);
      }
    }
    if (minX === Infinity) return { minMx: 0, maxMx: 48, minMy: 0, maxMy: 32 };
    return { minMx: minX, maxMx: maxX, minMy: minY, maxMy: maxY };
  }, [model.elements]);

  const modelW = Math.max(10, maxMx - minMx);
  const modelH = Math.max(10, maxMy - minMy);
  const availW = vpW - 80;
  const availH = vpH - 90;
  const planScale = Math.min(20, availW / modelW, availH / modelH);

  // SVG coordinate system: Y goes DOWN, CAD goes UP
  // We flip Y inside SVG: svgY = (H - cadY)
  const toSvgY = (cadY: number) => H - cadY;

  const toPaperX = (mx: number) => vpX + 40 + (availW - modelW * planScale) / 2 + (mx - minMx) * planScale;
  const toPaperY = (my: number) => vpY + 40 + (availH - modelH * planScale) / 2 + (my - minMy) * planScale;

  return (
    <div className={styles.paftaContainer} data-testid="hsyncad-pafta-viewer">
      {/* Top Pafta Navigation Toolbar */}
      <div className={styles.paftaToolbar}>
        <div className={styles.toolbarGroup}>
          <Layers size={18} color="#3b82f6" />
          <span className={styles.toolbarLabel}>Pafta Seçimi:</span>
          <select
            className={styles.selectInput}
            value={activeSheetIndex}
            onChange={e => setActiveSheetIndex(Number(e.target.value))}
            data-testid="pafta-sheet-select"
          >
            {sheets.map((s, idx) => (
              <option key={s.id} value={idx}>
                {s.sheetNo}: {s.title} ({s.scaleText})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.toolbarGroup}>
          <span className={styles.toolbarLabel}>Kağıt Formatı:</span>
          <select
            className={styles.selectInput}
            value={selectedFormat}
            onChange={e => setSelectedFormat(e.target.value as SheetFormat)}
            data-testid="pafta-format-select"
          >
            <option value="Roll-90x210">Rulo (90x210 cm) - Süheyla Kara Standardı</option>
            <option value="Roll-90x150">Rulo (90x150 cm) - Standart Belediye Paftası</option>
            <option value="A0">A0 (84.1 x 118.9 cm)</option>
            <option value="A1">A1 (59.4 x 84.1 cm)</option>
            <option value="A2">A2 (42.0 x 59.4 cm)</option>
          </select>
        </div>

        <div className={styles.toolbarGroup}>
          <button
            type="button"
            className={styles.toolButton}
            onClick={() => setEditMetaOpen(true)}
            title="Antet ve Proje Bilgilerini Düzenle"
            data-testid="pafta-edit-antet"
          >
            <Edit3 size={14} />
            Antet Bilgileri
          </button>

          <button
            type="button"
            className={`${styles.toolButton} ${styles.toolButtonPrimary}`}
            onClick={handleDownloadDxf}
            title="AutoCAD ve ideCAD ile uyumlu DXF dosyası indir"
            data-testid="pafta-download-dxf"
          >
            <Download size={14} />
            AutoCAD DXF İndir
          </button>

          <button
            type="button"
            className={styles.toolButton}
            onClick={handlePrint}
            title="Paftayı Yazdır veya PDF olarak kaydet"
            data-testid="pafta-print"
          >
            <Printer size={14} />
            Yazdır / PDF
          </button>

          {onClose && (
            <button
              type="button"
              className={styles.toolButton}
              onClick={onClose}
              title="Pafta Modundan Çık"
              data-testid="pafta-close"
            >
              <X size={14} />
              Kapat
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        className={styles.canvasWrapper}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <div
          className={styles.sheetCanvas}
          style={{
            width: `${W}mm`,
            height: `${H}mm`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${W} ${H}`}
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: "block" }}
          >
            {/* Paper Background */}
            <rect width={W} height={H} fill="#ffffff" />

            {/* A. Outer Border & Inner Margins (Double Frame) */}
            <rect x={0} y={0} width={W} height={H} fill="none" stroke="#1e293b" strokeWidth={1} />
            <rect
              x={innerX}
              y={H - innerY - innerH}
              width={innerW}
              height={innerH}
              fill="none"
              stroke="#2563eb"
              strokeWidth={1.4}
            />
            <rect
              x={innerX + 1.5}
              y={H - innerY - innerH + 1.5}
              width={innerW - 3}
              height={innerH - 3}
              fill="none"
              stroke="#2563eb"
              strokeWidth={0.5}
            />

            {/* Folding Marks */}
            {Array.from({ length: Math.floor((W - ml) / 210) }).map((_, i) => {
              const fx = W - 210 * (i + 1);
              if (fx <= ml) return null;
              return (
                <g key={`fold-${i}`} stroke="#64748b" strokeWidth={0.6}>
                  <line x1={fx} y1={0} x2={fx} y2={6} />
                  <line x1={fx} y1={H - 6} x2={fx} y2={H} />
                </g>
              );
            })}

            {/* B. MUNICIPAL & ENGINEERING TITLE BLOCK (ANTET) */}
            <g transform={`translate(${antetX}, ${H - antetY - antetH})`}>
              <rect width={antetW} height={antetH} fill="#f8fafc" stroke="#1e293b" strokeWidth={1.2} />
              
              {/* Header */}
              <line x1={0} y1={25} x2={antetW} y2={25} stroke="#1e293b" strokeWidth={1} />
              <text x={15} y={12} fill="#1e293b" fontSize={3.8} fontWeight="bold">
                T.C. İSTANBUL VALİLİĞİ / ÇEVRE ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ İL MÜDÜRLÜĞÜ
              </text>
              <text x={45} y={20} fill="#2563eb" fontSize={5.2} fontWeight="bold">
                STATİK BETONARME UYGULAMA VE DEPREM GÜVENLİK PROJESİ
              </text>

              {/* Horizontal Lines */}
              <line x1={0} y1={75} x2={antetW} y2={75} stroke="#1e293b" strokeWidth={0.8} />
              <line x1={0} y1={115} x2={antetW} y2={115} stroke="#1e293b" strokeWidth={0.8} />
              <line x1={0} y1={155} x2={antetW} y2={155} stroke="#1e293b" strokeWidth={0.8} />
              <line x1={0} y1={185} x2={antetW} y2={185} stroke="#1e293b" strokeWidth={0.8} />

              {/* Vertical Lines */}
              <line x1={190} y1={75} x2={190} y2={185} stroke="#1e293b" strokeWidth={0.8} />
              <line x1={95} y1={185} x2={95} y2={antetH} stroke="#1e293b" strokeWidth={0.8} />
              <line x1={190} y1={185} x2={190} y2={antetH} stroke="#1e293b" strokeWidth={0.8} />
              <line x1={285} y1={185} x2={285} y2={antetH} stroke="#1e293b" strokeWidth={0.8} />

              {/* Project Title Block */}
              <text x={8} y={38} fill="#64748b" fontSize={3.2} fontWeight="600">PROJE ADI:</text>
              <text x={8} y={50} fill="#0f172a" fontSize={5.8} fontWeight="bold">{activeSheet.metadata.projectName}</text>
              <text x={8} y={67} fill="#475569" fontSize={3.4}>
                YAPI TİPİ: {activeSheet.metadata.buildingType}  |  KAT: {activeSheet.metadata.totalFloors}  |  ALAN: {activeSheet.metadata.totalAreaM2} m²
              </text>

              {/* Owner Block */}
              <text x={8} y={85} fill="#64748b" fontSize={3.2} fontWeight="600">YAPI SAHİBİ:</text>
              <text x={8} y={96} fill="#0f172a" fontSize={4.8} fontWeight="bold">{activeSheet.metadata.owner}</text>
              <text x={8} y={106} fill="#475569" fontSize={3.3}>İL/İLÇE: {activeSheet.metadata.city} / {activeSheet.metadata.district}</text>
              <text x={8} y={112} fill="#475569" fontSize={3.3}>ADA/PARSEL: {activeSheet.metadata.block} / {activeSheet.metadata.parcel} ({activeSheet.metadata.neighborhood} Mah.)</text>

              {/* Engineer Block */}
              <text x={198} y={85} fill="#64748b" fontSize={3.2} fontWeight="600">PROJE MÜELLİFİ (İNŞAAT MÜH.):</text>
              <text x={198} y={96} fill="#0f172a" fontSize={4.8} fontWeight="bold">{activeSheet.metadata.engineerName}</text>
              <text x={198} y={106} fill="#475569" fontSize={3.3}>{activeSheet.metadata.engineerChamberNo}</text>
              <text x={198} y={112} fill="#475569" fontSize={3.3}>{activeSheet.metadata.engineerLicence}</text>

              {/* Inspection & Design Team */}
              <text x={8} y={125} fill="#64748b" fontSize={3.2} fontWeight="600">YAPI DENETİM KURULUŞU:</text>
              <text x={8} y={135} fill="#0f172a" fontSize={4.2} fontWeight="bold">{activeSheet.metadata.inspectorCompany}</text>
              <text x={8} y={145} fill="#475569" fontSize={3.2}>DENETİM İZİN BELGE NO: {activeSheet.metadata.inspectorNo}</text>

              <text x={198} y={125} fill="#475569" fontSize={3.4}>ÇİZEN: <tspan fontWeight="bold">{activeSheet.metadata.drawer}</tspan></text>
              <text x={198} y={135} fill="#475569" fontSize={3.4}>KONTROL: <tspan fontWeight="bold">{activeSheet.metadata.checker}</tspan></text>
              <text x={198} y={145} fill="#475569" fontSize={3.4}>DANIŞMAN: <tspan fontWeight="bold">{activeSheet.metadata.consultant}</tspan></text>

              {/* Sheet Title */}
              <text x={8} y={165} fill="#64748b" fontSize={3.2} fontWeight="600">PAFTA ADI:</text>
              <text x={8} y={177} fill="#2563eb" fontSize={5.2} fontWeight="bold">{activeSheet.title}</text>

              {/* Bottom Footer Cells */}
              <text x={8} y={194} fill="#64748b" fontSize={3.0}>TARİH</text>
              <text x={8} y={208} fill="#0f172a" fontSize={4.2} fontWeight="bold">{activeSheet.metadata.date}</text>

              <text x={103} y={194} fill="#64748b" fontSize={3.0}>ÖLÇEK</text>
              <text x={103} y={208} fill="#0f172a" fontSize={4.2} fontWeight="bold">{activeSheet.scaleText}</text>

              <text x={198} y={194} fill="#64748b" fontSize={3.0}>REVİZYON</text>
              <text x={198} y={208} fill="#0f172a" fontSize={4.8} fontWeight="bold">{activeSheet.metadata.revision}</text>

              <text x={293} y={194} fill="#64748b" fontSize={3.2}>PAFTA NO</text>
              <text x={293} y={212} fill="#dc2626" fontSize={8.5} fontWeight="bold">{activeSheet.sheetNo}</text>
            </g>

            {/* C. TBDY 2018 EARTHQUAKE & SOIL PARAMETERS CARD */}
            <g transform={`translate(${pCardX}, ${H - pCardY - pCardH})`}>
              <rect width={pCardW} height={pCardH} fill="#f1f5f9" stroke="#1e293b" strokeWidth={1} />
              <line x1={0} y1={18} x2={pCardW} y2={18} stroke="#1e293b" strokeWidth={0.8} />
              <text x={12} y={12} fill="#0f172a" fontSize={4.2} fontWeight="bold">
                DEPREM VE ZEMİN HESAP PARAMETRELERİ (TBDY 2018 / TS 500)
              </text>
              <line x1={190} y1={18} x2={190} y2={pCardH} stroke="#cbd5e1" strokeWidth={0.8} />

              {/* Left Column */}
              <text x={10} y={32} fill="#1e293b" fontSize={3.4}>Yerel Zemin Sınıfı: <tspan fontWeight="bold">{activeSheet.analysisParams.soilClass}</tspan></text>
              <text x={10} y={45} fill="#1e293b" fontSize={3.4}>Deprem Tasarım Sınıfı: <tspan fontWeight="bold">DTS = {activeSheet.analysisParams.dts}</tspan></text>
              <text x={10} y={58} fill="#1e293b" fontSize={3.4}>Bina Kullanım / Önem: <tspan fontWeight="bold">BKS = {activeSheet.analysisParams.bks}, I = {activeSheet.analysisParams.I}</tspan></text>
              <text x={10} y={71} fill="#1e293b" fontSize={3.4}>Taşıyıcı Davranış Katsayısı: <tspan fontWeight="bold">R = {activeSheet.analysisParams.R}</tspan></text>
              <text x={10} y={84} fill="#1e293b" fontSize={3.4}>Dayanım Fazlalığı Katsayısı: <tspan fontWeight="bold">D = {activeSheet.analysisParams.D}</tspan></text>
              <text x={10} y={97} fill="#1e293b" fontSize={3.4}>Spektral İvme Katsayıları: <tspan fontWeight="bold">Ss={activeSheet.analysisParams.Ss}, S1={activeSheet.analysisParams.S1}</tspan></text>

              {/* Right Column */}
              <text x={200} y={32} fill="#1e293b" fontSize={3.4}>Tasarım Spektral İvmesi: <tspan fontWeight="bold">SDS={activeSheet.analysisParams.Sds.toFixed(3)}, SD1={activeSheet.analysisParams.Sd1.toFixed(3)}</tspan></text>
              <text x={200} y={45} fill="#1e293b" fontSize={3.4}>Periyotlar: <tspan fontWeight="bold">TA={activeSheet.analysisParams.Ta.toFixed(2)}s, TB={activeSheet.analysisParams.Tb.toFixed(2)}s</tspan></text>
              <text x={200} y={58} fill="#1e293b" fontSize={3.4}>Beton Sınıfı: <tspan fontWeight="bold">{activeSheet.metadata.concreteGrade} (fck = 35 MPa)</tspan></text>
              <text x={200} y={71} fill="#1e293b" fontSize={3.4}>Donatı Çeliği: <tspan fontWeight="bold">{activeSheet.metadata.steelGrade} (fyk = 420 MPa)</tspan></text>
              <text x={200} y={84} fill="#1e293b" fontSize={3.4}>Zemin Emniyet Gerilmesi: <tspan fontWeight="bold">q_em = 320 kN/m²</tspan></text>
              <text x={200} y={97} fill="#1e293b" fontSize={3.4}>Zemin Yatak Katsayısı: <tspan fontWeight="bold">ks = 40.000 kN/m³</tspan></text>
            </g>

            {/* D. CONCRETE COVERS & GENERAL STRUCTURAL NOTES */}
            <g transform={`translate(${notesX}, ${H - notesY - notesH})`}>
              <rect width={notesW} height={notesH} fill="#ffffff" stroke="#1e293b" strokeWidth={1} />
              <line x1={0} y1={18} x2={notesW} y2={18} stroke="#1e293b" strokeWidth={0.8} />
              <text x={12} y={12} fill="#0f172a" fontSize={4.0} fontWeight="bold">
                NET BETON ÖRTÜLERİ (PASPAYI) VE GENEL UYGULAMA NOTLARI
              </text>

              {/* Concrete Covers */}
              {activeSheet.concreteCovers.slice(0, 5).map((cov, i) => (
                <g key={`cov-${i}`} transform={`translate(10, ${28 + i * 11})`}>
                  <text x={0} y={0} fill="#475569" fontSize={3.0}>• {cov.element}:</text>
                  <text x={notesW - 55} y={0} fill="#0f172a" fontSize={3.2} fontWeight="bold">{cov.coverMm} mm</text>
                </g>
              ))}

              <line x1={10} y1={86} x2={notesW - 10} y2={86} stroke="#cbd5e1" strokeWidth={0.8} />

              {/* Notes */}
              {activeSheet.notes.slice(0, 7).map((note, i) => (
                <text key={`note-${i}`} x={10} y={98 + i * 12} fill="#334155" fontSize={2.8}>
                  {note.length > 76 ? note.slice(0, 73) + "..." : note}
                </text>
              ))}
            </g>

            {/* E. COLUMN & SHEAR WALL SCHEDULE (KOLON DONATI TABLOSU) */}
            {activeSheet.columnSchedule && activeSheet.columnSchedule.length > 0 && (
              <g transform={`translate(${innerX + (W > 1800 ? 1160 : 780)}, ${H - (mb + 10) - Math.min(380, H - mt - mb - 20)})`}>
                {(() => {
                  const tableW = 420;
                  const tableH = Math.min(380, H - mt - mb - 20);
                  const rowH = 14;
                  return (
                    <>
                      <rect width={tableW} height={tableH} fill="#f8fafc" stroke="#1e293b" strokeWidth={1} />
                      <line x1={0} y1={20} x2={tableW} y2={20} stroke="#1e293b" strokeWidth={0.8} />
                      <text x={20} y={14} fill="#0f172a" fontSize={4.5} fontWeight="bold">
                        KOLON VE PERDE DONATI TABLOSU (TÜM KATLAR)
                      </text>

                      {/* Header row */}
                      <rect x={0} y={20} width={tableW} height={rowH} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth={0.5} />
                      <text x={6} y={30} fill="#0f172a" fontSize={3.2} fontWeight="bold">Eleman</text>
                      <text x={50} y={30} fill="#0f172a" fontSize={3.2} fontWeight="bold">Kesit (cm)</text>
                      <text x={115} y={30} fill="#0f172a" fontSize={3.2} fontWeight="bold">Boyuna Donatı</text>
                      <text x={215} y={30} fill="#0f172a" fontSize={3.2} fontWeight="bold">Etriye / Sarılma</text>
                      <text x={310} y={30} fill="#0f172a" fontSize={3.2} fontWeight="bold">Çiroz / Uç Bölgesi</text>

                      {/* Dividers */}
                      <line x1={45} y1={20} x2={45} y2={tableH} stroke="#cbd5e1" strokeWidth={0.5} />
                      <line x1={110} y1={20} x2={110} y2={tableH} stroke="#cbd5e1" strokeWidth={0.5} />
                      <line x1={210} y1={20} x2={210} y2={tableH} stroke="#cbd5e1" strokeWidth={0.5} />
                      <line x1={305} y1={20} x2={305} y2={tableH} stroke="#cbd5e1" strokeWidth={0.5} />

                      {/* Data rows */}
                      {activeSheet.columnSchedule.slice(0, 24).map((col, idx) => {
                        const ry = 34 + idx * rowH;
                        if (ry + rowH > tableH) return null;
                        return (
                          <g key={`col-row-${idx}`}>
                            <line x1={0} y1={ry} x2={tableW} y2={ry} stroke="#e2e8f0" strokeWidth={0.5} />
                            <text x={6} y={ry + 10} fill="#2563eb" fontSize={3.2} fontWeight="bold">{col.colNo}</text>
                            <text x={52} y={ry + 10} fill="#1e293b" fontSize={3.0}>{col.sectionDimensions}</text>
                            <text x={114} y={ry + 10} fill="#dc2626" fontSize={3.0} fontWeight="bold">{col.longitudinalRebar.slice(0, 20)}</text>
                            <text x={214} y={ry + 10} fill="#1e293b" fontSize={2.8}>{col.stirrupRebar.slice(0, 20)}</text>
                            <text x={309} y={ry + 10} fill="#475569" fontSize={2.7}>{col.tieCountText.slice(0, 20)}</text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </g>
            )}

            {/* F. PLAN VIEWPORT (1/50 SCALE STRUCTURAL DRAWING) */}
            <g transform={`translate(${vpX}, ${H - vpY - vpH})`}>
              {/* Viewport Frame */}
              <rect width={vpW} height={vpH} fill="#ffffff" stroke="#2563eb" strokeWidth={1} />
              
              {/* Viewport Title Banner */}
              <rect width={vpW} height={24} fill="#2563eb" />
              <text x={20} y={16} fill="#ffffff" fontSize={5.2} fontWeight="bold">
                {activeSheet.viewports[0]?.title || `${activeSheet.title} (ÖLÇEK: 1/50)`}
              </text>
              <text x={vpW - 120} y={16} fill="#ffffff" fontSize={4.5} fontWeight="bold">
                ÖLÇEK: 1/50
              </text>

              {/* North Arrow */}
              <g transform={`translate(${vpW - 40}, 55)`}>
                <circle cx={0} cy={0} r={14} fill="none" stroke="#2563eb" strokeWidth={1} />
                <line x1={0} y1={-14} x2={0} y2={14} stroke="#2563eb" strokeWidth={1} />
                <line x1={-14} y1={0} x2={14} y2={0} stroke="#2563eb" strokeWidth={1} />
                <polygon points="0,-14 4,-4 -4,-4" fill="#2563eb" />
                <text x={-2.5} y={-18} fill="#2563eb" fontSize={5} fontWeight="bold">K</text>
              </g>

              {/* Scaled Structural Plan Geometry */}
              <g transform={`translate(${-vpX}, ${-(H - vpY - vpH)})`}>
                {/* Continuous Axes */}
                {(model.elements.filter(e => e.type === "axis") as AxisElement[]).map(ax => {
                  const p1x = toPaperX(ax.start.x);
                  const p1y = toSvgY(toPaperY(ax.start.y));
                  const p2x = toPaperX(ax.end.x);
                  const p2y = toSvgY(toPaperY(ax.end.y));
                  const angle = Math.atan2(p2y - p1y, p2x - p1x);
                  const bubbleR = 5.0;
                  const bx = p2x + Math.cos(angle) * (bubbleR + 2);
                  const by = p2y + Math.sin(angle) * (bubbleR + 2);

                  return (
                    <g key={ax.id}>
                      <line x1={p1x} y1={p1y} x2={p2x} y2={p2y} stroke="#dc2626" strokeWidth={0.6} strokeDasharray="6 3 2 3" />
                      <circle cx={bx} cy={by} r={bubbleR} fill="#ffffff" stroke="#dc2626" strokeWidth={0.8} />
                      <text x={bx} y={by + 1.5} fill="#dc2626" fontSize={4.0} fontWeight="bold" textAnchor="middle">
                        {ax.name}
                      </text>
                    </g>
                  );
                })}

                {/* Slabs */}
                {(model.elements.filter(e => e.type === "slab") as SlabElement[]).map(slab => {
                  if (!slab.points || slab.points.length < 3) return null;
                  const ptsStr = slab.points.map(p => `${toPaperX(p.x)},${toSvgY(toPaperY(p.y))}`).join(" ");
                  const lp = slab.labelPosition ?? slab.points[0];
                  return (
                    <g key={slab.id}>
                      <polygon points={ptsStr} fill="#ecfdf5" stroke="#10b981" strokeWidth={0.8} opacity={0.6} />
                      <text x={toPaperX(lp.x)} y={toSvgY(toPaperY(lp.y))} fill="#047857" fontSize={3.6} fontWeight="bold">
                        {slab.name} (h={(slab.thickness * 100).toFixed(0)}cm)
                      </text>
                    </g>
                  );
                })}

                {/* Beams */}
                {(model.elements.filter(e => e.type === "beam") as BeamElement[]).map(beam => {
                  const fp = elementFootprint(beam);
                  const ptsStr = fp.map(p => `${toPaperX(p.x)},${toSvgY(toPaperY(p.y))}`).join(" ");
                  const mx = (beam.start.x + beam.end.x) / 2;
                  const my = (beam.start.y + beam.end.y) / 2;
                  return (
                    <g key={beam.id}>
                      <polygon points={ptsStr} fill="#fdf4ff" stroke="#c026d3" strokeWidth={0.9} />
                      <text x={toPaperX(mx)} y={toSvgY(toPaperY(my)) - 1} fill="#86198f" fontSize={2.8} fontWeight="bold" textAnchor="middle">
                        {beam.name} {(beam.width * 100).toFixed(0)}/{(beam.height * 100).toFixed(0)}
                      </text>
                    </g>
                  );
                })}

                {/* Shear Walls */}
                {(model.elements.filter(e => e.type === "wall") as WallElement[]).map(wall => {
                  const fp = elementFootprint(wall);
                  const ptsStr = fp.map(p => `${toPaperX(p.x)},${toSvgY(toPaperY(p.y))}`).join(" ");
                  const mx = (wall.start.x + wall.end.x) / 2;
                  const my = (wall.start.y + wall.end.y) / 2;
                  return (
                    <g key={wall.id}>
                      <polygon points={ptsStr} fill="#cffafe" stroke="#0891b2" strokeWidth={1.2} />
                      <text x={toPaperX(mx)} y={toSvgY(toPaperY(my)) + 1.2} fill="#0e7490" fontSize={3.6} fontWeight="bold" textAnchor="middle">
                        {wall.name}
                      </text>
                    </g>
                  );
                })}

                {/* Columns */}
                {(model.elements.filter(e => e.type === "column") as ColumnElement[]).map(col => {
                  const fp = elementFootprint(col);
                  const ptsStr = fp.map(p => `${toPaperX(p.x)},${toSvgY(toPaperY(p.y))}`).join(" ");
                  return (
                    <g key={col.id}>
                      <polygon points={ptsStr} fill="#dbeafe" stroke="#2563eb" strokeWidth={1.2} />
                      <text x={toPaperX(col.position.x)} y={toSvgY(toPaperY(col.position.y)) + 1.2} fill="#1e40af" fontSize={3.4} fontWeight="bold" textAnchor="middle">
                        {col.name}
                      </text>
                    </g>
                  );
                })}
              </g>
            </g>

            {/* G. REBAR SCHEDULE LISTING (IF SHEET IS S-04 DONATI METRAJI) */}
            {activeSheet.type === "rebar_schedule" && (
              <g transform={`translate(${vpX + 15}, ${H - (vpY + vpH - 30)})`}>
                {(() => {
                  const schedW = vpW - 30;
                  const rowH = 14;
                  return (
                    <>
                      <rect width={schedW} height={vpH - 60} fill="#f8fafc" stroke="#1e293b" strokeWidth={1} />
                      <rect width={schedW} height={24} fill="#334155" />
                      <text x={20} y={16} fill="#ffffff" fontSize={4.8} fontWeight="bold">
                        PROJE GENEL DONATI METRAJI VE BÜKÜM ŞEMALARI
                      </text>

                      {/* Header */}
                      <rect x={0} y={24} width={schedW} height={rowH} fill="#e2e8f0" stroke="#cbd5e1" strokeWidth={0.5} />
                      <text x={8} y={34} fill="#0f172a" fontSize={3.2} fontWeight="bold">Poz</text>
                      <text x={40} y={34} fill="#0f172a" fontSize={3.2} fontWeight="bold">Eleman</text>
                      <text x={220} y={34} fill="#0f172a" fontSize={3.2} fontWeight="bold">Çap (mm)</text>
                      <text x={290} y={34} fill="#0f172a" fontSize={3.2} fontWeight="bold">Adet</text>
                      <text x={350} y={34} fill="#0f172a" fontSize={3.2} fontWeight="bold">Boy (cm)</text>
                      <text x={430} y={34} fill="#0f172a" fontSize={3.2} fontWeight="bold">Büküm Şekli</text>
                      <text x={570} y={34} fill="#0f172a" fontSize={3.2} fontWeight="bold">Toplam (m)</text>
                      <text x={660} y={34} fill="#0f172a" fontSize={3.2} fontWeight="bold">Ağırlık (kg)</text>

                      {/* Rows */}
                      {activeSheet.rebarSchedule.map((item, idx) => {
                        const ry = 38 + idx * rowH;
                        return (
                          <g key={`sched-${idx}`}>
                            <line x1={0} y1={ry} x2={schedW} y2={ry} stroke="#e2e8f0" strokeWidth={0.5} />
                            <text x={8} y={ry + 10} fill="#2563eb" fontSize={3.2} fontWeight="bold">{item.pos}</text>
                            <text x={40} y={ry + 10} fill="#1e293b" fontSize={3.0}>{item.element}</text>
                            <text x={225} y={ry + 10} fill="#dc2626" fontSize={3.2} fontWeight="bold">Φ{item.diameterMm}</text>
                            <text x={295} y={ry + 10} fill="#1e293b" fontSize={3.2}>{item.count}</text>
                            <text x={355} y={ry + 10} fill="#1e293b" fontSize={3.2}>{item.lengthCm}</text>
                            <text x={430} y={ry + 10} fill="#475569" fontSize={2.9}>{item.shapeText}</text>
                            <text x={570} y={ry + 10} fill="#1e293b" fontSize={3.2}>{item.totalLengthM.toLocaleString("tr-TR")}</text>
                            <text x={660} y={ry + 10} fill="#047857" fontSize={3.4} fontWeight="bold">{item.totalWeightKg.toLocaleString("tr-TR")}</text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </g>
            )}
          </svg>
        </div>

        {/* Floating Zoom Controls */}
        <div className={styles.floatingControls}>
          <button
            type="button"
            className={styles.toolButton}
            onClick={() => setZoom(z => Math.min(3.5, z * 1.25))}
            title="Yakınlaştır"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            className={styles.toolButton}
            onClick={() => setZoom(z => Math.max(0.15, z / 1.25))}
            title="Uzaklaştır"
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            className={styles.toolButton}
            onClick={fitToScreen}
            title="Paftayı Ekrana Sığdır"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Metadata Editor Modal */}
      {editMetaOpen && (
        <div className={styles.metaModal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Antet ve Proje Bilgilerini Düzenle</h3>
              <button
                type="button"
                className={styles.toolButton}
                onClick={() => setEditMetaOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Proje Adı</label>
                <input
                  type="text"
                  className={styles.formInput}
                  data-testid="antet-project-name"
                  value={metadata.projectName}
                  onChange={e => setMetadata({ ...metadata, projectName: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Yapı Sahibi / İşveren</label>
                <input
                  type="text"
                  className={styles.formInput}
                  data-testid="antet-owner"
                  value={metadata.owner}
                  onChange={e => setMetadata({ ...metadata, owner: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Proje Müellifi (İnşaat Müh.)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={metadata.engineerName}
                  onChange={e => setMetadata({ ...metadata, engineerName: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Oda Sicil No & BTB</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={metadata.engineerChamberNo}
                  onChange={e => setMetadata({ ...metadata, engineerChamberNo: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>İl / İlçe</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={`${metadata.city} / ${metadata.district}`}
                  onChange={e => {
                    const [c, d] = e.target.value.split("/");
                    setMetadata({ ...metadata, city: (c || "").trim(), district: (d || "").trim() });
                  }}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Ada / Parsel</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={`${metadata.block} / ${metadata.parcel}`}
                  onChange={e => {
                    const [b, p] = e.target.value.split("/");
                    setMetadata({ ...metadata, block: (b || "").trim(), parcel: (p || "").trim() });
                  }}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Yapı Denetim Kuruluşu</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={metadata.inspectorCompany}
                  onChange={e => setMetadata({ ...metadata, inspectorCompany: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tarih & Revizyon</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={metadata.date}
                  onChange={e => setMetadata({ ...metadata, date: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={`${styles.toolButton} ${styles.toolButtonPrimary}`}
                data-testid="antet-submit"
                onClick={() => setEditMetaOpen(false)}
              >
                <Check size={16} />
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

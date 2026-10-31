"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import type { CadElement, Point } from "@/lib/hsyncad/model";
import { elementFootprint, snapPoint } from "@/lib/hsyncad/geometry";
import { referenceSnapCandidates, projectOnReference, type DraftingItem, type ReferenceFrame } from "@/lib/hsyncad/drafting";
import DraftingOverlay from "./drafting-overlay";
import { regionLabelPoint } from "@/lib/hsyncad/regions";
import { axisSegments, extendedAxisEndpoints } from "@/lib/hsyncad/axes";
import { distance, insidePolygon, roundPoint, segmentDistance, TYPE_COLORS, type Tool } from "./editor-state";
import { DEFAULT_SNAP, type SnapSettings, type LineStyle } from "@/lib/hsyncad/definitions";
import { constrainPoint } from "@/lib/hsyncad/drawing";
import type { PointAction } from "./use-drawing-session";
import type { AnalysisResult } from "@/lib/hsyncad/analysis";
import {
  computeTensionFaceNormal,
  get2DBeamDiagram,
  calculateAutoDiagramScale,
  calculateAutoDeformationScale,
  interpolateStationForces,
  projectPointToSegment,
  getDcrColor,
  type ForceDiagramType,
} from "@/lib/hsyncad/diagram-geometry";

type Props = {
  elements: CadElement[]; tool: Tool; selectedId: string | null; pending: Point[];
  snapping: boolean; ortho: boolean; gridStep: number; fitKey: number;
  onPoint: (p: Point, action?: PointAction) => void; onSelect: (id: string | null) => void;
  onCursor: (p: Point, snap: string) => void; onZoom: (zoom: number) => void;
  snapSettings?: SnapSettings; lockedLayers?: string[]; layerColors?: Record<string, string | undefined>;
  draftingItems?: DraftingItem[]; referenceFrame?: ReferenceFrame; showGrid?: boolean;
  coordinateConstraint?: (point: Point) => Point;
  preview?: CadElement; unit?: "m" | "cm"; lengthLock?: number | null; angleLock?: number | null; fallbackAngle?: number; regionPicking?: boolean;
  analysisResult?: AnalysisResult | null;
  analysisViewMode?: "none" | "displacement" | "moment" | "shear" | "axial" | "capacity";
  diagramScale?: number;
  deformationScale?: number;
  activeCombination?: string;
  paftaMode?: boolean;
};
const MIN_SCALE = 1e-6;
const SNAP_LABELS: Record<string, string> = { intersection: "Aks kesişimi", endpoint: "Uç nokta", midpoint: "Orta nokta", grid: "Izgara", none: "Serbest", reference: "Referans doğrusu" };

const dash = (style: LineStyle | undefined, fallback: LineStyle = "solid") => (style ?? fallback) === "dashdot" ? "9 5 2 5" : style === "dashed" ? "6 4" : undefined;
export default function Plan2D({ elements, tool, selectedId, pending, snapping, ortho, gridStep, fitKey, onPoint, onSelect, onCursor, onZoom, snapSettings = DEFAULT_SNAP, lockedLayers = [], layerColors = {}, preview, unit = "m", lengthLock = null, angleLock = null, fallbackAngle = 0, regionPicking = false, draftingItems = [], referenceFrame, showGrid = true, coordinateConstraint, analysisResult, analysisViewMode = "none", diagramScale = 1.0, deformationScale = 100, activeCombination = "Zarf", paftaMode = false }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 600, height: 490 });
  const [camera, setCamera] = useState({ x: 2, y: 2, scale: 48 });
  const [cursor, setCursor] = useState<Point | null>(null);
  const [snapKind, setSnapKind] = useState("none");
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef({ start: { x: 0, y: 0 }, last: { x: 0, y: 0 }, moved: false, pinch: false, pan: false });
  const candidates = useMemo(() => referenceSnapCandidates(elements, draftingItems), [elements, draftingItems]);

  const [hoverProbe, setHoverProbe] = useState<{
    elementName: string;
    x: number;
    L: number;
    t: number;
    screenProj: Point;
    N: number;
    V2: number;
    M3: number;
    dcr: number;
  } | null>(null);

  const autoDiagScale = useMemo(() => {
    if (!analysisResult) return 1.0;
    const fType: ForceDiagramType = analysisViewMode === "moment" ? "M3" : analysisViewMode === "shear" ? "V2" : "N";
    const map = analysisResult.memberStations || analysisResult.memberForces;
    return calculateAutoDiagramScale(map, fType, 0.60) * (diagramScale || 1.0);
  }, [analysisResult, analysisViewMode, diagramScale]);

  const autoDispScale = useMemo(() => {
    if (!analysisResult?.displacements) return 100;
    const xs = elements.map(e => e.type === "column" ? e.position.x : e.type === "beam" ? e.start.x : 0);
    const ys = elements.map(e => e.type === "column" ? e.position.y : e.type === "beam" ? e.start.y : 0);
    const spanX = xs.length ? Math.max(...xs) - Math.min(...xs) : 20;
    const spanY = ys.length ? Math.max(...ys) - Math.min(...ys) : 20;
    const dim = Math.max(spanX, spanY, 15);
    const base = calculateAutoDeformationScale(analysisResult.displacements, dim);
    return base * ((deformationScale || 100) / 100);
  }, [analysisResult, elements, deformationScale]);

  const getDisplacementAt = useCallback((p: Point): Point => {
    if (!analysisResult?.displacements) return { x: 0, y: 0 };
    if (analysisResult.floorDiaphragms && analysisResult.floorDiaphragms.length > 0) {
      const dia = analysisResult.floorDiaphragms[0];
      const dx = dia.displacementX - dia.rotationZ * (p.y - dia.centerY);
      const dy = dia.displacementY + dia.rotationZ * (p.x - dia.centerX);
      return { x: dx, y: dy };
    }
    let sumX = 0, sumY = 0, count = 0;
    for (const disp of Object.values(analysisResult.displacements)) {
      if (disp) {
        sumX += disp[0];
        sumY += disp[1];
        count++;
      }
    }
    return count > 0 ? { x: sumX / count, y: sumY / count } : { x: 0, y: 0 };
  }, [analysisResult]);
  const screen = (p: Point) => ({ x: size.width / 2 + (p.x - camera.x) * camera.scale, y: size.height / 2 - (p.y - camera.y) * camera.scale });
  const world = (p: Point) => ({ x: camera.x + (p.x - size.width / 2) / camera.scale, y: camera.y - (p.y - size.height / 2) / camera.scale });
  const fit = useCallback(() => {
    const points = [
      ...elements.flatMap((e) => e.type === "axis" ? [e.start, e.end] : elementFootprint(e)),
      ...draftingItems.flatMap(item => item.points),
      ...(referenceFrame?.enabled ? [referenceFrame.origin] : []),
    ].filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (!points.length) { setCamera({ x: 2, y: 2, scale: 48 }); return; }
    const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    setCamera({ x: (minX + maxX) / 2, y: (minY + maxY) / 2, scale: Math.max(MIN_SCALE, Math.min(100, (size.width - 110) / Math.max(1, maxX - minX), (size.height - 120) / Math.max(1, maxY - minY))) });
  }, [elements, draftingItems, referenceFrame, size]);
  const fitRef = useRef(fit);
  useEffect(() => { fitRef.current = fit; }, [fit]);
  useEffect(() => { if (fitKey) { const id = requestAnimationFrame(() => fitRef.current()); return () => cancelAnimationFrame(id); } }, [fitKey]);
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => onZoom(Math.round(camera.scale / 48 * 100)), [camera.scale, onZoom]);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    function wheel(event: WheelEvent) {
      event.preventDefault();
      const rect = el!.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2, y = event.clientY - rect.top - rect.height / 2;
      setCamera((old) => {
        const scale = Math.max(MIN_SCALE, Math.min(350, old.scale * Math.exp(-event.deltaY * 0.0015)));
        return { scale, x: old.x + x / old.scale - x / scale, y: old.y - y / old.scale + y / scale };
      });
    }
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, []);
  function local(event: React.PointerEvent) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  function resolve(p: Point, shift = false) {
    let value = world(p);
    let locked: { coordinate: keyof Point; value: number } | null = null;
    if ((ortho || shift) && pending.length && tool !== "slab") {
      const anchor = pending[pending.length - 1];
      locked = Math.abs(value.x - anchor.x) > Math.abs(value.y - anchor.y)
        ? { coordinate: "y", value: anchor.y } : { coordinate: "x", value: anchor.x };
      value = { ...value, [locked.coordinate]: locked.value };
    }
    const snapped = snapping && !regionPicking ? snapPoint(value, elements, snapSettings.tolerancePx / camera.scale, gridStep, snapSettings, candidates) : { point: value, kind: "none" };
    if (snapping && !regionPicking && (snapped.kind === "none" || snapped.kind === "grid")) { const projected = projectOnReference(value, draftingItems, snapSettings.tolerancePx / camera.scale); if (projected) { snapped.point = projected; snapped.kind = "reference"; } }
    // A nearby endpoint/grid must not pull an orthogonal segment off its line.
    // The projected point is not that endpoint, so do not show an endpoint marker.
    if (locked && Math.abs(snapped.point[locked.coordinate] - locked.value) > 1e-9) {
      snapped.point = { ...snapped.point, [locked.coordinate]: locked.value };
      snapped.kind = "none";
    }
    if (pending.length && tool !== "column" && (lengthLock !== null || angleLock !== null)) {
      const constrained = constrainPoint(pending[pending.length - 1], snapped.point, lengthLock, angleLock, fallbackAngle);
      if (distance(constrained, snapped.point) > 1e-6) snapped.kind = "none";
      snapped.point = constrained;
    }
    const constrained = coordinateConstraint?.(snapped.point) ?? snapped.point;
    if (distance(constrained, snapped.point) > 1e-6) snapped.kind = "none";
    const point = roundPoint(constrained);
    setCursor(point); setSnapKind(snapped.kind); onCursor(point, SNAP_LABELS[snapped.kind]);

    if (analysisResult && analysisViewMode !== "none") {
      let nearest: typeof hoverProbe = null;
      let minD = Math.max(0.40, 24 / camera.scale);
      for (const e of elements) {
        if (e.type !== "beam") continue;
        const projInfo = projectPointToSegment(point, e.start, e.end);
        if (projInfo.distance < minD) {
          minD = projInfo.distance;
          const stations = (analysisResult.memberStations?.[e.id] || analysisResult.memberForces?.[e.id] || []) as any[];
          const forces = interpolateStationForces(stations, projInfo.t);
          const L = Math.hypot(e.end.x - e.start.x, e.end.y - e.start.y);
          const memberResult = analysisResult.members?.[e.id];
          const dcr = memberResult?.capacityRatio ?? 0;
          nearest = {
            elementName: e.name,
            x: projInfo.t * L,
            L,
            t: projInfo.t,
            screenProj: screen(projInfo.proj),
            N: forces.N,
            V2: forces.V2,
            M3: forces.M3,
            dcr,
          };
        }
      }
      setHoverProbe(nearest);
    } else if (hoverProbe) {
      setHoverProbe(null);
    }

    return point;
  }
  function select(p: Point) {
    const tolerance = snapSettings.selectionPx / camera.scale;
    // Structural edges win over the containing slab so small members remain selectable.
    const priority = { column: 0, beam: 1, wall: 2, slabEdge: 3, axis: 4, slab: 5 };
    const ordered = [...elements].sort((a, b) => priority[a.type] - priority[b.type]);
    const hit = ordered.find((e) => {
      if (lockedLayers.includes(e.layer)) return false;
      if (e.type === "slabEdge") return segmentDistance(p, e.start, e.end) < tolerance;
      if (e.type === "axis") {
        return axisSegments(e).some(({ a, b }) => segmentDistance(p, a, b) < tolerance);
      }
      const poly = elementFootprint(e);
      return insidePolygon(p, poly) || poly.some((a, i) => segmentDistance(p, a, poly[(i + 1) % poly.length]) < tolerance);
    });
    onSelect(hit?.id ?? null);
  }
  const min = world({ x: 0, y: size.height }), max = world({ x: size.width, y: 0 });
  const displayStep = gridStep * Math.max(1, Math.ceil(40 / (gridStep * camera.scale)));
  const gridXs: number[] = [], gridYs: number[] = [];
  for (let x = Math.ceil(min.x / displayStep) * displayStep; x <= max.x; x += displayStep) gridXs.push(x);
  for (let y = Math.ceil(min.y / displayStep) * displayStep; y <= max.y; y += displayStep) gridYs.push(y);
  const path = (points: Point[]) => points.map((p) => { const s = screen(p); return `${s.x},${s.y}`; }).join(" ");
  const rendered = [...elements].sort((a, b) => (a.type === "slab" ? -1 : 0) - (b.type === "slab" ? -1 : 0));
  const origin = screen({ x: 0, y: 0 });
  return <section className="hcad-view hcad-plan" aria-label="2B Çizim Penceresi">
    <div className="hcad-view-heading"><span><i className="hcad-dot" />2B Çizim Penceresi</span><span className="hcad-view-tag">ÜST GÖRÜNÜŞ</span></div>
    <div ref={host} className="hcad-plan-stage" data-testid="hsyncad-plan" data-camera={JSON.stringify(camera)} data-element-count={elements.length} data-analysis-mode={analysisViewMode} data-pafta-mode={paftaMode ? "true" : "false"}>
      <svg width="100%" height="100%" role="img" aria-label="Etkileşimli yapı planı" style={{ touchAction: "none", cursor: tool === "pan" ? "grab" : tool === "select" ? "default" : "crosshair" }}
        onContextMenu={(event) => event.preventDefault()}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          const p = local(event); pointers.current.set(event.pointerId, p);
          if (pointers.current.size > 1) { gesture.current.pinch = true; return; }
          gesture.current = { start: p, last: p, moved: false, pinch: false, pan: tool === "pan" || event.button === 1 || event.button === 2 };
        }}
        onPointerMove={(event) => {
          const p = local(event), g = gesture.current;
          if (pointers.current.has(event.pointerId)) {
            if (pointers.current.size === 2) {
              const before = [...pointers.current.values()];
              pointers.current.set(event.pointerId, p);
              const after = [...pointers.current.values()];
              const d1 = distance(before[0], before[1]), d2 = distance(after[0], after[1]);
              const center1 = { x: (before[0].x + before[1].x) / 2, y: (before[0].y + before[1].y) / 2 };
              const center2 = { x: (after[0].x + after[1].x) / 2, y: (after[0].y + after[1].y) / 2 };
              setCamera((old) => {
                const scale = Math.max(MIN_SCALE, Math.min(350, old.scale * (d1 > 0 ? d2 / d1 : 1)));
                return { scale, x: old.x + (center1.x - size.width / 2) / old.scale - (center2.x - size.width / 2) / scale, y: old.y - (center1.y - size.height / 2) / old.scale + (center2.y - size.height / 2) / scale };
              });
              return;
            }
            pointers.current.set(event.pointerId, p);
            if (distance(p, g.start) > 5) g.moved = true;
            const dx = p.x - g.last.x, dy = p.y - g.last.y;
            if (g.pan) setCamera((old) => ({ ...old, x: old.x - dx / old.scale, y: old.y + dy / old.scale }));
            g.last = p;
          }
          resolve(p, event.shiftKey);
        }}
        onPointerUp={(event) => {
          const g = gesture.current;
          pointers.current.delete(event.pointerId);
          if (g.moved || g.pinch || g.pan) return;
          const p = local(event);
          if (tool === "select" || (tool === "move" && !selectedId)) select(world(p));
          else onPoint(resolve(p, event.shiftKey), { source: "canvas", ctrlKey: event.ctrlKey });
        }}
        onPointerCancel={(event) => { pointers.current.delete(event.pointerId); gesture.current.pinch = true; }}>
        <title>Metre tabanlı yapı planı. Eleman yerleştirmek için tıklayın; hassas giriş için koordinat kutusunu kullanın.</title>
        {showGrid && <g className="hcad-grid">{gridXs.map((x, i) => <line key={`x${i}`} x1={screen({ x, y: 0 }).x} x2={screen({ x, y: 0 }).x} y1={0} y2={size.height} />)}{gridYs.map((y, i) => <line key={`y${i}`} x1={0} x2={size.width} y1={screen({ x: 0, y }).y} y2={screen({ x: 0, y }).y} />)}</g>}
        <g className="hcad-origin"><line x1={0} x2={size.width} y1={origin.y} y2={origin.y} /><line x1={origin.x} x2={origin.x} y1={0} y2={size.height} /></g>
        {gridXs.filter((_, i) => i % 2 === 0).map((x, i) => <text className="hcad-ruler" key={i} x={screen({ x, y: 0 }).x + 4} y={size.height - 8}>{+x.toFixed(2)}</text>)}
        {rendered.map((e, index) => {
          const analysisMember = analysisResult?.members[e.id];
          const capacityColor = analysisMember ? getDcrColor(analysisMember.capacityRatio) : undefined;
          const baseColor = e.layer === "Temeller" ? "#8b5cf6" : e.layer === "Merdivenler" ? "#ec4899" : (e.color ?? layerColors[e.layer] ?? TYPE_COLORS[e.type]);
          const color = (analysisViewMode === "capacity" && capacityColor) ? capacityColor : baseColor;
          const selected = e.id === selectedId;
          const points = e.type === "axis" ? [e.start, e.end] : elementFootprint(e);
          const center = e.type === "slab" ? e.labelPosition ?? regionLabelPoint(e.points) : e.type === "column" ? e.position : { x: points.reduce((s, p) => s + p.x, 0) / points.length, y: points.reduce((s, p) => s + p.y, 0) / points.length };
          const label = screen(center);
          const isDeformed = analysisViewMode === "displacement";
          const strokeColor = (analysisViewMode === "capacity" && analysisMember && analysisMember.capacityRatio > 1.0)
            ? "#ef4444"
            : selected ? "#fbbf24" : color;
          const strokeWidth = (analysisViewMode === "capacity" && analysisMember && analysisMember.capacityRatio > 1.0)
            ? 3 : selected ? 3 : 1.5;

          if (e.type === "slabEdge") return <g key={e.id} data-element-id={e.id} data-element-type="slabEdge"><polyline points={path(points)} stroke={strokeColor} strokeDasharray="7 4" strokeWidth={strokeWidth} fill="none" /><text x={label.x} y={label.y - 6} fill={color} fontSize={9}>{e.name}</text></g>;
          if (e.type === "axis") {
            const extended = extendedAxisEndpoints(e);
            const showStart = e.labelSide === "start" || e.labelSide === "both" || !e.labelSide;
            const showEnd = e.labelSide === "end" || e.labelSide === "both" || !e.labelSide;
            const sStart = screen(extended[0]), sEnd = screen(extended[1]);
            return (
              <g key={e.id} data-element-id={e.id} data-element-type="axis">
                {axisSegments(e).map((line, i) => <polyline key={i} points={path([line.a, line.b])} fill="none" stroke={selected ? "#f59e0b" : line.color ?? color} strokeDasharray={dash(line.style, "dashdot")} strokeWidth={selected ? 3 : 1.3} />)}
                {showStart && (
                  <g>
                    <circle cx={sStart.x} cy={sStart.y} r={12} fill="var(--hc-panel)" stroke={selected ? "#f59e0b" : color} />
                    <text x={sStart.x} y={sStart.y + 4} textAnchor="middle" fill={selected ? "#f59e0b" : color} fontSize={10}>{e.name}{e.suffix}</text>
                  </g>
                )}
                {showEnd && (
                  <g>
                    <circle cx={sEnd.x} cy={sEnd.y} r={12} fill="var(--hc-panel)" stroke={selected ? "#f59e0b" : color} />
                    <text x={sEnd.x} y={sEnd.y + 4} textAnchor="middle" fill={selected ? "#f59e0b" : color} fontSize={10}>{e.name}{e.suffix}</text>
                  </g>
                )}
              </g>
            );
          }
          return <g key={e.id} data-element-id={e.id} data-element-type={e.type} opacity={isDeformed ? 0.40 : 1}>
            {e.hatch && <defs><pattern id={`hcad-pattern-${index}`} width={8} height={8} patternUnits="userSpaceOnUse" patternTransform={`rotate(${e.type === "slab" ? e.hatchAngle ?? 0 : 45})`}><line x1={0} y1={0} x2={8} y2={0} stroke={color} strokeWidth={1} /></pattern></defs>}
            <polygon points={path(points)} fill={e.hatch ? `url(#hcad-pattern-${index})` : color} fillOpacity={e.filled === false && !e.hatch ? 0 : e.type === "slab" ? 0.2 : 0.45} stroke={strokeColor} strokeDasharray={dash(e.lineStyle)} strokeWidth={strokeWidth} />
            {e.type === "column" && ((e.leanX ?? 0) !== 0 || (e.leanY ?? 0) !== 0) && <polygon points={path(points.map(p => ({ x: p.x + (e.leanX ?? 0), y: p.y + (e.leanY ?? 0) })))} fill="none" stroke={color} strokeDasharray="4 3" />}
            {e.type === "slab" && e.referenceVisible && <g><polyline points={path([e.points[0], { x: e.points[0].x + 1, y: e.points[0].y }])} stroke={color} strokeWidth={3} /><text x={screen(e.points[0]).x + 8} y={screen(e.points[0]).y + 14} fill={color} fontSize={10}>X %{e.slopeX ?? 0} · Y %{e.slopeY ?? 0}</text></g>}
            <text x={label.x + 8} y={label.y - 8} fill={color} fontSize={10} fontFamily="var(--font-mono)" paintOrder="stroke" stroke="var(--hc-bg)" strokeWidth={3}>{e.name}</text>

            {/* 2D Continuous Force Diagrams for Beams */}
            {(analysisViewMode === "moment" || analysisViewMode === "shear" || analysisViewMode === "axial") && e.type === "beam" && (() => {
              const stations = (analysisResult?.memberStations?.[e.id] || analysisResult?.memberForces?.[e.id] || []) as any[];
              if (!stations.length) return null;
              const fType: ForceDiagramType = analysisViewMode === "moment" ? "M3" : analysisViewMode === "shear" ? "V2" : "N";
              const diag = get2DBeamDiagram(e.start, e.end, stations, fType, autoDiagScale, screen);
              const strokeCol = fType === "M3" ? "#2563eb" : fType === "V2" ? "#0891b2" : "#ea580c";
              const fillCol = fType === "M3" ? "#3b82f6" : fType === "V2" ? "#06b6d4" : "#f97316";
              return (
                <g className="hcad-beam-diagram-2d" pointerEvents="none" data-element-id={e.id}>
                  <polygon points={diag.polygonPoints} fill={fillCol} fillOpacity={0.25} stroke={strokeCol} strokeWidth={1.5} />
                  {diag.tieLines.map((t, idx) => (
                    <line key={idx} x1={t.from.x} y1={t.from.y} x2={t.to.x} y2={t.to.y} stroke={strokeCol} strokeWidth={0.8} strokeDasharray="2 2" />
                  ))}
                  {Math.abs(diag.peakSpan.val) > 0.05 && (
                    <text x={diag.peakSpan.screen.x} y={diag.peakSpan.screen.y - 4} fill={strokeCol} fontSize={9} fontWeight="bold" textAnchor="middle" paintOrder="stroke" stroke="var(--hc-bg)" strokeWidth={3}>
                      {diag.peakSpan.val.toFixed(1)} {fType === "M3" ? "kNm" : "kN"}
                    </text>
                  )}
                  {Math.abs(diag.support1.val) > 0.05 && (
                    <text x={diag.support1.screen.x} y={diag.support1.screen.y - 4} fill={strokeCol} fontSize={8} paintOrder="stroke" stroke="var(--hc-bg)" strokeWidth={2}>
                      {diag.support1.val.toFixed(1)}
                    </text>
                  )}
                  {Math.abs(diag.support2.val) > 0.05 && (
                    <text x={diag.support2.screen.x} y={diag.support2.screen.y - 4} fill={strokeCol} fontSize={8} paintOrder="stroke" stroke="var(--hc-bg)" strokeWidth={2}>
                      {diag.support2.val.toFixed(1)}
                    </text>
                  )}
                </g>
              );
            })()}

            {/* Deformed Wireframe Overlay */}
            {isDeformed && e.type === "beam" && (() => {
              const dispS = getDisplacementAt(e.start);
              const dispE = getDisplacementAt(e.end);
              const defS = screen({ x: e.start.x + dispS.x * autoDispScale, y: e.start.y + dispS.y * autoDispScale });
              const defE = screen({ x: e.end.x + dispE.x * autoDispScale, y: e.end.y + dispE.y * autoDispScale });
              const dispMid = getDisplacementAt(center);
              const driftMm = Math.hypot(dispMid.x, dispMid.y) * 1000;
              return (
                <g className="hcad-deformed-beam" pointerEvents="none">
                  <line x1={defS.x} y1={defS.y} x2={defE.x} y2={defE.y} stroke="#38bdf8" strokeDasharray="4 3" strokeWidth={2} />
                  <circle cx={defS.x} cy={defS.y} r={3} fill="#38bdf8" />
                  <circle cx={defE.x} cy={defE.y} r={3} fill="#38bdf8" />
                  <text x={label.x + 8} y={label.y + 8} fill="#38bdf8" fontSize={9} fontFamily="var(--font-mono)" fontWeight="bold" paintOrder="stroke" stroke="var(--hc-bg)" strokeWidth={2}>Δ: {driftMm.toFixed(1)}mm</text>
                </g>
              );
            })()}

            {isDeformed && e.type === "column" && (() => {
              const dispC = getDisplacementAt(e.position);
              const defFootprint = points.map(p => screen({ x: p.x + dispC.x * autoDispScale, y: p.y + dispC.y * autoDispScale }));
              const driftMm = Math.hypot(dispC.x, dispC.y) * 1000;
              return (
                <g className="hcad-deformed-col" pointerEvents="none">
                  <polygon points={defFootprint.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")} fill="none" stroke="#38bdf8" strokeDasharray="4 3" strokeWidth={2} />
                  <text x={label.x + 8} y={label.y + 8} fill="#38bdf8" fontSize={9} fontFamily="var(--font-mono)" fontWeight="bold" paintOrder="stroke" stroke="var(--hc-bg)" strokeWidth={2}>Δ: {driftMm.toFixed(1)}mm</text>
                </g>
              );
            })()}

            {/* DCR Central Capacity Badge */}
            {analysisViewMode === "capacity" && analysisMember && (
              <g transform={`translate(${label.x}, ${label.y})`} pointerEvents="none">
                <rect x={-18} y={-8} width={36} height={16} rx={3} fill="#0f172a" stroke={strokeColor} strokeWidth={1} />
                <text x={0} y={4} textAnchor="middle" fill={strokeColor} fontSize={10} fontWeight="bold">
                  %{(analysisMember.capacityRatio * 100).toFixed(0)}
                </text>
              </g>
            )}

            {selected && points.map((p, i) => { const s = screen(p); return <rect key={i} x={s.x - 3} y={s.y - 3} width={6} height={6} fill="#fbbf24" />; })}
          </g>;
        })}

        {/* Interactive Force Station Probe Tooltip */}
        {hoverProbe && (
          <g transform={`translate(${hoverProbe.screenProj.x} ${hoverProbe.screenProj.y})`} pointerEvents="none">
            <circle cx={0} cy={0} r={5} fill="#38bdf8" stroke="#ffffff" strokeWidth={1.5} />
            <circle cx={0} cy={0} r={9} fill="none" stroke="#38bdf8" strokeWidth={1} opacity={0.6} />
            <g transform="translate(14, -50)">
              <rect x={0} y={0} width={180} height={70} rx={6} fill="#0f172a" fillOpacity={0.95} stroke="#38bdf8" strokeWidth={1} />
              <text x={8} y={16} fill="#f8fafc" fontSize={10} fontWeight="bold">{hoverProbe.elementName} (x: {hoverProbe.x.toFixed(2)}m / {hoverProbe.L.toFixed(2)}m)</text>
              <text x={8} y={32} fill="#60a5fa" fontSize={9} fontFamily="var(--font-mono)">M₃: {hoverProbe.M3.toFixed(1)} kNm</text>
              <text x={95} y={32} fill="#22d3ee" fontSize={9} fontFamily="var(--font-mono)">V₂: {hoverProbe.V2.toFixed(1)} kN</text>
              <text x={8} y={48} fill="#fb923c" fontSize={9} fontFamily="var(--font-mono)">N: {hoverProbe.N.toFixed(1)} kN</text>
              <text x={95} y={48} fill={getDcrColor(hoverProbe.dcr)} fontSize={9} fontFamily="var(--font-mono)" fontWeight="bold">DCR: %{(hoverProbe.dcr * 100).toFixed(0)}</text>
              <text x={8} y={62} fill="#94a3b8" fontSize={8}>Konum: %{(hoverProbe.t * 100).toFixed(0)} · TS 500 / TBDY 2018</text>
            </g>
          </g>
        )}
        {paftaMode && (
          <g className="hcad-pafta-frame" pointerEvents="none">
            <rect x={12} y={12} width={size.width - 24} height={size.height - 24} fill="none" stroke="#3b82f6" strokeWidth={2} />
            <rect x={16} y={16} width={size.width - 32} height={size.height - 32} fill="none" stroke="#3b82f6" strokeWidth={0.7} />
            <g transform={`translate(${size.width - 240} ${size.height - 80})`}>
              <rect width={220} height={60} fill="var(--hc-panel)" stroke="#3b82f6" strokeWidth={1} />
              <line x1={0} y1={20} x2={220} y2={20} stroke="#3b82f6" strokeWidth={0.5} />
              <line x1={0} y1={40} x2={220} y2={40} stroke="#3b82f6" strokeWidth={0.5} />
              <line x1={110} y1={20} x2={110} y2={60} stroke="#3b82f6" strokeWidth={0.5} />
              <text x={10} y={14} fill="var(--hc-accent)" fontSize={10} fontWeight="bold">hsynCAD - STATİK UYGULAMA PLANI</text>
              <text x={10} y={34} fill="var(--hc-text)" fontSize={9}>ÖLÇEK: 1 / 50</text>
              <text x={120} y={34} fill="var(--hc-text)" fontSize={9}>KOT: ±0.00 m</text>
              <text x={10} y={54} fill="var(--hc-muted)" fontSize={9}>TBDY 2018 / TS 500</text>
              <text x={120} y={54} fill="var(--hc-accent)" fontSize={9}>PAFTA NO: S-01</text>
            </g>
          </g>
        )}
        {snapSettings.showNodes && [...candidates.endpoint, ...candidates.intersection].map((p, i) => <circle key={`node-${i}`} cx={screen(p).x} cy={screen(p).y} r={snapSettings.nodeRadius} fill="#27bca6" pointerEvents="none" />)}
        <DraftingOverlay items={draftingItems} frame={referenceFrame} screen={screen} size={size} scale={camera.scale} tool={tool} pending={pending} cursor={cursor} unit={unit} />
        {preview && cursor && <g data-testid="hsyncad-placement-preview" data-preview-type={preview.type} pointerEvents="none">
          {preview.type === "axis" || preview.type === "slabEdge" ? <polyline points={path(preview.type === "axis" ? extendedAxisEndpoints(preview) : elementFootprint(preview))} stroke="#ed8b22" strokeWidth={2} strokeDasharray="7 4" fill="none" /> : <polygon points={path(elementFootprint(preview))} stroke={preview.type === "slab" && regionPicking ? "#ed5757" : "#ed8b22"} strokeWidth={2} fill={preview.type === "slab" && regionPicking ? "#ed575720" : "#ed8b2228"} />}
          {preview.type === "column" && <g><circle cx={screen(preview.position).x} cy={screen(preview.position).y} r={4} fill="#ed8b22" /><text x={screen(preview.position).x + 12} y={screen(preview.position).y + 22} fill="#ed8b22" fontSize={11}>{(preview.rotation ?? 0).toFixed(1)}°</text></g>}
          {preview.type === "slab" && preview.labelPosition && <text x={screen(preview.labelPosition).x} y={screen(preview.labelPosition).y} fill="#ed5757" fontSize={12}>D · yazı konumu</text>}
        </g>}
        {pending.length > 0 && tool !== "column" && <><polyline points={path(cursor ? [...pending, cursor] : pending)} stroke="#e3a342" strokeWidth={1} strokeDasharray="5 4" fill="none" />{pending.map((p, i) => { const s = screen(p); return <circle key={i} cx={s.x} cy={s.y} r={4} fill="#e3a342" />; })}{cursor && <text x={screen(cursor).x + 14} y={screen(cursor).y + 22} fill="#ed8b22" fontSize={11}>{(distance(pending[pending.length - 1], cursor) * (unit === "cm" ? 100 : 1)).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} {unit} · {(Math.atan2(cursor.y - pending[pending.length - 1].y, cursor.x - pending[pending.length - 1].x) * 180 / Math.PI).toFixed(1)}°</text>}</>}
        {cursor && tool !== "select" && tool !== "pan" && <g transform={`translate(${screen(cursor).x} ${screen(cursor).y})`} pointerEvents="none"><path d="M-14 0H14M0-14V14" stroke="#fbbf24" strokeWidth={1} />{snapKind !== "none" && <rect x={-5} y={-5} width={10} height={10} fill="none" stroke="#40cfb6" strokeWidth={2} />}</g>}
        <g transform={`translate(24 ${size.height - 42})`}><path d="M0 0H28M0 0V-28" fill="none" stroke="#7c8fa2" /><text x={30} y={4} fill="#7c8fa2" fontSize={10}>X</text><text x={-3} y={-33} fill="#7c8fa2" fontSize={10}>Y</text></g>
      </svg>
      {!elements.length && tool === "select" && <div className="hcad-empty-plan"><span>İlk çizgiyle başlayın.</span><small>Bir araç seçin, plana tıklayın veya koordinat girin.</small></div>}
      <div className="hcad-canvas-controls"><button type="button" title="Yakınlaştır" aria-label="2B yakınlaştır" onClick={() => setCamera((c) => ({ ...c, scale: Math.min(350, c.scale * 1.25) }))}><Plus size={16} /></button><button type="button" title="Uzaklaştır" aria-label="2B uzaklaştır" onClick={() => setCamera((c) => ({ ...c, scale: Math.max(MIN_SCALE, c.scale / 1.25) }))}><Minus size={16} /></button><button type="button" title="Çizimi sığdır" aria-label="Çizimi sığdır" onClick={fit}><Maximize2 size={16} /></button></div>
      <div className="hcad-plan-hint">{tool === "pan" ? "Sürükleyerek kaydırın" : "Tekerlek: yakınlaştır · İki parmak: kaydır / yakınlaştır"}</div>
    </div>
  </section>;
}

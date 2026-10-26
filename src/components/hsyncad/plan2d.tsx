"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import type { CadElement, Point } from "@/lib/hsyncad/model";
import { elementFootprint, snapPoint } from "@/lib/hsyncad/geometry";
import { extendedAxisEndpoints } from "@/lib/hsyncad/axes";
import { distance, insidePolygon, roundPoint, segmentDistance, TYPE_COLORS, type Tool } from "./editor-state";

type Props = {
  elements: CadElement[]; tool: Tool; selectedId: string | null; pending: Point[];
  snapping: boolean; ortho: boolean; gridStep: number; fitKey: number;
  onPoint: (p: Point) => void; onSelect: (id: string | null) => void;
  onCursor: (p: Point, snap: string) => void; onZoom: (zoom: number) => void;
};
const SNAP_LABELS: Record<string, string> = { intersection: "Aks kesişimi", endpoint: "Uç nokta", midpoint: "Orta nokta", grid: "Izgara", none: "Serbest" };

export default function Plan2D({ elements, tool, selectedId, pending, snapping, ortho, gridStep, fitKey, onPoint, onSelect, onCursor, onZoom }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 600, height: 490 });
  const [camera, setCamera] = useState({ x: 2, y: 2, scale: 48 });
  const [cursor, setCursor] = useState<Point | null>(null);
  const [snapKind, setSnapKind] = useState("none");
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef({ start: { x: 0, y: 0 }, last: { x: 0, y: 0 }, moved: false, pinch: false, pan: false });
  const screen = (p: Point) => ({ x: size.width / 2 + (p.x - camera.x) * camera.scale, y: size.height / 2 - (p.y - camera.y) * camera.scale });
  const world = (p: Point) => ({ x: camera.x + (p.x - size.width / 2) / camera.scale, y: camera.y - (p.y - size.height / 2) / camera.scale });
  const fit = useCallback(() => {
    const points = elements.flatMap((e) => e.type === "axis" ? [e.start, e.end] : elementFootprint(e));
    if (!points.length) { setCamera({ x: 2, y: 2, scale: 48 }); return; }
    const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    setCamera({ x: (minX + maxX) / 2, y: (minY + maxY) / 2, scale: Math.max(8, Math.min(100, (size.width - 110) / Math.max(1, maxX - minX), (size.height - 120) / Math.max(1, maxY - minY))) });
  }, [elements, size]);
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
        const scale = Math.max(6, Math.min(350, old.scale * Math.exp(-event.deltaY * 0.0015)));
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
  function resolve(p: Point) {
    let value = world(p);
    let locked: { coordinate: keyof Point; value: number } | null = null;
    if (ortho && pending.length && tool !== "slab") {
      const anchor = pending[pending.length - 1];
      locked = Math.abs(value.x - anchor.x) > Math.abs(value.y - anchor.y)
        ? { coordinate: "y", value: anchor.y } : { coordinate: "x", value: anchor.x };
      value = { ...value, [locked.coordinate]: locked.value };
    }
    const snapped = snapping ? snapPoint(value, elements, 10 / camera.scale, gridStep) : { point: value, kind: "none" };
    // A nearby endpoint/grid must not pull an orthogonal segment off its line.
    // The projected point is not that endpoint, so do not show an endpoint marker.
    if (locked && Math.abs(snapped.point[locked.coordinate] - locked.value) > 1e-9) {
      snapped.point = { ...snapped.point, [locked.coordinate]: locked.value };
      snapped.kind = "none";
    }
    const point = roundPoint(snapped.point);
    setCursor(point); setSnapKind(snapped.kind); onCursor(point, SNAP_LABELS[snapped.kind]);
    return point;
  }
  function select(p: Point) {
    const tolerance = 8 / camera.scale;
    // Structural edges win over the containing slab so small members remain selectable.
    const priority = { column: 0, beam: 1, wall: 2, axis: 3, slab: 4 };
    const ordered = [...elements].sort((a, b) => priority[a.type] - priority[b.type]);
    const hit = ordered.find((e) => {
      if (e.type === "axis") {
        const [a, b] = extendedAxisEndpoints(e);
        return segmentDistance(p, a, b) < tolerance;
      }
      const poly = elementFootprint(e);
      return insidePolygon(p, poly) || poly.some((a, i) => segmentDistance(p, a, poly[(i + 1) % poly.length]) < tolerance);
    });
    onSelect(hit?.id ?? null);
  }
  const min = world({ x: 0, y: size.height }), max = world({ x: size.width, y: 0 });
  const displayStep = gridStep * Math.max(1, Math.ceil(15 / (gridStep * camera.scale)));
  const gridXs: number[] = [], gridYs: number[] = [];
  for (let x = Math.ceil(min.x / displayStep) * displayStep; x <= max.x; x += displayStep) gridXs.push(x);
  for (let y = Math.ceil(min.y / displayStep) * displayStep; y <= max.y; y += displayStep) gridYs.push(y);
  const path = (points: Point[]) => points.map((p) => { const s = screen(p); return `${s.x},${s.y}`; }).join(" ");
  const rendered = [...elements].sort((a, b) => (a.type === "slab" ? -1 : 0) - (b.type === "slab" ? -1 : 0));
  const origin = screen({ x: 0, y: 0 });
  return <section className="hcad-view hcad-plan" aria-label="2B Çizim Penceresi">
    <div className="hcad-view-heading"><span><i className="hcad-dot" />2B Çizim Penceresi</span><span className="hcad-view-tag">ÜST GÖRÜNÜŞ</span></div>
    <div ref={host} className="hcad-plan-stage" data-testid="hsyncad-plan" data-camera={JSON.stringify(camera)} data-element-count={elements.length}>
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
                const scale = Math.max(6, Math.min(350, old.scale * (d1 > 0 ? d2 / d1 : 1)));
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
          resolve(p);
        }}
        onPointerUp={(event) => {
          const g = gesture.current;
          pointers.current.delete(event.pointerId);
          if (g.moved || g.pinch || g.pan) return;
          const p = local(event);
          if (tool === "select" || (tool === "move" && !selectedId)) select(world(p));
          else onPoint(resolve(p));
        }}
        onPointerCancel={(event) => { pointers.current.delete(event.pointerId); gesture.current.pinch = true; }}>
        <title>Metre tabanlı yapı planı. Eleman yerleştirmek için tıklayın; hassas giriş için koordinat kutusunu kullanın.</title>
        <g className="hcad-grid">{gridXs.map((x, i) => <line key={`x${i}`} x1={screen({ x, y: 0 }).x} x2={screen({ x, y: 0 }).x} y1={0} y2={size.height} />)}{gridYs.map((y, i) => <line key={`y${i}`} x1={0} x2={size.width} y1={screen({ x: 0, y }).y} y2={screen({ x: 0, y }).y} />)}</g>
        <g className="hcad-origin"><line x1={0} x2={size.width} y1={origin.y} y2={origin.y} /><line x1={origin.x} x2={origin.x} y1={0} y2={size.height} /></g>
        {gridXs.filter((_, i) => i % 2 === 0).map((x, i) => <text className="hcad-ruler" key={i} x={screen({ x, y: 0 }).x + 4} y={size.height - 8}>{+x.toFixed(2)}</text>)}
        {rendered.map((e) => {
          const color = TYPE_COLORS[e.type], selected = e.id === selectedId;
          const points = e.type === "axis" ? [e.start, e.end] : elementFootprint(e);
          const center = e.type === "column" ? e.position : { x: points.reduce((s, p) => s + p.x, 0) / points.length, y: points.reduce((s, p) => s + p.y, 0) / points.length };
          const label = screen(center);
          if (e.type === "axis") {
            const extended = extendedAxisEndpoints(e);
            const showStart = e.labelSide === "start" || e.labelSide === "both" || !e.labelSide;
            const showEnd = e.labelSide === "end" || e.labelSide === "both" || !e.labelSide;
            const sStart = screen(extended[0]), sEnd = screen(extended[1]);
            return (
              <g key={e.id} data-element-id={e.id} data-element-type="axis">
                <polyline points={path(extended)} fill="none" stroke={selected ? "#f59e0b" : color} strokeDasharray="9 5 2 5" strokeWidth={selected ? 3 : 1.3} />
                {showStart && (
                  <g>
                    <circle cx={sStart.x} cy={sStart.y} r={12} fill="var(--hc-panel)" stroke={selected ? "#f59e0b" : color} />
                    <text x={sStart.x} y={sStart.y + 4} textAnchor="middle" fill={selected ? "#f59e0b" : color} fontSize={10}>{e.name}</text>
                  </g>
                )}
                {showEnd && (
                  <g>
                    <circle cx={sEnd.x} cy={sEnd.y} r={12} fill="var(--hc-panel)" stroke={selected ? "#f59e0b" : color} />
                    <text x={sEnd.x} y={sEnd.y + 4} textAnchor="middle" fill={selected ? "#f59e0b" : color} fontSize={10}>{e.name}</text>
                  </g>
                )}
              </g>
            );
          }
          return <g key={e.id} data-element-id={e.id} data-element-type={e.type}>
            <polygon points={path(points)} fill={color} fillOpacity={e.type === "slab" ? 0.12 : 0.45} stroke={selected ? "#fbbf24" : color} strokeWidth={selected ? 3 : 1.5} />
            <text x={label.x + 8} y={label.y - 8} fill={color} fontSize={10} fontFamily="var(--font-mono)" paintOrder="stroke" stroke="var(--hc-bg)" strokeWidth={3}>{e.name}</text>
            {selected && points.map((p, i) => { const s = screen(p); return <rect key={i} x={s.x - 3} y={s.y - 3} width={6} height={6} fill="#fbbf24" />; })}
          </g>;
        })}
        {pending.length > 0 && <><polyline points={path(cursor ? [...pending, cursor] : pending)} stroke="#e3a342" strokeWidth={2} strokeDasharray="5 4" fill={tool === "slab" ? "#e3a34222" : "none"} />{pending.map((p, i) => { const s = screen(p); return <circle key={i} cx={s.x} cy={s.y} r={5} fill="#e3a342" />; })}</>}
        {cursor && tool !== "select" && tool !== "pan" && <g transform={`translate(${screen(cursor).x} ${screen(cursor).y})`} pointerEvents="none"><path d="M-14 0H14M0-14V14" stroke="#fbbf24" strokeWidth={1} />{snapKind !== "none" && <rect x={-5} y={-5} width={10} height={10} fill="none" stroke="#40cfb6" strokeWidth={2} />}</g>}
        <g transform={`translate(24 ${size.height - 42})`}><path d="M0 0H28M0 0V-28" fill="none" stroke="#7c8fa2" /><text x={30} y={4} fill="#7c8fa2" fontSize={10}>X</text><text x={-3} y={-33} fill="#7c8fa2" fontSize={10}>Y</text></g>
      </svg>
      {!elements.length && <div className="hcad-empty-plan"><span>İlk çizgiyle başlayın.</span><small>Bir araç seçin, plana tıklayın veya koordinat girin.</small></div>}
      <div className="hcad-canvas-controls"><button type="button" title="Yakınlaştır" aria-label="2B yakınlaştır" onClick={() => setCamera((c) => ({ ...c, scale: Math.min(350, c.scale * 1.25) }))}><Plus size={16} /></button><button type="button" title="Uzaklaştır" aria-label="2B uzaklaştır" onClick={() => setCamera((c) => ({ ...c, scale: Math.max(6, c.scale / 1.25) }))}><Minus size={16} /></button><button type="button" title="Çizimi sığdır" aria-label="Çizimi sığdır" onClick={fit}><Maximize2 size={16} /></button></div>
      <div className="hcad-plan-hint">{tool === "pan" ? "Sürükleyerek kaydırın" : "Tekerlek: yakınlaştır · İki parmak: kaydır / yakınlaştır"}</div>
    </div>
  </section>;
}

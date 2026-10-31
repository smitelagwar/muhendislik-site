"use client";

import { useEffect, useRef, useState } from "react";
import type { IdeElement } from "@/lib/hsyncad/ide-import";
import type { Point } from "@/lib/hsyncad/model";
import { axisEndLabels, fitPlanView, hitPlanElement, memberLabel, planBounds, planFontPixels, planGridStep, planPoints, slabLabelAnchor, type PlanCamera } from "@/lib/hsyncad/ide-plan-layout";

export const IDE_COLORS: Record<string, string> = { column: "#8d8db7", beam: "#00ed00", wall: "#9292bb", slab: "#dfedef", stair: "#9c9ca5", band: "#6060c0", section: "#565656", axis: "#ff6536", slabEdge: "#53538e", line: "#b6b2a5", unknown: "#8b8b8b" };
export const IDE_NAMES: Record<string, string> = { column: "Kolon", beam: "Kiriş", wall: "Perde / duvar", slab: "Döşeme", stair: "Merdiven ağı", band: "Bant kirişi · plan", section: "Kesit çizgisi", axis: "Aks", slabEdge: "Döşeme kenarı", line: "Çizgi", unknown: "Diğer" };

type Props = { elements: IdeElement[]; selectedId: string | null; onSelect: (id: string | null) => void; fitKey: number; labels: boolean };
type Camera = PlanCamera;

export default function IdePlan2D({ elements, selectedId, onSelect, fitKey, labels }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<Camera>({ x: 0, y: 0, scale: 10 });
  const current = useRef({ elements, selectedId, labels, onSelect });
  const drawRef = useRef<() => void>(() => {});
  const fitRef = useRef<() => void>(() => {});
  const zoomRef = useRef<(factor: number) => void>(() => {});
  const [tooltip, setTooltip] = useState<{ element: IdeElement; x: number; y: number } | null>(null);

  useEffect(() => {
    current.current = { elements, selectedId, labels, onSelect };
    drawRef.current();
  }, [elements, selectedId, labels, onSelect]);

  useEffect(() => {
    const canvas = canvasRef.current!, host = hostRef.current!, context = canvas.getContext("2d");
    if (!context) return;
    let width = 0, height = 0, frame = 0, fitted = true;
    let hoverTimer: ReturnType<typeof setTimeout> | undefined;
    const hideTooltip = () => { clearTimeout(hoverTimer); setTooltip(null); };
    const paint = () => {
      frame = 0;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#ffffff"; context.fillRect(0, 0, width, height);
      const camera = cameraRef.current;
      const toScreen = (p: Point) => ({ x: width / 2 + (p.x - camera.x) * camera.scale, y: height / 2 - (p.y - camera.y) * camera.scale });
      const scale = camera.scale, step = planGridStep(scale);
      canvas.dataset.scale = scale.toFixed(5);
      canvas.dataset.cameraX = camera.x.toFixed(5); canvas.dataset.cameraY = camera.y.toFixed(5);
      let axisLabelCount = 0;
      context.strokeStyle = "#dfdff2"; context.lineWidth = .6;
      context.beginPath();
      for (let x = Math.ceil((camera.x - width / 2 / scale) / step) * step; x < camera.x + width / 2 / scale; x += step) { const p = toScreen({ x, y: 0 }); context.moveTo(p.x, 0); context.lineTo(p.x, height); }
      for (let y = Math.ceil((camera.y - height / 2 / scale) / step) * step; y < camera.y + height / 2 / scale; y += step) { const p = toScreen({ x: 0, y }); context.moveTo(0, p.y); context.lineTo(width, p.y); }
      context.stroke();
      const path = (element: IdeElement) => {
        context.beginPath();
        const paths = element.planPaths?.length ? element.planPaths : [element.footprint?.length ? element.footprint : element.points];
        for (const points of paths) {
          if (!points.length) continue;
          const start = toScreen(points[0]); context.moveTo(start.x, start.y);
          for (const p of points.slice(1)) { const screen = toScreen(p); context.lineTo(screen.x, screen.y); }
          if (!element.planPaths?.length && points.length > 2) context.closePath();
        }
        for (const hole of element.holes ?? []) {
          if (!hole.length) continue;
          const start = toScreen(hole[0]); context.moveTo(start.x, start.y);
          for (const p of hole.slice(1)) { const screen = toScreen(p); context.lineTo(screen.x, screen.y); }
          context.closePath();
        }
      };
      const visible = (element: IdeElement) => {
        const b = planBounds(planPoints(element)), a = toScreen({ x: b.minX, y: b.maxY }), z = toScreen({ x: b.maxX, y: b.minY });
        return z.x > -90 && a.x < width + 90 && z.y > -90 && a.y < height + 90;
      };
      const elements = current.current.elements.filter(visible);
      // Slab fill, then axis/auxiliary linework, then physical member footprints.
      for (const element of elements.filter(e => e.type === "slab")) {
        path(element); context.fillStyle = "#e8f2f3"; context.fill("evenodd"); context.strokeStyle = "#484898"; context.lineWidth = .65; context.stroke();
      }
      for (const element of elements.filter(e => ["axis", "section", "line", "slabEdge"].includes(e.type))) {
        path(element); context.lineWidth = element.type === "axis" ? .6 : .55;
        context.strokeStyle = element.type === "axis" || element.type === "section" ? "#777777" : IDE_COLORS[element.type];
        context.setLineDash(element.type === "axis" || element.type === "section" ? [Math.max(13, .75 * scale), 4, 2, 4] : []); context.stroke(); context.setLineDash([]);
      }
      for (const element of elements.filter(e => e.type === "slab" && e.planAnnotation?.designAxes?.length)) {
        context.save(); path(element); context.clip("evenodd");
        for (const axis of element.planAnnotation!.designAxes!) {
          if (axis.points.length !== 2) continue;
          const a = toScreen(axis.points[0]), b = toScreen(axis.points[1]);
          context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y);
          context.strokeStyle = axis.direction === "x" ? "#17812a" : "#39389f";
          context.lineWidth = Math.min(2.5, .5 + .025 * scale); context.stroke();
        }
        context.restore();
      }
      const memberPriority = (e: IdeElement) => e.type === "wall" && e.structural === false ? 0 : e.type === "stair" ? 1 : e.type === "band" ? 2 : e.type === "beam" ? 5 : 3;
      for (const element of elements.filter(e => !["slab", "axis", "section", "line", "slabEdge"].includes(e.type)).sort((a, b) => memberPriority(a) - memberPriority(b))) {
        path(element);
        const filled = !element.planPaths?.length && (element.footprint?.length ?? 0) > 2;
        context.lineWidth = .7;
        context.strokeStyle = element.type === "beam" ? "#00bb00" : element.type === "wall" && element.structural === false ? "#c6bfae" : "#555599";
        if (filled) {
          context.fillStyle = element.type === "beam" ? "#00f000" : element.type === "wall" && element.structural === false ? "#faf9f5" : element.type === "band" ? "#ffffff" : "#aaaac1";
          context.fill("evenodd");
          if ((element.type === "wall" && element.structural !== false || element.type === "column") && scale >= 10) {
            context.save(); context.clip("evenodd");
            const b = planBounds(planPoints(element)), first = toScreen({ x: b.minX, y: b.maxY }), last = toScreen({ x: b.maxX, y: b.minY });
            const left = Math.max(-10, first.x), right = Math.min(width + 10, last.x), top = Math.max(-10, first.y), bottom = Math.min(height + 10, last.y), span = bottom - top;
            context.beginPath(); context.strokeStyle = "#8282ab"; context.lineWidth = .45;
            for (let x = left - span; x < right + span; x += Math.max(2.5, .08 * scale)) { context.moveTo(x, bottom); context.lineTo(x + span, top); }
            context.stroke(); context.restore();
            path(element);
          }
        }
        context.stroke();
      }
      // Selection is a separate overlay; it does not change drawing colours or label placement.
      const selected = elements.find(e => e.id === current.current.selectedId);
      if (selected) { path(selected); context.strokeStyle = "#0085ef"; context.lineWidth = 2; context.stroke(); }
      const font = planFontPixels(scale), labelVisible = font >= 2.5;
      context.textBaseline = "middle";
      if (current.current.labels || selected) for (const element of elements) {
        if (!current.current.labels && element !== selected) continue;
        if (element.type === "axis") {
          if (planFontPixels(scale, .23) < 2.4 && element !== selected) continue;
          const radius = Math.max(2.5, .18 * scale), textSize = Math.max(3.5, planFontPixels(scale, .23));
          context.font = `${textSize}px Arial`; context.textAlign = "center"; context.fillStyle = "#ff6335"; context.strokeStyle = "#ff6335"; context.lineWidth = .65;
          for (const anchor of axisEndLabels(element)) {
            const p = toScreen(anchor); context.beginPath(); context.arc(p.x, p.y, radius, 0, Math.PI * 2); context.fillStyle = "white"; context.fill(); context.stroke(); context.fillStyle = "#ff6335"; context.fillText(element.name, p.x, p.y + textSize * .035);
            if (p.x + radius >= 0 && p.x - radius <= width && p.y + radius >= 0 && p.y - radius <= height) axisLabelCount++;
          }
          continue;
        }
        if (!labelVisible && element !== selected) continue;
        if (["line", "slabEdge"].includes(element.type) || element.type === "wall" && element.structural === false) continue;
        if (element.type === "slab") {
          const loads = element.planAnnotation?.loads;
          const fullAnchor = slabLabelAnchor(element, loads ? 2.5 : .9, .55);
          const anchor = fullAnchor ?? slabLabelAnchor(element, .45, .55);
          if (!anchor) continue;
          const p = toScreen(anchor), r = .19 * scale, size = Math.max(2.5, font);
          context.font = `${size}px Arial`; context.strokeStyle = "#308442"; context.fillStyle = "#313596"; context.lineWidth = .55; context.textAlign = "center";
          const rx = Math.max(r, context.measureText(element.name).width / 2 + .035 * scale), cy = p.y + r;
          context.beginPath(); context.ellipse(p.x + rx, cy, rx, r, 0, 0, Math.PI * 2); context.stroke(); context.fillText(element.name, p.x + rx, cy);
          if (element.thickness !== undefined && font >= 3) { context.font = `${size * .85}px Arial`; context.fillStyle = "#358044"; context.fillText(`d=${Math.round(element.thickness * 100)}`, p.x + rx, cy + .27 * scale); }
          if (loads && fullAnchor && font >= 3) {
            const format = (value: number) => Number(value.toFixed(3)).toString();
            context.font = `${size}px Arial`; context.fillStyle = "#313596"; context.textAlign = "left";
            context.fillText(`G=${format(loads.dead)} ${loads.unit}`, p.x + rx * 2 + .08 * scale, cy);
            context.fillText(`Q=${format(loads.live)} ${loads.unit}`, p.x + rx * 2 + .08 * scale, cy + .25 * scale);
          }
        } else if (["beam", "wall", "column", "band"].includes(element.type)) {
          const placement = memberLabel(element); if (!placement) continue;
          const p = toScreen(placement.anchor), desired = Math.max(2, font), physicalLimit = element.width ? element.width * scale * .75 : desired;
          let textSize = Math.min(desired, physicalLimit); context.font = `${textSize}px Arial`;
          const measured = context.measureText(placement.text).width, available = Math.max(0, placement.length * scale - .16 * scale);
          if (measured > available) textSize *= available / measured;
          if (textSize < 2.3 && element !== selected) continue;
          context.save(); context.translate(p.x, p.y); context.rotate(placement.angle); context.font = `${Math.max(2.3, textSize)}px Arial`; context.fillStyle = "#333365"; context.textAlign = "left"; context.fillText(placement.text, 0, 0); context.restore();
        } else if (element.type === "section") {
          const [a, b] = [element.points[0], element.points.at(-1)]; if (!a || !b) continue;
          // The cut marker points normal to the guide (left for the source vertical B guide).
          const angle = Math.atan2(-(b.y - a.y), b.x - a.x) - Math.PI / 2;
          for (const anchor of [a, b]) { const p = toScreen(anchor); context.save(); context.translate(p.x, p.y); context.rotate(angle); context.beginPath(); context.moveTo(0, 0); context.lineTo(-.18 * scale, -.10 * scale); context.lineTo(-.18 * scale, .1 * scale); context.closePath(); context.fillStyle = "#555555"; context.fill(); context.restore(); context.fillStyle = "#555555"; context.font = `${Math.max(3, planFontPixels(scale, .2))}px Arial`; context.textAlign = "left"; context.fillText(element.name, p.x + .08 * scale, p.y + .1 * scale); }
        } else if (element.type === "stair") {
          const textSize = planFontPixels(scale, .09);
          if (textSize >= 2.4) for (const text of element.planTexts ?? []) {
            const p = toScreen(text.point); context.save(); context.translate(p.x, p.y); context.rotate(-(text.rotation ?? 0)); context.font = `${textSize}px Arial`; context.textAlign = "center"; context.fillStyle = "#66667c"; context.fillText(text.text, 0, 0); context.restore();
          }
          if (element === selected) { const b = planBounds(planPoints(element)), p = toScreen({ x: b.minX, y: b.maxY }); context.font = `${Math.max(5, font)}px Arial`; context.textAlign = "left"; context.fillStyle = "#666666"; context.fillText(element.name, p.x, p.y - font); }
        }
      }
      canvas.dataset.axisLabelCount = String(axisLabelCount);
      const scaleLength = step * scale;
      context.fillStyle = "#ffffffdd"; context.fillRect(10, height - 37, scaleLength + 20, 30);
      context.strokeStyle = "#697188"; context.lineWidth = 1; context.beginPath(); context.moveTo(18, height - 26); context.lineTo(18 + scaleLength, height - 26); context.stroke();
      context.font = "10px Arial"; context.fillStyle = "#555d6a"; context.textAlign = "left"; context.fillText(`${step.toLocaleString("tr-TR")} m`, 18, height - 12);
    };
    const draw = () => { if (!frame) frame = requestAnimationFrame(paint); };
    zoomRef.current = factor => { hideTooltip(); fitted = false; cameraRef.current.scale = Math.max(.05, Math.min(20_000, cameraRef.current.scale * factor)); draw(); };
    drawRef.current = draw;
    const fit = () => {
      hideTooltip();
      const camera = fitPlanView(current.current.elements, width, height);
      if (camera) cameraRef.current = camera;
      fitted = true;
      draw();
    };
    fitRef.current = fit;
    const resize = () => {
      const rect = host.getBoundingClientRect(), first = width === 0;
      width = Math.max(1, rect.width); height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      if (first || fitted) fit(); else draw();
    };
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    const world = (event: { clientX: number; clientY: number }) => { const r = canvas.getBoundingClientRect(), c = cameraRef.current; return { x: c.x + (event.clientX - r.left - width / 2) / c.scale, y: c.y - (event.clientY - r.top - height / 2) / c.scale }; };
    const wheel = (event: WheelEvent) => {
      hideTooltip();
      event.preventDefault(); fitted = false; const before = world(event), c = cameraRef.current;
      c.scale = Math.max(.05, Math.min(20_000, c.scale * Math.exp(-Math.max(-200, Math.min(200, event.deltaY)) * .002)));
      const after = world(event); c.x += before.x - after.x; c.y += before.y - after.y; draw();
    };
    let drag: { x: number; y: number; startX: number; startY: number; moved: boolean } | null = null;
    const pointers = new Map<number, { clientX: number; clientY: number }>();
    let pinch: { distance: number; anchor: Point } | null = null;
    const down = (e: PointerEvent) => { if (e.button !== 0 && e.button !== 1) return; hideTooltip(); canvas.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY }); drag = { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false }; if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), anchor: world({ clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 }) }; drag.moved = true; } };
    const move = (e: PointerEvent) => { if (!pointers.has(e.pointerId)) {
      clearTimeout(hoverTimer);
      const found = hitPlanElement(current.current.elements, world(e), 4 / cameraRef.current.scale);
      canvas.style.cursor = found ? "pointer" : "default";
      if (!found) { setTooltip(null); return; }
      setTooltip(previous => previous?.element.id === found.id ? previous : null);
      const rect = canvas.getBoundingClientRect(), x = Math.max(8, Math.min(width - 250, e.clientX - rect.left + 14)), y = Math.max(8, Math.min(height - 150, e.clientY - rect.top + 14));
      hoverTimer = setTimeout(() => setTooltip({ element: found, x, y }), 260); return;
    } pointers.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY }); if (pinch && pointers.size === 2) { fitted = false; const [a, b] = [...pointers.values()], middle = { clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 }, distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); const c = cameraRef.current; c.scale = Math.max(.05, Math.min(20_000, c.scale * distance / Math.max(1, pinch.distance))); const after = world(middle); c.x += pinch.anchor.x - after.x; c.y += pinch.anchor.y - after.y; pinch.distance = distance; draw(); return; } if (!drag) return; if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 4) drag.moved = true; if (drag.moved) { fitted = false; const c = cameraRef.current; c.x -= (e.clientX - drag.x) / c.scale; c.y += (e.clientY - drag.y) / c.scale; draw(); } drag.x = e.clientX; drag.y = e.clientY; };
    const up = (event: PointerEvent) => {
      pointers.delete(event.pointerId); const click = drag && !drag.moved && !pinch; drag = null; pinch = null;
      if (!click) return;
      const best = hitPlanElement(current.current.elements, world(event), 6 / cameraRef.current.scale);
      current.current.onSelect(best?.id ?? null);
    };
    const cancel = () => { hideTooltip(); drag = null; pointers.clear(); pinch = null; };
    canvas.addEventListener("wheel", wheel, { passive: false }); canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", cancel); canvas.addEventListener("dblclick", fit); canvas.addEventListener("pointerleave", hideTooltip);
    return () => { clearTimeout(hoverTimer); observer.disconnect(); if (frame) cancelAnimationFrame(frame); canvas.removeEventListener("wheel", wheel); canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", cancel); canvas.removeEventListener("dblclick", fit); canvas.removeEventListener("pointerleave", hideTooltip); drawRef.current = () => {}; fitRef.current = () => {}; };
  }, []);

  const floorKey = elements[0]?.floorId;
  useEffect(() => { fitRef.current(); }, [floorKey, fitKey]);
  const hover = tooltip && elements.includes(tooltip.element) ? tooltip : null;
  const number = (value: number) => Number(value.toFixed(3)).toString();
  return <div ref={hostRef} style={{ flex: 1, minWidth: 0, minHeight: 0, position: "relative", overflow: "hidden" }}>
    <canvas ref={canvasRef} data-testid="ide-plan-canvas" aria-label="IDE projesinin özgün koordinatlarından kat planı" role="img" style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }} />
    {hover && <div role="tooltip" data-testid="ide-plan-tooltip" style={{ position: "absolute", left: hover.x, top: hover.y, zIndex: 2, width: "max-content", maxWidth: "min(245px, calc(100% - 16px))", padding: "7px 9px", background: "#fffff3", color: "#45454e", border: "1px solid #8b8b92", boxShadow: "2px 2px 4px #0002", font: "11px/1.5 Arial", pointerEvents: "none" }}>
      <div>İsim: <strong>{hover.element.name}</strong></div>
      <div>Katman: {hover.element.type === "wall" && hover.element.structural === false ? "Duvar" : IDE_NAMES[hover.element.type]}</div>
      {hover.element.planAnnotation?.section && <div>Kesit: {hover.element.planAnnotation.section} cm</div>}
      {hover.element.width !== undefined && <div>Genişlik: {number(hover.element.width * 100)} cm</div>}
      {hover.element.thickness !== undefined && <div>Kalınlık: {number(hover.element.thickness * 100)} cm</div>}
      {hover.element.planAnnotation?.loads && <><div>G: {number(hover.element.planAnnotation.loads.dead)} tf/m²</div><div>Q: {number(hover.element.planAnnotation.loads.live)} tf/m²</div></>}
    </div>}
    <div style={{ position: "absolute", right: 10, bottom: 12, display: "flex", gap: 4 }}><button type="button" aria-label="IDE planını yakınlaştır" onClick={() => zoomRef.current(1.25)}>+</button><button type="button" aria-label="IDE planını uzaklaştır" onClick={() => zoomRef.current(.8)}>−</button></div>
  </div>;
}

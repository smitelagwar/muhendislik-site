import type { Point } from "@/lib/hsyncad/model";
import { draftingValues, isDraftingTool, type DraftingItem, type ReferenceFrame } from "@/lib/hsyncad/drafting";
import { regionLabelPoint } from "@/lib/hsyncad/regions";
import type { Tool } from "./editor-state";

export default function DraftingOverlay(p: { items: DraftingItem[]; frame?: ReferenceFrame; screen: (p: Point) => Point; size: { width: number; height: number }; scale: number; tool: Tool; pending: Point[]; cursor: Point | null; unit: "m" | "cm" }) {
  const { screen, size } = p;
  const ghost: DraftingItem[] = isDraftingTool(p.tool) && p.cursor && p.pending.length ? [{ id: "preview", name: "", kind: p.tool, floorId: "", points: [...p.pending, p.cursor] }] : [];
  const n = (v: number) => v.toLocaleString("tr-TR", { maximumFractionDigits: 3 });
  return <g className="hcad-drafting-overlay" pointerEvents="none">
    {[...p.items, ...ghost].map(item => {
      const values = draftingValues(item), points = item.points.map(screen), [a, b, c] = points, color = item.kind.startsWith("reference") ? "#bb4195" : "#147e96", draft = item.id === "preview";
      if (!a) return null;
      const label = item.kind === "measureArea" && points.length >= 3 ? screen(regionLabelPoint(item.points)) : item.kind === "measureAngle" && b ? { x: b.x + 18, y: b.y - 18 } : b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 10 } : { x: a.x + 12, y: a.y - 12 };
      const text = item.kind === "measureArea" ? `${n(values.area ?? 0)} m² · ${n((values.perimeter ?? 0) * (p.unit === "cm" ? 100 : 1))} ${p.unit}` : item.kind === "measureAngle" ? `${n(values.angle ?? 0)}°` : item.kind === "referencePoint" ? "O′" : `${n((values.length ?? 0) * (p.unit === "cm" ? 100 : 1))} ${p.unit}`;
      return <g key={item.id} data-drafting-kind={item.kind} opacity={draft ? 0.65 : 1}>
        {item.kind === "measureArea" ? <polygon points={points.map(q => `${q.x},${q.y}`).join(" ")} fill="#147e9610" stroke={color} strokeDasharray={draft ? "5 4" : undefined} /> : item.kind === "referenceLine" && b ? (() => { const len = Math.hypot(b.x - a.x, b.y - a.y), reach = Math.max(size.width, size.height) * 2 / (len || 1); return <line x1={a.x - (b.x - a.x) * reach} y1={a.y - (b.y - a.y) * reach} x2={b.x + (b.x - a.x) * reach} y2={b.y + (b.y - a.y) * reach} stroke={color} strokeDasharray="9 4 2 4" />; })() : <polyline points={points.map(q => `${q.x},${q.y}`).join(" ")} stroke={color} strokeWidth={1.3} fill="none" strokeDasharray={draft ? "5 4" : undefined} />}
        {points.map((q, i) => <g key={i} stroke={color}><line x1={q.x - 4} y1={q.y - 4} x2={q.x + 4} y2={q.y + 4} /><line x1={q.x - 4} y1={q.y + 4} x2={q.x + 4} y2={q.y - 4} /></g>)}
        {item.kind === "measureAngle" && a && b && c && <circle cx={b.x} cy={b.y} r={15} stroke={color} fill="none" strokeDasharray="2 3" />}
        <text x={label.x} y={label.y} fill={color} fontSize={11} paintOrder="stroke" stroke="var(--hc-panel)" strokeWidth={3} strokeLinejoin="round">{text}</text>
      </g>;
    })}
    {p.frame?.enabled && (() => { const o = screen(p.frame.origin), a = p.frame.angle * Math.PI / 180; return <g stroke="#bb4195" strokeWidth={1.5}><circle cx={o.x} cy={o.y} r={4} fill="none" /><line x1={o.x} y1={o.y} x2={o.x + 44 * Math.cos(a)} y2={o.y - 44 * Math.sin(a)} /><line x1={o.x} y1={o.y} x2={o.x - 44 * Math.sin(a)} y2={o.y - 44 * Math.cos(a)} /><text x={o.x + 8} y={o.y + 14} fill="#bb4195" strokeWidth={0} fontSize={10}>O′ · {n(p.frame.angle)}°</text></g>; })()}
  </g>;
}

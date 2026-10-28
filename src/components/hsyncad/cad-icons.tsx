import type { ReactNode } from "react";

/** Original vector artwork for hsynCAD; no native application images are embedded. */
export type CadIconName =
  | "axis" | "column" | "circle-column" | "polygon-column" | "beam" | "curve-beam"
  | "wall" | "slab" | "slab-edge" | "stairs" | "footing" | "raft" | "foundation"
  | "settings" | "floors" | "copy-floor" | "rigid" | "undo" | "redo" | "save" | "open"
  | "new" | "select" | "move" | "pan" | "delete" | "zoom" | "fit" | "measure" | "angle"
  | "area" | "reference" | "snap" | "grid" | "layer" | "model" | "analysis" | "report"
  | "drawing" | "steel" | "roof" | "door" | "window" | "offset" | "rotate" | "mirror"
  | "trim" | "extend" | "text" | "dimension" | "origin" | "search" | "wireframe"
  | "solid" | "front" | "top" | "iso" | "check";

const top = "#e8f0f3", front = "#a4bac8", side = "#7d9bad", accent = "#d49442", line = "#526f82";

function Prism({ x = 4, y = 21, w = 12, h = 8, d = 5, tone = front }: { x?: number; y?: number; w?: number; h?: number; d?: number; tone?: string }) {
  const dy = d * 0.6;
  return <>
    <path d={`M${x},${y - h}h${w}v${h}H${x}Z`} fill={tone} />
    <path d={`M${x},${y - h}l${d},${-dy}h${w}l${-d},${dy}Z`} fill={top} />
    <path d={`M${x + w},${y - h}l${d},${-dy}v${h}l${-d},${dy}Z`} fill={side} />
  </>;
}
function Cross({ x = 12, y = 12, r = 7 }: { x?: number; y?: number; r?: number }) {
  return <><path d={`M${x - r},${y}h${2 * r}M${x},${y - r}v${2 * r}`} /><circle cx={x} cy={y} r={2} fill={top} /></>;
}
function Grid({ inset = 3 }: { inset?: number }) {
  return <><path d={`M${inset},${inset}H${24 - inset}V${24 - inset}H${inset}Z`} /><path d="M8,3v18M15,3v18M3,8h18M3,15h18" strokeWidth={0.7} /></>;
}
const icons: Record<CadIconName, ReactNode> = {
  axis: <><path d="M12,7v15M7,13h15" strokeDasharray="5 2 1 2" /><circle cx={12} cy={4} r={3} fill={top} /><circle cx={4} cy={13} r={3} fill={top} /><text x={12} y={5.6} textAnchor="middle" fill={line} stroke="none" fontSize={4.8} fontFamily="Arial">A</text><text x={4} y={14.7} textAnchor="middle" fill={line} stroke="none" fontSize={4.8} fontFamily="Arial">1</text></>,
  column: <Prism x={6} y={22} w={7} h={16} d={5} />,
  "circle-column": <><path d="M7,5v15c0,3 10,3 10,0V5" fill={front} /><path d="M12,7v15c3,0 5,-1 5,-2V5" fill={side} stroke="none" /><ellipse cx={12} cy={5} rx={5} ry={2.5} fill={top} /><path d="M7,20c0,3 10,3 10,0" /></>,
  "polygon-column": <><path d="M6,6l5,2 7,-3v15l-7,3 -5,-2Z" fill={front} /><path d="M11,8v15l7,-3V5Z" fill={side} /><path d="M6,6l1,-3 6,-2 5,4 -7,3Z" fill={top} /></>,
  beam: <Prism x={2} y={17} w={16} h={6} d={4} />,
  "curve-beam": <><path d="M3,14Q10,3 21,10v6Q10,9 3,21Z" fill={front} /><path d="M3,14Q10,3 21,10l-1,-4Q8,-2 2,10Z" fill={top} /><path d="M21,10v6l-1,-4V6Z" fill={side} /></>,
  wall: <Prism x={3} y={22} w={15} h={14} d={3} />,
  slab: <><Prism x={2} y={20} w={15} h={2.5} d={6} /><path d="M6,15h9M10,12.7h8" strokeWidth={0.65} /></>,
  "slab-edge": <><path d="M2,18h14l6,-10H8Z" fill="#f3f0f7" strokeDasharray="4 2" /><path d="M2,18h14l6,-10" stroke="#ba629e" strokeWidth={2} /><rect x={1} y={17} width={2} height={2} fill={top} /><rect x={15} y={17} width={2} height={2} fill={top} /><rect x={21} y={7} width={2} height={2} fill={top} /></>,
  stairs: <><path d="M2,21v-4h4v-4h4V9h4V5h4V1h4v5l-4,4v4l-4,4v4Z" fill={front} /><path d="M2,17l4,-3M6,13l4,-3M10,9l4,-3M14,5l4,-3M18,1h4" stroke={side} /><path d="M4,22h13l5,-5" /></>,
  footing: <><Prism x={2} y={22} w={15} h={4} d={5} /><Prism x={7} y={17} w={5} h={12} d={4} /></>,
  raft: <><Prism x={2} y={21} w={14} h={3} d={7} /><path d="M6,16h13M9,13.5h12M7,18l6,-5M12,18l6,-5" strokeWidth={0.7} /></>,
  foundation: <><Prism x={2} y={22} w={15} h={3} d={4} /><Prism x={4} y={18} w={4} h={8} d={3} /><Prism x={13} y={18} w={4} h={8} d={3} /></>,
  settings: <><path d="M10,2h4l.7,3 2,.9 2.8,-1 2,3.3 -2.1,2.2v2.3l2.1,2.2 -2,3.3 -2.8,-1 -2,.9 -.7,3h-4l-.7,-3 -2,-.9 -2.8,1 -2,-3.3 2.1,-2.2v-2.3L2.5,8.2l2,-3.3 2.8,1 2,-.9Z" fill={front} /><circle cx={12} cy={11.7} r={3.5} fill={top} /></>,
  floors: <><path d="M3,3h18v18H3Z" fill={top} /><path d="M3,8h18M3,14h18M8,3v18" /><path d="M10,6h8M10,11h8M10,17h8" stroke={side} /></>,
  "copy-floor": <><path d="M3,3h12v14H3Z" fill={top} /><path d="M3,7h12M3,11h12" /><path d="M9,9h12v13H9Z" fill="#f4f5eb" /><path d="M9,13h12M9,17h12" stroke="#83926a" /><path d="M18,1v5m-2,-2 2,2 2,-2" stroke={accent} strokeWidth={1.6} /></>,
  rigid: <><path d="M2,19h20M5,19V8M19,19V8M5,8h14M5,19 19,8M5,8 19,19" /><path d="M5,8h14" stroke="#7e945b" strokeWidth={3} /><circle cx={5} cy={8} r={1.5} fill={accent} /><circle cx={19} cy={8} r={1.5} fill={accent} /></>,
  undo: <><path d="M9,5 3,10l6,5V11h6c4,0 5,3 3,7 5,-2 4,-10 -3,-10H9Z" fill={front} /></>,
  redo: <><path d="M15,5 21,10l-6,5v-4H9c-4,0 -5,3 -3,7 -5,-2 -4,-10 3,-10h6Z" fill={front} /></>,
  save: <><path d="M3,2h15l3,3v17H3Z" fill={front} /><path d="M6,2h10v7H6ZM6,14h12v8H6Z" fill={top} /><path d="M13,3h2v4h-2Z" fill={side} /><path d="M8,17h8M8,19h8" strokeWidth={0.6} /></>,
  open: <><path d="M2,6h8l2,3h10l-3,12H2Z" fill="#e5c68b" stroke="#9b855c" /><path d="M2,10h20l-3,11H2Z" fill="#f0d89f" stroke="#9b855c" /><path d="M11,2v5m-2,-2 2,2 2,-2" stroke={side} strokeWidth={1.5} /></>,
  new: <><path d="M5,2h10l5,5v15H5Z" fill={top} /><path d="M15,2v5h5M8,11h9M8,15h6" /><path d="M3,4h6M6,1v6" stroke="#729450" strokeWidth={1.8} /></>,
  select: <path d="M5,2 20,13l-8,1 -4,8Z" fill={top} />,
  move: <><path d="M12,2v20M2,12h20M8,6l4,-4 4,4M8,18l4,4 4,-4M6,8l-4,4 4,4M18,8l4,4 -4,4" /><rect x={10} y={10} width={4} height={4} fill={top} /></>,
  pan: <path d="M6,12V5c0,-2 3,-2 3,0v5V3c0,-2 3,-2 3,0v7V4c0,-2 3,-2 3,0v6V6c0,-2 3,-2 3,0v9c0,4 -3,7 -7,7 -4,0 -6,-5 -8,-7 -2,-2 -1,-4 1,-3l3,3" fill={top} />,
  delete: <><path d="M5,6h14l-1,16H6ZM3,6h18M8,3h8v3M9,9v10M15,9v10" fill={top} /><path d="M8,1h8" stroke={accent} /></>,
  zoom: <><circle cx={10} cy={10} r={6.5} fill={top} /><path d="m15,15 7,7" strokeWidth={3} /><path d="M6,10h8M10,6v8" stroke={side} /></>,
  fit: <><path d="M2,9V2h7M15,2h7v7M22,15v7h-7M9,22H2v-7" /><path d="M7,7h10v10H7Z" fill={top} /><path d="M5,5 9,9M19,5 15,9M19,19l-4,-4M5,19l4,-4" stroke={side} /></>,
  measure: <><path d="m2,17 15,-15 5,5 -15,15Z" fill="#e8d5a7" stroke="#8d8168" /><path d="m6,16 2,2m1,-5 2,2m1,-5 2,2m1,-5 2,2" stroke="#8d8168" /><path d="m3,20 -2,3" /></>,
  angle: <><path d="M3,3v18h19M3,21 19,5" /><path d="M3,11a10,10 0 0 1 7,3" stroke="#7b965e" strokeWidth={2} /><text x={12} y={17} fill="#7b965e" stroke="none" fontSize={7}>α</text></>,
  area: <><path d="M3,18 6,3 20,6 21,19 11,22Z" fill="#dfead3" stroke="#7e945e" /><path d="m6,16 9,-9M8,20 19,9M4,11l6,-6M14,20l5,-5" stroke="#98ad78" strokeWidth={0.65} /><circle cx={6} cy={3} r={1.5} fill={top} /><circle cx={21} cy={19} r={1.5} fill={top} /></>,
  reference: <><path d="M2,19 22,5M2,6h20M7,2v20" strokeDasharray="5 2 1 2" /><circle cx={7} cy={6} r={2} fill={top} /><circle cx={7} cy={15.5} r={2} fill={top} /></>,
  snap: <><path d="M5,2v10a7,7 0 0 0 14,0V2h-5v10a2,2 0 0 1 -4,0V2Z" fill={front} /><path d="M5,6h5M14,6h5" /><path d="M4,21 1,23M20,21l3,2M12,21v3" stroke={accent} /></>,
  grid: <Grid />,
  layer: <><path d="m2,8 10,-6 10,6 -10,6Z" fill={top} /><path d="m2,12 10,6 10,-6M2,16l10,6 10,-6" strokeWidth={1.7} /></>,
  model: <><path d="m3,7 9,-5 9,5v11l-9,5 -9,-5Z" fill={front} /><path d="m3,7 9,5 9,-5 -9,-5Z" fill={top} /><path d="M12,12v11l9,-5V7Z" fill={side} /></>,
  analysis: <><path d="M3,22V2M3,21h19" /><path d="M5,18 9,11l4,4 6,-11" stroke="#5c8a9d" strokeWidth={1.8} /><path d="m15,4 4,0 0,4" stroke="#5c8a9d" /><path d="M5,5h4M5,8h2" stroke="#bd8756" /></>,
  report: <><path d="M4,2h13l4,4v16H4Z" fill={top} /><path d="M17,2v5h4M7,6h6M7,10h11M7,13h11M7,16h11M7,19h8" /><path d="M2,3v17" stroke={accent} /></>,
  drawing: <><path d="M3,2h18v20H3Z" fill={top} /><path d="M6,7h12v10H6ZM10,7v10M6,12h12" /><path d="m12,21 8,-8 2,2 -8,8Z" fill="#dfb76c" stroke="#9b855c" /></>,
  steel: <><path d="M5,3h14v4h-5v10h5v4H5v-4h5V7H5Z" fill={front} /><path d="M5,3 8,1h14l-3,2M19,7l3,-2V1M19,21l3,-2v-4l-3,2" fill={side} /></>,
  roof: <><path d="m1,14 10,-12 12,10 -11,-3Z" fill={top} /><path d="m1,14 11,-5 11,3v3l-11,-3L1,17Z" fill={front} /><path d="M5,17v5h14v-6" /></>,
  door: <><path d="M3,22V2h15v20M6,22V5h9v17" /><path d="M6,5 13,8v15l-7,-3Z" fill={front} /><circle cx={11} cy={15} r={0.7} fill={accent} /></>,
  window: <><path d="M3,3h18v18H3Z" fill={top} /><path d="M6,6h12v12H6ZM12,6v12M6,12h12M2,22h20" /><path d="m7,9 3,-2m4,9 3,-2" stroke="#9fbdca" /></>,
  offset: <><path d="M2,7h20M2,17h20" strokeDasharray="5 2" /><path d="M8,3v18M5,10l3,-3 3,3M5,14l3,3 3,-3" stroke={accent} /><path d="M15,7v10" /></>,
  rotate: <><path d="M20,9a8,8 0 1 0 -1,9M20,3v6h-6" /><path d="M8,8h7v7H8Z" fill={top} /><circle cx={12} cy={12} r={1} fill={accent} /></>,
  mirror: <><path d="M12,1v22" strokeDasharray="3 2" /><path d="M3,5v14l6,-7Z" fill={front} /><path d="M21,5v14l-6,-7Z" fill={top} /></>,
  trim: <><path d="M8,2v20M2,16h20M3,5l18,10" /><path d="M8,16h14" stroke="#c36d55" strokeWidth={2} strokeDasharray="3 2" /><path d="m16,18 5,5m0,-5 -5,5" stroke="#c36d55" /></>,
  extend: <><path d="M18,2v20M2,16h9" /><path d="M11,16h7m-4,-3 4,3 -4,3" stroke={accent} strokeWidth={1.6} /></>,
  text: <><path d="M3,4h18M12,4v17M8,21h8M3,4v4M21,4v4" strokeWidth={1.8} /><path d="M2,1h20" stroke={side} strokeWidth={0.5} /></>,
  dimension: <><path d="M4,2v20M20,2v20M1,7h22" /><path d="m2,9 4,-4m12,4 4,-4" strokeWidth={1.7} /><path d="M7,16h10v5H7Z" fill={top} /><text x={12} y={20} textAnchor="middle" fill={line} stroke="none" fontSize={4.5}>125</text></>,
  origin: <><Cross /><path d="M12,5V1m-2,2 2,-2 2,2M19,12h4m-2,-2 2,2 -2,2" stroke={accent} /><text x={14} y={21} fill={line} stroke="none" fontSize={5}>0,0</text></>,
  search: <><circle cx={10} cy={10} r={7} fill={top} /><path d="m15,15 7,7" strokeWidth={3} /></>,
  wireframe: <><path d="m3,7 9,-5 9,5v11l-9,5 -9,-5ZM3,7l9,5 9,-5M12,12v11" /><path d="M3,18l9,-5 9,5M12,2v11" strokeDasharray="2 2" strokeWidth={0.7} /></>,
  solid: <><path d="m3,7 9,-5 9,5v11l-9,5 -9,-5Z" fill={front} /><path d="m3,7 9,5 9,-5 -9,-5Z" fill={top} /><path d="M12,12v11l9,-5V7Z" fill={side} /></>,
  front: <><path d="M3,4h18v17H3Z" fill={front} /><path d="M7,8h4v6H7M15,8h3v6h-3M11,21v-4h4v4" fill={top} /><path d="M2,23h20" /></>,
  top: <><path d="M3,3h18v18H3Z" fill={top} /><path d="M3,10h10V3M13,10v11M13,15h8" strokeWidth={2} /><path d="M7,1v3M20,7h3" stroke={accent} /></>,
  iso: <><path d="M12,2v11l-9,6M12,13l9,6" /><path d="M9,5l3,-3 3,3M3,15v4h4M17,19h4v-4" /><path d="m5,8 7,-4 7,4v8l-7,4 -7,-4Z" fill="#e8f0f365" /><path d="m5,8 7,4 7,-4M12,12v8" /></>,
  check: <path d="m3,12 6,7 13,-15" stroke="#799c57" strokeWidth={3} />,
};

export default function CadIcon({ name, size = 20, className }: { name: CadIconName; size?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={line} strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{icons[name]}</svg>;
}

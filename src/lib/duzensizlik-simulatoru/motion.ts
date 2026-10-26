import type { ScenarioId } from "./scenarios";

export type V3 = readonly [number, number, number];
export const LEVEL_HEIGHT = 1.6;
export const LEVELS = 5;
export const FRAME_SPAN = 3.2;
// Model-space proportions for schematic concrete members (not real dimensions).
export const COLUMN_SECTION = 0.26;
export const BEAM_SECTION = 0.24;
export const SLAB_THICKNESS = 0.12;
// Keep slabs just above beams: no coplanar beam/slab surfaces or z-fighting.
export const SLAB_LIFT = BEAM_SECTION / 2 + SLAB_THICKNESS / 2 + 0.005;
export const WALL_BAY_DEPTH = FRAME_SPAN;
// A small overlap avoids a hairline gap at the column face during motion.
export const BEAM_FACE_TRIM = COLUMN_SECTION / 2 - 0.02;

export interface Segment {
  a: V3;
  b: V3;
  kind: "column" | "beam" | "wall" | "highlight" | "transfer";
  storey: number;
}
export interface Slab {
  cx: number;
  cz: number;
  width: number;
  depth: number;
  level: number;
  kind?: "normal" | "outline";
}
export interface Blueprint {
  segments: Segment[];
  slabs: Slab[];
  bounds: { min: V3; max: V3 };
}
/** Pure, deterministic *illustrative* joint displacement, not an FEM result. */
export function jointAt(base: V3, scenario: ScenarioId, phase: number, strength = 1): V3 {
  const [x, y, z] = base;
  const level = Math.max(0, Math.min(LEVELS, y / LEVEL_HEIGHT));
  if (level === 0 || strength <= 0) return [x, y, z];
  const h = level / LEVELS;
  const wave = Math.sin(phase) * strength;
  let shift = 0.08 * h;
  if (scenario === "B2") shift = 0.36 + (level - 1) * 0.018;
  else if (scenario === "B1") shift = 0.065 * h;
  else if (scenario === "A2" || scenario === "B3") shift = 0.036 * h;
  else if (scenario === "A3") shift = 0.09 * h;
  // A1: a *single coherent floor rotation*, applied to EVERY joint and slab.
  const angle = scenario === "A1" ? wave * 0.062 * h : 0;
  const co = Math.cos(angle), si = Math.sin(angle);
  const dx = x + 0.7, dz = z; // offset rotation centre
  return [-0.7 + co * dx - si * dz + shift * wave, y, si * dx + co * dz];
}
export function segmentPose(a: V3, b: V3, trimStart = 0, trimEnd = 0) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const length = Math.hypot(dx, dy, dz);
  const visibleLength = length - trimStart - trimEnd;
  if (!Number.isFinite(length) || !Number.isFinite(visibleLength) ||
      !Number.isFinite(trimStart) || !Number.isFinite(trimEnd) ||
      trimStart < 0 || trimEnd < 0 || visibleLength < 1e-7) return null;
  const direction: V3 = [dx/length, dy/length, dz/length];
  const shift = (trimStart - trimEnd) / 2;
  return {
    mid: [(a[0]+b[0])/2 + direction[0]*shift,
          (a[1]+b[1])/2 + direction[1]*shift,
          (a[2]+b[2])/2 + direction[2]*shift] as V3,
    direction,
    length: visibleLength,
  };
}

/** A slab uses the SAME floor transform as its framing joints. Three.js
 * positive Y rotation moves +X toward -Z; jointAt uses the opposite sense. */
export function slabPose(center: V3, scenario: ScenarioId, phase: number, strength = 1) {
  const p = jointAt(center, scenario, phase, strength);
  const q = jointAt([center[0]+1,center[1],center[2]], scenario, phase, strength);
  return {
    position: [p[0],p[1]+SLAB_LIFT,p[2]] as V3,
    yaw: -Math.atan2(q[2]-p[2], q[0]-p[0]),
  };
}
const v = (x: number,y: number,z: number): V3 => [x,y,z];

export function makeBlueprint(id: ScenarioId): Blueprint {
  const segments: Segment[] = [];
  const slabs: Slab[] = [];
  const xs = [-FRAME_SPAN, 0, FRAME_SPAN];
  const zs = [-FRAME_SPAN, 0, FRAME_SPAN];
  const add = (a: V3, b: V3, kind: Segment["kind"], storey: number) => segments.push({a,b,kind,storey});
  for(let level = 1; level <= LEVELS; level++) {
    const y0 = (level - 1) * LEVEL_HEIGHT, y1 = level * LEVEL_HEIGHT;
    for (const x of xs) for(const z of zs) {
      // B3: the *intermediate* first-storey column is missing; the beam
      // spanning between both outer supports transfers its upper load.
      if (id === "B3" && level === 1 && x === 0 && z === FRAME_SPAN) continue;
      if (id === "A2" && x === 0 && z === 0) continue;
      add(v(x,y0,z),v(x,y1,z),"column",level);
    }
    for (const z of zs) {
      if (id === "A2" && level === 3 && z === 0) continue;
      if (id === "B3" && level === 1 && z === FRAME_SPAN) {
        // A simply-supported transfer example, NOT an end-supported cantilever.
        add(v(-FRAME_SPAN,y1,z),v(FRAME_SPAN,y1,z),"transfer",level);
      } else {
        add(v(-FRAME_SPAN,y1,z),v(0,y1,z),"beam",level);
        add(v(0,y1,z),v(FRAME_SPAN,y1,z),"beam",level);
      }
    }
    for (const x of xs) {
      if (id === "A2" && level === 3 && x === 0) continue;
      add(v(x,y1,-FRAME_SPAN),v(x,y1,0),"beam",level);
      add(v(x,y1,0),v(x,y1,FRAME_SPAN),"beam",level);
    }
    // Only the THIRD floor has a slab aperture in the A2 example.
    if (id === "A2" && level === 3) {
      slabs.push(
        {cx:-2.65,cz:0,width:1.1,depth:6.4,level},
        {cx:2.65,cz:0,width:1.1,depth:6.4,level},
        {cx:0,cz:-2.65,width:4.2,depth:1.1,level},
        {cx:0,cz:2.65,width:4.2,depth:1.1,level},
      );
      // Four sides of the hole, in the actual slab plane.
      const n = 2.1;
      add(v(-n,y1,-n),v(n,y1,-n),"highlight",level);
      add(v(n,y1,-n),v(n,y1,n),"highlight",level);
      add(v(n,y1,n),v(-n,y1,n),"highlight",level);
      add(v(-n,y1,n),v(-n,y1,-n),"highlight",level);
    } else {
      slabs.push({cx:0,cz:0,width:6.4,depth:6.4,level});
    }
    if (id === "A3") {
      // L-shaped wing: 3.2 x 3.2 projection, true re-entrant corner.
      for(const z of [-FRAME_SPAN,0]) add(v(6.4,y0,z),v(6.4,y1,z),"column",level);
      add(v(FRAME_SPAN,y1,-FRAME_SPAN),v(6.4,y1,-FRAME_SPAN),"beam",level);
      add(v(FRAME_SPAN,y1,0),v(6.4,y1,0),"beam",level);
      add(v(6.4,y1,-FRAME_SPAN),v(6.4,y1,0),"beam",level);
      slabs.push({cx:4.8,cz:-1.6,width:3.2,depth:3.2,level});
      if(level===3) {
        add(v(3.2,y1,0),v(3.65,y1,0),"highlight",level);
        add(v(3.2,y1,0),v(3.2,y1,.45),"highlight",level);
      }
    }
    if (id === "A1") {
      add(v(-FRAME_SPAN,y0,-FRAME_SPAN/2),v(-FRAME_SPAN,y1,-FRAME_SPAN/2),"wall",level);
    }
    if (id === "B2" && level > 1) {
      add(v(0,y0,-FRAME_SPAN/2),v(0,y1,-FRAME_SPAN/2),"wall",level);
    }
    if (id === "B1" && level === 1) {
      // Introductory *section emphasis*, not verified capacity.
      add(v(-FRAME_SPAN,y0,-FRAME_SPAN),v(-FRAME_SPAN,y1,-FRAME_SPAN),"highlight",level);
    }
  }
  return {segments,slabs,bounds:{
    min: [id==="A3"?-3.8:id==="B2"?-3.9:-3.55,-.45,-3.55],
    // Includes B2 first-storey offset and the animated A3 wing tip.
    max: [id==="A3"?7:id==="B2"?3.9:3.55, LEVELS*LEVEL_HEIGHT+.35,3.55],
  }};
}

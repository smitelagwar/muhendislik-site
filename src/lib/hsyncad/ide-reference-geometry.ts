import * as ThreeRuntime from "three";
import type * as ThreeTypes from "three/src/Three.js";
import type { IdeElement, IdePoint } from "./ide-import";
const THREE = ThreeRuntime as unknown as typeof ThreeTypes;
const ring = (points: IdePoint[]) => points.length > 2 && points[0].x === points.at(-1)!.x && points[0].y === points.at(-1)!.y ? points.slice(0, -1) : points;

/** Reference geometry retains native world elevations and inner rings. */
export function ideReferenceGeometry(e: IdeElement): ThreeTypes.BufferGeometry | null {
  if (e.mesh) {
    const world = new Float32Array(e.mesh.positions.length);
    for (let i = 0; i < world.length; i += 3) { world[i] = e.mesh.positions[i]; world[i + 1] = e.mesh.positions[i + 2]; world[i + 2] = -e.mesh.positions[i + 1]; }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(world, 3));
    if (e.mesh.indices) geometry.setIndex(e.mesh.indices);
    return geometry;
  }
  if (e.planOnly || e.bottom === undefined || e.top === undefined || e.top <= e.bottom) return null;
  const points = ring(e.footprint ?? ((e.type === "column" || e.type === "slab") ? e.points : []));
  if (points.length < 3) return null;
  const shape = new THREE.Shape(points.map(p => new THREE.Vector2(p.x, p.y)));
  for (const hole of e.holes ?? []) if (hole.length >= 3) shape.holes.push(new THREE.Path(ring(hole).map(p => new THREE.Vector2(p.x, p.y))));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: e.top - e.bottom, bevelEnabled: false, steps: 1, curveSegments: 1 });
  geometry.rotateX(-Math.PI / 2); geometry.translate(0, e.bottom, 0);
  return geometry;
}

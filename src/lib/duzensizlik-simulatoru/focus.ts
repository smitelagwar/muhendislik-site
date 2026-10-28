import { FRAME_SPAN, LEVEL_HEIGHT, SLAB_LIFT, jointAt, type V3 } from "./motion";
import type { ScenarioId } from "./scenarios";

export type FocusRole = "primary" | "comparison";
export interface FocusPoint {
  /** A pair marks a member bay; a single coordinate marks a floor node/void. */
  id: string;
  start: V3;
  end?: V3;
  role: FocusRole;
  /** Elevate a badge without changing the floor joint's angular motion. */
  lift?: number;
}

/** Scene markers and the explanation card share this scenario registry.
 * Coordinates are illustrative, never a computed code-check result. */
export const FOCUS_POINTS: Record<ScenarioId, readonly FocusPoint[]> = {
  A1: [
    { id: "near-edge", start: [FRAME_SPAN, 4 * LEVEL_HEIGHT, -FRAME_SPAN], role: "primary", lift: SLAB_LIFT },
    { id: "far-edge", start: [FRAME_SPAN, 4 * LEVEL_HEIGHT, FRAME_SPAN], role: "comparison", lift: SLAB_LIFT },
  ],
  A2: [{ id: "third-floor-opening", start: [0, 3 * LEVEL_HEIGHT, 0], role: "primary", lift: .4 }],
  A3: [{ id: "reentrant-corner", start: [FRAME_SPAN, 3 * LEVEL_HEIGHT, 0], role: "primary", lift: SLAB_LIFT }],
  B1: [{ id: "weak-first-storey", start: [-FRAME_SPAN, 0, -FRAME_SPAN], end: [-FRAME_SPAN, LEVEL_HEIGHT, -FRAME_SPAN], role: "primary" }],
  B2: [{ id: "soft-first-storey", start: [0, 0, FRAME_SPAN], end: [0, LEVEL_HEIGHT, FRAME_SPAN], role: "primary" }],
  B3: [{ id: "interrupted-column", start: [0, 0, FRAME_SPAN], end: [0, LEVEL_HEIGHT, FRAME_SPAN], role: "primary" }],
};

/** Follow actual animated joints so the focus never detaches from the model. */
export function focusAnchorAt(point: FocusPoint, scenario: ScenarioId, phase: number, intensity: number): V3 {
  const a = jointAt(point.start,scenario,phase,intensity);
  if(!point.end) return [a[0],a[1]+(point.lift??0),a[2]];
  const b = jointAt(point.end,scenario,phase,intensity);
  return [(a[0]+b[0])/2,(a[1]+b[1])/2+(point.lift??0),(a[2]+b[2])/2];
}

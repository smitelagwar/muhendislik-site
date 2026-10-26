import type { Blueprint } from "./motion";

/** Conservative visual fit for an oblique 3D structure.
 * Models tend to be over-zoomed-out on phones when the ENTIRE 3D diagonal
 * is divided by horizontal FOV. Fit the horizontal footprint separately. */
export function cameraFitDistance(bounds: Blueprint["bounds"], aspect: number, fovDegrees=40) {
  const width=Math.max(0.001,bounds.max[0]-bounds.min[0]);
  const height=Math.max(0.001,bounds.max[1]-bounds.min[1]);
  const depth=Math.max(0.001,bounds.max[2]-bounds.min[2]);
  const safeAspect=Number.isFinite(aspect)?Math.max(.2,aspect):1;
  const safeFov=Number.isFinite(fovDegrees)?Math.max(15,Math.min(85,fovDegrees)):40;
  const halfVert=Math.tan(safeFov*Math.PI/360);
  const halfHoriz=halfVert*safeAspect;
  const horizontalRadius=Math.hypot(width,depth)*.5;
  const verticalRadius=Math.hypot(height,depth)*.5;
  // Margin handles columns, slab outlines and oblique view presets.
  return Math.min(90,Math.max(13,1.14*Math.max(horizontalRadius/halfHoriz,verticalRadius/halfVert)));
}

export function smootherStep(t:number) {
  const u=Math.max(0,Math.min(1,t));
  return u*u*u*(u*(u*6-15)+10);
}

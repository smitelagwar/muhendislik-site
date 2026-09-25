import type { CadBBox2D } from "../canonical/types";
import type { CadCameraState } from "../interaction/d3-camera-adapter";

/** Kameranın CSS piksel ölçülerini konservatif bir dünya koordinatı bbox'ına çevirir. */
export function getCameraWorldViewportBBox(
  camera: CadCameraState,
  paddingCssPixels = 1
): CadBBox2D | null {
  const { center, width, height, unitsPerCssPixel } = camera;
  if (
    !Number.isFinite(center[0]) || !Number.isFinite(center[1]) ||
    !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 ||
    !Number.isFinite(unitsPerCssPixel) || unitsPerCssPixel <= 0
  ) {
    return null;
  }

  const padding = Number.isFinite(paddingCssPixels) ? Math.max(0, paddingCssPixels) : 0;
  const halfWidth = (width / 2 + padding) * unitsPerCssPixel;
  const halfHeight = (height / 2 + padding) * unitsPerCssPixel;
  return [
    center[0] - halfWidth,
    center[1] - halfHeight,
    center[0] + halfWidth,
    center[1] + halfHeight,
  ];
}

/** Geçersiz/legacy bounds için fail-open davranır; geçerli bounds kamera dışında kalabilir. */
export function isChunkVisibleInCamera(
  chunkBBox: CadBBox2D | undefined,
  camera: CadCameraState,
  paddingCssPixels = 1
): boolean {
  if (!chunkBBox) return true;
  if (
    chunkBBox.length !== 4 || !chunkBBox.every(Number.isFinite) ||
    chunkBBox[0] > chunkBBox[2] || chunkBBox[1] > chunkBBox[3]
  ) {
    return true;
  }

  const viewport = getCameraWorldViewportBBox(camera, paddingCssPixels);
  if (!viewport) return true;
  return !(
    chunkBBox[2] < viewport[0] || chunkBBox[0] > viewport[2] ||
    chunkBBox[3] < viewport[1] || chunkBBox[1] > viewport[3]
  );
}

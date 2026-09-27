// ============================================================================
// DÖKÜMANTASYON — IMAGE VIEWER SAF GEOMETRİ YARDIMCILARI
// ============================================================================

export type ImageViewerPoint = {
  x: number;
  y: number;
};

export type ImageViewerCamera = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export type ImageViewerSize = {
  width: number;
  height: number;
};

export const IMAGE_VIEWER_MIN_SCALE = 0.02;
export const IMAGE_VIEWER_MAX_SCALE = 5;

export function clampImageScale(value: number): number {
  return Math.min(
    Math.max(value, IMAGE_VIEWER_MIN_SCALE),
    IMAGE_VIEWER_MAX_SCALE
  );
}

export function getImagePointerDistance(
  first: ImageViewerPoint,
  second: ImageViewerPoint
): number {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

export function getImagePointerMidpoint(
  first: ImageViewerPoint,
  second: ImageViewerPoint
): ImageViewerPoint {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

export function getImageDisplaySize(
  naturalSize: ImageViewerSize,
  scale: number,
  rotation: number
): ImageViewerSize {
  const safeScale = clampImageScale(scale);
  const isQuarterTurn = rotation % 180 !== 0;

  return {
    width: (isQuarterTurn ? naturalSize.height : naturalSize.width) * safeScale,
    height: (isQuarterTurn ? naturalSize.width : naturalSize.height) * safeScale,
  };
}

export function clampImageCamera(
  candidate: ImageViewerCamera,
  viewport: ImageViewerSize,
  naturalSize: ImageViewerSize,
  rotation: number
): ImageViewerCamera {
  const scale = clampImageScale(candidate.scale);
  const displaySize = getImageDisplaySize(naturalSize, scale, rotation);
  const maxOffsetX = Math.max(0, (displaySize.width - viewport.width) / 2);
  const maxOffsetY = Math.max(0, (displaySize.height - viewport.height) / 2);

  return {
    scale,
    offsetX: Math.min(Math.max(candidate.offsetX, -maxOffsetX), maxOffsetX),
    offsetY: Math.min(Math.max(candidate.offsetY, -maxOffsetY), maxOffsetY),
  };
}

export function computeImageFitScale(
  viewport: ImageViewerSize,
  naturalSize: ImageViewerSize,
  rotation: number,
  padding: number
): number {
  const availableWidth = Math.max(viewport.width - padding, 1);
  const availableHeight = Math.max(viewport.height - padding, 1);
  const isQuarterTurn = rotation % 180 !== 0;
  const imageWidth = isQuarterTurn ? naturalSize.height : naturalSize.width;
  const imageHeight = isQuarterTurn ? naturalSize.width : naturalSize.height;
  const fitRatio = Math.min(
    availableWidth / imageWidth,
    availableHeight / imageHeight,
    1
  );

  return parseFloat(clampImageScale(fitRatio).toFixed(3));
}

export function zoomImageCameraBetweenPoints(
  startCamera: ImageViewerCamera,
  targetScale: number,
  startPoint: ImageViewerPoint,
  targetPoint: ImageViewerPoint,
  viewport: ImageViewerSize,
  naturalSize: ImageViewerSize,
  rotation: number
): ImageViewerCamera {
  const safeStartScale = clampImageScale(startCamera.scale);
  const safeTargetScale = clampImageScale(targetScale);
  const scaleRatio = safeTargetScale / safeStartScale;
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;

  const anchorFromCameraX = startPoint.x - centerX - startCamera.offsetX;
  const anchorFromCameraY = startPoint.y - centerY - startCamera.offsetY;

  return clampImageCamera(
    {
      scale: safeTargetScale,
      offsetX:
        targetPoint.x - centerX - anchorFromCameraX * scaleRatio,
      offsetY:
        targetPoint.y - centerY - anchorFromCameraY * scaleRatio,
    },
    viewport,
    naturalSize,
    rotation
  );
}

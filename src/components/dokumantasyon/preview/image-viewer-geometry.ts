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
export const IMAGE_VIEWER_MAX_ZOOM = 8;

export type ImageViewerScaleLimits = {
  minScale: number;
  maxScale: number;
};

export function clampImageScale(value: number): number {
  if (!Number.isFinite(value)) return IMAGE_VIEWER_MIN_SCALE;

  return Math.min(
    Math.max(value, IMAGE_VIEWER_MIN_SCALE),
    IMAGE_VIEWER_MAX_SCALE
  );
}

export function getImageViewerScaleLimits(fitScale: number): ImageViewerScaleLimits {
  const minScale = clampImageScale(fitScale);

  return {
    minScale,
    maxScale: Math.max(
      minScale,
      Math.min(IMAGE_VIEWER_MAX_SCALE, minScale * IMAGE_VIEWER_MAX_ZOOM)
    ),
  };
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

  const width = Number.isFinite(naturalSize.width) && naturalSize.width > 0
    ? naturalSize.width
    : 0;
  const height = Number.isFinite(naturalSize.height) && naturalSize.height > 0
    ? naturalSize.height
    : 0;

  return {
    width: (isQuarterTurn ? height : width) * safeScale,
    height: (isQuarterTurn ? width : height) * safeScale,
  };
}

export function clampImageCamera(
  candidate: ImageViewerCamera,
  viewport: ImageViewerSize,
  naturalSize: ImageViewerSize,
  rotation: number,
  scaleLimits: ImageViewerScaleLimits = {
    minScale: IMAGE_VIEWER_MIN_SCALE,
    maxScale: IMAGE_VIEWER_MAX_SCALE,
  }
): ImageViewerCamera {
  const minScale = clampImageScale(scaleLimits.minScale);
  const maxScale = Math.max(minScale, clampImageScale(scaleLimits.maxScale));
  const scale = Math.min(Math.max(clampImageScale(candidate.scale), minScale), maxScale);
  const displaySize = getImageDisplaySize(naturalSize, scale, rotation);
  const viewportWidth = Number.isFinite(viewport.width) && viewport.width > 0 ? viewport.width : 0;
  const viewportHeight = Number.isFinite(viewport.height) && viewport.height > 0 ? viewport.height : 0;
  const maxOffsetX = Math.max(0, (displaySize.width - viewportWidth) / 2);
  const maxOffsetY = Math.max(0, (displaySize.height - viewportHeight) / 2);

  return {
    scale,
    offsetX: Number.isFinite(candidate.offsetX)
      ? Math.min(Math.max(candidate.offsetX, -maxOffsetX), maxOffsetX)
      : 0,
    offsetY: Number.isFinite(candidate.offsetY)
      ? Math.min(Math.max(candidate.offsetY, -maxOffsetY), maxOffsetY)
      : 0,
  };
}

export function computeImageFitScale(
  viewport: ImageViewerSize,
  naturalSize: ImageViewerSize,
  rotation: number,
  padding: number
): number {
  const naturalWidth = Number.isFinite(naturalSize.width) && naturalSize.width > 0
    ? naturalSize.width
    : 0;
  const naturalHeight = Number.isFinite(naturalSize.height) && naturalSize.height > 0
    ? naturalSize.height
    : 0;
  if (naturalWidth === 0 || naturalHeight === 0) return 1;

  const viewportWidth = Number.isFinite(viewport.width) && viewport.width > 0 ? viewport.width : 1;
  const viewportHeight = Number.isFinite(viewport.height) && viewport.height > 0 ? viewport.height : 1;
  const availableWidth = Math.max(viewportWidth - padding, 1);
  const availableHeight = Math.max(viewportHeight - padding, 1);
  const isQuarterTurn = rotation % 180 !== 0;
  const imageWidth = isQuarterTurn ? naturalHeight : naturalWidth;
  const imageHeight = isQuarterTurn ? naturalWidth : naturalHeight;
  const fitRatio = Math.min(
    availableWidth / imageWidth,
    availableHeight / imageHeight,
    1
  );

  return clampImageScale(fitRatio);
}

export function zoomImageCameraBetweenPoints(
  startCamera: ImageViewerCamera,
  targetScale: number,
  startPoint: ImageViewerPoint,
  targetPoint: ImageViewerPoint,
  viewport: ImageViewerSize,
  naturalSize: ImageViewerSize,
  rotation: number,
  scaleLimits: ImageViewerScaleLimits = {
    minScale: IMAGE_VIEWER_MIN_SCALE,
    maxScale: IMAGE_VIEWER_MAX_SCALE,
  }
): ImageViewerCamera {
  const minScale = clampImageScale(scaleLimits.minScale);
  const maxScale = Math.max(minScale, clampImageScale(scaleLimits.maxScale));
  const safeStartScale = Math.min(Math.max(clampImageScale(startCamera.scale), minScale), maxScale);
  const safeTargetScale = Math.min(Math.max(clampImageScale(targetScale), minScale), maxScale);
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
    rotation,
    { minScale, maxScale }
  );
}

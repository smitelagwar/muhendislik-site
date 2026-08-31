export type CadNativeMeasurementType = "distance" | "area";

interface CadNativeMeasurementRegistration {
  type: CadNativeMeasurementType;
  nativeId: string;
  reviewId: string;
}

const nativeToReview = new Map<string, CadNativeMeasurementRegistration>();
const reviewToNative = new Map<string, CadNativeMeasurementRegistration>();

function nativeKey(type: CadNativeMeasurementType, nativeId: string): string {
  return `${type}:${nativeId}`;
}

export function registerCadNativeMeasurement(
  type: CadNativeMeasurementType,
  nativeId: string,
  reviewId: string
): void {
  const registration = { type, nativeId, reviewId };
  const key = nativeKey(type, nativeId);
  const previous = nativeToReview.get(key);
  if (previous && previous.reviewId !== reviewId) {
    reviewToNative.delete(previous.reviewId);
  }
  nativeToReview.set(key, registration);
  reviewToNative.set(reviewId, registration);
}

export function getCadNativeMeasurementReviewId(
  type: CadNativeMeasurementType,
  nativeId: string
): string | null {
  return nativeToReview.get(nativeKey(type, nativeId))?.reviewId ?? null;
}

export function isCadNativeMeasurementRendered(reviewId: string): boolean {
  return reviewToNative.has(reviewId);
}

export function pruneCadNativeMeasurementRegistrations(
  type: CadNativeMeasurementType,
  activeNativeIds: ReadonlySet<string>
): void {
  for (const [key, registration] of nativeToReview.entries()) {
    if (registration.type !== type || activeNativeIds.has(registration.nativeId)) continue;
    nativeToReview.delete(key);
    reviewToNative.delete(registration.reviewId);
  }
}

export function clearCadNativeMeasurementRegistrations(): void {
  nativeToReview.clear();
  reviewToNative.clear();
}

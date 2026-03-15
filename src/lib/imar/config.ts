export const IMAR_BASEMENT_COUNT_OPTIONS = [0, 1, 2, 3] as const;

export const IMAR_NORMAL_FLOOR_HEIGHT_M = 3;
export const IMAR_BASEMENT_HEIGHT_M = 2.8;

export const IMAR_TAKS_WARNING_THRESHOLD = 0.4;
export const IMAR_HIGH_RISE_WARNING_FLOOR_COUNT = 8;
export const IMAR_KAKS_ROUNDING_TOLERANCE = 0.01;

export const IMAR_TAKS_SLIDER = {
  min: 0.05,
  max: 1,
  step: 0.01,
} as const;

export const IMAR_KAKS_SLIDER = {
  min: 0.1,
  max: 5,
  step: 0.05,
} as const;

/** Visual shake multipliers, not real earthquake magnitude or building response. */
export const SHAKE_LEVELS = [
  { id: "light", label: "Hafif", strength: 0.7 },
  { id: "medium", label: "Orta", strength: 1.5 },
  { id: "strong", label: "Şiddetli", strength: 2.4 },
  { id: "very-strong", label: "Çok şiddetli", strength: 3.5 },
  { id: "extreme", label: "Aşırı", strength: 4.6 },
] as const;
export type ShakeLevel = (typeof SHAKE_LEVELS)[number]["id"];
export const DEFAULT_SHAKE_LEVEL: ShakeLevel = "strong";
export const MAX_SHAKE_STRENGTH = SHAKE_LEVELS[SHAKE_LEVELS.length - 1].strength;
export function shakeStrength(level: ShakeLevel): number {
  return SHAKE_LEVELS.find(item => item.id === level)?.strength ?? SHAKE_LEVELS[2].strength;
}

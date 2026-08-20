/** Accepts the Turkish decimal comma as well as a decimal point; invalid input remains invalid. */
export function parseTurkishNumber(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized || !/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

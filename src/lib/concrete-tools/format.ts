const numberFormatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatConcreteNumber(value: number) {
  return numberFormatter.format(value);
}

export function formatMillimetersAsCentimeters(value: number) {
  return formatConcreteNumber(value / 10);
}

export function parseConcreteNumber(value: string) {
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parsePositiveConcreteNumber(value: string) {
  const parsed = parseConcreteNumber(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

export function parsePositiveCentimetersToMillimeters(value: string) {
  const parsed = parsePositiveConcreteNumber(value);
  return parsed !== null ? parsed * 10 : null;
}

export function parseNonNegativeConcreteNumber(value: string) {
  const parsed = parseConcreteNumber(value);
  return parsed !== null && parsed >= 0 ? parsed : null;
}

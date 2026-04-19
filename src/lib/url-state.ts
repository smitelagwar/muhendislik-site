export function normalizeNumberParam(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));
}

export function setParamIfMeaningful(
  params: URLSearchParams,
  key: string,
  value: string | number | boolean | null | undefined,
  options?: {
    defaultValue?: string | number | boolean | null | undefined;
    omitFalse?: boolean;
    trim?: boolean;
  }
) {
  if (value === null || value === undefined) {
    return;
  }

  if (options?.omitFalse && value === false) {
    return;
  }

  if (options?.defaultValue !== undefined && value === options.defaultValue) {
    return;
  }

  const normalized = typeof value === "string" && options?.trim !== false ? value.trim() : String(value);
  if (normalized === "") {
    return;
  }

  params.set(key, normalized);
}

export function buildPathWithSearch(pathname: string, params: URLSearchParams) {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}


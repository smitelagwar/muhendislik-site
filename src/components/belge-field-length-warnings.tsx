type BelgeFieldLengthWarningsProps<T extends object> = {
  values: T;
  baselineValues?: Partial<T>;
  limits: Partial<Record<keyof T, { label: string; maximum: number }>>;
};

export function BelgeFieldLengthWarnings<T extends object>({
  values,
  baselineValues,
  limits,
}: BelgeFieldLengthWarningsProps<T>) {
  const warnings = (Object.entries(limits) as Array<[string, { label: string; maximum: number } | undefined]>).flatMap(([key, limit]) => {
    if (!limit) return [];
    const rawValue = (values as Record<string, unknown>)[key];
    if (rawValue === (baselineValues as Record<string, unknown> | undefined)?.[key]) return [];
    const length = typeof rawValue === "string" ? rawValue.length : 0;
    return length > limit.maximum
      ? [`${limit.label}: ${length} karakter. Önerilen uzunluk ${limit.maximum} karakter; metin kesilmeden korunur.`]
      : [];
  });

  if (warnings.length === 0) return null;

  return (
    <div role="status" aria-live="polite" className="mx-2 mt-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-2.5 py-2 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
      <p className="font-semibold">Bazı alanlar şablon için uzun olabilir:</p>
      <ul className="mt-1 list-inside list-disc space-y-0.5">
        {warnings.map((warning) => <li key={warning}>{warning}</li>)}
      </ul>
    </div>
  );
}

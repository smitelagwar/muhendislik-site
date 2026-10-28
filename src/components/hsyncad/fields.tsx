"use client";
export function NumberField({ label, value, onChange, min, step = "any", testId }: { label: string; value: number; onChange: (v: number) => void; min?: number; step?: string; testId?: string }) {
  return <label className="hcad-field"><span>{label}</span><input data-testid={testId} type="number" inputMode="decimal" step={step} min={min} value={Number.isFinite(value) ? value : ""} onChange={e => onChange(e.target.value === "" ? NaN : Number(e.target.value))} required /></label>;
}

"use client";

import { ChevronDown, FileCheck2, Layers3, MapPinned } from "lucide-react";
import type { ConfidenceEvidence } from "@/lib/calculations/modules/ruhsat-on-fizibilite";
import {
  NUMERIC_SOURCE_STATUSES,
  type FormIssue,
  type RuhsatFormState,
  type ScenarioAssumptionFormState,
} from "../ruhsat-form-state";

interface RuhsatInputFlowProps {
  form: RuhsatFormState;
  issues: readonly FormIssue[];
  onFieldChange: (field: keyof Omit<RuhsatFormState, "evidence" | "scenarios" | "technicalReserves">, value: string) => void;
  onEvidenceChange: (field: keyof ConfidenceEvidence, checked: boolean) => void;
  onScenarioChange: (
    scenarioId: keyof RuhsatFormState["scenarios"],
    field: keyof ScenarioAssumptionFormState,
    value: string
  ) => void;
  onTechnicalReserveChange: (
    field: keyof RuhsatFormState["technicalReserves"],
    value: string
  ) => void;
}

const EVIDENCE_OPTIONS: readonly {
  field: keyof ConfidenceEvidence;
  title: string;
  description: string;
}[] = [
  {
    field: "hasReadableCurrentZoningDocument",
    title: "Güncel, okunaklı imar belgesi",
    description: "Güven zincirinde A seviyesi için başlangıç belgesi.",
  },
  {
    field: "hasPlanNotes",
    title: "Plan notları",
    description: "Parsel özelindeki uygulama koşullarını teyit eder.",
  },
  {
    field: "hasCoordinateParcel",
    title: "Koordinatlı parsel / aplikasyon",
    description: "Gerçek yapı zarfı için gerekli veri.",
  },
  {
    field: "hasArchitecturalPreplan",
    title: "Mimari ön plan",
    description: "Yerleşim ve çekirdek kontrolünü güçlendirir.",
  },
  {
    field: "hasPermitCalculation",
    title: "Ruhsat hesabı",
    description: "İleri seviye hesap denetimi için kullanılır.",
  },
  {
    field: "hasDwg",
    title: "DWG / ölçülebilir çizim",
    description: "Ruhsat hesabıyla birlikte D seviyesini tamamlar.",
  },
];

const SCENARIO_LABELS = {
  COMPACT_MAX_UNITS: "Kompakt / daha çok BB",
  BALANCED: "Dengeli",
  COMFORT_FEWER_UNITS: "Konforlu / daha az BB",
} as const;

function fieldIssue(issues: readonly FormIssue[], field: string): string | null {
  return issues.find((issue) => issue.field === field)?.message ?? null;
}

function NumericField({
  id,
  label,
  value,
  onChange,
  helper,
  error,
  required = false,
  testId,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
  error?: string | null;
  required?: boolean;
  testId?: string;
}) {
  const descriptionId = error ? `${id}-error` : helper ? `${id}-help` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-foreground dark:text-slate-200">
        {label}{required ? <span className="ml-1 text-rose-500">*</span> : null}
      </label>
      <input
        id={id}
        data-testid={testId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="decimal"
        aria-invalid={Boolean(error)}
        aria-describedby={descriptionId}
        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-white/15 dark:bg-[#070a1e] dark:text-white dark:focus:border-violet-400"
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs leading-5 text-rose-600 dark:text-rose-300">
          {error}
        </p>
      ) : helper ? (
        <p id={`${id}-help`} className="mt-1.5 text-[11px] leading-5 text-muted-foreground dark:text-slate-400">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  children,
  helper,
  testId,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  helper?: string;
  testId?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-foreground dark:text-slate-200">
        {label}
      </label>
      <select
        id={id}
        data-testid={testId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-white/15 dark:bg-[#070a1e] dark:text-white dark:focus:border-violet-400"
      >
        {children}
      </select>
      {helper ? <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground dark:text-slate-400">{helper}</p> : null}
    </div>
  );
}

function Disclosure({ title, description, children, testId }: { title: string; description: string; children: React.ReactNode; testId?: string }) {
  return (
    <details data-testid={testId} className="group rounded-2xl border border-border/80 bg-muted/25 p-4 dark:border-white/10 dark:bg-[#080b1f]/55">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left">
        <span>
          <span className="block text-sm font-black text-foreground dark:text-white">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground dark:text-slate-400">{description}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-violet-600 transition group-open:rotate-180 dark:text-violet-300" />
      </summary>
      <div className="mt-5">{children}</div>
    </details>
  );
}

export function RuhsatInputFlow({
  form,
  issues,
  onFieldChange,
  onEvidenceChange,
  onScenarioChange,
  onTechnicalReserveChange,
}: RuhsatInputFlowProps) {
  const sourceReferenceRequired =
    form.numericSourceStatus === "DOCUMENT" || form.numericSourceStatus === "MEASUREMENT";

  return (
    <form data-testid="ruhsat-input-flow" className="space-y-5" onSubmit={(event) => event.preventDefault()}>
      <section className="overflow-hidden rounded-[28px] border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-2xl sm:p-6 dark:border-violet-500/20 dark:bg-[#090d26]/85 dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-2.5 text-violet-700 dark:text-violet-300">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground dark:text-white">Elinizde hangi bilgiler var?</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground dark:text-slate-400">
              Bu seçimler güven seviyesini belirler; olmayan belgeyi işaretlemeyin.
            </p>
          </div>
        </div>
        <fieldset className="mt-5 grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">Mevcut belge ve proje verileri</legend>
          {EVIDENCE_OPTIONS.map((option) => (
            <label
              key={option.field}
              className="flex cursor-pointer gap-3 rounded-xl border border-border/80 bg-background/60 p-3 transition hover:border-violet-400/60 dark:border-white/10 dark:bg-[#070a1e]/75"
            >
              <input
                type="checkbox"
                checked={form.evidence[option.field]}
                onChange={(event) => onEvidenceChange(option.field, event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-violet-600 focus:ring-violet-500"
              />
              <span>
                <span className="block text-xs font-bold text-foreground dark:text-slate-200">{option.title}</span>
                <span className="mt-0.5 block text-[11px] leading-4 text-muted-foreground dark:text-slate-400">{option.description}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-border/80 bg-card/90 p-5 shadow-sm backdrop-blur-2xl sm:p-6 dark:border-violet-500/20 dark:bg-[#090d26]/85 dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-2.5 text-blue-700 dark:text-blue-300">
            <MapPinned className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground dark:text-white">Temel imar verileri</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground dark:text-slate-400">
              Sayıları `0,40`, `0.40` veya `1.234,56` biçiminde girebilirsiniz.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <NumericField
            id="ruhsat-permit-date"
            label="Ruhsat başvuru tarihi"
            value={form.permitApplicationDate}
            onChange={(value) => onFieldChange("permitApplicationDate", value)}
            helper="Yürütülebilir snapshot şu an 01.07.2026 ve sonrası başvuruları destekler."
            error={fieldIssue(issues, "project.permitApplicationDate")}
            required
            testId="ruhsat-input-permit-date"
          />
          <SelectField
            id="ruhsat-numeric-source-status"
            label="Sayısal veri dayanağı"
            value={form.numericSourceStatus}
            onChange={(value) => onFieldChange("numericSourceStatus", value)}
            helper="Bu statü girilen sayısal alanlara uygulanır."
            testId="ruhsat-input-source-status"
          >
            {NUMERIC_SOURCE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === "REQUIRES_CONFIRMATION"
                  ? "Teyit gerekli"
                  : status === "DOCUMENT"
                    ? "Belgeden"
                    : status === "MEASUREMENT"
                      ? "Ölçümden"
                      : "Varsayım"}
              </option>
            ))}
          </SelectField>
          {sourceReferenceRequired ? (
            <div className="sm:col-span-2">
              <label htmlFor="ruhsat-source-id" className="mb-1.5 block text-xs font-bold text-foreground dark:text-slate-200">
                Belge / ölçüm kaynak kimliği <span className="text-rose-500">*</span>
              </label>
              <input
                id="ruhsat-source-id"
                data-testid="ruhsat-input-source-id"
                value={form.numericSourceId}
                onChange={(event) => onFieldChange("numericSourceId", event.target.value)}
                placeholder="Örn. imar-durumu-2026-07-15"
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-white/15 dark:bg-[#070a1e] dark:text-white"
              />
            </div>
          ) : null}
          <NumericField id="ruhsat-parcel-area" label="Net parsel alanı (m²)" value={form.parcelAreaM2} onChange={(value) => onFieldChange("parcelAreaM2", value)} error={fieldIssue(issues, "parcel.areaM2")} required testId="ruhsat-input-parcel-area" />
          <NumericField id="ruhsat-taks" label="TAKS" value={form.taks} onChange={(value) => onFieldChange("taks", value)} error={fieldIssue(issues, "parcel.taks")} required testId="ruhsat-input-taks" />
          <NumericField id="ruhsat-kaks" label="KAKS / emsal" value={form.kaks} onChange={(value) => onFieldChange("kaks", value)} error={fieldIssue(issues, "parcel.kaks")} required testId="ruhsat-input-kaks" />
          <NumericField id="ruhsat-floor-count" label="Maksimum kat adedi" value={form.maxFloorCount} onChange={(value) => onFieldChange("maxFloorCount", value)} error={fieldIssue(issues, "parcel.maxFloorCount")} required testId="ruhsat-input-floor-count" />
          <SelectField id="ruhsat-unit-type" label="Hedef bağımsız bölüm tipi" value={form.targetUnitType} onChange={(value) => onFieldChange("targetUnitType", value)} testId="ruhsat-input-unit-type">
            <option value="">Seçin</option>
            <option value="1+1">1+1</option><option value="2+1">2+1</option><option value="3+1">3+1</option><option value="4+1">4+1</option><option value="MIXED">Karma</option>
          </SelectField>
        </div>
      </section>

      <Disclosure title="Parsel, geometri ve proje ayrıntıları" description="Yükseklik, çekmeler ve manuel oturum kapasitesi sonucu iyileştirir; boş bırakılabilir." testId="ruhsat-advanced-parcel">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumericField id="ruhsat-height" label="Yapı yüksekliği / Hmax (m)" value={form.maxHeightM} onChange={(value) => onFieldChange("maxHeightM", value)} error={fieldIssue(issues, "parcel.maxHeightM")} />
          <NumericField id="ruhsat-geometry" label="Manuel geometri kapasitesi (m²)" value={form.manualGeometryCapacityM2} onChange={(value) => onFieldChange("manualGeometryCapacityM2", value)} helper="Çizimden doğrulanmış sığabilir oturum alanı; bilinmiyorsa boş bırakın." error={fieldIssue(issues, "parcel.manualGeometryCapacityM2")} testId="ruhsat-input-geometry" />
          <SelectField id="ruhsat-building-order" label="Nizam" value={form.buildingOrder} onChange={(value) => onFieldChange("buildingOrder", value)}>
            <option value="">Bilinmiyor</option><option value="DETACHED">Ayrık</option><option value="BLOCK">Blok</option><option value="ADJOINING">Bitişik</option><option value="OTHER">Diğer</option>
          </SelectField>
          <SelectField id="ruhsat-basement" label="Bodrum niyeti" value={form.basementIntent} onChange={(value) => onFieldChange("basementIntent", value)}>
            <option value="">Bilinmiyor</option><option value="NONE">Yok</option><option value="PARKING">Otopark</option><option value="SHELTER">Sığınak</option><option value="STORAGE">Depo</option><option value="MIXED">Karma</option><option value="UNDECIDED">Kararsız</option>
          </SelectField>
          <NumericField id="ruhsat-setback-front" label="Ön çekme (m)" value={form.setbackFrontM} onChange={(value) => onFieldChange("setbackFrontM", value)} error={fieldIssue(issues, "parcel.setbacks.frontM")} />
          <NumericField id="ruhsat-setback-left" label="Sol yan çekme (m)" value={form.setbackSideLeftM} onChange={(value) => onFieldChange("setbackSideLeftM", value)} error={fieldIssue(issues, "parcel.setbacks.sideLeftM")} />
          <NumericField id="ruhsat-setback-right" label="Sağ yan çekme (m)" value={form.setbackSideRightM} onChange={(value) => onFieldChange("setbackSideRightM", value)} error={fieldIssue(issues, "parcel.setbacks.sideRightM")} />
          <NumericField id="ruhsat-setback-rear" label="Arka çekme (m)" value={form.setbackRearM} onChange={(value) => onFieldChange("setbackRearM", value)} error={fieldIssue(issues, "parcel.setbacks.rearM")} />
        </div>
      </Disclosure>

      <Disclosure title="Senaryo ve teknik rezerv varsayımları" description="Bu değerler HEURISTIC'tir; mevzuat değildir ve her biri değiştirilebilir." testId="ruhsat-assumptions">
        <div className="space-y-5">
          {(Object.keys(SCENARIO_LABELS) as Array<keyof RuhsatFormState["scenarios"]>).map((id) => (
            <fieldset key={id} className="rounded-2xl border border-border/80 bg-background/55 p-4 dark:border-white/10 dark:bg-[#070a1e]/70">
              <legend className="px-1 text-sm font-black text-foreground dark:text-white">{SCENARIO_LABELS[id]}</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {( [
                  ["targetNetAreaM2", "Hedef net (m²)"], ["targetClosedGrossAreaM2", "Hedef kapalı brüt (m²)"], ["baseCoreAreaM2", "Taban çekirdek (m²)"], ["otherCommonAreaM2", "Diğer ortak alan (m²)"], ["floorTechnicalAreaM2", "Kat teknik alanı (m²)"], ["circulationAreaPerUnitM2", "BB başına sirkülasyon (m²)"],
                ] as const).map(([field, label]) => (
                  <NumericField key={field} id={`ruhsat-${id}-${field}`} label={label} value={form.scenarios[id][field]} onChange={(value) => onScenarioChange(id, field, value)} error={fieldIssue(issues, `scenarios.${id}.${field}`)} />
                ))}
              </div>
            </fieldset>
          ))}
          <fieldset className="rounded-2xl border border-border/80 bg-background/55 p-4 dark:border-white/10 dark:bg-[#070a1e]/70">
            <legend className="px-1 text-sm font-black text-foreground dark:text-white">Teknik rezervler</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {([ ["liftShaftReservationAreaM2", "3 kat şaft rezervi (m²)"], ["primaryLiftAreaM2", "Birinci asansör (m²)"], ["secondLiftAdditionalAreaM2", "İkinci asansör ek alanı (m²)"], ["fireReviewAreaM2", "Yangın inceleme rezervi (m²)"] ] as const).map(([field, label]) => (
                <NumericField key={field} id={`ruhsat-${field}`} label={label} value={form.technicalReserves[field]} onChange={(value) => onTechnicalReserveChange(field, value)} error={fieldIssue(issues, `technicalReserves.${field}`)} />
              ))}
            </div>
          </fieldset>
        </div>
      </Disclosure>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs leading-5 text-amber-900 dark:text-amber-100">
        <Layers3 className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Bu araç ruhsat, mimari proje veya belediye onayı üretmez. Yerel plan notları, parsel geometrisi ve proje çözümleri ayrıca teyit edilmelidir.</p>
      </div>
    </form>
  );
}

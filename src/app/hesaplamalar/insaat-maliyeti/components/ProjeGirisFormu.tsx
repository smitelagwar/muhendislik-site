"use client";

import { Building2, RotateCcw, Zap } from "lucide-react";
import type { CalculationResultSnapshot, ProjectProfile } from "@/lib/calculations/types";
import { formatM2Fiyat, formatTL } from "@/lib/calculations/core";
import { PRESETS } from "@/lib/calculations/presets";

interface Props {
  project: ProjectProfile;
  snapshot: CalculationResultSnapshot;
  onUpdate: (payload: Partial<ProjectProfile>) => void;
  onApplyPreset: (id: string) => void;
  onReset: () => void;
}

const YAPI_TURLERI: { value: ProjectProfile["yapiTuru"]; label: string }[] = [
  { value: "villa", label: "Villa" },
  { value: "mustakil", label: "Müstakil Ev" },
  { value: "apartman", label: "Apartman" },
  { value: "ticari", label: "Ticari" },
];

const KALITE_SEVIYELERI: { value: ProjectProfile["kaliteSeviyesi"]; label: string; pct: string }[] = [
  { value: "ekonomik", label: "Ekonomik", pct: "x0.80" },
  { value: "orta", label: "Orta", pct: "x1.00" },
  { value: "ust", label: "Üst Segment", pct: "x1.25" },
  { value: "luks", label: "Lüks", pct: "x1.60" },
];

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

export function ProjeGirisFormu({
  project,
  snapshot,
  onUpdate,
  onApplyPreset,
  onReset,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          Hızlı Başlangıç
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors ${
                project.presetId === preset.id
                  ? "border-teal-500/60 bg-teal-500/10 text-teal-600 dark:text-teal-300"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-600"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Sıfırla
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-zinc-200/80 bg-white/88 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/75">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-300">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-teal-600 dark:text-teal-300">
              Proje Genel Bilgileri
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Temel proje girdileri ve ticari varsayımlar
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400" htmlFor="yapi-turu">
              Yapı Türü
            </label>
            <select
              id="yapi-turu"
              value={project.yapiTuru}
              onChange={(event) =>
                onUpdate({ yapiTuru: event.target.value as ProjectProfile["yapiTuru"] })
              }
              className="tool-input w-full px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            >
              {YAPI_TURLERI.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400" htmlFor="insaat-alani">
              İnşaat Alanı (m²)
            </label>
            <input
              id="insaat-alani"
              data-testid="detailed-area-input"
              type="number"
              min={1}
              step={1}
              value={project.insaatAlani}
              onChange={(event) =>
                onUpdate({
                  insaatAlani: clampNumber(Number.parseFloat(event.target.value), 1, 1_000_000),
                })
              }
              className="tool-input w-full px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400" htmlFor="kat-adedi">
              Kat Adedi
            </label>
            <input
              id="kat-adedi"
              type="number"
              min={1}
              max={80}
              value={project.katAdedi}
              onChange={(event) =>
                onUpdate({
                  katAdedi: clampNumber(Number.parseInt(event.target.value, 10), 1, 80),
                })
              }
              className="tool-input w-full px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400" htmlFor="bagimsiz-bolum">
              Bağımsız Bölüm
            </label>
            <input
              id="bagimsiz-bolum"
              type="number"
              min={1}
              max={500}
              value={project.bagimsizBolumSayisi}
              onChange={(event) =>
                onUpdate({
                  bagimsizBolumSayisi: clampNumber(Number.parseInt(event.target.value, 10), 1, 500),
                })
              }
              className="tool-input w-full px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-zinc-200/80 bg-white/88 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/75">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-200">
              Ticari Çarpanlar ve Kalite
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Kalite seviyesi, müteahhit kârı ve KDV etkisi
            </p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400" htmlFor="kalite">
              İnşaat Kalitesi
            </label>
            <select
              id="kalite"
              value={project.kaliteSeviyesi}
              onChange={(event) =>
                onUpdate({
                  kaliteSeviyesi: event.target.value as ProjectProfile["kaliteSeviyesi"],
                })
              }
              className="tool-input w-full px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            >
              {KALITE_SEVIYELERI.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label} ({item.pct})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400" htmlFor="kar-marji">
              Müteahhit Kârı
            </label>
            <select
              id="kar-marji"
              value={project.muteahhitKariPct}
              onChange={(event) =>
                onUpdate({ muteahhitKariPct: Number.parseFloat(event.target.value) })
              }
              className="tool-input w-full px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            >
              <option value={0}>Sadece maliyet (%0)</option>
              <option value={0.1}>%10</option>
              <option value={0.15}>%15 (sektör ort.)</option>
              <option value={0.2}>%20</option>
              <option value={0.25}>%25</option>
              <option value={0.35}>%35</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400" htmlFor="kdv-orani">
              KDV Oranı
            </label>
            <select
              id="kdv-orani"
              value={project.kdvOraniPct}
              onChange={(event) =>
                onUpdate({ kdvOraniPct: Number.parseFloat(event.target.value) })
              }
              className="tool-input w-full px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            >
              <option value={0}>KDV hariç</option>
              <option value={0.01}>%1</option>
              <option value={0.1}>%10</option>
              <option value={0.2}>%20</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200/80 bg-white/82 p-4 dark:border-zinc-800 dark:bg-zinc-950/70">
        {[
          { label: "Maliyet", value: formatTL(snapshot.genelToplam) },
          { label: "m² Birim", value: formatM2Fiyat(snapshot.m2BasinaFiyat) },
          { label: "Bölüm Başına", value: formatTL(snapshot.bolumBasinaFiyat) },
          { label: "Satış Fiyatı", value: formatTL(snapshot.anahtarTeslimSatisFiyati) },
        ].map((item) => (
          <div key={item.label} className="rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              {item.label}
            </div>
            <div className="mt-1 text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

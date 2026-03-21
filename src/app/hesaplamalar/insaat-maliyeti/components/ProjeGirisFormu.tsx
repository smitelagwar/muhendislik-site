"use client";

import { RotateCcw, Zap } from "lucide-react";
import type { CalculationResultSnapshot, ProjectProfile } from "@/lib/calculations/types";
import { PRESETS } from "@/lib/calculations/presets";
import { formatTL, formatM2Fiyat } from "@/lib/calculations/core";

interface Props {
  project:       ProjectProfile;
  snapshot:      CalculationResultSnapshot;
  onUpdate:      (p: Partial<ProjectProfile>) => void;
  onApplyPreset: (id: string) => void;
  onReset:       () => void;
}

const YAPI_TURLERI: { value: ProjectProfile["yapiTuru"]; label: string }[] = [
  { value: "villa",    label: "Villa" },
  { value: "mustakil",label: "Müstakil Ev" },
  { value: "apartman", label: "Apartman" },
  { value: "ticari",   label: "Ticari" },
];

const KALİTE_SEVİYELERİ: { value: ProjectProfile["kaliteSeviyesi"]; label: string; pct: string }[] = [
  { value: "ekonomik", label: "Ekonomik", pct: "×0.80" },
  { value: "orta",     label: "Orta",     pct: "×1.00" },
  { value: "ust",      label: "Üst Segment", pct: "×1.25" },
  { value: "luks",     label: "Lüks",     pct: "×1.60" },
];

export function ProjeGirisFormu({ project, snapshot, onUpdate, onApplyPreset, onReset }: Props) {
  return (
    <div className="mb-8 space-y-6">

      {/* ── PRESET SEÇİCİ ── */}
      <div>
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Hızlı Başlangıç
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button
              key={p.id}
              id={`preset-${p.id}`}
              onClick={() => onApplyPreset(p.id)}
              className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-all duration-150 ${
                project.presetId === p.id
                  ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              {p.label}
            </button>
          ))}
          <button
            id="reset-button"
            onClick={onReset}
            className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3.5 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:border-zinc-700 hover:text-zinc-400"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Sıfırla
          </button>
        </div>
      </div>

      {/* ── PROJE BİLGİLERİ ── */}
      <div className="rounded-xl border border-zinc-800 bg-[#111] p-6">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-amber-500">
          Proje Genel Bilgileri
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">

          {/* Yapı Türü */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500" htmlFor="yapi-turu">
              Yapı Türü
            </label>
            <select
              id="yapi-turu"
              value={project.yapiTuru}
              onChange={e => onUpdate({ yapiTuru: e.target.value as ProjectProfile["yapiTuru"] })}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
            >
              {YAPI_TURLERI.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* İnşaat Alanı */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500" htmlFor="insaat-alani">
              Toplam İnşaat Alanı (m²)
            </label>
            <input
              id="insaat-alani"
              type="number"
              min={1}
              max={100000}
              value={project.insaatAlani}
              onChange={e => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v > 0) onUpdate({ insaatAlani: v });
                else if (e.target.value === "") onUpdate({ insaatAlani: 0 });
              }}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Kat Adedi */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500" htmlFor="kat-adedi">
              Kat Adedi
            </label>
            <input
              id="kat-adedi"
              type="number"
              min={1}
              max={40}
              value={project.katAdedi}
              onChange={e => {
                const v = parseInt(e.target.value);
                if (!isNaN(v) && v >= 1) onUpdate({ katAdedi: v });
                else if (e.target.value === "") onUpdate({ katAdedi: 1 });
              }}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Bağımsız Bölüm Sayısı */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500" htmlFor="bagimsiz-bolum">
              Bağımsız Bölüm Sayısı
            </label>
            <input
              id="bagimsiz-bolum"
              type="number"
              min={1}
              max={500}
              value={project.bagimsizBolumSayisi}
              onChange={e => {
                const v = parseInt(e.target.value);
                if (!isNaN(v) && v >= 1) onUpdate({ bagimsizBolumSayisi: v });
                else if (e.target.value === "") onUpdate({ bagimsizBolumSayisi: 1 });
              }}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Kalite Seviyesi */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500" htmlFor="kalite">
              İnşaat Kalitesi
            </label>
            <select
              id="kalite"
              value={project.kaliteSeviyesi}
              onChange={e => onUpdate({ kaliteSeviyesi: e.target.value as ProjectProfile["kaliteSeviyesi"] })}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
            >
              {KALİTE_SEVİYELERİ.map(k => (
                <option key={k.value} value={k.value}>
                  {k.label} ({k.pct})
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* ── MINI ÖZET (proje giriş altında) ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Toplam Maliyet", value: formatTL(snapshot.genelToplam) },
          { label: "m² Başına",      value: formatM2Fiyat(snapshot.m2BasinaFiyat) },
          { label: "Kaba İş",        value: formatTL(snapshot.kabaIsToplamı) },
          { label: "İnce İş",        value: formatTL(snapshot.inceIsToplamı) },
        ].map(item => (
          <div
            key={item.label}
            className="rounded-lg border border-zinc-800 bg-[#0d0d0d] px-4 py-3"
          >
            <p className="mb-0.5 text-xs text-zinc-600">{item.label}</p>
            <p className="text-sm font-bold text-amber-400">{item.value}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

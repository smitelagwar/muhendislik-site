"use client";

import { useMemo, useState } from "react";
import { Calculator, AlertTriangle, CheckCircle } from "lucide-react";
import {
  BETON_SINIFI_OPTIONS,
  CELIK_SINIFI_OPTIONS,
  TEKIL_TEMEL_VARSAYILAN,
  ZEMIN_TURU_OPTIONS,
  hesaplaTekilTemel,
  validaTekilTemel,
  type TekilTemelInput,
} from "@/lib/calculations/modules/tekil-temel";
import { JsonLd, generateCalculatorSchema } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site-config";

export function IsolatedFootingClient() {
  const [input, setInput] = useState<TekilTemelInput>(TEKIL_TEMEL_VARSAYILAN);

  const errors = useMemo(() => validaTekilTemel(input), [input]);
  const result = useMemo(() => {
    if (errors.length > 0) return null;
    return hesaplaTekilTemel(input);
  }, [input, errors]);

  const handleChange = (key: keyof TekilTemelInput, value: number | string) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  };

  const schema = generateCalculatorSchema({
    name: "Tekil Temel Hesabı",
    description: "TS 500 standartlarına göre tekil temel boyutlandırması, zemin emniyet gerilmesi, delme kesme ve donatı hesabı.",
    url: `${SITE_URL}/hesaplamalar/tekil-temel`,
  });

  return (
    <div className="tool-page-shell">
      <JsonLd schema={schema} />
      <div className="mx-auto max-w-screen-2xl px-6 py-10 sm:px-10 lg:px-16">
        <section className="mb-8 rounded-[34px] border border-zinc-200/80 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75 md:p-8">
          <div className="flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300 w-fit">
            <Calculator className="h-4 w-4" />
            Tekil Temel Tasarımı
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            Tekil Temel Hesabı
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400 md:text-base">
            TS 500 ve zemin emniyet gerilmesi esaslarına göre tekil temel boyutlandırma, zemin gerilmesi, delme kesme ve eğilme donatısı kontrollerini yapın.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* GİRDİ FORMU */}
          <section className="rounded-[32px] border border-zinc-200/80 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75 md:p-7">
            <h2 className="mb-6 text-xl font-bold">Zemin ve Geometri</h2>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Zemin Türü
                </label>
                <select
                  value={input.zeminTuru}
                  onChange={(e) => handleChange("zeminTuru", e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {ZEMIN_TURU_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Zemin Emniyet Gerilmesi (kN/m²)
                </label>
                <input
                  type="number"
                  value={input.zeminEmniyetGerilmesi}
                  onChange={(e) => handleChange("zeminEmniyetGerilmesi", Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Temel Derinliği Df (m)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={input.temelDerinligi}
                  onChange={(e) => handleChange("temelDerinligi", Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Zemin Birim Hacim Ağırlığı (kN/m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={input.zeminBirimHacimAgirligi}
                  onChange={(e) => handleChange("zeminBirimHacimAgirligi", Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
            </div>

            <h2 className="mb-6 mt-8 text-xl font-bold">Kolon ve Yükler</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Eksenel Yük Nd (kN)
                </label>
                <input
                  type="number"
                  value={input.eksenelYukNd}
                  onChange={(e) => handleChange("eksenelYukNd", Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Moment Mx (kNm)
                </label>
                <input
                  type="number"
                  value={input.momentMx}
                  onChange={(e) => handleChange("momentMx", Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Kolon Boyutu A (m) - X Yönü
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={input.kolonBoyutuA}
                  onChange={(e) => handleChange("kolonBoyutuA", Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Kolon Boyutu B (m) - Y Yönü
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={input.kolonBoyutuB}
                  onChange={(e) => handleChange("kolonBoyutuB", Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
            </div>

            <h2 className="mb-6 mt-8 text-xl font-bold">Malzeme</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Beton Sınıfı
                </label>
                <select
                  value={input.betonSinifi}
                  onChange={(e) => handleChange("betonSinifi", e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {BETON_SINIFI_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Çelik Sınıfı
                </label>
                <select
                  value={input.celikSinifi}
                  onChange={(e) => handleChange("celikSinifi", e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                >
                  {CELIK_SINIFI_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* SONUÇLAR */}
          <section className="rounded-[32px] border border-zinc-200/80 bg-white/85 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75 md:p-7">
            <h2 className="mb-6 text-xl font-bold">Hesap Sonuçları</h2>
            
            {errors.length > 0 ? (
              <div className="rounded-2xl border border-rose-300/70 bg-rose-50 p-4 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                <div className="flex items-center gap-2 font-bold mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  Giriş Hataları:
                </div>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {errors.map((err, i) => (
                    <li key={i}>{err.mesaj}</li>
                  ))}
                </ul>
              </div>
            ) : result ? (
              <div className="space-y-6">
                {result.uyarilar.length > 0 && (
                  <div className="rounded-2xl border border-teal-300/70 bg-teal-50 p-4 text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200">
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {result.uyarilar.map((u, i) => (
                        <li key={i}>{u}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">
                    Temel Geometrisi
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-zinc-500">Boyutlar (A × B)</div>
                      <div className="text-xl font-bold">
                        {result.boyut.a.toFixed(2)}m × {result.boyut.b.toFixed(2)}m
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Kalınlık (h)</div>
                      <div className="text-xl font-bold">{result.boyut.kalinlik.toFixed(2)} m</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                      Zemin Taşıma Kontrolü
                    </h3>
                    {result.zeminGerilmesi.kontrolGecti ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-rose-500" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-zinc-500">Max Gerilme</div>
                      <div className="font-mono text-sm">{result.zeminGerilmesi.maxGerilme.toFixed(1)} kN/m²</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Kapasite</div>
                      <div className="font-mono text-sm">{input.zeminEmniyetGerilmesi} kN/m²</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
                      Delme Kesme Kontrolü
                    </h3>
                    {result.delmeKesme.gecti ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-rose-500" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-zinc-500">Tasarım Delme Kuvveti (Vd)</div>
                      <div className="font-mono text-sm">{result.delmeKesme.tasarimDelmeKuvveti.toFixed(1)} kN</div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500">Delme Kapasitesi (Vrd)</div>
                      <div className="font-mono text-sm">{result.delmeKesme.izinVerilenKapasite.toFixed(1)} kN</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">
                    Donatı Önerileri
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-semibold mb-1">X Yönü (A Kenarına Paralel)</div>
                      <div className="flex justify-between items-center bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                          {result.donatiX.oneri}
                        </span>
                        <span className="text-xs text-zinc-500">As = {result.donatiX.tasarimDonatíAlani.toFixed(1)} cm²</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold mb-1">Y Yönü (B Kenarına Paralel)</div>
                      <div className="flex justify-between items-center bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
                          {result.donatiY.oneri}
                        </span>
                        <span className="text-xs text-zinc-500">As = {result.donatiY.tasarimDonatíAlani.toFixed(1)} cm²</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

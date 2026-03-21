"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { QuickFormState } from "../client-state";

function QuestionCard({
  step,
  title,
  description,
  children,
}: {
  step: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="tool-panel rounded-[32px] p-6">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">{step}</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-950 dark:text-white">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function QuickModePanel({
  form,
  onFieldChange,
}: {
  form: QuickFormState;
  onFieldChange: (key: keyof QuickFormState, value: string | boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <QuestionCard
        step="1. Arsa alani"
        title="Brut arsa verisini girin"
        description="V1 brut arsa alaniyla calisir. Net parsel, cekmeler ve plan notu etkisi bu arac kapsaminda degildir."
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
          <Input
            value={form.parcelAreaM2}
            onChange={(event) => onFieldChange("parcelAreaM2", event.target.value)}
            inputMode="decimal"
            className="tool-input h-12"
            placeholder="Ornek: 1000"
            data-testid="estimated-area-input-arsa"
          />
          <div className="flex items-center justify-center rounded-2xl border border-zinc-200/80 bg-zinc-50 text-sm font-bold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            m2
          </div>
        </div>
      </QuestionCard>

      <QuestionCard
        step="2. TAKS"
        title="Taban oturum katsayisi"
        description="TAKS, zeminde ayni anda oturabilecek azami yapi taban alanini temsil eder."
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
          <Input
            value={form.taks}
            onChange={(event) => onFieldChange("taks", event.target.value)}
            inputMode="decimal"
            className="tool-input h-12"
            placeholder="Ornek: 0.30"
            data-testid="estimated-area-input-taks"
          />
          <div className="flex items-center justify-center rounded-2xl border border-zinc-200/80 bg-zinc-50 text-sm font-bold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            katsayi
          </div>
        </div>
      </QuestionCard>

      <QuestionCard
        step="3. KAKS / emsal"
        title="Toplam emsale dahil alan katsayisi"
        description="Hizli modda ana sonuc KAKS oncelikli uretilir; bu alan detayli mod icin baslangic referansidir."
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
          <Input
            value={form.kaks}
            onChange={(event) => onFieldChange("kaks", event.target.value)}
            inputMode="decimal"
            className="tool-input h-12"
            placeholder="Ornek: 1.50"
            data-testid="estimated-area-input-kaks"
          />
          <div className="flex items-center justify-center rounded-2xl border border-zinc-200/80 bg-zinc-50 text-sm font-bold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            katsayi
          </div>
        </div>
      </QuestionCard>

      <QuestionCard
        step="4. Normal kat sayisi"
        title="Kat fizibilitesini kontrol edin"
        description="Bu alan hizli modda fizibilite kontrolu icindir; gercek toplam detayli moddaki kat programindan uretilir."
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
          <Input
            value={form.normalFloorCount}
            onChange={(event) => onFieldChange("normalFloorCount", event.target.value)}
            inputMode="numeric"
            className="tool-input h-12"
            placeholder="Ornek: 5"
            data-testid="estimated-area-input-kat"
          />
          <div className="flex items-center justify-center rounded-2xl border border-zinc-200/80 bg-zinc-50 text-sm font-bold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            normal kat
          </div>
        </div>
      </QuestionCard>

      <QuestionCard
        step="5. Bodrum var mi?"
        title="Bodrum alanini ayri raporlayin"
        description="Bodrum toplami hizli modda ayri raporlanir; detayli modda ise teknik hacimlerle birlikte dogrudan toplam insaat alanina girer."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onFieldChange("hasBasement", false)}
            aria-pressed={!form.hasBasement}
            data-testid="estimated-area-basement-no"
            className={cn(
              "min-h-11 rounded-[24px] border px-4 py-4 text-left transition-colors",
              !form.hasBasement
                ? "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-700/60 dark:bg-blue-950/40 dark:text-blue-100"
                : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
            )}
          >
            <span className="block text-sm font-black">Hayir</span>
            <span className="mt-1 block text-sm leading-6 opacity-80">
              Sadece emsale dahil alan uret.
            </span>
          </button>
          <button
            type="button"
            onClick={() => onFieldChange("hasBasement", true)}
            aria-pressed={form.hasBasement}
            data-testid="estimated-area-basement-yes"
            className={cn(
              "min-h-11 rounded-[24px] border px-4 py-4 text-left transition-colors",
              form.hasBasement
                ? "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-700/60 dark:bg-blue-950/40 dark:text-blue-100"
                : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
            )}
          >
            <span className="block text-sm font-black">Evet</span>
            <span className="mt-1 block text-sm leading-6 opacity-80">
              Bodrumu ayri hesapla ve yaklasik toplama ekle.
            </span>
          </button>
        </div>
      </QuestionCard>

      {form.hasBasement ? (
        <QuestionCard
          step="6. Bodrum detaylari"
          title="Bodrum kabullerini girin"
          description="Bodrum kat alani bos birakilirsa her bodrum kat, taban alani kadar varsayilir."
        >
          <div
            className="grid gap-4 sm:grid-cols-2"
            data-testid="estimated-area-basement-fields"
          >
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                Bodrum kat sayisi
              </p>
              <Input
                value={form.basementFloorCount}
                onChange={(event) => onFieldChange("basementFloorCount", event.target.value)}
                inputMode="numeric"
                className="tool-input h-12"
                placeholder="Ornek: 1"
                data-testid="estimated-area-input-bodrum-kat"
              />
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                Bodrum kat alani
              </p>
              <Input
                value={form.basementFloorAreaM2}
                onChange={(event) => onFieldChange("basementFloorAreaM2", event.target.value)}
                inputMode="decimal"
                className="tool-input h-12"
                placeholder="Opsiyonel"
                data-testid="estimated-area-input-bodrum-alan"
              />
            </div>
          </div>
        </QuestionCard>
      ) : null}
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { Building2, LandPlot, Layers3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  CONSTRUCTION_AREA_PROFILE_DEFINITIONS,
} from "@/lib/calculations/modules/tahmini-insaat-alani/engine";
import type { ConstructionAreaProfile } from "@/lib/calculations/modules/tahmini-insaat-alani/types";
import { cn } from "@/lib/utils";
import type { EstimatedAreaFormState } from "../client-state";

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
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
        {step}
      </p>
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

function getProfileIcon(profile: ConstructionAreaProfile) {
  switch (profile) {
    case "ticariOfis":
      return LandPlot;
    case "karma":
      return Layers3;
    case "konut":
    default:
      return Building2;
  }
}

export function QuickModePanel({
  form,
  onFieldChange,
}: {
  form: EstimatedAreaFormState;
  onFieldChange: (key: keyof EstimatedAreaFormState, value: string | boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <QuestionCard
        step="1. Net parsel alanı"
        title="Emsale esas alanı girin"
        description="Bu araç net parsel veya emsale esas alan mantığıyla çalışır. Brüt arsa yerine emsal hesabında kullandığınız alanı yazın."
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
          <Input
            value={form.parcelAreaM2}
            onChange={(event) => onFieldChange("parcelAreaM2", event.target.value)}
            inputMode="decimal"
            className="tool-input h-12"
            placeholder="Örnek: 1200"
            data-testid="estimated-area-input-arsa"
          />
          <div className="flex items-center justify-center rounded-2xl border border-zinc-200/80 bg-zinc-50 text-sm font-bold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            m²
          </div>
        </div>
      </QuestionCard>

      <QuestionCard
        step="2. TAKS"
        title="Maksimum taban alanını belirleyin"
        description="TAKS, yapının zeminde aynı anda oturabileceği azami taban alanını verir ve kat yerleşim kapasitesini test etmemizi sağlar."
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
          <Input
            value={form.taks}
            onChange={(event) => onFieldChange("taks", event.target.value)}
            inputMode="decimal"
            className="tool-input h-12"
            placeholder="Örnek: 0.35"
            data-testid="estimated-area-input-taks"
          />
          <div className="flex items-center justify-center rounded-2xl border border-zinc-200/80 bg-zinc-50 text-sm font-bold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            katsayı
          </div>
        </div>
      </QuestionCard>

      <QuestionCard
        step="3. KAKS / emsal"
        title="Emsale dahil alanı tanımlayın"
        description="KAKS, toplam emsale dahil inşaat alanını verir. Araç, emsal dışı tipik alanları bunun üzerine kontrollü bir oranla ekler."
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
          <Input
            value={form.kaks}
            onChange={(event) => onFieldChange("kaks", event.target.value)}
            inputMode="decimal"
            className="tool-input h-12"
            placeholder="Örnek: 1.20"
            data-testid="estimated-area-input-kaks"
          />
          <div className="flex items-center justify-center rounded-2xl border border-zinc-200/80 bg-zinc-50 text-sm font-bold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            katsayı
          </div>
        </div>
      </QuestionCard>

      <QuestionCard
        step="4. Normal kat sayısı"
        title="Kat yerleşim yeterliliğini kontrol edin"
        description="Normal kat sayısı, emsal alanının taban alanına bölünerek taşınıp taşınamayacağını test eder ve profil katsayısına küçük bir düzeltme ekler."
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
          <Input
            value={form.normalFloorCount}
            onChange={(event) => onFieldChange("normalFloorCount", event.target.value)}
            inputMode="numeric"
            className="tool-input h-12"
            placeholder="Örnek: 5"
            data-testid="estimated-area-input-kat"
          />
          <div className="flex items-center justify-center rounded-2xl border border-zinc-200/80 bg-zinc-50 text-sm font-bold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            normal kat
          </div>
        </div>
      </QuestionCard>

      <QuestionCard
        step="5. Kullanım profili"
        title="Emsal dışı artış profilini seçin"
        description="Profil seçimi; ortak alan, çekirdek, teknik hacim ve emsal dışı tipik alan varsayımını değiştirir. Üst sınır %30 olarak korunur."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {CONSTRUCTION_AREA_PROFILE_DEFINITIONS.map((profile) => {
            const Icon = getProfileIcon(profile.id);
            const isActive = form.profile === profile.id;

            return (
              <button
                key={profile.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => onFieldChange("profile", profile.id)}
                data-testid={`estimated-area-profile-${profile.id}`}
                className={cn(
                  "rounded-[24px] border px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15",
                  isActive
                    ? "border-blue-300 bg-blue-50 text-blue-950 shadow-[0_18px_38px_-28px_rgba(37,99,235,0.55)] dark:border-blue-600/50 dark:bg-blue-950/40 dark:text-blue-100"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/5 dark:bg-white/5">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-black">{profile.label}</p>
                    <p className="text-xs font-semibold text-current/70">
                      Baz oran %{Math.round(profile.baseNonEmsalRatio * 100)}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-current/80">{profile.description}</p>
              </button>
            );
          })}
        </div>
      </QuestionCard>

      <QuestionCard
        step="6. Bodrum bilgisi"
        title="Bodrum alanını ayrı hesaplayın"
        description="Bodrumlar çoğu senaryoda toplam inşaat alanına eklenir. Alanı boş bırakırsanız her bodrum kat için maksimum taban alanı varsayılır."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onFieldChange("hasBasement", false)}
            aria-pressed={!form.hasBasement}
            data-testid="estimated-area-basement-no"
            className={cn(
              "min-h-11 rounded-[24px] border px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15",
              !form.hasBasement
                ? "border-blue-300 bg-blue-50 text-blue-950 dark:border-blue-700/60 dark:bg-blue-950/40 dark:text-blue-100"
                : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
            )}
          >
            <span className="block text-sm font-black">Bodrum yok</span>
            <span className="mt-1 block text-sm leading-6 opacity-80">
              Toplam sadece emsal ve emsal dışı artıştan oluşsun.
            </span>
          </button>
          <button
            type="button"
            onClick={() => onFieldChange("hasBasement", true)}
            aria-pressed={form.hasBasement}
            data-testid="estimated-area-basement-yes"
            className={cn(
              "min-h-11 rounded-[24px] border px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15",
              form.hasBasement
                ? "border-blue-300 bg-blue-50 text-blue-950 dark:border-blue-700/60 dark:bg-blue-950/40 dark:text-blue-100"
                : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
            )}
          >
            <span className="block text-sm font-black">Bodrum var</span>
            <span className="mt-1 block text-sm leading-6 opacity-80">
              Bodrum katlarını yaklaşık toplam inşaat alanına ekle.
            </span>
          </button>
        </div>

        {form.hasBasement ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2" data-testid="estimated-area-basement-fields">
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                Bodrum kat sayısı
              </p>
              <Input
                value={form.basementFloorCount}
                onChange={(event) => onFieldChange("basementFloorCount", event.target.value)}
                inputMode="numeric"
                className="tool-input h-12"
                placeholder="Örnek: 1"
                data-testid="estimated-area-input-bodrum-kat"
              />
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">
                Bodrum kat alanı
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
        ) : null}
      </QuestionCard>
    </div>
  );
}

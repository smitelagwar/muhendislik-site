"use client";

import type { ReactNode } from "react";
import { Building2, LandPlot, Layers3, Factory, Hotel, Stethoscope, School, Settings, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
    <section className="rounded-3xl border border-border/80 bg-card/90 p-6 shadow-sm backdrop-blur-2xl dark:border-blue-500/20 dark:bg-[#090d26]/85 dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-300">
        {step}
      </p>
      <h2 className="mt-1.5 text-xl font-black tracking-tight text-foreground sm:text-2xl dark:text-white">
        {title}
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-slate-300">
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
    case "endustriyel":
      return Factory;
    case "otel":
      return Hotel;
    case "saglik":
      return Stethoscope;
    case "egitim":
      return School;
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
            className="h-12 rounded-xl border-input bg-card font-mono text-sm font-bold text-foreground focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-white/15 dark:bg-[#070a20] dark:text-white dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-500/30"
            placeholder="Örnek: 1200"
            data-testid="estimated-area-input-arsa"
          />
          <div className="flex items-center justify-center rounded-xl border border-border/80 bg-muted font-mono text-xs font-bold text-blue-600 dark:border-white/10 dark:bg-[#0c1233] dark:text-blue-300">
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
            className="h-12 rounded-xl border-input bg-card font-mono text-sm font-bold text-foreground focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-white/15 dark:bg-[#070a20] dark:text-white dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-500/30"
            placeholder="Örnek: 0.35"
            data-testid="estimated-area-input-taks"
          />
          <div className="flex items-center justify-center rounded-xl border border-border/80 bg-muted font-mono text-xs font-bold text-blue-600 dark:border-white/10 dark:bg-[#0c1233] dark:text-blue-300">
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
            className="h-12 rounded-xl border-input bg-card font-mono text-sm font-bold text-foreground focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-white/15 dark:bg-[#070a20] dark:text-white dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-500/30"
            placeholder="Örnek: 1.20"
            data-testid="estimated-area-input-kaks"
          />
          <div className="flex items-center justify-center rounded-xl border border-border/80 bg-muted font-mono text-xs font-bold text-blue-600 dark:border-white/10 dark:bg-[#0c1233] dark:text-blue-300">
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
            className="h-12 rounded-xl border-input bg-card font-mono text-sm font-bold text-foreground focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-white/15 dark:bg-[#070a20] dark:text-white dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-500/30"
            placeholder="Örnek: 5"
            data-testid="estimated-area-input-kat"
          />
          <div className="flex items-center justify-center rounded-xl border border-border/80 bg-muted font-mono text-xs font-bold text-blue-600 dark:border-white/10 dark:bg-[#0c1233] dark:text-blue-300">
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
                  "rounded-2xl border p-4 text-left transition-all",
                  isActive
                    ? "border-blue-500 bg-blue-500/10 text-foreground shadow-[0_0_20px_rgba(59,130,246,0.15)] dark:bg-blue-500/15 dark:text-white dark:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                    : "border-border/80 bg-muted/40 text-foreground hover:border-blue-500/40 hover:bg-card dark:border-white/10 dark:bg-[#070b20] dark:text-slate-300 dark:hover:bg-[#0c1236]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                      isActive
                        ? "border-blue-400/40 bg-blue-500/20 text-blue-600 dark:text-blue-300"
                        : "border-border/80 bg-card text-muted-foreground dark:border-white/10 dark:bg-[#0c1233] dark:text-slate-400"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground dark:text-white">{profile.label}</p>
                    <p className="text-[11px] font-mono text-blue-600 font-semibold dark:text-blue-300">
                      Baz oran %{Math.round(profile.baseNonEmsalRatio * 100)}
                    </p>
                  </div>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground dark:text-slate-400">{profile.description}</p>
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
              "min-h-11 rounded-2xl border p-4 text-left transition-all",
              !form.hasBasement
                ? "border-blue-500 bg-blue-500/10 text-foreground shadow-[0_0_20px_rgba(59,130,246,0.15)] dark:bg-blue-500/15 dark:text-white dark:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                : "border-border/80 bg-muted/40 text-foreground hover:border-blue-500/40 hover:bg-card dark:border-white/10 dark:bg-[#070b20] dark:text-slate-300"
            )}
          >
            <span className="block text-sm font-bold text-foreground dark:text-white">Bodrum yok</span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground dark:text-slate-400">
              Toplam sadece emsal ve emsal dışı artıştan oluşsun.
            </span>
          </button>
          <button
            type="button"
            onClick={() => onFieldChange("hasBasement", true)}
            aria-pressed={form.hasBasement}
            data-testid="estimated-area-basement-yes"
            className={cn(
              "min-h-11 rounded-2xl border p-4 text-left transition-all",
              form.hasBasement
                ? "border-blue-500 bg-blue-500/10 text-foreground shadow-[0_0_20px_rgba(59,130,246,0.15)] dark:bg-blue-500/15 dark:text-white dark:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                : "border-border/80 bg-muted/40 text-foreground hover:border-blue-500/40 hover:bg-card dark:border-white/10 dark:bg-[#070b20] dark:text-slate-300"
            )}
          >
            <span className="block text-sm font-bold text-foreground dark:text-white">Bodrum var</span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground dark:text-slate-400">
              Bodrum katlarını yaklaşık toplam inşaat alanına ekle.
            </span>
          </button>
        </div>

        {form.hasBasement ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2" data-testid="estimated-area-basement-fields">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-300">
                Bodrum Kat Sayısı
              </p>
              <Input
                value={form.basementFloorCount}
                onChange={(event) => onFieldChange("basementFloorCount", event.target.value)}
                inputMode="numeric"
                className="h-12 rounded-xl border-input bg-card font-mono text-sm font-bold text-foreground focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-white/15 dark:bg-[#070a20] dark:text-white dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-500/30"
                placeholder="Örnek: 1"
                data-testid="estimated-area-input-bodrum-kat"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-slate-300">
                Bodrum Kat Alanı (m²)
              </p>
              <Input
                value={form.basementFloorAreaM2}
                onChange={(event) => onFieldChange("basementFloorAreaM2", event.target.value)}
                inputMode="decimal"
                className="h-12 rounded-xl border-input bg-card font-mono text-sm font-bold text-foreground focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-white/15 dark:bg-[#070a20] dark:text-white dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-500/30"
                placeholder="Opsiyonel"
                data-testid="estimated-area-input-bodrum-alan"
              />
            </div>
          </div>
        ) : null}
      </QuestionCard>

      <QuestionCard
        step="7. Özel emsal harici oran"
        title="Profil varsayımını özelleştirin"
        description="İsteğe bağlı olarak profil bazlı varsayılan emsal harici oran yerine kendi oranınınızı tanımlayın. Üst sınır %30'dur."
      >
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/40 p-4 dark:border-white/10 dark:bg-[#070b20]">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm font-bold text-foreground dark:text-white">Özel Emsal Harici Oran Kullan</p>
              <p className="text-xs text-muted-foreground dark:text-slate-400">Profil varsayımı yerine kendi oranınınızı girin</p>
            </div>
          </div>
          <Switch
            checked={form.useCustomNonEmsalRatio}
            onCheckedChange={(checked) => onFieldChange("useCustomNonEmsalRatio", checked)}
            data-testid="estimated-area-custom-ratio-toggle"
          />
        </div>

        {form.useCustomNonEmsalRatio ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
            <Input
              value={form.customNonEmsalRatio}
              onChange={(event) => onFieldChange("customNonEmsalRatio", event.target.value)}
              inputMode="decimal"
              className="h-12 rounded-xl border-input bg-card font-mono text-sm font-bold text-foreground focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-white/15 dark:bg-[#070a20] dark:text-white dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-500/30"
              placeholder="Örnek: 0.25"
              data-testid="estimated-area-input-custom-ratio"
            />
            <div className="flex items-center justify-center rounded-xl border border-border/80 bg-muted font-mono text-xs font-bold text-blue-600 dark:border-white/10 dark:bg-[#0c1233] dark:text-blue-300">
              oran
            </div>
          </div>
        ) : null}
      </QuestionCard>

      <QuestionCard
        step="8. Maliyet tahmini"
        title="Yaklaşık inşaat maliyeti hesapla"
        description="Toplam inşaat alanı üzerinden kabaca bir maliyet tahmini yapmak için birim fiyat girin."
      >
        <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/40 p-4 dark:border-white/10 dark:bg-[#070b20]">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm font-bold text-foreground dark:text-white">Maliyet Tahmini Dahil Et</p>
              <p className="text-xs text-muted-foreground dark:text-slate-400">Birim fiyat ile yaklaşık toplam maliyet hesapla</p>
            </div>
          </div>
          <Switch
            checked={form.includeCostEstimate}
            onCheckedChange={(checked) => onFieldChange("includeCostEstimate", checked)}
            data-testid="estimated-area-cost-estimate-toggle"
          />
        </div>

        {form.includeCostEstimate ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
            <Input
              value={form.constructionCostPerM2}
              onChange={(event) => onFieldChange("constructionCostPerM2", event.target.value)}
              inputMode="numeric"
              className="h-12 rounded-xl border-input bg-card font-mono text-sm font-bold text-foreground focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20 dark:border-white/15 dark:bg-[#070a20] dark:text-white dark:focus-visible:border-emerald-400 dark:focus-visible:ring-emerald-500/30"
              placeholder="Örnek: 15000"
              data-testid="estimated-area-input-cost-per-m2"
            />
            <div className="flex items-center justify-center rounded-xl border border-border/80 bg-muted font-mono text-xs font-bold text-emerald-600 dark:border-white/10 dark:bg-[#0c1233] dark:text-emerald-300">
              TL / m²
            </div>
          </div>
        ) : null}
      </QuestionCard>
    </div>
  );
}

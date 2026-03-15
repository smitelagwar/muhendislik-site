"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Calculator,
  CheckCircle2,
  Info,
  Layers3,
  MapPinned,
  Snowflake,
  SquareStack,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TOOLS_HUB_HREF } from "@/lib/tools-data";
import { calculateExternalWallInsulation, getClimateBucketLabel, getDistrictOptions, getProvinceById, provinceRequiresDistrictSelection } from "@/lib/ts825/calculator";
import {
  DISTRICT_HELP_NOTE,
  PRELIMINARY_NOTE,
  REGULATION_GUIDE_INTRO,
  REGULATION_GUIDE_NOTE,
  REGULATION_GUIDE_RULES,
  SOIL_CONTACT_NOTE,
} from "@/lib/ts825/copy";
import { TARGET_U_VALUES, PROVINCE_CLIMATE_OPTIONS } from "@/lib/ts825/climate-data";
import { INSULATION_MATERIALS } from "@/lib/ts825/materials";
import { WALL_PRESETS } from "@/lib/ts825/wall-presets";

const numberFormatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatCm(mm: number) {
  return mm <= 0 ? "0" : formatNumber(mm / 10);
}

function getStatusClass(status: string) {
  switch (status) {
    case "Uygun":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200";
    case "Sınırda":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200";
    case "Enerji verimliliği açısından geliştirilebilir":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200";
    default:
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
  }
}

export function ExternalWallInsulationCalculator() {
  const [provinceId, setProvinceId] = useState("66");
  const [districtId, setDistrictId] = useState<string | undefined>(undefined);
  const [wallPresetId, setWallPresetId] = useState("brick-infill");
  const [materialId, setMaterialId] = useState<"eps" | "xps" | "rockwool">("eps");

  const selectedProvince = useMemo(() => getProvinceById(provinceId), [provinceId]);
  const districtOptions = useMemo(() => getDistrictOptions(provinceId), [provinceId]);
  const shouldShowDistrictSelect = districtOptions.length > 0;
  const districtRequired = useMemo(
    () => provinceRequiresDistrictSelection(provinceId) && shouldShowDistrictSelect,
    [provinceId, shouldShowDistrictSelect],
  );
  const selectedMaterial = useMemo(
    () => INSULATION_MATERIALS.find((material) => material.id === materialId) ?? INSULATION_MATERIALS[0],
    [materialId],
  );
  const selectedWallPreset = useMemo(
    () => WALL_PRESETS.find((preset) => preset.id === wallPresetId) ?? WALL_PRESETS[0],
    [wallPresetId],
  );

  const calculation = useMemo(() => {
    return calculateExternalWallInsulation(provinceId, wallPresetId, materialId, districtId);
  }, [districtId, materialId, provinceId, wallPresetId]);

  const currentError = useMemo(() => {
    if (!selectedProvince) {
      return "İl seçimi bulunamadı. Lütfen liste üzerinden geçerli bir il seçin.";
    }

    if (districtRequired && !districtId) {
      return "Bu il için TS 825 iklim grubu ilçe bazında değişiyor. Hesaplama için ilçe grubunu seçin.";
    }

    if (!calculation) {
      return "Hesaplama verisi oluşturulamadı. Seçimleri kontrol edin.";
    }

    return null;
  }, [calculation, districtId, districtRequired, selectedProvince]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,116,144,0.12),_transparent_36%),linear-gradient(180deg,#f8fafc_0%,#eef5f7_52%,#f8fafc_100%)] py-8 dark:bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.18),_transparent_28%),linear-gradient(180deg,#09111e_0%,#0f172a_52%,#09111e_100%)] md:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8">
          <Link
            href={TOOLS_HUB_HREF}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/85 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:border-cyan-200 hover:text-cyan-700 dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-300 dark:hover:border-cyan-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Tüm araçlar
          </Link>
        </div>

        <div className="mb-10 max-w-3xl">
          <Badge className="mb-4 rounded-full bg-cyan-100 px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-800 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-200">
            Isı yalıtımı aracı
          </Badge>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white md:text-5xl">
            Bölgesel dış cephe yalıtım kalınlığı önerici
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 dark:text-zinc-400 md:text-base">
            TS 825:2024 mantığıyla il, gerekiyorsa ilçe, duvar tipi ve yalıtım malzemesine göre dış cephe için hızlı ön
            tasarım önerisi alın.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Girdi bilgileri</p>
                <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">Konum ve duvar kurgusu</h2>
              </div>
              <div className="flex items-center gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full border-zinc-200 bg-white/80 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-200"
                    >
                      <Info className="h-3.5 w-3.5" />
                      Yönetmelik kuralları
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
                        TS 825 hızlı rehber
                      </p>
                      <DialogTitle>Yönetmelik kuralları ve pratik kullanım özeti</DialogTitle>
                      <DialogDescription>{REGULATION_GUIDE_INTRO}</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                      {REGULATION_GUIDE_RULES.map((rule, index) => (
                        <div
                          key={rule}
                          className="flex gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80"
                        >
                          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-black text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200">
                            {index + 1}
                          </span>
                          <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">{rule}</p>
                        </div>
                      ))}

                      <div className="rounded-2xl border border-blue-200/70 bg-blue-50/80 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
                        <p className="text-sm leading-6 text-blue-950 dark:text-blue-100">{SOIL_CONTACT_NOTE}</p>
                      </div>
                    </div>

                    <DialogFooter className="border-t border-zinc-200/80 pt-4 dark:border-zinc-800">
                      <p className="mr-auto text-sm leading-6 text-zinc-600 dark:text-zinc-400">{REGULATION_GUIDE_NOTE}</p>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="rounded-2xl bg-cyan-600/10 p-3 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200">
                  <Calculator className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className={`grid gap-5 ${shouldShowDistrictSelect ? "sm:grid-cols-2" : ""}`}>
              <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                <label className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  <MapPinned className="h-3.5 w-3.5" />
                  İl seçimi
                </label>
                <Select
                  value={provinceId}
                  onValueChange={(value) => {
                    setProvinceId(value);
                    setDistrictId(undefined);
                  }}
                >
                  <SelectTrigger className="h-12 rounded-xl border-zinc-200 bg-zinc-50 font-bold dark:border-zinc-800 dark:bg-zinc-900">
                    <SelectValue placeholder="İl seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCE_CLIMATE_OPTIONS.map((province) => (
                      <SelectItem key={province.id} value={province.id}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {shouldShowDistrictSelect ? (
                <div className="rounded-2xl border border-zinc-200/80 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                  <label className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    <Building2 className="h-3.5 w-3.5" />
                    İlçe / iklim grubu
                  </label>
                  <>
                    <Select value={districtId} onValueChange={setDistrictId}>
                      <SelectTrigger className="h-12 rounded-xl border-zinc-200 bg-zinc-50 font-bold dark:border-zinc-800 dark:bg-zinc-900">
                        <SelectValue placeholder="İlçe grubunu seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {districtOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{DISTRICT_HELP_NOTE}</p>
                  </>
                </div>
              ) : null}
            </div>

            <div className="mt-5 rounded-2xl border border-zinc-200/80 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
              <label className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
                <SquareStack className="h-3.5 w-3.5" />
                Duvar tipi
              </label>
              <Select value={wallPresetId} onValueChange={setWallPresetId}>
                <SelectTrigger className="h-12 rounded-xl border-zinc-200 bg-zinc-50 font-bold dark:border-zinc-800 dark:bg-zinc-900">
                  <SelectValue placeholder="Duvar tipini seçin" />
                </SelectTrigger>
                <SelectContent>
                  {WALL_PRESETS.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{selectedWallPreset.summary}</p>
            </div>

            <div className="mt-5 rounded-2xl border border-zinc-200/80 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
              <label className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
                <Layers3 className="h-3.5 w-3.5" />
                Yalıtım malzemesi
              </label>
              <div className="grid gap-3 md:grid-cols-3">
                {INSULATION_MATERIALS.map((material) => {
                  const isActive = material.id === materialId;

                  return (
                    <button
                      key={material.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setMaterialId(material.id)}
                      className={`rounded-2xl border px-4 py-4 text-left transition-all motion-reduce:transition-none ${
                        isActive
                          ? "border-cyan-500 bg-cyan-50 shadow-sm dark:border-cyan-500 dark:bg-cyan-950/30"
                          : "border-zinc-200 bg-zinc-50 hover:border-cyan-300 dark:border-zinc-800 dark:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Snowflake className={`h-4 w-4 ${isActive ? "text-cyan-700 dark:text-cyan-200" : "text-zinc-400"}`} />
                        <span className="font-black text-zinc-950 dark:text-white">{material.name}</span>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{material.summary}</p>
                      <p className="mt-3 text-xs font-bold text-zinc-700 dark:text-zinc-300">λ = {material.conductivity} W/mK</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-cyan-200/70 bg-cyan-50/70 p-4 dark:border-cyan-900/60 dark:bg-cyan-950/30">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-700 dark:text-cyan-200" />
                <p className="text-sm leading-6 text-cyan-950 dark:text-cyan-100">{PRELIMINARY_NOTE}</p>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-6">
            <div
              aria-live="polite"
              className="overflow-hidden rounded-[28px] border border-zinc-200/80 bg-zinc-950 p-6 text-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.55)] transition-all duration-500 motion-reduce:transition-none dark:border-zinc-800"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200/70">Canlı sonuç</p>
                  <h2 className="mt-2 text-2xl font-black">Önerilen uygulama kalınlığı</h2>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-cyan-200">
                  <Snowflake className="h-5 w-5" />
                </div>
              </div>

              {currentError ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-6">
                  <p className="text-lg font-bold text-white">Hesaplama için seçim tamamlanmadı</p>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">{currentError}</p>
                </div>
              ) : calculation ? (
                <>
                  <p className="text-sm font-medium text-zinc-300">
                    {calculation.location.province.name}
                    {calculation.location.districtOption && calculation.location.districtOption.id !== "varsayilan"
                      ? ` / ${calculation.location.districtOption.label}`
                      : ""}
                  </p>
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <span className="text-4xl font-black tracking-tight md:text-6xl">
                      {formatCm(calculation.recommendedThicknessMm)}
                    </span>
                    <span className="pb-2 text-lg font-semibold text-cyan-200">cm</span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Badge className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${getStatusClass(calculation.statusLabel)}`}>
                      {calculation.statusLabel}
                    </Badge>
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">
                      İklim grubu {getClimateBucketLabel(calculation.location.bucket)}
                    </span>
                  </div>
                  <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-300">{calculation.narrative}</p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/5 p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Hedef U</p>
                      <p className="mt-3 text-2xl font-black">{formatNumber(calculation.targetUValue)}</p>
                      <p className="mt-1 text-xs text-zinc-400">W/m²K</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Mevcut U</p>
                      <p className="mt-3 text-2xl font-black">{formatNumber(calculation.existingUValue)}</p>
                      <p className="mt-1 text-xs text-zinc-400">W/m²K</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400">Uygulama sonrası U</p>
                      <p className="mt-3 text-2xl font-black">{formatNumber(calculation.achievedUValue)}</p>
                      <p className="mt-1 text-xs text-zinc-400">W/m²K</p>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-zinc-200/80 bg-white/80 p-5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/70">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Seçilen malzeme</p>
                <p className="mt-3 text-3xl font-black text-zinc-950 dark:text-white">{selectedMaterial.name}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">λ = {selectedMaterial.conductivity} W/mK</p>
              </div>
              <div className="rounded-3xl border border-zinc-200/80 bg-white/80 p-5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/70">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Duvar tipi</p>
                <p className="mt-3 text-xl font-black text-zinc-950 dark:text-white">{selectedWallPreset.name}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Preset katman yaklaşımı</p>
              </div>
              <div className="rounded-3xl border border-zinc-200/80 bg-white/80 p-5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/70">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Varsayılan U hedefi</p>
                <p className="mt-3 text-3xl font-black text-zinc-950 dark:text-white">
                  {formatNumber(TARGET_U_VALUES[selectedProvince?.defaultBucket ?? "5-6"])}
                </p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">İl bazlı ön bilgi</p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[28px] border border-zinc-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/70">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Hesap özeti</p>
                <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">Katman ve direnç kontrolü</h2>
              </div>
              <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-700 dark:text-cyan-300">
                <Layers3 className="h-5 w-5" />
              </div>
            </div>

            {calculation ? (
              <Accordion type="single" collapsible defaultValue="summary" className="w-full">
                <AccordionItem value="summary">
                  <AccordionTrigger className="py-3 text-sm font-black uppercase tracking-[0.16em] text-zinc-700 hover:no-underline dark:text-zinc-200">
                    Hesap Özeti
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                        <p className="text-sm font-bold text-zinc-950 dark:text-white">Formül mantığı</p>
                        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                          Gerekli ek direnç = (1 / Uhedef) - Rmevcut. Yalıtım kalınlığı = λ × gerekli ek direnç.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                        <p className="text-sm font-bold text-zinc-950 dark:text-white">Özet değerler</p>
                        <ul className="mt-2 space-y-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                          <li>İklim grubu: {getClimateBucketLabel(calculation.location.bucket)}</li>
                          <li>Rmevcut: {formatNumber(calculation.existingResistance)} m²K/W</li>
                          <li>Ek direnç ihtiyacı: {formatNumber(calculation.requiredAdditionalResistance)} m²K/W</li>
                          <li>Teorik minimum: {formatCm(calculation.theoreticalThicknessMm)} cm</li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="layers">
                  <AccordionTrigger className="py-3 text-sm font-black uppercase tracking-[0.16em] text-zinc-700 hover:no-underline dark:text-zinc-200">
                    Katman Katman Direnç
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                        <p className="text-sm font-bold text-zinc-950 dark:text-white">Yüzey dirençleri</p>
                        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                          İç yüzey: {formatNumber(0.13)} m²K/W, dış yüzey: {formatNumber(0.04)} m²K/W
                        </p>
                      </div>

                      {calculation.wallPreset.layers.map((layer) => {
                        const layerResistance = layer.thicknessMeters / layer.conductivity;

                        return (
                          <div
                            key={layer.label}
                            className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-sm font-bold text-zinc-950 dark:text-white">{layer.label}</p>
                              <Badge variant="outline" className="rounded-full border-zinc-300 dark:border-zinc-700">
                                R = {formatNumber(layerResistance)}
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                              Kalınlık {formatNumber(layer.thicknessMeters * 100)} cm, λ = {layer.conductivity} W/mK
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                Geçerli sonuç oluştuğunda hesap özeti burada görünür.
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-zinc-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/70">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Karşılaştırma</p>
                <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">Alternatif malzemeler</h2>
              </div>
              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            {calculation ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Malzeme</TableHead>
                      <TableHead>Teorik min.</TableHead>
                      <TableHead>Önerilen</TableHead>
                      <TableHead className="text-right">Usonuç</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculation.materialComparison.map((row) => {
                      const isSelected = row.material.id === calculation.material.id;

                      return (
                        <TableRow key={row.material.id} className={isSelected ? "ring-1 ring-inset ring-cyan-500/30" : undefined}>
                          <TableCell className="font-bold">
                            <div className="flex items-center gap-2">
                              <span>{row.material.name}</span>
                              {isSelected ? (
                                <Badge className="rounded-full bg-cyan-600 px-2 py-0.5 text-[10px] font-black text-white hover:bg-cyan-600">
                                  Seçili
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>{formatCm(row.theoreticalThicknessMm)} cm</TableCell>
                          <TableCell>{formatCm(row.recommendedThicknessMm)} cm</TableCell>
                          <TableCell className="text-right font-medium">{formatNumber(row.achievedUValue)} W/m²K</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl border border-blue-200/70 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-blue-950/30">
                    <div className="flex gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-700 dark:text-blue-200" />
                      <p className="text-sm leading-6 text-blue-950 dark:text-blue-100">{SOIL_CONTACT_NOTE}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/80">
                    <p className="text-sm font-bold text-zinc-950 dark:text-white">Malzeme rehberi</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      EPS ile XPS arasındaki uygulama farklarını ve dış cephe dışındaki doğru kullanım alanlarını ayrı
                      rehberde inceleyin.
                    </p>
                    <Link
                      href="/eps-xps-yalitim-farklari"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-black text-cyan-700 transition-colors hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                    >
                      EPS - XPS rehberini aç <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                Hesaplama tamamlandığında alternatif malzeme tablosu burada görünür.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Turkey from "@react-map/turkey";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  ExternalLink,
  FileText,
  Info,
  MapPinned,
  Ruler,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageContextNavigation } from "@/components/page-context-navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ts825WallReportDialog } from "@/components/ts825-wall-report-dialog";
import {
  calculateExternalWallInsulation,
  getDistrictOptions,
  getProvinceById,
  provinceRequiresDistrictSelection,
} from "@/lib/ts825/calculator";
import { PROVINCE_CLIMATE_OPTIONS, TARGET_U_VALUES } from "@/lib/ts825/climate-data";
import { BUILDING_MATERIALS, INSULATION_MATERIALS } from "@/lib/ts825/materials";
import type { ThermalLayer } from "@/lib/ts825/types";
import { WALL_PRESETS } from "@/lib/ts825/wall-presets";
import { cn } from "@/lib/utils";

const numberFormatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const lambdaFormatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatLambda(value: number) {
  return lambdaFormatter.format(value);
}

function formatCm(mm: number) {
  return formatNumber(mm / 10);
}

function parsePositiveNumber(value: string, fallback = 0) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function formatInputNumber(value: number) {
  return (Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)))).replace(".", ",");
}

function createWallLayers(presetId: string, materialId: string, thicknessCm: number) {
  const preset = WALL_PRESETS.find((item) => item.id === presetId) ?? WALL_PRESETS[0];
  const material =
    INSULATION_MATERIALS.find((item) => item.id === materialId) ?? INSULATION_MATERIALS[0];
  const layers: ThermalLayer[] = preset.layers.map((layer, index) => ({
    ...layer,
    id: `${preset.id}-layer-${index + 1}`,
  }));
  const insulationLayerId = `${preset.id}-insulation`;
  layers.splice(Math.max(0, layers.length - 1), 0, {
    id: insulationLayerId,
    materialId: material.id,
    label: material.name,
    thicknessMeters: thicknessCm / 100,
    conductivity: material.conductivity,
    mu: material.mu,
    isInsulation: true,
  });
  return { layers, insulationLayerId };
}

export function ExternalWallInsulationCalculator() {
  const initialPreset = WALL_PRESETS[0];
  const [provinceId, setProvinceId] = useState("66");
  const [districtId, setDistrictId] = useState<string>();
  const [wallPresetId, setWallPresetId] = useState(initialPreset.id);
  const [materialId, setMaterialId] = useState(
    initialPreset.defaultInsulationMaterialId ?? INSULATION_MATERIALS[0].id,
  );
  const [thicknessInput, setThicknessInput] = useState(
    formatInputNumber((initialPreset.defaultInsulationThicknessMeters ?? 0.08) * 100),
  );
  const thicknessCm = parsePositiveNumber(thicknessInput);

  const selectedProvince = useMemo(() => getProvinceById(provinceId), [provinceId]);
  const districtOptions = useMemo(() => getDistrictOptions(provinceId), [provinceId]);
  const districtRequired = provinceRequiresDistrictSelection(provinceId);
  const selectedPreset = useMemo(
    () => WALL_PRESETS.find((preset) => preset.id === wallPresetId) ?? WALL_PRESETS[0],
    [wallPresetId],
  );
  const selectedMaterial = useMemo(
    () => INSULATION_MATERIALS.find((material) => material.id === materialId) ?? INSULATION_MATERIALS[0],
    [materialId],
  );
  const wallAssembly = useMemo(
    () => createWallLayers(wallPresetId, materialId, thicknessCm),
    [materialId, thicknessCm, wallPresetId],
  );
  const calculation = useMemo(
    () =>
      calculateExternalWallInsulation(
        provinceId,
        wallAssembly.layers,
        wallAssembly.insulationLayerId,
        districtId,
      ),
    [districtId, provinceId, wallAssembly],
  );
  const currentError = useMemo(() => {
    if (!selectedProvince) return "Geçerli bir il seçin.";
    if (districtRequired && !districtId) return "Bu il için ilçe grubunu seçin.";
    if (thicknessCm < 1 || thicknessCm > 40) return "Yalıtım kalınlığını 1–40 cm arasında girin.";
    if (!calculation) return "Girdi değerleriyle hesap oluşturulamadı.";
    return null;
  }, [calculation, districtId, districtRequired, selectedProvince, thicknessCm]);

  function applyPreset(presetId: string) {
    const preset = WALL_PRESETS.find((item) => item.id === presetId) ?? WALL_PRESETS[0];
    setWallPresetId(preset.id);
    setMaterialId(preset.defaultInsulationMaterialId ?? INSULATION_MATERIALS[0].id);
    setThicknessInput(formatInputNumber((preset.defaultInsulationThicknessMeters ?? 0.08) * 100));
  }

  const recommendationIsHigher =
    calculation && calculation.recommendedThicknessMm > calculation.currentInsulationThicknessMm + 0.1;

  return (
    <div className="tool-page-shell relative min-h-screen py-8 md:py-14 text-foreground">
      {/* Cosmic Atmospheric Background Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-to-b from-purple-600/20 via-indigo-600/10 to-transparent blur-[120px] dark:from-purple-600/25" />
        <div className="absolute top-[35%] right-[-10%] h-[400px] w-[500px] rounded-full bg-violet-600/12 blur-[140px] dark:bg-violet-600/20" />
      </div>

      <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
        <PageContextNavigation
          showBreadcrumbs={false}
          className="mb-8"
          backLinkClassName="inline-flex items-center gap-2 rounded-xl border border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#120f28]/90 px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-200 backdrop-blur-xl transition-all hover:border-purple-500/50 hover:bg-card dark:hover:bg-[#1b173b] hover:text-foreground dark:hover:text-white"
        />

        {/* Hero Header */}
        <header className="mb-8 flex flex-col items-start justify-between gap-5 border-b border-border/70 dark:border-white/10 pb-8 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)] backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-purple-400 animate-ping" />
              <span>TS 825:2024 / Dış Duvar</span>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground dark:text-white sm:text-4xl md:text-5xl">
              Yalıtım Kalınlığı ve{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400">
                U Değeri
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground dark:text-zinc-300 md:text-base">
              Konumu ve duvar tipini seçin. Mevcut kalınlığın yeterli olup olmadığını ve gereken asgari yalıtımı tek ekranda görün.
            </p>
          </div>
          <ReferenceTablesDialog />
        </header>

        {/* Main Grid */}
        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Inputs Panel */}
          <section className="tool-panel min-w-0 rounded-[32px] p-6 md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-border/70 dark:border-white/10 pb-4">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground dark:text-zinc-400">01 / Hesap Girdileri</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground dark:text-white">Dört Adımda Kontrol</h2>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border/80 dark:border-white/15 bg-card/80 dark:bg-[#16132e]/90 text-purple-400 hover:text-white" aria-label="Hesap esasını aç">
                    <Info className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-card dark:bg-[#0c0a1e] border-border dark:border-purple-500/30 rounded-3xl p-6 shadow-[0_0_60px_rgba(139,92,246,0.2)]">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black text-foreground dark:text-white">Hesap Esası</DialogTitle>
                    <DialogDescription className="text-muted-foreground dark:text-zinc-300">Dış duvar bileşeni için ısıl geçirgenlik kontrolü.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 text-sm leading-6 text-muted-foreground dark:text-zinc-300 mt-3">
                    <p>U = 1 / (Rsi + Σ d/λ + Rse) bağıntısı kullanılır.</p>
                    <p>Rsi = 0,13 ve Rse = 0,04 m²K/W alınır.</p>
                    <p>Hedef U değeri TS 825:2024 iklim bölgesine göre belirlenir.</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              <FieldShell number="01" icon={<MapPinned className="h-4 w-4" />} label="Proje Konumu">
                <div className={`grid gap-3 ${districtOptions.length ? "sm:grid-cols-2" : ""}`}>
                  <Select
                    value={provinceId}
                    onValueChange={(value) => {
                      setProvinceId(value);
                      setDistrictId(getProvinceById(value)?.districtOptions?.[0]?.id);
                    }}
                  >
                    <SelectTrigger className="tool-input h-11 text-foreground dark:text-white font-bold"><SelectValue placeholder="İl seçin" /></SelectTrigger>
                    <SelectContent className="bg-card dark:bg-[#16132e] border-border dark:border-white/15 text-foreground dark:text-white">
                      {PROVINCE_CLIMATE_OPTIONS.map((province) => (
                        <SelectItem key={province.id} value={province.id}>{province.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {districtOptions.length ? (
                    <Select value={districtId} onValueChange={setDistrictId}>
                      <SelectTrigger className="tool-input h-11 text-foreground dark:text-white font-bold"><SelectValue placeholder="İlçe grubu" /></SelectTrigger>
                      <SelectContent className="bg-card dark:bg-[#16132e] border-border dark:border-white/15 text-foreground dark:text-white">
                        {districtOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
                {selectedProvince ? (
                  <div
                    className="mt-3 overflow-hidden rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-3"
                    role="img"
                    aria-label={`Türkiye haritasında ${selectedProvince.name} seçili`}
                    data-testid="ts825-province-map"
                    data-selected-province={selectedProvince.name}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-black text-foreground dark:text-white">{selectedProvince.name}</span>
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-purple-400">
                        {calculation?.location.bucket ?? selectedProvince.defaultBucket}. İklim Bölgesi
                      </span>
                    </div>
                    <div className="w-full [&_.map]:!w-full [&_svg]:block [&_svg]:h-auto [&_svg]:w-full">
                      <Turkey
                        type="select-single"
                        size={640}
                        mapColor="#3f3b60"
                        strokeColor="#1e193d"
                        strokeWidth={0.8}
                        cityColors={{ [selectedProvince.name]: "#8b5cf6" }}
                        disableClick
                        disableHover
                      />
                    </div>
                  </div>
                ) : null}
              </FieldShell>

              <FieldShell number="02" icon={<FileText className="h-4 w-4" />} label="Duvar Tipi">
                <Select value={wallPresetId} onValueChange={applyPreset}>
                  <SelectTrigger className="tool-input h-11 text-foreground dark:text-white font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card dark:bg-[#16132e] border-border dark:border-white/15 text-foreground dark:text-white">
                    {WALL_PRESETS.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>{preset.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">{selectedPreset.summary}</p>
              </FieldShell>

              <FieldShell number="03" icon={<Ruler className="h-4 w-4" />} label="Yalıtım Malzemesi">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_132px]">
                  <Select value={materialId} onValueChange={setMaterialId}>
                    <SelectTrigger className="tool-input h-11 text-foreground dark:text-white font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card dark:bg-[#16132e] border-border dark:border-white/15 text-foreground dark:text-white">
                      {INSULATION_MATERIALS.map((material) => (
                        <SelectItem key={material.id} value={material.id}>{material.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-purple-500/40 bg-purple-500/15 px-3 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
                    <div>
                      <p className="font-mono text-[9px] font-black uppercase tracking-wider text-purple-300">Lambda</p>
                      <p className="text-base font-black tracking-tight text-white">
                        λ <span data-testid="ts825-lambda-value">{formatLambda(selectedMaterial.conductivity)}</span>
                      </p>
                    </div>
                    <span className="text-[9px] font-bold text-purple-300">W/mK</span>
                  </div>
                </div>
              </FieldShell>

              <FieldShell number="04" icon={<Calculator className="h-4 w-4" />} label="Mevcut / Planlanan Kalınlık">
                <div className="relative">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={thicknessInput}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (/^\d{0,2}([.,]\d{0,2})?$/.test(nextValue)) setThicknessInput(nextValue);
                    }}
                    onBlur={() => {
                      if (thicknessCm > 0) setThicknessInput(formatInputNumber(thicknessCm));
                    }}
                    className="tool-input h-12 pr-14 text-lg font-black text-foreground dark:text-white font-mono"
                    aria-label="Yalıtım kalınlığı, santimetre"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-bold text-muted-foreground dark:text-zinc-400">cm</span>
                </div>
              </FieldShell>
            </div>
          </section>

          {/* Results Panel */}
          <section aria-live="polite" className="min-w-0 space-y-6">
            <div className="tool-result-panel overflow-hidden rounded-[32px] p-6 md:p-8 text-white">
              {currentError ? (
                <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6">
                  <p className="font-bold text-white">Sonuç Bekleniyor</p>
                  <p className="mt-2 text-sm text-zinc-300">{currentError}</p>
                </div>
              ) : calculation ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-purple-200">
                        02 / {calculation.location.province.name} · {calculation.location.bucket}. İklim Bölgesi
                      </p>
                      <h2 className="mt-1 text-2xl font-black tracking-tight text-white">Yalıtım Sonucu</h2>
                    </div>
                    <Badge className={`rounded-xl border px-3 py-1 text-xs font-bold uppercase ${
                      calculation.statusLabel === "Uygun"
                        ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                        : calculation.statusLabel === "Sınırda"
                          ? "border-amber-500/40 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                          : "border-rose-500/40 bg-rose-500/20 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                    }`}>
                      {calculation.statusLabel === "Uygun" ? "Mevcut Kesit Uygun" : calculation.statusLabel}
                    </Badge>
                  </div>

                  <div className="mt-6 flex items-end gap-3 border-l-4 border-purple-400 pl-5">
                    <span className="text-6xl font-black tracking-tight text-white drop-shadow-[0_0_25px_rgba(192,132,252,0.45)] font-mono md:text-7xl">
                      {formatCm(calculation.recommendedThicknessMm)}
                    </span>
                    <span className="pb-2 text-lg font-bold text-purple-200">cm U hedefi için</span>
                  </div>
                  <p className="mt-4 max-w-2xl text-xs sm:text-sm leading-relaxed text-zinc-300">{calculation.narrative}</p>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <ResultMetric label="Mevcut U" value={calculation.currentUValue} />
                    <ResultMetric label="Hedef U" value={calculation.targetUValue} />
                    <ResultMetric label="Asgari Kesit U" value={calculation.achievedUValue} />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {recommendationIsHigher && (
                      <Button
                        type="button"
                        onClick={() => setThicknessInput(formatInputNumber(calculation.recommendedThicknessMm / 10))}
                        className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider px-5 shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-300" /> Öneriyi Uygula
                      </Button>
                    )}
                    <Ts825WallReportDialog calculation={calculation} wallPresetName={selectedPreset.name} />
                  </div>
                </>
              ) : null}
            </div>

            <div className="tool-panel rounded-[32px] p-5 md:p-6">
              <Accordion type="single" collapsible>
                <AccordionItem value="calculation" className="border-0">
                  <AccordionTrigger className="py-0 text-left text-lg font-black text-foreground dark:text-white hover:no-underline">
                    Hesap Dökümü & Dirençler
                  </AccordionTrigger>
                  <AccordionContent className="pb-0 pt-4">
                    {calculation ? (
                      <div className="space-y-2.5 text-xs sm:text-sm">
                        <DetailRow label="Duvar kurgusu" value={selectedPreset.name} />
                        <DetailRow label="Yalıtım" value={`${selectedMaterial.name} · λ ${formatLambda(selectedMaterial.conductivity)} W/mK`} />
                        <DetailRow label="Yalıtımsız duvar direnci" value={`${formatNumber(calculation.baseResistance)} m²K/W`} />
                        <DetailRow label="Yalıtım direnci" value={`${formatNumber(thicknessCm / 100 / selectedMaterial.conductivity)} m²K/W`} />
                        <DetailRow label="Toplam direnç" value={`${formatNumber(calculation.currentResistance)} m²K/W`} />
                        <DetailRow
                          label="Kontrol"
                          value={`${formatNumber(calculation.currentUValue)} ${calculation.currentUValue <= calculation.targetUValue ? "≤" : ">"} ${formatNumber(calculation.targetUValue)} W/m²K`}
                          strong={calculation.currentUValue <= calculation.targetUValue}
                        />
                      </div>
                    ) : null}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>
        </div>

        {/* Material Alternatives Table */}
        <section className="tool-panel mt-6 min-w-0 overflow-hidden rounded-[32px] p-6 md:p-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border/70 dark:border-white/10 pb-4">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground dark:text-zinc-400">03 / Aynı Duvar · Aynı Hedef</p>
              <h2 className="mt-1 text-xl font-black text-foreground dark:text-white">Malzeme Alternatifleri</h2>
            </div>
            <p className="text-xs text-muted-foreground dark:text-zinc-400">Kalınlıklar bir üst uygulama adımına yuvarlanır.</p>
          </div>
          {calculation ? (
            <div className="w-full max-w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border/80 dark:border-white/15">
                    <TableHead className="font-bold text-foreground dark:text-zinc-200">Malzeme</TableHead>
                    <TableHead className="font-bold text-foreground dark:text-zinc-200">λ</TableHead>
                    <TableHead className="font-bold text-foreground dark:text-zinc-200">Teorik</TableHead>
                    <TableHead className="font-bold text-foreground dark:text-zinc-200">Uygulama</TableHead>
                    <TableHead className="text-right font-bold text-foreground dark:text-zinc-200">Sonuç U</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculation.materialComparison.map((row) => (
                    <TableRow key={row.material.id} className={cn("transition-colors", row.material.id === materialId ? "bg-purple-500/15 dark:bg-purple-500/20 font-bold" : "hover:bg-muted/40 dark:hover:bg-white/[0.04]")}>
                      <TableCell className="font-bold">
                        <button
                          type="button"
                          onClick={() => setMaterialId(row.material.id)}
                          className="inline-flex items-center gap-2 text-left transition-colors hover:text-purple-400 text-foreground dark:text-white"
                          aria-label={`${row.material.name} malzemesini kullan`}
                        >
                          <span className={cn("h-2 w-2 rounded-full", row.material.id === materialId ? "bg-purple-400" : "bg-zinc-600")} />
                          {row.material.name}
                        </button>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground dark:text-zinc-300">{formatLambda(row.material.conductivity)}</TableCell>
                      <TableCell className="font-mono text-muted-foreground dark:text-zinc-300">{formatCm(row.theoreticalThicknessMm)} cm</TableCell>
                      <TableCell className="font-mono font-black text-purple-400">{formatCm(row.recommendedThicknessMm)} cm</TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground dark:text-white">{formatNumber(row.achievedUValue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </section>

        <div className="mt-6 flex flex-col justify-between gap-3 border-t border-border/70 dark:border-white/10 pt-5 text-xs text-muted-foreground dark:text-zinc-400 sm:flex-row sm:items-center">
          <p>Dış duvar bileşeni U hesabıdır; tam bina TS 825 enerji raporu yerine geçmez.</p>
          <Link href="/eps-xps-yalitim-farklari" className="inline-flex items-center gap-2 font-bold text-purple-400 hover:text-purple-300">
            Malzeme Rehberi <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function FieldShell({
  number,
  icon,
  label,
  children,
}: {
  number: string;
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-4">
      <p className="mb-3 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-400">
        <span className="text-purple-400 font-black">{number}</span>
        {icon}
        {label}
      </p>
      {children}
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center">
      <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-black text-white font-mono">{formatNumber(value)}</p>
      <p className="text-[10px] text-purple-300 font-medium">W/m²K</p>
    </div>
  );
}

function DetailRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex flex-col justify-between gap-1 rounded-xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 px-4 py-2.5 sm:flex-row sm:items-center">
      <span className="text-muted-foreground dark:text-zinc-400">{label}</span>
      <span className={strong ? "font-black text-emerald-400 dark:text-emerald-300 font-mono" : "font-bold text-foreground dark:text-white font-mono"}>{value}</span>
    </div>
  );
}

function ReferenceTablesDialog() {
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");
  const filteredProvinces = PROVINCE_CLIMATE_OPTIONS.filter((province) =>
    province.name.toLocaleLowerCase("tr-TR").includes(normalizedSearch),
  );
  const materials = [...INSULATION_MATERIALS, ...BUILDING_MATERIALS];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="animate-glow-pulse relative inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-purple-500/50 bg-[#120f28]/90 px-4 text-xs font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] backdrop-blur-xl transition-all hover:border-purple-400 hover:bg-[#1c1740]"
          data-testid="ts825-reference-trigger"
        >
          <BookOpen className="h-4 w-4 text-purple-400" /> Referans Tabloları
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-hidden bg-card dark:bg-[#0c0a1e] border-border dark:border-purple-500/30 rounded-3xl p-6 shadow-[0_0_60px_rgba(139,92,246,0.2)]">
        <DialogHeader className="pb-3 border-b border-border/70 dark:border-white/10">
          <DialogTitle className="text-xl font-black text-foreground dark:text-white">TS 825 Hesap Referansları</DialogTitle>
          <DialogDescription className="text-muted-foreground dark:text-zinc-300">İklim bölgeleri, hedef U değerleri ve hesapta kullanılan malzeme özellikleri.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="climate" className="min-h-0 mt-3">
          <TabsList className="grid w-full grid-cols-2 bg-muted/60 dark:bg-[#16132e]/90 p-1 border border-border/60 dark:border-white/10 rounded-xl">
            <TabsTrigger value="climate" className="rounded-lg py-2 text-xs font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">İklim Bölgeleri</TabsTrigger>
            <TabsTrigger value="materials" data-testid="ts825-materials-tab" className="rounded-lg py-2 text-xs font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">Malzeme Özellikleri</TabsTrigger>
          </TabsList>

          <TabsContent value="climate" className="min-h-0 space-y-4 pt-3">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {(Object.keys(TARGET_U_VALUES) as Array<keyof typeof TARGET_U_VALUES>).map((bucket) => (
                <div key={bucket} className="rounded-xl border border-border/80 dark:border-white/10 bg-card/60 dark:bg-[#16132e]/60 p-3 text-center">
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground dark:text-zinc-400">{bucket}. Bölge</p>
                  <p className="mt-1 font-black text-foreground dark:text-white font-mono">{formatNumber(TARGET_U_VALUES[bucket])}</p>
                  <p className="text-[10px] text-purple-400 font-bold">W/m²K</p>
                </div>
              ))}
            </div>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Şehir ara: Yozgat, Ankara, İstanbul..."
              className="tool-input h-11 text-foreground dark:text-white"
              aria-label="İklim bölgesi için şehir ara"
              data-testid="ts825-climate-search"
            />
            <div className="max-h-[44vh] overflow-auto rounded-2xl border border-border/80 dark:border-white/10">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card dark:bg-[#16132e]">
                  <TableRow>
                    <TableHead className="font-bold text-foreground dark:text-zinc-200">İl / Merkez</TableHead>
                    <TableHead className="w-28 text-right font-bold text-foreground dark:text-zinc-200">Bölge</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProvinces.map((province) => (
                    <TableRow key={province.id}>
                      <TableCell className="font-bold text-foreground dark:text-white">{province.name}</TableCell>
                      <TableCell className="text-right"><Badge variant="secondary" className="font-mono bg-purple-500/20 text-purple-300">{province.defaultBucket}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold">
              <a
                href="https://meslekihizmetler.csb.gov.tr/haberler/isi-yalitim-uygulamasi-altyapisi-tamamlanarak-kullanima-sunuldu-291191"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300"
              >
                1 Nisan 2025 Yürürlük Duyurusu <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://www.epsder.org.tr/ts825/yozgat.pdf"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-purple-400 hover:text-purple-300"
              >
                Yozgat TS 825:2024 İl Föyü <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </TabsContent>

          <TabsContent value="materials" className="min-h-0 pt-3">
            <div className="max-h-[58vh] overflow-auto rounded-2xl border border-border/80 dark:border-white/10">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card dark:bg-[#16132e]">
                  <TableRow>
                    <TableHead className="font-bold text-foreground dark:text-zinc-200">Malzeme</TableHead>
                    <TableHead className="w-32 font-bold text-foreground dark:text-zinc-200">λ (W/mK)</TableHead>
                    <TableHead className="w-24 font-bold text-foreground dark:text-zinc-200">μ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-bold text-foreground dark:text-white">{material.name}</TableCell>
                      <TableCell className="font-mono text-purple-400">{formatLambda(material.conductivity)}</TableCell>
                      <TableCell className="font-mono text-muted-foreground dark:text-zinc-300">{material.mu ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground dark:text-zinc-400">
              λ: Isıl iletkenlik hesap değeri. μ: Su buharı difüzyon direnç katsayısı. Ürün beyanında farklı hesap değeri varsa proje hesabında beyan değeri kullanılır.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

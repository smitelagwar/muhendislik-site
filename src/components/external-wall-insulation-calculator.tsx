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
    <div className="home-page min-h-screen py-8 md:py-14">
      <div className="mx-auto max-w-[1120px] px-5 sm:px-8 lg:px-10">
        <PageContextNavigation
          showBreadcrumbs={false}
          className="mb-8"
          backLinkClassName="home-button-secondary inline-flex items-center gap-2 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em]"
        />

        <header className="mb-8 flex flex-col items-start justify-between gap-5 border-b border-[var(--home-border)] pb-8 md:flex-row md:items-end">
          <div>
            <p className="home-section-kicker">TS 825:2024 / Dış duvar</p>
            <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] text-[var(--home-fg)] md:text-5xl">
              Yalıtım kalınlığı ve U değeri
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--home-muted)] md:text-base">
              Konumu ve duvar tipini seçin. Mevcut kalınlığın yeterli olup olmadığını ve gereken asgari yalıtımı tek ekranda görün.
            </p>
          </div>
          <ReferenceTablesDialog />
        </header>

        <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="min-w-0 rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-5 md:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--home-muted)]">01 / Hesap girdileri</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.025em] text-[var(--home-fg)]">Dört adımda kontrol</h2>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="icon-sm" aria-label="Hesap esasını aç">
                    <Info className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Hesap esası</DialogTitle>
                    <DialogDescription>Dış duvar bileşeni için ısıl geçirgenlik kontrolü.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                    <p>U = 1 / (Rsi + Σ d/λ + Rse) bağıntısı kullanılır.</p>
                    <p>Rsi = 0,13 ve Rse = 0,04 m²K/W alınır.</p>
                    <p>Hedef U değeri TS 825:2024 iklim bölgesine göre belirlenir.</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              <FieldShell number="01" icon={<MapPinned className="h-4 w-4" />} label="Proje konumu">
                <div className={`grid gap-3 ${districtOptions.length ? "sm:grid-cols-2" : ""}`}>
                  <Select
                    value={provinceId}
                    onValueChange={(value) => {
                      setProvinceId(value);
                      setDistrictId(getProvinceById(value)?.districtOptions?.[0]?.id);
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="İl seçin" /></SelectTrigger>
                    <SelectContent>
                      {PROVINCE_CLIMATE_OPTIONS.map((province) => (
                        <SelectItem key={province.id} value={province.id}>{province.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {districtOptions.length ? (
                    <Select value={districtId} onValueChange={setDistrictId}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="İlçe grubu" /></SelectTrigger>
                      <SelectContent>
                        {districtOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
                {selectedProvince ? (
                  <div
                    className="mt-3 overflow-hidden rounded-xl border border-blue-200/80 bg-blue-50/55 p-3 dark:border-blue-900/60 dark:bg-blue-950/15"
                    role="img"
                    aria-label={`Türkiye haritasında ${selectedProvince.name} seçili`}
                    data-testid="ts825-province-map"
                    data-selected-province={selectedProvince.name}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-black text-[var(--home-fg)]">{selectedProvince.name}</span>
                      <span className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">
                        {calculation?.location.bucket ?? selectedProvince.defaultBucket}. iklim bölgesi
                      </span>
                    </div>
                    <div className="w-full [&_.map]:!w-full [&_svg]:block [&_svg]:h-auto [&_svg]:w-full">
                      <Turkey
                        type="select-single"
                        size={640}
                        mapColor="#dbe3ec"
                        strokeColor="#ffffff"
                        strokeWidth={0.8}
                        cityColors={{ [selectedProvince.name]: "#2563eb" }}
                        disableClick
                        disableHover
                      />
                    </div>
                  </div>
                ) : null}
              </FieldShell>

              <FieldShell number="02" icon={<FileText className="h-4 w-4" />} label="Duvar tipi">
                <Select value={wallPresetId} onValueChange={applyPreset}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WALL_PRESETS.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>{preset.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{selectedPreset.summary}</p>
              </FieldShell>

              <FieldShell number="03" icon={<Ruler className="h-4 w-4" />} label="Yalıtım malzemesi">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_132px]">
                  <Select value={materialId} onValueChange={setMaterialId}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INSULATION_MATERIALS.map((material) => (
                        <SelectItem key={material.id} value={material.id}>{material.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-blue-300 bg-blue-50 px-3 shadow-[0_0_22px_rgba(37,99,235,0.14)] dark:border-blue-800 dark:bg-blue-950/30">
                    <div>
                      <p className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">Lambda</p>
                      <p className="text-lg font-black tracking-[-0.03em] text-blue-600 dark:text-blue-300">
                        λ <span data-testid="ts825-lambda-value">{formatLambda(selectedMaterial.conductivity)}</span>
                      </p>
                    </div>
                    <span className="text-[9px] font-bold text-blue-500 dark:text-blue-400">W/mK</span>
                  </div>
                </div>
              </FieldShell>

              <FieldShell number="04" icon={<Calculator className="h-4 w-4" />} label="Mevcut / planlanan kalınlık">
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
                    className="h-12 rounded-xl pr-14 text-lg font-black"
                    aria-label="Yalıtım kalınlığı, santimetre"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-bold text-muted-foreground">cm</span>
                </div>
              </FieldShell>
            </div>
          </section>

          <section aria-live="polite" className="min-w-0 space-y-6">
            <div className="overflow-hidden rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-6 md:p-8">
              {currentError ? (
                <div className="rounded-lg border border-dashed border-[var(--home-border)] bg-[var(--home-surface-raised)] p-6">
                  <p className="font-bold text-[var(--home-fg)]">Sonuç bekleniyor</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--home-muted)]">{currentError}</p>
                </div>
              ) : calculation ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--home-muted)]">
                        02 / {calculation.location.province.name} · {calculation.location.bucket}. iklim bölgesi
                      </p>
                      <h2 className="mt-2 text-2xl font-black tracking-[-0.025em] text-[var(--home-fg)]">Yalıtım sonucu</h2>
                    </div>
                    <Badge className={`rounded-full px-3 py-1 text-[11px] font-black uppercase ${
                      calculation.statusLabel === "Uygun"
                        ? "bg-emerald-100 text-emerald-800"
                        : calculation.statusLabel === "Sınırda"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                    }`}>
                      {calculation.statusLabel === "Uygun" ? "Mevcut kesit uygun" : calculation.statusLabel}
                    </Badge>
                  </div>

                  <div className="mt-8 flex items-end gap-3 border-l-4 border-[var(--home-accent-solid)] pl-5">
                    <span className="text-6xl font-black tracking-[-0.055em] text-[var(--home-fg)] md:text-7xl">
                      {formatCm(calculation.recommendedThicknessMm)}
                    </span>
                    <span className="pb-2 text-lg font-semibold text-[var(--home-muted)]">cm U hedefi için</span>
                  </div>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--home-muted)]">{calculation.narrative}</p>

                  <div className="mt-7 grid grid-cols-3 gap-3">
                    <ResultMetric label="Mevcut U" value={calculation.currentUValue} />
                    <ResultMetric label="Hedef U" value={calculation.targetUValue} />
                    <ResultMetric label="Asgari kesit U" value={calculation.achievedUValue} />
                  </div>

                  <div className="mt-7 flex flex-wrap gap-3">
                    {recommendationIsHigher ? (
                      <Button
                        type="button"
                        onClick={() => setThicknessInput(formatInputNumber(calculation.recommendedThicknessMm / 10))}
                        className="home-button-primary"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Öneriyi uygula
                      </Button>
                    ) : null}
                    <Ts825WallReportDialog calculation={calculation} wallPresetName={selectedPreset.name} />
                  </div>
                </>
              ) : null}
            </div>

            <div className="rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-5 md:p-6">
              <Accordion type="single" collapsible>
                <AccordionItem value="calculation" className="border-0">
                  <AccordionTrigger className="py-0 text-left text-xl font-black hover:no-underline">
                    Hesap dökümü
                  </AccordionTrigger>
                  <AccordionContent className="pb-0 pt-5">
                    {calculation ? (
                      <div className="space-y-2 text-sm">
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

        <section className="mt-6 min-w-0 overflow-hidden rounded-xl border border-[var(--home-border)] bg-[var(--home-surface)] p-5 md:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--home-muted)]">03 / Aynı duvar · aynı hedef</p>
              <h2 className="mt-2 text-xl font-black text-[var(--home-fg)]">Malzeme alternatifleri</h2>
            </div>
            <p className="text-xs text-muted-foreground">Kalınlıklar bir üst uygulama adımına yuvarlanır.</p>
          </div>
          {calculation ? (
            <div className="w-full max-w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Malzeme</TableHead>
                    <TableHead>λ</TableHead>
                    <TableHead>Teorik</TableHead>
                    <TableHead>Uygulama</TableHead>
                    <TableHead className="text-right">Sonuç U</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculation.materialComparison.map((row) => (
                    <TableRow key={row.material.id} className={row.material.id === materialId ? "bg-blue-50/80 dark:bg-blue-950/20" : ""}>
                      <TableCell className="font-bold">
                        <button
                          type="button"
                          onClick={() => setMaterialId(row.material.id)}
                          className="inline-flex items-center gap-2 text-left transition-colors hover:text-blue-600"
                          aria-label={`${row.material.name} malzemesini kullan`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${row.material.id === materialId ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"}`} />
                          {row.material.name}
                        </button>
                      </TableCell>
                      <TableCell>{formatLambda(row.material.conductivity)}</TableCell>
                      <TableCell>{formatCm(row.theoreticalThicknessMm)} cm</TableCell>
                      <TableCell className="font-black">{formatCm(row.recommendedThicknessMm)} cm</TableCell>
                      <TableCell className="text-right">{formatNumber(row.achievedUValue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </section>

        <div className="mt-5 flex flex-col justify-between gap-3 border-t border-border pt-5 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-center">
          <p>Dış duvar bileşeni U hesabıdır; tam bina TS 825 enerji raporu yerine geçmez.</p>
          <Link href="/eps-xps-yalitim-farklari" className="inline-flex items-center gap-2 font-black text-[var(--home-accent)]">
            Malzeme rehberi <ArrowRight className="h-3.5 w-3.5" />
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
    <div className="rounded-lg border border-[var(--home-border)] bg-[var(--home-surface-raised)] p-4">
      <p className="mb-3 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--home-muted)]">
        <span className="text-[var(--home-accent)]">{number}</span>
        {icon}
        {label}
      </p>
      {children}
    </div>
  );
}

function ResultMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--home-border)] bg-[var(--home-surface-raised)] p-3">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--home-muted)]">{label}</p>
      <p className="mt-2 text-xl font-black text-[var(--home-fg)]">{formatNumber(value)}</p>
      <p className="mt-1 text-[10px] text-[var(--home-muted)]">W/m²K</p>
    </div>
  );
}

function DetailRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex flex-col justify-between gap-1 rounded-lg border border-[var(--home-border)] bg-[var(--home-surface-raised)] px-4 py-3 sm:flex-row sm:items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-black text-emerald-700 dark:text-emerald-300" : "font-bold text-foreground"}>{value}</span>
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
          className="home-button-secondary shrink-0"
          data-testid="ts825-reference-trigger"
        >
          <BookOpen className="h-4 w-4" /> Referans tabloları
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>TS 825 hesap referansları</DialogTitle>
          <DialogDescription>İklim bölgeleri, hedef U değerleri ve hesapta kullanılan malzeme özellikleri.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="climate" className="min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="climate">İklim bölgeleri</TabsTrigger>
            <TabsTrigger value="materials" data-testid="ts825-materials-tab">Malzeme özellikleri</TabsTrigger>
          </TabsList>

          <TabsContent value="climate" className="min-h-0 space-y-4 pt-3">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {(Object.keys(TARGET_U_VALUES) as Array<keyof typeof TARGET_U_VALUES>).map((bucket) => (
                <div key={bucket} className="rounded-xl border border-border bg-muted/25 p-3 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">{bucket}. bölge</p>
                  <p className="mt-1 font-black text-foreground">{formatNumber(TARGET_U_VALUES[bucket])}</p>
                  <p className="text-[10px] text-muted-foreground">W/m²K</p>
                </div>
              ))}
            </div>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Şehir ara: Yozgat, Ankara, İstanbul..."
              className="h-11 rounded-xl"
              aria-label="İklim bölgesi için şehir ara"
              data-testid="ts825-climate-search"
            />
            <div className="max-h-[44vh] overflow-auto rounded-xl border border-border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>İl / merkez</TableHead>
                    <TableHead className="w-28 text-right">Bölge</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProvinces.map((province) => (
                    <TableRow key={province.id}>
                      <TableCell className="font-bold">{province.name}</TableCell>
                      <TableCell className="text-right"><Badge variant="secondary">{province.defaultBucket}</Badge></TableCell>
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
                className="inline-flex items-center gap-1.5 text-[var(--home-accent)]"
              >
                1 Nisan 2025 yürürlük duyurusu <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://www.epsder.org.tr/ts825/yozgat.pdf"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[var(--home-accent)]"
              >
                Yozgat TS 825:2024 il föyü <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </TabsContent>

          <TabsContent value="materials" className="min-h-0 pt-3">
            <div className="max-h-[58vh] overflow-auto rounded-xl border border-border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead>Malzeme</TableHead>
                    <TableHead className="w-32">λ (W/mK)</TableHead>
                    <TableHead className="w-24">μ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-bold">{material.name}</TableCell>
                      <TableCell>{formatLambda(material.conductivity)}</TableCell>
                      <TableCell>{material.mu ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              λ: ısıl iletkenlik hesap değeri. μ: su buharı difüzyon direnç katsayısı. Ürün beyanında farklı hesap değeri varsa proje hesabında beyan değeri kullanılır.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

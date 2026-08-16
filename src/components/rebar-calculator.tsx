"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Minus,
  Plus,
  Ruler,
} from "lucide-react";
import { PageContextNavigation } from "@/components/page-context-navigation";
import { RebarSectionSketch } from "@/components/section-sketch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  REBAR_DIAMETERS,
  buildEquivalentRebarRows,
  calculateBarArea,
  calculateRebarResult,
  calculateRebarSpacing,
  formatAreaCm2,
  formatAreaMm2,
  formatDecimal,
  formatInteger,
  parseRebarQuantity,
  type EquivalentRebarRow,
  type RebarDiameter,
} from "@/lib/rebar-calculations";
import { cn } from "@/lib/utils";

const SKETCH_QUANTITY_LIMIT = 30;

function isValidAdvancedValue(value: number | "", minimum: number): value is number {
  return value !== "" && Number.isFinite(value) && value >= minimum;
}

function toAdvancedValue(value: string): number | "" {
  if (value === "") return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : "";
}

export function RebarCalculator() {
  const [diameter, setDiameter] = useState<RebarDiameter>(14);
  const [quantityInput, setQuantityInput] = useState("5");
  const [widthCm, setWidthCm] = useState<number | "">(30);
  const [coverMm, setCoverMm] = useState<number | "">(30);
  const [stirrupDiameterMm, setStirrupDiameterMm] = useState<number | "">(8);

  const quantityValidation = useMemo(() => parseRebarQuantity(quantityInput), [quantityInput]);
  const result = useMemo(
    () =>
      quantityValidation.quantity === null
        ? null
        : calculateRebarResult(diameter, quantityValidation.quantity),
    [diameter, quantityValidation.quantity],
  );
  const equivalentRows = useMemo(
    () => (result ? buildEquivalentRebarRows(result.totalAreaMm2) : []),
    [result],
  );

  const advancedValuesAreValid =
    isValidAdvancedValue(widthCm, Number.EPSILON) &&
    isValidAdvancedValue(coverMm, 0) &&
    isValidAdvancedValue(stirrupDiameterMm, Number.EPSILON);

  const spacingCheck = useMemo(() => {
    if (!result || !advancedValuesAreValid) return null;
    return calculateRebarSpacing({
      quantity: result.quantity,
      diameter,
      widthCm,
      coverMm,
      stirrupDiameterMm,
    });
  }, [advancedValuesAreValid, coverMm, diameter, result, stirrupDiameterMm, widthCm]);

  function incrementQuantity() {
    const current = quantityValidation.quantity ?? 0;
    if (current < Number.MAX_SAFE_INTEGER) setQuantityInput(String(current + 1));
  }

  function decrementQuantity() {
    const current = quantityValidation.quantity ?? 1;
    if (current > 1) setQuantityInput(String(current - 1));
  }

  function selectAlternative(row: EquivalentRebarRow) {
    setDiameter(row.diameter);
    setQuantityInput(String(row.quantity));
  }

  return (
    <main className="tool-page-shell min-h-full py-6 text-foreground sm:py-9 lg:py-12">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <PageContextNavigation
          showBreadcrumbs={false}
          className="mb-5"
          backLinkClassName="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        />

        <header className="mb-7 max-w-3xl sm:mb-9">
          <Badge className="mb-3 rounded-md border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-amber-700 hover:bg-amber-500/10 dark:text-amber-300">
            TS 500
          </Badge>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Donatı Alanı Hesabı
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Donatı çapı ve adet girerek toplam donatı alanını ve eşdeğer donatı alternatiflerini hesaplayın.
          </p>
        </header>

        <div className="space-y-5 sm:space-y-6">
          <section aria-labelledby="calculation-title" className="tool-panel rounded-xl p-4 sm:p-6">
            <h2 id="calculation-title" className="text-lg font-bold tracking-tight text-foreground">
              Donatıyı girin
            </h2>

            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch">
              <div className="space-y-5">
                <div>
                  <label htmlFor="rebar-diameter" className="mb-2 block text-sm font-semibold text-foreground">
                    Donatı çapı (Ø)
                  </label>
                  <Select value={String(diameter)} onValueChange={(value) => setDiameter(Number(value) as RebarDiameter)}>
                    <SelectTrigger id="rebar-diameter" className="tool-input w-full" aria-describedby="single-bar-area">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REBAR_DIAMETERS.map((item) => (
                        <SelectItem key={item} value={String(item)}>
                          Ø{item} mm
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p id="single-bar-area" className="mt-2 text-xs text-muted-foreground">
                    Tek çubuk alanı: <span className="font-mono tabular-nums">{formatAreaMm2(calculateBarArea(diameter))} mm²</span>
                  </p>
                </div>

                <div>
                  <label htmlFor="rebar-quantity" className="mb-2 block text-sm font-semibold text-foreground">
                    Donatı adedi (n)
                  </label>
                  <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={decrementQuantity}
                      disabled={quantityValidation.quantity === 1}
                      className="h-11 w-11"
                      aria-label="Donatı adedini azalt"
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Input
                      id="rebar-quantity"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={quantityInput}
                      onChange={(event) => setQuantityInput(event.target.value)}
                      aria-invalid={Boolean(quantityValidation.error)}
                      aria-describedby="rebar-quantity-message"
                      className="tool-input text-center font-mono text-base font-bold tabular-nums"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={incrementQuantity}
                      className="h-11 w-11"
                      aria-label="Donatı adedini artır"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <p
                    id="rebar-quantity-message"
                    role={quantityValidation.error ? "alert" : undefined}
                    className={cn(
                      "mt-2 min-h-5 text-xs",
                      quantityValidation.error ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
                    )}
                  >
                    {quantityValidation.error ?? "Pozitif bir tam sayı girin."}
                  </p>
                </div>
              </div>

              <div
                className="flex min-h-[250px] flex-col justify-center rounded-xl border border-amber-500/30 bg-zinc-950 p-5 text-white sm:p-7"
                aria-live="polite"
                data-testid="rebar-result"
              >
                {result ? (
                  <>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">Toplam donatı alanı</p>
                    <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-mono text-4xl font-bold tracking-tight text-amber-300 tabular-nums sm:text-5xl">
                        {formatAreaCm2(result.totalAreaMm2)}
                      </span>
                      <span className="text-lg font-semibold text-zinc-300">cm²</span>
                    </div>
                    <p className="mt-2 font-mono text-base text-zinc-300 tabular-nums">
                      {formatAreaMm2(result.totalAreaMm2)} mm²
                    </p>
                    <p className="mt-4 text-sm font-semibold text-white">
                      {formatInteger(result.quantity)}Ø{diameter}
                    </p>

                    <details className="group mt-5 border-t border-white/10 pt-3" data-testid="rebar-formula-details">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-md text-sm font-semibold text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 [&::-webkit-details-marker]:hidden">
                        Hesap detayını göster
                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                      </summary>
                      <p className="pt-2 font-mono text-sm leading-6 text-zinc-300">
                        As = n × (π × Ø² / 4) = {formatInteger(result.quantity)} × {formatAreaMm2(result.barAreaMm2)} = {formatAreaMm2(result.totalAreaMm2)} mm²
                      </p>
                    </details>
                  </>
                ) : (
                  <div>
                    <p className="text-lg font-bold">Sonuç bekleniyor</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">Geçerli bir donatı adedi girdiğinizde alan burada gösterilir.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section aria-labelledby="equivalents-title" className="tool-panel rounded-xl p-4 sm:p-6">
            <div>
              <h2 id="equivalents-title" className="text-lg font-bold tracking-tight text-foreground">
                Eşdeğer donatılar
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Hedef alanı karşılayan en yakın seçenekler.</p>
            </div>

            {result ? (
              <>
                <div className="mt-5 space-y-2 md:hidden" data-testid="mobile-equivalent-list">
                  {equivalentRows.map((row) => {
                    const isActive = row.diameter === diameter && row.quantity === result.quantity;
                    return (
                      <button
                        key={row.diameter}
                        type="button"
                        onClick={() => selectAlternative(row)}
                        aria-pressed={isActive}
                        className={cn(
                          "grid min-h-14 w-full grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                          isActive
                            ? "border-amber-500/50 bg-amber-500/10"
                            : "border-border bg-card hover:border-amber-500/35",
                        )}
                      >
                        <span className="row-span-2 flex min-w-12 items-center gap-1.5 text-base font-bold text-foreground">
                          Ø{row.diameter}
                          {isActive ? <Check className="h-4 w-4 text-amber-600" aria-hidden="true" /> : null}
                        </span>
                        <span className="flex min-w-0 items-center justify-between gap-3 text-sm">
                          <span className="font-semibold text-foreground">{formatInteger(row.quantity)} adet</span>
                          <span className="font-mono font-semibold tabular-nums">{formatAreaCm2(row.providedAreaMm2)} cm²</span>
                        </span>
                        <span className="text-right font-mono text-xs text-muted-foreground tabular-nums">
                          +{formatAreaCm2(row.surplusAreaMm2)} cm²
                        </span>
                      </button>
                    );
                  })}

                </div>

                <div className="mt-5 hidden md:block" data-testid="desktop-equivalent-table">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Çap</TableHead>
                        <TableHead>Gerekli adet</TableHead>
                        <TableHead>Toplam As</TableHead>
                        <TableHead className="text-right">Fark</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equivalentRows.map((row) => {
                        const isActive = row.diameter === diameter && row.quantity === result.quantity;
                        return (
                          <TableRow key={row.diameter} className={isActive ? "bg-amber-500/10 even:bg-amber-500/10" : undefined}>
                            <TableCell>
                              <button
                                type="button"
                                onClick={() => selectAlternative(row)}
                                aria-pressed={isActive}
                                className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                              >
                                Ø{row.diameter}
                                {isActive ? <Check className="h-4 w-4 text-amber-600" aria-label="Seçili" /> : <span className="text-xs font-medium text-muted-foreground">Seç</span>}
                              </button>
                            </TableCell>
                            <TableCell className="font-mono font-semibold tabular-nums">{formatInteger(row.quantity)}</TableCell>
                            <TableCell className="font-mono font-semibold tabular-nums">{formatAreaCm2(row.providedAreaMm2)} cm²</TableCell>
                            <TableCell className="text-right font-mono text-muted-foreground tabular-nums">+{formatAreaCm2(row.surplusAreaMm2)} cm²</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <p className="mt-5 rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
                Eşdeğerleri görmek için geçerli bir donatı adedi girin.
              </p>
            )}
          </section>

          <details className="group tool-panel rounded-xl" data-testid="rebar-advanced-details">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:px-6 [&::-webkit-details-marker]:hidden">
              <span className="flex min-w-0 items-center gap-3">
                <Ruler className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <span className="font-bold text-foreground">Kesit ve Aralık Kontrolü (TS 500)</span>
              </span>
              <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>

            <div className="border-t border-border p-4 sm:p-6">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                    <div>
                      <label htmlFor="section-width" className="mb-2 block text-sm font-semibold">Kesit genişliği (cm)</label>
                      <Input
                        id="section-width"
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        step="any"
                        value={widthCm}
                        onChange={(event) => setWidthCm(toAdvancedValue(event.target.value))}
                        aria-invalid={!isValidAdvancedValue(widthCm, Number.EPSILON)}
                        aria-describedby={!isValidAdvancedValue(widthCm, Number.EPSILON) ? "advanced-section-error" : undefined}
                      />
                    </div>
                    <div>
                      <label htmlFor="section-cover" className="mb-2 block text-sm font-semibold">Pas payı (mm)</label>
                      <Input
                        id="section-cover"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        value={coverMm}
                        onChange={(event) => setCoverMm(toAdvancedValue(event.target.value))}
                        aria-invalid={!isValidAdvancedValue(coverMm, 0)}
                        aria-describedby={!isValidAdvancedValue(coverMm, 0) ? "advanced-section-error" : undefined}
                      />
                    </div>
                    <div>
                      <label htmlFor="stirrup-diameter" className="mb-2 block text-sm font-semibold">Etriye çapı (mm)</label>
                      <Input
                        id="stirrup-diameter"
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        step="any"
                        value={stirrupDiameterMm}
                        onChange={(event) => setStirrupDiameterMm(toAdvancedValue(event.target.value))}
                        aria-invalid={!isValidAdvancedValue(stirrupDiameterMm, Number.EPSILON)}
                        aria-describedby={!isValidAdvancedValue(stirrupDiameterMm, Number.EPSILON) ? "advanced-section-error" : undefined}
                      />
                    </div>
                  </div>

                  {!advancedValuesAreValid ? (
                    <p id="advanced-section-error" role="alert" className="text-sm text-red-600 dark:text-red-400">Kesit değerlerini geçerli aralıklarda girin.</p>
                  ) : result && spacingCheck ? (
                    <div
                      className={cn(
                        "rounded-lg border p-4",
                        spacingCheck.status === "violated"
                          ? "border-red-500/30 bg-red-500/5"
                          : "border-emerald-500/30 bg-emerald-500/5",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {spacingCheck.status === "violated" ? (
                          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                        )}
                        <div>
                          <p className="font-bold text-foreground">
                            {spacingCheck.status === "violated" ? "Net aralık uygun değil" : "Net aralık uygun"}
                          </p>
                          <dl className="mt-3 grid gap-2 text-sm">
                            <div className="flex justify-between gap-4">
                              <dt className="text-muted-foreground">Mevcut net aralık</dt>
                              <dd className="font-mono font-semibold tabular-nums">{formatDecimal(spacingCheck.netSpacingMm)} mm</dd>
                            </div>
                            <div className="flex justify-between gap-4">
                              <dt className="text-muted-foreground">Minimum limit</dt>
                              <dd className="font-mono font-semibold tabular-nums">{formatDecimal(spacingCheck.minSpacingMm)} mm</dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    </div>
                  ) : result ? (
                    <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">Net aralık kontrolü için aynı sırada en az iki çubuk gerekir.</p>
                  ) : null}

                  <div className="space-y-3 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
                    <p><strong className="text-foreground">TS 500 Md. 7.4.1:</strong> Net yatay aralık ≥ max(25 mm, 1,5Ø).</p>
                    <p><strong className="text-foreground">Şantiye notu:</strong> Eşdeğer adetler yukarı yuvarlanır; uygulama detayında pas payı toleranslarını ayrıca kontrol edin.</p>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-base font-bold text-foreground">Kesit Önizlemesi</h3>
                  {!result ? (
                    <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Geçerli donatı değerleri bekleniyor.</div>
                  ) : result.quantity > SKETCH_QUANTITY_LIMIT ? (
                    <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-sm leading-6 text-muted-foreground">Kesit önizlemesi en fazla {SKETCH_QUANTITY_LIMIT} çubuk için gösterilir. Alan hesabı geçerli değeri kullanmaya devam eder.</div>
                  ) : !advancedValuesAreValid ? (
                    <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Önizleme için geçerli kesit değerleri girin.</div>
                  ) : (
                    <RebarSectionSketch
                      diameterMm={diameter}
                      quantity={result.quantity}
                      widthCm={widthCm}
                      coverMm={coverMm}
                      stirrupDiameterMm={stirrupDiameterMm}
                      isSpacingViolated={spacingCheck?.status === "violated"}
                    />
                  )}
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}

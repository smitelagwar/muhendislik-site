"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, FileText, Info, Plus, Share2, Timer, Trash2, X } from "lucide-react";
import { PageContextNavigation } from "@/components/page-context-navigation";
import {
  PERIOD_SYSTEMS,
  SOIL_CLASSES,
  calculateDesignSpectrumParameters,
  calculateEmpiricalPeriodForSystem,
  calculateHorizontalElasticSpectrum,
  calculateShearWallPeriodParameters,
  createSpectrumPoints,
  findSpectrumCrossCheckMismatches,
  getF1InterpolationDetail,
  getFsInterpolationDetail,
  parseTurkishNumber,
  parseTdthReportText,
  type ParsedTdthReport,
  type PeriodSystem,
  type ShearWallInput,
  type SoilClass,
} from "@/lib/engineering/tbdy2018";

const EARTHQUAKE_LEVELS = ["DD-1", "DD-2", "DD-3", "DD-4"] as const;
type WallDirection = "X" | "Y";
type WallMode = "direct" | "rectangle";

interface WallEntry {
  id: string;
  name: string;
  mode: WallMode;
  areaInput: string;
  lengthInput: string;
  widthInput: string;
}

const createWall = (id: string): WallEntry => ({
  id,
  name: id,
  mode: "direct",
  areaInput: "",
  lengthInput: "",
  widthInput: "",
});

function format(value: number, digits = 3): string {
  return value.toLocaleString("tr-TR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function toInputValue(value: number): string {
  return String(value).replace(".", ",");
}

function inputError(value: number | null, label: string): string | null {
  if (value === null) return `${label} için sayısal bir değer girin.`;
  if (value <= 0) return `${label} sıfırdan büyük olmalıdır.`;
  return null;
}

function getWallCalculationInput(wall: WallEntry): ShearWallInput | null {
  const lengthM = parseTurkishNumber(wall.lengthInput);
  const areaM2 = wall.mode === "direct"
    ? parseTurkishNumber(wall.areaInput)
    : (() => {
      const widthM = parseTurkishNumber(wall.widthInput);
      return lengthM !== null && widthM !== null ? lengthM * widthM : null;
    })();

  return lengthM !== null && lengthM > 0 && areaM2 !== null && areaM2 > 0 ? { lengthM, areaM2 } : null;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // A permission-denied clipboard call can still use the document fallback below.
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

export function SeismicPeriodCalculator() {
  const [heightInput, setHeightInput] = useState("15,00");
  const [ssInput, setSsInput] = useState("0,850");
  const [s1Input, setS1Input] = useState("0,250");
  const [soilClass, setSoilClass] = useState<SoilClass>("ZC");
  const [system, setSystem] = useState<PeriodSystem>("reinforced-concrete-frame");
  const [earthquakeLevel, setEarthquakeLevel] = useState<(typeof EARTHQUAKE_LEVELS)[number]>("DD-2");
  const [activeDirection, setActiveDirection] = useState<WallDirection>("X");
  const [walls, setWalls] = useState<Record<WallDirection, WallEntry[]>>({ X: [createWall("P01")], Y: [createWall("P01")] });
  const [txInput, setTxInput] = useState("");
  const [tyInput, setTyInput] = useState("");
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [parsedReport, setParsedReport] = useState<ParsedTdthReport | null>(null);
  const [actionFeedback, setActionFeedback] = useState<"copied" | "shared" | "copy-failed" | null>(null);

  const heightM = parseTurkishNumber(heightInput);
  const ss = parseTurkishNumber(ssInput);
  const s1 = parseTurkishNumber(s1Input);
  const heightError = inputError(heightM, "HN");
  const ssError = inputError(ss, "Ss");
  const s1Error = inputError(s1, "S1");
  const isShearWallOnly = system === "shear-wall-only";
  const currentSystem = PERIOD_SYSTEMS.find((item) => item.id === system);
  const activeWalls = walls[activeDirection];
  const activeWallInputs = useMemo(() => activeWalls.map(getWallCalculationInput), [activeWalls]);
  const hasCompleteWallInputs = activeWallInputs.length > 0 && activeWallInputs.every((wall): wall is ShearWallInput => wall !== null);
  const wallParameters = useMemo(
    () => isShearWallOnly && !heightError && hasCompleteWallInputs
      ? calculateShearWallPeriodParameters(activeWallInputs as ShearWallInput[], heightM as number)
      : null,
    [activeWallInputs, hasCompleteWallInputs, heightError, heightM, isShearWallOnly],
  );

  const regularPeriod = useMemo(
    () => (heightError || isShearWallOnly ? null : calculateEmpiricalPeriodForSystem(system, heightM as number)),
    [heightError, heightM, isShearWallOnly, system],
  );
  const period = isShearWallOnly ? wallParameters?.periodS ?? null : regularPeriod;
  const periodLabel = isShearWallOnly ? `TpA,${activeDirection}` : "TpA";

  const spectrum = useMemo(
    () => (ssError || s1Error ? null : calculateDesignSpectrumParameters(soilClass, ss as number, s1 as number)),
    [s1, s1Error, soilClass, ss, ssError],
  );
  const maxPeriod = useMemo(() => (!period || !Number.isFinite(period) ? 4 : Math.max(4, Math.ceil(period * 2) / 2)), [period]);
  const chartPoints = useMemo(() => (spectrum ? createSpectrumPoints(spectrum, maxPeriod, 160, period ? [period] : []) : []), [maxPeriod, period, spectrum]);
  const saeAtPeriod = spectrum && period ? calculateHorizontalElasticSpectrum(period, spectrum) : null;
  const maxAcceleration = spectrum ? Math.max(spectrum.sds * 1.12, ...chartPoints.map((point) => point.acceleration)) : 1;
  const tx = parseTurkishNumber(txInput);
  const ty = parseTurkishNumber(tyInput);
  const fsDetail = spectrum && ss !== null ? getFsInterpolationDetail(soilClass, ss) : null;
  const f1Detail = spectrum && s1 !== null ? getF1InterpolationDetail(soilClass, s1) : null;

  const pastedSpectrum = useMemo(() => {
    if (!parsedReport || parsedReport.ss === undefined || parsedReport.s1 === undefined) return null;
    return calculateDesignSpectrumParameters(parsedReport.soilClass ?? soilClass, parsedReport.ss, parsedReport.s1);
  }, [parsedReport, soilClass]);
  const pasteMismatches = useMemo(
    () => parsedReport && pastedSpectrum ? findSpectrumCrossCheckMismatches(parsedReport.reportedSpectrum, pastedSpectrum) : [],
    [parsedReport, pastedSpectrum],
  );
  const hasParsedValues = Boolean(parsedReport && (
    parsedReport.ss !== undefined
    || parsedReport.s1 !== undefined
    || parsedReport.earthquakeLevel !== undefined
    || parsedReport.soilClass !== undefined
  ));

  const chartW = 640;
  const chartH = 260;
  const chartPadding = { top: 14, right: 14, bottom: 30, left: 40 };
  const innerW = chartW - chartPadding.left - chartPadding.right;
  const innerH = chartH - chartPadding.top - chartPadding.bottom;
  const toX = (value: number) => chartPadding.left + (value / maxPeriod) * innerW;
  const toY = (value: number) => chartPadding.top + innerH - (value / maxAcceleration) * innerH;
  const path = chartPoints.map((point, index) => `${index === 0 ? "M" : "L"}${toX(point.period)} ${toY(point.acceleration)}`).join(" ");

  const summaryText = useMemo(() => {
    if (!period || !spectrum || saeAtPeriod === null) return "";
    return `TBDY 2018 — Deprem Periyot / Elastik Spektrum

${earthquakeLevel}
HN: ${format(heightM as number, 2)} m
Sistem: ${currentSystem?.label}${isShearWallOnly ? ` (${activeDirection} doğrultusu)` : ""}

${periodLabel}: ${format(period)} s
1.4·${periodLabel}: ${format(1.4 * period)} s

Ss: ${format(ss as number)}
S1: ${format(s1 as number)}
Zemin: ${soilClass}

SDS: ${format(spectrum.sds)}
SD1: ${format(spectrum.sd1)}
TA: ${format(spectrum.ta)} s
TB: ${format(spectrum.tb)} s
Sae(${periodLabel}): ${format(saeAtPeriod)} g`;
  }, [activeDirection, currentSystem?.label, earthquakeLevel, heightM, isShearWallOnly, period, periodLabel, s1, saeAtPeriod, soilClass, spectrum, ss]);

  const updateWall = (id: string, changes: Partial<WallEntry>) => {
    setWalls((current) => ({
      ...current,
      [activeDirection]: current[activeDirection].map((wall) => wall.id === id ? { ...wall, ...changes } : wall),
    }));
  };
  const addWall = () => {
    setWalls((current) => {
      const nextNumber = current[activeDirection].length + 1;
      return { ...current, [activeDirection]: [...current[activeDirection], createWall(`P${String(nextNumber).padStart(2, "0")}`)] };
    });
  };
  const removeWall = (id: string) => {
    setWalls((current) => current[activeDirection].length === 1 ? current : {
      ...current,
      [activeDirection]: current[activeDirection].filter((wall) => wall.id !== id),
    });
  };
  const handlePasteParse = () => setParsedReport(parseTdthReportText(pasteText));
  const applyParsedReport = () => {
    if (!parsedReport) return;
    if (parsedReport.ss !== undefined) setSsInput(toInputValue(parsedReport.ss));
    if (parsedReport.s1 !== undefined) setS1Input(toInputValue(parsedReport.s1));
    if (parsedReport.earthquakeLevel) setEarthquakeLevel(parsedReport.earthquakeLevel);
    if (parsedReport.soilClass) setSoilClass(parsedReport.soilClass);
    setPasteDialogOpen(false);
  };
  const handleCopy = async () => {
    if (!summaryText) return;
    const copied = await copyText(summaryText);
    setActionFeedback(copied ? "copied" : "copy-failed");
    window.setTimeout(() => setActionFeedback(null), 2500);
  };
  const handleShare = async () => {
    if (!summaryText) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "TBDY 2018 periyot ve elastik spektrum", text: summaryText });
        setActionFeedback("shared");
        window.setTimeout(() => setActionFeedback(null), 2500);
      } catch {
        // A cancelled native share sheet should remain silent.
      }
      return;
    }
    await handleCopy();
  };

  const numberInputClass = "mt-1.5 h-11 w-full rounded-lg border border-border bg-background px-3 font-mono text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
  const compactInputClass = "h-11 min-w-0 w-full rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

  useEffect(() => {
    if (!pasteDialogOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>("[role='dialog'][aria-labelledby='paste-dialog-title']");
    const focusableSelector = "button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex='-1'])";
    const focusFirst = () => dialog?.querySelector<HTMLElement>(focusableSelector)?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setPasteDialogOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>(focusableSelector)];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    focusFirst();
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [pasteDialogOpen]);

  return (
    <main className="tool-page-shell min-h-screen py-6 text-foreground md:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <PageContextNavigation showBreadcrumbs={false} className="mb-5" />
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <header className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">TBDY 2018</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Deprem Periyodu ve Elastik Spektrum</h1>
              <p className="mt-1 text-sm text-muted-foreground">Yeni binalar için ampirik periyot ve yatay elastik tasarım spektrumu.</p>
            </div>
            <Timer aria-hidden="true" className="hidden h-7 w-7 text-primary sm:block" />
          </header>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
            <section className="border-b border-border p-5 lg:border-b-0 lg:border-r lg:p-7" aria-labelledby="period-inputs">
              <div className="flex items-center justify-between gap-3"><h2 id="period-inputs" className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Periyot</h2></div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center gap-1.5"><label htmlFor="height" className="text-sm font-semibold">Bina yüksekliği HN <span className="font-normal text-muted-foreground">(m)</span></label><span title="TBDY deprem hesabında tanımlanan bina tabanından ölçülen bina yüksekliği. Rijit bodrumda bina tabanının bodrum üst kotunda alınabilmesi için TBDY 3.3.1.1'deki iki koşul birlikte sağlanmalıdır. Çatı üzerindeki küçük kütleli uzantılar HN hesabında dikkate alınmayabilir." aria-label="HN açıklaması" className="inline-flex cursor-help text-muted-foreground"><Info className="h-4 w-4" /></span></div>
                  <input id="height" inputMode="decimal" value={heightInput} onChange={(event) => setHeightInput(event.target.value)} className={numberInputClass} aria-describedby={heightError ? "height-error" : undefined} />
                  {heightError && <p id="height-error" className="mt-1.5 text-xs text-destructive">{heightError}</p>}
                </div>
                <div>
                  <label htmlFor="system" className="text-sm font-semibold">Taşıyıcı sistem</label>
                  <select id="system" value={system} onChange={(event) => setSystem(event.target.value as PeriodSystem)} className={numberInputClass}>
                    {PERIOD_SYSTEMS.slice(0, 3).map((item) => <option key={item.id} value={item.id}>{item.label}{item.ct ? ` — Ct = ${item.ct.toFixed(2)}` : " — Denk. 4.28"}</option>)}
                    <optgroup label="Diğer taşıyıcı sistemler">{PERIOD_SYSTEMS.slice(3).map((item) => <option key={item.id} value={item.id}>{item.label} — Ct = {item.ct?.toFixed(2)}</option>)}</optgroup>
                  </select>
                </div>
              </div>

              {isShearWallOnly && (
                <section className="mt-5 rounded-xl border border-primary/25 bg-primary/5 p-4" aria-labelledby="wall-system-title">
                  <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 id="wall-system-title" className="font-semibold">Perde sistemi Ct hesabı</h3><p className="mt-1 text-xs text-muted-foreground">Denk. 4.28a–4.28b · Her deprem doğrultusu için ayrı hesaplanır.</p></div><div className="inline-flex rounded-lg border border-border bg-background p-1">{(["X", "Y"] as WallDirection[]).map((direction) => <button key={direction} type="button" onClick={() => setActiveDirection(direction)} className={`min-h-9 rounded-md px-3 text-sm font-semibold ${activeDirection === direction ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{direction} doğrultusu</button>)}</div></div>
                  <div className="mt-4 space-y-3">
                    {activeWalls.map((wall, index) => {
                      const calculationInput = activeWallInputs[index];
                      const width = parseTurkishNumber(wall.widthInput);
                      const hasSlendernessNotice = wall.mode === "rectangle" && calculationInput && width !== null && calculationInput.lengthM / width < 6;
                      return <div key={wall.id} className="rounded-lg border border-border bg-background p-3">
                        <div className="grid gap-2 sm:grid-cols-[0.65fr_1fr_1fr_1fr_auto] sm:items-end">
                          <div><label className="text-xs text-muted-foreground" htmlFor={`${wall.id}-name`}>Perde</label><input id={`${wall.id}-name`} value={wall.name} onChange={(event) => updateWall(wall.id, { name: event.target.value })} className={compactInputClass} /></div>
                          <div><label className="text-xs text-muted-foreground" htmlFor={`${wall.id}-mode`}>Giriş</label><select id={`${wall.id}-mode`} value={wall.mode} onChange={(event) => updateWall(wall.id, { mode: event.target.value as WallMode })} className={compactInputClass}><option value="direct">Awj + lwj</option><option value="rectangle">lwj × bwj</option></select></div>
                          {wall.mode === "direct" ? <><div><label className="text-xs text-muted-foreground" htmlFor={`${wall.id}-area`}>Awj (m²)</label><input id={`${wall.id}-area`} inputMode="decimal" value={wall.areaInput} onChange={(event) => updateWall(wall.id, { areaInput: event.target.value })} className={compactInputClass} /></div><div><label className="text-xs text-muted-foreground" htmlFor={`${wall.id}-length`}>lwj (m)</label><input id={`${wall.id}-length`} inputMode="decimal" value={wall.lengthInput} onChange={(event) => updateWall(wall.id, { lengthInput: event.target.value })} onKeyDown={(event) => { if (event.key === "Enter" && index === activeWalls.length - 1) { event.preventDefault(); addWall(); } }} className={compactInputClass} /></div></> : <><div><label className="text-xs text-muted-foreground" htmlFor={`${wall.id}-length`}>lwj (m)</label><input id={`${wall.id}-length`} inputMode="decimal" value={wall.lengthInput} onChange={(event) => updateWall(wall.id, { lengthInput: event.target.value })} className={compactInputClass} /></div><div><label className="text-xs text-muted-foreground" htmlFor={`${wall.id}-width`}>bwj (m)</label><input id={`${wall.id}-width`} inputMode="decimal" value={wall.widthInput} onChange={(event) => updateWall(wall.id, { widthInput: event.target.value })} onKeyDown={(event) => { if (event.key === "Enter" && index === activeWalls.length - 1) { event.preventDefault(); addWall(); } }} className={compactInputClass} /><p className="mt-1 text-[11px] text-muted-foreground">Aw = {calculationInput ? `${format(calculationInput.areaM2, 3)} m²` : "—"}</p></div></>}
                          <button type="button" onClick={() => removeWall(wall.id)} disabled={activeWalls.length === 1} aria-label={`${wall.name || "Perde"} satırını sil`} className="inline-flex h-10 items-center justify-center rounded-md border border-border px-2 text-muted-foreground hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        {hasSlendernessNotice && <p className="mt-2 text-xs leading-5 text-amber-700 dark:text-amber-300">Bu geometri TBDY 7.6.1.2&apos;deki perde tanımındaki uzun kenar/kalınlık ≥ 6 koşulunu sağlamıyor. Bu yalnız bilgi kontrolüdür.</p>}
                      </div>;
                    })}
                  </div>
                  <button type="button" onClick={addWall} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold hover:bg-muted"><Plus className="h-4 w-4" />Satır ekle</button>
                  {wallParameters ? <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4"><div><span className="text-xs text-muted-foreground">ΣAwj</span><p className="font-mono font-semibold">{format(wallParameters.totalWallAreaM2)} m²</p></div><div><span className="text-xs text-muted-foreground">At</span><p className="font-mono font-semibold">{format(wallParameters.equivalentAreaM2)} m²</p></div><div><span className="text-xs text-muted-foreground">Ct</span><p className="font-mono font-semibold">{format(wallParameters.ct)}</p></div><div><span className="text-xs text-muted-foreground">TpA,{activeDirection}</span><p className="font-mono font-semibold">{format(wallParameters.periodS)} s</p></div></div> : <p className="mt-4 text-xs text-muted-foreground">Her perde için geçerli Awj ve lwj değerlerini girin; dikdörtgen yardımcısında Awj = lwj × bwj olarak hesaplanır.</p>}
                </section>
              )}

              <div className="mt-8 flex items-center justify-between gap-3"><h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Spektrum</h2><button type="button" onClick={() => { setPasteDialogOpen(true); setParsedReport(null); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-semibold hover:bg-muted"><FileText className="h-4 w-4" />AFAD raporundan yapıştır</button></div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div><label htmlFor="earthquake-level" className="text-sm font-semibold">Deprem yer hareketi düzeyi</label><select id="earthquake-level" value={earthquakeLevel} onChange={(event) => setEarthquakeLevel(event.target.value as (typeof EARTHQUAKE_LEVELS)[number])} className={numberInputClass}>{EARTHQUAKE_LEVELS.map((level) => <option key={level}>{level}</option>)}</select></div>
                <div><label htmlFor="ss" className="text-sm font-semibold">Ss</label><input id="ss" inputMode="decimal" value={ssInput} onChange={(event) => setSsInput(event.target.value)} className={numberInputClass} aria-describedby={ssError ? "ss-error" : undefined} />{ssError && <p id="ss-error" className="mt-1.5 text-xs text-destructive">{ssError}</p>}</div>
                <div><label htmlFor="s1" className="text-sm font-semibold">S1</label><input id="s1" inputMode="decimal" value={s1Input} onChange={(event) => setS1Input(event.target.value)} className={numberInputClass} aria-describedby={s1Error ? "s1-error" : undefined} />{s1Error && <p id="s1-error" className="mt-1.5 text-xs text-destructive">{s1Error}</p>}</div>
                <div><label htmlFor="soil-class" className="text-sm font-semibold">Yerel zemin sınıfı</label><select id="soil-class" value={soilClass} onChange={(event) => setSoilClass(event.target.value as SoilClass)} className={numberInputClass}>{SOIL_CLASSES.map((item) => <option key={item}>{item}</option>)}</select></div>
              </div>
            </section>

            <aside className="bg-muted/25 p-5 lg:p-7" aria-live="polite">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Sonuç</h2>
              {isShearWallOnly && !wallParameters ? <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm leading-6 text-foreground">Bu sistemde Ct, TBDY 2018 Denk. 4.28a–4.28b&apos;ye göre perde geometrisiyle belirlenir. {heightError ? "Önce geçerli HN değeri girin." : "Seçili doğrultudaki tüm perde verilerini girin."}</div> : period && Number.isFinite(period) ? <div className="mt-4 rounded-xl border border-primary/25 bg-background p-4"><p className="text-sm font-medium text-muted-foreground">Ampirik periyot</p><p className="mt-1 font-mono text-3xl font-bold tracking-tight">{periodLabel} = {format(period)} <span className="text-lg font-semibold text-muted-foreground">s</span></p><div className="mt-4 border-t border-border pt-3"><div className="flex items-center gap-1.5 text-sm font-semibold"><span>1,4·{periodLabel} = {format(1.4 * period)} s</span><span title="TBDY 4.7.3.2, Denk. 4.26 ile hesaplanan hakim periyot için üst sınır referansıdır. Modal analiz programından alınan özdeğer periyotları otomatik olarak bu değere kesilmez." className="cursor-help text-muted-foreground"><Info className="h-4 w-4" /></span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">Denk. 4.26 ile bulunan Tp için üst sınır referansı. TpA&apos;nın doğrudan Tp olarak kullanılması TBDY 4.7.3.3 koşullarına bağlıdır.</p></div></div> : <p className="mt-4 text-sm text-muted-foreground">HN girildiğinde ampirik periyot gösterilir.</p>}
              {soilClass === "ZF" ? <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm leading-6 text-foreground"><strong>ZF için sahaya özel zemin davranış analizi gerekir.</strong><br />TBDY 2018 §16.5 uyarınca Fs, F1, SDS, SD1, TA, TB ve elastik spektrum otomatik hesaplanmaz.</div> : spectrum ? <div className="mt-4 grid grid-cols-2 gap-3 text-sm">{[["Fs", format(spectrum.fs)], ["F1", format(spectrum.f1)], ["SDS", format(spectrum.sds)], ["SD1", format(spectrum.sd1)], ["TA", `${format(spectrum.ta)} s`], ["TB", `${format(spectrum.tb)} s`]].map(([label, value]) => <div key={label} className="rounded-lg border border-border bg-background px-3 py-2.5"><span className="text-xs text-muted-foreground">{label}</span><p className="mt-0.5 font-mono font-semibold">{value}</p></div>)}{saeAtPeriod !== null && <div className="col-span-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5"><span className="text-xs text-muted-foreground">Sae({periodLabel})</span><p className="mt-0.5 font-mono font-semibold">{format(saeAtPeriod)} g</p></div>}</div> : <p className="mt-4 text-sm text-muted-foreground">Geçerli Ss ve S1 değerleriyle spektrum parametreleri gösterilir.</p>}
            </aside>
          </div>

          {spectrum && <section className="border-t border-border p-5 sm:p-7" aria-labelledby="spectrum-chart-title"><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><h2 id="spectrum-chart-title" className="text-base font-bold">Yatay elastik tasarım spektrumu</h2><p className="text-xs text-muted-foreground">TBDY 2018 Denk. 2.2 · TL = 6,00 s</p></div><div className="mt-4 overflow-x-auto rounded-xl border border-border bg-background p-3"><svg viewBox={`0 0 ${chartW} ${chartH}`} role="img" aria-label="Yatay elastik tasarım spektrumu grafiği" className="min-w-[560px] w-full"><line x1={chartPadding.left} y1={chartPadding.top + innerH} x2={chartPadding.left + innerW} y2={chartPadding.top + innerH} stroke="currentColor" opacity="0.25" /><line x1={chartPadding.left} y1={chartPadding.top} x2={chartPadding.left} y2={chartPadding.top + innerH} stroke="currentColor" opacity="0.25" />{[spectrum.ta, spectrum.tb].map((value, index) => <g key={value}><line x1={toX(value)} y1={chartPadding.top} x2={toX(value)} y2={chartPadding.top + innerH} stroke="currentColor" opacity="0.18" strokeDasharray="4 4" /><text x={toX(value)} y={chartH - 8} textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.65">{index === 0 ? "TA" : "TB"}</text></g>)}<path d={path} fill="none" stroke="currentColor" className="text-primary" strokeWidth="2.5" />{period && saeAtPeriod !== null && <g><line x1={toX(period)} y1={chartPadding.top} x2={toX(period)} y2={chartPadding.top + innerH} stroke="#d97706" strokeDasharray="5 3" /><circle cx={toX(period)} cy={toY(saeAtPeriod)} r="4" fill="#d97706" /><text x={Math.min(toX(period) + 7, chartW - 8)} y={Math.max(toY(saeAtPeriod) - 7, 12)} fontSize="10" fill="#b45309">{periodLabel}</text></g>}<text x={chartPadding.left} y={12} fontSize="10" fill="currentColor" opacity="0.65">Sae(T) [g]</text><text x={chartPadding.left + innerW} y={chartH - 8} textAnchor="end" fontSize="10" fill="currentColor" opacity="0.65">T [s] · 0–{format(maxPeriod, 1)}</text></svg></div><p className="mt-3 text-xs leading-5 text-muted-foreground">Grafik, TA ve TB kırılma noktalarını tam olarak içerir; eğrisel bölgeler sürekli örneklenir. {saeAtPeriod !== null ? `${periodLabel} için Sae(${periodLabel}) = ${format(saeAtPeriod)} g.` : ""}</p></section>}

          <section className="border-t border-border px-5 py-4 sm:px-7">
            <details className="group"><summary className="cursor-pointer text-sm font-semibold text-foreground marker:text-muted-foreground">Analiz periyotlarında spektrumu oku</summary><div className="mt-4 rounded-xl border border-border bg-muted/25 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bilgilendirme amaçlı modal/ampirik periyot kıyası</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Bu karşılaştırma tasarım önerisi veya model uygunluğu kararı üretmez; yalnız girilen periyotta elastik spektrum ordinatını gösterir.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><div><label htmlFor="tx" className="text-sm font-semibold">Tx <span className="font-normal text-muted-foreground">(s)</span></label><input id="tx" inputMode="decimal" value={txInput} onChange={(event) => setTxInput(event.target.value)} className={numberInputClass} /></div><div><label htmlFor="ty" className="text-sm font-semibold">Ty <span className="font-normal text-muted-foreground">(s)</span></label><input id="ty" inputMode="decimal" value={tyInput} onChange={(event) => setTyInput(event.target.value)} className={numberInputClass} /></div></div>{period && spectrum ? <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">{[["Tx", tx], ["Ty", ty]].map(([axis, value]) => { const numericValue = value as number | null; const sae = numericValue !== null && numericValue > 0 ? calculateHorizontalElasticSpectrum(numericValue, spectrum) : null; return <div key={axis as string} className="rounded-lg border border-border bg-background p-3"><p className="font-semibold">{axis as string}</p>{sae !== null && Number.isFinite(sae) ? <><p className="mt-1 text-muted-foreground">{axis as string} / {periodLabel}: <span className="font-mono text-foreground">{format((numericValue as number) / period)}</span></p><p className="mt-1 text-muted-foreground">Sae({axis as string}): <span className="font-mono font-semibold text-foreground">{format(sae)} g</span></p></> : <p className="mt-1 text-muted-foreground">Sıfırdan büyük sayısal değer girin.</p>}</div>; })}</div> : <p className="mt-4 text-sm text-muted-foreground">Önce geçerli periyot ve spektrum girdilerini tamamlayın.</p>}</div></details>
            {period && spectrum && <details className="group mt-3"><summary className="cursor-pointer text-sm font-semibold text-foreground marker:text-muted-foreground">Hesap detayını göster</summary><div className="mt-4 rounded-xl border border-border bg-muted/25 p-4 font-mono text-xs leading-6 text-foreground"><p>{periodLabel} = Ct · HN^(3/4)</p>{isShearWallOnly && wallParameters ? <><p>Ct = min(0,1 / √At, 0,07) = {format(wallParameters.ct)}</p><p>At = min(ΣAwj[0,2 + (lwj/HN)²], ΣAwj) = {format(wallParameters.equivalentAreaM2)} m²</p></> : <p>= {format(currentSystem?.ct ?? 0)} · {format(heightM as number, 2)}^0,75 = {format(period)} s</p>}<p className="mt-3">Fs = {format(spectrum.fs)} · TBDY Tablo 2.1 — {soilClass}, Ss={format(ss as number)}</p>{fsDetail?.interpolated && <p className="text-muted-foreground">Doğrusal enterpolasyon: Ss={format(ss as number)}; {format(fsDetail.lowerPoint, 2)}–{format(fsDetail.upperPoint, 2)} aralığı.</p>}<p>F1 = {format(spectrum.f1)} · TBDY Tablo 2.2 — {soilClass}, S1={format(s1 as number)}</p>{f1Detail?.interpolated && <p className="text-muted-foreground">Doğrusal enterpolasyon: S1={format(s1 as number)}; {format(f1Detail.lowerPoint, 2)}–{format(f1Detail.upperPoint, 2)} aralığı.</p>}<p className="mt-3">SDS = Ss · Fs = {format(ss as number)} · {format(spectrum.fs)} = {format(spectrum.sds)}</p><p>SD1 = S1 · F1 = {format(s1 as number)} · {format(spectrum.f1)} = {format(spectrum.sd1)}</p><p>TA = 0,2 · SD1/SDS = {format(spectrum.ta)} s</p><p>TB = SD1/SDS = {format(spectrum.tb)} s</p><p>Sae({periodLabel}) = {format(saeAtPeriod as number)} g</p></div></details>}
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-7"><p className="text-xs text-muted-foreground">{actionFeedback === "copied" ? "Hesap özeti kopyalandı." : actionFeedback === "shared" ? "Hesap özeti paylaşıldı." : actionFeedback === "copy-failed" ? "Kopyalama yapılamadı; tarayıcı iznini kontrol edin." : ""}</p><div className="flex gap-2"><button type="button" onClick={handleShare} disabled={!summaryText} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"><Share2 className="h-4 w-4" />Paylaş</button><button type="button" onClick={handleCopy} disabled={!summaryText} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"><Copy className="h-4 w-4" />Kopyala</button></div></footer>
        </section>
      </div>

      {pasteDialogOpen && <div role="dialog" aria-modal="true" aria-labelledby="paste-dialog-title" className="fixed inset-0 z-50 flex items-end bg-black/50 p-0 sm:items-center sm:justify-center sm:p-6"><div className="w-full rounded-t-2xl border border-border bg-card shadow-xl sm:max-w-2xl sm:rounded-2xl"><div className="flex items-start justify-between gap-4 border-b border-border p-5"><div><h2 id="paste-dialog-title" className="text-lg font-bold">AFAD raporundan yapıştır</h2><p className="mt-1 text-sm text-muted-foreground">TDTH detay raporundan kopyaladığınız metin yalnız bu tarayıcıda okunur; sunucuya gönderilmez.</p></div><button type="button" onClick={() => setPasteDialogOpen(false)} aria-label="Pencereyi kapat" className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-5 w-5" /></button></div><div className="p-5"><label htmlFor="tdth-text" className="text-sm font-semibold">Rapor metni</label><textarea id="tdth-text" value={pasteText} onChange={(event) => { setPasteText(event.target.value); setParsedReport(null); }} rows={8} className="mt-2 w-full rounded-lg border border-border bg-background p-3 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Ss = 0,860&#10;S1 = 0,229&#10;Deprem Yer Hareketi Düzeyi: DD-2&#10;Yerel Zemin Sınıfı: ZD" />{parsedReport && <div className="mt-4 rounded-xl border border-border bg-muted/25 p-4"><h3 className="font-semibold">Bulunan veriler</h3><div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4"><div><span className="text-xs text-muted-foreground">Deprem düzeyi</span><p className="font-mono">{parsedReport.earthquakeLevel ?? "Bulunamadı"}</p></div><div><span className="text-xs text-muted-foreground">Ss</span><p className="font-mono">{parsedReport.ss === undefined ? "Bulunamadı" : format(parsedReport.ss)}</p></div><div><span className="text-xs text-muted-foreground">S1</span><p className="font-mono">{parsedReport.s1 === undefined ? "Bulunamadı" : format(parsedReport.s1)}</p></div><div><span className="text-xs text-muted-foreground">Zemin</span><p className="font-mono">{parsedReport.soilClass ?? "Bulunamadı"}</p></div></div>{!hasParsedValues && <p className="mt-3 text-xs leading-5 text-destructive">Yapıştırılan metinde desteklenen bir alan bulunamadı.</p>}{!parsedReport.soilClass && <p className="mt-3 text-xs leading-5 text-muted-foreground">Yerel zemin sınıfı rapor metninde bulunamadı. Mevcut {soilClass} değeri değiştirilmez.</p>}{parsedReport.soilClass && <p className="mt-3 text-xs leading-5 text-muted-foreground">Raporda seçili zemin sınıfı: {parsedReport.soilClass}. Proje zemin/temel etüdüyle uyumunu kontrol edin.</p>}{pasteMismatches.length > 0 && <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-5 text-foreground">Rapor sonucu ile yeniden hesaplanan sonuç eşleşmiyor ({pasteMismatches.map((item) => item.field.toUpperCase()).join(", ")}). Yapıştırılan metni ve zemin sınıfını kontrol edin. Raporun türetilmiş değerleri kaynak olarak kullanılmaz.</p>}</div>}</div><footer className="flex flex-wrap justify-end gap-2 border-t border-border p-5"><button type="button" onClick={() => setPasteDialogOpen(false)} className="min-h-11 rounded-lg border border-border bg-background px-4 text-sm font-semibold hover:bg-muted">Vazgeç</button>{parsedReport ? <button type="button" onClick={applyParsedReport} disabled={!hasParsedValues} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">Uygula</button> : <button type="button" onClick={handlePasteParse} disabled={!pasteText.trim()} className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">Verileri bul</button>}</footer></div></div>}
    </main>
  );
}

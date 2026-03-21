"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, startTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, ExternalLink, FileText, Printer } from "lucide-react";
import {
  buildOfficialCostPdfSnapshot,
  exportPdf,
} from "@/lib/calculations/reporting";
import {
  OFFICIAL_UNIT_COST_SOURCE_2026,
  calculateOfficialUnitCost,
  getOfficialCostClasses,
  getOfficialCostGroups,
  getOfficialUnitCostsByYear,
} from "@/lib/calculations/official-unit-costs";
import type {
  OfficialCostClassCode,
  OfficialCostGroupCode,
} from "@/lib/calculations/official-unit-costs";
import { formatM2Fiyat, formatTL } from "@/lib/calculations/core";

const YIL = 2026;

function clampArea(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(1_000_000, Math.max(1, value));
}

export function OfficialUnitCostClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const groups = useMemo(() => getOfficialCostGroups(YIL), []);
  const allRows = useMemo(() => getOfficialUnitCostsByYear(YIL), []);

  const groupParam = searchParams.get("grup") as OfficialCostGroupCode | null;
  const initialGroup = groupParam && groups.includes(groupParam) ? groupParam : groups[0];
  const initialClasses = getOfficialCostClasses(YIL, initialGroup);
  const classParam = searchParams.get("sinif") as OfficialCostClassCode | null;
  const initialClass =
    classParam && initialClasses.includes(classParam) ? classParam : initialClasses[0];
  const initialArea = clampArea(
    Number.parseFloat(searchParams.get("alan") ?? "1000")
  );

  const [grup, setGrup] = useState<OfficialCostGroupCode>(initialGroup);
  const [sinif, setSinif] = useState<OfficialCostClassCode>(initialClass);
  const [alan, setAlan] = useState(initialArea);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const classOptions = useMemo(() => getOfficialCostClasses(YIL, grup), [grup]);

  useEffect(() => {
    if (!classOptions.includes(sinif)) {
      setSinif(classOptions[0]);
    }
  }, [classOptions, sinif]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("yil", String(YIL));
    params.set("grup", grup);
    params.set("sinif", sinif);
    params.set("alan", String(alan));

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [alan, grup, pathname, router, sinif]);

  const result = useMemo(
    () =>
      calculateOfficialUnitCost(
        {
          yil: YIL,
          grup,
          sinif,
        },
        alan
      ),
    [alan, grup, sinif]
  );

  const selectedGroup = useMemo(
    () => allRows.find((row) => row.anaGrupKodu === grup),
    [allRows, grup]
  );

  const detayliMaliyetLink = `/hesaplamalar/insaat-maliyeti?yil=${YIL}&grup=${grup}&sinif=${sinif}&alan=${encodeURIComponent(
    alan
  )}`;

  const downloadPdf = () => {
    if (!result) {
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const pdfSnapshot = buildOfficialCostPdfSnapshot(result);
      exportPdf(pdfSnapshot, `resmi-birim-maliyet-2026-${grup}-${sinif}.pdf`);
    } catch (error) {
      console.error("Official cost PDF export failed", error);
      setExportError("PDF raporu olusturulamadi. Yazdir secenegini kullanabilirsiniz.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="tool-page-shell">
      <div className="mx-auto max-w-screen-2xl px-6 py-12 sm:px-10 lg:px-16">
        <div className="mb-10 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
            <FileText className="h-3.5 w-3.5" />
            Resmi referans araci
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
            Resmi Birim Maliyet 2026
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Resmi tebligdeki grup ve sinifi secin. Metrekare birim maliyetini
            gorun, toplam insaat alaninizi yazin ve resmi yaklasik maliyeti
            aninda bulun.
          </p>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
          <section className="tool-panel rounded-[32px] p-6 md:p-8">
            <div className="mb-6">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                Secim paneli
              </p>
              <h2 className="mt-2 text-2xl font-black text-zinc-950 dark:text-white">
                Resmi sinifi secin
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400" htmlFor="resmi-grup">
                  Ana grup
                </label>
                <select
                  id="resmi-grup"
                  value={grup}
                  onChange={(event) => setGrup(event.target.value as OfficialCostGroupCode)}
                  className="tool-input w-full px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {groups.map((groupCode) => {
                    const row = allRows.find((item) => item.anaGrupKodu === groupCode);
                    return (
                      <option key={groupCode} value={groupCode}>
                        {row?.anaGrupAdi ?? groupCode}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400" htmlFor="resmi-sinif">
                  Alt grup / sinif
                </label>
                <select
                  id="resmi-sinif"
                  value={sinif}
                  onChange={(event) => setSinif(event.target.value as OfficialCostClassCode)}
                  className="tool-input w-full px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  {classOptions.map((classCode) => {
                    const row = allRows.find(
                      (item) => item.anaGrupKodu === grup && item.altGrupKodu === classCode
                    );
                    return (
                      <option key={classCode} value={classCode}>
                        {row?.sinifAdi ?? `${grup}-${classCode}`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400" htmlFor="alan">
                  Toplam insaat alani (m2)
                </label>
                <input
                  id="alan"
                  type="number"
                  min={1}
                  step={1}
                  value={alan}
                  onChange={(event) => setAlan(clampArea(Number.parseFloat(event.target.value)))}
                  className="tool-input w-full px-4 py-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-200/70 bg-blue-50/80 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Formul
              </p>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                Toplam insaat alani × resmi m2 birim maliyeti = toplam resmi yaklasik maliyet
              </p>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Bu aractaki sonuc piyasa teklifi degil, ruhsat ve resmi referans icin kullanilan
                yaklasik maliyet yaklasimidir.
              </p>
            </div>
          </section>

          <section className="tool-result-panel rounded-[32px] p-6 md:p-8 text-white">
            {result ? (
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200/80">
                    Sonuc
                  </p>
                  <h2 className="mt-2 text-3xl font-black">
                    {result.row.sinifAdi}
                  </h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="tool-result-inner rounded-2xl p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100/70">
                      Resmi m2 birim maliyeti
                    </p>
                    <p className="mt-2 text-2xl font-black">{formatM2Fiyat(result.row.m2BirimMaliyet)}</p>
                  </div>
                  <div className="tool-result-inner rounded-2xl p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-blue-100/70">
                      Toplam resmi maliyet
                    </p>
                    <p className="mt-2 text-2xl font-black">{formatTL(result.resmiToplamMaliyet)}</p>
                  </div>
                </div>

                <div className="tool-result-inner rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-blue-100/75">Toplam insaat alani</span>
                    <span className="font-bold tabular-nums">{alan.toLocaleString("tr-TR")} m2</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-4 text-sm">
                    <span className="text-blue-100/75">Seçili grup</span>
                    <span className="font-bold">{selectedGroup?.anaGrupAdi}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-400/20 bg-white/6 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100/80">
                    Kaynak
                  </p>
                  <p className="mt-2 text-sm leading-7 text-blue-50/92">
                    {OFFICIAL_UNIT_COST_SOURCE_2026.label}
                  </p>
                  <Link
                    href={OFFICIAL_UNIT_COST_SOURCE_2026.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-200 hover:text-white"
                  >
                    Resmi PDF&apos;yi ac
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>

                <div className="rounded-2xl border border-blue-400/20 bg-white/6 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-100/80">
                    Ornek yapi turleri
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-blue-50/90">
                    {result.row.ornekYapilar.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-200" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {exportError ? (
                  <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {exportError}
                  </div>
                ) : null}

                <div className="print-hidden grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300/20 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/14"
                  >
                    <Printer className="h-4 w-4" />
                    Yazdir
                  </button>
                  <button
                    type="button"
                    onClick={downloadPdf}
                    disabled={isExporting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-zinc-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Download className={`h-4 w-4 ${isExporting ? "animate-spin" : ""}`} />
                    {isExporting ? "Hazirlaniyor" : "PDF Raporu"}
                  </button>
                </div>

                <Link
                  href={detayliMaliyetLink}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-200 hover:text-white"
                >
                  Detayli maliyet araci ile karsilastir
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

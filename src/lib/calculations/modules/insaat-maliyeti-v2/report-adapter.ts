import { formatM2Fiyat, formatSayi, formatTL, formatYuzde } from "@/lib/calculations/core";
import type { PdfExportSnapshot } from "@/lib/calculations/reporting";
import type { ConstructionCostReportSnapshot } from "./types";

const STRUCTURE_LABELS = {
  apartman: "Apartman",
  villa: "Villa",
  ofis: "Ofis",
  ticari: "Ticari",
} as const;

const QUALITY_LABELS = {
  ekonomik: "Ekonomik",
  standart: "Standart",
  premium: "Premium",
  luks: "Lüks",
} as const;

const REGION_LABELS = {
  istanbul_avrupa: "İstanbul Avrupa",
  istanbul_anadolu: "İstanbul Anadolu",
  ankara: "Ankara",
  izmir: "İzmir",
  bursa: "Bursa",
  antalya: "Antalya",
  kayseri: "Kayseri",
  trabzon: "Trabzon",
  diger_buyuksehir: "Diğer büyükşehir",
  il_merkezi: "İl merkezi",
  ilce: "İlçe / kasaba",
} as const;

function pickActiveScenario(report: ConstructionCostReportSnapshot) {
  return (
    report.scenarios.find((scenario) => scenario.scenarioId === report.activeScenarioId) ??
    report.scenarios[0]
  );
}

export function buildConstructionCostPdfSnapshot(
  report: ConstructionCostReportSnapshot
): PdfExportSnapshot {
  const activeScenario = pickActiveScenario(report);
  const primaryScenario = report.scenarios[0];
  const topLineItems = [...activeScenario.lineItems]
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 4);
  const deltaTone =
    activeScenario.benchmark.status === "high"
      ? "amber"
      : activeScenario.benchmark.status === "low"
        ? "emerald"
        : "blue";

  return {
    variant: "calculation",
    title: `${activeScenario.scenarioName} · İnşaat Maliyet Analizi`,
    subtitle:
      `${activeScenario.inputs.projectName || "Adsız proje"} · ${activeScenario.inputs.floorCount} kat · ` +
      `${formatSayi(activeScenario.equivalentArea, 0)} m² eşdeğer alan`,
    generatedAt: new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(activeScenario.generatedAt)),
    highlights: [
      {
        label: "Toplam maliyet",
        value: formatTL(activeScenario.grandTotal),
        helper: `${formatM2Fiyat(activeScenario.costPerM2)} · ${formatTL(activeScenario.costPerUnit)} / bölüm`,
        tone: "blue",
      },
      {
        label: "Resmî benchmark farkı",
        value: formatTL(activeScenario.benchmark.delta),
        helper: formatYuzde(activeScenario.benchmark.deltaPct),
        tone: deltaTone,
      },
      {
        label: "Risk bandı",
        value: `${formatTL(activeScenario.range.optimistic)} - ${formatTL(activeScenario.range.pessimistic)}`,
        helper: `Varyans ${formatYuzde(activeScenario.range.variancePct)}`,
        tone: "violet",
      },
      {
        label: "Satılabilir m² maliyeti",
        value: formatM2Fiyat(activeScenario.costPerSaleableM2),
        helper: `${formatSayi(activeScenario.saleableArea, 0)} m² satılabilir alan`,
        tone: "slate",
      },
    ],
    sections: [
      {
        title: "Proje ve varsayımlar",
        rows: [
          { label: "Yapı türü", value: STRUCTURE_LABELS[activeScenario.inputs.structureKind] },
          { label: "Kalite seviyesi", value: QUALITY_LABELS[activeScenario.inputs.qualityLevel] },
          { label: "Şehir / bölge", value: REGION_LABELS[activeScenario.inputs.site.region] },
          { label: "Kat / bodrum", value: `${activeScenario.inputs.floorCount} / ${activeScenario.inputs.basementCount}` },
          { label: "Eşdeğer / fiziksel alan", value: `${formatSayi(activeScenario.equivalentArea, 0)} / ${formatSayi(activeScenario.physicalArea, 0)} m²` },
          { label: "Bölüm adedi", value: formatSayi(activeScenario.inputs.unitCount) },
          { label: "Kâr / KDV", value: `${formatYuzde(activeScenario.inputs.commercial.contractorMarginRate)} / ${formatYuzde(activeScenario.inputs.commercial.vatRate)}` },
        ],
      },
      {
        title: "Maliyet kırılımı detay tablosu",
        rows: activeScenario.groups.flatMap((group) => [
          {
            label: `${group.label.toUpperCase()} (${formatYuzde(group.share)})`,
            value: formatTL(group.total),
          },
          ...group.items.map((item) => ({
            label: `  └ ${item.label}`,
            value: formatTL(item.amount),
          })),
        ]),
      },
      {
        title: "En yüksek maliyet kalemleri",
        rows: topLineItems.map((item) => ({
          label: `${item.label} (${formatYuzde(item.share)})`,
          value: formatTL(item.amount),
        })),
      },
      {
        title: "En güçlü etki sürücüleri",
        rows: activeScenario.topDrivers.slice(0, 3).map((driver) => ({
          label: driver.label,
          value: `${formatTL(driver.impactAmount)} · ${formatYuzde(driver.impactPct)}`,
        })),
      },
      {
        title: "Karşılaştırma özeti",
        rows: report.comparisonRows.slice(0, 3).map((row) => {
          const activeValue =
            row.values.find((entry) => entry.scenarioId === activeScenario.scenarioId)?.value ?? 0;
          const baseValue =
            row.values.find((entry) => entry.scenarioId === primaryScenario?.scenarioId)?.value ?? activeValue;
          const delta = activeValue - baseValue;
          const deltaLabel =
            row.unit === "TL" || row.unit.startsWith("TL/")
              ? formatTL(delta)
              : `${formatSayi(delta, 1)} ${row.unit}`;
          return {
            label: primaryScenario && primaryScenario.scenarioId !== activeScenario.scenarioId
              ? `${row.label} (Δ ${delta >= 0 ? "+" : ""}${deltaLabel})`
              : row.label,
            value:
              row.unit === "TL" || row.unit.startsWith("TL/")
                ? formatTL(activeValue)
                : `${formatSayi(activeValue, 1)} ${row.unit}`,
          };
        }),
      },
      {
        title: "Resmî Benchmark Karşılaştırması",
        rows: [
          { label: "Referans sınıfı", value: activeScenario.benchmark.officialResult?.row?.sinifAdi ?? "Tanımsız" },
          { label: "Sınıf kodu", value: activeScenario.benchmark.officialResult?.row?.sinifKodu ?? "-" },
          { label: "Proje birim maliyeti", value: formatM2Fiyat(activeScenario.costPerM2) },
          { label: "Resmî birim maliyet", value: formatM2Fiyat(activeScenario.benchmark.officialUnitCost) },
          { label: "Sapma (Delta)", value: `${activeScenario.benchmark.delta > 0 ? "+" : ""}${formatTL(activeScenario.benchmark.delta)}/m² (${formatYuzde(activeScenario.benchmark.deltaPct)})` },
          { label: "Değerlendirme", value: activeScenario.benchmark.status === "high" ? "Resmî değerin üstünde" : activeScenario.benchmark.status === "low" ? "Resmî değerin altında" : "Resmî bantla uyumlu" },
        ]
      },
      {
        title: "Metodoloji ve Varsayımlar",
        rows: activeScenario.assumptions.map((assumption, idx) => ({
          label: `${idx + 1}. Madde`,
          value: assumption
        }))
      },
    ],
    footnotes: [
      activeScenario.dataSourceLine,
      ...activeScenario.assumptions.slice(0, 2),
      "Bu rapor tahmini maliyet analizi içermektedir. Gerçek maliyetler uygulamaya ve piyasa koşullarına göre değişebilir.",
    ],
  };
}

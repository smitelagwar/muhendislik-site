import type { ConstructionCostReportSnapshot } from "./types";

function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
}

export async function exportConstructionCostExcel(
  report: ConstructionCostReportSnapshot
): Promise<string> {
  const XLSX = await import("xlsx");
  const activeScenario =
    report.scenarios.find((scenario) => scenario.scenarioId === report.activeScenarioId) ??
    report.scenarios[0];

  const summaryRows = [
    ["Rapor", report.title],
    ["Senaryo", activeScenario.scenarioName],
    ["Proje", activeScenario.inputs.projectName],
    ["Toplam maliyet", activeScenario.grandTotal],
    ["m² maliyet", activeScenario.costPerM2],
    ["Satılabilir m² maliyet", activeScenario.costPerSaleableM2],
    ["Resmî benchmark toplam", activeScenario.benchmark.officialTotal],
    ["Benchmark farkı", activeScenario.benchmark.delta],
    ["Risk bandı alt", activeScenario.range.optimistic],
    ["Risk bandı üst", activeScenario.range.pessimistic],
  ];

  const breakdownRows = activeScenario.lineItems.map((item) => ({
    Grup: item.group,
    Kalem: item.label,
    Açıklama: item.description,
    Tutar: item.amount,
    Pay: item.share,
    Override: item.isOverridden ? "Evet" : "Hayır",
  }));

  const assumptionRows = [
    { Başlık: "Yapı türü", Değer: activeScenario.inputs.structureKind },
    { Başlık: "Kalite", Değer: activeScenario.inputs.qualityLevel },
    { Başlık: "Şehir / bölge", Değer: activeScenario.inputs.site.region },
    { Başlık: "Müteahhit kârı", Değer: activeScenario.inputs.commercial.contractorMarginRate },
    { Başlık: "KDV", Değer: activeScenario.inputs.commercial.vatRate },
    { Başlık: "Overhead", Değer: activeScenario.inputs.commercial.overheadRate },
    { Başlık: "Contingency", Değer: activeScenario.inputs.commercial.contingencyRate },
    { Başlık: "Veri kaynağı", Değer: activeScenario.dataSourceLine },
  ];

  const scenarioRows = report.scenarios.map((scenario) => ({
    Senaryo: scenario.scenarioName,
    Toplam: scenario.grandTotal,
    "m² maliyet": scenario.costPerM2,
    "Satılabilir m²": scenario.costPerSaleableM2,
    Benchmark: scenario.benchmark.delta,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), "Özet");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(breakdownRows),
    "Kalem Detayı"
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(assumptionRows),
    "Varsayımlar"
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(scenarioRows), "Senaryolar");

  const dateStamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const filename = `insaat-maliyet-${dateStamp}-${Math.round(activeScenario.equivalentArea)}m2-${slugify(activeScenario.scenarioName)}.xlsx`;
  XLSX.writeFile(workbook, filename);
  return filename;
}

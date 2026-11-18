import { jsPDF } from "jspdf";
import { PDF_SERIF_REGULAR_BASE64, PDF_SERIF_BOLD_BASE64 } from "@/lib/calculations/pdf-fonts.generated";
import { isSolidElement, type CadModel, type SolidElement } from "./model";
import type { JunctionResult } from "./junctions";
import { calculateQuantities, calculateFullTakeoff, type ComprehensiveTakeoffResult } from "./quantities";
import { elementFootprint, polygonArea } from "./geometry";
import type { AnalysisResult, StructuralAnalysisResult } from "./analysis";
import type { ConcreteDesignResult } from "./design-engine";
import { getReportReadiness, reportStatusLabel } from "./report-readiness";
import type { ReportBlock, ReportDocument, ReportSection, TableRowCell } from "./reporting/report-document";
import { renderReportDocumentToPdf } from "./reporting/pdf-renderer";

export type ReportGrouping = "type" | "floor" | "floor-type" | "type-floor" | "material" | "element";
export type ReportOptions = { grouping: ReportGrouping; floorId: string; types: SolidElement["type"][] };
export type ReportRow = {
  id: string;
  key: string;
  count: number;
  gross: number;
  net: number | null;
  formwork: number;
  rebarKg: number | null;
  finishKN: number;
  liveKN: number;
};
export const ELEMENT_NAMES = { column: "Kolon", beam: "Kiriş", wall: "Perde", slab: "Döşeme" };

export function quantityReport(model: CadModel, junctions: JunctionResult, options: ReportOptions): ReportRow[] {
  const groups = new Map<string, ReportRow>();
  for (const e of model.elements) {
    if (!isSolidElement(e) || !options.types.includes(e.type) || (options.floorId && e.floorId !== options.floorId))
      continue;
    const floor = model.floors.find(f => f.id === e.floorId)!,
      material = model.materials.find(m => m.id === e.materialId)!;
    const labels = {
      type: ELEMENT_NAMES[e.type],
      floor: floor?.name ?? "Kat bulunamadı",
      "floor-type": `${floor?.name ?? "Kat bulunamadı"} / ${ELEMENT_NAMES[e.type]}`,
      "type-floor": `${ELEMENT_NAMES[e.type]} / ${floor?.name ?? "Kat bulunamadı"}`,
      material: material?.name ?? "Malzeme bulunamadı",
      element: `${floor?.name ?? "Kat bulunamadı"} / ${e.name} / ${e.group || "Grupsuz"}`,
    };
    const ids = {
      type: e.type,
      floor: e.floorId,
      "floor-type": JSON.stringify([e.floorId, e.type]),
      "type-floor": JSON.stringify([e.type, e.floorId]),
      material: e.materialId,
      element: e.id,
    };
    const id = ids[options.grouping],
      key = labels[options.grouping],
      row =
        groups.get(id) ?? {
          id,
          key,
          count: 0,
          gross: 0,
          net: junctions.status === "resolved" ? 0 : null,
          formwork: 0,
          rebarKg: 0,
          finishKN: 0,
          liveKN: 0,
        };
    const q = calculateQuantities({ ...model, elements: [e] }, junctions).rows.find(r => r.type === e.type)!;
    row.count++;
    row.gross += q.grossVolume;
    if (row.net !== null) {
      const net = junctions.byElement[e.id]?.netVolume;
      row.net = net === null || net === undefined ? null : row.net + net;
    }
    row.formwork += q.formwork;
    row.rebarKg = row.rebarKg !== null && typeof e.rebarMass === "number" && Number.isFinite(e.rebarMass) && e.rebarMass >= 0 ? row.rebarKg + e.rebarMass : null;
    if (e.type === "slab") {
      const area = polygonArea(elementFootprint(e));
      row.finishKN += area * (e.finishLoad ?? 0);
      row.liveKN += area * (e.liveLoad ?? 0);
    }
    groups.set(id, row);
  }
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key, "tr", { numeric: true }));
}

export function reportCsv(rows: ReportRow[]): string {
  const escape = (s: string) => `"${(/^[=+\-@\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""')}"`;
  const n = (v: number | null) => (v === null ? "HESAPLANAMADI" : v.toFixed(6).replace(".", ","));
  return (
    "\uFEFF" +
    [
      "Grup;Adet;Brüt m³;Net m³;Brüt kalıp m²;Elle girilen donatı kg;Kaplama kN;Hareketli kN",
      ...rows.map(r =>
        [escape(r.key), r.count, n(r.gross), n(r.net), n(r.formwork), n(r.rebarKg), n(r.finishKN), n(r.liveKN)].join(
          ";"
        )
      ),
    ].join("\r\n")
  );
}

export interface StaticReportMetadata {
  projectName: string; engineerName: string; engineerTitle: string; licenseNumber: string;
  date: string; buildingType: string; concreteGrade: string; rebarGrade: string;
  city: string; district: string; coordinates: string;
  dts: number | null; bys: number | null; bks: number | null; importanceI: number | null; soilClass: string;
}
const FONT = "IBMPlexSerif";
const MISSING = "VERİ EKSİK";
function display(value: unknown): string {
  if (typeof value === "number") return Number.isFinite(value) ? value.toLocaleString("tr-TR", { maximumFractionDigits: 6 }) : MISSING;
  if (typeof value === "string") return value.trim() || "Belirtilmedi";
  return MISSING;
}
function metadata(model: CadModel, input?: Partial<StaticReportMetadata>): StaticReportMetadata {
  return { projectName: model.name || "Adsız proje", engineerName: "", engineerTitle: "", licenseNumber: "",
    date: new Date().toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" }), buildingType: "",
    concreteGrade: "", rebarGrade: "", city: "", district: "", coordinates: "",
    dts: null, bys: null, bks: null, importanceI: null, soilClass: "", ...input };
}
function document(): jsPDF {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  pdf.addFileToVFS("IBMPlexSerif-Regular.ttf", PDF_SERIF_REGULAR_BASE64);
  pdf.addFont("IBMPlexSerif-Regular.ttf", FONT, "normal");
  pdf.addFileToVFS("IBMPlexSerif-Bold.ttf", PDF_SERIF_BOLD_BASE64);
  pdf.addFont("IBMPlexSerif-Bold.ttf", FONT, "bold");
  pdf.setFont(FONT, "normal");
  pdf.setProperties({ title: "Hsyncad taslak inceleme raporu", author: "Hsyncad" });
  return pdf;
}

class LegacyCoverHelper {
  y = 34;
  constructor(readonly pdf: jsPDF) {}
  section(title: string) {
    this.pdf.setFont(FONT, "bold"); this.pdf.setFontSize(11);
    const lines = this.pdf.splitTextToSize(title, 180) as string[];
    if (this.y + lines.length * 5 + 15 > 275) { this.pdf.addPage(); this.y = 34; }
    this.pdf.text(lines, 15, this.y); this.y += lines.length * 5 + 3;
    this.pdf.setFont(FONT, "normal");
  }
  table(headers: string[], rows: unknown[][], widths = [44, 46, 45, 45]) {
    const pdf = this.pdf, lineHeight = 4;
    const render = (cells: string[][], from: number, lines: number, header: boolean) => {
      let x = 15;
      pdf.setFont(FONT, header ? "bold" : "normal"); pdf.setFontSize(8);
      for (let c = 0; c < widths.length; c++) {
        if (header) { pdf.setFillColor(235, 238, 242); pdf.rect(x, this.y, widths[c], lines * lineHeight + 3, "F"); }
        pdf.setDrawColor(205); pdf.rect(x, this.y, widths[c], lines * lineHeight + 3);
        const text = cells[c].slice(from, from + lines);
        if (text.length) pdf.text(text, x + 1.5, this.y + 4, { lineHeightFactor: 1.4 });
        x += widths[c];
      }
      this.y += lines * lineHeight + 3;
    };
    const wrap = (row: unknown[]) => widths.map((width, i) => {
      pdf.setFontSize(8);
      return pdf.splitTextToSize(display(row[i]), width - 3) as string[];
    });
    const head = wrap(headers), headLines = Math.max(...head.map(c => c.length));
    const drawHead = () => render(head, 0, headLines, true);
    if (this.y + headLines * 4 + 15 > 275) { pdf.addPage(); this.y = 34; }
    drawHead();
    for (const row of rows) {
      const cells = wrap(row), count = Math.max(1, ...cells.map(c => c.length));
      let from = 0;
      while (from < count) {
        const fit = Math.floor((275 - this.y - 3) / lineHeight);
        if (fit < 1) { pdf.addPage(); this.y = 34; drawHead(); continue; }
        const lines = Math.min(fit, count - from);
        render(cells, from, lines, false); from += lines;
        if (from < count) { pdf.addPage(); this.y = 34; drawHead(); }
      }
    }
    this.y += 7;
  }
}

export function drawCoverPage(pdf: jsPDF, model: CadModel, meta: StaticReportMetadata): void {
  const pages = new LegacyCoverHelper(pdf);
  pages.section("TASLAK STATİK İNCELEME RAPORU");
  pages.table(["Alan", "Beyan / kaynak", "Alan", "Beyan / kaynak"], [
    ["Proje", meta.projectName, "Tarih", meta.date],
    ["Mühendis", meta.engineerName, "Unvan", meta.engineerTitle],
    ["Oda sicili (kullanıcı)", meta.licenseNumber, "İl / ilçe", `${meta.city} / ${meta.district}`],
    ["Yapı türü", meta.buildingType, "Kat adedi", model.floors.length],
    ["Beton (beyan)", meta.concreteGrade, "Donatı (beyan)", meta.rebarGrade],
    ["DTS / BYS / BKS", [meta.dts, meta.bys, meta.bks].map(display).join(" / "), "Zemin sınıfı (beyan)", meta.soilClass],
  ]);
  pages.section("Belgenin durumu");
  pages.table(["Kapsam", "Durum", "İnceleme", "Açıklama"], [
    ["Hesap kapsamı", "TAMAMLANMADI", "İmza / onay", "Yok"],
    ["Mevzuat kabulü", "DOĞRULAMA GEREKLİ", "Kaynak", "Mevcut model ve ön hesap kayıtları; kaynak formül ve bütün yaprak kontroller kabul edilmedi."],
  ]);
}

const preliminaryStatus = (pass: boolean | undefined) =>
  pass === false ? "SAĞLANMADI" : pass === true ? "ÖN KONTROL - doğrulama gerekli" : MISSING;

function buildCoverSection(model: CadModel, meta: StaticReportMetadata): ReportSection {
  return {
    id: "kapak",
    title: "TASLAK STATİK İNCELEME RAPORU",
    family: "cover",
    pageBreakBefore: false,
    blocks: [
      {
        type: "keyValueGrid",
        title: "Proje ve Beyan Bilgileri",
        items: [
          { key: "Proje", value: meta.projectName },
          { key: "Tarih", value: meta.date },
          { key: "Mühendis", value: display(meta.engineerName) },
          { key: "Unvan", value: display(meta.engineerTitle) },
          { key: "Oda sicili (kullanıcı)", value: display(meta.licenseNumber) },
          { key: "İl / ilçe", value: `${display(meta.city)} / ${display(meta.district)}` },
          { key: "Yapı türü", value: display(meta.buildingType) },
          { key: "Kat adedi", value: model.floors.length },
          { key: "Beton (beyan)", value: display(meta.concreteGrade) },
          { key: "Donatı (beyan)", value: display(meta.rebarGrade) },
          { key: "DTS / BYS / BKS", value: [meta.dts, meta.bys, meta.bks].map(display).join(" / ") },
          { key: "Zemin sınıfı (beyan)", value: display(meta.soilClass) },
        ],
      },
      {
        type: "callout",
        tone: "warning",
        title: "Belgenin Durumu — Hesap kapsamı: TAMAMLANMADI",
        message: "Mevzuat kabulü: DOĞRULAMA GEREKLİ | İmza / onay: Yok. Mevcut model ve ön hesap kayıtları; kaynak formül ve bütün yaprak kontroller kabul edilmedi.",
      },
    ],
  };
}

function buildTakeoffBlocks(takeoff: ComprehensiveTakeoffResult): ReportBlock[] {
  const verifiedTotal =
    takeoff.rebarTonnage.cutListVerified && takeoff.rebarTonnage.source === "verified_schedule"
      ? takeoff.rebarTonnage.totalKg
      : takeoff.rebarTonnage.missingElementIds.length === 0 && takeoff.rebarTonnage.totalKg !== null
        ? takeoff.rebarTonnage.totalKg
        : null;
  return [
    {
      type: "table",
      table: {
        id: "metraj_ozet_tbl",
        title: "Geometri ve beyan metrajı - kısmi kapsam",
        headers: ["Beton net m³", "Kalıp m²", "Donatı kg", "Donatı kaynağı"],
        columnWidths: [34, 34, 38, 74],
        rows: [[
          display(takeoff.concreteVolumeM3.total),
          display(takeoff.formworkAreaM2.total),
          display(verifiedTotal),
          takeoff.rebarTonnage.cutListVerified
            ? "Doğrulanmış donatı kesim listesi"
            : "Kullanıcı kütlesi; gerçek kesim listesi doğrulanmadı",
        ]],
      },
    },
    {
      type: "table",
      table: {
        id: "metraj_eleman_tbl",
        title: "Eleman bazlı metraj dökümü",
        headers: ["Eleman / kat", "Net beton m³", "Kalıp m²", "Donatı kg"],
        columnWidths: [72, 34, 34, 40],
        rows: takeoff.elementBreakdown.length
          ? takeoff.elementBreakdown.map((e): TableRowCell[] => [
              `${e.id} / ${e.name} / ${e.floorName}`,
              display(e.concreteM3),
              display(e.formworkM2),
              display(e.rebarKg),
            ])
          : [["Kayıt yok", MISSING, MISSING, MISSING]],
      },
    },
    {
      type: "table",
      table: {
        id: "metraj_eksik_tbl",
        title: "Metraj eksikleri ve ölçüm kabulleri",
        headers: ["Kayıt", "Durum", "Tür", "Açıklama"],
        columnWidths: [16, 36, 26, 102],
        rows: [...takeoff.assumptions, ...takeoff.warnings].map((t, i) => [i + 1, "İNCELEME GEREKLİ", "Kapsam", t]),
      },
    },
  ];
}

function buildReportMeta(model: CadModel, meta: StaticReportMetadata, title: string): ReportDocument["metadata"] {
  const revisionId = `rev-${model.floors.length}-${model.elements.length}`;
  return {
    projectName: meta.projectName,
    documentTitle: title,
    engineerName: meta.engineerName || "Belirtilmedi",
    date: meta.date,
    softwareName: "Hsyncad",
    softwareVersion: "Taslak İnceleme Rapor Motoru",
    standards: ["TBDY 2018", "TS 500"],
    disclaimer: "Hesap kapsamı tamamlanmadı. İmza ve kurum onayı içermez.",
    revisionId,
    reviewStatus: "taslak_muhendis_incelemesi_gerekli",
    coverBrandLabel: "HSYNCAD",
    coverSubBrandLabel: "TASLAK STATİK İNCELEME RAPORU",
  };
}

export async function generateStaticReportPDF(
  model: CadModel,
  analysis?: StructuralAnalysisResult | AnalysisResult | null,
  design?: ConcreteDesignResult,
  userMeta?: Partial<StaticReportMetadata>
): Promise<Uint8Array> {
  const meta = metadata(model, userMeta);
  const effectiveDesign = design ?? analysis?.designResult;
  const readiness = getReportReadiness(model, analysis, effectiveDesign);

  const memberRows: TableRowCell[][] = [];
  for (const element of model.elements.filter(isSolidElement)) {
    const member = analysis?.members?.[element.id];
    const check = effectiveDesign?.memberChecks?.[element.id];
    const pass = member?.pass === false || check?.pass === false ? false : member?.pass;
    memberRows.push([
      `${element.id} / ${element.name}`,
      "Kontrol",
      { text: preliminaryStatus(pass), highlight: pass === false, bold: pass === false },
      display(member?.governingCombination),
    ]);
    memberRows.push([
      element.id,
      "N / V / M (kN, kNm)",
      [member?.axialKn, member?.shearKn, member?.momentKnm].map(display).join(" / "),
      "Mevcut ön hesap",
    ]);
    for (const [key, value] of Object.entries(check?.checks ?? {})) {
      memberRows.push([
        element.id,
        key,
        typeof value === "boolean" ? preliminaryStatus(value) : display(value),
        "Mevcut tasarım kaydı",
      ]);
    }
  }

  const relatedRows: TableRowCell[][] = [];
  for (const [name, source, records] of [
    ["Birleşim", "Ön hesap", analysis?.joints], ["Birleşim", "Tasarım", effectiveDesign?.joints],
    ["Güçlü kolon", "Ön hesap", analysis?.columnBeamMoments], ["Güçlü kolon", "Tasarım", effectiveDesign?.columnBeamMoments],
    ["Zımbalama", "Ön hesap", analysis?.punching], ["Zımbalama", "Tasarım", effectiveDesign?.punching],
  ] as const) {
    for (const [id, result] of Object.entries(records ?? {})) {
      relatedRows.push([
        id,
        name,
        { text: preliminaryStatus(result.pass), highlight: result.pass === false, bold: result.pass === false },
        `${source}; normatif kabul bekliyor`,
      ]);
      for (const [key, value] of Object.entries(result)) {
        if (typeof value === "number") relatedRows.push([id, key, display(value), "Kaydedilmiş ham değer"]);
      }
    }
  }

  const extraSoilTables: ReportBlock[] = [];
  if (effectiveDesign?.soilPressure) {
    extraSoilTables.push({
      type: "table",
      table: {
        id: "zemin_durum_tbl",
        title: "Zemin Basıncı Kaydı",
        headers: ["Zemin kaydı", "Durum", "Kapsam", "Kaynak"],
        columnWidths: [40, 44, 52, 44],
        rows: [["Temel-zemin", preliminaryStatus(effectiveDesign.soilPressure.pass), "Temas yöntemi kabul edilmedi", "Mevcut ön hesap"]],
      },
    });
    extraSoilTables.push({
      type: "table",
      table: {
        id: "zemin_ham_tbl",
        headers: ["Zemin kaydı", "Ham değer", "Durum", "Kaynak"],
        columnWidths: [40, 38, 44, 58],
        rows: Object.entries(effectiveDesign.soilPressure)
          .filter(([, v]) => typeof v === "number")
          .map(([k, v]) => [k, display(v), preliminaryStatus(effectiveDesign.soilPressure?.pass), "Mevcut ön hesap; temas yöntemi kabul edilmedi"]),
      },
    });
  }

  const reportMeta = buildReportMeta(model, meta, "TASLAK STATİK İNCELEME RAPORU");
  const doc: ReportDocument = {
    metadata: reportMeta,
    provenance: {
      generatedAt: new Date().toISOString(),
      layoutRevisionId: reportMeta.revisionId,
      calculationEngine: "Hsyncad 2-Pass Statik İnceleme",
    },
    sections: [
      buildCoverSection(model, meta),
      { id: "icindekiler", title: "İçindekiler", family: "toc", blocks: [], pageBreakBefore: true },
      {
        id: "kapsam_sonuc",
        title: "Kapsam ve sonuç",
        family: "readiness",
        pageBreakBefore: true,
        blocks: [
          {
            type: "table",
            table: {
              id: "kapsam_tbl",
              headers: ["Kontrol", "Durum", "Kaynak", "Açıklama"],
              columnWidths: [44, 44, 34, 58],
              rows: [
                ["Genel değerlendirme", reportStatusLabel(readiness.status), "Kapsam denetimi", "Yapı için nihai uygunluk verilmedi."],
                ...readiness.reasons.map((reason, i) => [i + 1, "EKSİK / DOĞRULAMA GEREKLİ", "Rapor kapısı", reason]),
              ],
            },
          },
          {
            type: "table",
            table: {
              id: "kat_tanim_tbl",
              title: "Kat tanımları",
              headers: ["Kat kimliği", "Kat adı", "Taban kotu m", "Yükseklik m"],
              columnWidths: [44, 58, 39, 39],
              rows: model.floors.map(f => [f.id, f.name, display(f.elevation), display(f.height)]),
            },
          },
        ],
      },
      {
        id: "analiz_ozet",
        title: "Mevcut analiz girdileri ve modal kayıtlar - ön hesap",
        family: "calculation",
        pageBreakBefore: true,
        blocks: [
          {
            type: "table",
            table: {
              id: "analiz_ayar_tbl",
              title: "Mevcut analiz girdileri - ön hesap",
              headers: ["Parametre", "Girdi", "Kaynak", "Durum"],
              columnWidths: [44, 44, 46, 46],
              rows: Object.entries(analysis?.settings ?? {}).length
                ? Object.entries(analysis?.settings ?? {}).map(([k, v]) => [k, display(v), "Mevcut analiz kaydı", "Normatif kabul bekliyor"])
                : [["Kayıt yok", MISSING, "Mevcut analiz kaydı", "DOĞRULAMA GEREKLİ"]],
            },
          },
          {
            type: "table",
            table: {
              id: "analiz_buyukluk_tbl",
              title: "Mevcut analiz sayıları - hesap yöntemi doğrulanmadı",
              headers: ["Büyüklük", "Değer", "Birim", "Durum"],
              columnWidths: [48, 38, 28, 66],
              rows: [
                ["Toplam ağırlık", display(analysis?.totalWeightKn), "kN", "Ön hesap kaydı"],
                ["Periyot", display(analysis?.periodSec), "s", "Modal yöntem kabul edilmedi"],
                ["Taban kesmesi", display(analysis?.baseShearKn), "kN", "Ön hesap kaydı"],
                ["Göreli öteleme", display(analysis?.maxDriftRatio), "boyutsuz", "Ön hesap kaydı"],
              ],
            },
          },
          {
            type: "table",
            table: {
              id: "kat_on_hesap_tbl",
              title: "Kat ön hesap kayıtları",
              headers: ["Kat", "Ağırlık kN", "Öteleme oranı", "Kaydedilmiş kontrol"],
              columnWidths: [44, 38, 42, 56],
              rows: (analysis?.storeys ?? []).length
                ? (analysis?.storeys ?? []).map(s => [s.floorId, display(s.totalWeightKn), display(s.driftRatio), preliminaryStatus(s.driftPass)])
                : [["Kayıt yok", MISSING, MISSING, MISSING]],
            },
          },
          {
            type: "table",
            table: {
              id: "modal_on_hesap_tbl",
              title: "Modal ön hesap kayıtları - doğrulanmış 3B modal çözüm değildir",
              headers: ["Mod", "Ön periyot s", "Kütle katılımı", "Durum"],
              columnWidths: [26, 42, 48, 64],
              rows: (analysis?.modes ?? []).length
                ? (analysis?.modes ?? []).map(m => [m.modeNumber, display(m.periodSec), "HESAPLANAMADI", "3B modal çözüm doğrulanmadı"])
                : [["Kayıt yok", MISSING, "HESAPLANAMADI", "DOĞRULAMA GEREKLİ"]],
            },
          },
        ],
      },
      {
        id: "eleman_kontrolleri",
        title: "Eleman ön kontrol kayıtları - tüm fiziksel elemanlar",
        family: "calculation",
        pageBreakBefore: true,
        blocks: [
          {
            type: "table",
            table: {
              id: "eleman_kontrol_tbl",
              headers: ["Eleman", "Kayıt", "Değer / durum", "Kombinasyon / kaynak"],
              columnWidths: [48, 36, 52, 44],
              rows: memberRows.length ? memberRows : [["Fiziksel eleman yok", MISSING, MISSING, "Model boş"]],
            },
          },
          {
            type: "table",
            table: {
              id: "birlesim_zimbalama_tbl",
              title: "Birleşim, güçlü kolon ve zımbalama kayıtları",
              headers: ["Kayıt kimliği", "Tür / alan", "Durum / değer", "Kapsam"],
              columnWidths: [44, 38, 48, 50],
              rows: relatedRows.length ? relatedRows : [["Kayıt yok", MISSING, MISSING, "Örnek satır üretilmedi"]],
            },
          },
        ],
      },
      {
        id: "kapsam_disi_aileler",
        title: "Temel, döşeme, perde, merdiven ve servis kapsamı",
        family: "readiness",
        pageBreakBefore: true,
        blocks: [
          {
            type: "table",
            table: {
              id: "aile_kapsam_tbl",
              headers: ["Aile", "Durum", "Gerekçe", "Sonraki işlem"],
              columnWidths: [38, 42, 54, 46],
              rows: ["Temel-zemin teması", "Döşeme / diyafram", "Perde / bağ kirişi", "Merdiven", "Servis / detaylandırma"].map(name => [
                name,
                "TAM KAPSAM DOĞRULANMADI",
                "Gerekli model/hesap/kaynak zinciri tamamlanmadı",
                "Mühendislik verisi ve bağımsız kontrol gerekli",
              ]),
            },
          },
          ...extraSoilTables,
        ],
      },
      {
        id: "metraj_ek",
        title: "Geometri ve beyan metrajı - kısmi kapsam",
        family: "schedule",
        pageBreakBefore: true,
        blocks: buildTakeoffBlocks(calculateFullTakeoff(model)),
      },
    ],
  };

  return renderReportDocumentToPdf(doc).pdfBytes;
}

export async function generateStaticReportCoverPDF(
  model: CadModel,
  _analysis?: AnalysisResult,
  _design?: ConcreteDesignResult,
  userMeta?: Partial<StaticReportMetadata>
): Promise<Uint8Array> {
  const meta = metadata(model, userMeta);
  const reportMeta = buildReportMeta(model, meta, "TASLAK STATİK İNCELEME RAPORU");
  const doc: ReportDocument = {
    metadata: reportMeta,
    provenance: {
      generatedAt: new Date().toISOString(),
      layoutRevisionId: reportMeta.revisionId,
      calculationEngine: "Hsyncad 2-Pass Kapak Motoru",
    },
    sections: [buildCoverSection(model, meta)],
  };
  return renderReportDocumentToPdf(doc).pdfBytes;
}

export async function generateQuantityReportPDF(
  model: CadModel,
  _takeoff: ComprehensiveTakeoffResult,
  userMeta?: Partial<StaticReportMetadata>
): Promise<Uint8Array> {
  // Eski önbellek veya dışarıdan sağlanan eski sabit sonuç yeniden kullanılmaz.
  const meta = metadata(model, userMeta);
  const freshTakeoff = calculateFullTakeoff(model);
  const reportMeta = buildReportMeta(model, meta, "TASLAK METRAJ İNCELEMESİ");
  const doc: ReportDocument = {
    metadata: reportMeta,
    provenance: {
      generatedAt: new Date().toISOString(),
      layoutRevisionId: reportMeta.revisionId,
      calculationEngine: "Hsyncad 2-Pass Metraj Motoru",
    },
    sections: [
      {
        id: "taslak_metraj",
        title: "TASLAK METRAJ İNCELEMESİ",
        family: "schedule",
        pageBreakBefore: false,
        blocks: buildTakeoffBlocks(freshTakeoff),
      },
    ],
  };
  return renderReportDocumentToPdf(doc).pdfBytes;
}

function download(bytes: Uint8Array, filename: string) {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
  try {
    const a = window.document.createElement("a"); a.href = url; a.download = filename; a.click();
  } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
export async function downloadStaticReportPdf(model: CadModel, analysis?: StructuralAnalysisResult | AnalysisResult | null,
  design?: ConcreteDesignResult, filename = "HsynCAD-Taslak-Statik-Inceleme.pdf"): Promise<void> {
  download(await generateStaticReportPDF(model, analysis, design), filename);
}
export async function downloadQuantityReportPdf(model: CadModel, takeoff: ComprehensiveTakeoffResult,
  filename = "HsynCAD-Taslak-Metraj.pdf"): Promise<void> {
  download(await generateQuantityReportPDF(model, takeoff), filename);
}

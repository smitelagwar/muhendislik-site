/**
 * Unified 2-Pass ideCAD Static + Metraj ReportDocument Builder.
 *
 * Bridges IDE source metadata, 22-group / 146-flag `.rpt` selection,
 * strict zero-element section suppression (FUN_14037f5c0), real structural
 * analysis/modal records (when available, fail-closed otherwise), plan images,
 * and net overlap-deducted Metraj (kalıp, beton, Ø8–Ø12 İnce vs >=Ø14 Kalın donatı)
 * into a single deterministic `ReportDocument`.
 *
 * Client-safe: zero `node:*` imports.
 */

import type {
  ReportBlock,
  ReportDocument,
  ReportKeyValue,
  ReportSection,
  ReportTable,
  TableRowCell,
} from "./report-document";
import { IDE_METRAJ_DIAMETERS, isThinRebarDiameter } from "../quantities";
import type { AnalysisResult, StructuralAnalysisResult } from "../analysis";
import type { ConcreteDesignResult } from "../design-engine";
import type { StructuralBridgeResult } from "../structural/cad-model-bridge";
import type { IdePrecomputedF9, IdeSeismicAndSoilParams } from "../ide-import/ide-r1-r5";

export interface IdeReportElementRow {
  id: string;
  name: string;
  floorName: string;
  groupLabel: string;
  sectionSummary: string;
  detailNote: string;
}

export interface IdeReportGroupSectionInput {
  id: string;
  label: string;
  count: number;
  summaryNote?: string;
  elements: IdeReportElementRow[];
}

export interface IdeMetrajTypeRowInput {
  typeLabel: string;
  count: number;
  grossM3: number;
  netM3: number | null;
  grossFormworkM2?: number;
  formworkM2: number;
}

export interface IdeMetrajFloorRowInput {
  floorName: string;
  grossM3: number;
  netM3: number | null;
  formworkM2: number;
  rebarKg: number | null;
  thinKg?: number | null;
  thickKg?: number | null;
  byDiameter?: Record<number, number>;
}

export interface IdeMetrajElementRowInput {
  id: string;
  name: string;
  type: string;
  floorName: string;
  dimensionText: string;
  concreteM3: number | null;
  formworkM2: number | null;
  rebarKg: number | null;
}

export interface IdeMetrajSectionInput {
  enabled: boolean;
  kalip: boolean;
  beton: boolean;
  donati: boolean;
  detay: boolean;
  sourceLabel: string;
  formworkBasis: "gross_geometry" | "net_deducted";
  cutListVerified: boolean;
  byType: IdeMetrajTypeRowInput[];
  byFloor: IdeMetrajFloorRowInput[];
  elements: IdeMetrajElementRowInput[];
  totalGrossM3: number;
  totalNetM3: number | null;
  totalGrossFormworkM2?: number;
  totalFormworkM2: number;
  totalRebarKg: number | null;
  thinRebarKg: number | null;
  thickRebarKg: number | null;
  byDiameter: Record<number, number>;
  knownRebarSubtotalKg: number;
  missingRebarCount: number;
  warnings: string[];
}

export interface IdeReportBuilderInput {
  projectName: string;
  sourceFilename?: string;
  sourceFormat?: string;
  modelName?: string;
  sha256: string;
  revisionId: string;
  profileSha256?: string;
  optionsSha256?: string;
  scopeText: string;
  includeCover: boolean;
  coverModeLabel?: string;
  hasAciklama: boolean;
  includeRaporIndeksi: boolean;
  includeKatYuk: boolean;
  includeSlabLoads: boolean;
  includeDinamik: boolean;
  includeDuzensizlik: boolean;
  selectedGroupLabels: string[];
  metadata?: {
    title?: string;
    designer?: string;
    licenseTitle?: string;
    revisionNote?: string;
    dateNote?: string;
    writeProjectFilename?: boolean;
    logoDataUrl?: string;
    city?: string;
    district?: string;
    usagePurpose?: string;
    pafta?: string;
    ada?: string;
    parsel?: string;
    concreteGrade?: string;
    rebarGrade?: string;
    regulation?: string;
    soilClass?: string;
    dts?: string | number;
    bys?: string | number;
  };
  floors: Array<{ id: string; name: string; elevation: number; height: number }>;
  slabLoads: Array<{ floorName: string; elementName: string; live: number; dead: number }>;
  structuralSettings?: {
    sds?: number | string | null;
    sd1?: number | string | null;
    ss?: number | string | null;
    s1?: number | string | null;
    r?: number | string | null;
    importance?: number | string | null;
    soilClass?: string | null;
    exposureClass?: string | null;
    ko?: number | null;
    qt?: number | null;
    dts?: string | number | null;
    bys?: string | number | null;
  };
  seismicSoil?: IdeSeismicAndSoilParams | null;
  f9Results?: IdePrecomputedF9 | null;
  analyticalBridge?: StructuralBridgeResult | null;
  analysis?: StructuralAnalysisResult | AnalysisResult | null;
  design?: ConcreteDesignResult | null;
  /** Strictly non-zero present element groups (count > 0); zero-count groups must already be excluded. */
  elementGroups: IdeReportGroupSectionInput[];
  metraj: IdeMetrajSectionInput;
  planDiagrams?: Array<{
    title?: string;
    dataUrl: string;
    widthMm: number;
    heightMm: number;
    caption?: string;
  }>;
  warningsSection?: {
    statusText: string;
    receiptWarnings: string[] | null | undefined;
    sourceWarnings: string[];
    coverageNote?: string;
  };
}

function fmtNum(value: number | null | undefined, maxDigits = 3): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "VERİ EKSİK";
  return value.toLocaleString("tr-TR", { maximumFractionDigits: maxDigits });
}

function fmtOpt(value: string | number | null | undefined, fallback = "Belirtilmedi"): string {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : fallback;
  if (typeof value === "string") return value.trim() || fallback;
  return fallback;
}

export function buildIdeReportDocument(input: IdeReportBuilderInput): ReportDocument {
  const meta = input.metadata;
  const documentTitle = meta?.title?.trim() || "Hsyncad — Statik ve Metraj Birleşik Rapor";
  const dateText = meta?.dateNote?.trim() || new Date().toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" });
  const revisionText = meta?.revisionNote?.trim() || input.revisionId;

  const sections: ReportSection[] = [];

  // 1. KAPAK (Cover Page)
  if (input.includeCover) {
    const coverItems: ReportKeyValue[] = [
      { key: "Proje Başlığı", value: meta?.title?.trim() || input.projectName },
      { key: "Tarih", value: dateText },
      { key: "Dizayn Eden", value: fmtOpt(meta?.designer) },
      { key: "Unvan / Ruhsat", value: fmtOpt(meta?.licenseTitle) },
      { key: "Revizyon", value: revisionText },
      { key: "İl / İlçe", value: `${fmtOpt(meta?.city, "-")} / ${fmtOpt(meta?.district, "-")}` },
      { key: "Pafta / Ada / Parsel", value: `${fmtOpt(meta?.pafta, "-")} / ${fmtOpt(meta?.ada, "-")} / ${fmtOpt(meta?.parsel, "-")}` },
      { key: "Kullanım Amacı", value: fmtOpt(meta?.usagePurpose) },
      { key: "Beton / Donatı", value: `${fmtOpt(meta?.concreteGrade)} / ${fmtOpt(meta?.rebarGrade)}` },
      { key: "Yönetmelik", value: fmtOpt(meta?.regulation, "TBDY 2018 / TS 500") },
      {
        key: "Zemin / DTS / BYS",
        value: `${fmtOpt(meta?.soilClass ?? input.structuralSettings?.soilClass, "-")} / ${fmtOpt(meta?.dts ?? input.structuralSettings?.dts, "-")} / ${fmtOpt(meta?.bys ?? input.structuralSettings?.bys, "-")}`,
      },
      { key: "Rapor Kapsamı", value: input.scopeText },
    ];

    if (meta?.writeProjectFilename !== false) {
      if (input.sourceFilename) {
        coverItems.push({ key: "Kaynak Dosya", value: `${input.sourceFilename} (${input.sourceFormat ?? "IDE"})` });
      } else if (input.modelName) {
        coverItems.push({ key: "Model Adı", value: input.modelName });
      }
    }
    coverItems.push({ key: "Kaynak SHA-256", value: input.sha256 });
    if (input.profileSha256) coverItems.push({ key: "Profil SHA-256", value: input.profileSha256 });
    if (input.optionsSha256) coverItems.push({ key: "Seçenek SHA-256", value: input.optionsSha256 });
    if (input.coverModeLabel) coverItems.push({ key: "İde Kapak (offset 48)", value: input.coverModeLabel });

    const coverBlocks: ReportBlock[] = [
      { type: "keyValueGrid", title: "Proje ve Yapı Künyesi", items: coverItems },
      {
        type: "callout",
        tone: "info",
        title: "Rapor Kapsamı ve Doğrulama Bildirimi",
        message:
          "Bu belge yalnızca doğrulanmış kaynak/CAD model alanlarını, kesişim düşümlü metrajı ve gerçek hesap kayıtlarını içerir. " +
          "Seçili gruplar (" +
          input.selectedGroupLabels.length +
          "): " +
          (input.selectedGroupLabels.join(", ") || "Varsayılan"),
      },
    ];

    sections.push({
      id: "kapak",
      title: "Proje Kapağı",
      family: "cover",
      blocks: coverBlocks,
      pageBreakBefore: false,
    });
  }

  // 2. RAPOR İNDEKSİ (2-Pass Clickable TOC)
  if (input.includeRaporIndeksi) {
    sections.push({
      id: "rapor_indeksi",
      title: "Rapor İndeksi (Aktif ve Projede Mevcut Bölümler)",
      family: "toc",
      blocks: [],
      pageBreakBefore: sections.length > 0,
    });
  }

  // 3. YAPI KAT VE YÜK BİLGİLERİ
  if (input.includeKatYuk) {
    const blocks: ReportBlock[] = [];
    if (!input.includeCover) {
      blocks.push({
        type: "keyValueGrid",
        title: "Özet Künye",
        items: [
          { key: "Proje", value: meta?.title?.trim() || input.projectName },
          { key: "Rapor Kapsamı", value: input.scopeText },
          { key: "Kaynak SHA-256", value: input.sha256 },
          { key: "Revizyon", value: revisionText },
        ],
      });
    }

    blocks.push({
      type: "table",
      table: {
        id: "kat_bilgileri_tbl",
        title: "Kat Genel Bilgileri",
        headers: ["Kat Adı", "Taban Kotu (m)", "Kat Yüksekliği (m)"],
        columnWidths: [90, 48, 48],
        columnAlignments: ["left", "right", "right"],
        compact: true,
        rows: input.floors.map((f) => [f.name, fmtNum(f.elevation, 3), fmtNum(f.height, 3)]),
      },
    });

    if (input.includeSlabLoads) {
      if (input.slabLoads.length > 0) {
        blocks.push({
          type: "table",
          table: {
            id: "normal_doseme_yukleri_tbl",
            title: "Normal Döşeme Yükleri (Q ve G)",
            headers: ["Kat", "Döşeme", "Hareketli Q (tf/m²)", "Sabit G (tf/m²)"],
            columnWidths: [55, 45, 43, 43],
            columnAlignments: ["left", "left", "right", "right"],
            compact: true,
            footnote: "Kaynak IDE modeli Q ve G değerleridir; radye ve diğer eleman yükleri dahil değildir.",
            rows: input.slabLoads.map((l) => [l.floorName, l.elementName, fmtNum(l.live, 3), fmtNum(l.dead, 3)]),
          },
        });
      } else {
        blocks.push({
          type: "paragraph",
          paragraph: { text: "Normal Döşeme Yükleri (Q ve G): Doğrulanmış yük kaydı bulunamadı.", variant: "normal" },
        });
      }
    }

    if (input.planDiagrams?.length) {
      for (const img of input.planDiagrams) {
        blocks.push({
          type: "image",
          dataUrl: img.dataUrl,
          widthMm: img.widthMm,
          heightMm: img.heightMm,
          caption: img.caption ?? img.title,
          align: "center",
        });
      }
    }

    sections.push({
      id: "kat_yuk_bilgileri",
      title: "Yapı Kat ve Yük Bilgileri",
      family: "readiness",
      blocks,
      pageBreakBefore: sections.length > 0,
    });
  }

  // 4. DİNAMİK ANALİZ
  if (input.includeDinamik) {
    const blocks: ReportBlock[] = [];
    const st = input.structuralSettings;
    const bridge = input.analyticalBridge;
    const ssSoil = input.seismicSoil;
    blocks.push({
      type: "keyValueGrid",
      title: "Tasarım Spektrumu ve Yönetmelik Parametreleri (TBDY 2018)",
      items: [
        { key: "Ss / S1", value: `${fmtOpt(st?.ss ?? ssSoil?.ss, "unknown")} / ${fmtOpt(st?.s1 ?? ssSoil?.s1, "unknown")}` },
        { key: "SDS / SD1", value: `${fmtOpt(bridge?.spectrum.sds ?? st?.sds ?? ssSoil?.sds, "unknown")} / ${fmtOpt(bridge?.spectrum.sd1 ?? st?.sd1 ?? ssSoil?.sd1, "unknown")}` },
        { key: "Taşıyıcı Sistem R", value: fmtOpt(st?.r ?? ssSoil?.rEntered, "unknown") },
        { key: "Bina Önem Katsayısı I", value: fmtOpt(st?.importance ?? ssSoil?.importanceI, "unknown") },
        { key: "Yatak Katsayısı ko", value: ssSoil?.subgradeKoTfM3 != null ? `${fmtNum(ssSoil.subgradeKoTfM3, 1)} tf/m³` : fmtOpt(st?.ko, "unknown") },
        { key: "Zemin Emniyet qt", value: ssSoil?.bearingCapacityQtTfM2 != null ? `${fmtNum(ssSoil.bearingCapacityQtTfM2, 2)} tf/m²` : fmtOpt(st?.qt, "unknown") },
      ],
    });

    if (bridge && bridge.modalFull.status === "solved" && bridge.modalFull.modes.length > 0) {
      blocks.push({
        type: "table",
        table: {
          id: "bridge_spektrum_tbl",
          title: "3B Modal ve Tepki Spektrumu Özeti",
          headers: ["Büyüklük", "X Yönü", "Y Yönü", "Birim / Durum"],
          columnWidths: [64, 38, 38, 46],
          compact: true,
          rows: [
            ["Toplam Kütle / Üst Kütle", fmtNum(bridge.totalMassTonnes, 2), fmtNum(bridge.upperMassTonnes, 2), "ton"],
            ["Elastik Taban Kesmesi", fmtNum(bridge.spectrumX.elasticBaseShearKn, 2), fmtNum(bridge.spectrumY.elasticBaseShearKn, 2), "kN"],
            ["Tasarım Taban Kesmesi (Vt)", fmtNum(bridge.spectrumX.designBaseShearKn, 2), fmtNum(bridge.spectrumY.designBaseShearKn, 2), "kN"],
            ["Kütle Katılım Kapsamı", `${(bridge.modalFull.coverageX * 100).toFixed(1)}%`, `${(bridge.modalFull.coverageY * 100).toFixed(1)}%`, `RZ: ${(bridge.modalFull.coverageRZ * 100).toFixed(1)}%`],
          ],
        },
      });
      blocks.push({
        type: "table",
        table: {
          id: "modal_periyotlar_tbl",
          title: "Modal Analiz Periyotları ve Kütle Katılım Oranları",
          headers: ["Mod", "Periyot T (s)", "Frekans f (Hz)", "UX", "UY", "RZ"],
          columnWidths: [20, 36, 36, 31, 31, 32],
          columnAlignments: ["right", "right", "right", "right", "right", "right"],
          compact: true,
          rows: bridge.modalFull.modes.slice(0, 15).map((m) => [
            m.number,
            fmtNum(m.periodSeconds, 5),
            fmtNum(m.frequencyHz, 4),
            fmtNum(m.ux, 4),
            fmtNum(m.uy, 4),
            fmtNum(m.rz, 4),
          ]),
        },
      });
    } else if (input.analysis) {
      blocks.push({
        type: "table",
        table: {
          id: "dinamik_ozet_tbl",
          title: "Analiz Büyüklükleri (Ön Hesap / Kayıtlı Sonuç)",
          headers: ["Büyüklük", "Değer", "Birim", "Durum"],
          columnWidths: [58, 40, 28, 60],
          compact: true,
          rows: [
            ["Toplam Yapı Ağırlığı", fmtNum(input.analysis.totalWeightKn, 2), "kN", "Kayıtlı değer"],
            ["Hakim Periyot T1", fmtNum(input.analysis.periodSec, 4), "s", input.analysis.modes?.length ? "Modal kayıt" : "DOĞRULAMA GEREKLİ"],
            ["Taban Kesme Kuvveti", fmtNum(input.analysis.baseShearKn, 2), "kN", "Kayıtlı değer"],
            ["Maks. Göreli Öteleme", fmtNum(input.analysis.maxDriftRatio, 5), "boyutsuz", "Kayıtlı değer"],
          ],
        },
      });

      if (input.analysis.modes?.length) {
        blocks.push({
          type: "table",
          table: {
            id: "modal_periyotlar_tbl",
            title: "Modal Analiz Periyotları",
            headers: ["Mod", "Periyot (s)", "Kütle Katılımı", "Durum"],
            columnWidths: [25, 45, 56, 60],
            compact: true,
            rows: input.analysis.modes.map((m) => [
              m.modeNumber,
              fmtNum(m.periodSec, 4),
              "HESAPLANAMADI",
              "3B modal katılım doğrulanmadı",
            ]),
          },
        });
      }
    } else if (input.f9Results?.modalTables?.length) {
      const mt = input.f9Results.modalTables[0];
      blocks.push({
        type: "table",
        table: {
          id: "f9_modal_tbl",
          title: `Kaynak F9 Modal Kaydı (${mt.name})`,
          headers: ["Mod", "Frekans (Hz)", "Periyot T (s)", "Kaynak"],
          columnWidths: [24, 48, 48, 66],
          compact: true,
          rows: mt.frequenciesHz.slice(0, 15).map((f, idx) => [
            idx + 1,
            fmtNum(f, 4),
            f > 1e-6 ? fmtNum(1 / f, 5) : "-",
            "IDE F9 ön kayıt",
          ]),
        },
      });
    } else {
      blocks.push({
        type: "callout",
        tone: "warning",
        title: "Dinamik ve Modal Analiz Durumu",
        message: "Modal analiz ve kütle katılım sonuçları: unknown (yerel ideCAD önizlemesinde veya doğrulanmış analiz sonrasında incelenir).",
      });
    }

    sections.push({
      id: "dinamik_analiz",
      title: "Dinamik Analiz",
      family: "calculation",
      blocks,
      pageBreakBefore: sections.length > 0,
    });
  }

  // 5. YAPI DÜZENSİZLİKLERİ
  if (input.includeDuzensizlik) {
    const totalHeight = input.floors.reduce((sum, f) => sum + f.height, 0);
    const bridge = input.analyticalBridge;
    const duzBlocks: ReportBlock[] = [
      {
        type: "keyValueGrid",
        items: [
          { key: "Kapsamdaki Kat Sayısı", value: input.floors.length },
          { key: "Toplam Yapı Yüksekliği", value: `${fmtNum(totalHeight, 3)} m` },
        ],
      },
    ];
    if (bridge && bridge.storeys.length > 0) {
      duzBlocks.push({
        type: "table",
        table: {
          id: "kat_duzensizlik_tbl",
          title: "TBDY 2018 Kat Düzensizlik ve Göreli Öteleme Kontrolleri",
          headers: ["Kat", "A1 ηbi (X/Y)", "Öteleme Oranı (X/Y)", "B2 ηki (X/Y)", "İkinci Mertebe θII"],
          columnWidths: [40, 36, 40, 36, 34],
          compact: true,
          rows: bridge.storeys.map((s) => [
            s.floorName,
            `${fmtNum(s.etaBiX, 3)} / ${fmtNum(s.etaBiY, 3)}`,
            `${fmtNum(s.driftRatioX, 5)} / ${fmtNum(s.driftRatioY, 5)}`,
            `${fmtNum(s.etaKiX, 3)} / ${fmtNum(s.etaKiY, 3)}`,
            `${fmtNum(s.thetaIIX, 4)} / ${fmtNum(s.thetaIIY, 4)}`,
          ]),
        },
      });
    } else {
      duzBlocks.push({
        type: "callout",
        tone: "neutral",
        title: "TBDY 2018 Düzensizlik Tahkikleri",
        message: "A1/B1/B2/B3 düzensizlik ve devrilme moment kontrolleri: unknown (yerel ideCAD veya tam 3B kontrol modülünde doğrulanır).",
      });
    }
    sections.push({
      id: "yapi_duzensizlikleri",
      title: "Yapı Düzensizlikleri",
      family: "calculation",
      blocks: duzBlocks,
      pageBreakBefore: sections.length > 0,
    });
  }

  // 6. ELEMENT GROUPS — STRICT ZERO-ELEMENT SUPPRESSION (count === 0 NEVER emitted!)
  for (const grp of input.elementGroups) {
    if (grp.count <= 0) continue;
    const blocks: ReportBlock[] = [];
    if (grp.summaryNote) {
      blocks.push({ type: "paragraph", paragraph: { text: grp.summaryNote, variant: "normal" } });
    }
    if (grp.elements.length > 0) {
      blocks.push({
        type: "table",
        table: {
          id: `grp_${grp.id}_tbl`,
          headers: ["Kat", "Eleman", "Kesit / Boyut", "Bilgi / Yük"],
          columnWidths: [40, 32, 64, 50],
          compact: true,
          rows: grp.elements.map((el) => [el.floorName, el.name, el.sectionSummary, el.detailNote || "-"]),
        },
      });
    }
    sections.push({
      id: `eleman_grubu_${grp.id}`,
      title: `${grp.label} (${grp.count} adet)`,
      family: "calculation",
      blocks,
      pageBreakBefore: sections.length > 0,
    });
  }

  // 7. UNIFIED METRAJ RAPORU (KALIP · BETON · DONATI / ÖZET)
  if (input.metraj.enabled && (input.metraj.kalip || input.metraj.beton || input.metraj.donati || input.metraj.detay)) {
    const m = input.metraj;
    const blocks: ReportBlock[] = [
      { type: "paragraph", paragraph: { text: m.sourceLabel, variant: "caption" } },
    ];

    if (m.kalip) {
      blocks.push({ type: "paragraph", paragraph: { text: "1. Kalıp Metrajı (m²)", variant: "lead" } });
      if (m.byType.length > 0) {
        const fwRows: TableRowCell[][] = m.byType.map((r) => [
          r.typeLabel,
          { text: String(r.count), align: "right" },
          { text: fmtNum(r.grossFormworkM2 ?? r.formworkM2, 3), align: "right" },
          { text: fmtNum(r.formworkM2, 3), align: "right", bold: true },
        ]);
        fwRows.push([
          { text: "Toplam", bold: true },
          { text: String(m.byType.reduce((s, r) => s + r.count, 0)), align: "right", bold: true },
          { text: fmtNum(m.totalGrossFormworkM2 ?? m.totalFormworkM2, 3), align: "right", bold: true },
          { text: fmtNum(m.totalFormworkM2, 3), align: "right", bold: true },
        ]);
        blocks.push({
          type: "table",
          table: {
            id: "metraj_kalip_tur_tbl",
            headers: ["Eleman Grubu", "Adet", "Brüt Kalıp (m²)", m.formworkBasis === "net_deducted" ? "Net Kalıp (m²)" : "Kalıp (m²)"],
            columnWidths: [72, 24, 45, 45],
            columnAlignments: ["left", "right", "right", "right"],
            compact: true,
            rows: fwRows,
          },
        });
        if (m.byFloor.length > 0) {
          blocks.push({
            type: "table",
            table: {
              id: "metraj_kalip_kat_tbl",
              title: "Katlara Göre Kalıp Dağılımı",
              headers: ["Kat Adı", "Kalıp Alanı (m²)"],
              columnWidths: [120, 66],
              columnAlignments: ["left", "right"],
              compact: true,
              rows: m.byFloor.map((fl) => [fl.floorName, fmtNum(fl.formworkM2, 3)]),
            },
          });
        }
      } else {
        blocks.push({
          type: "paragraph",
          paragraph: { text: "Seçili kapsamda kalıp metrajı hesaplanacak katı eleman bulunamadı.", variant: "normal" },
        });
      }
    }

    if (m.beton) {
      blocks.push({ type: "paragraph", paragraph: { text: "2. Beton Metrajı (m³)", variant: "lead" } });
      if (m.byType.length > 0) {
        const concreteRows: TableRowCell[][] = m.byType.map((r) => [
          r.typeLabel,
          { text: String(r.count), align: "right" },
          { text: fmtNum(r.grossM3, 3), align: "right" },
          { text: r.netM3 !== null ? fmtNum(r.netM3, 3) : "-", align: "right", bold: true },
        ]);
        concreteRows.push([
          { text: "Toplam", bold: true },
          { text: String(m.byType.reduce((s, r) => s + r.count, 0)), align: "right", bold: true },
          { text: fmtNum(m.totalGrossM3, 3), align: "right", bold: true },
          { text: m.totalNetM3 !== null ? fmtNum(m.totalNetM3, 3) : "-", align: "right", bold: true },
        ]);
        blocks.push({
          type: "table",
          table: {
            id: "metraj_beton_tur_tbl",
            headers: ["Eleman Grubu", "Adet", "Brüt Beton (m³)", "Net Beton (m³)"],
            columnWidths: [72, 24, 45, 45],
            columnAlignments: ["left", "right", "right", "right"],
            compact: true,
            rows: concreteRows,
          },
        });
        if (m.byFloor.length > 0) {
          blocks.push({
            type: "table",
            table: {
              id: "metraj_beton_kat_tbl",
              title: "Katlara Göre Beton Dağılımı",
              headers: ["Kat Adı", "Brüt Beton (m³)", "Net Beton (m³)"],
              columnWidths: [96, 45, 45],
              columnAlignments: ["left", "right", "right"],
              compact: true,
              rows: m.byFloor.map((fl) => [
                fl.floorName,
                fmtNum(fl.grossM3, 3),
                fl.netM3 !== null ? fmtNum(fl.netM3, 3) : "-",
              ]),
            },
          });
        }
      } else {
        blocks.push({
          type: "paragraph",
          paragraph: { text: "Seçili kapsamda beton metrajı hesaplanacak katı eleman bulunamadı.", variant: "normal" },
        });
      }
    }

    if (m.donati) {
      blocks.push({ type: "paragraph", paragraph: { text: "3. Donatı / Özet Metraj", variant: "lead" } });
      if (m.cutListVerified && m.totalRebarKg !== null) {
        // ideCAD METRAJ.pdf p. 3: diameter schedule with explicit Ø8–Ø12 (<= 12 mm İNCE) vs >= Ø14 (KALIN) split!
        const activeDiams = IDE_METRAJ_DIAMETERS.filter((d) => (m.byDiameter[d] ?? 0) > 0 || [8, 10, 12, 14, 16, 20].includes(d));
        const headers = [
          "Kat",
          ...activeDiams.map((d) => `Ø${d}`),
          "İnce (Ø8-Ø12)",
          "Kalın (>=Ø14)",
          "Toplam (kg)",
        ];
        const colW = [
          28,
          ...activeDiams.map(() => Math.max(9, Math.floor(104 / Math.max(1, activeDiams.length)))),
          18,
          18,
          18,
        ];
        const aligns: ("left" | "right")[] = ["left", ...headers.slice(1).map(() => "right" as const)];
        const rebarRows: TableRowCell[][] = m.byFloor.map((fl) => {
          const diamMap = fl.byDiameter ?? {};
          let thinFloor = fl.thinKg ?? 0;
          let thickFloor = fl.thickKg ?? 0;
          if (fl.thinKg === undefined && fl.thickKg === undefined) {
            for (const [ds, v] of Object.entries(diamMap)) {
              if (isThinRebarDiameter(Number(ds))) thinFloor += v;
              else thickFloor += v;
            }
          }
          return [
            fl.floorName,
            ...activeDiams.map((d) => (diamMap[d] ? fmtNum(diamMap[d], 1) : "-")),
            fmtNum(thinFloor, 2),
            fmtNum(thickFloor, 2),
            fmtNum(fl.rebarKg, 2),
          ];
        });
        rebarRows.push([
          { text: "TOPLAM", bold: true },
          ...activeDiams.map((d) => ({ text: m.byDiameter[d] ? fmtNum(m.byDiameter[d], 1) : "-", bold: true })),
          { text: fmtNum(m.thinRebarKg, 2), bold: true },
          { text: fmtNum(m.thickRebarKg, 2), bold: true },
          { text: fmtNum(m.totalRebarKg, 2), bold: true },
        ]);
        blocks.push({
          type: "table",
          table: {
            id: "metraj_donati_cap_tbl",
            title: "Çaplara Göre Donatı Dağılımı (kg) — İnce <= Ø12 / Kalın >= Ø14",
            headers,
            columnWidths: colW,
            columnAlignments: aligns,
            compact: true,
            rows: rebarRows,
          },
        });
      } else {
        const msg =
          m.totalRebarKg !== null
            ? `Beyan Edilen Toplam Donatı Kütlesi: ${fmtNum(m.totalRebarKg, 2)} kg (${fmtNum(m.totalRebarKg / 1000, 3)} t) — kesim listesi doğrulanmadı.`
            : "Donatı Metrajı: VERİ EKSİK / unknown — gerçek donatı kesim listesi doğrulanmadı; tahmini donatı tonajı üretilmez." +
              (m.knownRebarSubtotalKg > 0
                ? ` Kısmi beyan alt toplamı: ${fmtNum(m.knownRebarSubtotalKg, 2)} kg (${m.missingRebarCount} elemanda eksik).`
                : "");
        blocks.push({ type: "paragraph", paragraph: { text: msg, variant: "warning" } });
      }

      const ratioBasis = m.totalNetM3 && m.totalNetM3 > 0 ? m.totalNetM3 : m.totalGrossM3;
      const ratio = ratioBasis > 0 ? m.totalFormworkM2 / ratioBasis : null;
      const rebarPerM3 = m.cutListVerified && m.totalRebarKg !== null && ratioBasis > 0 ? m.totalRebarKg / ratioBasis : null;
      blocks.push({
        type: "keyValueGrid",
        title: "Toplam Metraj Özeti",
        items: [
          { key: "Toplam Eleman", value: m.elements.length },
          { key: "Brüt / Net Beton", value: `${fmtNum(m.totalGrossM3, 3)} / ${m.totalNetM3 !== null ? fmtNum(m.totalNetM3, 3) : "-"} m³` },
          { key: m.formworkBasis === "net_deducted" ? "Net Kalıp Alanı" : "Brüt Kalıp Alanı", value: `${fmtNum(m.totalFormworkM2, 3)} m²` },
          { key: "Kalıp / Beton Oranı", value: ratio !== null ? `${fmtNum(ratio, 3)} m²/m³` : "-" },
          { key: "İnce Donatı (Ø8–Ø12)", value: m.cutListVerified ? `${fmtNum(m.thinRebarKg, 2)} kg` : "VERİ EKSİK" },
          { key: "Kalın Donatı (>=Ø14)", value: m.cutListVerified ? `${fmtNum(m.thickRebarKg, 2)} kg` : "VERİ EKSİK" },
          { key: "Donatı / Beton", value: rebarPerM3 !== null ? `${fmtNum(rebarPerM3, 2)} kg/m³` : "VERİ EKSİK" },
        ],
      });

      if (m.warnings.length > 0) {
        blocks.push({
          type: "callout",
          tone: "warning",
          title: "Metraj Notları",
          message: m.warnings.join(" | "),
        });
      }
    }

    if (m.detay) {
      blocks.push({ type: "paragraph", paragraph: { text: "4. Kata ve Elemana Göre Detaylı Metraj", variant: "lead" } });
      if (m.elements.length > 0) {
        blocks.push({
          type: "table",
          table: {
            id: "metraj_detay_eleman_tbl",
            headers: ["Kat", "Tür / Ad", "Boyut", "Beton (m³)", "Kalıp (m²)", "Donatı (kg)"],
            columnWidths: [34, 30, 56, 22, 22, 22],
            columnAlignments: ["left", "left", "left", "right", "right", "right"],
            compact: true,
            rows: m.elements.map((item) => [
              item.floorName,
              `${item.type} ${item.name}`,
              item.dimensionText,
              item.concreteM3 !== null ? fmtNum(item.concreteM3, 4) : "VERİ EKSİK",
              item.formworkM2 !== null ? fmtNum(item.formworkM2, 3) : "VERİ EKSİK",
              item.rebarKg !== null && m.cutListVerified ? fmtNum(item.rebarKg, 2) : item.rebarKg !== null ? fmtNum(item.rebarKg, 2) : "unknown",
            ]),
          },
        });
      } else {
        blocks.push({
          type: "paragraph",
          paragraph: { text: "Detaylı metraj listelenecek eleman bulunamadı.", variant: "normal" },
        });
      }
    }

    sections.push({
      id: "metraj_raporu",
      title: "METRAJ RAPORU (KALIP · BETON · DONATI / ÖZET)",
      family: "schedule",
      blocks,
      pageBreakBefore: sections.length > 0,
    });
  }

  // 8. ANALYSIS STATUS & SOURCE WARNINGS
  if (input.warningsSection) {
    const ws = input.warningsSection;
    const msgs: string[] = [`Analiz uyarı durumu: ${ws.statusText}`];
    if (ws.receiptWarnings?.length) {
      msgs.push(...ws.receiptWarnings);
    } else if (ws.statusText === "unknown" || ws.receiptWarnings == null) {
      msgs.push("Analiz uyarı durumu: unknown (bu işte F9 çalıştırılmadı / kayıtlı sonuç kullanıldı; proje uyarıları ideCAD önizlemesindedir).");
    } else {
      msgs.push("F9 analiz günlüğünde ek uyarı/tavsiye satırı raporlanmadı.");
    }
    if (ws.coverageNote) msgs.push(ws.coverageNote);
    if (ws.sourceWarnings.length) msgs.push(...ws.sourceWarnings);

    sections.push({
      id: "analiz_uyarilari",
      title: "ideCAD Analiz Durumu ve Kaynak Uyarıları",
      family: "appendix",
      blocks: [
        {
          type: "callout",
          tone: "neutral",
          title: "Kapsam ve Analiz Günlüğü",
          message: msgs.join("\n• "),
        },
      ],
      pageBreakBefore: sections.length > 0,
    });
  }

  // Guarantee ReportDocument invariant: >= 1 section even if every flag disabled
  if (sections.length === 0) {
    sections.push({
      id: "bos_kapsam",
      title: "Rapor Özeti",
      family: "readiness",
      blocks: [
        {
          type: "paragraph",
          paragraph: { text: `Proje: ${input.projectName} | Kapsam: ${input.scopeText} — seçili bölüm bulunamadı.`, variant: "normal" },
        },
      ],
      pageBreakBefore: false,
    });
  }

  return {
    metadata: {
      projectName: meta?.title?.trim() || input.projectName,
      documentTitle,
      documentSubtitle: input.scopeText,
      engineerName: fmtOpt(meta?.designer),
      organization: fmtOpt(meta?.licenseTitle, ""),
      date: dateText,
      softwareName: "Hsyncad",
      softwareVersion: "ideCAD Uyumlu 2-Pass Rapor Motoru",
      standards: [fmtOpt(meta?.regulation, "TBDY 2018"), "TS 500", "TS 498"],
      disclaimer:
        "Bu rapor yalnızca doğrulanmış kaynak/CAD model verilerine ve hesap çıktısına dayanır; doğrulanmayan değerler unknown / VERİ EKSİK olarak raporlanır.",
      revisionId: input.revisionId,
      reviewStatus: "taslak_muhendis_incelemesi_gerekli",
      logoDataUrl: meta?.logoDataUrl,
      coverBrandLabel: "HSYNCAD STATİK VE METRAJ",
      coverSubBrandLabel: "2-PASS DOĞRULANMIŞ STATİK VE METRAJ RAPOR MOTORU",
      tocTitle: "Rapor İndeksi (Aktif ve Projede Mevcut Bölümler)",
      tocHint: "Not: Seçili olduğu halde projede/kapsamda 0 adet bulunan eleman grupları rapora dahil edilmemiştir.",
      tocEmptyText: "Seçili ve projede mevcut rapor bölümü bulunamadı.",
      runningHeaderLeft: "Hsyncad - Statik ve Metraj Raporu",
      runningFooterStandardLabel: fmtOpt(meta?.regulation, "TBDY 2018 / TS 500"),
    },
    sections,
    provenance: {
      generatedAt: new Date().toISOString(),
      sourceModelHash: input.sha256,
      layoutRevisionId: input.revisionId,
      calculationEngine: "Hsyncad Unified 2-Pass Builder + ideCAD Net Metraj",
    },
  };
}

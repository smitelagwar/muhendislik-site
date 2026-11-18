/**
 * Hsyncad Structural Reporting - Section Registry (P16)
 *
 * Assembles standardized structural report sections from verified calculation
 * outputs, reinforcement schedules, and project metadata.
 */

import type {
  ReportDocument,
  ReportSection,
  ReportMetadata,
  ReportProvenance,
  CheckItem,
  CheckStatus,
  ReportTable,
  TableRowCell
} from "./report-document";
import type { ReinforcementScheduleResult } from "../structural/reinforcement-schedule";

export interface BeamCalculationSummary {
  elementId: string;
  floorId: string;
  spanM: number;
  bwMm: number;
  hMm: number;
  concreteGrade: string;
  rebarGrade: string;
  designMoments: {
    mEdSpanKnm: number;
    mEdLeftSupportKnm: number;
    mEdRightSupportKnm: number;
  };
  capacities: {
    mRdSpanKnm: number;
    mRdLeftSupportKnm: number;
    mRdRightSupportKnm: number;
    vRdKn: number;
  };
  designShearVEdKn: number;
  axialNEdKn: number;
  utilization: {
    spanFlexure: number;
    supportFlexure: number;
    shear: number;
  };
  checks: CheckItem[];
  status: CheckStatus;
}

export interface ProjectReadinessData {
  totalElementsCount: number;
  computedElementsCount: number;
  unresolvedElementsCount: number;
  allChecksPassed: boolean;
  unsupportedFeatures: string[];
  notes: string[];
}

export interface ReportAssemblyOptions {
  metadata: ReportMetadata;
  provenance: ReportProvenance;
  beamCalculations?: BeamCalculationSummary[];
  reinforcementSchedule?: ReinforcementScheduleResult;
  readiness?: ProjectReadinessData;
  customScopeNotes?: string[];
}

/**
 * Builds the Cover Section (sec-cover)
 */
export function buildCoverSection(meta: ReportMetadata): ReportSection {
  const bDesc = meta.buildingDescription;
  return {
    id: "sec-cover",
    title: meta.documentTitle,
    family: "cover",
    pageBreakBefore: true,
    blocks: [
      {
        type: "paragraph",
        paragraph: {
          text: meta.projectName,
          variant: "lead"
        }
      },
      ...(meta.documentSubtitle
        ? [
            {
              type: "paragraph" as const,
              paragraph: {
                text: meta.documentSubtitle,
                variant: "normal" as const
              }
            }
          ]
        : []),
      {
        type: "keyValueGrid",
        title: "PROJE VE BELGE BİLGİLERİ",
        items: [
          { key: "Proje Adı", value: meta.projectName },
          { key: "Belge Başlığı", value: meta.documentTitle },
          { key: "Proje Revizyonu", value: meta.revisionId },
          { key: "Hesap / Rapor Tarihi", value: meta.date },
          { key: "Sorumlu Mühendis", value: meta.engineerName },
          ...(meta.organization ? [{ key: "Mühendislik Bürosu", value: meta.organization }] : []),
          { key: "Yazılım / Motor", value: `${meta.softwareName} (v${meta.softwareVersion})` },
          { key: "Hesap Standartları", value: meta.standards.join(", ") },
          {
            key: "İnceleme Durumu",
            value:
              meta.reviewStatus === "onayli"
                ? "ONAYLI"
                : meta.reviewStatus === "reddedildi"
                ? "REDDEDİLDİ"
                : "TASLAK (MÜHENDİS İNCELEMESİ GEREKLİ)"
          }
        ]
      },
      ...(bDesc
        ? [
            {
              type: "keyValueGrid" as const,
              title: "YAPI GENEL KARAKTERİSTİĞİ",
              items: [
                { key: "Yapı Türü / Kullanım", value: bDesc.buildingType },
                { key: "Taşıyıcı Sistem", value: bDesc.structuralSystem },
                { key: "Beton Sınıfı", value: bDesc.concreteGrade },
                { key: "Donatı Çeliği Sınıfı", value: bDesc.rebarGrade },
                { key: "Zemin Sınıfı", value: bDesc.soilClass },
                ...(bDesc.earthquakeDts ? [{ key: "Deprem Tasarım Sınıfı", value: bDesc.earthquakeDts }] : [])
              ]
            }
          ]
        : []),
      {
        type: "callout",
        tone: "warning",
        title: "YASAL VE TEKNİK UYARI",
        message: meta.disclaimer
      }
    ]
  };
}

/**
 * Builds Table of Contents Section (sec-toc)
 */
export function buildTocSection(): ReportSection {
  return {
    id: "sec-toc",
    title: "İÇİNDEKİLER",
    family: "toc",
    pageBreakBefore: true,
    blocks: [
      {
        type: "paragraph",
        paragraph: {
          text: "Bu raporun tüm bölümleri ve sayfa numaraları aşağıda listelenmiştir.",
          variant: "normal"
        }
      }
    ]
  };
}

/**
 * Builds Overview & Readiness Section (sec-readiness)
 */
export function buildReadinessSection(
  readiness: ProjectReadinessData,
  prov: ReportProvenance
): ReportSection {
  return {
    id: "sec-readiness",
    title: "1. PROJE KAPSAMI VE HESAP DURUMU",
    family: "readiness",
    pageBreakBefore: true,
    blocks: [
      {
        type: "keyValueGrid",
        title: "MODEL VE HESAP DOĞRULAMA ÖZETİ",
        items: [
          { key: "Toplam Tanımlı Eleman Sayısı", value: readiness.totalElementsCount },
          { key: "Hesabı Tamamlanan Eleman Sayısı", value: readiness.computedElementsCount },
          { key: "Eksik / Hesaplanmamış Eleman Sayısı", value: readiness.unresolvedElementsCount },
          {
            key: "Tüm Kontrollerin Uygunluğu",
            value: readiness.allChecksPassed ? "UYGUN (PASS)" : "KONTROL GEREKLİ / YETERSİZ"
          },
          { key: "Hesap Motoru Sürümü", value: prov.calculationEngine },
          { key: "Türetilme Zamanı", value: prov.generatedAt }
        ]
      },
      ...(readiness.unsupportedFeatures.length > 0
        ? [
            {
              type: "callout" as const,
              tone: "warning" as const,
              title: "DESTEKLENMEYEN / İSTİSNAİ MODELLER",
              message:
                "Aşağıdaki yapısal davranışlar mevcut doğrulanmış hesap kapsamı dışındadır ve harici mühendislik tahkiki gerektirir:\n- " +
                readiness.unsupportedFeatures.join("\n- ")
            }
          ]
        : []),
      ...(readiness.notes.length > 0
        ? [
            {
              type: "paragraph" as const,
              paragraph: {
                text: "Teknik Açıklamalar:\n" + readiness.notes.map((n) => `• ${n}`).join("\n"),
                variant: "normal" as const
              }
            }
          ]
        : [])
    ]
  };
}

/**
 * Builds Calculation Sections for Beams (sec-calc-beams)
 */
export function buildBeamCalculationsSection(
  beams: BeamCalculationSummary[]
): ReportSection {
  const tableRows: TableRowCell[][] = beams.map((b) => [
    b.elementId,
    b.floorId,
    `${b.spanM.toFixed(2)} m`,
    `${b.bwMm}x${b.hMm}`,
    `${b.designMoments.mEdSpanKnm.toFixed(1)} / ${b.capacities.mRdSpanKnm.toFixed(1)}`,
    `${b.designShearVEdKn.toFixed(1)} / ${b.capacities.vRdKn.toFixed(1)}`,
    `${(Math.max(b.utilization.spanFlexure, b.utilization.shear) * 100).toFixed(0)}%`,
    {
      text: b.status.toUpperCase(),
      bold: true,
      align: "center",
      highlight: b.status === "fail"
    }
  ]);

  const summaryTable: ReportTable = {
    id: "tbl-beam-summary",
    title: "Kiriş Boyutları, Tasarım Tesirleri ve Kapasite Özeti",
    headers: ["Eleman", "Kat", "Açıklık", "Kesit", "Md / Mr (kNm)", "Vd / Vr (kN)", "Kapasite", "Durum"],
    rows: tableRows,
    columnWidths: [20, 14, 18, 20, 36, 32, 20, 20],
    columnAlignments: ["left", "center", "right", "center", "center", "center", "right", "center"]
  };

  const detailedChecks: CheckItem[] = beams.flatMap((b) => b.checks);

  return {
    id: "sec-calc-beams",
    title: "2. BETONARME KİRİŞ TAHKİKLERİ VE KAPASİTE HESAPLARI",
    family: "calculation",
    pageBreakBefore: true,
    blocks: [
      {
        type: "paragraph",
        paragraph: {
          text:
            "Kirişlerin eğilme ve kesme kapasiteleri TS 500-2000 (Madde 7.1 ve 7.3) ve TBDY 2018 (Bölüm 7.4) uyarınca " +
            "eşdeğer basınç bloğu ve düzlem kesit kabulüyle hesaplanmıştır. Kapasite kesmesi için süneklik koşulları dikkate alınmıştır.",
          variant: "normal"
        }
      },
      {
        type: "table",
        table: summaryTable
      },
      ...(detailedChecks.length > 0
        ? [
            {
              type: "checkList" as const,
              title: "Norm Kontrol Listesi (TS 500 / TBDY 2018)",
              checks: detailedChecks
            }
          ]
        : [])
    ]
  };
}

/**
 * Builds Reinforcement Schedule Section (sec-rebar-schedule)
 */
export function buildReinforcementScheduleSection(
  schedule: ReinforcementScheduleResult
): ReportSection {
  // 1. Unique bars table
  const barRows: TableRowCell[][] = schedule.uniqueBars.map((b) => [
    b.id,
    b.floorId,
    b.elementId,
    b.role,
    `Ø${b.diameterMm}`,
    b.count,
    b.unitLengthM.toFixed(2),
    b.totalLengthM.toFixed(2),
    (b.totalLengthM > 0 ? b.totalMassKg / b.totalLengthM : 0).toFixed(3),
    b.totalMassKg.toFixed(2)
  ]);

  const uniqueBarsTable: ReportTable = {
    id: "tbl-rebar-unique",
    title: "Donatı Detay Metraj Listesi (Çubuk Çapı, Boy ve Ağırlık Dağılımı)",
    headers: ["Poz / ID", "Kat", "Eleman", "Rol", "Çap", "Adet", "Boy (m)", "Top.Boy", "Birim kg/m", "Top. kg"],
    rows: barRows,
    columnWidths: [24, 14, 16, 26, 12, 12, 18, 18, 18, 22],
    columnAlignments: ["left", "center", "left", "left", "center", "right", "right", "right", "right", "right"],
    footnote: "Çelik birim hacim ağırlığı standart 7850 kg/m³ kabul edilmiştir (M = A × ρ × L)."
  };

  // 2. Subtotals by diameter
  const diaRows: TableRowCell[][] = schedule.subtotalsByDiameter.map((d) => [
    `Ø${d.diameterMm}`,
    d.barCount,
    d.totalLengthM.toFixed(2),
    d.totalMassKg.toFixed(2)
  ]);

  const diaTable: ReportTable = {
    id: "tbl-rebar-diameter-subtotals",
    title: "Çapa Göre Donatı İcmali",
    headers: ["Çap", "Toplam Adet", "Toplam Metraj (m)", "Toplam Ağırlık (kg)"],
    rows: diaRows,
    columnWidths: [36, 36, 54, 54],
    columnAlignments: ["center", "right", "right", "right"]
  };

  // 3. Subtotals by floor
  const floorRows: TableRowCell[][] = schedule.subtotalsByFloor.map((f) => [
    f.floorId,
    f.barCount,
    f.totalLengthM.toFixed(2),
    f.totalMassKg.toFixed(2)
  ]);

  const floorTable: ReportTable = {
    id: "tbl-rebar-floor-subtotals",
    title: "Katlara Göre Donatı İcmali",
    headers: ["Kat", "Toplam Adet", "Toplam Metraj (m)", "Toplam Ağırlık (kg)"],
    rows: floorRows,
    columnWidths: [36, 36, 54, 54],
    columnAlignments: ["left", "right", "right", "right"]
  };

  const isComplete = schedule.isComplete;
  const totalMassStr =
    schedule.totalMassKg !== null
      ? `${schedule.totalMassKg.toFixed(2)} kg`
      : `${schedule.knownMassKg.toFixed(2)} kg (Kısmi - Kapsam Dışı Elemanlar Mevcut)`;

  return {
    id: "sec-rebar-schedule",
    title: "3. DONATI METRAJI VE MALZEME İCMALİ",
    family: "schedule",
    pageBreakBefore: true,
    blocks: [
      {
        type: "keyValueGrid",
        title: "METRAJ VE ÇELİK İCMAL ÖZETİ",
        items: [
          { key: "Proje Revizyonu", value: schedule.projectRevisionId },
          { key: "Donatı Poz Sayısı", value: schedule.uniqueBars.length },
          { key: "Toplam Donatı Metrajı", value: `${schedule.knownLengthM.toFixed(2)} m` },
          { key: "Toplam Donatı Ağırlığı", value: totalMassStr },
          { key: "İnce Donatı (≤Ø12)", value: `${schedule.classification.thinMassKg.toFixed(2)} kg` },
          { key: "Kalın Donatı (>Ø12)", value: `${schedule.classification.thickMassKg.toFixed(2)} kg` },
          {
            key: "Metraj Kapsamı",
            value: isComplete ? "TAM (Bütün elemanlar dahil)" : "KISMI (Çözümlenmemiş elemanlar var)"
          }
        ]
      },
      ...(!isComplete
        ? [
            {
              type: "callout" as const,
              tone: "warning" as const,
              title: "METRAJ EKSİKLİK BİLDİRİMİ",
              message:
                "Projede henüz donatı açılımı tanımlanmamış elemanlar mevcuttur. " +
                "Yukarıdaki metraj yalnızca kesin geometrisi verilen elemanları içerir. " +
                `Eksik eleman sayısı: ${schedule.unresolvedElementIds.length}`
            }
          ]
        : []),
      {
        type: "table",
        table: uniqueBarsTable
      },
      {
        type: "table",
        table: diaTable
      },
      {
        type: "table",
        table: floorTable
      }
    ]
  };
}

/**
 * Builds Status, Scope & Limitations Appendix (sec-appendix)
 */
export function buildAppendixSection(customNotes?: string[]): ReportSection {
  return {
    id: "sec-appendix",
    title: "4. EKLER: KAPSAM, METODOLOJİ VE SINIRLAMALAR",
    family: "appendix",
    pageBreakBefore: true,
    blocks: [
      {
        type: "keyValueGrid",
        title: "HESAP METODOLOJİSİ VE BİLGİ KAYNAKLARI",
        items: [
          { key: "Eğilme Hesabı", value: "TS 500 Bölüm 7.1 eşdeğer dikdörtgen gerilme bloğu (k1=0.85-0.70)" },
          { key: "Kesme Hesabı", value: "TS 500 Bölüm 7.3 ve TBDY 2018 Bölüm 7.4 kapasite kesmesi" },
          { key: "Donatı Metrajı", value: "Fiziksel eksen eğrisi boyu ve nominal çap kesit alanı (M = A × ρ × L)" },
          { key: "Çelik Yoğunluğu", value: "7850 kg/m³ (TS EN 10080)" },
          { key: "Beton Elastisite Modülü", value: "TS 500 Çizelge 3.2 formülasyonu" }
        ]
      },
      {
        type: "callout",
        tone: "neutral",
        title: "KAPSAM VE YETKİ SINIRLARI",
        message:
          "Bu hesap raporu Hsyncad Luna v4 bağımsız mühendislik motoru tarafından üretilmiştir. " +
          "ideCAD, REA veya ticari paket program bağımlılığı bulunmamaktadır. " +
          "Tasarım sonuçları nihai imalata veya ruhsat onayına verilmeden önce sorumlu inşaat mühendisi tarafından kontrol edilmelidir."
      },
      ...(customNotes && customNotes.length > 0
        ? [
            {
              type: "paragraph" as const,
              paragraph: {
                text: "Özel Kapsam Notları:\n" + customNotes.map((n) => `• ${n}`).join("\n"),
                variant: "normal" as const
              }
            }
          ]
        : [])
    ]
  };
}

/**
 * High-level builder that combines all standard sections into a complete ReportDocument.
 */
export function buildReportDocument(options: ReportAssemblyOptions): ReportDocument {
  const sections: ReportSection[] = [];

  // 1. Cover
  sections.push(buildCoverSection(options.metadata));

  // 2. TOC
  sections.push(buildTocSection());

  // 3. Readiness / Overview
  if (options.readiness) {
    sections.push(buildReadinessSection(options.readiness, options.provenance));
  }

  // 4. Beam Calculations
  if (options.beamCalculations && options.beamCalculations.length > 0) {
    sections.push(buildBeamCalculationsSection(options.beamCalculations));
  }

  // 5. Reinforcement Schedule
  if (options.reinforcementSchedule) {
    sections.push(buildReinforcementScheduleSection(options.reinforcementSchedule));
  }

  // 6. Appendix
  sections.push(buildAppendixSection(options.customScopeNotes));

  return {
    metadata: options.metadata,
    sections,
    provenance: options.provenance
  };
}

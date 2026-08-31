import { formatSayi } from "@/lib/calculations/core";
import type {
  QuickFeasibilityResult,
  ReverseSizingResult,
  TypologyCardResult,
  UnitTypology,
} from "./index";

export interface NextBestInputItem {
  priority: number;
  label: string;
  description: string;
  actionHint: string;
}

export interface QuickFeasibilityViewModel {
  statusBadge: {
    text: string;
    description: string;
    variant: "theoretical" | "verified";
  };
  legalRightsFormatted: {
    parcelAreaM2: string;
    taks: string;
    kaks: string;
    taksMaxM2: string;
    emsalMaxM2: string;
    effectiveFootprintLimitM2: string;
    impliedMinFloorPlates: number;
    distributableEmsalProxyM2: string | null;
  };
  typologies: Record<
    UnitTypology,
    {
      unitType: UnitTypology;
      candidateTotalUnitsLabel: string;
      balancedCandidateTotalUnits: number;
      unitsPerFloorLabel: string;
      emsalSharePerUnitLabel: string;
      closedGrossRangeLabel: string;
      netRangeLabel: string;
      shelterSignal: { label: string; tone: "neutral" | "warning" | "alert" };
      liftSignal: { label: string; tone: "neutral" | "warning" | "alert" };
    }
  >;
  reverseSizing: {
    desiredTotalUnits: number;
    emsalShareLabel: string;
    closedGrossRangeLabel: string;
    netRangeLabel: string;
    fitClassBadge: { text: string; description: string };
  } | null;
  customerSummary: string;
  nextBestInput: NextBestInputItem;
}

function formatFitClass(fitClass: ReverseSizingResult["fitClass"]): { text: string; description: string } {
  switch (fitClass) {
    case "TOO_TIGHT":
      return { text: "Çok Sıkışık", description: "Bu arsa ve emsal için hedeflenen daire adedi standart altı küçüklükte kalabilir." };
    case "COMPACT":
      return { text: "Kompakt", description: "Daireler minimum konfor sınırlarına yakın, ekonomik dağılımda kalır." };
    case "BALANCED":
      return { text: "Dengeli", description: "Hedef daire büyüklükleri piyasa ve konfor standartlarıyla dengeli uyum sağlar." };
    case "COMFORTABLE":
      return { text: "Geniş / Konforlu", description: "Daire başına düşen alan ferah bir yerleşime imkân verir." };
    case "VERY_LARGE":
      return { text: "Oldukça Büyük / Lüks", description: "Hedeflenen daire adedi az olduğu için daireler standart üstü genişlikte kalır." };
  }
}

export function buildQuickFeasibilityViewModel(
  result: QuickFeasibilityResult,
  optionalFloorCount?: number | null,
  selectedTypology: UnitTypology = "3+1"
): QuickFeasibilityViewModel {
  const { legalRights, typologyCards, reverseSizing, confidence } = result;

  const statusBadge = {
    text: "TEORİK TAHMİN",
    description: "Güncel imar belgesi ve koordinatlı parsel geometrisi olmadan sonuçlar yasal üst sınırlara dayalı ön fizibilitedir.",
    variant: "theoretical" as const,
  };

  const legalRightsFormatted = {
    parcelAreaM2: `${formatSayi(legalRights.parcelAreaM2, 0)} m²`,
    taks: formatSayi(legalRights.taks, 2),
    kaks: formatSayi(legalRights.kaks, 2),
    taksMaxM2: `${formatSayi(legalRights.taksMaxM2, 1)} m²`,
    emsalMaxM2: `${formatSayi(legalRights.emsalMaxM2, 1)} m²`,
    effectiveFootprintLimitM2: `${formatSayi(legalRights.effectiveFootprintLimitM2, 1)} m²`,
    impliedMinFloorPlates: legalRights.impliedMinFloorPlates,
    distributableEmsalProxyM2:
      legalRights.distributableEmsalProxyM2 !== null
        ? `${formatSayi(legalRights.distributableEmsalProxyM2, 1)} m²`
        : null,
  };

  const formatSignal = (state: TypologyCardResult["triggerSummary"]["shelter"], type: "shelter" | "lift") => {
    if (type === "shelter") {
      switch (state) {
        case "NOT_TRIGGERED":
          return { label: "Sığınak: Eşik altında (<10 BB)", tone: "neutral" as const };
        case "MAY_TRIGGER":
          return { label: "Sığınak: Senaryoya göre tetiklenebilir (10+ BB)", tone: "warning" as const };
        case "CHECK_REQUIRED":
          return { label: "Sığınak: Kontrol tetiklenir (10+ BB)", tone: "alert" as const };
        default:
          return { label: "Sığınak: Teyit bekliyor", tone: "neutral" as const };
      }
    } else {
      switch (state) {
        case "NOT_TRIGGERED":
          return { label: "Asansör: Zorunlu değil (<3 kat)", tone: "neutral" as const };
        case "MAY_TRIGGER":
          return { label: "Asansör: Şaft rezervi kontrolü (3 kat)", tone: "warning" as const };
        case "CHECK_REQUIRED":
          return { label: "Asansör: Zorunlu (4+ kat)", tone: "alert" as const };
        default:
          return { label: "Asansör: Kat bilgisi gerekli", tone: "neutral" as const };
      }
    }
  };

  const typologies = {} as QuickFeasibilityViewModel["typologies"];
  const unitTypes: UnitTypology[] = ["1+1", "2+1", "3+1", "4+1"];

  for (const ut of unitTypes) {
    const card = typologyCards[ut];
    typologies[ut] = {
      unitType: ut,
      candidateTotalUnitsLabel: `~ ${card.candidateTotalUnits.min}–${card.candidateTotalUnits.max} adet`,
      balancedCandidateTotalUnits: card.balancedCandidateTotalUnits,
      unitsPerFloorLabel:
        card.candidateUnitsPerFloor !== null
          ? `Katta ~ ${card.candidateUnitsPerFloor.min}–${card.candidateUnitsPerFloor.max} adet`
          : "Kat bilgisi girilirse hesaplanır",
      emsalSharePerUnitLabel: `~ ${formatSayi(card.theoreticalEmsalSharePerUnitM2.min, 0)}–${formatSayi(card.theoreticalEmsalSharePerUnitM2.max, 0)} m²`,
      closedGrossRangeLabel: `~ ${formatSayi(card.estimatedClosedGrossPerUnitM2.min, 0)}–${formatSayi(card.estimatedClosedGrossPerUnitM2.max, 0)} m²`,
      netRangeLabel: `~ ${formatSayi(card.estimatedNetPerUnitM2.min, 0)}–${formatSayi(card.estimatedNetPerUnitM2.max, 0)} m²`,
      shelterSignal: formatSignal(card.triggerSummary.shelter, "shelter"),
      liftSignal: formatSignal(card.triggerSummary.lift, "lift"),
    };
  }

  const reverseFormatted = reverseSizing
    ? {
        desiredTotalUnits: reverseSizing.desiredTotalUnits,
        emsalShareLabel: `${formatSayi(reverseSizing.theoreticalEmsalSharePerUnitM2, 1)} m²`,
        closedGrossRangeLabel: `~ ${formatSayi(reverseSizing.estimatedClosedGrossRangeM2.min, 0)}–${formatSayi(reverseSizing.estimatedClosedGrossRangeM2.max, 0)} m²`,
        netRangeLabel: `~ ${formatSayi(reverseSizing.estimatedNetRangeM2.min, 0)}–${formatSayi(reverseSizing.estimatedNetRangeM2.max, 0)} m²`,
        fitClassBadge: formatFitClass(reverseSizing.fitClass),
      }
    : null;

  // Müşteriye söylenecek hazır özet cümle
  const selCard = typologies[selectedTypology];
  const customerSummary =
    `Bu verilere göre teorik maksimum taban alanı yaklaşık ${legalRightsFormatted.taksMaxM2}, toplam emsal hakkı yaklaşık ${legalRightsFormatted.emsalMaxM2}'dir. ` +
    (optionalFloorCount
      ? `${optionalFloorCount} kat emsale göre ${selectedTypology} tipinde katta yaklaşık ${selCard.unitsPerFloorLabel.toLowerCase()}, toplamda yaklaşık ${selCard.candidateTotalUnitsLabel} ön aday bağımsız bölüm öngörülmektedir. `
      : `Emsalin TAKS üst sınırında dağıtılabilmesi için en az ~${legalRights.impliedMinFloorPlates} kat plakası gerekir. Tamamı ${selectedTypology} yapıldığında toplamda yaklaşık ${selCard.candidateTotalUnitsLabel} ön aday bağımsız bölüm öngörülmektedir. `) +
    `Tahmini daire kapalı brüt alanı ${selCard.closedGrossRangeLabel}, net alanı ise ${selCard.netRangeLabel} bandındadır. ` +
    `Bu değerler parsel geometrisi ve mimari çekirdek çözülmeden kesinlik taşımaz.`;

  // Sonraki en değerli veri önerisi
  let nextBestInput: NextBestInputItem;
  if (confidence.level === "BELOW_A") {
    nextBestInput = {
      priority: 1,
      label: "Güncel İmar Çapı / Belgesi",
      description: "Yasal TAKS/KAKS ve kullanım haklarını resmî olarak teyit etmek için imar durum belgesini ekleyin.",
      actionHint: "Gelişmiş Moda geçerek belgeyi teyit edin",
    };
  } else if (!optionalFloorCount) {
    nextBestInput = {
      priority: 2,
      label: "İmar Kat Adedi / Hmax",
      description: "Kat adedini eklediğinizde katta düşen daire adedi ve asansör/yangın tetikleri netleşir.",
      actionHint: "Yukarıdaki 'Kat adedini biliyorum' alanını açın",
    };
  } else if (confidence.missingForNextLevel.includes("hasCoordinateParcel")) {
    nextBestInput = {
      priority: 3,
      label: "Koordinatlı Parsel / Çekme Mesafeleri",
      description: "Çekmeler uygulandığında teorik taban alanı yerine gerçek fiziksel oturum kapasitesi hesaplanır.",
      actionHint: "Gelişmiş Modda çekme mesafelerini girin",
    };
  } else {
    nextBestInput = {
      priority: 4,
      label: "Tip Kat Çekirdek ve Ortak Alanlar",
      description: "Merdiven, asansör ve kat holü alanlarını netleştirerek bağımsız bölümlere ayrılabilir alanı kesinleştirin.",
      actionHint: "Gelişmiş Modda çekirdek alanlarını girin",
    };
  }

  return {
    statusBadge,
    legalRightsFormatted,
    typologies,
    reverseSizing: reverseFormatted,
    customerSummary,
    nextBestInput,
  };
}

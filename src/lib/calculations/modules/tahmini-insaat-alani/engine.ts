import type {
  DetailedEstimatedConstructionAreaInput,
  DetailedEstimatedConstructionAreaResult,
  EstimatedConstructionAreaWarning,
  FloorProgramBlock,
  FloorProgramRole,
  QuickEstimatedConstructionAreaInput,
  QuickEstimatedConstructionAreaResult,
} from "./types";

export const QUICK_DETAIL_DIFFERENCE_WARNING_RATIO = 0.1;

function buildStatus(warnings: EstimatedConstructionAreaWarning[]) {
  if (warnings.length > 0) {
    return {
      status: "warn" as const,
      label: "Kontrol gerekli",
    };
  }

  return {
    status: "ok" as const,
    label: "Uyumlu",
  };
}

function isFiniteNumber(value: number) {
  return Number.isFinite(value);
}

function isNonNegativeNumber(value: number) {
  return isFiniteNumber(value) && value >= 0;
}

function sumPositive(values: number[]) {
  return values.reduce((total, value) => total + (isFiniteNumber(value) ? value : 0), 0);
}

function defaultBlockNotes(role: FloorProgramRole) {
  switch (role) {
    case "basement":
      return "Teknik hacim ve depo alanlarini bu blokta manuel ekleyin.";
    case "ground":
      return "Zemin kat ticari veya ortak kullanim farklarini gerekirse ayri blokla ayirin.";
    case "typicalResidential":
      return "Tip konut kati tekrar sayisini proje kurgusuna gore duzenleyin.";
    case "roofTechnical":
      return "Cati teknik hacimlerini ve kazan dairesi gibi alanlari burada toplayin.";
    default:
      return "Bu blok ozel kat veya farkli kullanim katlarini manuel temsil eder.";
  }
}

function createFloorProgramBlock(
  id: string,
  label: string,
  role: FloorProgramRole,
  repeatCount: number
): FloorProgramBlock {
  return {
    id,
    label,
    role,
    repeatCount,
    grossIndependentAreaM2: 0,
    netIndependentAreaM2: 0,
    balconyTerraceAreaM2: 0,
    commonCirculationAreaM2: 0,
    elevatorShaftAreaM2: 0,
    technicalLines: [],
    notes: defaultBlockNotes(role),
  };
}

export function createEmptyTechnicalAreaLine(id: string) {
  return {
    id,
    label: "",
    areaM2: 0,
  };
}

export function createCustomFloorProgramBlock(id: string): FloorProgramBlock {
  return createFloorProgramBlock(id, "Ozel Kat", "custom", 1);
}

export function calculateQuickEstimatedConstructionArea(
  input: QuickEstimatedConstructionAreaInput
): QuickEstimatedConstructionAreaResult | null {
  const {
    parcelAreaM2,
    taks,
    kaks,
    normalFloorCount,
    hasBasement,
    basementFloorCount,
    basementFloorAreaM2,
  } = input;

  if (
    !isFiniteNumber(parcelAreaM2) ||
    !isFiniteNumber(taks) ||
    !isFiniteNumber(kaks) ||
    !isFiniteNumber(normalFloorCount) ||
    !isFiniteNumber(basementFloorCount)
  ) {
    return null;
  }

  if (parcelAreaM2 <= 0 || taks <= 0 || taks > 1 || kaks <= 0 || normalFloorCount < 1) {
    return null;
  }

  if (hasBasement && basementFloorCount < 1) {
    return null;
  }

  if (basementFloorAreaM2 !== null && (!isFiniteNumber(basementFloorAreaM2) || basementFloorAreaM2 <= 0)) {
    return null;
  }

  const maxGroundAreaM2 = parcelAreaM2 * taks;
  const emsalAreaM2 = parcelAreaM2 * kaks;
  const enteredFloorCapacityM2 = maxGroundAreaM2 * normalFloorCount;
  const averageRequiredFloorAreaM2 = emsalAreaM2 / normalFloorCount;
  const theoreticalFloorEquivalent = emsalAreaM2 / maxGroundAreaM2;
  const resolvedBasementFloorAreaM2 = hasBasement ? basementFloorAreaM2 ?? maxGroundAreaM2 : 0;
  const totalBasementAreaM2 = hasBasement ? basementFloorCount * resolvedBasementFloorAreaM2 : 0;
  const totalAreaWithBasementM2 = emsalAreaM2 + totalBasementAreaM2;
  const approximateTotalConstructionAreaM2 = totalAreaWithBasementM2;

  const warnings: EstimatedConstructionAreaWarning[] = [];
  const notes = [
    "Bu arac brut arsa alaniyla hizli on fizibilite uretir; net parsel ve cekme etkisi dahil degildir.",
    "Gercege daha yakin toplam icin kat holu, asansor ve teknik hacimleri detayli modda ekleyin.",
  ];

  if (enteredFloorCapacityM2 < emsalAreaM2) {
    warnings.push({
      tone: "warn",
      message:
        "Girilen normal kat sayisiyla KAKS kapasitesi tam tasinamiyor. Kat adedi veya plan kabulleri yeniden kontrol edilmeli.",
    });
  }

  if (hasBasement && basementFloorAreaM2 === null) {
    notes.push("Bodrum kat alani girilmedigi icin her bodrum kat taban alani kadar varsayildi.");
  }

  const status = buildStatus(warnings);
  const statusMessage =
    status.status === "ok"
      ? "Girilen kat sayisi, KAKS kapasitesini tasiyabilecek hizli bir on fizibilite veriyor."
      : "Girilen kat sayisi, KAKS kapasitesini tamamen tasimiyor.";

  return {
    maxGroundAreaM2,
    emsalAreaM2,
    enteredFloorCapacityM2,
    averageRequiredFloorAreaM2,
    theoreticalFloorEquivalent,
    resolvedBasementFloorAreaM2,
    totalBasementAreaM2,
    totalAreaWithBasementM2,
    approximateTotalConstructionAreaM2,
    status: status.status,
    statusLabel: status.label,
    statusMessage,
    warnings,
    notes,
  };
}

export function buildDetailedDraftFromQuickInput(
  input: QuickEstimatedConstructionAreaInput
): DetailedEstimatedConstructionAreaInput {
  const basementCount = input.hasBasement ? Math.max(1, input.basementFloorCount) : 0;
  const normalFloorCount = Math.max(1, input.normalFloorCount);

  const blocks: FloorProgramBlock[] = [];

  if (basementCount > 0) {
    blocks.push(createFloorProgramBlock("basement", "Bodrum Kat", "basement", basementCount));
  }

  blocks.push(createFloorProgramBlock("ground", "Zemin Kat", "ground", 1));
  blocks.push(
    createFloorProgramBlock(
      "typical-residential",
      "Tip Konut Kati",
      "typicalResidential",
      Math.max(normalFloorCount - 1, 1)
    )
  );
  blocks.push(createFloorProgramBlock("roof-technical", "Cati / Teknik Kat", "roofTechnical", 1));

  return {
    projectIdentity: {
      il: "",
      ilce: "",
      mahalle: "",
      ada: "",
      parsel: "",
      kullanimAmaci: "Konut",
    },
    blocks,
  };
}

export function calculateDetailedConstructionArea(
  input: DetailedEstimatedConstructionAreaInput,
  quickReferenceTotalM2?: number | null
): DetailedEstimatedConstructionAreaResult | null {
  if (!input.blocks.length) {
    return null;
  }

  const warnings: EstimatedConstructionAreaWarning[] = [];
  const notes = [
    "Toplam insaat alani; brut bagimsiz bolum, ortak alan, asansor / saft ve teknik hacimlerin toplami olarak uretilir.",
    "Otopark, siginak, su deposu ve isi merkezi gibi yan hesaplar otomatik degil; teknik alan satiri olarak manuel eklenmelidir.",
  ];

  let netIndependentAreaTotalM2 = 0;
  let balconyTerraceAreaTotalM2 = 0;
  let grossIndependentAreaTotalM2 = 0;
  let commonAreaTotalM2 = 0;
  let technicalAreaTotalM2 = 0;
  let grandTotalConstructionAreaM2 = 0;

  const floors = input.blocks.map((block) => {
    if (!block.id || !block.label.trim()) {
      throw new Error("Kat bloklari gecerli bir kimlik ve etiket icermelidir.");
    }

    if (!Number.isInteger(block.repeatCount) || block.repeatCount < 1) {
      throw new Error(`${block.label} icin tekrar sayisi en az 1 olmalidir.`);
    }

    const numericFields = [
      block.grossIndependentAreaM2,
      block.netIndependentAreaM2,
      block.balconyTerraceAreaM2,
      block.commonCirculationAreaM2,
      block.elevatorShaftAreaM2,
    ];

    if (!numericFields.every(isNonNegativeNumber)) {
      throw new Error(`${block.label} icin alanlar negatif olamaz.`);
    }

    if (
      !block.technicalLines.every(
        (line) => !!line.id && isNonNegativeNumber(line.areaM2) && typeof line.label === "string"
      )
    ) {
      throw new Error(`${block.label} icin teknik alan satirlari gecersiz.`);
    }

    const technicalAreaM2 = sumPositive(block.technicalLines.map((line) => line.areaM2));
    const floorTotalM2 =
      block.grossIndependentAreaM2 +
      block.commonCirculationAreaM2 +
      block.elevatorShaftAreaM2 +
      technicalAreaM2;
    const repeatedFloorTotalM2 = floorTotalM2 * block.repeatCount;

    if (block.grossIndependentAreaM2 < block.netIndependentAreaM2 + block.balconyTerraceAreaM2) {
      warnings.push({
        tone: "warn",
        message: `${block.label} icin brut alan, net alan ve balkon toplaminin altinda kaliyor.`,
      });
    }

    netIndependentAreaTotalM2 += block.netIndependentAreaM2 * block.repeatCount;
    balconyTerraceAreaTotalM2 += block.balconyTerraceAreaM2 * block.repeatCount;
    grossIndependentAreaTotalM2 += block.grossIndependentAreaM2 * block.repeatCount;
    commonAreaTotalM2 +=
      (block.commonCirculationAreaM2 + block.elevatorShaftAreaM2) * block.repeatCount;
    technicalAreaTotalM2 += technicalAreaM2 * block.repeatCount;
    grandTotalConstructionAreaM2 += repeatedFloorTotalM2;

    return {
      id: block.id,
      label: block.label,
      role: block.role,
      repeatCount: block.repeatCount,
      netIndependentAreaM2: block.netIndependentAreaM2,
      balconyTerraceAreaM2: block.balconyTerraceAreaM2,
      grossIndependentAreaM2: block.grossIndependentAreaM2,
      commonCirculationAreaM2: block.commonCirculationAreaM2,
      elevatorShaftAreaM2: block.elevatorShaftAreaM2,
      technicalAreaM2,
      floorTotalM2,
      repeatedFloorTotalM2,
      technicalLines: block.technicalLines,
      notes: block.notes,
    };
  });

  if (!isFiniteNumber(grandTotalConstructionAreaM2) || grandTotalConstructionAreaM2 <= 0) {
    return null;
  }

  let quickDifferenceRatio: number | null = null;

  if (quickReferenceTotalM2 && quickReferenceTotalM2 > 0) {
    quickDifferenceRatio =
      Math.abs(grandTotalConstructionAreaM2 - quickReferenceTotalM2) / quickReferenceTotalM2;

    if (quickDifferenceRatio > QUICK_DETAIL_DIFFERENCE_WARNING_RATIO) {
      warnings.push({
        tone: "warn",
        message:
          "Detayli mod toplami, hizli mod tahmininden anlamli olcude farkli. Kat programi ve teknik alan kabulleri birlikte kontrol edilmeli.",
      });
    }
  }

  const status = buildStatus(warnings);
  const statusMessage =
    status.status === "ok"
      ? "Kat bazli dagilim, toplami tutarli bir sekilde uretiyor."
      : "Kat programinda veya hizli mod karsilastirmasinda kontrol gerektiren kabuller var.";

  return {
    netIndependentAreaTotalM2,
    balconyTerraceAreaTotalM2,
    grossIndependentAreaTotalM2,
    commonAreaTotalM2,
    technicalAreaTotalM2,
    grandTotalConstructionAreaM2,
    quickReferenceTotalM2: quickReferenceTotalM2 ?? null,
    quickDifferenceRatio,
    floors,
    status: status.status,
    statusLabel: status.label,
    statusMessage,
    warnings,
    notes,
  };
}

export const calculateEstimatedConstructionArea = calculateQuickEstimatedConstructionArea;

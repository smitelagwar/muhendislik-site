import { CONTRACTOR_PROFILES } from "./config";
import type { ProjectInputsV2, ValidationIssue } from "./types";

function createIssue(
  id: string,
  tone: ValidationIssue["tone"],
  message: string,
  hint?: string
): ValidationIssue {
  return { id, tone, message, hint };
}

export function validateScenarioInputs(
  inputs: ProjectInputsV2,
  equivalentArea: number,
  physicalArea: number
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (equivalentArea < 50 || equivalentArea > 50_000) {
    issues.push(
      createIssue(
        "equivalent-area-range",
        "error",
        "Eşdeğer inşaat alanı 50 m² ile 50.000 m² arasında olmalıdır.",
        "Alan modelinizi veya toplam alan girişinizi gözden geçirin."
      )
    );
  }

  if (inputs.floorCount < 1 || inputs.floorCount > 40) {
    issues.push(
      createIssue("floor-count-range", "error", "Kat adedi 1 ile 40 arasında olmalıdır.")
    );
  }

  if (inputs.unitCount < 1 || inputs.unitCount > 500) {
    issues.push(
      createIssue(
        "unit-count-range",
        "error",
        "Bağımsız bölüm sayısı 1 ile 500 arasında olmalıdır."
      )
    );
  }

  if (inputs.area.advancedMode && inputs.area.normalArea <= 0) {
    issues.push(
      createIssue(
        "advanced-normal-area",
        "error",
        "Gelişmiş alan modunda normal kat alanı sıfırdan büyük olmalıdır."
      )
    );
  }

  if (inputs.saleableArea > 0 && inputs.saleableArea > physicalArea * 1.08) {
    issues.push(
      createIssue(
        "saleable-over-physical",
        "warning",
        "Satılabilir alan, fiziksel inşaat alanını aşıyor görünüyor.",
        "Ortak alan oranı veya satılabilir alan kabulleri agresif olabilir."
      )
    );
  }

  if (inputs.commonAreaRatio > 0.35) {
    issues.push(
      createIssue(
        "common-area-ratio-high",
        "warning",
        "Ortak alan oranı %35'in üzerinde. m² verimliliği düşebilir."
      )
    );
  }

  if (inputs.basementCount > 0 && inputs.area.advancedMode && inputs.area.basementArea <= 0) {
    issues.push(
      createIssue(
        "basement-mismatch",
        "warning",
        "Bodrum kat sayısı girildi ancak bodrum alanı tanımlanmadı.",
        "Bodrum kazısı, perde ve yalıtım etkisi eksik hesaplanabilir."
      )
    );
  }

  if (inputs.basementCount === 0 && inputs.area.advancedMode && inputs.area.basementArea > 0) {
    issues.push(
      createIssue(
        "basement-area-without-count",
        "info",
        "Bodrum alanı var ancak bodrum kat adedi sıfır bırakılmış.",
        "Alan varsa bodrum kat sayısını 1 veya üzeri girmeniz daha tutarlı olur."
      )
    );
  }

  const profile = CONTRACTOR_PROFILES[inputs.commercial.contractorProfile];
  const marginPct = inputs.commercial.contractorMarginRate * 100;
  if (
    marginPct < profile.recommendedMarginMin ||
    marginPct > profile.recommendedMarginMax
  ) {
    issues.push(
      createIssue(
        "contractor-margin-band",
        "warning",
        `Seçili yüklenici profili için önerilen kâr bandı %${profile.recommendedMarginMin} - %${profile.recommendedMarginMax}.`,
        profile.note
      )
    );
  }

  if (inputs.commercial.durationMonths >= 24) {
    issues.push(
      createIssue(
        "duration-high",
        "info",
        "24 ay ve üzeri termin, enflasyon ve saha genel gider riskini yükseltir."
      )
    );
  }

  if (inputs.site.mepLevel === "premium" && inputs.qualityLevel === "ekonomik") {
    issues.push(
      createIssue(
        "mep-quality-mismatch",
        "warning",
        "Premium MEP seviyesi ile ekonomik finish paketi aynı senaryoda çelişebilir."
      )
    );
  }

  if (inputs.site.parkingType === "kapali" && inputs.area.parkingArea <= 0) {
    issues.push(
      createIssue(
        "closed-parking-area-missing",
        "warning",
        "Kapalı otopark seçili ancak otopark alanı sıfır görünüyor."
      )
    );
  }

  if (inputs.commercial.targetSalePrice > 0 && inputs.commercial.targetSalePrice < 20_000) {
    issues.push(
      createIssue(
        "target-sale-low",
        "info",
        "Hedef satış fiyatı düşük seçildi. Proje ticari marjı baskılanabilir."
      )
    );
  }

  return issues.sort((left, right) => {
    const rank = { error: 0, warning: 1, info: 2 };
    return rank[left.tone] - rank[right.tone];
  });
}

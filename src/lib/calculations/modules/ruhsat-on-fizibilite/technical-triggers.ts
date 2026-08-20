import type {
  ShelterTriggerResult,
  TechnicalTriggerContext,
  TechnicalTriggerSet,
} from "./engine-types";
import { EXECUTABLE_RULE_VALUES } from "./rules";

function evaluateLift(context: TechnicalTriggerContext): TechnicalTriggerSet["lift"] {
  const residentialUnitsAboveGroundFloor = Math.max(0, context.totalUnits - context.unitsPerFloor);
  const basementFloorCountingRequiresConfirmation = context.basementIntent !== null && context.basementIntent !== "NONE";

  if (context.projectUseType !== "RESIDENTIAL") {
    return {
      state: "REQUIRES_CONFIRMATION",
      shaftReservationRequired: null,
      requiredLiftCount: null,
      residentialUnitsAboveGroundFloor,
      basementFloorCountingRequiresConfirmation,
      ruleIds: ["PAIY-34-LIFT-TRIGGERS"],
    };
  }

  if (context.totalUnits === 1) {
    return {
      state: "NOT_TRIGGERED",
      shaftReservationRequired: false,
      requiredLiftCount: 0,
      residentialUnitsAboveGroundFloor,
      basementFloorCountingRequiresConfirmation,
      ruleIds: ["PAIY-34-LIFT-TRIGGERS"],
    };
  }

  if (context.floorCount < EXECUTABLE_RULE_VALUES.lift.shaftReservationFloorCount) {
    return {
      state: "NOT_TRIGGERED",
      shaftReservationRequired: false,
      requiredLiftCount: 0,
      residentialUnitsAboveGroundFloor,
      basementFloorCountingRequiresConfirmation,
      ruleIds: ["PAIY-34-LIFT-TRIGGERS"],
    };
  }

  if (context.floorCount === EXECUTABLE_RULE_VALUES.lift.shaftReservationFloorCount) {
    return {
      state: "CHECK_REQUIRED",
      shaftReservationRequired: true,
      requiredLiftCount: 0,
      residentialUnitsAboveGroundFloor,
      basementFloorCountingRequiresConfirmation,
      ruleIds: ["PAIY-34-LIFT-TRIGGERS"],
    };
  }

  const secondLiftRequired =
    context.floorCount >= EXECUTABLE_RULE_VALUES.lift.secondLiftFloorCount ||
    residentialUnitsAboveGroundFloor >
      EXECUTABLE_RULE_VALUES.lift.secondLiftResidentialUnitsAboveGroundFloor;

  return {
    state: "CHECK_REQUIRED",
    shaftReservationRequired: true,
    requiredLiftCount: secondLiftRequired ? 2 : 1,
    residentialUnitsAboveGroundFloor,
    basementFloorCountingRequiresConfirmation,
    ruleIds: ["PAIY-34-LIFT-TRIGGERS"],
  };
}

function evaluateShelter(context: TechnicalTriggerContext): ShelterTriggerResult {
  if (context.projectUseType !== "RESIDENTIAL" || context.unitType === "MIXED") {
    return {
      state: "REQUIRES_CONFIRMATION",
      estimatedPersonEquivalent: null,
      providedPersonCapacity: context.shelterPersonCapacity,
      capacityState: "UNKNOWN",
      ruleIds: ["SHELTER-RESIDENTIAL-UNIT-TRIGGER"],
    };
  }

  if (context.totalUnits < EXECUTABLE_RULE_VALUES.shelter.residentialUnitCount) {
    return {
      state: "NOT_TRIGGERED",
      estimatedPersonEquivalent: null,
      providedPersonCapacity: context.shelterPersonCapacity,
      capacityState: "NOT_APPLICABLE",
      ruleIds: ["SHELTER-RESIDENTIAL-UNIT-TRIGGER"],
    };
  }

  const personEquivalent =
    context.totalUnits * EXECUTABLE_RULE_VALUES.shelter.personEquivalentByUnitType[context.unitType];
  const capacityState =
    context.shelterPersonCapacity === null
      ? "UNKNOWN"
      : context.shelterPersonCapacity >= personEquivalent
        ? "SUFFICIENT"
        : "INSUFFICIENT";

  return {
    state: "CHECK_REQUIRED",
    estimatedPersonEquivalent: personEquivalent,
    providedPersonCapacity: context.shelterPersonCapacity,
    capacityState,
    ruleIds: ["SHELTER-RESIDENTIAL-UNIT-TRIGGER"],
  };
}

export function evaluateTechnicalTriggers(context: TechnicalTriggerContext): TechnicalTriggerSet {
  const heightGateReached =
    context.buildingHeightM === null
      ? null
      : context.buildingHeightM >= EXECUTABLE_RULE_VALUES.fireReview.buildingHeightM;
  const nsebRequired =
    context.estimatedTotalBuildingAreaM2 >=
    EXECUTABLE_RULE_VALUES.nseb.totalBuildingConstructionAreaM2;
  const rainWaterReviewRequired =
    context.parcelAreaM2 > EXECUTABLE_RULE_VALUES.rainWater.parcelAreaM2Exclusive ||
    context.roofProjectionAreaM2 > EXECUTABLE_RULE_VALUES.rainWater.roofProjectionAreaM2Exclusive;

  return {
    lift: evaluateLift(context),
    shelter: evaluateShelter(context),
    fire: {
      state: context.buildingHeightM === null ? "UNKNOWN" : "REQUIRES_CONFIRMATION",
      heightGateReached,
      ruleIds: ["FIRE-HEIGHT-21_50-REVIEW-GATE"],
    },
    nseb: {
      state: nsebRequired ? "CHECK_REQUIRED" : "NOT_TRIGGERED",
      evaluatedAreaM2: context.estimatedTotalBuildingAreaM2,
      basis: "THEORETICAL_BUILDING_AREA",
      ruleIds: ["BEP-NSEB-2025-AREA-TRIGGER"],
    },
    rainWater: {
      state: rainWaterReviewRequired ? "REQUIRES_CONFIRMATION" : "NOT_TRIGGERED",
      evaluatedAreaM2: context.roofProjectionAreaM2,
      basis: "EFFECTIVE_FOOTPRINT",
      ruleIds: ["PAIY-57A-RAIN-WATER-REVIEW-GATES"],
    },
    parking: {
      state: "REQUIRES_CONFIRMATION",
      ruleIds: [],
    },
    accessibility: {
      state: "CHECK_REQUIRED",
      ruleIds: [],
    },
    structural: {
      state: "REQUIRES_CONFIRMATION",
      ruleIds: [],
    },
    basement: {
      state:
        context.basementIntent === null
          ? "UNKNOWN"
          : context.basementIntent === "NONE"
            ? "NOT_TRIGGERED"
            : "CHECK_REQUIRED",
      ruleIds: [],
    },
  };
}

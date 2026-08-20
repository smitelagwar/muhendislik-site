import type { ScenarioAssumptionSet } from "./engine-types";
import { ASSUMPTION_POLICY_SNAPSHOT_VERSION } from "./versions";

/**
 * V1 arayüzünde açıkça gösterilen başlangıç varsayımlarıdır. Bu değerler mevzuat
 * değildir; kullanıcı formdaki gelişmiş varsayımlar alanından her birini değiştirir.
 */
export function createDefaultScenarioAssumptionSet(): ScenarioAssumptionSet {
  return {
    version: ASSUMPTION_POLICY_SNAPSHOT_VERSION,
    maxIterations: 10,
    scenarios: [
      {
        id: "COMPACT_MAX_UNITS",
        targetNetAreaM2: 55,
        targetClosedGrossAreaM2: 70,
        baseCoreAreaM2: 20,
        otherCommonAreaM2: 8,
        floorTechnicalAreaM2: 4,
        circulationAreaPerUnitM2: 1,
      },
      {
        id: "BALANCED",
        targetNetAreaM2: 70,
        targetClosedGrossAreaM2: 90,
        baseCoreAreaM2: 22,
        otherCommonAreaM2: 9,
        floorTechnicalAreaM2: 4,
        circulationAreaPerUnitM2: 1.2,
      },
      {
        id: "COMFORT_FEWER_UNITS",
        targetNetAreaM2: 92,
        targetClosedGrossAreaM2: 120,
        baseCoreAreaM2: 24,
        otherCommonAreaM2: 10,
        floorTechnicalAreaM2: 5,
        circulationAreaPerUnitM2: 1.4,
      },
    ],
    technicalReserves: {
      liftShaftReservationAreaM2: 6,
      primaryLiftAreaM2: 8,
      secondLiftAdditionalAreaM2: 8,
      fireReviewAreaM2: 12,
    },
  };
}

import type { CadModel, Point, SlabElement } from "./model";
import { distance } from "./geometry";

export interface StairParameters {
  widthM: number;
  stepCount: number;
  riserHeightM: number;
  waistThicknessM: number;
  landingLengthM?: number;
}

export const DEFAULT_STAIR_PARAMS: StairParameters = {
  widthM: 1.20,
  stepCount: 16,
  riserHeightM: 0.175,
  waistThicknessM: 0.15,
  landingLengthM: 1.20,
};

export interface StairCalculation {
  totalHeightM: number;
  totalRunM: number;
  treadDepthM: number;
  concreteVolumeM3: number;
  formworkAreaM2: number;
  comfortFormulaCheck: boolean; // 2s + a = 60-64 cm
}

export function calculateStairGeometry(params: StairParameters, start: Point, end: Point): StairCalculation {
  const horizontalRunM = distance(start, end);
  const totalHeightM = params.stepCount * params.riserHeightM;
  const treadDepthM = horizontalRunM / Math.max(1, params.stepCount);

  // Blondel comfort formula: 2 * riser + tread should be between 60cm and 64cm (0.60m to 0.64m)
  const blondelValueM = 2 * params.riserHeightM + treadDepthM;
  const comfortFormulaCheck = blondelValueM >= 0.58 && blondelValueM <= 0.66;

  // Waist slab volume + triangular step volumes
  const slopeHypotM = Math.hypot(horizontalRunM, totalHeightM);
  const waistVolume = slopeHypotM * params.widthM * params.waistThicknessM;
  const stepsVolume = params.stepCount * (0.5 * treadDepthM * params.riserHeightM) * params.widthM;
  const concreteVolumeM3 = waistVolume + stepsVolume;

  // Formwork area: soffit (alt yüzey) + sides (yan rıht alınları) + risers
  const soffitArea = slopeHypotM * params.widthM;
  const sideArea = 2 * (slopeHypotM * params.waistThicknessM + 0.5 * horizontalRunM * totalHeightM);
  const riserArea = params.stepCount * params.riserHeightM * params.widthM;
  const formworkAreaM2 = soffitArea + sideArea + riserArea;

  return {
    totalHeightM,
    totalRunM: horizontalRunM,
    treadDepthM,
    concreteVolumeM3,
    formworkAreaM2,
    comfortFormulaCheck,
  };
}

export function addStairToModel(
  model: CadModel,
  floorId: string,
  start: Point,
  end: Point,
  params: StairParameters = DEFAULT_STAIR_PARAMS
): CadModel {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * (params.widthM / 2);
  const ny = (dx / len) * (params.widthM / 2);

  // 4 corners of stair plan outline
  const points: Point[] = [
    { x: start.x - nx, y: start.y - ny },
    { x: end.x - nx, y: end.y - ny },
    { x: end.x + nx, y: end.y + ny },
    { x: start.x + nx, y: start.y + ny },
  ];

  const stairCount = model.elements.filter(e => e.layer === "Merdivenler").length + 1;
  const stairSlab: SlabElement = {
    id: `stair-${crypto.randomUUID().slice(0, 8)}`,
    name: `M${stairCount}`,
    type: "slab",
    floorId,
    materialId: model.materials[0]?.id ?? "concrete",
    layer: "Merdivenler",
    points,
    thickness: params.waistThicknessM,
    topOffset: 0,
    slopeX: (dx / len) * (params.riserHeightM / (len / params.stepCount)) * 100,
    slopeY: (dy / len) * (params.riserHeightM / (len / params.stepCount)) * 100,
  };

  return {
    ...model,
    elements: [...model.elements, stairSlab],
  };
}

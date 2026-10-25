export interface Point3Mm {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBoxMm {
  min: Point3Mm;
  max: Point3Mm;
}

export interface LineSegment3Mm {
  kind: "line";
  start: Point3Mm;
  end: Point3Mm;
  role?: "leg" | "hook";
}

export interface ArcSegment3Mm {
  kind: "arc";
  center: Point3Mm;
  radiusMm: number;
  startAngleRad: number;
  endAngleRad: number;
  plane: "xy" | "xz" | "yz";
  role?: "bend" | "hook-bend";
}

export type PathSegment3Mm = LineSegment3Mm | ArcSegment3Mm;

export type DetailPartCategory =
  | "concrete"
  | "longitudinal"
  | "stirrup"
  | "dowel"
  | "crosstie";

export type SimulationLayerId =
  | "concrete"
  | "longitudinal"
  | "stirrup"
  | "dowel"
  | "crosstie"
  | "dimensions";

export type LayerVisibilityMask = Record<SimulationLayerId, boolean>;

export type StirrupZoneId =
  | "alt-sarilma"
  | "orta-bolge"
  | "ust-sarilma"
  | "dugum-bolgesi"
  | "sol-mesnet-sarilma"
  | "aciklik-bolgesi"
  | "sag-mesnet-sarilma"
  | "birlesim-cekirdegi"
  | "kiris-sarilma"
  | "temel-izgara"
  | "filiz-sarilma"
  | "sol-uc-bolge"
  | "perde-govde"
  | "sag-uc-bolge"
  | "radye-alt-izgara"
  | "radye-ust-izgara"
  | "radye-sehpa-ve-filiz";

export type ColumnPresetId =
  | "c1-referans"
  | "c1-cirozlu-ogretim"
  | "k1-referans"
  | "d1-dis-birlesim"
  | "t1-tekil-temel"
  | "p1-perde"
  | "r1-radye-temel";

export interface AssumptionNote {
  id: string;
  label: string;
  description: string;
  isTeachingAssumption: boolean;
}

export interface DimensionMarkerMm {
  id: string;
  label: string;
  valueMm: number;
  unit: "mm";
  startMm: Point3Mm;
  endMm: Point3Mm;
  colorHex: string;
}

export interface PartTeachingSummary {
  whatIsIt: string;
  whereInExample: string;
  role: string;
  fieldNote?: string;
}

export interface ConcreteVolumePart {
  kind: "concrete";
  id: string;
  label: string;
  category: "concrete";
  layerId: "concrete";
  centerMm: Point3Mm;
  sizeMm: {
    widthX: number;
    depthY: number;
    heightZ: number;
  };
  summary: PartTeachingSummary;
}

export interface RebarPathPart {
  kind: "rebar";
  id: string;
  label: string;
  category: Exclude<DetailPartCategory, "concrete">;
  layerId: Exclude<SimulationLayerId, "concrete" | "dimensions">;
  diameterMm: number;
  zoneId?: StirrupZoneId;
  elevationZMm?: number;
  bendRadiusMm?: number;
  hookAngleDeg?: number;
  hookLengthMm?: number;
  colorHex: string;
  segments: PathSegment3Mm[];
  summary: PartTeachingSummary;
}

export type DetailPart = ConcreteVolumePart | RebarPathPart;

export interface DetailZoneSummary {
  id: StirrupZoneId;
  label: string;
  zStartMm: number;
  zEndMm: number;
  lengthMm: number;
  spacingMm: number;
  stirrupCount: number;
  crosstieCount: number;
  colorHex: string;
  description: string;
}

export interface ColumnSceneSpec {
  version: 1;
  slug: "kolon-detayi";
  presetId: ColumnPresetId;
  title: string;
  subtitle: string;
  sectionWidthMm: number;
  sectionDepthMm: number;
  concreteHeightMm: number;
  dowelLapLengthMm: number;
  totalBarHeightMm: number;
  clearCoverMm: number;
  longitudinalDiameterMm: number;
  longitudinalCount: 4 | 8;
  stirrupDiameterMm: number;
  stirrupBendRadiusMm: number;
  stirrupHookLengthMm: number;
  includeCrossties: boolean;
  crosstieDiameterMm: number;
  zones: ReadonlyArray<{
    id: StirrupZoneId;
    label: string;
    zStartMm: number;
    zEndMm: number;
    spacingMm: number;
    colorHex: string;
    description: string;
  }>;
  assumptions: ReadonlyArray<AssumptionNote>;
}

export interface DetailModel {
  specVersion: 1;
  slug:
    | "kolon-detayi"
    | "kiris-detayi"
    | "kolon-kiris-birlesimi"
    | "tekil-temel"
    | "perde-detayi"
    | "radye-temel";
  presetId: ColumnPresetId;
  primaryAxis?: "z" | "x";
  title: string;
  subtitle: string;
  boundsMm: BoundingBoxMm;
  concreteBoundsMm: BoundingBoxMm;
  dimensionsMm: {
    widthX: number;
    depthY: number;
    concreteHeightZ: number;
    dowelLengthZ: number;
    totalHeightZ: number;
    clearCover: number;
    stirrupAxisOffsetFromFaceMm: number;
    cornerBarCenterOffsetFromFaceMm: number;
  };
  parts: DetailPart[];
  zones: DetailZoneSummary[];
  dimensionMarkers: DimensionMarkerMm[];
  counts: {
    totalParts: number;
    concreteParts: number;
    longitudinalBars: number;
    stirrups: number;
    dowels: number;
    crossties: number;
  };
  assumptions: ReadonlyArray<AssumptionNote>;
}

export type CameraPresetId =
  | "isometric"
  | "front"
  | "right"
  | "top";

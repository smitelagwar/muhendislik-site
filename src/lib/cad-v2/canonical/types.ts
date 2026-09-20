// ============================================================================
// DWG/DXF MOTOR V2 — CANONICAL 2D DATA MODEL
// ============================================================================
// Bu dosya tüm DWG/DXF ayrıştırıcılarından bağımsız ortak 2D geometri,
// katman, pafta, stil ve tanı sözleşmelerini tanımlar.
// Koordinatlar Float64 dünya uzayındadır; GPU Float32 dönüşümü derleyici aşamasındadır.

export type CadColorMethod = "byLayer" | "byBlock" | "aci" | "rgb";

export interface CadColor {
  method: CadColorMethod;
  aci?: number;
  rgb?: [number, number, number]; // [0..255, 0..255, 0..255]
  alpha?: number; // 0..1
}

export interface CadLayer {
  id: string; // layer identifier / name
  name: string; // original source name
  visible: boolean;
  frozen: boolean;
  locked: boolean;
  color: CadColor;
  lineweightMm: number; // e.g. 0.25, 0 = hairline
  linetypeName: string;
}

export interface CadLinetype {
  id: string;
  name: string;
  description?: string;
  pattern: number[]; // e.g. [1.0, -0.25, 0.25, -0.25] (pozitif çizgi, negatif boşluk)
  totalLength: number;
}

export interface CadTextStyle {
  id: string;
  name: string;
  fontFileName: string;
  bigFontFileName?: string;
  height: number;
  widthFactor: number;
  obliqueAngleDeg: number;
  isVertical: boolean;
}

export type CadPoint2D = [number, number];
export type CadPoint3D = [number, number, number];
export type CadBBox2D = [number, number, number, number]; // [minX, minY, maxX, maxY]

export type CadPrimitiveType =
  | "LINE"
  | "ARC"
  | "CIRCLE"
  | "ELLIPSE"
  | "LWPOLYLINE"
  | "SPLINE"
  | "HATCH"
  | "SOLID"
  | "TEXT"
  | "MTEXT"
  | "INSERT"
  | "DIMENSION"
  | "LEADER"
  | "WIPEOUT";

export interface CadBaseEntity {
  handle: string;
  type: CadPrimitiveType;
  layer: string;
  color?: CadColor;
  linetype?: string;
  lineweightMm?: number;
  visible?: boolean;
  order: bigint; // authoritative global source order
}

export interface CadLineEntity extends CadBaseEntity {
  type: "LINE";
  start: CadPoint2D;
  end: CadPoint2D;
}

export interface CadArcEntity extends CadBaseEntity {
  type: "ARC";
  center: CadPoint2D;
  radius: number;
  startAngleRad: number;
  endAngleRad: number;
  isClockwise?: boolean;
}

export interface CadCircleEntity extends CadBaseEntity {
  type: "CIRCLE";
  center: CadPoint2D;
  radius: number;
}

export interface CadEllipseEntity extends CadBaseEntity {
  type: "ELLIPSE";
  center: CadPoint2D;
  majorAxisVector: CadPoint2D;
  axisRatio: number; // minor / major
  startParam: number; // 0..2pi
  endParam: number; // 0..2pi
}

export interface CadLwPolylineVertex {
  x: number;
  y: number;
  bulge?: number;
  startWidth?: number;
  endWidth?: number;
}

export interface CadLwPolylineEntity extends CadBaseEntity {
  type: "LWPOLYLINE";
  vertices: CadLwPolylineVertex[];
  isClosed: boolean;
  constantWidth?: number;
}

export interface CadSplineEntity extends CadBaseEntity {
  type: "SPLINE";
  degree: number;
  controlPoints: CadPoint2D[];
  knots: number[];
  weights?: number[];
  isPeriodic?: boolean;
  isRational?: boolean;
}

export interface CadHatchLoop {
  isPolyline: boolean;
  vertices?: CadPoint2D[];
  edges?: Array<
    | { type: "LINE"; start: CadPoint2D; end: CadPoint2D }
    | { type: "ARC"; center: CadPoint2D; radius: number; startAngleRad: number; endAngleRad: number; ccw: boolean }
  >;
}

export interface CadHatchEntity extends CadBaseEntity {
  type: "HATCH";
  patternName: string;
  isSolid: boolean;
  patternScale?: number;
  patternAngleDeg?: number;
  loops: CadHatchLoop[];
}

export interface CadTextEntity extends CadBaseEntity {
  type: "TEXT";
  text: string;
  insertionPoint: CadPoint2D;
  alignmentPoint?: CadPoint2D;
  height: number;
  rotationRad: number;
  widthFactor: number;
  obliqueRad: number;
  styleName: string;
  horizontalMode?: number;
  verticalMode?: number;
}

export interface CadMTextEntity extends CadBaseEntity {
  type: "MTEXT";
  text: string;
  insertionPoint: CadPoint2D;
  height: number;
  referenceWidth: number;
  rotationRad: number;
  attachmentPoint: number;
  drawingDirection?: number;
  lineSpacingFactor?: number;
  styleName: string;
}

export interface CadInsertEntity extends CadBaseEntity {
  type: "INSERT";
  blockName: string;
  insertionPoint: CadPoint2D;
  scale: [number, number, number];
  rotationRad: number;
  columnCount?: number;
  rowCount?: number;
  columnSpacing?: number;
  rowSpacing?: number;
}

export interface CadDimensionEntity extends CadBaseEntity {
  type: "DIMENSION";
  dimType: number;
  text?: string;
  styleName: string;
  defPoint: CadPoint2D;
  textMidpoint?: CadPoint2D;
  line1Start?: CadPoint2D;
  line1End?: CadPoint2D;
  line2Start?: CadPoint2D;
  line2End?: CadPoint2D;
  anonymousBlockName?: string;
}

export interface CadWipeoutEntity extends CadBaseEntity {
  type: "WIPEOUT";
  vertices: CadPoint2D[];
}

export type CadEntity =
  | CadLineEntity
  | CadArcEntity
  | CadCircleEntity
  | CadEllipseEntity
  | CadLwPolylineEntity
  | CadSplineEntity
  | CadHatchEntity
  | CadTextEntity
  | CadMTextEntity
  | CadInsertEntity
  | CadDimensionEntity
  | CadWipeoutEntity;

export interface CadBlockDefinition {
  name: string;
  basePoint: CadPoint2D;
  entities: CadEntity[];
  isAnonymous?: boolean;
  isXref?: boolean;
}

export interface CadLayout {
  id: string;
  name: string;
  isModelSpace: boolean;
  bbox: CadBBox2D;
  viewportIds?: string[];
}

export interface CadViewport {
  id: string;
  layoutId: string;
  center: CadPoint2D;
  width: number;
  height: number;
  viewCenter: CadPoint2D;
  viewHeight: number;
  frozenLayers: string[];
}

export interface CadDiagnostic {
  id: string;
  code: string;
  severity: "info" | "warning" | "error";
  message: string;
  entityHandle?: string;
}

export interface CadCanonicalDocument {
  sourceVersionKey: string;
  sourceSha256: string;
  acadVersion: string;
  codepage: string;
  units: number; // INSUNITS
  measurement: number; // 0=English, 1=Metric
  layers: Record<string, CadLayer>;
  linetypes: Record<string, CadLinetype>;
  textStyles: Record<string, CadTextStyle>;
  blocks: Record<string, CadBlockDefinition>;
  layouts: Record<string, CadLayout>;
  viewports: Record<string, CadViewport>;
  modelSpaceEntities: CadEntity[];
  diagnostics: CadDiagnostic[];
}

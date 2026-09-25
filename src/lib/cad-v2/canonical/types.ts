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
  isAci7?: boolean;
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
  | "WIPEOUT"
  | "ATTDEF"
  | "ATTRIB";

export interface CadBaseEntity {
  handle: string;
  type: CadPrimitiveType;
  layer: string;
  color?: CadColor;
  linetype?: string;
  linetypeScale?: number;
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
  majorAxisEndPoint?: CadPoint2D;
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
  plinegen?: boolean;
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
  bulges?: number[];
  edges?: Array<
    | { type: "LINE"; start: CadPoint2D; end: CadPoint2D }
    | { type: "ARC"; center: CadPoint2D; radius: number; startAngleRad: number; endAngleRad: number; ccw: boolean }
    | { type: "ELLIPSE"; center: CadPoint2D; majorAxisVector: CadPoint2D; axisRatio: number; startParam: number; endParam: number; ccw: boolean }
    | { type: "SPLINE"; degree: number; controlPoints: CadPoint2D[]; knots: number[]; weights?: number[]; isPeriodic?: boolean; isRational?: boolean }
  >;
  boundaryPathTypeFlag?: number;
  hasBulge?: boolean;
  isClosed?: boolean;
}

export interface CadHatchEntity extends CadBaseEntity {
  type: "HATCH";
  patternName: string;
  isSolid: boolean;
  solidFill?: boolean;
  patternScale?: number;
  patternAngleDeg?: number;
  hatchStyle?: number;
  patternType?: number;
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
  generationFlag?: number;
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
  backgroundMask?: boolean;
}

export interface CadClipBoundary {
  isClippingEnabled?: boolean;
  isInverted?: boolean;
  boundaryVertices: CadPoint2D[];
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
  extrusionDirection?: [number, number, number];
  attributes?: Record<string, string>;
  clipBoundary?: CadClipBoundary;
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
  insertionPoint?: CadPoint2D;
  rotationRad?: number;
  scale?: [number, number, number];
  measurement?: number;
  dimScale?: number;
  arrowSize?: number;
}

export interface CadWipeoutEntity extends CadBaseEntity {
  type: "WIPEOUT";
  vertices: CadPoint2D[];
}

export interface CadAttDefEntity extends CadBaseEntity {
  type: "ATTDEF";
  tag: string;
  prompt?: string;
  defaultText?: string;
  insertionPoint: CadPoint2D;
  alignmentPoint?: CadPoint2D;
  height: number;
  rotationRad: number;
  widthFactor: number;
  obliqueRad: number;
  styleName: string;
  horizontalMode?: number;
  verticalMode?: number;
  isInvisible?: boolean;
  isConstant?: boolean;
}

export interface CadAttribEntity extends CadBaseEntity {
  type: "ATTRIB";
  tag: string;
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
  isInvisible?: boolean;
  isConstant?: boolean;
}

export interface CadLeaderEntity extends CadBaseEntity {
  type: "LEADER";
  vertices: CadPoint2D[];
  hasArrowhead?: boolean;
  arrowheadSize?: number;
  text?: string;
  annotationType?: number;
  annotatedEntityHandle?: string;
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
  | CadWipeoutEntity
  | CadAttDefEntity
  | CadAttribEntity
  | CadLeaderEntity;

export interface CadBlockDefinition {
  name: string;
  basePoint: CadPoint2D;
  entities: CadEntity[];
  isAnonymous?: boolean;
  isXref?: boolean;
  xrefPath?: string;
}

export interface CadLayout {
  id: string;
  name: string;
  isModelSpace: boolean;
  bbox: CadBBox2D;
  blockRecordName?: string;
  viewportIds?: string[];
  tabOrder?: number;
}

export interface CadViewport {
  id: string;
  layoutId: string;
  /** DXF group 69 / DWG viewportId; paper-space id 1 is the system viewport, not a model projection. */
  viewportNumber?: number;
  order?: bigint;
  center: CadPoint2D;
  width: number;
  height: number;
  viewCenter: CadPoint2D;
  viewDirection?: CadPoint3D;
  perspective?: boolean;
  viewHeight: number;
  twistAngleRad?: number;
  frozenLayers: string[];
  clipPolygon?: CadPoint2D[];
  clipBoundaryObjectId?: string;
  layerOverrides?: Record<string, Partial<CadLayer>>;
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
  paperSpaceEntities?: Record<string, CadEntity[]>;
  diagnostics: CadDiagnostic[];
  provenanceSummary?: any;
  rawStats?: {
    rawHeaderInsunits?: number;
    rawEntitiesCount?: number;
    rawTableCounts?: Record<string, number>;
  };
}

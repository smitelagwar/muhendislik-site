export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
  z: number;
  scale: number;
  alpha: number;
  visibility?: number;
}

export interface WhaleSpineNode {
  s: number; // 0.0 (rostrum tip) to 1.0 (fluke notch)
  pos: Vector3;
  tangent: Vector3;
  normal: Vector3;   // dorsal (up)
  binormal: Vector3; // lateral (right)
  rx: number;        // transverse radius (half-width)
  ry: number;        // vertical radius (half-height)
  ventralBias: number; // downward pouch extension for throat grooves
}

export interface WhaleRib {
  s: number;
  points: ProjectedPoint[];
  isThoracic: boolean;
  isHead: boolean;
  isPeduncle: boolean;
}

export interface WhaleFlipper {
  side: "left" | "right";
  leadingEdge: ProjectedPoint[];
  trailingEdge: ProjectedPoint[];
  tubercles: ProjectedPoint[];
  internalSpars: ProjectedPoint[][];
  sections: ProjectedPoint[][];
  etching: ProjectedPoint[][];
  depth: number;
}

export interface WhaleFlukes {
  outline: ProjectedPoint[];
  notch: ProjectedPoint;
  tips: [ProjectedPoint, ProjectedPoint];
  ribLines: ProjectedPoint[][];
  contours: ProjectedPoint[][];
  depth: number;
}

export interface WhaleDorsalFin {
  outline: ProjectedPoint[];
  depth: number;
}

export interface WhaleSurfacePatch {
  points: ProjectedPoint[];
  light: number;
  depth: number;
}

export interface WhaleFeatureLine {
  points: ProjectedPoint[];
  kind: "jaw" | "ridge" | "scar" | "eye" | "blowhole" | "fold";
}

export interface WhaleNodule {
  center: ProjectedPoint;
  outline: ProjectedPoint[];
  crown: ProjectedPoint[];
}

export interface WhaleEtching {
  points: ProjectedPoint[];
  opacity: number;
}

export interface WhaleMarker {
  pos: ProjectedPoint;
  label: string;
  type: "cross" | "node" | "datum";
}

export interface WhaleMesh {
  spine: ProjectedPoint[];
  ribs: WhaleRib[];
  streamlines: ProjectedPoint[][];
  ventralPleats: ProjectedPoint[][];
  pleatHighlights: ProjectedPoint[][];
  leftFlipper: WhaleFlipper;
  rightFlipper: WhaleFlipper;
  flukes: WhaleFlukes;
  dorsalFin: WhaleDorsalFin;
  silhouettePolygon: Point2D[];
  technicalMarkers: WhaleMarker[];
  surface: WhaleSurfacePatch[];
  featureLines: WhaleFeatureLine[];
  eyes: ProjectedPoint[];
  tubercles: ProjectedPoint[];
  stipples: ProjectedPoint[];
  nodules: WhaleNodule[];
  etching: WhaleEtching[];
  depth: number;
}

export interface WhaleThemePalette {
  primaryLine: string;       // Crisp main blueprint contour & rib lines
  secondaryLine: string;     // Fainter internal streamlines & pleats
  backfaceLine: string;      // Back of mesh (depth attenuated)
  accentLine: string;        // Amber / cyan prominent feature lines
  washFill: string;          // Translucent interior volume
  markerColor: string;       // Technical ticks & labels
  flipperWhiteUnderside: string; // Faint luminous fill for Megaptera flipper underside
  surfaceRgb: string;
  highlightLine: string;
}

export interface WhaleConfig {
  length: number;           // Nominal base length in CSS pixels
  swimSpeed: number;        // Undulation frequency (Hz)
  loopPeriod: number;       // Viewport 3D orbit period in seconds
  cameraFocalLength: number;
}

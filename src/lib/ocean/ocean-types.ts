export interface OceanVec3 {
  x: number;
  y: number;
  z: number;
}

export interface OceanProjectedPoint {
  x: number;
  y: number;
  z: number;
  scale: number;
  alpha: number;
  visibility?: number;
}

export interface OceanQuadPatch {
  points: [OceanProjectedPoint, OceanProjectedPoint, OceanProjectedPoint, OceanProjectedPoint];
  light: number;
  specular: number;
  rim: number;
  subsurface: number;
  depth: number;
  tint: "kelp" | "seagrass" | "coral" | "manta" | "turtle-shell" | "turtle-skin" | "jelly" | "fish-silver" | "fish-reef" | "sponge";
  accent?: number;
}

export interface KelpBlade {
  spine: OceanProjectedPoint[];
  upperEdge: OceanProjectedPoint[];
  lowerEdge: OceanProjectedPoint[];
  pneumatocyst: OceanProjectedPoint;
  patches: OceanQuadPatch[];
  veinLines: OceanProjectedPoint[][];
  depth: number;
}

export interface KelpPlant {
  holdfast: OceanProjectedPoint[];
  stipe: OceanProjectedPoint[];
  blades: KelpBlade[];
  depth: number;
}

export interface CoralBranch {
  points: OceanProjectedPoint[];
  thickness: number;
  polyps: OceanProjectedPoint[];
}

export interface CoralFan {
  base: OceanProjectedPoint;
  branches: CoralBranch[];
  crossLinks: [OceanProjectedPoint, OceanProjectedPoint][];
  depth: number;
  variant: "gorgonian" | "antler";
}

export interface SeagrassBlade {
  outline: OceanProjectedPoint[];
  midrib: OceanProjectedPoint[];
  light: number;
  depth: number;
}

export interface TubeSpongeCluster {
  tubes: {
    outline: OceanProjectedPoint[];
    rimEllipse: OceanProjectedPoint[];
    ribs: OceanProjectedPoint[][];
    patches: OceanQuadPatch[];
    depth: number;
  }[];
  depth: number;
}

export type FishSpecies = "sardine" | "fusilier" | "scad" | "anthias" | "moorish-idol" | "pelagic-cruiser";

export interface ArticulatedFishMesh {
  species: FishSpecies;
  bodyOutline: OceanProjectedPoint[];
  dorsalFin: OceanProjectedPoint[];
  caudalFin: OceanProjectedPoint[];
  pectoralFinNear: OceanProjectedPoint[];
  pectoralFinFar: OceanProjectedPoint[];
  ventralFin: OceanProjectedPoint[];
  dorsalStreamer?: OceanProjectedPoint[];
  lateralLine: OceanProjectedPoint[];
  operculum: OceanProjectedPoint[];
  stripes: OceanProjectedPoint[][];
  ribs: OceanProjectedPoint[][];
  eye: OceanProjectedPoint;
  nose: OceanProjectedPoint;
  tailTip: OceanProjectedPoint;
  patches: OceanQuadPatch[];
  flashIntensity: number;
  heading2D: { x: number; y: number };
  depth: number;
  scale: number;
  label?: string;
}

export interface MantaRayMesh {
  outline: OceanProjectedPoint[];
  cephalicLeft: OceanProjectedPoint[];
  cephalicRight: OceanProjectedPoint[];
  tailWhip: OceanProjectedPoint[];
  dorsalFin: OceanProjectedPoint[];
  wingRibs: OceanProjectedPoint[][];
  gillSlits: OceanProjectedPoint[][];
  chevronMarks: OceanProjectedPoint[][];
  eyes: [OceanProjectedPoint, OceanProjectedPoint];
  patches: OceanQuadPatch[];
  wakeTrails: OceanProjectedPoint[][];
  center: OceanProjectedPoint;
  depth: number;
  label: string;
}

export interface JellyfishMesh {
  bellOutline: OceanProjectedPoint[];
  lappetRim: OceanProjectedPoint[];
  radialRibs: OceanProjectedPoint[][];
  innerGonadRing: OceanProjectedPoint[];
  oralArms: OceanProjectedPoint[][];
  tentacles: OceanProjectedPoint[][];
  patches: OceanQuadPatch[];
  apex: OceanProjectedPoint;
  depth: number;
  pulseFactor: number;
  variant: "compass" | "moon";
  label?: string;
}

export interface SeaTurtleMesh {
  carapaceOutline: OceanProjectedPoint[];
  scutePolygons: {
    points: OceanProjectedPoint[];
    light: number;
    specular: number;
    rim: number;
    isVertebral: boolean;
  }[];
  headOutline: OceanProjectedPoint[];
  eye: OceanProjectedPoint;
  frontFlipperNear: OceanProjectedPoint[];
  frontFlipperFar: OceanProjectedPoint[];
  hindFlipperNear: OceanProjectedPoint[];
  hindFlipperFar: OceanProjectedPoint[];
  flipperScales: OceanProjectedPoint[][];
  center: OceanProjectedPoint;
  depth: number;
  label: string;
}

export interface OceanBubble {
  pos: OceanProjectedPoint;
  radius: number;
  shimmer: number;
}

export interface OceanLightShaft {
  topX: number;
  bottomX: number;
  topWidth: number;
  bottomWidth: number;
  opacity: number;
}

export interface OceanSceneState {
  lightShafts: OceanLightShaft[];
  kelpPlants: KelpPlant[];
  coralFans: CoralFan[];
  seagrassBlades: SeagrassBlade[];
  spongeClusters: TubeSpongeCluster[];
  schoolFishes: ArticulatedFishMesh[];
  soloFishes: ArticulatedFishMesh[];
  mantaRays: MantaRayMesh[];
  jellyfishes: JellyfishMesh[];
  seaTurtles: SeaTurtleMesh[];
  bubbles: OceanBubble[];
}

export interface OceanThemePalette {
  primaryLine: string;
  secondaryLine: string;
  faintLine: string;
  accentLine: string;
  biolumLine: string;
  markerText: string;
  kelpDark: string;
  kelpMid: string;
  kelpLit: string;
  coralBase: string;
  coralHighlight: string;
  fishShadow: string;
  fishMid: string;
  fishBelly: string;
  fishFlash: string;
  mantaDark: string;
  mantaBelly: string;
  turtleShellDark: string;
  turtleShellLit: string;
  jellyGlow: string;
  jellyRim: string;
}

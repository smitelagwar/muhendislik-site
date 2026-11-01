/**
 * ideCAD binary (.ide10 / .ide11) format constants, signatures, and type mappings.
 * Corroborated by REA + Ghidra reverse engineering analysis (IDE_FORMAT_MAP.md).
 */

export const IDE_SIGNATURE = "IDE BUILDING DESIGNER PROJECT FILE\r\nVer 4 SubVer 00\r\nCopyright IDE YAPI\r\n\0";
export const IDE_HEADER_SIZE = 88;
export const IDE10_VERSION = 201094;
export const IDE11_VERSION = 211220;

export type IdeFormatVersion = "ide10" | "ide11";

export function getVersionNumber(format: IdeFormatVersion): number {
  return format === "ide11" ? IDE11_VERSION : IDE10_VERSION;
}

export const PRIMITIVE_WALL = 2;
export const PRIMITIVE_COLUMN = 4;
export const PRIMITIVE_BEAM = 5;
export const PRIMITIVE_AXIS = 6;
export const PRIMITIVE_SLAB = 7;
export const PRIMITIVE_SLAB_HOLE = 13;
export const PRIMITIVE_SHEAR_WALL = 17;
export const PRIMITIVE_STAIR = 40;
export const PRIMITIVE_LINE = 44;
export const PRIMITIVE_SLAB_EDGE = 45;
export const PRIMITIVE_SECTION = 123;
export const PRIMITIVE_BAND = 128;

export const DEFAULT_LAYER_IDS = {
  axis: 1,
  column: 2,
  beam: 3,
  wall: 4,
  slab: 5,
  slabHole: 5,
  stair: 6,
  dimension: 7,
} as const;

export const DEFAULT_COLORS = {
  axis: 1000000005,
  column: 1000000000,
  beam: 1000000001,
  wall: 1000000003,
  slab: 1000000004,
  stair: 1000000006,
} as const;

export const STANDARD_LOAD_CASES = [
  "G",
  "Q",
  "G'",
  "Q'",
  "Ez(G)",
  "Ex",
  "Ey",
  "Ex'",
  "Ey'",
  "ExB",
  "ExB'",
  "EyB",
  "EyB'",
] as const;

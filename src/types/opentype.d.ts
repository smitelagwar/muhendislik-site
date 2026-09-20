// ============================================================================
// OPENTYPE.JS TYPE DEFINITION FOR CAD V2
// ============================================================================

declare module "opentype.js" {
  export interface PathCommand {
    type: "M" | "L" | "C" | "Q" | "Z";
    x: number;
    y: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  }

  export interface Path {
    commands: PathCommand[];
    toSVG(decimalPlaces?: number): string;
  }

  export interface FontNames {
    fontFamily?: Record<string, string>;
    fontSubfamily?: Record<string, string>;
    fullName?: Record<string, string>;
    postScriptName?: Record<string, string>;
  }

  export interface Font {
    names: FontNames;
    unitsPerEm: number;
    ascender: number;
    descender: number;
    getPath(text: string, x: number, y: number, fontSize: number, options?: any): Path;
    getPaths(text: string, x: number, y: number, fontSize: number, options?: any): Path[];
    draw(ctx: any, text: string, x: number, y: number, fontSize: number, options?: any): void;
  }

  export function parse(buffer: ArrayBuffer | ArrayLike<number>): Font;
  export function load(url: string, callback: (err: any, font?: Font) => void): void;
  export function loadSync(url: string): Font;
}

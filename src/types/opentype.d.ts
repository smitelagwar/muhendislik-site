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
    fontFamily?: string | Record<string, string>;
    fontSubfamily?: Record<string, string>;
    fullName?: Record<string, string>;
    postScriptName?: Record<string, string>;
  }

  export interface FontRenderOptions {
    kerning?: boolean;
    features?: Record<string, boolean>;
    hinting?: boolean;
  }

  export interface Font {
    names: FontNames;
    unitsPerEm: number;
    ascender: number;
    descender: number;
    tables?: { os2?: { sCapHeight?: number } };
    stringToGlyphs(text: string): Glyph[];
    getKerningValue(leftGlyph: Glyph, rightGlyph: Glyph): number;
    getPath(text: string, x: number, y: number, fontSize: number, options?: FontRenderOptions): Path;
    getPaths(text: string, x: number, y: number, fontSize: number, options?: FontRenderOptions): Path[];
    draw(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number, options?: FontRenderOptions): void;
  }

  export interface Glyph {
    advanceWidth?: number;
  }

  export function parse(buffer: ArrayBuffer | ArrayLike<number>): Font;
  export function load(url: string, callback: (err: Error | null, font?: Font) => void): void;
  export function loadSync(url: string): Font;
}

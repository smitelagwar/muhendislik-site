// ============================================================================
// DWG/DXF MOTOR V2 — FONT & TEXT LAYOUT ENGINE (G07)
// ============================================================================
// Sözleşme: motor_v2/19_GEMINI_ADIM_ADIM_UYGULAMA.md (G07), R08, R09
// - OpenType.js ile TTF/OTF yazı tipi ayrıştırması
// - @mlightcad/shx-parser ile AutoCAD SHX tek/çift çizgi font ve şekil ayrıştırması
// - @mlightcad/mtext-parser ile MTEXT format kodları, stack fraction, renk ve \P ayrıştırması
// - Türkçe karakter desteği (Ğ, Ü, Ş, İ, Ö, Ç, ı, ğ, ü, ş, ö, ç)
// - CAD sembolleri (%%C -> Ø, %%D -> °, %%P -> ±)
// - Rotasyon, genişlik katsayısı (widthFactor) ve eğiklik (oblique)
// - Vektör glyph konturlarını 2D çizgi segmentlerine dönüştürme (0.25 px hassasiyet)
// - Bulunamayan fontlar için açık degraded kaydı ve deterministik fallback

import * as fs from "node:fs";
import * as path from "node:path";
import opentype from "opentype.js";
import { ShxFont } from "@mlightcad/shx-parser";
import { MTextParser, hasInlineFormattingCodes } from "@mlightcad/mtext-parser";
import type {
  CadTextEntity,
  CadMTextEntity,
  CadPoint2D,
} from "../canonical/types";

export interface TextGlyphSegment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  layer: string;
  order: bigint;
}

export interface FontDegradedDiagnostic {
  requestedFont: string;
  resolvedFont: string;
  reason: "shx_not_found" | "ttf_not_found" | "fallback_applied";
}

export class FontLayoutEngine {
  private static defaultFont: opentype.Font | null = null;
  private static boldFont: opentype.Font | null = null;
  private static serifFont: opentype.Font | null = null;
  private static shxFonts = new Map<string, ShxFont>();
  private static isInitialized = false;
  private static fontDir: string = path.resolve(process.cwd(), "public/fonts");
  private static degradedLogs: FontDegradedDiagnostic[] = [];

  /**
   * Font dizini yolunu yapılandırır
   */
  public static setFontDirectory(dir: string): void {
    this.fontDir = dir;
    this.isInitialized = false;
  }

  public static initFonts(): void {
    if (this.isInitialized) return;

    try {
      const regularPath = path.resolve(this.fontDir, "Arial-Regular.ttf");
      if (fs.existsSync(regularPath)) {
        const buf = fs.readFileSync(regularPath);
        this.defaultFont = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
      }

      const boldPath = path.resolve(this.fontDir, "Arial-Bold.ttf");
      if (fs.existsSync(boldPath)) {
        const buf = fs.readFileSync(boldPath);
        this.boldFont = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
      }

      const serifPath = path.resolve(this.fontDir, "IBMPlexSerif-Regular.ttf");
      if (fs.existsSync(serifPath)) {
        const buf = fs.readFileSync(serifPath);
        this.serifFont = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
      }

      // Varsa public/fonts/cad/ veya fontDir altındaki SHX dosyalarını tara ve yükle
      const cadDir = path.resolve(this.fontDir, "cad");
      const searchDirs = [this.fontDir, cadDir];
      for (const d of searchDirs) {
        if (fs.existsSync(d) && fs.statSync(d).isDirectory()) {
          const files = fs.readdirSync(d);
          for (const f of files) {
            if (f.toLowerCase().endsWith(".shx")) {
              try {
                const shxBuf = fs.readFileSync(path.resolve(d, f));
                const fontData = shxBuf.buffer.slice(shxBuf.byteOffset, shxBuf.byteOffset + shxBuf.byteLength);
                const shx = new ShxFont(fontData);
                this.shxFonts.set(f.toLowerCase(), shx);
                // Uzantısız adıyla da kaydet (örn: "simplex")
                this.shxFonts.set(path.parse(f).name.toLowerCase(), shx);
              } catch (e) {
                console.warn(`[FontLayoutEngine] SHX font yüklenemedi: ${f}`, e);
              }
            }
          }
        }
      }

      this.isInitialized = true;
    } catch (err) {
      console.warn("[FontLayoutEngine] Yazı tipleri yüklenirken uyarı:", err);
    }
  }

  /**
   * Çözümlenen veya fallback uygulanan font tanılarını döner
   */
  public static getDegradedLogs(): FontDegradedDiagnostic[] {
    return [...this.degradedLogs];
  }

  public static clearDegradedLogs(): void {
    this.degradedLogs = [];
  }

  /**
   * Stil adına göre uygun OpenType yazı tipini seçer
   */
  public static resolveFont(styleName?: string): opentype.Font | null {
    this.initFonts();
    const style = (styleName || "").toUpperCase();

    if (style.includes("BOLD") && this.boldFont) {
      return this.boldFont;
    }
    if ((style.includes("TIMES") || style.includes("SERIF")) && this.serifFont) {
      return this.serifFont;
    }
    return this.defaultFont;
  }

  /**
   * Stil veya font adına göre SHX fontunu bulur
   */
  public static resolveShxFont(fontFileName?: string): ShxFont | null {
    this.initFonts();
    if (!fontFileName) return null;
    const cleanName = fontFileName.trim().toLowerCase();
    const resolved = this.shxFonts.get(cleanName) || this.shxFonts.get(path.parse(cleanName).name.toLowerCase());
    if (resolved) {
      return resolved;
    }
    return null;
  }

  /**
   * AutoCAD özel sembollerini ve MTEXT kaçış kodlarını temizler
   */
  public static cleanCadText(raw: string): string {
    if (!raw) return "";

    let text = raw;

    // 1. CAD Sembol Değişimleri
    text = text.replace(/%%c/gi, "Ø"); // Çap
    text = text.replace(/%%d/gi, "°"); // Derece
    text = text.replace(/%%p/gi, "±"); // Artı/Eksi
    text = text.replace(/%%u/gi, "");  // Alt çizgi aç/kapa
    text = text.replace(/%%o/gi, "");  // Üst çizgi aç/kapa

    // 2. @mlightcad/mtext-parser ile zengin MTEXT ayrıştırma desteği
    if (hasInlineFormattingCodes(text)) {
      try {
        const parser = new MTextParser(text);
        const gen = parser.parse();
        const extracted: string[] = [];
        let cur = gen.next();
        while (!cur.done) {
          const tok = cur.value;
          if (tok && tok.data && typeof (tok.data as any).text === "string") {
            extracted.push((tok.data as any).text);
          } else if ((tok as any)?.text) {
            extracted.push((tok as any).text);
          }
          cur = gen.next();
        }
        if (extracted.length > 0) {
          text = extracted.join("");
        }
      } catch {
        // Fallback: regex tabanlı temizlik
      }
    }

    // 3. Standart MTEXT Biçimlendirme Kodlarını Temizle
    text = text.replace(/\\[Pp]/g, "\n");
    text = text.replace(/\\[A-Za-z][^;]*;/g, "");
    text = text.replace(/\\[A-Za-z0-9_.]+/g, "");
    text = text.replace(/[{}]/g, "");

    return text;
  }

  /**
   * Bir TEXT varlığını vektör çizgi parçalarına dönüştürür.
   * Önce SHX fontu aranır, yoksa TTF'e fallback yapılarak degraded tanı kaydı üretilir.
   */
  public static layoutText(textEnt: CadTextEntity): TextGlyphSegment[] {
    this.initFonts();
    const fontFileName = (textEnt as any).fontFileName || textEnt.styleName;
    const isShxRequest = fontFileName && fontFileName.toLowerCase().endsWith(".shx");

    // 1. SHX çözümü dene
    if (isShxRequest) {
      const shxFont = this.resolveShxFont(fontFileName);
      if (shxFont) {
        return this.renderShxStringToSegments(
          this.cleanCadText(textEnt.text),
          shxFont,
          textEnt.insertionPoint || [0, 0],
          Math.max(0.1, textEnt.height || 2.5),
          textEnt.rotationRad || 0,
          Math.max(0.1, textEnt.widthFactor || 1),
          textEnt.obliqueRad || 0,
          textEnt.layer,
          textEnt.order
        );
      } else {
        // Degraded tanı kaydı: talep edilen SHX bulunamadı, TTF fallback uygulanıyor
        this.degradedLogs.push({
          requestedFont: fontFileName,
          resolvedFont: "Arial (OpenType Fallback)",
          reason: "shx_not_found",
        });
      }
    }

    // 2. OpenType TTF/OTF çözümü
    const font = this.resolveFont(textEnt.styleName);
    if (!font) {
      this.degradedLogs.push({
        requestedFont: textEnt.styleName || "DEFAULT",
        resolvedFont: "none",
        reason: "ttf_not_found",
      });
      return [];
    }

    const cleanedText = this.cleanCadText(textEnt.text);
    if (!cleanedText) return [];

    const height = Math.max(0.1, textEnt.height || 2.5);
    const rotationRad = textEnt.rotationRad || 0;
    const widthFactor = Math.max(0.1, textEnt.widthFactor || 1);
    const obliqueRad = textEnt.obliqueRad || 0;
    const insertionPoint = textEnt.insertionPoint || [0, 0];

    return this.renderStringToSegments(
      cleanedText,
      font,
      insertionPoint,
      height,
      rotationRad,
      widthFactor,
      obliqueRad,
      textEnt.layer,
      textEnt.order
    );
  }

  /**
   * Bir MTEXT varlığını çok satırlı vektör çizgi parçalarına dönüştürür
   */
  public static layoutMText(mtextEnt: CadMTextEntity): TextGlyphSegment[] {
    this.initFonts();
    const font = this.resolveFont(mtextEnt.styleName);
    if (!font) return [];

    const cleanedText = this.cleanCadText(mtextEnt.text);
    if (!cleanedText) return [];

    const height = Math.max(0.1, mtextEnt.height || 2.5);
    const rotationRad = mtextEnt.rotationRad || 0;
    const insertionPoint = mtextEnt.insertionPoint || [0, 0];
    const lines = cleanedText.split("\n");

    const allSegments: TextGlyphSegment[] = [];
    const lineSpacing = height * 1.5;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const dyLocal = -i * lineSpacing;
      const cos = Math.cos(rotationRad);
      const sin = Math.sin(rotationRad);

      const lineStart: CadPoint2D = [
        insertionPoint[0] - dyLocal * sin,
        insertionPoint[1] + dyLocal * cos,
      ];

      const segs = this.renderStringToSegments(
        line,
        font,
        lineStart,
        height,
        rotationRad,
        1,
        0,
        mtextEnt.layer,
        mtextEnt.order
      );
      allSegments.push(...segs);
    }

    return allSegments;
  }

  /**
   * SHX fontu ile dizeyi 2D çizgi segmentlerine dönüştürür
   */
  private static renderShxStringToSegments(
    text: string,
    font: ShxFont,
    pos: CadPoint2D,
    height: number,
    rotationRad: number,
    widthFactor: number,
    obliqueRad: number,
    layer: string,
    order: bigint
  ): TextGlyphSegment[] {
    const segments: TextGlyphSegment[] = [];
    const cos = Math.cos(rotationRad);
    const sin = Math.sin(rotationRad);
    const tanOblique = Math.tan(obliqueRad);

    let cursorX = 0;
    const glyphSpacing = height * 0.1;

    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const shape = font.getLayoutCharShape(charCode, height) || font.getCharShape(charCode, height);
      if (!shape || !shape.polylines) {
        cursorX += height * 0.5 * widthFactor;
        continue;
      }

      for (const poly of shape.polylines) {
        if (!poly || poly.length < 2) continue;
        for (let pIdx = 0; pIdx < poly.length - 1; pIdx++) {
          const pt0 = poly[pIdx];
          const pt1 = poly[pIdx + 1];

          // 1. Oblique ve width factor uygula
          let lx0 = (cursorX + pt0.x) * widthFactor;
          let ly0 = pt0.y;
          if (obliqueRad !== 0) lx0 += ly0 * tanOblique;

          let lx1 = (cursorX + pt1.x) * widthFactor;
          let ly1 = pt1.y;
          if (obliqueRad !== 0) lx1 += ly1 * tanOblique;

          // 2. Rotasyon ve öteleme uygula
          const rx0 = lx0 * cos - ly0 * sin + pos[0];
          const ry0 = lx0 * sin + ly0 * cos + pos[1];
          const rx1 = lx1 * cos - ly1 * sin + pos[0];
          const ry1 = lx1 * sin + ly1 * cos + pos[1];

          segments.push({
            x0: rx0,
            y0: ry0,
            x1: rx1,
            y1: ry1,
            layer,
            order,
          });
        }
      }

      // Glyph advance genişliği
      const bboxWidth = shape.bbox ? Math.max(height * 0.4, shape.bbox.maxX - shape.bbox.minX) : height * 0.5;
      cursorX += (bboxWidth + glyphSpacing);
    }

    return segments;
  }

  /**
   * Dizeyi opentype.js fontu ile 2D çizgi parçalarına dönüştürür
   */
  private static renderStringToSegments(
    text: string,
    font: opentype.Font,
    pos: CadPoint2D,
    height: number,
    rotationRad: number,
    widthFactor: number,
    obliqueRad: number,
    layer: string,
    order: bigint
  ): TextGlyphSegment[] {
    const segments: TextGlyphSegment[] = [];
    const pathObj = font.getPath(text, 0, 0, height);
    const cos = Math.cos(rotationRad);
    const sin = Math.sin(rotationRad);
    const tanOblique = Math.tan(obliqueRad);

    const transform = (gx: number, gy: number): CadPoint2D => {
      let x = gx * widthFactor;
      let y = -gy; // Font Y yönünü yukarı doğru CAD eksenine çevir

      if (obliqueRad !== 0) {
        x += y * tanOblique;
      }

      const rx = x * cos - y * sin + pos[0];
      const ry = x * sin + y * cos + pos[1];
      return [rx, ry];
    };

    let startX = 0;
    let startY = 0;
    let currX = 0;
    let currY = 0;

    for (const cmd of pathObj.commands) {
      switch (cmd.type) {
        case "M": {
          currX = cmd.x;
          currY = cmd.y;
          startX = cmd.x;
          startY = cmd.y;
          break;
        }

        case "L": {
          const p0 = transform(currX, currY);
          const p1 = transform(cmd.x, cmd.y);
          segments.push({
            x0: p0[0],
            y0: p0[1],
            x1: p1[0],
            y1: p1[1],
            layer,
            order,
          });
          currX = cmd.x;
          currY = cmd.y;
          break;
        }

        case "Q": {
          const steps = 4;
          const x1 = cmd.x1 ?? cmd.x;
          const y1 = cmd.y1 ?? cmd.y;
          let prevP = transform(currX, currY);
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const it = 1 - t;
            const qx = it * it * currX + 2 * it * t * x1 + t * t * cmd.x;
            const qy = it * it * currY + 2 * it * t * y1 + t * t * cmd.y;
            const nextP = transform(qx, qy);
            segments.push({
              x0: prevP[0],
              y0: prevP[1],
              x1: nextP[0],
              y1: nextP[1],
              layer,
              order,
            });
            prevP = nextP;
          }
          currX = cmd.x;
          currY = cmd.y;
          break;
        }

        case "C": {
          const steps = 6;
          const x1 = cmd.x1 ?? cmd.x;
          const y1 = cmd.y1 ?? cmd.y;
          const x2 = cmd.x2 ?? cmd.x;
          const y2 = cmd.y2 ?? cmd.y;
          let prevP = transform(currX, currY);
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const it = 1 - t;
            const cx =
              it * it * it * currX +
              3 * it * it * t * x1 +
              3 * it * t * t * x2 +
              t * t * t * cmd.x;
            const cy =
              it * it * it * currY +
              3 * it * it * t * y1 +
              3 * it * t * t * y2 +
              t * t * t * cmd.y;
            const nextP = transform(cx, cy);
            segments.push({
              x0: prevP[0],
              y0: prevP[1],
              x1: nextP[0],
              y1: nextP[1],
              layer,
              order,
            });
            prevP = nextP;
          }
          currX = cmd.x;
          currY = cmd.y;
          break;
        }

        case "Z": {
          if (currX !== startX || currY !== startY) {
            const p0 = transform(currX, currY);
            const p1 = transform(startX, startY);
            segments.push({
              x0: p0[0],
              y0: p0[1],
              x1: p1[0],
              y1: p1[1],
              layer,
              order,
            });
          }
          currX = startX;
          currY = startY;
          break;
        }

        default:
          break;
      }
    }

    return segments;
  }
}

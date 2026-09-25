// ============================================================================
// DWG/DXF MOTOR V2 — FONT & TEXT LAYOUT ENGINE (G07 / F04)
// ============================================================================
// Sözleşme: Fidelity v3 Planı F04, motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md
// - OpenType.js ile TTF/OTF yazı tipi ayrıştırması
// - @mlightcad/shx-parser ile AutoCAD SHX tek/çift çizgi font ve şekil ayrıştırması
// - @mlightcad/mtext-parser ile MTEXT run tabanlı zengin biçimlendirme, stack fraction, renk ve \P
// - STYLE adı, gerçek font dosya adı, SHX vs TTF ayrımı
// - Font resolver: requested/resolved/hash/exact-substitute-missing sonucu & deterministik font digest
// - TEXT 1./2. hizalama noktası, halign/valign, FIT/ALIGNED, generation flags (ayna), widthFactor, oblique
// - MTEXT satır kaydırma (referenceWidth), 9 attachment noktası (TL, TC, TR, ML, MC, MR, BL, BC, BR), background mask
// - TTF contour outline (isContour: true) ve SHX stroke (isContour: false) ayrımı
// - Türkçe karakter doğruluğu (Ğ, Ü, Ş, İ, Ö, Ç, ı, ğ, ü, ş, ö, ç), \U+XXXX unicode, %%c, %%d, %%p sembolleri
// - İzolasyonlu diagnostik kaydı (istekler arasında global degraded log sızıntısı yok)

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import opentype from "opentype.js";
import { ShxFont } from "@mlightcad/shx-parser";
import { MTextParser, MTextContext, TokenType } from "@mlightcad/mtext-parser";
import type {
  CadTextEntity,
  CadMTextEntity,
  CadTextStyle,
  CadPoint2D,
  CadBBox2D,
  CadColor,
} from "../canonical/types";
import { CAD_V2_FONT_DIGEST } from "../version";

export interface TextGlyphSegment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  layer: string;
  order: bigint;
  color?: CadColor;
  isContour?: boolean;
}

export type FontResolutionStatus = "exact" | "substitute" | "missing";

export interface FontDegradedDiagnostic {
  requestedStyle: string;
  requestedFont: string;
  resolvedFont: string;
  status: FontResolutionStatus;
  reason: "shx_not_found" | "ttf_not_found" | "fallback_applied" | "exact_match" | "missing_glyph";
  char?: string;
}

export interface ResolvedFontInfo {
  requestedStyle: string;
  requestedFont: string;
  fontType: "shx" | "ttf" | "missing";
  resolvedFontName: string;
  fontHash: string;
  status: FontResolutionStatus;
  isSubstitute: boolean;
  shxFont?: ShxFont;
  ttfFont?: opentype.Font;
  diagnostic?: FontDegradedDiagnostic;
}

export interface TextLayoutOptions {
  textStyles?: Record<string, CadTextStyle>;
  overrideFont?: opentype.Font | ShxFont;
  diagnostics?: FontDegradedDiagnostic[];
  drawBoundingBox?: boolean;
  drawBackgroundMask?: boolean;
}

export interface TextLayoutResult {
  segments: TextGlyphSegment[];
  bbox: CadBBox2D;
  resolvedFont: ResolvedFontInfo;
  isExact: boolean;
  advanceWidth: number;
  height: number;
  baseline: [number, number];
  anchor: [number, number];
}

interface InternalFontEntry<T> {
  name: string;
  font: T;
  hash: string;
  isDefault?: boolean;
}

export class FontLayoutEngine {
  private static defaultFont: opentype.Font | null = null;
  private static boldFont: opentype.Font | null = null;
  private static serifFont: opentype.Font | null = null;
  private static defaultFontHash = "";

  private static ttfFonts = new Map<string, InternalFontEntry<opentype.Font>>();
  private static shxFonts = new Map<string, InternalFontEntry<ShxFont>>();
  private static cachedCatalogDigest = CAD_V2_FONT_DIGEST;

  private static isInitialized = false;
  private static fontDir: string = path.resolve(process.cwd(), "public/fonts");
  private static degradedLogs: FontDegradedDiagnostic[] = [];

  /**
   * Font dizini yolunu yapılandırır
   */
  public static setFontDirectory(dir: string): void {
    this.fontDir = dir;
    this.isInitialized = false;
    this.ttfFonts.clear();
    this.shxFonts.clear();
  }

  /**
   * Bellekteki yazı tiplerini sıfırlar ve diskten tekrar yükler
   */
  public static resetFontRegistry(): void {
    this.isInitialized = false;
    this.ttfFonts.clear();
    this.shxFonts.clear();
    this.degradedLogs = [];
    this.initFonts();
  }

  /**
   * Sistem yazı tiplerini yükler ve parmak izlerini hesaplar
   */
  public static initFonts(): void {
    if (this.isInitialized) return;

    try {
      this.ttfFonts.clear();
      this.shxFonts.clear();

      // 1. Standart TTF dosyalarını yükle
      const loadTtf = (fileName: string, isDefault = false, isBold = false, isSerif = false) => {
        const fullPath = path.resolve(this.fontDir, fileName);
        if (!fs.existsSync(fullPath)) return null;

        const buf = fs.readFileSync(fullPath);
        const hash = crypto.createHash("sha256").update(buf).digest("hex");
        const parsed = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
        const entry: InternalFontEntry<opentype.Font> = {
          name: fileName,
          font: parsed,
          hash,
          isDefault,
        };

        const lowerName = fileName.toLowerCase();
        const baseName = path.parse(fileName).name.toLowerCase();
        this.ttfFonts.set(lowerName, entry);
        this.ttfFonts.set(baseName, entry);

        // Aile adı ile de kaydet (örn: "arial")
        if (parsed.names?.fontFamily) {
          const fam = (typeof parsed.names.fontFamily === "string" ? parsed.names.fontFamily : (parsed.names.fontFamily as any)?.en || "").toLowerCase();
          if (fam) {
            if (!this.ttfFonts.has(fam) || isDefault) {
              this.ttfFonts.set(fam, entry);
            }
          }
        }

        if (isDefault) {
          this.defaultFont = parsed;
          this.defaultFontHash = hash;
        }
        if (isBold) {
          this.boldFont = parsed;
        }
        if (isSerif) {
          this.serifFont = parsed;
        }
        return entry;
      };

      loadTtf("Arial-Regular.ttf", true);
      loadTtf("Arial-Bold.ttf", false, true);
      loadTtf("IBMPlexSerif-Regular.ttf", false, false, true);
      loadTtf("IBMPlexSerif-Bold.ttf", false, false, false);

      // 2. SHX dizinlerini tara
      const cadDir = path.resolve(this.fontDir, "cad");
      const searchDirs = [this.fontDir, cadDir];
      for (const d of searchDirs) {
        if (fs.existsSync(d) && fs.statSync(d).isDirectory()) {
          const files = fs.readdirSync(d);
          for (const f of files) {
            if (f.toLowerCase().endsWith(".shx")) {
              try {
                const shxBuf = fs.readFileSync(path.resolve(d, f));
                const hash = crypto.createHash("sha256").update(shxBuf).digest("hex");
                const fontData = shxBuf.buffer.slice(shxBuf.byteOffset, shxBuf.byteOffset + shxBuf.byteLength);
                const shx = new ShxFont(fontData);
                const entry: InternalFontEntry<ShxFont> = {
                  name: f,
                  font: shx,
                  hash,
                };
                const lowerF = f.toLowerCase();
                const baseF = path.parse(f).name.toLowerCase();
                this.shxFonts.set(lowerF, entry);
                this.shxFonts.set(baseF, entry);
              } catch (e) {
                console.warn(`[FontLayoutEngine] SHX font yüklenemedi: ${f}`, e);
              }
            }
          }
        }
      }

      this.recomputeCatalogDigest();
      this.isInitialized = true;
    } catch (err) {
      console.warn("[FontLayoutEngine] Yazı tipleri yüklenirken uyarı:", err);
    }
  }

  /**
   * Yüklü font kataloğunun deterministik SHA-256 özetini hesaplar
   */
  private static recomputeCatalogDigest(): void {
    const entries: string[] = [];
    for (const [key, entry] of this.ttfFonts.entries()) {
      if (key.includes(".")) {
        entries.push(`ttf:${key}:${entry.hash}`);
      }
    }
    for (const [key, entry] of this.shxFonts.entries()) {
      if (key.includes(".")) {
        entries.push(`shx:${key}:${entry.hash}`);
      }
    }
    entries.sort();
    if (entries.length === 0) {
      this.cachedCatalogDigest = CAD_V2_FONT_DIGEST;
    } else {
      this.cachedCatalogDigest = crypto.createHash("sha256").update(entries.join("|")).digest("hex");
    }
  }

  /**
   * Sahne kimliğinde (scene identity) kullanılan deterministik font digest değerini döner
   */
  public static getFontDigest(): string {
    this.initFonts();
    return this.cachedCatalogDigest;
  }

  public static getFontCatalogDigest(): string {
    return this.getFontDigest();
  }

  /**
   * Çalışma zamanında özel TTF fontu kaydeder
   */
  public static registerTtfFont(name: string, data: Buffer | ArrayBuffer): void {
    this.initFonts();
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const hash = crypto.createHash("sha256").update(buf).digest("hex");
    const parsed = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer);
    const entry: InternalFontEntry<opentype.Font> = {
      name,
      font: parsed,
      hash,
    };
    const lowerName = name.toLowerCase();
    const baseName = path.parse(name).name.toLowerCase();
    this.ttfFonts.set(lowerName, entry);
    this.ttfFonts.set(baseName, entry);
    this.recomputeCatalogDigest();
  }

  /**
   * Çalışma zamanında özel SHX fontu kaydeder
   */
  public static registerShxFont(name: string, data: Buffer | ArrayBuffer): void {
    this.initFonts();
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const hash = crypto.createHash("sha256").update(buf).digest("hex");
    const fontData = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    const shx = new ShxFont(fontData);
    const entry: InternalFontEntry<ShxFont> = {
      name,
      font: shx,
      hash,
    };
    const lowerName = name.toLowerCase();
    const baseName = path.parse(name).name.toLowerCase();
    this.shxFonts.set(lowerName, entry);
    this.shxFonts.set(baseName, entry);
    this.recomputeCatalogDigest();
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
   * F04: Authoritative font çözümleyici.
   * STYLE adı, font dosya adı, SHX vs TTF ayrımı yapar.
   * requested/resolved/hash/exact-substitute-missing durumunu döner.
   */
  public static resolveFontStyle(params: {
    styleName?: string;
    textStyles?: Record<string, CadTextStyle>;
    fontFileName?: string;
    requestedFont?: string;
    contextDiagnostics?: FontDegradedDiagnostic[];
  }): ResolvedFontInfo {
    this.initFonts();

    const styleName = (params.styleName || "STANDARD").trim();
    const styleRecord = params.textStyles ? params.textStyles[styleName] || params.textStyles[styleName.toUpperCase()] : undefined;

    // Talep edilen font adını belirle:
    let requestedFont = params.fontFileName || (styleRecord && styleRecord.fontFileName) || params.requestedFont || "";
    if (!requestedFont) {
      requestedFont = styleName;
    }
    const cleanReq = requestedFont.trim();
    const cleanLower = cleanReq.toLowerCase();
    const baseLower = path.parse(cleanLower).name;

    // 1. SHX talebi mi? (.shx uzantılı veya shx kataloğunda mevcut)
    const isShxRequest = cleanLower.endsWith(".shx") || this.shxFonts.has(cleanLower) || this.shxFonts.has(baseLower);

    if (isShxRequest) {
      const shxEntry = this.shxFonts.get(cleanLower) || this.shxFonts.get(baseLower);
      if (shxEntry) {
        return {
          requestedStyle: styleName,
          requestedFont: cleanReq,
          fontType: "shx",
          resolvedFontName: shxEntry.name,
          fontHash: shxEntry.hash,
          status: "exact",
          isSubstitute: false,
          shxFont: shxEntry.font,
        };
      } else {
        // Talep edilen SHX bulunamadı -> TTF fallback (Arial) uygulanır
        // Bu KESİNLİKLE 'substitute' olarak işaretlenmelidir, ASLA 'exact' olamaz.
        const diag: FontDegradedDiagnostic = {
          requestedStyle: styleName,
          requestedFont: cleanReq,
          resolvedFont: "Arial-Regular.ttf",
          status: "substitute",
          reason: "shx_not_found",
        };
        if (params.contextDiagnostics) {
          params.contextDiagnostics.push(diag);
        } else {
          this.degradedLogs.push(diag);
        }

        return {
          requestedStyle: styleName,
          requestedFont: cleanReq,
          fontType: "ttf",
          resolvedFontName: "Arial-Regular.ttf",
          fontHash: this.defaultFontHash,
          status: "substitute",
          isSubstitute: true,
          ttfFont: this.defaultFont || undefined,
          diagnostic: diag,
        };
      }
    }

    // 2. TTF / OTF çözümü
    // Tam ad veya uzantısız ad ile ara
    const ttfEntry = this.ttfFonts.get(cleanLower) || this.ttfFonts.get(baseLower);
    if (ttfEntry) {
      return {
        requestedStyle: styleName,
        requestedFont: cleanReq,
        fontType: "ttf",
        resolvedFontName: ttfEntry.name,
        fontHash: ttfEntry.hash,
        status: "exact",
        isSubstitute: false,
        ttfFont: ttfEntry.font,
      };
    }

    // 3. Standart stil için varsayılan font
    if (cleanLower === "standard" || cleanLower === "default" || cleanLower === "") {
      if (this.defaultFont) {
        return {
          requestedStyle: styleName,
          requestedFont: cleanReq || "STANDARD",
          fontType: "ttf",
          resolvedFontName: "Arial-Regular.ttf",
          fontHash: this.defaultFontHash,
          status: "exact",
          isSubstitute: false,
          ttfFont: this.defaultFont,
        };
      }
    }

    // 4. Bulunamayan font -> Deterministik substitute (Arial veya Serif)
    let substituteFont = this.defaultFont;
    let substituteName = "Arial-Regular.ttf";
    let substituteHash = this.defaultFontHash;

    if (cleanLower.includes("bold") && this.boldFont) {
      substituteFont = this.boldFont;
      substituteName = "Arial-Bold.ttf";
      substituteHash = this.ttfFonts.get("arial-bold.ttf")?.hash || this.defaultFontHash;
    } else if ((cleanLower.includes("times") || cleanLower.includes("serif")) && this.serifFont) {
      substituteFont = this.serifFont;
      substituteName = "IBMPlexSerif-Regular.ttf";
      substituteHash = this.ttfFonts.get("ibmplexserif-regular.ttf")?.hash || this.defaultFontHash;
    }

    if (!substituteFont) {
      const diag: FontDegradedDiagnostic = {
        requestedStyle: styleName,
        requestedFont: cleanReq,
        resolvedFont: "none",
        status: "missing",
        reason: "ttf_not_found",
      };
      if (params.contextDiagnostics) {
        params.contextDiagnostics.push(diag);
      } else {
        this.degradedLogs.push(diag);
      }
      return {
        requestedStyle: styleName,
        requestedFont: cleanReq,
        fontType: "missing",
        resolvedFontName: "none",
        fontHash: "0000000000000000000000000000000000000000000000000000000000000000",
        status: "missing",
        isSubstitute: false,
        diagnostic: diag,
      };
    }

    const diag: FontDegradedDiagnostic = {
      requestedStyle: styleName,
      requestedFont: cleanReq,
      resolvedFont: substituteName,
      status: "substitute",
      reason: "fallback_applied",
    };
    if (params.contextDiagnostics) {
      params.contextDiagnostics.push(diag);
    } else {
      this.degradedLogs.push(diag);
    }

    return {
      requestedStyle: styleName,
      requestedFont: cleanReq,
      fontType: "ttf",
      resolvedFontName: substituteName,
      fontHash: substituteHash,
      status: "substitute",
      isSubstitute: true,
      ttfFont: substituteFont,
      diagnostic: diag,
    };
  }

  /**
   * Geriye dönük uyumluluk için OpenType font çözücü
   */
  public static resolveFont(styleName?: string): opentype.Font | null {
    const res = this.resolveFontStyle({ styleName });
    return res.ttfFont || this.defaultFont;
  }

  /**
   * Geriye dönük uyumluluk için SHX font çözücü
   */
  public static resolveShxFont(fontFileName?: string): ShxFont | null {
    this.initFonts();
    if (!fontFileName) return null;
    const cleanName = fontFileName.trim().toLowerCase();
    const entry = this.shxFonts.get(cleanName) || this.shxFonts.get(path.parse(cleanName).name.toLowerCase());
    return entry ? entry.font : null;
  }

  /**
   * AutoCAD özel sembollerini, Türkçe Unicode kaçışlarını (\U+XXXX) ve kontrol kodlarını temizler/çözer.
   */
  public static cleanCadText(raw: string): string {
    if (!raw) return "";

    let text = raw;

    // 1. Unicode ve MIF Kaçış Dizileri: \U+XXXX ve \\U+XXXX (Türkçe ĞÜŞİÖÇ ığüşöç ve diğerleri)
    text = text.replace(/(?:\\{1,2})U\+([0-9a-fA-F]{4})/gi, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return _;
      }
    });

    // 2. AutoCAD Yüzde Sembol Kodları
    text = text.replace(/%%c/gi, "Ø"); // Çap (U+00D8)
    text = text.replace(/%%d/gi, "°"); // Derece (U+00B0)
    text = text.replace(/%%p/gi, "±"); // Artı/Eksi (U+00B1)
    text = text.replace(/%%u/gi, "");  // Alt çizgi aç/kapa
    text = text.replace(/%%o/gi, "");  // Üst çizgi aç/kapa
    text = text.replace(/%%%/g, "%");  // Literal yüzde
    text = text.replace(/%%(\d{3})/g, (_, n) => {
      try {
        return String.fromCharCode(parseInt(n, 10));
      } catch {
        return _;
      }
    });

    // 3. Bölünemez boşluk
    text = text.replace(/\\~/g, " ");

    // 4. MTEXT Biçimlendirme Kodlarını Temizle (eğer ham MTEXT düz yazıya indirgenecekse)
    text = text.replace(/\\[Pp]/g, "\n");
    text = text.replace(/\\[A-Za-z][^;]*;/g, "");
    text = text.replace(/\\[A-Za-z0-9_.]+/g, "");
    text = text.replace(/[{}]/g, "");

    return text;
  }

  /**
   * opentype.Font için metin genişliğini (advance width) tam metriklerle hesaplar
   */
  public static measureTextWidth(font: opentype.Font, text: string, fontSize: number): number {
    if (!text) return 0;
    const scale = fontSize / (font.unitsPerEm || 1000);
    let width = 0;
    try {
      const fAny = font as any;
      const glyphs = typeof fAny.stringToGlyphs === "function" ? fAny.stringToGlyphs(text) : [];
      for (let i = 0; i < glyphs.length; i++) {
        const g = glyphs[i];
        if (g && typeof g.advanceWidth === "number") {
          width += g.advanceWidth * scale;
        } else {
          width += fontSize * 0.5;
        }
        if (i < glyphs.length - 1 && typeof fAny.getKerningValue === "function") {
          const kern = fAny.getKerningValue(g, glyphs[i + 1]);
          if (typeof kern === "number") {
            width += kern * scale;
          }
        }
      }
      if (glyphs.length === 0) {
        width = text.length * fontSize * 0.6;
      }
    } catch {
      width = text.length * fontSize * 0.6;
    }
    return width;
  }

  /**
   * TEXT varlığını vektör çizgi parçalarına dönüştürür.
   */
  public static layoutText(textEnt: CadTextEntity, options?: TextLayoutOptions): TextGlyphSegment[] {
    const res = this.layoutTextDetailed(textEnt, options);
    return res.segments;
  }

  /**
   * F04: Detaylı TEXT yerleşim motoru.
   * first/second alignment point, halign/valign, FIT/ALIGNED, generation flags (ayna),
   * widthFactor, oblique ve font metriklerini kesin matematiksel kurallarla çözer.
   */
  public static layoutTextDetailed(textEnt: CadTextEntity, options?: TextLayoutOptions): TextLayoutResult {
    this.initFonts();

    const cleanedText = this.cleanCadText(textEnt.text);
    const resolved = options?.overrideFont instanceof ShxFont
      ? {
          requestedStyle: textEnt.styleName,
          requestedFont: textEnt.styleName,
          fontType: "shx" as const,
          resolvedFontName: "custom.shx",
          fontHash: "custom",
          status: "exact" as const,
          isSubstitute: false,
          shxFont: options.overrideFont,
        }
      : options?.overrideFont
      ? {
          requestedStyle: textEnt.styleName,
          requestedFont: textEnt.styleName,
          fontType: "ttf" as const,
          resolvedFontName: "custom.ttf",
          fontHash: "custom",
          status: "exact" as const,
          isSubstitute: false,
          ttfFont: options.overrideFont as opentype.Font,
        }
      : this.resolveFontStyle({
          styleName: textEnt.styleName,
          textStyles: options?.textStyles,
          contextDiagnostics: options?.diagnostics,
        });

    const height = Math.max(0.01, textEnt.height || 2.5);
    const widthFactor = Math.max(0.01, textEnt.widthFactor || 1);
    const obliqueRad = textEnt.obliqueRad || 0;
    const rotationRad = textEnt.rotationRad || 0;
    const p1: CadPoint2D = textEnt.insertionPoint ? [textEnt.insertionPoint[0], textEnt.insertionPoint[1]] : [0, 0];
    const p2: CadPoint2D | undefined = textEnt.alignmentPoint ? [textEnt.alignmentPoint[0], textEnt.alignmentPoint[1]] : undefined;

    const hMode = textEnt.horizontalMode ?? 0;
    const vMode = textEnt.verticalMode ?? 0;
    const genFlag = textEnt.generationFlag ?? 0;
    const isMirrorX = (genFlag & 2) !== 0; // Bit 2: Backward
    const isMirrorY = (genFlag & 4) !== 0; // Bit 4: Upside down

    if (!cleanedText || resolved.fontType === "missing" || (!resolved.ttfFont && !resolved.shxFont)) {
      return {
        segments: [],
        bbox: [p1[0], p1[1], p1[0], p1[1]],
        resolvedFont: resolved,
        isExact: resolved.status === "exact",
        advanceWidth: 0,
        height,
        baseline: [p1[0], p1[1]],
        anchor: [p1[0], p1[1]],
      };
    }

    // 1. Temel yazı genişliği ve font metriklerini ölç
    let baseAdvanceWidth = 0;
    let capHeight = height * 0.7;
    let ascender = height * 0.8;
    let descender = -height * 0.2;

    if (resolved.fontType === "ttf" && resolved.ttfFont) {
      const font = resolved.ttfFont;
      const unitsPerEm = font.unitsPerEm || 1000;
      const scale = height / unitsPerEm;
      const fAny = font as any;
      if (fAny.tables?.os2?.sCapHeight) {
        capHeight = fAny.tables.os2.sCapHeight * scale;
      }
      if (font.ascender) {
        ascender = font.ascender * scale;
      }
      if (font.descender) {
        descender = font.descender * scale;
      }
      baseAdvanceWidth = this.measureTextWidth(font, cleanedText, height);
    } else if (resolved.fontType === "shx" && resolved.shxFont) {
      const shx = resolved.shxFont;
      capHeight = height;
      ascender = height;
      descender = -height * 0.2;
      for (let i = 0; i < cleanedText.length; i++) {
        const code = cleanedText.charCodeAt(i);
        const shape = shx.getLayoutCharShape(code, height) || shx.getCharShape(code, height);
        const w = shape?.bbox ? Math.max(height * 0.4, shape.bbox.maxX - shape.bbox.minX) : height * 0.5;
        baseAdvanceWidth += w + height * 0.1;
      }
    }

    // 2. Hizalama Noktası, Açı, Efektif Yükseklik ve Genişlik Katsayısını Belirle
    let effHeight = height;
    let effWidthFactor = widthFactor;
    let effRotationRad = rotationRad;
    let anchor: CadPoint2D = [p1[0], p1[1]];
    let ox = 0;
    let oy = 0;

    if (hMode === 3 && p2) {
      // ALIGNED (Hizalı): P1 ile P2 arasına orantılı sığdırılır (boy ve en birlikte ölçeklenir)
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const targetLen = Math.hypot(dx, dy);
      effRotationRad = Math.atan2(dy, dx);
      if (targetLen > 1e-6 && baseAdvanceWidth > 1e-6) {
        const s = targetLen / (baseAdvanceWidth * widthFactor);
        effHeight = height * s;
        effWidthFactor = widthFactor;
      }
      anchor = [p1[0], p1[1]];
      ox = 0;
      oy = 0;
    } else if (hMode === 5 && p2) {
      // FIT (Sığdır): P1 ile P2 arasına yükseklik sabit kalarak genişlik katsayısı ayarlanır
      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const targetLen = Math.hypot(dx, dy);
      effRotationRad = Math.atan2(dy, dx);
      if (targetLen > 1e-6 && baseAdvanceWidth > 1e-6) {
        effWidthFactor = targetLen / baseAdvanceWidth;
      }
      anchor = [p1[0], p1[1]];
      ox = 0;
      oy = 0;
    } else {
      // STANDART HİZALAMA:
      // AutoCAD Kuralı: hMode == 0 && vMode == 0 ise P1 kullanılır, P2 yok sayılır.
      // Diğer tüm durumlarda P2 (alignmentPoint) geçerlidir.
      if (hMode === 0 && vMode === 0) {
        anchor = [p1[0], p1[1]];
      } else {
        anchor = p2 ? [p2[0], p2[1]] : [p1[0], p1[1]];
      }

      const totalW = baseAdvanceWidth * effWidthFactor;

      // Yatay hizalama ofseti
      switch (hMode) {
        case 0: // Sol
          ox = 0;
          break;
        case 1: // Orta (Center)
          ox = -totalW / 2;
          break;
        case 2: // Sağ
          ox = -totalW;
          break;
        case 4: // Middle
          ox = -totalW / 2;
          break;
        default:
          ox = 0;
          break;
      }

      // Düşey hizalama ofseti
      if (hMode === 4 && vMode === 0) {
        // AutoCAD "Middle" kuralı: hem yatay hem düşey ortalama
        oy = -capHeight / 2;
      } else {
        switch (vMode) {
          case 0: // Taban çizgisi (Baseline)
            oy = 0;
            break;
          case 1: // Alt (Bottom)
            oy = -descender;
            break;
          case 2: // Orta (Middle)
            oy = -capHeight / 2;
            break;
          case 3: // Üst (Top)
            oy = -capHeight;
            break;
          default:
            oy = 0;
            break;
        }
      }
    }

    const segments: TextGlyphSegment[] = [];
    const cos = Math.cos(effRotationRad);
    const sin = Math.sin(effRotationRad);
    const tanOblique = Math.tan(obliqueRad);
    const totalW = baseAdvanceWidth * effWidthFactor;

    // 2D dönüşüm fonksiyonu: lokal glif koordinatından dünya uzayına
    const transformLocalPoint = (lx: number, ly: number): CadPoint2D => {
      let x = lx * effWidthFactor;
      let y = ly;

      // Ayna dönüşümleri
      if (isMirrorX) {
        x = totalW - x;
      }
      if (isMirrorY) {
        y = -y;
      }

      // Oblique (eğiklik)
      if (obliqueRad !== 0) {
        x += y * tanOblique;
      }

      // Hizalama ofseti ekle
      x += ox;
      y += oy;

      // Rotasyon ve öteleme
      const rx = x * cos - y * sin + anchor[0];
      const ry = x * sin + y * cos + anchor[1];
      return [rx, ry];
    };

    if (resolved.fontType === "shx" && resolved.shxFont) {
      const shx = resolved.shxFont;
      let cursorX = 0;
      const glyphSpacing = effHeight * 0.1;

      for (let i = 0; i < cleanedText.length; i++) {
        const charCode = cleanedText.charCodeAt(i);
        const shape = shx.getLayoutCharShape(charCode, effHeight) || shx.getCharShape(charCode, effHeight);
        if (!shape || !shape.polylines) {
          cursorX += effHeight * 0.5;
          continue;
        }

        for (const poly of shape.polylines) {
          if (!poly || poly.length < 2) continue;
          for (let pIdx = 0; pIdx < poly.length - 1; pIdx++) {
            const pt0 = poly[pIdx];
            const pt1 = poly[pIdx + 1];
            const p0 = transformLocalPoint(cursorX + pt0.x, pt0.y);
            const p1 = transformLocalPoint(cursorX + pt1.x, pt1.y);
            segments.push({
              x0: p0[0],
              y0: p0[1],
              x1: p1[0],
              y1: p1[1],
              layer: textEnt.layer,
              order: textEnt.order,
              color: textEnt.color,
              isContour: false, // SHX merkez çizgisi vuruşudur
            });
          }
        }
        const bboxWidth = shape.bbox ? Math.max(effHeight * 0.4, shape.bbox.maxX - shape.bbox.minX) : effHeight * 0.5;
        cursorX += bboxWidth + glyphSpacing;
      }
    } else if (resolved.fontType === "ttf" && resolved.ttfFont) {
      const font = resolved.ttfFont;
      const pathObj = font.getPath(cleanedText, 0, 0, effHeight);

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
            const p0 = transformLocalPoint(currX, -currY); // Font Y ekseni aşağıdır, CAD için çevir
            const p1 = transformLocalPoint(cmd.x, -cmd.y);
            segments.push({
              x0: p0[0],
              y0: p0[1],
              x1: p1[0],
              y1: p1[1],
              layer: textEnt.layer,
              order: textEnt.order,
              color: textEnt.color,
              isContour: true, // TTF kapalı kontur segmentidir
            });
            currX = cmd.x;
            currY = cmd.y;
            break;
          }

          case "Q": {
            const steps = 4;
            const x1 = cmd.x1 ?? cmd.x;
            const y1 = cmd.y1 ?? cmd.y;
            let prevP = transformLocalPoint(currX, -currY);
            for (let i = 1; i <= steps; i++) {
              const t = i / steps;
              const it = 1 - t;
              const qx = it * it * currX + 2 * it * t * x1 + t * t * cmd.x;
              const qy = it * it * currY + 2 * it * t * y1 + t * t * cmd.y;
              const nextP = transformLocalPoint(qx, -qy);
              segments.push({
                x0: prevP[0],
                y0: prevP[1],
                x1: nextP[0],
                y1: nextP[1],
                layer: textEnt.layer,
                order: textEnt.order,
                color: textEnt.color,
                isContour: true,
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
            let prevP = transformLocalPoint(currX, -currY);
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
              const nextP = transformLocalPoint(cx, -cy);
              segments.push({
                x0: prevP[0],
                y0: prevP[1],
                x1: nextP[0],
                y1: nextP[1],
                layer: textEnt.layer,
                order: textEnt.order,
                color: textEnt.color,
                isContour: true,
              });
              prevP = nextP;
            }
            currX = cmd.x;
            currY = cmd.y;
            break;
          }

          case "Z": {
            if (currX !== startX || currY !== startY) {
              const p0 = transformLocalPoint(currX, -currY);
              const p1 = transformLocalPoint(startX, -startY);
              segments.push({
                x0: p0[0],
                y0: p0[1],
                x1: p1[0],
                y1: p1[1],
                layer: textEnt.layer,
                order: textEnt.order,
                color: textEnt.color,
                isContour: true,
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
    }

    // BBox ve baseline hesapla
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const seg of segments) {
      minX = Math.min(minX, seg.x0, seg.x1);
      minY = Math.min(minY, seg.y0, seg.y1);
      maxX = Math.max(maxX, seg.x0, seg.x1);
      maxY = Math.max(maxY, seg.y0, seg.y1);
    }
    if (!Number.isFinite(minX)) {
      minX = anchor[0];
      minY = anchor[1];
      maxX = anchor[0];
      maxY = anchor[1];
    }

    const baselinePt = transformLocalPoint(0, 0);

    return {
      segments,
      bbox: [minX, minY, maxX, maxY],
      resolvedFont: resolved,
      isExact: resolved.status === "exact",
      advanceWidth: totalW,
      height: effHeight,
      baseline: baselinePt,
      anchor,
    };
  }

  /**
   * MTEXT varlığını çok satırlı vektör çizgi parçalarına dönüştürür.
   */
  public static layoutMText(mtextEnt: CadMTextEntity, options?: TextLayoutOptions): TextGlyphSegment[] {
    const res = this.layoutMTextDetailed(mtextEnt, options);
    return res.segments;
  }

  /**
   * F04: Zengin run tabanlı MTEXT yerleşim motoru.
   * \P, \C (renk), \H (yükseklik), \W (width), \T (tracking), \Q (oblique),
   * \S (stacked fractions: #, /, ^), \L/\O (alt/üst çizgi),
   * referenceWidth satır kaydırma, 9 attachment noktası ve background mask desteği.
   */
  public static layoutMTextDetailed(mtextEnt: CadMTextEntity, options?: TextLayoutOptions): TextLayoutResult {
    this.initFonts();

    const rawText = mtextEnt.text || "";
    const baseHeight = Math.max(0.01, mtextEnt.height || 2.5);
    const rotationRad = mtextEnt.rotationRad || 0;
    const refWidth = Math.max(0, mtextEnt.referenceWidth || 0);
    const attachPoint = mtextEnt.attachmentPoint || 1;
    const insertionPoint: CadPoint2D = mtextEnt.insertionPoint ? [mtextEnt.insertionPoint[0], mtextEnt.insertionPoint[1]] : [0, 0];

    const resolved = this.resolveFontStyle({
      styleName: mtextEnt.styleName,
      textStyles: options?.textStyles,
      contextDiagnostics: options?.diagnostics,
    });

    const font = resolved.ttfFont || this.defaultFont;
    if (!rawText || !font) {
      return {
        segments: [],
        bbox: [insertionPoint[0], insertionPoint[1], insertionPoint[0], insertionPoint[1]],
        resolvedFont: resolved,
        isExact: resolved.status === "exact",
        advanceWidth: 0,
        height: baseHeight,
        baseline: [insertionPoint[0], insertionPoint[1]],
        anchor: [insertionPoint[0], insertionPoint[1]],
      };
    }

    // 1. Token ayrıştırma ve formatlı RUN listesi oluşturma
    interface MRun {
      text: string;
      isSpace: boolean;
      isParagraphBreak: boolean;
      isStack: boolean;
      stackNumerator?: string;
      stackDenominator?: string;
      stackType?: "#" | "/" | "^";
      height: number;
      widthFactor: number;
      tracking: number;
      obliqueDeg: number;
      underline: boolean;
      overline: boolean;
      color?: CadColor;
      font: opentype.Font;
      width: number;
    }

    const runs: MRun[] = [];

    try {
      const initCtx = new MTextContext();
      initCtx.capHeight = { value: baseHeight, isRelative: false };
      const parser = new MTextParser(rawText, initCtx);
      const tokenGen = parser.parse();
      let cur = tokenGen.next();

      while (!cur.done) {
        const tok = cur.value;
        const ctx = tok?.ctx;

        let curHeight = baseHeight;
        if (ctx?.capHeight) {
          curHeight = ctx.capHeight.isRelative ? baseHeight * ctx.capHeight.value : ctx.capHeight.value;
        }
        let curWf = 1;
        if (ctx?.widthFactor) {
          curWf = ctx.widthFactor.value;
        }
        let curTracking = 1;
        if (ctx?.charTrackingFactor) {
          curTracking = ctx.charTrackingFactor.value;
        }
        const curOblique = ctx?.oblique || 0;
        const curUnderline = !!ctx?.underline;
        const curOverline = !!ctx?.overline;

        let curColor: CadColor | undefined = mtextEnt.color;
        if (ctx?.color) {
          if (ctx.color.rgb) {
            curColor = { method: "rgb", rgb: ctx.color.rgb };
          } else if (ctx.color.aci !== null && ctx.color.aci !== undefined && ctx.color.aci !== 256) {
            curColor = { method: "aci", aci: ctx.color.aci };
          }
        }

        let curFont = font;
        if (ctx?.fontFace?.family) {
          const famLower = ctx.fontFace.family.toLowerCase();
          const found = this.ttfFonts.get(famLower);
          if (found) {
            curFont = found.font;
          }
        }

        if (tok.type === TokenType.WORD) {
          const wText = this.cleanCadText(typeof tok.data === "string" ? tok.data : (tok as any).text || "");
          if (wText) {
            const w = this.measureTextWidth(curFont, wText, curHeight) * curWf * curTracking;
            runs.push({
              text: wText,
              isSpace: false,
              isParagraphBreak: false,
              isStack: false,
              height: curHeight,
              widthFactor: curWf,
              tracking: curTracking,
              obliqueDeg: curOblique,
              underline: curUnderline,
              overline: curOverline,
              color: curColor,
              font: curFont,
              width: w,
            });
          }
        } else if (tok.type === TokenType.SPACE || tok.type === TokenType.NBSP) {
          const spW = this.measureTextWidth(curFont, " ", curHeight) * curWf;
          runs.push({
            text: " ",
            isSpace: true,
            isParagraphBreak: false,
            isStack: false,
            height: curHeight,
            widthFactor: curWf,
            tracking: curTracking,
            obliqueDeg: curOblique,
            underline: curUnderline,
            overline: curOverline,
            color: curColor,
            font: curFont,
            width: spW,
          });
        } else if (tok.type === TokenType.NEW_PARAGRAPH) {
          runs.push({
            text: "\n",
            isSpace: false,
            isParagraphBreak: true,
            isStack: false,
            height: curHeight,
            widthFactor: curWf,
            tracking: curTracking,
            obliqueDeg: curOblique,
            underline: false,
            overline: false,
            font: curFont,
            width: 0,
          });
        } else if (tok.type === TokenType.STACK && Array.isArray(tok.data)) {
          const num = this.cleanCadText(tok.data[0] || "");
          const den = this.cleanCadText(tok.data[1] || "");
          const stType = (tok.data[2] || "/") as "#" | "/" | "^";
          const fracH = curHeight * 0.65;
          const wNum = this.measureTextWidth(curFont, num, fracH);
          const wDen = this.measureTextWidth(curFont, den, fracH);
          const stackW = Math.max(wNum, wDen) + curHeight * 0.15;

          runs.push({
            text: `${num}${stType}${den}`,
            isSpace: false,
            isParagraphBreak: false,
            isStack: true,
            stackNumerator: num,
            stackDenominator: den,
            stackType: stType,
            height: curHeight,
            widthFactor: curWf,
            tracking: curTracking,
            obliqueDeg: curOblique,
            underline: curUnderline,
            overline: curOverline,
            color: curColor,
            font: curFont,
            width: stackW,
          });
        }

        cur = tokenGen.next();
      }
    } catch {
      // Parser hatası durumunda düz metin satır bölüntüsü ile devam et
      const cleaned = this.cleanCadText(rawText);
      const lines = cleaned.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) {
          runs.push({
            text: "\n",
            isSpace: false,
            isParagraphBreak: true,
            isStack: false,
            height: baseHeight,
            widthFactor: 1,
            tracking: 1,
            obliqueDeg: 0,
            underline: false,
            overline: false,
            font,
            width: 0,
          });
        }
        const w = this.measureTextWidth(font, lines[i], baseHeight);
        runs.push({
          text: lines[i],
          isSpace: false,
          isParagraphBreak: false,
          isStack: false,
          height: baseHeight,
          widthFactor: 1,
          tracking: 1,
          obliqueDeg: 0,
          underline: false,
          overline: false,
          color: mtextEnt.color,
          font,
          width: w,
        });
      }
    }

    // 2. Satırlara bölme (Word Wrap & Paragraph Breaks)
    interface MLine {
      runs: MRun[];
      lineWidth: number;
    }

    const lines: MLine[] = [];
    let curLineRuns: MRun[] = [];
    let curLineWidth = 0;

    for (const run of runs) {
      if (run.isParagraphBreak) {
        lines.push({ runs: curLineRuns, lineWidth: curLineWidth });
        curLineRuns = [];
        curLineWidth = 0;
        continue;
      }

      // Satır kaydırma kontrolü (referenceWidth > 0)
      if (refWidth > 0 && curLineWidth + run.width > refWidth && curLineRuns.length > 0 && !run.isSpace) {
        lines.push({ runs: curLineRuns, lineWidth: curLineWidth });
        curLineRuns = [];
        curLineWidth = 0;
      }

      // Satır başında gereksiz boşluk bırakma
      if (curLineRuns.length === 0 && run.isSpace) {
        continue;
      }

      curLineRuns.push(run);
      curLineWidth += run.width;
    }
    if (curLineRuns.length > 0 || lines.length === 0) {
      lines.push({ runs: curLineRuns, lineWidth: curLineWidth });
    }

    // 3. Çok satırlı blok boyutları ve 9 Attachment noktası ofsetleri
    const lineSpacing = baseHeight * (mtextEnt.lineSpacingFactor || 1.66);
    const totalLines = Math.max(1, lines.length);
    const maxLineWidth = Math.max(...lines.map((l) => l.lineWidth), 0);
    const blockWidth = refWidth > 0 ? Math.max(refWidth, maxLineWidth) : maxLineWidth;
    const blockHeight = (totalLines - 1) * lineSpacing + baseHeight;

    // Attachment noktası ofsetleri (CAD uzayında Y yukarı doğrudur)
    let blockOffsetX = 0;
    let blockOffsetY = 0;

    switch (attachPoint) {
      case 1: // Top Left
        blockOffsetX = 0;
        blockOffsetY = 0;
        break;
      case 2: // Top Center
        blockOffsetX = -blockWidth / 2;
        blockOffsetY = 0;
        break;
      case 3: // Top Right
        blockOffsetX = -blockWidth;
        blockOffsetY = 0;
        break;
      case 4: // Middle Left
        blockOffsetX = 0;
        blockOffsetY = blockHeight / 2;
        break;
      case 5: // Middle Center
        blockOffsetX = -blockWidth / 2;
        blockOffsetY = blockHeight / 2;
        break;
      case 6: // Middle Right
        blockOffsetX = -blockWidth;
        blockOffsetY = blockHeight / 2;
        break;
      case 7: // Bottom Left
        blockOffsetX = 0;
        blockOffsetY = blockHeight;
        break;
      case 8: // Bottom Center
        blockOffsetX = -blockWidth / 2;
        blockOffsetY = blockHeight;
        break;
      case 9: // Bottom Right
        blockOffsetX = -blockWidth;
        blockOffsetY = blockHeight;
        break;
      default:
        blockOffsetX = 0;
        blockOffsetY = 0;
        break;
    }

    const segments: TextGlyphSegment[] = [];
    const cos = Math.cos(rotationRad);
    const sin = Math.sin(rotationRad);

    const transformPt = (lx: number, ly: number): CadPoint2D => {
      const rx = lx * cos - ly * sin + insertionPoint[0];
      const ry = lx * sin + ly * cos + insertionPoint[1];
      return [rx, ry];
    };

    // 4. Background Mask (Arka plan maskeleme dikdörtgeni)
    if (mtextEnt.backgroundMask || options?.drawBackgroundMask) {
      const margin = baseHeight * 0.2;
      const b0 = transformPt(blockOffsetX - margin, blockOffsetY + margin);
      const b1 = transformPt(blockOffsetX + blockWidth + margin, blockOffsetY + margin);
      const b2 = transformPt(blockOffsetX + blockWidth + margin, blockOffsetY - blockHeight - margin);
      const b3 = transformPt(blockOffsetX - margin, blockOffsetY - blockHeight - margin);

      const maskBox = [
        [b0, b1],
        [b1, b2],
        [b2, b3],
        [b3, b0],
      ];
      for (const [p0, p1] of maskBox) {
        segments.push({
          x0: p0[0],
          y0: p0[1],
          x1: p1[0],
          y1: p1[1],
          layer: mtextEnt.layer,
          order: mtextEnt.order,
          color: mtextEnt.color,
          isContour: false,
        });
      }
    }

    // 5. Satırları ve Glifleri Dünya Uzayına Derle
    for (let lIdx = 0; lIdx < lines.length; lIdx++) {
      const line = lines[lIdx];
      // CAD'de 0. satır üstte, sonraki satırlar negatif Y yönünde ilerler
      const baselineY = blockOffsetY - baseHeight * 0.7 - lIdx * lineSpacing;

      let lineStartX = blockOffsetX;
      // Kolon içi hizalama: attachment noktasına göre sol/orta/sağ
      if (attachPoint === 2 || attachPoint === 5 || attachPoint === 8) {
        lineStartX = blockOffsetX + (blockWidth - line.lineWidth) / 2;
      } else if (attachPoint === 3 || attachPoint === 6 || attachPoint === 9) {
        lineStartX = blockOffsetX + (blockWidth - line.lineWidth);
      }

      let cursorX = lineStartX;

      for (const run of line.runs) {
        const runColor = run.color || mtextEnt.color;

        if (run.isStack && run.stackNumerator !== undefined && run.stackDenominator !== undefined) {
          // STACKED FRACTION Çizimi
          const fracH = run.height * 0.65;
          const wNum = this.measureTextWidth(run.font, run.stackNumerator, fracH);
          const wDen = this.measureTextWidth(run.font, run.stackDenominator, fracH);
          const stackW = run.width;

          // Pay (Numerator)
          const numX = cursorX + (stackW - wNum) / 2;
          const numY = baselineY + run.height * 0.45;
          this.renderPathToSegments(
            run.font.getPath(run.stackNumerator, 0, 0, fracH),
            runColor,
            mtextEnt.layer,
            mtextEnt.order,
            (gx, gy) => transformPt(numX + gx, numY + gy),
            segments
          );

          // Payda (Denominator)
          const denX = cursorX + (stackW - wDen) / 2;
          const denY = baselineY - run.height * 0.25;
          this.renderPathToSegments(
            run.font.getPath(run.stackDenominator, 0, 0, fracH),
            runColor,
            mtextEnt.layer,
            mtextEnt.order,
            (gx, gy) => transformPt(denX + gx, denY + gy),
            segments
          );

          // Kesir çizgisi: / (yatay) veya # (çapraz)
          if (run.stackType === "/") {
            const barY = baselineY + run.height * 0.35;
            const p0 = transformPt(cursorX, barY);
            const p1 = transformPt(cursorX + stackW, barY);
            segments.push({
              x0: p0[0],
              y0: p0[1],
              x1: p1[0],
              y1: p1[1],
              layer: mtextEnt.layer,
              order: mtextEnt.order,
              color: runColor,
              isContour: false,
            });
          } else if (run.stackType === "#") {
            const p0 = transformPt(cursorX + run.height * 0.05, baselineY - run.height * 0.1);
            const p1 = transformPt(cursorX + stackW - run.height * 0.05, baselineY + run.height * 0.7);
            segments.push({
              x0: p0[0],
              y0: p0[1],
              x1: p1[0],
              y1: p1[1],
              layer: mtextEnt.layer,
              order: mtextEnt.order,
              color: runColor,
              isContour: false,
            });
          }
          cursorX += stackW;
        } else if (!run.isSpace && run.text) {
          // Normal Metin Run Çizimi
          const pathObj = run.font.getPath(run.text, 0, 0, run.height);
          const tanObl = run.obliqueDeg ? Math.tan((run.obliqueDeg * Math.PI) / 180) : 0;

          this.renderPathToSegments(
            pathObj,
            runColor,
            mtextEnt.layer,
            mtextEnt.order,
            (gx, gy) => {
              // Oblique ve width factor uygula
              let x = gx * run.widthFactor;
              let y = gy;
              if (tanObl !== 0) {
                x += y * tanObl;
              }
              return transformPt(cursorX + x, baselineY + y);
            },
            segments
          );

          // Alt Çizgi (Underline)
          if (run.underline) {
            const uy = baselineY - run.height * 0.15;
            const p0 = transformPt(cursorX, uy);
            const p1 = transformPt(cursorX + run.width, uy);
            segments.push({
              x0: p0[0],
              y0: p0[1],
              x1: p1[0],
              y1: p1[1],
              layer: mtextEnt.layer,
              order: mtextEnt.order,
              color: runColor,
              isContour: false,
            });
          }

          // Üst Çizgi (Overline)
          if (run.overline) {
            const oy = baselineY + run.height * 1.05;
            const p0 = transformPt(cursorX, oy);
            const p1 = transformPt(cursorX + run.width, oy);
            segments.push({
              x0: p0[0],
              y0: p0[1],
              x1: p1[0],
              y1: p1[1],
              layer: mtextEnt.layer,
              order: mtextEnt.order,
              color: runColor,
              isContour: false,
            });
          }

          cursorX += run.width;
        } else {
          cursorX += run.width;
        }
      }
    }

    // BBox hesapla
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const seg of segments) {
      minX = Math.min(minX, seg.x0, seg.x1);
      minY = Math.min(minY, seg.y0, seg.y1);
      maxX = Math.max(maxX, seg.x0, seg.x1);
      maxY = Math.max(maxY, seg.y0, seg.y1);
    }
    if (!Number.isFinite(minX)) {
      minX = insertionPoint[0];
      minY = insertionPoint[1];
      maxX = insertionPoint[0];
      maxY = insertionPoint[1];
    }

    return {
      segments,
      bbox: [minX, minY, maxX, maxY],
      resolvedFont: resolved,
      isExact: resolved.status === "exact",
      advanceWidth: maxLineWidth,
      height: blockHeight,
      baseline: transformPt(blockOffsetX, blockOffsetY - baseHeight * 0.7),
      anchor: insertionPoint,
    };
  }

  /**
   * opentype.js Path komutlarını dönüştürülmüş 2D çizgi parçalarına yazar
   */
  private static renderPathToSegments(
    pathObj: opentype.Path,
    color: CadColor | undefined,
    layer: string,
    order: bigint,
    transformFn: (gx: number, gy: number) => CadPoint2D,
    outSegments: TextGlyphSegment[]
  ): void {
    let currX = 0;
    let currY = 0;
    let startX = 0;
    let startY = 0;

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
          const p0 = transformFn(currX, -currY);
          const p1 = transformFn(cmd.x, -cmd.y);
          outSegments.push({
            x0: p0[0],
            y0: p0[1],
            x1: p1[0],
            y1: p1[1],
            layer,
            order,
            color,
            isContour: true,
          });
          currX = cmd.x;
          currY = cmd.y;
          break;
        }

        case "Q": {
          const steps = 4;
          const x1 = cmd.x1 ?? cmd.x;
          const y1 = cmd.y1 ?? cmd.y;
          let prevP = transformFn(currX, -currY);
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const it = 1 - t;
            const qx = it * it * currX + 2 * it * t * x1 + t * t * cmd.x;
            const qy = it * it * currY + 2 * it * t * y1 + t * t * cmd.y;
            const nextP = transformFn(qx, -qy);
            outSegments.push({
              x0: prevP[0],
              y0: prevP[1],
              x1: nextP[0],
              y1: nextP[1],
              layer,
              order,
              color,
              isContour: true,
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
          let prevP = transformFn(currX, -currY);
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
            const nextP = transformFn(cx, -cy);
            outSegments.push({
              x0: prevP[0],
              y0: prevP[1],
              x1: nextP[0],
              y1: nextP[1],
              layer,
              order,
              color,
              isContour: true,
            });
            prevP = nextP;
          }
          currX = cmd.x;
          currY = cmd.y;
          break;
        }

        case "Z": {
          if (currX !== startX || currY !== startY) {
            const p0 = transformFn(currX, -currY);
            const p1 = transformFn(startX, -startY);
            outSegments.push({
              x0: p0[0],
              y0: p0[1],
              x1: p1[0],
              y1: p1[1],
              layer,
              order,
              color,
              isContour: true,
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
  }
}

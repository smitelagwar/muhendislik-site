// ============================================================================
// DWG/DXF MOTOR V2 — AUTOCAD COLOR INDEX (ACI 1-255) & FIDELITY COLOR RESOLVER
// ============================================================================
// Sözleşme: motor_v2/00_BAGLAYICI_UYGULAMA_KARARLARI.md (D01, D06),
// 24_GEREKSINIM_KATALOGU.md (R06, R32), 32_KULLANICI_HEDEFI_VE_GERCEK_KABUL.md (U1),
// DWG_DXF_Motor_V2_Kanitli_Kok_Neden_ve_Fidelity_Gemini_Uygulama_Plani_v3.md (F01)
//
// Standart AutoCAD 256 renk tablosu, sRGB çalışma uzayı, ACI 7 (arka plan uyarlamalı
// beyaz/siyah), ByLayer, recursive ByBlock ve Layer 0 hiyerarşik renk/stil çözümleyicisi.

import type { CadColor, CadEntity, CadInsertEntity, CadLayer } from "../canonical/types";

/**
 * Standart AutoCAD Color Index (ACI 0 - 255) RGB [0..1] normalize tablosu
 */
export const ACI_COLOR_TABLE: Array<[number, number, number]> = [
  [0, 0, 0], // 0: ByBlock (varsayılan siyah/arka plan)
  [1, 0, 0], // 1: Kırmızı
  [1, 1, 0], // 2: Sarı
  [0, 1, 0], // 3: Yeşil
  [0, 1, 1], // 4: Camgöbeği (Cyan)
  [0, 0, 1], // 5: Mavi
  [1, 0, 1], // 6: Macenta
  [1, 1, 1], // 7: Beyaz / Siyah (arka plana göre uyarlamalı)
  [0.5, 0.5, 0.5], // 8: Koyu Gri
  [0.75, 0.75, 0.75], // 9: Açık Gri
  // 10 - 249 Standart AutoCAD Renk Yelpazesi
  [1, 0, 0], [1, 0.5, 0.5], [0.8, 0, 0], [0.8, 0.4, 0.4], [0.6, 0, 0], [0.6, 0.3, 0.3], [0.4, 0, 0], [0.4, 0.2, 0.2], [0.2, 0, 0], [0.2, 0.1, 0.1],
  [1, 0.25, 0], [1, 0.62, 0.5], [0.8, 0.2, 0], [0.8, 0.5, 0.4], [0.6, 0.15, 0], [0.6, 0.38, 0.3], [0.4, 0.1, 0], [0.4, 0.25, 0.2], [0.2, 0.05, 0], [0.2, 0.12, 0.1],
  [1, 0.5, 0], [1, 0.75, 0.5], [0.8, 0.4, 0], [0.8, 0.6, 0.4], [0.6, 0.3, 0], [0.6, 0.45, 0.3], [0.4, 0.2, 0], [0.4, 0.3, 0.2], [0.2, 0.1, 0], [0.2, 0.15, 0.1],
  [1, 0.75, 0], [1, 0.88, 0.5], [0.8, 0.6, 0], [0.8, 0.7, 0.4], [0.6, 0.45, 0], [0.6, 0.52, 0.3], [0.4, 0.3, 0], [0.4, 0.35, 0.2], [0.2, 0.15, 0], [0.2, 0.18, 0.1],
  [1, 1, 0], [1, 1, 0.5], [0.8, 0.8, 0], [0.8, 0.8, 0.4], [0.6, 0.6, 0], [0.6, 0.6, 0.3], [0.4, 0.4, 0], [0.4, 0.4, 0.2], [0.2, 0.2, 0], [0.2, 0.2, 0.1],
  [0.75, 1, 0], [0.88, 1, 0.5], [0.6, 0.8, 0], [0.7, 0.8, 0.4], [0.45, 0.6, 0], [0.52, 0.6, 0.3], [0.3, 0.4, 0], [0.35, 0.4, 0.2], [0.15, 0.2, 0], [0.18, 0.2, 0.1],
  [0.5, 1, 0], [0.75, 1, 0.5], [0.4, 0.8, 0], [0.6, 0.8, 0.4], [0.3, 0.6, 0], [0.45, 0.6, 0.3], [0.2, 0.4, 0], [0.3, 0.4, 0.2], [0.1, 0.2, 0], [0.15, 0.2, 0.1],
  [0.25, 1, 0], [0.62, 1, 0.5], [0.2, 0.8, 0], [0.5, 0.8, 0.4], [0.15, 0.6, 0], [0.38, 0.6, 0.3], [0.1, 0.4, 0], [0.25, 0.4, 0.2], [0.05, 0.2, 0], [0.12, 0.2, 0.1],
  [0, 1, 0], [0.5, 1, 0.5], [0, 0.8, 0], [0.4, 0.8, 0.4], [0, 0.6, 0], [0.3, 0.6, 0.3], [0, 0.4, 0], [0.2, 0.4, 0.2], [0, 0.2, 0], [0.1, 0.2, 0.1],
  [0, 1, 0.25], [0.5, 1, 0.62], [0, 0.8, 0.2], [0.4, 0.8, 0.5], [0, 0.6, 0.15], [0.3, 0.6, 0.38], [0, 0.4, 0.1], [0.2, 0.4, 0.25], [0, 0.2, 0.05], [0.1, 0.2, 0.12],
  [0, 1, 0.5], [0.5, 1, 0.75], [0, 0.8, 0.4], [0.4, 0.8, 0.6], [0, 0.6, 0.3], [0.3, 0.6, 0.45], [0, 0.4, 0.2], [0.2, 0.4, 0.3], [0, 0.2, 0.1], [0.1, 0.2, 0.15],
  [0, 1, 0.75], [0.5, 1, 0.88], [0, 0.8, 0.6], [0.4, 0.8, 0.7], [0, 0.6, 0.45], [0.3, 0.6, 0.52], [0, 0.4, 0.3], [0.2, 0.4, 0.35], [0, 0.2, 0.15], [0.1, 0.2, 0.18],
  [0, 1, 1], [0.5, 1, 1], [0, 0.8, 0.8], [0.4, 0.8, 0.8], [0, 0.6, 0.6], [0.3, 0.6, 0.6], [0, 0.4, 0.4], [0.2, 0.4, 0.4], [0, 0.2, 0.2], [0.1, 0.2, 0.2],
  [0, 0.75, 1], [0.5, 0.88, 1], [0, 0.6, 0.8], [0.4, 0.7, 0.8], [0, 0.45, 0.6], [0.3, 0.52, 0.6], [0, 0.3, 0.4], [0.2, 0.35, 0.4], [0, 0.15, 0.2], [0.1, 0.18, 0.2],
  [0, 0.5, 1], [0.5, 0.75, 1], [0, 0.4, 0.8], [0.4, 0.6, 0.8], [0, 0.3, 0.6], [0.3, 0.45, 0.6], [0, 0.2, 0.4], [0.2, 0.3, 0.4], [0, 0.1, 0.2], [0.1, 0.15, 0.2],
  [0, 0.25, 1], [0.5, 0.62, 1], [0, 0.2, 0.8], [0.4, 0.5, 0.8], [0, 0.15, 0.6], [0.3, 0.38, 0.6], [0, 0.1, 0.4], [0.2, 0.25, 0.4], [0, 0.05, 0.2], [0.1, 0.12, 0.2],
  [0, 0, 1], [0.5, 0.5, 1], [0, 0, 0.8], [0.4, 0.4, 0.8], [0, 0, 0.6], [0.3, 0.3, 0.6], [0, 0, 0.4], [0.2, 0.2, 0.4], [0, 0, 0.2], [0.1, 0.1, 0.2],
  [0.25, 0, 1], [0.62, 0.5, 1], [0.2, 0, 0.8], [0.5, 0.4, 0.8], [0.15, 0, 0.6], [0.38, 0.3, 0.6], [0.1, 0, 0.4], [0.25, 0.2, 0.4], [0.05, 0, 0.2], [0.12, 0.1, 0.2],
  [0.5, 0, 1], [0.75, 0.5, 1], [0.4, 0, 0.8], [0.6, 0.4, 0.8], [0.3, 0, 0.6], [0.45, 0.3, 0.6], [0.2, 0, 0.4], [0.3, 0.2, 0.4], [0.1, 0, 0.2], [0.15, 0.1, 0.2],
  [0.75, 0, 1], [0.88, 0.5, 1], [0.6, 0, 0.8], [0.7, 0.4, 0.8], [0.45, 0, 0.6], [0.52, 0.3, 0.6], [0.3, 0, 0.4], [0.35, 0.2, 0.4], [0.15, 0, 0.2], [0.18, 0.1, 0.2],
  [1, 0, 1], [1, 0.5, 1], [0.8, 0, 0.8], [0.8, 0.4, 0.8], [0.6, 0, 0.6], [0.6, 0.3, 0.6], [0.4, 0, 0.4], [0.4, 0.2, 0.4], [0.2, 0, 0.2], [0.2, 0.1, 0.2],
  [1, 0, 0.75], [1, 0.5, 0.88], [0.8, 0, 0.6], [0.8, 0.4, 0.7], [0.6, 0, 0.45], [0.6, 0.3, 0.52], [0.4, 0, 0.3], [0.4, 0.2, 0.35], [0.2, 0, 0.15], [0.2, 0.1, 0.18],
  [1, 0, 0.5], [1, 0.5, 0.75], [0.8, 0, 0.4], [0.8, 0.4, 0.6], [0.6, 0, 0.3], [0.6, 0.3, 0.45], [0.4, 0, 0.2], [0.4, 0.2, 0.3], [0.2, 0, 0.1], [0.2, 0.1, 0.15],
  [1, 0, 0.25], [1, 0.5, 0.62], [0.8, 0, 0.2], [0.8, 0.4, 0.5], [0.6, 0, 0.15], [0.6, 0.3, 0.38], [0.4, 0, 0.1], [0.4, 0.2, 0.25], [0.2, 0, 0.05], [0.2, 0.1, 0.12],
  // Gri Tonları (250-255)
  [0.33, 0.33, 0.33],
  [0.46, 0.46, 0.46],
  [0.60, 0.60, 0.60],
  [0.73, 0.73, 0.73],
  [0.86, 0.86, 0.86],
  [1.0, 1.0, 1.0],
];

/**
 * ACI (AutoCAD Color Index) numarasını RGB [0..1] üçlüsüne çevirir
 */
export function aciToRgb(aci: number): [number, number, number] {
  if (!Number.isFinite(aci)) return [1, 1, 1];
  const idx = Math.abs(Math.round(aci));
  if (idx >= 0 && idx < ACI_COLOR_TABLE.length) {
    return ACI_COLOR_TABLE[idx];
  }
  return [1, 1, 1]; // Bilinmeyen renk için varsayılan beyaz
}

/**
 * ACI numarasını integer RGB [0..255] üçlüsüne çevirir
 */
export function aciToRgb255(aci: number): [number, number, number] {
  const [r, g, b] = aciToRgb(aci);
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * RGB [0..1] değerlerini hexadecimal dizeye çevirir (örn: "#ffffff")
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const rByte = Math.max(0, Math.min(255, Math.round(r * 255)));
  const gByte = Math.max(0, Math.min(255, Math.round(g * 255)));
  const bByte = Math.max(0, Math.min(255, Math.round(b * 255)));
  return `#${((1 << 24) + (rByte << 16) + (gByte << 8) + bByte).toString(16).slice(1)}`;
}

/**
 * RGB [0..1] değerlerini sayısal hexadecimal değere çevirir (örn: 0xffffff)
 */
export function rgbToHexNumber(r: number, g: number, b: number): number {
  const rByte = Math.max(0, Math.min(255, Math.round(r * 255)));
  const gByte = Math.max(0, Math.min(255, Math.round(g * 255)));
  const bByte = Math.max(0, Math.min(255, Math.round(b * 255)));
  return (rByte << 16) | (gByte << 8) | bByte;
}

/**
 * CadColor tanımını RGB [0..1] üçlüsüne çevirir (ByLayer/ByBlock için null döner)
 */
export function cadColorToRgb(color: CadColor | undefined): [number, number, number] | null {
  if (!color) return null;

  if (color.method === "rgb" && color.rgb && color.rgb.length === 3) {
    return [
      Math.max(0, Math.min(1, color.rgb[0] / 255)),
      Math.max(0, Math.min(1, color.rgb[1] / 255)),
      Math.max(0, Math.min(1, color.rgb[2] / 255)),
    ];
  }

  if (color.method === "aci" && typeof color.aci === "number") {
    if (color.aci === 0 || color.aci === 256) return null;
    return aciToRgb(color.aci);
  }

  return null;
}

/**
 * Çözümlenmiş CAD renk ve stil sonucu
 */
export interface ResolvedCadColor {
  /** sRGB [0..1] bileşenleri */
  rgb: [number, number, number];
  /** sRGB [0..255] byte bileşenleri */
  rgb255: [number, number, number];
  /** Saydamlık opaklığı [0..1] (1.0 = tam opak, 0.0 = tam şeffaf) */
  alpha: number;
  /** True ise ACI 7 (arka plan uyarlamalı: koyuda beyaz, açıkta koyu mürekkep) */
  isAci7: boolean;
  /** Çözümlenen kaynak yöntem */
  sourceMethod: "rgb" | "aci" | "byLayer" | "byBlock";
  /** ACI indeksi (varsa) */
  aci?: number;
  /** Hex renk dizesi ("#ffffff") */
  hex: string;
  /** Hex renk sayısı (0xffffff) */
  hexNumber: number;
}

/**
 * Renk çözümleme bağlamı (Layer 0, INSERT hiyerarşisi, Viewport override)
 */
export interface ColorResolutionContext {
  /** Blok içi Layer 0 kalıtımı için geçerli katman */
  effectiveLayer?: string;
  /** Kökten en yakın ebeveyne kadar INSERT yığını */
  parentInserts?: CadInsertEntity[];
  /** En yakın ebeveyn INSERT */
  parentInsert?: CadInsertEntity;
  /** Viewport katman ezmeleri (VPLAYER overrides) */
  layerOverrides?: Record<string, Partial<CadLayer>>;
  /** Viewport ID */
  viewportId?: string;
  /** ACI 7 testi için arka plan türü */
  backgroundMode?: "dark" | "light" | "autocad";
}

/**
 * AutoCAD kuralı: Belirtilen varlık için kesin renk, katman, ByBlock ve saydamlık çözümler.
 *
 * Kurallar:
 * 1. Açık TrueColor RGB ({ method: "rgb" }) -> doğrudan RGB kullanılır, isAci7 = false.
 * 2. Açık ACI ({ method: "aci" }) -> ACI tablosundan çözümlenir. aci === 7 ise isAci7 = true.
 * 3. ByBlock ({ method: "byBlock" veya aci === 0 }) -> En yakın ebeveyn INSERT'in çözümlenmiş stili.
 *    Ebeveyn de ByBlock ise INSERT yığınında yukarı yürür. Kök de ByBlock ise kök INSERT katmanına çözümlenir.
 * 4. ByLayer ({ method: "byLayer", aci === 256 veya tanımsız }) -> Varlığın geçerli katmanının rengi.
 * 5. Layer 0 kalıtımı -> Varlık "0" katmanındaysa ve blok içindeyse (effectiveLayer varsa),
 *    katman olarak effectiveLayer kullanılır.
 * 6. Viewport override -> layerOverrides içinde katman için renk varsa önceliklidir.
 */
export function resolveCadStyle(
  ent: Pick<CadEntity, "color" | "layer">,
  layers: Record<string, CadLayer>,
  ctx?: ColorResolutionContext
): ResolvedCadColor {
  // 1. Hedef katmanı belirle (Layer 0 kalıtımı)
  const rawLayer = ent.layer || "0";
  const targetLayer = rawLayer === "0" && ctx?.effectiveLayer ? ctx.effectiveLayer : rawLayer;

  // 2. Katman tanımını ve varsa viewport ezmesini bul
  const baseLayer = layers[targetLayer];
  const overrideLayer = ctx?.layerOverrides?.[targetLayer];
  const effectiveLayerDef: Partial<CadLayer> | undefined = overrideLayer || baseLayer;

  // 3. Saydamlık (alpha) başlangıç değeri: ent'ten veya katmandan
  let alpha = 1.0;
  if (typeof ent.color?.alpha === "number") {
    alpha = Math.max(0, Math.min(1, ent.color.alpha));
  } else if (typeof effectiveLayerDef?.color?.alpha === "number") {
    alpha = Math.max(0, Math.min(1, effectiveLayerDef.color.alpha));
  }

  // 4. Renk çözümleme dalları
  const color = ent.color;

  // Dal A: Açık TrueColor RGB
  if (color && color.method === "rgb" && color.rgb && color.rgb.length === 3) {
    const r = Math.max(0, Math.min(1, color.rgb[0] / 255));
    const g = Math.max(0, Math.min(1, color.rgb[1] / 255));
    const b = Math.max(0, Math.min(1, color.rgb[2] / 255));
    return {
      rgb: [r, g, b],
      rgb255: [color.rgb[0], color.rgb[1], color.rgb[2]],
      alpha,
      isAci7: false,
      sourceMethod: "rgb",
      aci: color.aci,
      hex: rgbToHex(r, g, b),
      hexNumber: rgbToHexNumber(r, g, b),
    };
  }

  // Dal B: Açık ACI (1..255, 0 ve 256 hariç)
  if (color && color.method === "aci" && typeof color.aci === "number" && color.aci !== 0 && color.aci !== 256) {
    const aci = color.aci;
    const isAci7 = aci === 7;
    const rgb = aciToRgb(aci);
    return {
      rgb,
      rgb255: [Math.round(rgb[0] * 255), Math.round(rgb[1] * 255), Math.round(rgb[2] * 255)],
      alpha,
      isAci7,
      sourceMethod: "aci",
      aci,
      hex: rgbToHex(rgb[0], rgb[1], rgb[2]),
      hexNumber: rgbToHexNumber(rgb[0], rgb[1], rgb[2]),
    };
  }

  // Dal C: ByBlock (açıkça byBlock veya aci === 0)
  const isByBlock = color?.method === "byBlock" || (color?.method === "aci" && color.aci === 0);
  if (isByBlock) {
    // Ebeveyn INSERT yığınını oluştur (en yakından köke doğru)
    const insertStack: CadInsertEntity[] = [];
    if (ctx?.parentInserts && ctx.parentInserts.length > 0) {
      insertStack.push(...ctx.parentInserts);
    } else if (ctx?.parentInsert) {
      insertStack.push(ctx.parentInsert);
    }

    // Yığında en yakından köke doğru ilk açık veya ByLayer rengi ara
    for (let i = insertStack.length - 1; i >= 0; i--) {
      const anc = insertStack[i];
      const ancCol = anc.color;

      // Ancestor saydamlığı varsa miras al
      if (typeof ancCol?.alpha === "number" && ent.color?.alpha === undefined) {
        alpha = Math.max(0, Math.min(1, ancCol.alpha));
      }

      if (ancCol && ancCol.method === "rgb" && ancCol.rgb && ancCol.rgb.length === 3) {
        const r = Math.max(0, Math.min(1, ancCol.rgb[0] / 255));
        const g = Math.max(0, Math.min(1, ancCol.rgb[1] / 255));
        const b = Math.max(0, Math.min(1, ancCol.rgb[2] / 255));
        return {
          rgb: [r, g, b],
          rgb255: [ancCol.rgb[0], ancCol.rgb[1], ancCol.rgb[2]],
          alpha,
          isAci7: false,
          sourceMethod: "byBlock",
          aci: ancCol.aci,
          hex: rgbToHex(r, g, b),
          hexNumber: rgbToHexNumber(r, g, b),
        };
      }

      if (ancCol && ancCol.method === "aci" && typeof ancCol.aci === "number" && ancCol.aci !== 0 && ancCol.aci !== 256) {
        const isAci7 = ancCol.aci === 7;
        const rgb = aciToRgb(ancCol.aci);
        return {
          rgb,
          rgb255: [Math.round(rgb[0] * 255), Math.round(rgb[1] * 255), Math.round(rgb[2] * 255)],
          alpha,
          isAci7,
          sourceMethod: "byBlock",
          aci: ancCol.aci,
          hex: rgbToHex(rgb[0], rgb[1], rgb[2]),
          hexNumber: rgbToHexNumber(rgb[0], rgb[1], rgb[2]),
        };
      }

      // Ancestor ByLayer ise veya rengi tanımsızsa (varsayılan ByLayer), o ancestor katmanının rengini al
      if (!ancCol || ancCol.method === "byLayer" || ancCol.aci === 256) {
        const ancLyrName = anc.layer || "0";
        const ancLyr = ctx?.layerOverrides?.[ancLyrName] || layers[ancLyrName];
        if (ancLyr && ancLyr.color) {
          const res = resolveCadStyle({ color: ancLyr.color, layer: ancLyrName }, layers);
          return {
            ...res,
            alpha: ent.color?.alpha ?? ancLyr.color.alpha ?? 1.0,
            sourceMethod: "byBlock",
          };
        }
        return {
          rgb: [1, 1, 1],
          rgb255: [255, 255, 255],
          alpha,
          isAci7: true,
          sourceMethod: "byBlock",
          aci: 7,
          hex: "#ffffff",
          hexNumber: 0xffffff,
        };
      }

      // ancCol.method === "byBlock" ise bir üst ebeveyne devam et
    }

    // Yığında non-byBlock bulunamadıysa veya ebeveyn yoksa (top-level ByBlock)
    // AutoCAD kuralı: Kök katman rengi veya ACI 7
    if (effectiveLayerDef && effectiveLayerDef.color) {
      const res = resolveCadStyle({ color: effectiveLayerDef.color, layer: targetLayer }, layers);
      return {
        ...res,
        alpha,
        sourceMethod: "byBlock",
      };
    }
    return {
      rgb: [1, 1, 1],
      rgb255: [255, 255, 255],
      alpha,
      isAci7: true,
      sourceMethod: "byBlock",
      aci: 7,
      hex: "#ffffff",
      hexNumber: 0xffffff,
    };
  }

  // Dal D: ByLayer (açıkça byLayer veya renk tanımsız)
  if (effectiveLayerDef && effectiveLayerDef.color) {
    const lyrColor = effectiveLayerDef.color;

    if (lyrColor.method === "rgb" && lyrColor.rgb && lyrColor.rgb.length === 3) {
      const r = Math.max(0, Math.min(1, lyrColor.rgb[0] / 255));
      const g = Math.max(0, Math.min(1, lyrColor.rgb[1] / 255));
      const b = Math.max(0, Math.min(1, lyrColor.rgb[2] / 255));
      return {
        rgb: [r, g, b],
        rgb255: [lyrColor.rgb[0], lyrColor.rgb[1], lyrColor.rgb[2]],
        alpha,
        isAci7: false,
        sourceMethod: "byLayer",
        aci: lyrColor.aci,
        hex: rgbToHex(r, g, b),
        hexNumber: rgbToHexNumber(r, g, b),
      };
    }

    if (lyrColor.method === "aci" && typeof lyrColor.aci === "number" && lyrColor.aci !== 0 && lyrColor.aci !== 256) {
      const isAci7 = lyrColor.aci === 7;
      const rgb = aciToRgb(lyrColor.aci);
      return {
        rgb,
        rgb255: [Math.round(rgb[0] * 255), Math.round(rgb[1] * 255), Math.round(rgb[2] * 255)],
        alpha,
        isAci7,
        sourceMethod: "byLayer",
        aci: lyrColor.aci,
        hex: rgbToHex(rgb[0], rgb[1], rgb[2]),
        hexNumber: rgbToHexNumber(rgb[0], rgb[1], rgb[2]),
      };
    }
  }

  // Standart fallback: ACI 7 (Beyaz / Uyarlamalı)
  return {
    rgb: [1, 1, 1],
    rgb255: [255, 255, 255],
    alpha,
    isAci7: true,
    sourceMethod: "byLayer",
    aci: 7,
    hex: "#ffffff",
    hexNumber: 0xffffff,
  };
}

/**
 * ACI 7 uyarlamalı rengi arka plan rengine göre kesin RGB'ye dönüştürür.
 * Açık TrueColor veya ACI 1-6/8-255 ise ASLA rengi değiştirmez!
 */
export function getAdaptiveRgb(
  resolved: ResolvedCadColor,
  isLightBackground: boolean
): [number, number, number] {
  if (resolved.isAci7 && isLightBackground) {
    // Açık arka planda ACI 7 siyah/koyu mürekkebe döner
    return [0.08, 0.08, 0.08];
  }
  return resolved.rgb;
}

/**
 * Geriye dönük uyumluluk: Bir varlık ve katmanlar kümesinden nihai çizim RGB rengini çözümler.
 */
export function resolveEntityColor(
  ent: Pick<CadEntity, "color" | "layer">,
  layers: Record<string, CadLayer>,
  ctx?: ColorResolutionContext
): [number, number, number] {
  return resolveCadStyle(ent, layers, ctx).rgb;
}

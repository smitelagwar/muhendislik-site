import type { IdeProject } from "./ide-import";
import {
  transcodeIde10ToIde11,
  transcodeIde11TrialToIde10,
  transcodeIde11TrialToIde11,
} from "./ide-import/ide11-transcoder";
import type { NativeIdeFormat } from "./ide-import/ide-binary-codec";

/** "Dönüştür + indir" hedefi; "kaydet" akışı (`ide-native-save.ts`) değildir. */
export type NativeIdeDownloadTarget = "ide11" | "ide10";

export interface NativeIdeDownloadTargets {
  ide11: boolean;
  ide10: boolean;
}

/**
 * Menü görünürlük/etkinlik mantığı (saf, tarayıcı-güvenli).
 *
 * Sürüm dönüşümü yalnız IDE11 şemasında kanıtlandı: kaynak dosya seçili VE
 * proje biçimi "ide11trial" veya "ide11" iken iki hedef de açılır. `.ide10`
 * kaynağından dönüşüm ve `.cde` dönüşümü kanıtlanmadığı için dürüst red
 * olarak kapalı kalır (false). Her iki hedef tek koşuldan türetilir.
 */
export function nativeIdeDownloadTargets(
  project: IdeProject | null,
  sourceFile?: File,
): NativeIdeDownloadTargets {
  // Türkçe: tek kanıtlanmış koşul — IDE11 şemasında kaynak dosya mevcut mu?
  const convertible = Boolean(sourceFile) &&
    (project?.format === "ide11trial" || project?.format === "ide11");
  return { ide11: convertible, ide10: convertible };
}

/**
 * Kaynak baytları senkron olarak native .ide11/.ide10 dosyasına dönüştürür.
 * Sarmalanan transcoder'ların güvenli-red davranışı aynen korunur: geçersiz
 * taşıyıcı, IDE11 şeması dışı kaynak veya doğrulanamayan kayıt eşleşmesinde
 * hata fırlatmaya devam eder; UI katmanı bu hatayı dürüstçe gösterir ve
 * yanlış dosya üretilmez. Kaynak arabelleğe asla yazılmaz.
 *
 * `.ide10` hedefi eşleşen ticari `.ide10` donörü olmadan ÜRETİLMEZ: K2/S1
 * kanıtı, donörsüz üretilen dosyanın ideCAD'de çökme verdiğini gösterdi.
 */
export function convertIdeSourceToNative(
  bytes: ArrayBuffer | Uint8Array,
  target: NativeIdeDownloadTarget,
  donor?: ArrayBuffer | Uint8Array,
): Uint8Array {
  if (target === "ide11") return transcodeIde11TrialToIde11(bytes);
  if (!donor) {
    throw new Error("Native .ide10 üretimi eşleşen ticari .ide10 dosyasını (donör) gerektirir; donör seçilmeden dönüştürme yapılmaz.");
  }
  return transcodeIde11TrialToIde10(bytes, { ide10Donor: donor instanceof Uint8Array ? donor : new Uint8Array(donor) });
}

/** Açık projeyi "farklı kaydet" hedefleri. */
export type NativeIdeSaveTarget = NativeIdeDownloadTarget;

/** Dosya adından native kaynak biçimini çıkarır (`.ide11trial` → ide11trial). */
export function ideSourceFormatOf(fileName: string): NativeIdeFormat | null {
  const match = /\.(ide11trial|ide11|ide10|cde)$/i.exec(fileName);
  return match ? (match[1].toLowerCase() as NativeIdeFormat) : null;
}

export interface NativeIdeSaveOption {
  /** Biçim her zaman seçilebilir; eksik dosya diyalog içinde istenir. */
  enabled: boolean;
  /** Kaynak ideCAD dosyası henüz seçilmedi mi? */
  needsSource: boolean;
  /** Eşleşen ticari donör zorunlu mu? */
  donorRequired: boolean;
  /** İstenen donör türü: v10 hedefi için `.ide10`, v10→v11 için `.ide11`. */
  donorFormat: "ide10" | "ide11" | null;
  /** Ne olacağını ya da neyin istendiğini açıklayan metin. */
  reason: string;
}

/** Hedef + kaynak biçimine göre kaydetme gereksinimleri (saf, tek kaynak). */
export function nativeSaveRequirement(
  target: NativeIdeSaveTarget,
  sourceFormat: NativeIdeFormat | null,
): Pick<NativeIdeSaveOption, "needsSource" | "donorRequired" | "donorFormat" | "reason"> {
  if (!sourceFormat) {
    return {
      needsSource: true,
      donorRequired: false,
      donorFormat: null,
      reason: "Kaynak ideCAD dosyası seçilmedi; kaydetmek için .ide11trial/.ide11/.ide10 dosyasını seçin.",
    };
  }
  if (sourceFormat === "cde") {
    return {
      needsSource: false,
      donorRequired: false,
      donorFormat: null,
      reason: "Sıkıştırılmış .cde gövdesi açılmıyor; kaynak olarak .ide11trial/.ide11/.ide10 dosyası seçin.",
    };
  }
  if (sourceFormat === target) {
    return {
      needsSource: false,
      donorRequired: false,
      donorFormat: null,
      reason: `Aynı biçim (.${sourceFormat} → .${target}): kaynak baytlar kopyalanır; varsa kanıtlanmış yamalar yazılır.`,
    };
  }
  if (target === "ide10") {
    return {
      needsSource: false,
      donorRequired: true,
      donorFormat: "ide10",
      reason: "Eşleşen ticari .ide10 dosyası donör olarak gerekir; donörsüz üretim ideCAD'de çöker.",
    };
  }
  if (sourceFormat === "ide10") {
    return {
      needsSource: false,
      donorRequired: true,
      donorFormat: "ide11",
      reason: "Ters yükseltme: eşleşen ticari .ide11 dosyası donör gerekir; donörsüz çıktı ideCAD'de çöküyor.",
    };
  }
  return {
    needsSource: false,
    donorRequired: false,
    donorFormat: null,
    reason: "Donörsüz sürüm dönüşümü; kaynak dosya değişmez.",
  };
}

/**
 * Açık ideCAD kaynağının native kayıt yetenekleri.
 *
 * Hiçbir biçim kapatılmaz: kaynak dosya yoksa `needsSource` ile diyalog içinde
 * tek seferlik kaynak seçimi istenir. `.ide10` hedefi eşleşen ticari donör
 * ister; `.ide10` kaynağı aynı biçimde bayt kopyası olarak yazılır ve
 * `.ide10 → .ide11` ters yükseltici (`transcodeIde10ToIde11`) kullanılır.
 */
export function nativeSaveOptions(
  project: IdeProject | null,
  sourceFile: File | undefined,
  patchCount = 0,
): Record<NativeIdeSaveTarget, NativeIdeSaveOption> {
  const format = sourceFile ? ideSourceFormatOf(sourceFile.name) : null;
  const option = (target: NativeIdeSaveTarget): NativeIdeSaveOption => {
    const requirement = nativeSaveRequirement(target, format);
    if (target === "ide10" && requirement.donorRequired && patchCount > 0) {
      return {
        enabled: true,
        ...requirement,
        reason: `${patchCount} native yama uygulanır; ${requirement.reason}`,
      };
    }
    const name = project?.filename;
    if (requirement.needsSource && name) {
      return { enabled: true, ...requirement, reason: `${requirement.reason} Proje kaynağı: ${name}.` };
    }
    return { enabled: true, ...requirement };
  };
  return { ide11: option("ide11"), ide10: option("ide10") };
}

/**
 * Kaynak baytları seçilen native biçime çevirir ("farklı kaydet").
 *
 * Matris:
 * - `.ide11trial` → `.ide11` sürüm dönüşümü, `.ide10` donörlü dönüşüm.
 * - `.ide11` → `.ide11` bayt kopyası, `.ide10` donörlü dönüşüm.
 * - `.ide10` → `.ide10` bayt kopyası, `.ide11` ters yükseltme (eşleşen .ide11 donörüyle).
 * - `.cde` → kapalı (gövde açılmıyor).
 *
 * Kopya yolları kaynağı asla değiştirmez; dönüşüm yolları transcoder'ın
 * doğrulama hatalarını aynen fırlatır (yanlış dosya üretilmez).
 */
export function convertNativeSave(
  bytes: ArrayBuffer | Uint8Array,
  sourceFormat: NativeIdeFormat,
  target: NativeIdeSaveTarget,
  donor?: ArrayBuffer | Uint8Array,
): Uint8Array {
  const source = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (sourceFormat === "cde") {
    throw new Error("Sıkıştırılmış .cde gövdesi native kayda açılmaz; kaynak olarak .ide11trial/.ide11/.ide10 seçin.");
  }
  if (target === "ide10") {
    if (sourceFormat === "ide10") return Uint8Array.from(source);
    if (!donor) {
      throw new Error("Native .ide10 üretimi eşleşen ticari .ide10 dosyasını (donör) gerektirir; donör seçilmeden dönüştürme yapılmaz.");
    }
    return transcodeIde11TrialToIde10(source, {
      ide10Donor: donor instanceof Uint8Array ? donor : new Uint8Array(donor),
    });
  }
  if (sourceFormat === "ide11") return Uint8Array.from(source);
  if (sourceFormat === "ide11trial") return transcodeIde11TrialToIde11(source);
  // .ide10 → .ide11: donörsüz v1 çıktısı ideCAD'de çöküyor (T-F4.1b, 3/3).
  // Güvenli v2, eşleşen ticari .ide11 dosyasının yerleşim nakliyle üretilir.
  if (!donor) {
    throw new Error("Ters yükseltme (.ide10 → .ide11) eşleşen ticari .ide11 dosyasını (donör) gerektirir; donörsüz çıktı ideCAD'de çöküyor.");
  }
  return transcodeIde10ToIde11(source, {
    ide11Donor: donor instanceof Uint8Array ? donor : new Uint8Array(donor),
  });
}

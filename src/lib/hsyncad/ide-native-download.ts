import type { IdeProject } from "./ide-import";
import { transcodeIde11TrialToIde10, transcodeIde11TrialToIde11 } from "./ide-import/ide11-transcoder";

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
 */
export function convertIdeSourceToNative(
  bytes: ArrayBuffer | Uint8Array,
  target: NativeIdeDownloadTarget,
): Uint8Array {
  return target === "ide11"
    ? transcodeIde11TrialToIde11(bytes)
    : transcodeIde11TrialToIde10(bytes);
}

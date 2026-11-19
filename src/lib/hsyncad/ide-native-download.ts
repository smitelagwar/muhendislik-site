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

export interface NativeIdeSaveOption {
  enabled: boolean;
  /** `.ide10` hedefi için eşleşen ticari donör zorunlu mu? */
  donorRequired: boolean;
  /** Açıklama ya da kapalıysa dürüst gerekçe. */
  reason: string;
}

/**
 * Açık ideCAD kaynağının hangi native biçimlere kaydedilebileceğini belirler.
 *
 * Kanıtlanmış kapsam (K2/S1):
 * - `.ide11trial` / `.ide11` kaynağı → `.ide11` donörsüz, `.ide10` donörlü.
 * - `.ide10` kaynağı → yalnız yerinde yamalı `.ide10`; `.ide11` dönüşümü kanıtlanmadı.
 * - `.cde` veya kaynak dosya yok → native kayıt kapalı (yanlış dosya üretilmez).
 */
export function nativeSaveOptions(
  project: IdeProject | null,
  sourceFile: File | undefined,
  patchCount = 0,
): Record<NativeIdeSaveTarget, NativeIdeSaveOption> {
  const closed = (reason: string): NativeIdeSaveOption => ({ enabled: false, donorRequired: false, reason });
  if (!sourceFile || !project) {
    const reason = "Özgün ideCAD dosyası açık değil; native kayıt için .ide11trial/.ide11 dosyasını Model aç ile yükleyin.";
    return { ide11: closed(reason), ide10: closed(reason) };
  }
  if (project.format === "ide11trial" || project.format === "ide11") {
    return {
      ide11: { enabled: true, donorRequired: false, reason: "Donörsüz sürüm dönüşümü; kaynak dosya değişmez." },
      ide10: { enabled: true, donorRequired: true, reason: "Eşleşen ticari .ide10 dosyası donör olarak gerekir." },
    };
  }
  if (project.format === "ide10") {
    return {
      ide11: closed(".ide10 kaynağından .ide11 dönüşümü kanıtlanmadı; dürüst red."),
      ide10: patchCount > 0
        ? { enabled: true, donorRequired: false, reason: `${patchCount} native yama mevcut .ide10 dosyasına yazılır.` }
        : closed("Değişiklik yok; aynı biçimde kaydetmek için en az bir native yazılabilir düzenleme gerekir."),
    };
  }
  const reason = "Sıkıştırılmış .cde kaynağı native kayda açılmaz.";
  return { ide11: closed(reason), ide10: closed(reason) };
}

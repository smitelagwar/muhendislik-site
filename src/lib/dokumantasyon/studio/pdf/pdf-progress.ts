/**
 * PDF Yükleme İlerleme Durumu ve Monotonluk Hesaplayıcısı (Plan 05 W1).
 * Ağ paketleri düzensiz gelse veya ara raporlama dalgalansa bile
 * yüklenen bayt miktarının ve ilerleme yüzdesinin ASLA geri gitmemesini garanti eder.
 */

export interface PdfProgressState {
  loaded: number;
  total: number;
}

export function computeMonotonicProgress(
  prev: PdfProgressState | null,
  next: { loaded: number; total: number }
): PdfProgressState {
  const loaded = prev ? Math.max(prev.loaded, Math.max(0, next.loaded)) : Math.max(0, next.loaded);
  const total = next.total > 0 ? next.total : prev?.total ?? 0;
  return { loaded, total };
}

export function getProgressPercentage(progress: PdfProgressState | null): number | null {
  if (!progress || progress.total <= 0) return null;
  const pct = Math.round((progress.loaded / progress.total) * 100);
  return Math.min(Math.max(pct, 0), 100);
}

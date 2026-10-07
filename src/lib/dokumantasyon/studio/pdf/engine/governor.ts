// ============================================================================
// PDF v4 MOTOR — CANVAS BELLEK YÖNETİCİSİ (Plan 03 P3.4.2)
// ----------------------------------------------------------------------------
// Bayt tabanlı muhasebe ve Safari/mobil bellek limitlerine saygılı tahliye.
// Görünür parçalar korunur; arka plana geçildiğinde bellek serbest bırakılır.
// ============================================================================

import { ByteLru } from "./lru";

export interface GovernorConfig {
  sharpBytes: number;
  backdropBytes: number;
}

export function getDefaultGovernorConfig(isMobile: boolean = false): GovernorConfig {
  let sharp = isMobile ? 48 * 1024 * 1024 : 112 * 1024 * 1024;
  let backdrop = isMobile ? 16 * 1024 * 1024 : 40 * 1024 * 1024;

  if (typeof navigator !== "undefined") {
    const mem = (navigator as any).deviceMemory;
    const cores = navigator.hardwareConcurrency;
    if ((mem && mem <= 2) || (cores && cores <= 2)) {
      sharp *= 0.6;
      backdrop *= 0.6;
    }
  }

  return { sharpBytes: Math.round(sharp), backdropBytes: Math.round(backdrop) };
}

export class Governor {
  sharp: ByteLru<string, HTMLCanvasElement>;
  backdrop: ByteLru<string, HTMLCanvasElement>;
  private visibleKeys = new Set<string>();
  private allocFailures = 0;

  constructor(private cfg: GovernorConfig = getDefaultGovernorConfig()) {
    const free = (_: string, c: HTMLCanvasElement) => {
      try {
        c.width = 0;
        c.height = 0;
      } catch {}
    };
    this.sharp = new ByteLru(cfg.sharpBytes, free);
    this.backdrop = new ByteLru(cfg.backdropBytes, free);
  }

  get sharpBytes(): number {
    return this.sharp.bytes;
  }

  get backdropBytes(): number {
    return this.backdrop.bytes;
  }

  get totalBytes(): number {
    return this.sharp.bytes + this.backdrop.bytes;
  }

  get totalBytesMB(): number {
    return Math.round((this.totalBytes / (1024 * 1024)) * 10) / 10;
  }

  get failureCount(): number {
    return this.allocFailures;
  }

  setVisible(keys: Iterable<string>): void {
    this.visibleKeys = new Set(keys);
  }

  addSharp(key: string, c: HTMLCanvasElement): void {
    this.sharp.set(key, c, c.width * c.height * 4);
    this.sharp.trim((k) => this.visibleKeys.has(k));
  }

  addBackdrop(key: string, c: HTMLCanvasElement): void {
    this.backdrop.set(key, c, c.width * c.height * 4);
    this.backdrop.trim((k) => this.visibleKeys.has(k));
  }

  /**
   * Sekme gizlendiğinde (visibility: hidden) veya bellek baskısında
   * bütçeleri belirli bir orana indirerek temizler.
   */
  trimTo(frac: number): void {
    this.sharp.setBudget(this.cfg.sharpBytes * frac);
    this.backdrop.setBudget(this.cfg.backdropBytes * frac);
    this.sharp.trim((k) => this.visibleKeys.has(k));
    this.backdrop.trim((k) => this.visibleKeys.has(k));
  }

  /**
   * getContext null veya tahsis hatası alındığında bütçeyi yarıya düşürür.
   */
  onAllocFailure(): void {
    this.allocFailures++;
    this.cfg.sharpBytes *= 0.5;
    this.cfg.backdropBytes *= 0.5;
    this.trimTo(1);
  }

  clear(): void {
    this.sharp.clear();
    this.backdrop.clear();
    this.visibleKeys.clear();
  }
}

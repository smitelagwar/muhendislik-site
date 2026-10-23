"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_FORM_SCALE,
  DEFAULT_FORM_VIEW_STATE,
  Density,
  FIT_MAX_SCALE,
  FIT_MIN_SCALE,
  FitStatus,
  FormMode,
  ManualScale,
  fitsOnBothAxes,
  loadFormViewPreference,
  saveFormViewPreference,
} from "@/lib/belge-studio-form-view";

export interface UseBelgeStudioFormViewOptions {
  /** Modal içinde mi render ediliyor? */
  isModal?: boolean;
}

export interface BelgeStudioFormViewApi {
  mode: FormMode;
  manualScale: ManualScale;
  density: Density;
  appliedScale: number;
  fitStatus: FitStatus;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  contentWrapperRef: React.RefObject<HTMLDivElement | null>;
  onChooseScale: (scale: ManualScale) => void;
  onToggleCompact: () => void;
  onFit: () => void;
  onReset: () => void;
  /** İçerik wrapper'ına doğrudan verilecek JSX props */
  contentWrapperProps: {
    ref: React.RefObject<HTMLDivElement | null>;
    "data-belge-form-content": string;
    "data-scale": number;
    "data-density": Density;
    "data-mode": FormMode;
    "data-fit-status": FitStatus;
    style: React.CSSProperties;
    className: string;
  };
}

export type BelgeStudioFormViewControls = Omit<BelgeStudioFormViewApi, "scrollContainerRef" | "contentWrapperRef" | "contentWrapperProps">;

export function useBelgeStudioFormView(
  options: UseBelgeStudioFormViewOptions = {}
): BelgeStudioFormViewApi {
  const { isModal = false } = options;
  void isModal;

  // SSR / İlk yükleme için her zaman varsayılan güvenli %100 ve normal yoğunluk
  const [mode, setMode] = useState<FormMode>(DEFAULT_FORM_VIEW_STATE.mode);
  const [manualScale, setManualScale] = useState<ManualScale>(DEFAULT_FORM_VIEW_STATE.manualScale);
  const [manualDensity, setManualDensity] = useState<Density>(DEFAULT_FORM_VIEW_STATE.manualDensity);
  const [fitScale, setFitScale] = useState<number>(DEFAULT_FORM_SCALE);
  const [fitDensity, setFitDensity] = useState<Density>("normal");
  const [fitStatus, setFitStatus] = useState<FitStatus>("idle");
  const [isHydrated, setIsHydrated] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const contentWrapperRef = useRef<HTMLDivElement | null>(null);

  // Reentrancy, batching ve observer döngü koruma ref'leri
  const isMeasuringRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const revisionRef = useRef(0);

  // SSR uses stable defaults; hydrate saved preferences in a microtask,
  // avoiding synchronous setState inside an effect during React commit.
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const pref = loadFormViewPreference();
      setMode(pref.mode);
      setManualScale(pref.manualScale);
      setManualDensity(pref.manualDensity);
      setIsHydrated(true);
    });
    return () => { cancelled = true; };
  }, []);

  // Tercih değiştiğinde kaydet
  useEffect(() => {
    if (!isHydrated) return;
    saveFormViewPreference({
      mode,
      manualScale,
      manualDensity,
    });
  }, [isHydrated, mode, manualScale, manualDensity]);

  /**
   * İki Eksenli Gerçek Fit Ölçüm Algoritması
   */
  const executeFitMeasurement = useCallback(() => {
    const scrollEl = scrollContainerRef.current;
    const contentEl = contentWrapperRef.current;

    if (!scrollEl || !contentEl) {
      setFitStatus("unavailable");
      return;
    }

    const clientWidth = scrollEl.clientWidth;
    const clientHeight = scrollEl.clientHeight;

    // Gizli / detached panel durumunda unavailable
    if (clientWidth <= 0 || clientHeight <= 0) {
      return;
    }

    // Kullanıcı o an formda yazı yazıyorsa odağı ve caret'i korumak için ölçümü ertele
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      return;
    }

    const currentRev = ++revisionRef.current;
    isMeasuringRef.current = true;

    try {
      // Ölçüm için mevcut scrollTop'ı normalize et
      const originalScrollTop = scrollEl.scrollTop;
      scrollEl.scrollTop = 0;

      const viewport = { clientWidth, clientHeight };

      // Yardımcı: Belirli scale ve density için extents ölçümü
      const testCandidate = (scale: number, density: Density) => {
        contentEl.style.zoom = scale !== 1 ? String(scale) : "";
        contentEl.className = density === "compact" ? "space-y-1.5" : "space-y-2.5";

        const scrollW = scrollEl.scrollWidth;
        const scrollH = scrollEl.scrollHeight;

        // İlk ve son kart sınırları (yalnızca görünür kartları hesaba kat)
        const cards = (Array.from(contentEl.children) as HTMLElement[]).filter(
          (c) =>
            c instanceof HTMLElement &&
            c.offsetParent !== null &&
            c.getBoundingClientRect().height > 0 &&
            (c.classList.contains("rounded-lg") || c.tagName === "DIV")
        );
        const firstCard = cards[0];
        const lastCard = cards[cards.length - 1];

        const scrollRect = scrollEl.getBoundingClientRect();
        const firstRect = firstCard ? firstCard.getBoundingClientRect() : null;
        const lastRect = lastCard ? lastCard.getBoundingClientRect() : null;

        const firstCardTop = firstRect ? firstRect.top - scrollRect.top : 0;
        const lastCardBottom = lastRect ? lastRect.bottom - scrollRect.top : scrollH;

        return fitsOnBothAxes(viewport, {
          scrollWidth: scrollW,
          scrollHeight: scrollH,
          firstCardTop,
          lastCardBottom,
        });
      };

      let resolvedScale: number = DEFAULT_FORM_SCALE;
      let resolvedDensity: Density = "normal";
      let resolvedStatus: FitStatus = "limited";

      // 1. Adım: Normal yoğunluk, scale = 1.00 sığıyor mu?
      if (testCandidate(1.00, "normal")) {
        resolvedScale = 1.00;
        resolvedDensity = "normal";
        resolvedStatus = "fitted";

        // Alan elveriyorsa 1.00 - FIT_MAX_SCALE arasında sığan en büyük ölçeği ara
        const scaleCandidates = [FIT_MAX_SCALE, 1.10, 1.05];
        for (const candidate of scaleCandidates) {
          if (testCandidate(candidate, "normal")) {
            resolvedScale = candidate;
            break;
          }
        }
      }
      // 2. Adım: Normal sığmıyorsa, Kompakt yoğunluk, scale = 1.00 sığıyor mu?
      else if (testCandidate(1.00, "compact")) {
        resolvedScale = 1.00;
        resolvedDensity = "compact";
        resolvedStatus = "fitted";
      }
      // 3. Adım: Kompakt 1.00 sığmıyorsa, FIT_MIN_SCALE..0.98 arası kompakt adaylar
      else {
        const compactCandidates = [0.98, 0.95, 0.92, FIT_MIN_SCALE];
        let foundFit = false;

        for (const candidate of compactCandidates) {
          if (testCandidate(candidate, "compact")) {
            resolvedScale = candidate;
            resolvedDensity = "compact";
            resolvedStatus = "fitted";
            foundFit = true;
            break;
          }
        }

        // 4. Adım: Hiçbiri sığmıyorsa -> Dürüstçe limited!
        // Fontu aşırı küçültmek yerine normal okunurluğu koruyan güvenli 1.00 + kompakt + y-scroll
        if (!foundFit) {
          resolvedScale = DEFAULT_FORM_SCALE;
          resolvedDensity = "compact";
          resolvedStatus = "limited";
        }
      }

      // The candidate loop mutates live DOM. Commit the WINNER explicitly:
      // unchanged React style props do not necessarily restore probed zoom.
      contentEl.style.zoom = resolvedScale === 1 ? "" : String(resolvedScale);
      contentEl.className = resolvedDensity === "compact" ? "space-y-1.5" : "space-y-2.5";

      // Orijinal scroll pozisyonunu geri yükle
      scrollEl.scrollTop = originalScrollTop;

      // DOM stillerini çözülen kesin değerlerle doğrudan senkronize et
      contentEl.style.zoom = resolvedScale !== 1 ? String(resolvedScale) : "";
      contentEl.className = resolvedDensity === "compact" ? "space-y-1.5" : "space-y-2.5";

      // Stale revizyon değilse state güncelle
      if (currentRev === revisionRef.current) {
        setFitScale(resolvedScale);
        setFitDensity(resolvedDensity);
        setFitStatus(resolvedStatus);
      }
    } finally {
      isMeasuringRef.current = false;
    }
  }, []);

  // Manuel ölçek seçimi
  const onChooseScale = useCallback((scale: ManualScale) => {
    setMode("manual");
    setManualScale(scale);
    setFitStatus("idle");
  }, []);

  // Kompakt görünüm aç/kapat (kullanıcının o an gördüğü aktif yoğunluğu tersine çevirir)
  const onToggleCompact = useCallback(() => {
    const current = mode === "fit" ? fitDensity : manualDensity;
    const next: Density = current === "compact" ? "normal" : "compact";
    setManualDensity(next);
    setMode("manual");
    setFitStatus("idle");
  }, [mode, fitDensity, manualDensity]);

  // Fit modunu başlat
  const onFit = useCallback(() => {
    setMode("fit");
    setFitStatus("measuring");
    if (rafIdRef.current) {
      window.cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = window.requestAnimationFrame(() => {
      executeFitMeasurement();
    });
  }, [executeFitMeasurement]);

  // Varsayılana dön
  const onReset = useCallback(() => {
    setMode("manual");
    setManualScale(DEFAULT_FORM_SCALE);
    setManualDensity("normal");
    setFitScale(DEFAULT_FORM_SCALE);
    setFitDensity("normal");
    setFitStatus("idle");
  }, []);

  // Komut dinleyicisi (Toolbar menüsü, mobil actions ve test otomasyonu için)
  useEffect(() => {
    const handleCommand = (e: Event) => {
      const customEvent = e as CustomEvent<{ command: string; scale?: ManualScale }>;
      const detail = customEvent.detail;
      if (!detail) return;

      if (detail.command === "fit") {
        onFit();
      } else if (detail.command === "scale" && detail.scale) {
        onChooseScale(detail.scale);
      } else if (detail.command === "compact") {
        onToggleCompact();
      } else if (detail.command === "reset") {
        onReset();
      }
    };

    window.addEventListener("belge-form-view:command", handleCommand);
    return () => {
      window.removeEventListener("belge-form-view:command", handleCommand);
    };
  }, [onFit, onChooseScale, onToggleCompact, onReset]);

  // ResizeObserver ile boyutu izleme ve batch invalidate
  useEffect(() => {
    if (mode !== "fit") return;

    const scrollEl = scrollContainerRef.current;
    const contentEl = contentWrapperRef.current;
    if (!scrollEl || !contentEl) return;

    // One cancellable measurement scheduled at a time.
    const schedule = () => {
      if (rafIdRef.current !== null) window.cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = window.requestAnimationFrame(() => {
        rafIdRef.current = null;
        executeFitMeasurement();
      });
    };
    schedule();

    const observer = new ResizeObserver(() => {
      // Kendi ölçüm mutasyonumuz sırasında tetiklenen resize'ları yut
      if (isMeasuringRef.current) return;

      schedule();
    });

    observer.observe(scrollEl);
    // New field warnings can resize the contents but not the fixed panel.
    observer.observe(contentEl);

    // While typing, fit deliberately preserves caret; retry after blur.
    const handleFocusOut = () => {
      window.requestAnimationFrame(() => {
        if (scrollContainerRef.current === scrollEl) schedule();
      });
    };
    scrollEl.addEventListener("focusout", handleFocusOut);

    return () => {
      observer.disconnect();
      scrollEl.removeEventListener("focusout", handleFocusOut);
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [mode, executeFitMeasurement]);

  const appliedScale = mode === "manual" ? manualScale : fitScale;
  const appliedDensity = mode === "manual" ? manualDensity : fitDensity;

  // İçerik wrapper stilleri (yalnızca form içerik wrapper'ına uygulanır, dış scrollbar'a değil)
  const wrapperStyle: React.CSSProperties = {
    width: "100%",
    ...(appliedScale !== 1 ? { zoom: appliedScale } : {}),
  };

  const contentWrapperProps = {
    ref: contentWrapperRef,
    "data-belge-form-content": "true",
    "data-scale": appliedScale,
    "data-density": appliedDensity,
    "data-mode": mode,
    "data-fit-status": fitStatus,
    style: wrapperStyle,
    className: appliedDensity === "compact" ? "space-y-1.5" : "space-y-2.5",
  };

  return {
    mode,
    manualScale,
    density: appliedDensity,
    appliedScale,
    fitStatus,
    scrollContainerRef,
    contentWrapperRef,
    onChooseScale,
    onToggleCompact,
    onFit,
    onReset,
    contentWrapperProps,
  };
}

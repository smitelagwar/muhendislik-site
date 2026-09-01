"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Download, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  CadUpstreamAdapter,
  CadUpstreamAdapterError,
  CAD_BACKGROUND_COLORS,
  type CadBackgroundColorOption,
  type CadDistanceMeasurementSnapshot,
  type CadAreaMeasurementSnapshot,
  type CadLayerItem,
  type CadLoadingPhase,
  type CadUpstreamDisplayMode,
  type CadUpstreamTheme,
} from "@/lib/dokumantasyon/cad-upstream/adapter";
import {
  CAD_SNAP_MODES,
  getEnabledCadSnapModes,
  loadCadSnapSettings,
  saveCadSnapSettings,
  type CadSnapSettings,
  type CadSnapSettingsStorage,
} from "@/lib/dokumantasyon/cad-upstream/snap-settings";
import { resolveCadUpstreamTimeoutMs } from "@/lib/dokumantasyon/dwg/runtime-policy";
import {
  CadDistanceOverlay,
  type CadDistanceOverlayMeasurement,
} from "./cad-distance-overlay";
import {
  CadAreaOverlay,
  type CompletedAreaMeasurement,
} from "./cad-area-overlay";
import { CadLayerPanel } from "./cad-layer-panel";
import { CadSnapSettingsPanel } from "./cad-snap-settings-panel";
import { CadViewSettingsPanel } from "./cad-view-settings-panel";
import { CadStudioRibbon } from "./cad-studio-ribbon";

// ── CAD Review V1 ──────────────────────────────────────────────────────────────
import { CadReviewSidePanel, type CadSidePanelTab, type CadTextSearchResultItem } from "./cad-review-side-panel";
import { CadReviewOverlay } from "./cad-review-overlay";
import { CadExportDialog } from "./cad-export-dialog";
import { exportReviewToDxf } from "@/lib/dokumantasyon/cad-review/export-dxf";
import {
  CadReviewStore,
  type CadReviewTool,
  type CadReviewDraftState,
  type CadActiveMarkupStyle,
  type CadMeasurementUnitSettings,
} from "@/lib/dokumantasyon/cad-review/store";
import { CadMarkupFacade } from "@/lib/dokumantasyon/cad-review/markup-facade";
import { CadMarkupController } from "@/lib/dokumantasyon/cad-review/markup-controller";
import { CadFreehandController } from "@/lib/dokumantasyon/cad-review/freehand-controller";
import { attachCadReviewKeyboardShortcuts } from "./cad-review-shortcuts";
import {
  type CadReviewDocument,
  type CadReviewItem,
  loadLocalCadReview,
  saveLocalCadReview,
} from "@/lib/dokumantasyon/cad-review/schema";
import { isCadReviewEnabled } from "@/lib/dokumantasyon/cad-review/feature-flags";
// ──────────────────────────────────────────────────────────────────────────────

export interface DokCadUpstreamViewerProps {
  accessUrl: string;
  displayName: string;
  fileId: string;
  extension: string;
  sizeBytes: number;
  timeoutMs?: number;
  onReady?: () => void;
  onViewerFailure?: (reason: string) => void;
}

type HostState = "loading" | "ready" | "error";
type ActiveTool = "distance" | "area" | null;

let previousCadUpstreamTeardown: Promise<void> = Promise.resolve();

function resolveSiteTheme(): CadUpstreamTheme {
  if (typeof document === "undefined") return "dark";
  const root = document.documentElement;
  if (root.classList.contains("dark")) return "dark";
  if (root.classList.contains("light")) return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveSnapStorage(): CadSnapSettingsStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function failureReason(error: unknown): string {
  if (error instanceof CadUpstreamAdapterError) {
    return `${error.code}:${error.message}`;
  }
  return error instanceof Error
    ? `upstream-error:${error.message}`
    : "upstream-error:Bilinmeyen CAD hatası";
}

export function DokCadUpstreamViewer({
  accessUrl,
  displayName,
  fileId,
  extension,
  sizeBytes,
  timeoutMs,
  onReady,
  onViewerFailure,
}: DokCadUpstreamViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<CadUpstreamAdapter | null>(null);
  const displayModeRef = useRef<CadUpstreamDisplayMode>("source");
  const lineWeightVisibleRef = useRef(false);
  const backgroundColorRef = useRef<CadBackgroundColorOption>("autocad");
  const distanceMeasurementIdRef = useRef(0);
  const areaMeasurementIdRef = useRef(0);
  const [state, setState] = useState<HostState>("loading");
  const [message, setMessage] = useState("MLightCAD hazırlanıyor");
  const [loadingPhase, setLoadingPhase] = useState<CadLoadingPhase>("init");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [displayMode, setDisplayMode] = useState<CadUpstreamDisplayMode>("source");
  const [lineWeightVisible, setLineWeightVisible] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState<CadBackgroundColorOption>("autocad");
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [layers, setLayers] = useState<CadLayerItem[]>([]);
  const [layerPanelOpen, setLayerPanelOpen] = useState(false);
  const [layerQuery, setLayerQuery] = useState("");
  const layerButtonRef = useRef<HTMLButtonElement>(null);
  const [snapPanelOpen, setSnapPanelOpen] = useState(false);
  const [viewPanelOpen, setViewPanelOpen] = useState(false);
  const [snapSettings, setSnapSettings] = useState<CadSnapSettings>(() =>
    loadCadSnapSettings(resolveSnapStorage())
  );
  const [distanceSnapshot, setDistanceSnapshot] =
    useState<CadDistanceMeasurementSnapshot | null>(null);
  const [distanceMeasurements, setDistanceMeasurements] = useState<
    CadDistanceOverlayMeasurement[]
  >([]);
  const [areaSnapshot, setAreaSnapshot] =
    useState<CadAreaMeasurementSnapshot | null>(null);
  const [areaMeasurements, setAreaMeasurements] = useState<
    CompletedAreaMeasurement[]
  >([]);

  // ── CAD Review V1 State ────────────────────────────────────────────────────
  const reviewEnabled = isCadReviewEnabled();
  const reviewStoreRef = useRef<CadReviewStore | null>(null);
  const markupControllerRef = useRef<CadMarkupController | null>(null);
  const freehandControllerRef = useRef<CadFreehandController | null>(null);
  const [reviewItems, setReviewItems] = useState<readonly CadReviewItem[]>([]);
  const [reviewDraft, setReviewDraft] = useState<CadReviewDraftState | null>(null);
  const [reviewTool, setReviewTool] = useState<CadReviewTool>("select");
  const [reviewCanUndo, setReviewCanUndo] = useState(false);
  const [reviewCanRedo, setReviewCanRedo] = useState(false);
  const [activePanelTab, setActivePanelTab] = useState<CadSidePanelTab | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [reviewSearchQuery, setReviewSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CadTextSearchResultItem[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [reviewDocument, setReviewDocument] = useState<import("@/lib/dokumantasyon/cad-review/schema").CadReviewDocument | null>(null);
  const [markupStyle, setMarkupStyle] = useState<CadActiveMarkupStyle>({
    color: "#ff3b30",
    strokeWidth: 2,
    lineDash: "continuous",
    opacity: 1,
    fontSize: 16,
  });
  const [measurementUnitSettings, setMeasurementUnitSettings] = useState<CadMeasurementUnitSettings>({
    unit: "m",
    precision: 2,
    color: "#3b82f6",
  });
  const [saveStatus, setSaveStatus] = useState<"clean" | "dirty" | "saving">("clean");
  const saveTimeoutRef = useRef<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  // ──────────────────────────────────────────────────────────────────────────

  const handleUpdateMarkupStyle = useCallback((patch: Partial<CadActiveMarkupStyle>) => {
    setMarkupStyle((prev) => {
      const next = { ...prev, ...patch };
      reviewStoreRef.current?.setActiveMarkupStyle(next);
      markupControllerRef.current?.setStyle(next);
      freehandControllerRef.current?.setStyle(next);
      return next;
    });
  }, []);

  const handleUpdateMeasurementUnitSettings = useCallback((patch: Partial<CadMeasurementUnitSettings>) => {
    setMeasurementUnitSettings((prev) => {
      const next = { ...prev, ...patch };
      reviewStoreRef.current?.setMeasurementUnitSettings(next);
      return next;
    });
  }, []);

  const handleSearchQueryChange = (query: string) => {
    setReviewSearchQuery(query);
    const q = query.trim();
    if (!q || !adapterRef.current) {
      setSearchResults([]);
      return;
    }
    try {
      const results = adapterRef.current.searchCadText({ query: q });
      setSearchResults(
        results.map((r, index) => ({
          id: `search-res-${index}`,
          text: r.item.text,
          layer: r.item.layer,
          layoutName: r.item.layout,
          bounds: r.item.bounds,
        }))
      );
    } catch {
      setSearchResults([]);
    }
  };

  const effectiveTimeoutMs = timeoutMs ?? resolveCadUpstreamTimeoutMs(sizeBytes);

  useEffect(() => {
    if (state !== "loading") return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((sec) => sec + 1);
    }, 1000);
    return () => {
      window.clearInterval(interval);
      setElapsedSeconds(0);
    };
  }, [state]);

  // ── CAD Review V1: Store initialization & Auto-Save Persistence ──────────
  useEffect(() => {
    if (!reviewEnabled || state !== "ready") return;
    if (reviewStoreRef.current) return; // already initialized

    const fallbackDoc: CadReviewDocument = {
      schemaVersion: 1,
      fileId,
      sourceVersionKey: `${fileId}:${accessUrl}`,
      sourceSha256: "0".repeat(64),
      revision: 0,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Check local storage for instant offline recovery
    const localDoc = loadLocalCadReview(fileId);
    const initialDoc = localDoc && localDoc.items?.length ? localDoc : fallbackDoc;

    const store = new CadReviewStore(initialDoc);
    reviewStoreRef.current = store;

    queueMicrotask(() => {
      if (reviewStoreRef.current === store) {
        setReviewItems(store.getItems());
        setReviewCanUndo(store.canUndo());
        setReviewCanRedo(store.canRedo());
        setReviewDocument(store.getDocument());
      }
    });

    // 2. Query server in background to sync if local storage was empty
    fetch(`/api/dokumantasyon/files/${fileId}/review`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.items?.length && reviewStoreRef.current === store) {
          if (store.getItems().length === 0) {
            const loadedDoc: CadReviewDocument = {
              ...fallbackDoc,
              items: data.items as CadReviewDocument["items"],
              revision: data.revision ?? 0,
            };
            reviewStoreRef.current = new CadReviewStore(loadedDoc);
            setReviewItems(reviewStoreRef.current.getItems());
            setReviewCanUndo(reviewStoreRef.current.canUndo());
            setReviewCanRedo(reviewStoreRef.current.canRedo());
            setReviewDocument(reviewStoreRef.current.getDocument());
            saveLocalCadReview(fileId, loadedDoc);
          }
        }
      })
      .catch(() => {/* silently ignore – server may not have a review yet */});

    const unsubscribe = store.subscribe(() => {
      if (reviewStoreRef.current) {
        const curDoc = reviewStoreRef.current.getDocument();
        setReviewItems([...reviewStoreRef.current.getItems()]);
        setReviewCanUndo(reviewStoreRef.current.canUndo());
        setReviewCanRedo(reviewStoreRef.current.canRedo());
        setReviewDocument({ ...curDoc });
        setReviewDraft({ ...reviewStoreRef.current.getDraft() });

        // Auto-save to localStorage
        saveLocalCadReview(fileId, curDoc);
        setSaveStatus("saving");
        if (saveTimeoutRef.current) {
          window.clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = window.setTimeout(() => {
          setSaveStatus("clean");
        }, 500);
      }
    });

    return () => {
      unsubscribe();
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [reviewEnabled, state, fileId, accessUrl]);

  // ── CAD Review V1: Controllers (Markup & Freehand) Initialization ──────────
  useEffect(() => {
    if (!reviewEnabled || state !== "ready" || !viewportRef.current || !reviewStoreRef.current) {
      return;
    }

    const host = viewportRef.current;
    const store = reviewStoreRef.current;
    const facade = new CadMarkupFacade(store);

    const markupRuntime = {
      screenToWorld: (screenPoint: { x: number; y: number }) => {
        return adapterRef.current?.screenToWorldPoint(screenPoint) ?? null;
      },
      worldToScreen: (worldPoint: { x: number; y: number }) => {
        return adapterRef.current?.projectWorldPoint(worldPoint) ?? null;
      },
      setCameraInteractionEnabled: (enabled: boolean) => {
        adapterRef.current?.setCameraInteractionEnabled(enabled);
      },
    };

    const freehandRuntime = {
      screenToWorld: (screenPoint: { x: number; y: number }) => {
        return adapterRef.current?.screenToWorldPoint(screenPoint) ?? null;
      },
      worldToScreen: (worldPoint: { x: number; y: number }) => {
        return adapterRef.current?.projectWorldPoint(worldPoint) ?? null;
      },
      setCameraInteractionEnabled: (enabled: boolean) => {
        adapterRef.current?.setCameraInteractionEnabled(enabled);
      },
    };

    const markupController = new CadMarkupController(host, store, facade, markupRuntime);
    const freehandController = new CadFreehandController(host, store, facade, freehandRuntime);

    markupController.setStyle(markupStyle);
    freehandController.setStyle(markupStyle);

    markupControllerRef.current = markupController;
    freehandControllerRef.current = freehandController;

    return () => {
      markupController.destroy();
      freehandController.destroy();
      markupControllerRef.current = null;
      freehandControllerRef.current = null;
    };
  }, [reviewEnabled, state]);


  // ── CAD Review V1: Keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    if (!reviewEnabled || state !== "ready") return;
    const detach = attachCadReviewKeyboardShortcuts({
      onEscape: () => {
        setActivePanelTab(null);
        setReviewTool("select");
        reviewStoreRef.current?.setActiveTool("select");
        // Also forward Escape to the native CAD adapter so active
        // distance/area measurements still cancel cleanly (non-blocking).
        void adapterRef.current?.cancelActiveCommand().catch(() => {});
        setActiveTool(null);
        setDistanceSnapshot(null);
        setAreaSnapshot(null);
      },
      onUndo: () => reviewStoreRef.current?.undo(),
      onRedo: () => reviewStoreRef.current?.redo(),
      onSearch: () => setActivePanelTab((prev) => (prev === "search" ? null : "search")),
      onDelete: () => {
        const store = reviewStoreRef.current;
        if (!store) return;
        const selected = [...store.getSession().selectedItemIds];
        selected.forEach((id) => store.removeItem(id));
      },
    });
    return detach;
  }, [reviewEnabled, state]);


  // ── CAD Review V1: Container resize observer for SVG overlay sizing ─────────
  useEffect(() => {
    if (!reviewEnabled) return;
    const el = sectionRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const nextWidth = Math.round(entry.contentRect.width);
        const nextHeight = Math.round(entry.contentRect.height);
        setContainerSize((prev) => {
          if (prev.width === nextWidth && prev.height === nextHeight) {
            return prev;
          }
          return { width: nextWidth, height: nextHeight };
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [reviewEnabled]);
  // ──────────────────────────────────────────────────────────────────────────



  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    let cancelled = false;
    let timedOut = false;
    let adapter: CadUpstreamAdapter | null = null;
    let themeObserver: MutationObserver | null = null;
    let systemThemeQuery: MediaQueryList | null = null;
    let syncTheme: (() => void) | null = null;
    let unsubscribeLayers: (() => void) | null = null;
    let unsubscribeViewChanged: (() => void) | null = null;
    let timeoutId: number | null = null;
    let cancelStartup: ((reason?: unknown) => void) | null = null;

    const startup = previousCadUpstreamTeardown.then(async () => {
      if (cancelled) return;

      setState("loading");
      setMessage("MLightCAD hazırlanıyor");
      setLayerPanelOpen(false);
      setSnapPanelOpen(false);
      setViewPanelOpen(false);
      setActiveTool(null);
      setDistanceSnapshot(null);
      setDistanceMeasurements([]);
      setAreaSnapshot(null);
      setAreaMeasurements([]);

      const upstreamWork = (async () => {
        setMessage("CAD worker dosyaları doğrulanıyor");
        const createdAdapter = await CadUpstreamAdapter.create({
          container: viewport,
          busyIndicatorHost: viewport,
          theme: resolveSiteTheme(),
        });
        adapter = createdAdapter;
        adapterRef.current = createdAdapter;

        if (cancelled || timedOut || abortController.signal.aborted) {
          adapterRef.current = null;
          await createdAdapter.destroy().catch(() => {});
          adapter = null;
          return;
        }

        syncTheme = () => {
          if (!adapter || cancelled) return;
          adapter.applyTheme(resolveSiteTheme(), viewport);
        };

        themeObserver = new MutationObserver(syncTheme);
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["class"],
        });

        systemThemeQuery = window.matchMedia?.("(prefers-color-scheme: dark)") ?? null;
        systemThemeQuery?.addEventListener?.("change", syncTheme);

        setMessage(
          extension.trim().toLowerCase().includes("dwg") ? "DWG açılıyor" : "DXF açılıyor"
        );
        await createdAdapter.open({
          accessUrl,
          displayName,
          extension,
          signal: abortController.signal,
          onPhase: (phase, phaseText) => {
            if (!cancelled) {
              setLoadingPhase(phase);
              setMessage(phaseText);
            }
          },
        });

        createdAdapter.setDisplayMode(displayModeRef.current, resolveSiteTheme());
        createdAdapter.setBackgroundColor(backgroundColorRef.current);
        const initialLineWeight = createdAdapter.getLineWeightVisible();
        lineWeightVisibleRef.current = initialLineWeight;
        setLineWeightVisible(initialLineWeight);

        setLayers(createdAdapter.getLayers());
        unsubscribeLayers = createdAdapter.subscribeLayersChanged(() => {
          if (!cancelled && adapterRef.current) {
            setLayers(adapterRef.current.getLayers());
          }
        });
      })();

      const cancellation = new Promise<never>((_, reject) => {
        cancelStartup = reject;
        if (abortController.signal.aborted) {
          reject(
            new CadUpstreamAdapterError(
              "adapter-destroyed",
              "CAD görüntüleyici iptal edildi."
            )
          );
        } else {
          abortController.signal.addEventListener(
            "abort",
            () => {
              reject(
                new CadUpstreamAdapterError(
                  "adapter-destroyed",
                  "CAD görüntüleyici iptal edildi."
                )
              );
            },
            { once: true }
          );
        }
      });

      const deadline = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          timedOut = true;
          abortController.abort("CAD_UPSTREAM_TIMEOUT");
          reject(
            new CadUpstreamAdapterError(
              "open-timeout",
              `MLightCAD ${Math.round(
                effectiveTimeoutMs / 1000
              )} saniye içinde terminal sonuca ulaşamadı.`
            )
          );
        }, effectiveTimeoutMs);
      });

      try {
        await Promise.race([upstreamWork, deadline, cancellation]);
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        timeoutId = null;
        if (cancelled || timedOut || abortController.signal.aborted) {
          return;
        }
        setState("ready");
        setMessage("");
        onReady?.();
      } catch (error) {
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        timeoutId = null;
        themeObserver?.disconnect();
        if (systemThemeQuery && syncTheme) {
          systemThemeQuery.removeEventListener?.("change", syncTheme);
        }
        if (unsubscribeLayers) {
          unsubscribeLayers();
          unsubscribeLayers = null;
        }
        if (unsubscribeViewChanged) {
          unsubscribeViewChanged();
          unsubscribeViewChanged = null;
        }

        if (adapter) {
          if (adapterRef.current === adapter) adapterRef.current = null;
          await adapter.destroy().catch(() => {});
          adapter = null;
        }

        void upstreamWork.catch(() => undefined);

        if (cancelled || (abortController.signal.aborted && !timedOut)) return;

        const reason = failureReason(error);
        setState("error");
        setMessage(
          reason.split(":").slice(1).join(":") || "CAD görüntüleyici başlatılamadı."
        );
        onViewerFailure?.(reason);
      }
    });

    return () => {
      cancelled = true;
      cancelStartup?.(
        new CadUpstreamAdapterError(
          "adapter-destroyed",
          "CAD görüntüleyici kapatıldı."
        )
      );
      cancelStartup = null;
      abortController.abort("CAD_UPSTREAM_UNMOUNT");
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      themeObserver?.disconnect();
      if (systemThemeQuery && syncTheme) {
        systemThemeQuery.removeEventListener?.("change", syncTheme);
      }
      if (unsubscribeLayers) {
        unsubscribeLayers();
        unsubscribeLayers = null;
      }
      if (unsubscribeViewChanged) {
        unsubscribeViewChanged();
        unsubscribeViewChanged = null;
      }

      if (adapterRef.current === adapter) adapterRef.current = null;
      previousCadUpstreamTeardown = startup
        .catch(() => undefined)
        .then(async () => {
          if (adapter) {
            await adapter.destroy().catch(() => {});
            adapter = null;
          }
        });
    };
  }, [
    accessUrl,
    displayName,
    effectiveTimeoutMs,
    extension,
    fileId,
    retryKey,
    onReady,
    onViewerFailure,
  ]);

  const handleStartDistanceRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const handleStartAreaRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const handleStartChainDistanceRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "Escape") {
        setLayerPanelOpen(false);
        setSnapPanelOpen(false);
        setViewPanelOpen(false);
        setActiveTool(null);
        setDistanceSnapshot(null);
        setAreaSnapshot(null);
        void adapterRef.current?.cancelActiveCommand();
        return;
      }

      if (
        (event.key === "t" || event.key === "T" || event.code === "KeyT") &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        if (state === "ready") {
          event.preventDefault();
          void handleStartDistanceRef.current?.();
        }
      }

      if (
        (event.key === "a" || event.key === "A" || event.code === "KeyA") &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        if (state === "ready") {
          event.preventDefault();
          void handleStartAreaRef.current?.();
        }
      }

      if (
        (event.key === "p" || event.key === "P" || event.code === "KeyP") &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        if (state === "ready") {
          event.preventDefault();
          setActiveTool(null);
          setDistanceSnapshot(null);
          setAreaSnapshot(null);
          void adapterRef.current?.cancelActiveCommand();
        }
      }

      if (
        (event.key === "f" || event.key === "F" || event.code === "KeyF") &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        if (state === "ready") {
          event.preventDefault();
          adapterRef.current?.zoomToFit();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state]);

  const selectDisplayMode = (mode: CadUpstreamDisplayMode) => {
    displayModeRef.current = mode;
    setDisplayMode(mode);
    adapterRef.current?.setDisplayMode(mode, resolveSiteTheme());
  };

  const toggleLineWeight = async () => {
    const adapter = adapterRef.current;
    if (!adapter) return;
    const next = !lineWeightVisibleRef.current;
    try {
      await adapter.setLineWeightVisible(next);
      lineWeightVisibleRef.current = next;
      setLineWeightVisible(next);
    } catch (error) {
      console.warn("MLightCAD lineweight değiştirilemedi", error);
    }
  };

  const selectBackgroundColor = (color: CadBackgroundColorOption) => {
    backgroundColorRef.current = color;
    setBackgroundColor(color);
    adapterRef.current?.setBackgroundColor(color);
  };

  const handleSnapSettingsChange = (next: CadSnapSettings) => {
    setSnapSettings(next);
    saveCadSnapSettings(resolveSnapStorage(), next);
    adapterRef.current?.updateDistanceMeasurementSnapModes(
      getEnabledCadSnapModes(next)
    );
  };

  const handleZoomToFit = () => {
    adapterRef.current?.zoomToFit();
  };

  const handleStartDistance = async () => {
    const adapter = adapterRef.current;
    if (!adapter) return;
    if (activeTool === "distance") {
      await adapter.cancelActiveCommand();
      return;
    }

    const started = await adapter.startDistanceMeasurement(
      getEnabledCadSnapModes(snapSettings),
      {
        onSnapshot: (snapshot) => setDistanceSnapshot(snapshot),
        onComplete: (measurement) => {
          distanceMeasurementIdRef.current += 1;
          setDistanceMeasurements((current) => [
            ...current,
            {
              ...measurement,
              id: `distance-${distanceMeasurementIdRef.current}`,
            },
          ]);
          setDistanceSnapshot(null);
          setActiveTool((current) => (current === "distance" ? null : current));
        },
        onCancel: () => {
          setDistanceSnapshot(null);
          setActiveTool((current) => (current === "distance" ? null : current));
        },
      }
    );
    setActiveTool(started ? "distance" : null);
  };

  const handleStartArea = async () => {
    const adapter = adapterRef.current;
    if (!adapter) return;
    if (activeTool === "area") {
      setActiveTool(null);
      await adapter.cancelActiveCommand();
      return;
    }
    await adapter.cancelActiveCommand();
    setDistanceSnapshot(null);
    setAreaSnapshot(null);

    const started = await adapter.startAreaMeasurement(
      getEnabledCadSnapModes(snapSettings),
      {
        onSnapshot: (snapshot) => setAreaSnapshot(snapshot),
        onComplete: (measurement) => {
          areaMeasurementIdRef.current += 1;
          setAreaMeasurements((current) => [
            ...current,
            {
              ...measurement,
              id: `area-${areaMeasurementIdRef.current}`,
            },
          ]);
          setAreaSnapshot(null);
          setActiveTool((current) => (current === "area" ? null : current));
        },
        onCancel: () => {
          setAreaSnapshot(null);
          setActiveTool((current) => (current === "area" ? null : current));
        },
      }
    );
    setActiveTool(started ? "area" : null);
  };

  const handleStartChainDistance = async () => {
    const adapter = adapterRef.current;
    if (!adapter) return;
    await adapter.cancelActiveCommand();
    setDistanceSnapshot(null);
    setAreaSnapshot(null);

    const started = await adapter.startChainDistanceMeasurement(
      getEnabledCadSnapModes(snapSettings),
      {
        onSnapshot: () => {},
        onComplete: (measurement) => {
          if (reviewStoreRef.current) {
            reviewStoreRef.current.addItem({
              id: `chain-${Date.now()}`,
              type: "chain_distance",
              points: measurement.points.map((p) => ({ x: p.x, y: p.y })),
              segmentDistances: [...measurement.segmentDistances],
              totalDistance: measurement.totalDistance,
              author: "Admin",
              comment: "",
              status: "open",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              style: { color: "#007aff", strokeWidth: 2, opacity: 1 },
            });
          }
          setReviewTool("select");
          reviewStoreRef.current?.setActiveTool("select");
        },
        onCancel: () => {
          setReviewTool("select");
          reviewStoreRef.current?.setActiveTool("select");
        },
      }
    );
    if (started) {
      setActiveTool(null);
    }
  };

  useEffect(() => {
    handleStartDistanceRef.current = handleStartDistance;
    handleStartAreaRef.current = handleStartArea;
    handleStartChainDistanceRef.current = handleStartChainDistance;
  });

  const handleClearMeasurements = async () => {
    setActiveTool(null);
    setDistanceSnapshot(null);
    setDistanceMeasurements([]);
    distanceMeasurementIdRef.current = 0;
    setAreaSnapshot(null);
    setAreaMeasurements([]);
    areaMeasurementIdRef.current = 0;
    await adapterRef.current?.clearMeasurements();
  };

  const handleToggleLayer = (name: string, visible: boolean) => {
    adapterRef.current?.setLayerVisible(name, visible);
  };

  const handleIsolateLayer = (name: string) => {
    adapterRef.current?.isolateLayer(name);
  };

  const handleShowAllLayers = () => {
    adapterRef.current?.showAllLayers();
  };

  const handleHideAllLayers = () => {
    adapterRef.current?.hideAllLayers();
  };

  const handleResetLayers = () => {
    adapterRef.current?.resetLayersToSource();
  };

  const handleToggleLayerPanel = () => {
    setLayerPanelOpen((open) => {
      const next = !open;
      if (next) {
        setSnapPanelOpen(false);
        setViewPanelOpen(false);
      }
      return next;
    });
  };


  const handleToggleSnapPanel = () => {
    setSnapPanelOpen((open) => {
      const next = !open;
      if (next) {
        setLayerPanelOpen(false);
        setViewPanelOpen(false);
      }
      return next;
    });
  };

  const handleToggleViewPanel = () => {
    setViewPanelOpen((open) => {
      const next = !open;
      if (next) {
        setLayerPanelOpen(false);
        setSnapPanelOpen(false);
      }
      return next;
    });
  };

  // ── CAD Review V1 Handlers ─────────────────────────────────────────────────
  const handleSelectReviewTool = useCallback((tool: CadReviewTool) => {
    setReviewTool(tool);
    reviewStoreRef.current?.setActiveTool(tool);

    if (tool === "distance") {
      void handleStartDistanceRef.current?.();
      return;
    }
    if (tool === "area") {
      void handleStartAreaRef.current?.();
      return;
    }
    if (tool === "chain_distance") {
      void handleStartChainDistanceRef.current?.();
      return;
    }

    // Cancel any active MLightCAD distance/area command when switching
    void adapterRef.current?.cancelActiveCommand();
    setActiveTool(null);
  }, []);

  const handleReviewUndo = useCallback(() => reviewStoreRef.current?.undo(), []);
  const handleReviewRedo = useCallback(() => reviewStoreRef.current?.redo(), []);

  const handleTogglePanelTab = useCallback((tab: CadSidePanelTab) => {
    setActivePanelTab((prev) => (prev === tab ? null : tab));
  }, []);

  const handleDownloadOriginal = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      toast.info("Orijinal çizim dosyası indiriliyor...");
      const link = document.createElement("a");
      link.href = accessUrl;
      link.download = displayName;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("Orijinal dosya indirilemedi.");
    }
  }, [accessUrl, displayName]);

  const handleDownloadDxfRevision = useCallback(() => {
    if (typeof window === "undefined") return;
    const doc = reviewStoreRef.current?.getDocument() || reviewDocument;
    if (!doc) {
      toast.error("İndirilecek revizyon verisi bulunamadı.");
      return;
    }
    try {
      const dxfString = exportReviewToDxf(doc);
      const blob = new Blob([dxfString], { type: "application/dxf;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const baseName = displayName.replace(/\.[^/.]+$/, "");
      const link = document.createElement("a");
      link.href = url;
      link.download = `${baseName}_revizyon.dxf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`${baseName}_revizyon.dxf başarıyla indirildi (${doc.items.length} çizim/ölçüm öğesi).`);
    } catch {
      toast.error("DXF dosyası oluşturulurken bir hata meydana geldi.");
    }
  }, [reviewDocument, displayName]);
  // ──────────────────────────────────────────────────────────────────────────

  const selectedSnapModes = CAD_SNAP_MODES.filter((mode) => snapSettings.modes[mode]).join(",");

  return (
    <section
      ref={sectionRef}
      className="relative flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-background"
      style={{ backgroundColor: CAD_BACKGROUND_COLORS[backgroundColor].hex }}
      data-cad-upstream-host="true"
      data-file-id={fileId}
      data-cad-upstream-state={state}
      data-cad-loading-phase={state === "loading" ? loadingPhase : state}
      data-cad-elapsed-seconds={elapsedSeconds}
      data-cad-color-mode={displayMode}
      data-cad-background-color={backgroundColor}
      data-cad-lineweight={lineWeightVisible ? "on" : "off"}
      data-cad-active-tool={activeTool ?? "none"}
      data-cad-distance-phase={distanceSnapshot?.phase ?? "inactive"}
      data-cad-area-phase={areaSnapshot?.phase ?? "inactive"}
      data-cad-layer-panel-open={layerPanelOpen ? "true" : "false"}
      data-cad-snap-panel-open={snapPanelOpen ? "true" : "false"}
      data-cad-view-panel-open={viewPanelOpen ? "true" : "false"}
      data-cad-snap-enabled={snapSettings.enabled ? "true" : "false"}
      data-cad-snap-modes={snapSettings.enabled ? selectedSnapModes : ""}
      data-cad-snap-selected-modes={selectedSnapModes}
      data-cad-timeout-ms={effectiveTimeoutMs}
    >
      {/* ── TOP RIBBON TOOLBAR ── */}
      {state === "ready" ? (
        <CadStudioRibbon
          activeTool={
            activeTool === "distance"
              ? "distance"
              : activeTool === "area"
              ? "area"
              : reviewTool
          }
          onSelectTool={handleSelectReviewTool}
          onPan={async () => {
            if (activeTool) {
              await adapterRef.current?.cancelActiveCommand();
              setActiveTool(null);
              setDistanceSnapshot(null);
              setAreaSnapshot(null);
            }
            setReviewTool("select");
            reviewStoreRef.current?.setActiveTool("select");
          }}
          onFitView={handleZoomToFit}
          displayMode={displayMode}
          onSelectDisplayMode={selectDisplayMode}
          lineWeightVisible={lineWeightVisible}
          onToggleLineWeight={() => void toggleLineWeight()}
          backgroundColor={backgroundColor}
          onSelectBackgroundColor={selectBackgroundColor}
          markupStyle={markupStyle}
          onUpdateMarkupStyle={handleUpdateMarkupStyle}
          measurementUnitSettings={measurementUnitSettings}
          onUpdateMeasurementUnitSettings={handleUpdateMeasurementUnitSettings}
          onStartDistance={() => void handleStartDistance()}
          onStartChainDistance={() => void handleStartChainDistance()}
          onStartArea={() => void handleStartArea()}
          onClearMeasurements={() => void handleClearMeasurements()}
          activePanelTab={activePanelTab}
          onTogglePanelTab={handleTogglePanelTab}
          layerPanelOpen={layerPanelOpen}
          onToggleLayerPanel={handleToggleLayerPanel}
          snapPanelOpen={snapPanelOpen}
          onToggleSnapPanel={handleToggleSnapPanel}
          snapEnabled={snapSettings.enabled}
          layersCount={layers.length}
          commentsCount={
            reviewItems.filter(
              (i) => i.type === "comment_pin" || i.type === "callout" || i.type === "text"
            ).length
          }
          canUndo={reviewCanUndo}
          canRedo={reviewCanRedo}
          onUndo={handleReviewUndo}
          onRedo={handleReviewRedo}
          saveStatus={saveStatus}
          onDownloadOriginal={handleDownloadOriginal}
          onDownloadDxf={handleDownloadDxfRevision}
          onOpenExportDialog={() => setExportDialogOpen(true)}
          sourceFileName={displayName}
        />
      ) : null}

      {/* ── CANVAS & VIEWPORT CONTAINER ── */}
      <div className="relative flex-1 min-h-0 min-w-0 overflow-hidden">
        <div
          ref={viewportRef}
          className={`absolute inset-0 ${layerPanelOpen ? "pointer-events-none sm:pointer-events-auto" : ""}`}
          aria-label={`${displayName} CAD görünümü`}
          aria-hidden={layerPanelOpen ? "true" : undefined}
        />

        {state === "ready" ? (
          <CadDistanceOverlay
            snapshot={distanceSnapshot}
            measurements={distanceMeasurements}
            projectPoint={(point) => adapterRef.current?.projectWorldPoint(point) ?? null}
          />
        ) : null}

        {state === "ready" ? (
          <CadAreaOverlay
            snapshot={areaSnapshot}
            measurements={areaMeasurements}
            projectPoint={(point) => adapterRef.current?.projectWorldPoint(point) ?? null}
            onFinish={() => adapterRef.current?.finishAreaMeasurement()}
          />
        ) : null}

        {/* ── CAD Review V1: SVG Item Overlay ── */}
        {reviewEnabled && state === "ready" && (reviewItems.length > 0 || Boolean(reviewDraft?.draftItem)) ? (
          <CadReviewOverlay
            items={reviewItems}
            draft={reviewDraft}
            projectPoint={(point) => adapterRef.current?.projectWorldPoint(point) ?? null}
            containerWidth={containerSize.width}
            containerHeight={containerSize.height}
            onClickItem={(id) => reviewStoreRef.current?.setSelectedItems([id])}
          />
        ) : null}

        {/* ── CAD Review V1: Right Side Panel ── */}
        {reviewEnabled && state === "ready" && activePanelTab ? (
          <CadReviewSidePanel
            activeTab={activePanelTab}
            onSelectTab={(tab) => setActivePanelTab(tab)}
            onClose={() => setActivePanelTab(null)}
            searchQuery={reviewSearchQuery}
            onSearchQueryChange={handleSearchQueryChange}
            searchResults={searchResults}
            onSelectSearchResult={(result) => {
              if (result.bounds) {
                void adapterRef.current?.zoomToBounds(result.bounds);
              }
            }}
            measurements={reviewItems
              .filter((item) => item.type === "distance" || item.type === "area" || item.type === "chain_distance")
              .map((item) => ({
                id: item.id,
                type: item.type,
                title: item.type === "distance" ? "Mesafe" : item.type === "area" ? "Alan" : "Zincir Mesafe",
                formattedValue:
                  item.type === "distance"
                    ? `${(item as { measuredLength: number }).measuredLength.toFixed(2)}`
                    : item.type === "area"
                    ? `${(item as { measuredArea: number }).measuredArea.toFixed(2)}`
                    : `${(item as { totalDistance: number }).totalDistance.toFixed(2)}`,
              }))}
            onDeleteMeasurement={(id) => reviewStoreRef.current?.removeItem(id)}
            comments={reviewItems.filter(
              (item) => item.type === "comment_pin" || item.type === "text" || item.type === "callout"
            ) as CadReviewItem[]}
            onStatusChange={(id, status) => reviewStoreRef.current?.updateItem(id, { status })}
            onDeleteComment={(id) => reviewStoreRef.current?.removeItem(id)}
            layers={layers.map((l) => ({ name: l.name, isVisible: l.visible }))}
            onToggleLayer={(name) => {
              const current = layers.find((l) => l.name === name);
              if (current) {
                handleToggleLayer(name, !current.visible);
              }
            }}
          />
        ) : null}
      </div>

      {/* ── CAD Review V1: Export Dialog ── */}
      {reviewEnabled && exportDialogOpen && reviewDocument ? (
        <CadExportDialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          document={reviewDocument}
          sourceFileName={displayName}
          originalFileUrl={accessUrl}
          getCanvasElement={() => {
            const vp = viewportRef.current;
            if (!vp) return null;
            return vp.querySelector("canvas") ?? null;
          }}
        />
      ) : null}

      {state === "ready" && snapPanelOpen ? (
        <CadSnapSettingsPanel
          settings={snapSettings}
          onChange={handleSnapSettingsChange}
          onClose={() => setSnapPanelOpen(false)}
        />
      ) : null}

      {state === "ready" && layerPanelOpen ? (
        <CadLayerPanel
          layers={layers}
          query={layerQuery}
          onQueryChange={setLayerQuery}
          onToggleLayer={handleToggleLayer}
          onIsolateLayer={handleIsolateLayer}
          onShowAll={handleShowAllLayers}
          onHideAll={handleHideAllLayers}
          onResetSource={handleResetLayers}
          onClose={() => setLayerPanelOpen(false)}
          triggerRef={layerButtonRef}
        />
      ) : null}

      {state === "ready" && viewPanelOpen ? (
        <CadViewSettingsPanel
          displayMode={displayMode}
          lineWeightVisible={lineWeightVisible}
          backgroundColor={backgroundColor}
          onSelectDisplayMode={selectDisplayMode}
          onToggleLineWeight={() => void toggleLineWeight()}
          onSelectBackgroundColor={selectBackgroundColor}
          onClose={() => setViewPanelOpen(false)}
        />
      ) : null}

      {state === "loading" ? (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/75 backdrop-blur-[2px]"
          data-testid="cad-loading-overlay"
        >
          <div className="pointer-events-auto flex max-w-xs flex-col items-center gap-2.5 rounded-xl border border-border/80 bg-card/95 p-4 text-center shadow-lg backdrop-blur-md">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div>
              <p
                className="text-xs font-semibold text-foreground"
                data-testid="cad-loading-phase-text"
              >
                {message}
              </p>
              <p
                className="mt-0.5 text-[11px] text-muted-foreground"
                data-testid="cad-loading-elapsed"
              >
                {elapsedSeconds > 0 ? `${elapsedSeconds} saniye geçti` : "Yükleniyor..."}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-1 h-7 text-[11px]"
              onClick={() => {
                abortControllerRef.current?.abort("USER_CANCELLED");
                setState("error");
                setMessage("Yükleme kullanıcı tarafından iptal edildi.");
              }}
              data-testid="cad-loading-cancel"
            >
              İptal Et
            </Button>
          </div>
        </div>
      ) : null}

      {state === "error" ? (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-background p-4"
          data-testid="cad-error-card"
        >
          <div className="flex max-w-md flex-col items-center gap-3 text-center">
            <AlertCircle className="h-7 w-7 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-foreground">CAD görünümü açılamadı</p>
              <p className="mt-1 text-xs text-muted-foreground" data-testid="cad-error-message">
                {message}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setState("loading");
                  setMessage("Yeniden başlatılıyor...");
                  setRetryKey((value) => value + 1);
                }}
                data-testid="cad-error-retry"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Tekrar dene
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    const link = document.createElement("a");
                    link.href = accessUrl;
                    link.download = displayName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                data-testid="cad-error-download"
              >
                <Download className="h-3.5 w-3.5" />
                Dosyayı indir
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CadUpstreamAdapter,
  CadUpstreamAdapterError,
  type CadUpstreamDisplayMode,
  type CadUpstreamTheme,
} from "@/lib/dokumantasyon/cad-upstream/adapter";
import { resolveCadUpstreamTimeoutMs } from "@/lib/dokumantasyon/dwg/runtime-policy";

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

let previousCadUpstreamTeardown: Promise<void> = Promise.resolve();

function resolveSiteTheme(): CadUpstreamTheme {
  if (typeof document === "undefined") return "dark";
  const root = document.documentElement;
  if (root.classList.contains("dark")) return "dark";
  if (root.classList.contains("light")) return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function failureReason(error: unknown): string {
  if (error instanceof CadUpstreamAdapterError) {
    return `${error.code}:${error.message}`;
  }
  return error instanceof Error ? `upstream-error:${error.message}` : "upstream-error:Bilinmeyen CAD hatası";
}

function CadDisplayControls({
  displayMode,
  lineWeightVisible,
  onSelectDisplayMode,
  onToggleLineWeight,
  compact = false,
}: {
  displayMode: CadUpstreamDisplayMode;
  lineWeightVisible: boolean;
  onSelectDisplayMode: (mode: CadUpstreamDisplayMode) => void;
  onToggleLineWeight: () => void;
  compact?: boolean;
}) {
  const buttonClass = compact
    ? "h-6 rounded-md px-2 text-[10px] font-medium"
    : "h-7 px-2 text-[11px]";

  return (
    <div
      className={
        compact
          ? "flex items-center gap-0.5 rounded-md border border-border/40 bg-background/30 p-0.5 text-muted-foreground backdrop-blur-sm"
          : "flex items-center gap-1 rounded-lg border border-border/70 bg-background/90 p-1 shadow-sm backdrop-blur"
      }
      data-cad-display-controls="true"
    >
      <Button
        type="button"
        size="sm"
        variant={displayMode === "source" ? "secondary" : "ghost"}
        className={`${buttonClass} ${displayMode === "source" ? "text-foreground" : "text-muted-foreground/70"}`}
        aria-pressed={displayMode === "source"}
        title="Gerçek Renk"
        onClick={() => onSelectDisplayMode("source")}
      >
        Gerçek Renk
      </Button>
      <Button
        type="button"
        size="sm"
        variant={displayMode === "monochrome" ? "secondary" : "ghost"}
        className={`${buttonClass} ${displayMode === "monochrome" ? "text-foreground" : "text-muted-foreground/70"}`}
        aria-pressed={displayMode === "monochrome"}
        title="Siyah-Beyaz"
        onClick={() => onSelectDisplayMode("monochrome")}
      >
        Siyah-Beyaz
      </Button>
      <span className="mx-0.5 h-3.5 w-px bg-border/60" aria-hidden="true" />
      <Button
        type="button"
        size="sm"
        variant={lineWeightVisible ? "secondary" : "ghost"}
        className={`${buttonClass} ${lineWeightVisible ? "text-foreground" : "text-muted-foreground/70"}`}
        aria-pressed={lineWeightVisible}
        title="Çizgi kalınlıklarını göster/gizle"
        onClick={onToggleLineWeight}
      >
        Lineweight
      </Button>
    </div>
  );
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
  const [state, setState] = useState<HostState>("loading");
  const [message, setMessage] = useState("MLightCAD hazırlanıyor");
  const [retryKey, setRetryKey] = useState(0);
  const [displayMode, setDisplayMode] = useState<CadUpstreamDisplayMode>("source");
  const [lineWeightVisible, setLineWeightVisible] = useState(false);
  const effectiveTimeoutMs = timeoutMs ?? resolveCadUpstreamTimeoutMs(sizeBytes);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const abortController = new AbortController();
    let cancelled = false;
    let timedOut = false;
    let adapter: CadUpstreamAdapter | null = null;
    let themeObserver: MutationObserver | null = null;
    let systemThemeQuery: MediaQueryList | null = null;
    let syncTheme: (() => void) | null = null;
    let timeoutId: number | null = null;

    const startup = previousCadUpstreamTeardown.then(async () => {
      if (cancelled) return;

      setState("loading");
      setMessage("MLightCAD hazırlanıyor");

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

        setMessage(extension.trim().toLowerCase().includes("dwg") ? "DWG açılıyor" : "DXF açılıyor");
        await createdAdapter.open({
          accessUrl,
          displayName,
          extension,
          signal: abortController.signal,
        });

        createdAdapter.setDisplayMode(displayModeRef.current, resolveSiteTheme());
        const initialLineWeight = createdAdapter.getLineWeightVisible();
        lineWeightVisibleRef.current = initialLineWeight;
        setLineWeightVisible(initialLineWeight);
      })();

      const deadline = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          timedOut = true;
          abortController.abort("CAD_UPSTREAM_TIMEOUT");
          reject(
            new CadUpstreamAdapterError(
              "open-timeout",
              `MLightCAD ${Math.round(effectiveTimeoutMs / 1000)} saniye içinde terminal sonuca ulaşamadı.`
            )
          );
        }, effectiveTimeoutMs);
      });

      try {
        await Promise.race([upstreamWork, deadline]);
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        timeoutId = null;
        if (cancelled || timedOut || abortController.signal.aborted) return;
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

        if (adapter) {
          if (adapterRef.current === adapter) adapterRef.current = null;
          await adapter.destroy().catch(() => {});
          adapter = null;
        }

        void upstreamWork.catch(() => undefined);

        if (cancelled || (abortController.signal.aborted && !timedOut)) return;

        const reason = failureReason(error);
        setState("error");
        setMessage(reason.split(":").slice(1).join(":") || "CAD görüntüleyici başlatılamadı.");
        onViewerFailure?.(reason);
      }
    });

    return () => {
      cancelled = true;
      abortController.abort("CAD_UPSTREAM_UNMOUNT");
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      themeObserver?.disconnect();
      if (systemThemeQuery && syncTheme) {
        systemThemeQuery.removeEventListener?.("change", syncTheme);
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
  }, [accessUrl, displayName, effectiveTimeoutMs, extension, fileId, retryKey, onReady, onViewerFailure]);

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

  const toolbarTarget =
    state === "ready" && typeof document !== "undefined"
      ? document.getElementById("cad-studio-toolbar-slot")
      : null;

  const displayControls = state === "ready" ? (
    <CadDisplayControls
      displayMode={displayMode}
      lineWeightVisible={lineWeightVisible}
      onSelectDisplayMode={selectDisplayMode}
      onToggleLineWeight={() => void toggleLineWeight()}
      compact={Boolean(toolbarTarget)}
    />
  ) : null;

  return (
    <section
      className="relative flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden bg-background"
      data-cad-upstream-host="true"
      data-file-id={fileId}
      data-cad-upstream-state={state}
      data-cad-color-mode={displayMode}
      data-cad-lineweight={lineWeightVisible ? "on" : "off"}
      data-cad-timeout-ms={effectiveTimeoutMs}
    >
      <div ref={viewportRef} className="absolute inset-0" aria-label={`${displayName} CAD görünümü`} />

      {displayControls && toolbarTarget
        ? createPortal(displayControls, toolbarTarget)
        : displayControls
          ? <div className="absolute left-3 top-3 z-20">{displayControls}</div>
          : null}

      {state === "loading" ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/72 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-card/90 px-3 py-2 text-xs text-muted-foreground shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{message}</span>
          </div>
        </div>
      ) : null}

      {state === "error" ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background p-4">
          <div className="flex max-w-md flex-col items-center gap-3 text-center">
            <AlertCircle className="h-7 w-7 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-foreground">CAD görünümü açılamadı</p>
              <p className="mt-1 text-xs text-muted-foreground">{message}</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => setRetryKey((value) => value + 1)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Tekrar dene
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

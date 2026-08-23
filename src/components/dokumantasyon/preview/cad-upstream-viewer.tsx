"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CadUpstreamAdapter,
  CadUpstreamAdapterError,
  type CadUpstreamTheme,
} from "@/lib/dokumantasyon/cad-upstream/adapter";

export interface DokCadUpstreamViewerProps {
  accessUrl: string;
  displayName: string;
  fileId: string;
  extension: string;
  sizeBytes: number;
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

export function DokCadUpstreamViewer({
  accessUrl,
  displayName,
  fileId,
  extension,
  onReady,
  onViewerFailure,
}: DokCadUpstreamViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<HostState>("loading");
  const [message, setMessage] = useState("MLightCAD hazırlanıyor");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const abortController = new AbortController();
    let cancelled = false;
    let adapter: CadUpstreamAdapter | null = null;
    let themeObserver: MutationObserver | null = null;
    let systemThemeQuery: MediaQueryList | null = null;
    let syncTheme: (() => void) | null = null;

    const startup = previousCadUpstreamTeardown.then(async () => {
      if (cancelled) return;

      setState("loading");
      setMessage("MLightCAD hazırlanıyor");

      try {
        setMessage("CAD worker dosyaları doğrulanıyor");
        adapter = await CadUpstreamAdapter.create({
          container: viewport,
          busyIndicatorHost: viewport,
          theme: resolveSiteTheme(),
        });

        if (cancelled) return;

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
        await adapter.open({
          accessUrl,
          displayName,
          extension,
          signal: abortController.signal,
        });

        if (cancelled) return;
        setState("ready");
        setMessage("");
        onReady?.();
      } catch (error) {
        themeObserver?.disconnect();
        if (systemThemeQuery && syncTheme) {
          systemThemeQuery.removeEventListener?.("change", syncTheme);
        }

        if (adapter) {
          await adapter.destroy().catch(() => {});
          adapter = null;
        }

        if (cancelled || abortController.signal.aborted) return;

        const reason = failureReason(error);
        setState("error");
        setMessage(reason.split(":").slice(1).join(":") || "CAD görüntüleyici başlatılamadı.");
        onViewerFailure?.(reason);
      }
    });

    return () => {
      cancelled = true;
      abortController.abort();
      themeObserver?.disconnect();
      if (systemThemeQuery && syncTheme) {
        systemThemeQuery.removeEventListener?.("change", syncTheme);
      }

      previousCadUpstreamTeardown = startup
        .catch(() => undefined)
        .then(async () => {
          if (adapter) {
            await adapter.destroy().catch(() => {});
            adapter = null;
          }
        });
    };
  }, [accessUrl, displayName, extension, fileId, retryKey, onReady, onViewerFailure]);

  return (
    <section
      className="relative flex min-h-[60vh] flex-1 overflow-hidden bg-background"
      data-cad-upstream-host="true"
      data-file-id={fileId}
    >
      <div ref={viewportRef} className="absolute inset-0" aria-label={`${displayName} CAD görünümü`} />

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

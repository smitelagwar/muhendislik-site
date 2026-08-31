"use client";

import * as React from "react";
import { Maximize2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CadUpstreamAdapter } from "@/lib/dokumantasyon/cad-upstream/adapter";
import type { CadRenderReadinessSnapshot } from "@/lib/dokumantasyon/cad-upstream/readiness";

type AdapterHost = HTMLElement & { __cadAdapter?: CadUpstreamAdapter };

type BlankCanvasIssue = {
  snapshot: CadRenderReadinessSnapshot;
  allLayersHidden: boolean;
  reasons: string[];
};

const INITIAL_CHECK_DELAY_MS = 700;
const CHECK_INTERVAL_MS = 1_250;

function resolveAdapter(anchor: HTMLElement): CadUpstreamAdapter | null {
  const workspace = anchor.closest<HTMLElement>('[data-cad-upstream-host="true"]');
  if (!workspace) return null;

  const direct = (workspace as AdapterHost).__cadAdapter;
  if (direct) return direct;

  const viewport = workspace.querySelector<HTMLElement>('[aria-label$="CAD görünümü"]');
  const viewportAdapter = viewport ? (viewport as AdapterHost).__cadAdapter : undefined;
  if (viewportAdapter) return viewportAdapter;

  for (const element of Array.from(workspace.querySelectorAll<HTMLElement>("div"))) {
    const adapter = (element as AdapterHost).__cadAdapter;
    if (adapter) return adapter;
  }
  return null;
}

function diagnoseBlankCanvas(adapter: CadUpstreamAdapter): BlankCanvasIssue | null {
  const snapshot = adapter.getRenderReadinessSnapshot();
  if (!snapshot?.isReady) return null;

  const layers = adapter.getLayers();
  const allLayersHidden = layers.length > 0 && layers.every((layer) => !layer.visible);
  const reasons: string[] = [];

  if (snapshot.entityCount <= 0) reasons.push("çizilebilir entity bulunamadı");
  if (!snapshot.hasFiniteBounds) reasons.push("çizim sınırları geçersiz");
  if (
    snapshot.viewport.width <= 1 ||
    snapshot.viewport.height <= 1 ||
    snapshot.viewport.clientWidth <= 1 ||
    snapshot.viewport.clientHeight <= 1
  ) {
    reasons.push("canvas boyutu geçersiz");
  }
  if (!snapshot.cameraValid) reasons.push("kamera merkezi geçersiz");
  if (snapshot.webglContextLost) reasons.push("WebGL bağlamı kayboldu");
  if (allLayersHidden) reasons.push("tüm katmanlar gizli");

  return reasons.length > 0 ? { snapshot, allLayersHidden, reasons } : null;
}

export function CadBlankCanvasRecovery({ onFitView }: { onFitView: () => void }) {
  const anchorRef = React.useRef<HTMLSpanElement>(null);
  const adapterRef = React.useRef<CadUpstreamAdapter | null>(null);
  const [issue, setIssue] = React.useState<BlankCanvasIssue | null>(null);

  const check = React.useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const adapter = adapterRef.current ?? resolveAdapter(anchor);
    if (!adapter) return;
    adapterRef.current = adapter;
    setIssue(diagnoseBlankCanvas(adapter));
  }, []);

  React.useEffect(() => {
    const startId = window.setTimeout(check, INITIAL_CHECK_DELAY_MS);
    const intervalId = window.setInterval(check, CHECK_INTERVAL_MS);
    return () => {
      window.clearTimeout(startId);
      window.clearInterval(intervalId);
    };
  }, [check]);

  const recover = React.useCallback(() => {
    const adapter = adapterRef.current;
    if (adapter && issue?.allLayersHidden) {
      adapter.showAllLayers();
    }
    onFitView();
    window.requestAnimationFrame(() => {
      onFitView();
      check();
    });
  }, [check, issue?.allLayersHidden, onFitView]);

  return (
    <>
      <span ref={anchorRef} className="sr-only" aria-hidden="true" data-cad-blank-recovery-anchor="true" />
      {issue ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-auto absolute left-1/2 top-[4.25rem] z-[70] flex max-w-[min(34rem,calc(100%_-_1rem))] -translate-x-1/2 items-center gap-3 rounded-xl border border-amber-500/35 bg-background/95 px-3 py-2.5 text-foreground shadow-xl backdrop-blur-xl"
          data-testid="cad-blank-canvas-recovery"
          data-cad-blank-reasons={issue.reasons.join("|")}
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">Çizim yüklendi ancak görünüm dışında olabilir.</p>
            <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">
              Görünümü ve katmanları güvenli biçimde yeniden hizalamayı deneyebilirsiniz.
            </p>
            <span className="sr-only">Tanı: {issue.reasons.join(", ")}</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 shrink-0 gap-1.5"
            onClick={recover}
            data-testid="cad-blank-canvas-fit"
          >
            <Maximize2 className="size-3.5" aria-hidden="true" />
            Ekrana Sığdır
          </Button>
        </div>
      ) : null}
    </>
  );
}

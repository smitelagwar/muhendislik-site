"use client";

import * as React from "react";
import { CheckCircle2, Crosshair, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  calculateCalibration,
  saveCadCalibration,
  type CadLengthUnit,
} from "@/lib/dokumantasyon/cad-review/units";
import type { CadPoint2d } from "@/lib/dokumantasyon/cad-review/schema";
import type { CadUpstreamAdapter } from "@/lib/dokumantasyon/cad-upstream/adapter";

export const CAD_START_CALIBRATION_EVENT = "cad:start-calibration";

type AdapterHost = HTMLElement & { __cadAdapter?: CadUpstreamAdapter };
type CalibrationPhase = "idle" | "first" | "second" | "input" | "saved" | "error";

function resolveCalibrationRuntime(): {
  host: HTMLElement;
  viewport: HTMLElement;
  adapter: CadUpstreamAdapter;
  fileId: string;
} | null {
  const host = document.querySelector<HTMLElement>('[data-cad-upstream-host="true"]');
  if (!host) return null;
  const viewport = host.querySelector<HTMLElement>('[aria-label$="CAD görünümü"]');
  if (!viewport) return null;
  const adapter = (host as AdapterHost).__cadAdapter ?? (viewport as AdapterHost).__cadAdapter;
  const fileId = host.getAttribute("data-file-id")?.trim() ?? "";
  if (!adapter || !fileId || !adapter.isReady()) return null;
  return { host, viewport, adapter, fileId };
}

export function CadCalibrationOverlay() {
  const [phase, setPhase] = React.useState<CalibrationPhase>("idle");
  const [firstPoint, setFirstPoint] = React.useState<CadPoint2d | null>(null);
  const [secondPoint, setSecondPoint] = React.useState<CadPoint2d | null>(null);
  const [knownDistance, setKnownDistance] = React.useState("50");
  const [unit, setUnit] = React.useState<CadLengthUnit>("cm");
  const [error, setError] = React.useState<string | null>(null);
  const runtimeRef = React.useRef<ReturnType<typeof resolveCalibrationRuntime>>(null);
  const savedTimerRef = React.useRef<number | null>(null);

  const finish = React.useCallback(() => {
    runtimeRef.current?.adapter.setCameraInteractionEnabled(true);
    runtimeRef.current = null;
    setPhase("idle");
    setFirstPoint(null);
    setSecondPoint(null);
    setError(null);
  }, []);

  React.useEffect(() => {
    const start = () => {
      if (savedTimerRef.current !== null) window.clearTimeout(savedTimerRef.current);
      const runtime = resolveCalibrationRuntime();
      if (!runtime) {
        setError("Kalibrasyon için hazır bir CAD görünümü bulunamadı.");
        setPhase("error");
        return;
      }
      runtimeRef.current = runtime;
      runtime.adapter.setCameraInteractionEnabled(false);
      setFirstPoint(null);
      setSecondPoint(null);
      setKnownDistance("50");
      setUnit("cm");
      setError(null);
      setPhase("first");
    };

    window.addEventListener(CAD_START_CALIBRATION_EVENT, start);
    return () => {
      window.removeEventListener(CAD_START_CALIBRATION_EVENT, start);
      if (savedTimerRef.current !== null) window.clearTimeout(savedTimerRef.current);
      runtimeRef.current?.adapter.setCameraInteractionEnabled(true);
    };
  }, []);

  React.useEffect(() => {
    if (phase !== "first" && phase !== "second") return;
    const runtime = runtimeRef.current;
    if (!runtime) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button > 0) return;
      const rect = runtime.viewport.getBoundingClientRect();
      const point = runtime.adapter.screenToWorldPoint({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
      if (!point) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (phase === "first") {
        setFirstPoint({ x: point.x, y: point.y });
        setPhase("second");
        return;
      }

      if (!firstPoint) {
        setPhase("first");
        return;
      }
      const candidate = { x: point.x, y: point.y };
      if (Math.hypot(candidate.x - firstPoint.x, candidate.y - firstPoint.y) <= 1e-9) {
        setError("İkinci nokta ilk noktadan farklı olmalıdır.");
        return;
      }
      setSecondPoint(candidate);
      setError(null);
      setPhase("input");
    };

    runtime.viewport.addEventListener("pointerdown", handlePointerDown, true);
    return () => runtime.viewport.removeEventListener("pointerdown", handlePointerDown, true);
  }, [firstPoint, phase]);

  React.useEffect(() => {
    if (phase === "idle") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      finish();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [finish, phase]);

  const applyCalibration = React.useCallback(() => {
    const runtime = runtimeRef.current;
    if (!runtime || !firstPoint || !secondPoint) return;
    const distance = Number(knownDistance.trim().replace(",", "."));
    if (!Number.isFinite(distance) || distance <= 0) {
      setError("Gerçek mesafe sıfırdan büyük bir sayı olmalıdır.");
      return;
    }

    try {
      const calibration = calculateCalibration(firstPoint, secondPoint, distance, unit);
      saveCadCalibration(runtime.fileId, calibration);
      runtime.adapter.setCameraInteractionEnabled(true);
      setError(null);
      setPhase("saved");
      savedTimerRef.current = window.setTimeout(finish, 1600);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kalibrasyon kaydedilemedi.");
    }
  }, [finish, firstPoint, knownDistance, secondPoint, unit]);

  if (phase === "idle") return null;

  const instruction =
    phase === "first"
      ? "Kalibrasyon referansının 1. noktasını seçin."
      : phase === "second"
        ? "Kalibrasyon referansının 2. noktasını seçin."
        : null;

  return (
    <div
      className="pointer-events-auto absolute left-1/2 top-[4.25rem] z-[95] w-[min(28rem,calc(100%_-_1rem))] -translate-x-1/2 rounded-xl border border-border/90 bg-background/97 p-3 text-foreground shadow-2xl backdrop-blur-xl"
      data-testid="cad-calibration-overlay"
      data-cad-calibration-phase={phase}
      role={phase === "input" ? "dialog" : "status"}
      aria-live="polite"
      aria-label="CAD ölçüm kalibrasyonu"
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {phase === "saved" ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <Crosshair className="size-4" aria-hidden="true" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold">Ölçüm Kalibrasyonu</div>
          {instruction ? <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{instruction}</p> : null}
          {phase === "input" ? (
            <div className="mt-2 space-y-2" data-testid="cad-calibration-distance-form">
              <p className="text-[11px] leading-4 text-muted-foreground">
                Seçtiğiniz iki nokta arasındaki gerçek mesafeyi girin.
              </p>
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  inputMode="decimal"
                  value={knownDistance}
                  onChange={(event) => setKnownDistance(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      applyCalibration();
                    }
                  }}
                  aria-label="Gerçek kalibrasyon mesafesi"
                  className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  data-testid="cad-calibration-distance"
                />
                <select
                  value={unit}
                  onChange={(event) => setUnit(event.target.value as CadLengthUnit)}
                  aria-label="Kalibrasyon mesafe birimi"
                  className="h-9 rounded-md border border-border bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  data-testid="cad-calibration-unit"
                >
                  <option value="mm">mm</option>
                  <option value="cm">cm</option>
                  <option value="m">m</option>
                </select>
                <Button type="button" size="sm" className="h-9" onClick={applyCalibration} data-testid="cad-calibration-apply">
                  Uygula
                </Button>
              </div>
            </div>
          ) : null}
          {phase === "saved" ? (
            <p className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400" data-testid="cad-calibration-saved">
              Kalibrasyon kaydedildi. Mesafe ve alan sonuçları yeni ölçeği kullanıyor.
            </p>
          ) : null}
          {phase === "error" || error ? (
            <p className="mt-1 text-[11px] text-destructive" role="alert" data-testid="cad-calibration-error">
              {error}
            </p>
          ) : null}
        </div>
        <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" onClick={finish} aria-label="Kalibrasyonu iptal et" data-testid="cad-calibration-cancel">
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

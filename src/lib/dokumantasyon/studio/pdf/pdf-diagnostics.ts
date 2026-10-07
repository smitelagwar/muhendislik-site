import { PDFJS_VERSION } from "../../../pdfjs-paths";
import { pdfStats } from "./pdf-debug-stats";

export interface PdfDiagnosticError {
  t: number;
  kind: string;
  msg: string;
}

export interface PdfDiagnostics {
  at: string;
  app: { build: string | undefined; engine: "v3" | "v4" };
  pdfjs: {
    version: string;
    build: "legacy";
    polyfills: Record<string, boolean>;
    canary: { ok: boolean; ink: number } | null;
  };
  device: {
    ua: string;
    dpr: number;
    screen: [number, number];
    coarse: boolean;
    deviceMemory?: number;
    cores: number;
    touchPoints: number;
    online: boolean;
    saveData?: boolean;
    effectiveType?: string;
  };
  doc: {
    numPages?: number;
    sizeBytes?: number;
    mode?: "full" | "range";
    rotation?: number;
    scale?: number;
    mountedPages?: number;
  };
  memory: {
    sharpMB?: number;
    backdropMB?: number;
    jsHeapMB?: number;
    allocFailures: number;
  };
  errors: PdfDiagnosticError[];
  perf: { longTasksLast60s: number; maxFrameGapMs?: number };
}

const MAX_ERRORS = 20;
const errorRingBuffer: PdfDiagnosticError[] = [];

/** URL'leri ve token parametrelerini temizler (W6 gizlilik kuralı). */
export function sanitizeErrorMsg(msg: string): string {
  if (!msg) return "";
  return msg
    .replace(/https?:\/\/[^\s"'<>]+/gi, "[URL]")
    .replace(/(token|auth|key|secret|password)=[^&\s"'<>]+/gi, "$1=[REDACTED]")
    .slice(0, 300);
}

/** Halka tamponuna hata kaydeder (maksimum 20). */
export function recordPdfError(kind: string, err: unknown, extra?: string): void {
  const rawMsg =
    err instanceof Error
      ? `${err.name}: ${err.message}${extra ? " | " + extra : ""}`
      : typeof err === "string"
      ? err
      : JSON.stringify(err);

  const sanitized = sanitizeErrorMsg(rawMsg);
  errorRingBuffer.push({
    t: Date.now(),
    kind,
    msg: sanitized,
  });

  if (errorRingBuffer.length > MAX_ERRORS) {
    errorRingBuffer.shift();
  }
}

/** Kayıtlı hataları döndürür (testler veya analiz için). */
export function getPdfErrors(): readonly PdfDiagnosticError[] {
  return [...errorRingBuffer];
}

/** Hata tamponunu temizler. */
export function clearPdfErrors(): void {
  errorRingBuffer.length = 0;
}

/** Cihaz ve görüntüleyici tanılama paketini üretir. */
export function collectPdfDiagnostics(customDoc?: Partial<PdfDiagnostics["doc"]>): PdfDiagnostics {
  const isClient = typeof window !== "undefined";
  const nav = isClient ? (navigator as any) : null;
  const conn = nav?.connection;

  const canaryRaw = pdfStats.get("canary");
  let canaryParsed: { ok: boolean; ink: number } | null = null;
  if (typeof canaryRaw === "string") {
    if (canaryRaw === "ok") canaryParsed = { ok: true, ink: 3000 };
    else if (canaryRaw.startsWith("FAIL:")) {
      const parts = canaryRaw.split(":");
      canaryParsed = { ok: false, ink: Number(parts[1]) || 0 };
    }
  }

  const polyfills = isClient && (window as any).__dokPdfPolyfills
    ? (window as any).__dokPdfPolyfills
    : {
        withResolvers: typeof (Promise as any).withResolvers === "function",
        transfer: typeof (ArrayBuffer.prototype as any).transfer === "function",
        bytes: typeof (Uint8Array as any).fromBase64 === "function",
      };

  return {
    at: new Date().toISOString(),
    app: {
      build: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.1",
      engine: (isClient && (window as any).__dokPdfEngine) || "v3",
    },
    pdfjs: {
      version: PDFJS_VERSION,
      build: "legacy",
      polyfills,
      canary: canaryParsed,
    },
    device: {
      ua: nav?.userAgent ?? "SSR",
      dpr: isClient ? window.devicePixelRatio || 1 : 1,
      screen: isClient ? [window.screen.width, window.screen.height] : [0, 0],
      coarse: isClient ? window.matchMedia?.("(pointer: coarse)").matches ?? false : false,
      deviceMemory: nav?.deviceMemory,
      cores: nav?.hardwareConcurrency ?? 1,
      touchPoints: nav?.maxTouchPoints ?? 0,
      online: nav?.onLine ?? true,
      saveData: conn?.saveData,
      effectiveType: conn?.effectiveType,
    },
    doc: {
      numPages: customDoc?.numPages,
      sizeBytes: customDoc?.sizeBytes,
      mode: customDoc?.mode ?? "full",
      rotation: customDoc?.rotation ?? 0,
      scale: customDoc?.scale,
      mountedPages: customDoc?.mountedPages,
    },
    memory: {
      allocFailures: 0,
      jsHeapMB: isClient && (performance as any)?.memory
        ? Math.round((performance as any).memory.usedJSHeapSize / 1048576)
        : undefined,
    },
    errors: [...errorRingBuffer],
    perf: {
      longTasksLast60s: 0,
    },
  };
}

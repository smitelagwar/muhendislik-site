"use client";

// ============================================================================
// CAD RUNTIME PERFORMANCE TELEMETRY
// İzole, bellek-sınırlandırılmış, motor davranışına sıfır etkisi olan ölçüm modülü
// ============================================================================

export interface CadPerfPhaseMetric {
  name: string;
  durationMs: number;
  startTime: number;
}

export interface CadLongTaskEntry {
  startTime: number;
  durationMs: number;
}

export interface CadPerfReport {
  sessionId: string;
  timestamp: string;
  phases: Record<string, number>;
  longTasks: CadLongTaskEntry[];
  totalTimeToReadyMs: number | null;
  memoryEstimate?: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
  };
}

const MAX_LONG_TASKS = 50;
const recordedPhases = new Map<string, number>();
const longTasks: CadLongTaskEntry[] = [];
let observerInitialized = false;
let currentSessionId = "";
let sessionStartTime = 0;
let timeToReady: number | null = null;

function isPerfSupported(): boolean {
  return typeof window !== "undefined" && typeof performance !== "undefined" && typeof performance.mark === "function";
}

export function initCadPerfSession(sessionId: string): void {
  currentSessionId = sessionId;
  sessionStartTime = isPerfSupported() ? performance.now() : Date.now();
  timeToReady = null;
  recordedPhases.clear();
  longTasks.length = 0;

  if (isPerfSupported()) {
    try {
      performance.clearMarks();
      performance.clearMeasures();
    } catch {}
  }

  setupLongTaskObserver();
}

function setupLongTaskObserver(): void {
  if (observerInitialized || typeof window === "undefined" || typeof PerformanceObserver === "undefined") return;

  try {
    const supported = PerformanceObserver.supportedEntryTypes;
    if (!supported || !supported.includes("longtask")) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration >= 50 && longTasks.length < MAX_LONG_TASKS) {
          longTasks.push({
            startTime: Math.round(entry.startTime),
            durationMs: Math.round(entry.duration),
          });
        }
      }
    });

    observer.observe({ type: "longtask", buffered: true });
    observerInitialized = true;
  } catch {
    // PerformanceObserver longtask failure is non-fatal
  }
}

export function startCadPerfPhase(phase: string): void {
  if (!isPerfSupported()) return;
  try {
    performance.mark(`cad:${phase}:start`);
  } catch {}
}

export function endCadPerfPhase(phase: string): number {
  if (!isPerfSupported()) return 0;
  const startMark = `cad:${phase}:start`;
  const endMark = `cad:${phase}:end`;
  const measureName = `cad:${phase}`;

  try {
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);

    const entries = performance.getEntriesByName(measureName);
    const lastEntry = entries[entries.length - 1];
    const duration = lastEntry ? Math.round(lastEntry.duration * 100) / 100 : 0;
    recordedPhases.set(phase, duration);

    // Clean up measurement entries to avoid memory growth
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);

    return duration;
  } catch {
    return 0;
  }
}

export function markCadPerfReady(): void {
  if (isPerfSupported()) {
    timeToReady = Math.round((performance.now() - sessionStartTime) * 100) / 100;
  } else {
    timeToReady = Date.now() - sessionStartTime;
  }
  recordedPhases.set("total-to-ready", timeToReady);

  if (typeof window !== "undefined") {
    (window as unknown as { __cadPerfReport?: CadPerfReport }).__cadPerfReport = getCadPerfReport();
  }
}

export function getCadPerfReport(): CadPerfReport {
  const phasesObj: Record<string, number> = {};
  for (const [k, v] of recordedPhases.entries()) {
    phasesObj[k] = v;
  }

  const report: CadPerfReport = {
    sessionId: currentSessionId || "default",
    timestamp: new Date().toISOString(),
    phases: phasesObj,
    longTasks: [...longTasks],
    totalTimeToReadyMs: timeToReady,
  };

  if (typeof window !== "undefined" && "memory" in performance) {
    const mem = (performance as unknown as { memory?: { usedJSHeapSize?: number; totalJSHeapSize?: number } }).memory;
    if (mem) {
      report.memoryEstimate = {
        usedJSHeapSize: mem.usedJSHeapSize,
        totalJSHeapSize: mem.totalJSHeapSize,
      };
    }
  }

  return report;
}

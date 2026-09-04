/**
 * Feature flag configuration for CAD Runtime.
 *
 * For Stage 9:
 * `CAD_MTEXT_WORKER_EXPERIMENT`: defaults to `false`.
 * Production baseline remains `useMainThreadDraw: true`.
 */

export function isCadMtextWorkerExperimentEnabled(): boolean {
  if (
    typeof process !== "undefined" &&
    (process.env.NEXT_PUBLIC_CAD_MTEXT_WORKER_EXPERIMENT === "1" ||
      process.env.CAD_MTEXT_WORKER_EXPERIMENT === "1")
  ) {
    return true;
  }

  if (typeof window !== "undefined") {
    const win = window as unknown as {
      __CAD_MTEXT_WORKER_EXPERIMENT?: boolean;
      sessionStorage?: Storage;
      location?: Location;
    };

    if (win.__CAD_MTEXT_WORKER_EXPERIMENT === true) {
      return true;
    }

    try {
      if (win.sessionStorage?.getItem("CAD_MTEXT_WORKER_EXPERIMENT") === "1") {
        return true;
      }
      if (
        win.location?.search &&
        new URLSearchParams(win.location.search).get("mtextWorker") === "1"
      ) {
        return true;
      }
    } catch {
      // Ignore sessionStorage/location access restrictions
    }
  }

  return false;
}

export const CAD_STUDIO_UI_PREFERENCES_KEY = "muhendislik-site:cad-studio-ui:v1";

export type CadStudioSidePanelPreference = "search" | "measurements" | "comments" | "layers" | null;

export interface CadStudioUiPreferences {
  displayMode: "source" | "monochrome";
  backgroundColor: "autocad" | "black" | "white";
  lineWeightVisible: boolean;
  sidePanel: CadStudioSidePanelPreference;
  recentColors: string[];
}

const DEFAULT_PREFERENCES: CadStudioUiPreferences = {
  displayMode: "source",
  backgroundColor: "autocad",
  lineWeightVisible: false,
  sidePanel: null,
  recentColors: [],
};

function validColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

export function loadCadStudioUiPreferences(storage?: Storage | null): CadStudioUiPreferences {
  if (!storage) return { ...DEFAULT_PREFERENCES };
  try {
    const parsed = JSON.parse(storage.getItem(CAD_STUDIO_UI_PREFERENCES_KEY) || "{}") as Partial<CadStudioUiPreferences>;
    return {
      displayMode: parsed.displayMode === "monochrome" ? "monochrome" : "source",
      backgroundColor:
        parsed.backgroundColor === "black" || parsed.backgroundColor === "white"
          ? parsed.backgroundColor
          : "autocad",
      lineWeightVisible: parsed.lineWeightVisible === true,
      sidePanel:
        parsed.sidePanel === "search" ||
        parsed.sidePanel === "measurements" ||
        parsed.sidePanel === "comments" ||
        parsed.sidePanel === "layers"
          ? parsed.sidePanel
          : null,
      recentColors: Array.isArray(parsed.recentColors)
        ? parsed.recentColors.filter(validColor).slice(0, 5)
        : [],
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function saveCadStudioUiPreferences(
  patch: Partial<CadStudioUiPreferences>,
  storage?: Storage | null
): CadStudioUiPreferences {
  const current = loadCadStudioUiPreferences(storage);
  const next = { ...current, ...patch };
  if (storage) {
    try {
      storage.setItem(CAD_STUDIO_UI_PREFERENCES_KEY, JSON.stringify(next));
    } catch {
      // UI preferences are best-effort; review recovery uses its own durable key.
    }
  }
  return next;
}

let bridgeInstalled = false;
let restoreApplied = false;

/**
 * Stage 5 compatibility bridge for the existing viewer state ownership.
 * It persists only explicitly allowed UI preferences and restores them through
 * the same public Ribbon controls; active tool, hover, draft geometry and
 * popover state are deliberately never observed or written.
 */
export function installCadStudioUiPreferencesBridge(): void {
  if (bridgeInstalled || typeof window === "undefined" || typeof document === "undefined") return;
  bridgeInstalled = true;

  const storage = (() => {
    try { return window.localStorage; } catch { return null; }
  })();
  if (!storage) return;

  const updateFromClick = (event: Event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLElement>("[data-testid]");
    const testId = button?.dataset.testid;
    if (!testId) return;

    if (testId === "cad-display-source") saveCadStudioUiPreferences({ displayMode: "source" }, storage);
    if (testId === "cad-display-monochrome") saveCadStudioUiPreferences({ displayMode: "monochrome" }, storage);
    if (testId === "cad-display-lineweight") {
      const current = loadCadStudioUiPreferences(storage);
      saveCadStudioUiPreferences({ lineWeightVisible: !current.lineWeightVisible }, storage);
    }
    if (testId === "cad-bg-autocad") saveCadStudioUiPreferences({ backgroundColor: "autocad" }, storage);
    if (testId === "cad-bg-black") saveCadStudioUiPreferences({ backgroundColor: "black" }, storage);
    if (testId === "cad-bg-white") saveCadStudioUiPreferences({ backgroundColor: "white" }, storage);
    if (testId === "cad-tool-search-panel") saveCadStudioUiPreferences({ sidePanel: "search" }, storage);
    if (testId === "cad-tool-measurements-panel") saveCadStudioUiPreferences({ sidePanel: "measurements" }, storage);
    if (testId === "cad-tool-comments-panel") saveCadStudioUiPreferences({ sidePanel: "comments" }, storage);
    if (testId === "cad-tool-layers") saveCadStudioUiPreferences({ sidePanel: "layers" }, storage);

    const color = button.getAttribute("data-cad-color");
    if (validColor(color)) {
      const current = loadCadStudioUiPreferences(storage);
      saveCadStudioUiPreferences(
        { recentColors: [color.toUpperCase(), ...current.recentColors.filter((item) => item.toUpperCase() !== color.toUpperCase())].slice(0, 5) },
        storage
      );
    }
  };

  const updateFromChange = (event: Event) => {
    const input = event.target as HTMLInputElement | null;
    if (input?.type !== "color" || !validColor(input.value)) return;
    const current = loadCadStudioUiPreferences(storage);
    saveCadStudioUiPreferences(
      { recentColors: [input.value.toUpperCase(), ...current.recentColors.filter((item) => item.toUpperCase() !== input.value.toUpperCase())].slice(0, 5) },
      storage
    );
  };

  document.addEventListener("click", updateFromClick, true);
  document.addEventListener("change", updateFromChange, true);

  const restore = () => {
    if (restoreApplied) return;
    const ribbon = document.querySelector('[data-testid="cad-studio-ribbon"]');
    if (!ribbon) return;
    restoreApplied = true;
    const preferences = loadCadStudioUiPreferences(storage);

    const clickIfInactive = (testId: string) => {
      const button = document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);
      if (button && button.dataset.cadActive !== "true") button.click();
    };

    clickIfInactive(preferences.displayMode === "monochrome" ? "cad-display-monochrome" : "cad-display-source");
    const lineWeight = document.querySelector<HTMLElement>('[data-testid="cad-display-lineweight"]');
    if (lineWeight && (lineWeight.dataset.cadActive === "true") !== preferences.lineWeightVisible) lineWeight.click();

    if (preferences.sidePanel) {
      const panelTestId =
        preferences.sidePanel === "search"
          ? "cad-tool-search-panel"
          : preferences.sidePanel === "measurements"
            ? "cad-tool-measurements-panel"
            : preferences.sidePanel === "comments"
              ? "cad-tool-comments-panel"
              : "cad-tool-layers";
      clickIfInactive(panelTestId);
    }

    if (preferences.backgroundColor !== "autocad") {
      document.querySelector<HTMLElement>('[data-testid="cad-tool-view-settings"]')?.click();
      window.setTimeout(() => {
        document.querySelector<HTMLElement>(`[data-testid="cad-bg-${preferences.backgroundColor}"]`)?.click();
      }, 0);
    }
  };

  restore();
  const observer = new MutationObserver(restore);
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

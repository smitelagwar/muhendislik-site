import type { SaveState } from "./persistence";

const STYLE_ID = "cad-stage5-save-state-style";

function labelFor(state: SaveState): string {
  if (state.status === "clean") return state.savedAt ? "Sunucuya kaydedildi" : "Sunucu ile senkron";
  if (state.status === "saving") return "Sunucuya kaydediliyor";
  if (state.status === "dirty") return "Yerelde kaydedildi";
  return "Yerelde kaydedildi · Sunucu hatası";
}

function installStyle(): void {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
[data-testid="cad-save-status"] > span:last-child { font-size: 0 !important; }
[data-testid="cad-save-status"] > span:last-child::after { font-size: 10px; }
html[data-cad-review-save-state="clean"] [data-testid="cad-save-status"] > span:last-child::after { content: "Sunucuya kaydedildi"; }
html[data-cad-review-save-state="saving"] [data-testid="cad-save-status"] > span:last-child::after { content: "Sunucuya kaydediliyor"; }
html[data-cad-review-save-state="dirty"] [data-testid="cad-save-status"] > span:last-child::after { content: "Yerelde kaydedildi"; }
html[data-cad-review-save-state="error"] [data-testid="cad-save-status"] > span:last-child::after { content: "Yerelde kaydedildi · Sunucu hatası"; }
html[data-cad-review-save-state="error"] [data-testid="cad-save-status"] > span:first-child { background-color: rgb(239 68 68) !important; }
`;
  document.head.appendChild(style);
}

let observer: MutationObserver | null = null;
let currentState: SaveState = { status: "dirty" };

function apply(): void {
  if (typeof document === "undefined") return;
  installStyle();
  document.documentElement.dataset.cadReviewSaveState = currentState.status;
  const indicator = document.querySelector<HTMLElement>('[data-testid="cad-save-status"]');
  if (!indicator) return;
  indicator.setAttribute("aria-label", labelFor(currentState));
  indicator.dataset.cadSaveState = currentState.status;
  if (currentState.status === "error") indicator.title = currentState.message;
  else if (currentState.status === "clean" && currentState.savedAt) indicator.title = `Sunucu kaydı: ${currentState.savedAt}`;
  else indicator.removeAttribute("title");
}

export function applyCadReviewSaveStateToRibbon(state: SaveState): void {
  currentState = state;
  if (typeof document === "undefined") return;
  apply();
  if (!observer) {
    observer = new MutationObserver(() => apply());
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  }
}

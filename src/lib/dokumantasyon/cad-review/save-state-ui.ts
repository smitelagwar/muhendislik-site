import type { SaveState } from "./persistence";

const STYLE_ID = "cad-stage5-save-state-style";
export const CAD_REVIEW_SAVE_RETRY_EVENT = "cad:review-save-retry";

function labelFor(state: SaveState): string {
  if (state.status === "clean") return "Sunucuya kaydedildi";
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
html[data-cad-review-save-state="clean"] [data-testid="cad-save-status"] > span:first-child { background-color: rgb(16 185 129) !important; }
html[data-cad-review-save-state="saving"] [data-testid="cad-save-status"] > span:first-child,
html[data-cad-review-save-state="dirty"] [data-testid="cad-save-status"] > span:first-child { background-color: rgb(245 158 11) !important; }
html[data-cad-review-save-state="error"] [data-testid="cad-save-status"] > span:first-child { background-color: rgb(239 68 68) !important; }
html[data-cad-review-save-state="error"] [data-testid="cad-save-status"] { cursor: pointer; }
html[data-cad-review-save-state="error"] [data-testid="cad-save-status"]:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
`;
  document.head.appendChild(style);
}

let observer: MutationObserver | null = null;
let retryInteractionInstalled = false;
let currentState: SaveState = { status: "dirty" };

function requestRetry(): void {
  if (currentState.status !== "error" || typeof window === "undefined") return;
  window.dispatchEvent(new Event(CAD_REVIEW_SAVE_RETRY_EVENT));
}

function installRetryInteraction(): void {
  if (retryInteractionInstalled || typeof document === "undefined") return;
  retryInteractionInstalled = true;

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('[data-testid="cad-save-status"]')) return;
    requestRetry();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = event.target as HTMLElement | null;
    if (!target?.closest('[data-testid="cad-save-status"]')) return;
    if (currentState.status !== "error") return;
    event.preventDefault();
    requestRetry();
  });
}

function apply(): void {
  if (typeof document === "undefined") return;
  installStyle();
  installRetryInteraction();
  document.documentElement.dataset.cadReviewSaveState = currentState.status;
  const indicator = document.querySelector<HTMLElement>('[data-testid="cad-save-status"]');
  if (!indicator) return;

  const label = labelFor(currentState);
  indicator.setAttribute("aria-label", label);
  indicator.dataset.cadSaveState = currentState.status;

  if (currentState.status === "error") {
    indicator.setAttribute("role", "button");
    indicator.tabIndex = 0;
    indicator.dataset.cadSaveRetry = "true";
    indicator.title = `${currentState.message} Tekrar denemek için tıklayın.`;
  } else {
    indicator.removeAttribute("role");
    indicator.removeAttribute("tabindex");
    delete indicator.dataset.cadSaveRetry;
    if (currentState.status === "clean" && currentState.savedAt) {
      indicator.title = `Sunucu kaydı: ${currentState.savedAt}`;
    } else {
      indicator.removeAttribute("title");
    }
  }
}

export function applyCadReviewSaveStateToRibbon(state: SaveState): void {
  currentState = state;
  if (typeof document === "undefined") return;
  apply();
  if (!observer) {
    observer = new MutationObserver(() => apply());
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "aria-label"],
    });
  }
}

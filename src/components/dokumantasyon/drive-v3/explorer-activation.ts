export const MOBILE_EXPLORER_QUERY = "(max-width: 1023px)";

export type ItemActivationSource = "body" | "name" | "double" | "context" | "select-control";
export type ExplorerAction = "open" | "link" | "toggle" | "desktop-select" | "desktop-context" | "ignore";

/** Liste ve kartın bütün açma/seçme yolları aynı sözleşmeyi kullanır. */
export function resolveExplorerActivation({
  source,
  mobile,
  selectionMode,
  pointerType,
}: {
  source: ItemActivationSource;
  mobile: boolean;
  selectionMode: boolean;
  pointerType: string;
}): ExplorerAction {
  if (source === "context") {
    return !mobile && pointerType === "mouse" ? "desktop-context" : "ignore";
  }
  if (source === "double") {
    return !mobile && pointerType === "mouse" ? "open" : "ignore";
  }
  if (source === "select-control") {
    return !mobile || selectionMode ? "toggle" : "ignore";
  }
  if (mobile && selectionMode) return "toggle";
  if (source === "name") return "link";
  return mobile ? "open" : "desktop-select";
}

export const CAD_VIEWPORT_ROOT_RESIZED_EVENT = "cad:viewport-root-resized";

export interface CadViewportRootSize {
  width: number;
  height: number;
}

function readSize(root: HTMLElement): CadViewportRootSize {
  const rect = root.getBoundingClientRect();
  return {
    width: Math.max(0, rect.width),
    height: Math.max(0, rect.height),
  };
}

function dispatchSize(root: HTMLElement, size: CadViewportRootSize): void {
  root.dataset.cadViewportRoot = "true";
  root.style.setProperty("--cad-viewport-width", `${size.width}px`);
  root.style.setProperty("--cad-viewport-height", `${size.height}px`);

  if (typeof window !== "undefined" && typeof CustomEvent !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<CadViewportRootSize>(CAD_VIEWPORT_ROOT_RESIZED_EVENT, {
        detail: size,
      })
    );
  }
}

/**
 * Makes the actual canvas/overlay parent the single sizing coordinate root.
 * All overlay renderers subscribe to this event, while pan/zoom still uses the
 * adapter's viewChanged event. This keeps resize, pan and zoom in one origin.
 */
export function observeCadViewportRoot(
  root: HTMLElement,
  onSize?: (size: CadViewportRootSize) => void
): () => void {
  let lastWidth = -1;
  let lastHeight = -1;

  const emit = () => {
    const size = readSize(root);
    if (size.width === lastWidth && size.height === lastHeight) return;
    lastWidth = size.width;
    lastHeight = size.height;
    onSize?.(size);
    dispatchSize(root, size);
  };

  emit();

  if (typeof ResizeObserver === "undefined") {
    const handleResize = () => emit();
    if (typeof window !== "undefined") window.addEventListener("resize", handleResize);
    return () => {
      if (typeof window !== "undefined") window.removeEventListener("resize", handleResize);
    };
  }

  const observer = new ResizeObserver(emit);
  observer.observe(root);
  return () => observer.disconnect();
}

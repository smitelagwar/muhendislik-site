export interface CadShortcutHandlers {
  onEscape?: () => void;
  onEnter?: () => void;
  onDelete?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSearch?: () => void;
}

export function isInputElement(element: EventTarget | null): boolean {
  if (!element) return false;
  if (typeof HTMLElement !== "undefined" && !(element instanceof HTMLElement)) {
    return false;
  }
  const el = element as { tagName?: string; isContentEditable?: boolean };
  const tagName = el.tagName ? String(el.tagName).toLowerCase() : "";
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    Boolean(el.isContentEditable)
  );
}


export function attachCadReviewKeyboardShortcuts(
  handlers: CadShortcutHandlers
): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    // If the user is typing inside an input/textarea, do not intercept CAD canvas shortcuts
    // except Escape which may blur the input
    const isInput = isInputElement(e.target);

    if (e.key === "Escape") {
      handlers.onEscape?.();
      return;
    }

    if (isInput) {
      return;
    }

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    if (e.key === "Enter") {
      handlers.onEnter?.();
      return;
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      handlers.onDelete?.();
      return;
    }

    if (isCtrlOrCmd && !e.shiftKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      handlers.onUndo?.();
      return;
    }

    if (
      (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === "z") ||
      (isCtrlOrCmd && e.key.toLowerCase() === "y")
    ) {
      e.preventDefault();
      handlers.onRedo?.();
      return;
    }

    if ((isCtrlOrCmd && e.key.toLowerCase() === "f") || e.key === "/") {
      e.preventDefault();
      handlers.onSearch?.();
      return;
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}

/**
 * Traps Tab focus inside a container element for accessible modals / drawers (WCAG 2.1 Focus Order).
 */
export function setupFocusTrap(container: HTMLElement): () => void {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter((el) => el.offsetParent !== null); // visible elements only

    if (focusableElements.length === 0) {
      e.preventDefault();
      return;
    }

    const firstElement = focusableElements[0]!;
    const lastElement = focusableElements[focusableElements.length - 1]!;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}
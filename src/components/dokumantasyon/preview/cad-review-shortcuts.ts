export interface CadShortcutHandlers {
  onEscape?: () => void;
  onEnter?: () => void;
  onDelete?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSearch?: () => void;
  onFit?: () => void;
  onPan?: () => void;
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

export function isCadShortcutLocalScope(element: EventTarget | null): boolean {
  if (typeof HTMLElement === "undefined" || !(element instanceof HTMLElement)) return false;
  return Boolean(
    element.closest(
      '[data-cad-shortcut-scope="local"], [data-cad-tool-popover="true"], [role="dialog"], [role="menu"], [role="listbox"]'
    )
  );
}

export function isCadDeleteProtectedTarget(element: EventTarget | null): boolean {
  if (isInputElement(element) || isCadShortcutLocalScope(element)) return true;
  if (typeof HTMLElement === "undefined" || !(element instanceof HTMLElement)) return false;
  return Boolean(
    element.closest(
      'button, a[href], [role="button"], [role="checkbox"], [role="radio"], [role="switch"], [role="menuitem"], [role="option"]'
    )
  );
}

export function attachCadReviewKeyboardShortcuts(
  handlers: CadShortcutHandlers
): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.defaultPrevented) return;

    const isInput = isInputElement(e.target);
    const isLocalScope = isCadShortcutLocalScope(e.target);

    // Local editors, dialogs and popovers own Escape first. The global CAD
    // command is cancelled only after focus is back in the workspace.
    if (e.key === "Escape") {
      if (isInput || isLocalScope) return;
      handlers.onEscape?.();
      return;
    }

    if (isInput || isLocalScope) return;

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();

    if (e.key === "Enter") {
      handlers.onEnter?.();
      return;
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      if (isCadDeleteProtectedTarget(e.target)) return;
      e.preventDefault();
      handlers.onDelete?.();
      return;
    }

    if (isCtrlOrCmd && !e.shiftKey && key === "z") {
      e.preventDefault();
      handlers.onUndo?.();
      return;
    }

    if (
      (isCtrlOrCmd && e.shiftKey && key === "z") ||
      (isCtrlOrCmd && key === "y")
    ) {
      e.preventDefault();
      handlers.onRedo?.();
      return;
    }

    if ((isCtrlOrCmd && key === "f") || e.key === "/") {
      e.preventDefault();
      handlers.onSearch?.();
      return;
    }

    if (!isCtrlOrCmd && !e.altKey && !e.shiftKey && key === "f" && handlers.onFit) {
      e.preventDefault();
      handlers.onFit();
      return;
    }

    if (!isCtrlOrCmd && !e.altKey && !e.shiftKey && key === "p" && handlers.onPan) {
      e.preventDefault();
      handlers.onPan();
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
    ).filter((el) => el.offsetParent !== null);

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
    } else if (document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  container.addEventListener('keydown', handleKeyDown);
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

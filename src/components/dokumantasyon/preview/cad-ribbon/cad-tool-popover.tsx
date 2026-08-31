"use client";

import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface CadToolPopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  testId?: string;
}

const GHOST_CLICK_GUARD_MS = 800;
const CAD_GLOBAL_SINGLE_KEY_SHORTCUTS = new Set(["a", "f", "m", "p", "t", "/"]);
export const CAD_CLOSE_TOOL_POPOVERS_EVENT = "cad:close-tool-popovers";

export function closeCadToolPopovers(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CAD_CLOSE_TOOL_POPOVERS_EVENT));
}

function suppressDismissPointerSequence(originalEvent: PointerEvent) {
  if (typeof document === "undefined") return;

  const pointerId = originalEvent.pointerId;
  let timeoutId: number | undefined;

  const originalTarget = originalEvent.target;
  if (originalTarget instanceof Element) {
    originalTarget.dispatchEvent(
      new PointerEvent("pointercancel", {
        bubbles: true,
        pointerId,
        pointerType: originalEvent.pointerType,
        clientX: originalEvent.clientX,
        clientY: originalEvent.clientY,
      })
    );
  }

  const stopEvent = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  const cleanup = () => {
    document.removeEventListener("pointerup", onPointerUp, true);
    document.removeEventListener("pointercancel", onPointerCancel, true);
    document.removeEventListener("click", onClick, true);
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    stopEvent(event);
    document.removeEventListener("pointerup", onPointerUp, true);
    document.removeEventListener("pointercancel", onPointerCancel, true);
  };

  const onPointerCancel = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    stopEvent(event);
    cleanup();
  };

  const onClick = (event: MouseEvent) => {
    stopEvent(event);
    cleanup();
  };

  document.addEventListener("pointerup", onPointerUp, true);
  document.addEventListener("pointercancel", onPointerCancel, true);
  document.addEventListener("click", onClick, true);
  timeoutId = window.setTimeout(cleanup, GHOST_CLICK_GUARD_MS);
}

function shouldContainCadShortcut(event: React.KeyboardEvent<HTMLElement>): boolean {
  const key = event.key.toLowerCase();
  if (event.key === "Escape" || event.key === "Delete" || event.key === "Backspace") return true;
  if (event.ctrlKey || event.metaKey) {
    return key === "z" || key === "y" || key === "f";
  }
  if (event.altKey) return false;
  return CAD_GLOBAL_SINGLE_KEY_SHORTCUTS.has(key);
}

export function CadToolPopover({
  trigger,
  children,
  open,
  onOpenChange,
  align = "start",
  side = "bottom",
  className,
  testId,
}: CadToolPopoverProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const controlled = open !== undefined;
  const resolvedOpen = controlled ? open : internalOpen;

  const setResolvedOpen = React.useCallback(
    (next: boolean) => {
      if (!controlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange]
  );

  React.useEffect(() => {
    const close = () => setResolvedOpen(false);
    window.addEventListener(CAD_CLOSE_TOOL_POPOVERS_EVENT, close);
    return () => window.removeEventListener(CAD_CLOSE_TOOL_POPOVERS_EVENT, close);
  }, [setResolvedOpen]);

  return (
    <DropdownMenu open={resolvedOpen} onOpenChange={setResolvedOpen} modal>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={6}
        collisionPadding={8}
        avoidCollisions
        sticky="partial"
        data-cad-tool-popover="true"
        data-cad-shortcut-scope="local"
        data-testid={testId}
        className={cn(
          "z-[80] max-h-[calc(100dvh_-_16px)] max-w-[calc(100vw_-_16px)] overflow-x-hidden overflow-y-auto overscroll-contain rounded-lg border-border/80 bg-popover/98 p-2 shadow-2xl backdrop-blur-xl sm:min-w-48",
          className
        )}
        onKeyDown={(event) => {
          if (shouldContainCadShortcut(event)) event.stopPropagation();
        }}
        onEscapeKeyDown={(event) => {
          event.stopPropagation();
        }}
        onPointerDownOutside={(event) => {
          const originalEvent = event.detail.originalEvent;
          suppressDismissPointerSequence(originalEvent);
          originalEvent.preventDefault();
          originalEvent.stopPropagation();
        }}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange} modal>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        side={side}
        sideOffset={6}
        collisionPadding={8}
        avoidCollisions
        sticky="partial"
        data-cad-tool-popover="true"
        data-testid={testId}
        className={cn(
          "z-[80] max-h-[calc(100dvh_-_16px)] max-w-[calc(100vw_-_16px)] overflow-x-hidden overflow-y-auto overscroll-contain rounded-lg border-border/80 bg-popover/98 p-2 shadow-2xl backdrop-blur-xl sm:min-w-48",
          className
        )}
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

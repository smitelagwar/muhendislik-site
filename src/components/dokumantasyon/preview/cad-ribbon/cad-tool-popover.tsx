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
        collisionPadding={12}
        avoidCollisions
        sticky="partial"
        data-cad-tool-popover="true"
        data-testid={testId}
        className={cn(
          "z-[80] min-w-48 rounded-lg border-border/80 bg-popover/98 p-2 shadow-2xl backdrop-blur-xl",
          className
        )}
        onPointerDownOutside={(event) => {
          const originalEvent = event.detail.originalEvent;
          originalEvent.preventDefault();
          originalEvent.stopPropagation();
        }}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

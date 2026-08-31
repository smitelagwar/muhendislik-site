"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { CadRibbonButton, CAD_RIBBON_BUTTON_ACTIVE, CAD_RIBBON_BUTTON_BASE } from "./cad-ribbon-button";
import { CadToolPopover } from "./cad-tool-popover";

export interface CadSplitToolButtonProps {
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
  onActivate: () => void;
  menu: React.ReactNode;
  tooltip?: string;
  shortcut?: string;
  indicatorColor?: string;
  testId?: string;
  menuTestId?: string;
  className?: string;
}

export function CadSplitToolButton({
  label,
  icon,
  active = false,
  onActivate,
  menu,
  tooltip,
  shortcut,
  indicatorColor,
  testId,
  menuTestId,
  className,
}: CadSplitToolButtonProps) {
  return (
    <div
      className={cn(
        "inline-flex h-9 shrink-0 items-stretch overflow-visible rounded-md [@media(pointer:coarse)]:h-11",
        className
      )}
      data-cad-split-tool="true"
      data-cad-active={active ? "true" : "false"}
    >
      <CadRibbonButton
        icon={icon}
        label={label}
        active={active}
        onClick={onActivate}
        tooltip={tooltip ?? label}
        shortcut={shortcut}
        indicatorColor={indicatorColor}
        data-testid={testId}
        className="rounded-r-none border-r-border/50 pr-2"
      />

      <CadToolPopover
        testId={menuTestId ? `${menuTestId}-content` : undefined}
        trigger={
          <button
            type="button"
            aria-label={`${label} ayarlarını aç`}
            data-testid={menuTestId ?? (testId ? `${testId}-caret` : undefined)}
            data-cad-split-caret="true"
            className={cn(
              CAD_RIBBON_BUTTON_BASE,
              "min-w-6 w-6 rounded-l-none border-l-0 px-0 [@media(pointer:coarse)]:w-11 [@media(pointer:coarse)]:min-w-11",
              active && CAD_RIBBON_BUTTON_ACTIVE
            )}
          >
            <ChevronDown className="size-3.5" aria-hidden="true" />
          </button>
        }
      >
        {menu}
      </CadToolPopover>
    </div>
  );
}

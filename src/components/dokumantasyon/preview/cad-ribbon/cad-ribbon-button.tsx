"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export const CAD_RIBBON_BUTTON_BASE =
  "relative inline-flex h-9 min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 text-xs font-semibold text-muted-foreground outline-none transition-[background-color,border-color,color,box-shadow] hover:bg-accent/70 hover:text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/45 disabled:pointer-events-none disabled:opacity-40";

export const CAD_RIBBON_BUTTON_ACTIVE =
  "border-primary/35 bg-primary/12 text-foreground shadow-sm ring-1 ring-primary/20";

export interface CadRibbonButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon?: React.ReactNode;
  label?: React.ReactNode;
  active?: boolean;
  iconOnly?: boolean;
  tooltip?: string;
  shortcut?: string;
  indicatorColor?: string;
  children?: React.ReactNode;
}

export const CadRibbonButton = React.forwardRef<HTMLButtonElement, CadRibbonButtonProps>(
  function CadRibbonButton(
    {
      icon,
      label,
      active = false,
      iconOnly = false,
      tooltip,
      shortcut,
      indicatorColor,
      className,
      children,
      type = "button",
      "aria-label": ariaLabel,
      "aria-pressed": ariaPressed,
      ...props
    },
    ref
  ) {
    const tooltipId = React.useId();
    const fallbackLabel = typeof label === "string" ? label : tooltip;

    return (
      <span className="group/cad-tooltip relative inline-flex shrink-0">
        <button
          ref={ref}
          type={type}
          aria-label={ariaLabel ?? fallbackLabel}
          aria-pressed={ariaPressed ?? (active ? true : undefined)}
          aria-describedby={tooltip ? tooltipId : undefined}
          data-cad-ribbon-button="true"
          data-cad-active={active ? "true" : "false"}
          className={cn(
            CAD_RIBBON_BUTTON_BASE,
            iconOnly ? "w-9 px-0" : "min-w-9",
            active && CAD_RIBBON_BUTTON_ACTIVE,
            className
          )}
          {...props}
        >
          {icon ? <span className="relative flex size-4 items-center justify-center [&_svg]:size-4">{icon}</span> : null}
          {!iconOnly && label ? <span className="whitespace-nowrap">{label}</span> : null}
          {children}
          {indicatorColor ? (
            <span
              className="pointer-events-none absolute bottom-0.5 right-1 size-1.5 rounded-full border border-background/80"
              style={{ backgroundColor: indicatorColor }}
              aria-hidden="true"
            />
          ) : null}
        </button>

        {tooltip ? (
          <span
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-[90] w-max max-w-56 -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-left text-[11px] font-medium leading-4 text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover/cad-tooltip:opacity-100 group-focus-within/cad-tooltip:opacity-100"
          >
            <span className="block">{tooltip}</span>
            {shortcut ? <span className="block text-[10px] font-normal text-muted-foreground">{shortcut}</span> : null}
          </span>
        ) : null}
      </span>
    );
  }
);

"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export const CAD_RIBBON_BUTTON_BASE =
  "group/cad-tooltip relative inline-flex h-9 min-h-9 shrink-0 touch-manipulation items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 text-xs font-semibold text-muted-foreground outline-none transition-[background-color,border-color,color,box-shadow] hover:bg-accent/70 hover:text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/45 disabled:pointer-events-none disabled:opacity-40 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11 [@media(min-width:1100px)_and_(max-width:1439px)]:h-8 [@media(min-width:1100px)_and_(max-width:1439px)]:min-h-8 [@media(min-width:1100px)_and_(max-width:1439px)]:gap-1 [@media(min-width:1100px)_and_(max-width:1439px)]:px-1.5 [@media(min-width:1100px)_and_(max-width:1439px)]:text-[11px]";

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
          iconOnly ? "w-9 px-0 [@media(pointer:coarse)]:w-11" : "min-w-9",
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
        {tooltip ? (
          <span
            id={tooltipId}
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] z-[90] hidden w-max max-w-[min(14rem,calc(100vw-1rem))] -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-left text-[11px] font-medium leading-4 text-popover-foreground opacity-0 shadow-lg transition-opacity md:block group-hover/cad-tooltip:opacity-100 group-focus-visible/cad-tooltip:opacity-100"
          >
            <span className="block">{tooltip}</span>
            {shortcut ? <span className="block text-[10px] font-normal text-muted-foreground">{shortcut}</span> : null}
          </span>
        ) : null}
      </button>
    );
  }
);

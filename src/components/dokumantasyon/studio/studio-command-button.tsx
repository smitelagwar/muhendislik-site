// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — STUDIO COMMAND BUTTON
// ============================================================================

"use client";

import React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { getStudioCommand } from "@/lib/dokumantasyon/studio/commands";
import { VariantProps } from "class-variance-authority";

interface StudioCommandButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  commandId: string;
  asChild?: boolean;
  icon?: React.ReactNode;
  label?: string;
  showLabel?: boolean;
  active?: boolean;
}

export const StudioCommandButton = React.forwardRef<
  HTMLButtonElement,
  StudioCommandButtonProps
>(
  (
    {
      commandId,
      icon,
      label,
      showLabel = true,
      active = false,
      variant = "ghost",
      size = "sm",
      className = "",
      onClick,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const cmd = getStudioCommand(commandId);
    const displayLabel = label || cmd?.name || commandId;
    const tooltipText = cmd?.shortcut
      ? `${cmd.name} (${cmd.shortcut})`
      : cmd?.name || displayLabel;

    return (
      <Button
        ref={ref}
        data-command-id={commandId}
        variant={active ? "secondary" : variant}
        size={size}
        disabled={disabled}
        onClick={onClick}
        aria-label={displayLabel}
        aria-pressed={active}
        title={tooltipText}
        className={`gap-1.5 transition-colors ${
          active ? "bg-amber-500/15 text-amber-500 font-semibold border-amber-500/30" : ""
        } ${className}`}
        {...props}
      >
        {icon}
        {showLabel && <span>{displayLabel}</span>}
        {children}
      </Button>
    );
  }
);

StudioCommandButton.displayName = "StudioCommandButton";

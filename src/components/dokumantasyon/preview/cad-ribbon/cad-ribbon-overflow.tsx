"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";

import { CadRibbonButton } from "./cad-ribbon-button";
import { CadToolPopover } from "./cad-tool-popover";

export function CadRibbonOverflow({
  children,
  label = "Daha Fazla",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <CadToolPopover
      align="end"
      trigger={
        <CadRibbonButton
          icon={<MoreHorizontal />}
          iconOnly
          tooltip={label}
          aria-label={label}
          data-cad-ribbon-overflow-trigger="true"
        />
      }
    >
      {children}
    </CadToolPopover>
  );
}

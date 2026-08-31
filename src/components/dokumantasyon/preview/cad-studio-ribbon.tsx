"use client";

import {
  CadStudioRibbon as CadDesktopStudioRibbon,
  type CadStudioRibbonProps,
} from "./cad-studio-ribbon-desktop";
import { CadResponsiveRibbon } from "./cad-responsive-ribbon";
import { CadBlankCanvasRecovery } from "./cad-blank-canvas-recovery";

export type { CadStudioRibbonProps } from "./cad-studio-ribbon-desktop";
export { CAD_MARKUP_COLORS, CAD_TEXT_SIZES } from "./cad-studio-ribbon-desktop";

export function CadStudioRibbon(props: CadStudioRibbonProps) {
  return (
    <>
      <div
        className="hidden min-[1100px]:block"
        data-cad-responsive-surface="desktop-ribbon"
        data-cad-desktop-compression="1100-1439"
      >
        <CadDesktopStudioRibbon {...props} />
      </div>
      <CadResponsiveRibbon {...props} />
      <CadBlankCanvasRecovery onFitView={props.onFitView} />
    </>
  );
}

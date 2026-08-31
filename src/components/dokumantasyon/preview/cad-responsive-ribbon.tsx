"use client";

import { useState } from "react";
import { Hand, Layers, MousePointer, Pencil, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CadReviewItemStyle } from "@/lib/dokumantasyon/cad-review/schema";
import {
  isCadMarkupReviewItem,
  type CadActiveMarkupStyle,
  type CadMeasurementUnitSettings,
} from "@/lib/dokumantasyon/cad-review/store";
import {
  clearCurrentCadReviewMeasurements,
  getCurrentCadReviewStore,
} from "@/lib/dokumantasyon/cad-review/active-store";
import type { CadStudioRibbonProps } from "./cad-studio-ribbon-desktop";
import { CadAreaIcon, CadRibbonButton } from "./cad-ribbon";
import { CadResponsiveOverflow } from "./cad-responsive-overflow";

function persistableStylePatch(patch: Partial<CadActiveMarkupStyle>): Partial<CadReviewItemStyle> {
  const style: Partial<CadReviewItemStyle> = {};
  if (patch.color !== undefined) style.color = patch.color;
  if (patch.strokeWidth !== undefined) style.strokeWidth = patch.strokeWidth;
  if (patch.lineDash !== undefined) style.lineDash = patch.lineDash;
  if (patch.fillColor !== undefined) style.fillColor = patch.fillColor;
  if (patch.fillOpacity !== undefined) style.fillOpacity = patch.fillOpacity;
  if (patch.opacity !== undefined) style.opacity = patch.opacity;
  if (patch.fontSize !== undefined) style.fontSize = patch.fontSize;
  return style;
}

function hasSessionOnlyPatch(patch: Partial<CadActiveMarkupStyle>): boolean {
  return patch.eraserRadiusPx !== undefined || patch.calloutLeaderDirection !== undefined || patch.textRotationDeg !== undefined;
}

export function CadResponsiveRibbon(props: CadStudioRibbonProps) {
  const {
    activeTool,
    onSelectTool,
    onPan,
    onFitView,
    onStartDistance,
    onStartArea,
    onClearMeasurements,
    onToggleLayerPanel,
    layerPanelOpen,
    onUpdateMarkupStyle,
    onUpdateMeasurementUnitSettings,
  } = props;

  const markupStyle = props.markupStyle ?? {
    color: "#ff3b30",
    strokeWidth: 2,
    lineDash: "continuous",
    fillOpacity: 0,
    opacity: 1,
    fontSize: 16,
    textRotationDeg: 0,
    calloutLeaderDirection: "free",
    eraserRadiusPx: 16,
  };
  const measurementUnitSettings: CadMeasurementUnitSettings = props.measurementUnitSettings ?? {
    unit: "m",
    precision: 2,
    areaUnit: "m2",
    areaPrecision: 2,
    color: "#3b82f6",
  };

  const [selectedShapeKind] = useState<"shape_rect" | "shape_circle" | "shape_cloud">("shape_rect");
  const [clearMarkupConfirmOpen, setClearMarkupConfirmOpen] = useState(false);

  const store = getCurrentCadReviewStore();
  const selectedMarkupItems = store?.getSelectedItems().filter(isCadMarkupReviewItem) ?? [];
  const selectedMarkupItem = selectedMarkupItems[0];
  const effectiveMarkupStyle: CadActiveMarkupStyle = selectedMarkupItem
    ? {
        ...markupStyle,
        ...selectedMarkupItem.style,
        textRotationDeg: selectedMarkupItem.type === "text" ? selectedMarkupItem.rotationDeg : markupStyle.textRotationDeg,
      }
    : markupStyle;
  const selectionMode = Boolean(props.isEditingSelection) || selectedMarkupItems.length > 0;
  const isShapeActive = activeTool === "shape_rect" || activeTool === "shape_circle" || activeTool === "shape_cloud";

  const updateMarkup = (patch: Partial<CadActiveMarkupStyle>) => {
    const liveStore = getCurrentCadReviewStore();
    const liveSelection = liveStore?.getSelectedItems().filter(isCadMarkupReviewItem) ?? [];
    const stylePatch = persistableStylePatch(patch);
    if (liveStore && liveSelection.length > 0 && Object.keys(stylePatch).length > 0) {
      liveStore.updateItemsStyle(liveSelection.map((item) => item.id), stylePatch);
    }
    if (liveStore && liveSelection.length > 0 && patch.textRotationDeg !== undefined) {
      for (const item of liveSelection) {
        if (item.type === "text") liveStore.updateItem(item.id, { rotationDeg: patch.textRotationDeg } as never);
      }
    }
    if (liveSelection.length === 0 || hasSessionOnlyPatch(patch)) onUpdateMarkupStyle?.(patch);
  };

  const updateMeasurement = (patch: Partial<CadMeasurementUnitSettings>) => onUpdateMeasurementUnitSettings?.(patch);
  const clearAllMeasurements = () => {
    clearCurrentCadReviewMeasurements();
    onClearMeasurements();
  };
  const clearAllMarkup = () => {
    if (props.onClearAllMarkup) props.onClearAllMarkup();
    else getCurrentCadReviewStore()?.clearMarkupItems();
  };

  const overflow = (surface: "tablet" | "mobile") => (
    <CadResponsiveOverflow
      surface={surface}
      props={props}
      effectiveMarkupStyle={effectiveMarkupStyle}
      measurementUnitSettings={measurementUnitSettings}
      selectionMode={selectionMode}
      selectedShapeKind={selectedShapeKind}
      isShapeActive={isShapeActive}
      updateMarkup={updateMarkup}
      updateMeasurement={updateMeasurement}
      clearAllMeasurements={clearAllMeasurements}
      onRequestClearMarkup={() => setClearMarkupConfirmOpen(true)}
    />
  );

  return (
    <>
      <div
        className="relative z-30 hidden h-14 w-full shrink-0 items-center gap-1 overflow-hidden border-b border-border/80 bg-card/95 px-2 text-foreground shadow-sm backdrop-blur-xl md:flex min-[1100px]:hidden"
        data-testid="cad-tablet-ribbon"
        data-cad-responsive-surface="tablet-ribbon"
        role="toolbar"
        aria-label="CAD tablet araç çubuğu"
      >
        <CadRibbonButton icon={<MousePointer />} label="Seç" active={activeTool === "select"} onClick={() => onSelectTool("select")} tooltip="Seç" className="min-h-11" data-testid="cad-tablet-tool-select" />
        <CadRibbonButton icon={<Hand />} label="Kaydır" active={activeTool === "pan" || activeTool === null} onClick={onPan} tooltip="Kaydır" className="min-h-11" data-testid="cad-tablet-tool-pan" />
        <CadRibbonButton icon={<Ruler />} label="Mesafe" active={activeTool === "distance"} onClick={onStartDistance} tooltip="Mesafe" indicatorColor={measurementUnitSettings.color} className="min-h-11" data-testid="cad-tablet-tool-distance" />
        <CadRibbonButton icon={<CadAreaIcon />} label="Alan" active={activeTool === "area"} onClick={onStartArea} tooltip="Alan" indicatorColor={measurementUnitSettings.color} className="min-h-11" data-testid="cad-tablet-tool-area" />
        <CadRibbonButton icon={<Pencil />} label="Kalem" active={activeTool === "stroke"} onClick={() => onSelectTool("stroke")} tooltip="Kalem" indicatorColor={effectiveMarkupStyle.color} className="min-h-11" data-testid="cad-tablet-tool-stroke" />
        <CadRibbonButton icon={<Layers />} label="Katmanlar" active={layerPanelOpen} onClick={onToggleLayerPanel} tooltip="Katmanlar" className="min-h-11" data-testid="cad-tablet-tool-layers" />
        <div className="ml-auto shrink-0">
          <CadRibbonButton icon={<Ruler />} iconOnly onClick={onFitView} tooltip="Ekrana Sığdır" className="h-11 min-h-11 w-11 min-w-11" data-testid="cad-tablet-tool-fit" />
        </div>
        {overflow("tablet")}
      </div>

      <div
        className="pointer-events-auto absolute bottom-2 left-1/2 z-50 flex max-w-[calc(100%_-_16px)] -translate-x-1/2 items-center gap-1 rounded-2xl border border-border/80 bg-card/95 p-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-xl md:hidden"
        data-testid="cad-mobile-dock"
        data-cad-responsive-surface="mobile-dock"
        role="toolbar"
        aria-label="CAD mobil araç dock'u"
      >
        <CadRibbonButton icon={<MousePointer />} iconOnly active={activeTool === "select"} onClick={() => onSelectTool("select")} tooltip="Seç" aria-label="Seç" className="size-11 min-h-11 min-w-11 p-0" data-testid="cad-mobile-tool-select" />
        <CadRibbonButton icon={<Hand />} iconOnly active={activeTool === "pan" || activeTool === null} onClick={onPan} tooltip="Kaydır" aria-label="Kaydır" className="size-11 min-h-11 min-w-11 p-0" data-testid="cad-mobile-tool-pan" />
        <CadRibbonButton icon={<Ruler />} iconOnly active={activeTool === "distance"} onClick={onStartDistance} tooltip="Mesafe" aria-label="Mesafe" indicatorColor={measurementUnitSettings.color} className="size-11 min-h-11 min-w-11 p-0" data-testid="cad-mobile-tool-distance" />
        <CadRibbonButton icon={<CadAreaIcon />} iconOnly active={activeTool === "area"} onClick={onStartArea} tooltip="Alan" aria-label="Alan" indicatorColor={measurementUnitSettings.color} className="size-11 min-h-11 min-w-11 p-0" data-testid="cad-mobile-tool-area" />
        <CadRibbonButton icon={<Pencil />} iconOnly active={activeTool === "stroke"} onClick={() => onSelectTool("stroke")} tooltip="Kalem" aria-label="Kalem" indicatorColor={effectiveMarkupStyle.color} className="size-11 min-h-11 min-w-11 p-0" data-testid="cad-mobile-tool-stroke" />
        {overflow("mobile")}
      </div>

      <Dialog open={clearMarkupConfirmOpen} onOpenChange={setClearMarkupConfirmOpen}>
        <DialogContent className="max-w-md" data-testid="cad-responsive-clear-markup-dialog">
          <DialogHeader>
            <DialogTitle>Tüm işaretlemeleri temizle?</DialogTitle>
            <DialogDescription>Kalem, şekil, metin, callout ve yorum pinleri kaldırılır. Ölçümler ve kaynak DXF çizimi korunur. İşlem geri alınabilir.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setClearMarkupConfirmOpen(false)}>İptal</Button>
            <Button type="button" variant="destructive" onClick={() => { clearAllMarkup(); setClearMarkupConfirmOpen(false); }}>İşaretlemeleri Temizle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

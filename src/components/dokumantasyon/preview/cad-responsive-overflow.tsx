"use client";

import {
  Download,
  Eraser,
  Eye,
  FileCode,
  Layers,
  Magnet,
  Maximize,
  MessageSquare,
  MoreHorizontal,
  Pin,
  Redo2,
  Ruler,
  Search,
  Share2,
  Split,
  Square,
  Circle,
  Cloud,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { CadActiveMarkupStyle, CadMeasurementUnitSettings } from "@/lib/dokumantasyon/cad-review/store";
import type { CadStudioRibbonProps } from "./cad-studio-ribbon-desktop";
import {
  CadColorControl,
  CadLineWeightIcon,
  CadRibbonButton,
  CadToolPopover,
  CadUnitControl,
} from "./cad-ribbon";
import {
  CAD_MARKUP_COLORS,
  CadMarkupStyleMenu,
} from "./cad-ribbon/cad-review-tool-menus";

interface CadResponsiveOverflowProps {
  surface: "tablet" | "mobile";
  props: CadStudioRibbonProps;
  effectiveMarkupStyle: CadActiveMarkupStyle;
  measurementUnitSettings: CadMeasurementUnitSettings;
  selectionMode: boolean;
  selectedShapeKind: "shape_rect" | "shape_circle" | "shape_cloud";
  isShapeActive: boolean;
  updateMarkup: (patch: Partial<CadActiveMarkupStyle>) => void;
  updateMeasurement: (patch: Partial<CadMeasurementUnitSettings>) => void;
  clearAllMeasurements: () => void;
  onRequestClearMarkup: () => void;
}

function ShapeIcon({ kind }: { kind: "shape_rect" | "shape_circle" | "shape_cloud" }) {
  if (kind === "shape_circle") return <Circle className="size-4" />;
  if (kind === "shape_cloud") return <Cloud className="size-4" />;
  return <Square className="size-4" />;
}

export function CadResponsiveOverflow({
  surface,
  props,
  effectiveMarkupStyle,
  measurementUnitSettings,
  selectionMode,
  selectedShapeKind,
  isShapeActive,
  updateMarkup,
  updateMeasurement,
  clearAllMeasurements,
  onRequestClearMarkup,
}: CadResponsiveOverflowProps) {
  const {
    activeTool,
    onSelectTool,
    onFitView,
    onStartChainDistance,
    onTogglePanelTab,
    onToggleLayerPanel,
    onToggleSnapPanel,
    snapEnabled = true,
    layersCount = 0,
    commentsCount = 0,
    onSelectDisplayMode,
    lineWeightVisible,
    onToggleLineWeight,
    backgroundColor,
    onSelectBackgroundColor,
    canUndo = false,
    canRedo = false,
    onUndo,
    onRedo,
    onDownloadOriginal,
    onDownloadDxf,
    onOpenExportDialog,
  } = props;

  const isMobile = surface === "mobile";
  const reviewDxfAction = onOpenExportDialog ?? onDownloadDxf;
  const itemClass = "min-h-11 cursor-pointer py-2 text-xs";

  return (
    <CadToolPopover
      align="end"
      side={isMobile ? "top" : "bottom"}
      className="w-[min(22rem,calc(100vw_-_16px))] p-2"
      testId={`cad-${surface}-more-menu`}
      trigger={
        <CadRibbonButton
          icon={<MoreHorizontal />}
          label={isMobile ? undefined : "Daha Fazla"}
          iconOnly={isMobile}
          tooltip="Daha Fazla"
          aria-label="Daha Fazla"
          className={isMobile ? "size-11 min-h-11 min-w-11 p-0" : "min-h-11"}
          data-testid={`cad-${surface}-more-trigger`}
          data-cad-ribbon-overflow-trigger="true"
        />
      }
    >
      <DropdownMenuLabel className="text-[11px] text-muted-foreground">Gezinme ve Ölçüm</DropdownMenuLabel>
      <DropdownMenuItem className={itemClass} onSelect={onFitView} data-testid={`cad-${surface}-more-fit`}>
        <Maximize /> Ekrana Sığdır
      </DropdownMenuItem>
      {onStartChainDistance ? (
        <DropdownMenuItem className={itemClass} onSelect={onStartChainDistance} data-testid={`cad-${surface}-more-chain`}>
          <Split /> Zincir Mesafe
        </DropdownMenuItem>
      ) : null}
      <DropdownMenuItem className={itemClass} onSelect={() => onTogglePanelTab("measurements")} data-testid={`cad-${surface}-more-measurements`}>
        <Ruler /> Ölçüm Listesi
      </DropdownMenuItem>
      <DropdownMenuItem className={itemClass} onSelect={clearAllMeasurements} data-testid={`cad-${surface}-more-clear-measurements`}>
        <Trash2 /> Ölçümleri Temizle
      </DropdownMenuItem>

      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-[11px] text-muted-foreground">İşaretleme Araçları</DropdownMenuLabel>
      <div className="grid grid-cols-2 gap-1 px-1 pb-1" data-testid={`cad-${surface}-markup-grid`}>
        <Button type="button" variant={activeTool === "comment_pin" ? "secondary" : "ghost"} className="min-h-11 justify-start gap-2 text-xs" onClick={() => onSelectTool("comment_pin")}><Pin className="size-4" /> Pin</Button>
        <Button type="button" variant={isShapeActive ? "secondary" : "ghost"} className="min-h-11 justify-start gap-2 text-xs" onClick={() => onSelectTool(selectedShapeKind)}><ShapeIcon kind={selectedShapeKind} /> Şekil</Button>
        <Button type="button" variant={activeTool === "callout" ? "secondary" : "ghost"} className="min-h-11 justify-start gap-2 text-xs" onClick={() => onSelectTool("callout")}><MessageSquare className="size-4" /> Callout</Button>
        <Button type="button" variant={activeTool === "text" ? "secondary" : "ghost"} className="min-h-11 justify-start gap-2 text-xs" onClick={() => onSelectTool("text")}><Type className="size-4" /> Metin</Button>
        <Button type="button" variant={activeTool === "eraser" ? "secondary" : "ghost"} className="min-h-11 justify-start gap-2 text-xs" onClick={() => onSelectTool("eraser")}><Eraser className="size-4" /> Silgi</Button>
        <Button type="button" variant="ghost" className="min-h-11 justify-start gap-2 text-xs text-destructive hover:text-destructive" onClick={onRequestClearMarkup}><Trash2 className="size-4" /> İşaretlemeleri Temizle</Button>
      </div>

      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-[11px] text-muted-foreground">Ölçüm Ayarları</DropdownMenuLabel>
      <div className="px-1 pb-2" data-testid={`cad-${surface}-measurement-settings`}>
        <CadUnitControl
          lengthUnit={measurementUnitSettings.unit}
          precision={measurementUnitSettings.precision}
          areaUnit={measurementUnitSettings.areaUnit ?? "m2"}
          areaPrecision={measurementUnitSettings.areaPrecision ?? 2}
          onLengthUnitChange={(unit) => updateMeasurement({ unit })}
          onPrecisionChange={(precision) => updateMeasurement({ precision })}
          onAreaUnitChange={(areaUnit) => updateMeasurement({ areaUnit })}
          onAreaPrecisionChange={(areaPrecision) => updateMeasurement({ areaPrecision })}
        />
        <DropdownMenuSeparator className="my-2" />
        <CadColorControl
          label="Ölçüm Rengi"
          colors={CAD_MARKUP_COLORS}
          value={measurementUnitSettings.color}
          onChange={(color) => updateMeasurement({ color })}
          testIdPrefix={`cad-${surface}-measure-color`}
        />
      </div>

      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-[11px] text-muted-foreground">İşaretleme Stili</DropdownMenuLabel>
      <div className="px-1 pb-2" data-testid={`cad-${surface}-markup-settings`}>
        <CadMarkupStyleMenu
          style={effectiveMarkupStyle}
          onChange={updateMarkup}
          selectionMode={selectionMode}
          testIdPrefix={`cad-${surface}-markup`}
        />
      </div>

      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-[11px] text-muted-foreground">Çalışma Alanı</DropdownMenuLabel>
      <DropdownMenuItem className={itemClass} onSelect={onToggleLayerPanel} data-testid={`cad-${surface}-more-layers`}>
        <Layers /> {layersCount > 0 ? `Katmanlar (${layersCount})` : "Katmanlar"}
      </DropdownMenuItem>
      <DropdownMenuItem className={itemClass} onSelect={onToggleSnapPanel} data-testid={`cad-${surface}-more-snap`}>
        <Magnet /> {snapEnabled ? "Osnap Ayarları" : "Osnap Kapalı — Aç/Ayarla"}
      </DropdownMenuItem>
      <DropdownMenuItem className={itemClass} onSelect={() => onTogglePanelTab("search")} data-testid={`cad-${surface}-more-search`}>
        <Search /> Çizim İçi Metin Ara
      </DropdownMenuItem>
      <DropdownMenuItem className={itemClass} onSelect={() => onTogglePanelTab("comments")} data-testid={`cad-${surface}-more-comments`}>
        <MessageSquare /> {commentsCount > 0 ? `Yorumlar (${commentsCount})` : "Yorumlar"}
      </DropdownMenuItem>

      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-[11px] text-muted-foreground">Görünüm</DropdownMenuLabel>
      <DropdownMenuItem className={itemClass} onSelect={() => onSelectDisplayMode("source")}><Eye /> Gerçek Renkler</DropdownMenuItem>
      <DropdownMenuItem className={itemClass} onSelect={() => onSelectDisplayMode("monochrome")}><Eye /> Siyah-Beyaz</DropdownMenuItem>
      <DropdownMenuItem className={itemClass} onSelect={onToggleLineWeight}><CadLineWeightIcon /> {lineWeightVisible ? "Çizgi Kalınlıklarını Gizle" : "Çizgi Kalınlıklarını Göster"}</DropdownMenuItem>
      <div className="grid grid-cols-3 gap-1 px-1 pb-1 pt-1" aria-label="Arka plan rengi">
        <Button type="button" variant={backgroundColor === "autocad" ? "secondary" : "ghost"} className="min-h-11 px-2 text-[10px]" onClick={() => onSelectBackgroundColor("autocad")}>AutoCAD</Button>
        <Button type="button" variant={backgroundColor === "black" ? "secondary" : "ghost"} className="min-h-11 px-2 text-[10px]" onClick={() => onSelectBackgroundColor("black")}>Siyah</Button>
        <Button type="button" variant={backgroundColor === "white" ? "secondary" : "ghost"} className="min-h-11 px-2 text-[10px]" onClick={() => onSelectBackgroundColor("white")}>Beyaz</Button>
      </div>

      {(onUndo || onRedo) ? (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[11px] text-muted-foreground">Geçmiş</DropdownMenuLabel>
          {onUndo ? <DropdownMenuItem className={itemClass} disabled={!canUndo} onSelect={onUndo}><Undo2 /> Geri Al</DropdownMenuItem> : null}
          {onRedo ? <DropdownMenuItem className={itemClass} disabled={!canRedo} onSelect={onRedo}><Redo2 /> Yinele</DropdownMenuItem> : null}
        </>
      ) : null}

      {(reviewDxfAction || onDownloadOriginal || onOpenExportDialog) ? (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-[11px] text-muted-foreground">Dosya İşlemleri</DropdownMenuLabel>
          {reviewDxfAction ? (
            <DropdownMenuItem className={itemClass} onSelect={reviewDxfAction} data-testid={`cad-${surface}-download-review-dxf`}><FileCode /> İşaretlemeleri DXF Olarak İndir</DropdownMenuItem>
          ) : null}
          {onDownloadOriginal ? (
            <DropdownMenuItem className={itemClass} onSelect={onDownloadOriginal} data-testid={`cad-${surface}-download-original`}><Download /> Orijinal CAD Dosyasını İndir</DropdownMenuItem>
          ) : null}
          {onOpenExportDialog ? (
            <DropdownMenuItem className={itemClass} onSelect={onOpenExportDialog} data-testid={`cad-${surface}-open-export-dialog`}><Share2 /> Dışa Aktarma Merkezi</DropdownMenuItem>
          ) : null}
        </>
      ) : null}
    </CadToolPopover>
  );
}

"use client";

import React, { useState } from "react";
import {
  Circle,
  Cloud,
  Download,
  Eraser,
  Eye,
  FileCode,
  Hand,
  Layers,
  Magnet,
  Maximize,
  MessageSquare,
  MousePointer,
  Pencil,
  Pin,
  Redo2,
  Ruler,
  Search,
  Share2,
  Split,
  Square,
  Trash2,
  Type,
  Undo2,
} from "lucide-react";

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type {
  CadActiveMarkupStyle,
  CadMeasurementUnitSettings,
  CadReviewTool,
} from "@/lib/dokumantasyon/cad-review/store";
import type {
  CadBackgroundColorOption,
  CadUpstreamDisplayMode,
} from "@/lib/dokumantasyon/cad-upstream/adapter";
import type { CadSidePanelTab } from "./cad-review-side-panel";
import {
  CadAreaIcon,
  CadColorControl,
  CadLineStyleControl,
  CadLineWidthControl,
  CadLineWeightIcon,
  CadRibbonButton,
  CadRibbonGroup,
  CadSplitToolButton,
  CadToolPopover,
  CadUnitControl,
} from "./cad-ribbon";

export const CAD_MARKUP_COLORS = [
  { name: "Kırmızı", hex: "#ef4444" },
  { name: "Turuncu", hex: "#f97316" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Sarı", hex: "#eab308" },
  { name: "Yeşil", hex: "#10b981" },
  { name: "Mavi", hex: "#3b82f6" },
  { name: "Mor", hex: "#a855f7" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Beyaz", hex: "#ffffff" },
  { name: "Siyah", hex: "#000000" },
] as const;

export const CAD_STROKE_WIDTHS = [
  { label: "1px", value: 1, desc: "İnce" },
  { label: "2px", value: 2, desc: "Standart" },
  { label: "3px", value: 3, desc: "Orta" },
  { label: "5px", value: 5, desc: "Kalın" },
  { label: "8px", value: 8, desc: "Vurgu" },
] as const;

export const CAD_LINE_STYLES = [
  { label: "Düz", value: "continuous" as const },
  { label: "Kesikli", value: "dashed" as const },
  { label: "Noktalı", value: "dotted" as const },
] as const;

export const CAD_TEXT_SIZES = [
  { label: "12px", value: 12, desc: "Küçük" },
  { label: "16px", value: 16, desc: "Standart" },
  { label: "20px", value: 20, desc: "Büyük" },
  { label: "28px", value: 28, desc: "Başlık" },
  { label: "36px", value: 36, desc: "Vurgu" },
] as const;

export const CAD_PIN_STATUSES = [
  { label: "Açık", value: "open" as const, color: "#ef4444" },
  { label: "İncelemede", value: "question" as const, color: "#f59e0b" },
  { label: "Cevaplandı", value: "answered" as const, color: "#3b82f6" },
  { label: "Çözüldü", value: "closed" as const, color: "#10b981" },
] as const;

export interface CadStudioRibbonProps {
  activeTool: CadReviewTool | "pan" | null;
  onSelectTool: (tool: CadReviewTool) => void;
  onPan: () => void;
  onFitView: () => void;
  displayMode: CadUpstreamDisplayMode;
  onSelectDisplayMode: (mode: CadUpstreamDisplayMode) => void;
  lineWeightVisible: boolean;
  onToggleLineWeight: () => void;
  backgroundColor: CadBackgroundColorOption;
  onSelectBackgroundColor: (color: CadBackgroundColorOption) => void;
  markupStyle?: CadActiveMarkupStyle;
  onUpdateMarkupStyle?: (style: Partial<CadActiveMarkupStyle>) => void;
  measurementUnitSettings?: CadMeasurementUnitSettings;
  onUpdateMeasurementUnitSettings?: (settings: Partial<CadMeasurementUnitSettings>) => void;
  onStartDistance: () => void;
  onStartChainDistance?: () => void;
  onStartArea: () => void;
  onClearMeasurements: () => void;
  activePanelTab: CadSidePanelTab | null;
  onTogglePanelTab: (tab: CadSidePanelTab) => void;
  layerPanelOpen: boolean;
  onToggleLayerPanel: () => void;
  snapPanelOpen: boolean;
  onToggleSnapPanel: () => void;
  snapEnabled?: boolean;
  layersCount?: number;
  commentsCount?: number;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  saveStatus?: "clean" | "dirty" | "saving";
  onDownloadOriginal?: () => void;
  onDownloadDxf?: () => void;
  onOpenExportDialog?: () => void;
  sourceFileName?: string;
}

function ShapeIcon({ kind }: { kind: "shape_rect" | "shape_circle" | "shape_cloud" }) {
  if (kind === "shape_circle") return <Circle />;
  if (kind === "shape_cloud") return <Cloud />;
  return <Square />;
}

function BackgroundSwatch({ value }: { value: CadBackgroundColorOption }) {
  const color = value === "autocad" ? "#212830" : value === "black" ? "#000000" : "#ffffff";
  return <span className="size-3 rounded-full border border-foreground/20" style={{ backgroundColor: color }} />;
}

export function CadStudioRibbon({
  activeTool,
  onSelectTool,
  onPan,
  onFitView,
  displayMode,
  onSelectDisplayMode,
  lineWeightVisible,
  onToggleLineWeight,
  backgroundColor,
  onSelectBackgroundColor,
  markupStyle = {
    color: "#ff3b30",
    strokeWidth: 2,
    lineDash: "continuous",
    opacity: 1,
    fontSize: 16,
  },
  onUpdateMarkupStyle,
  measurementUnitSettings = {
    unit: "m",
    precision: 2,
    areaUnit: "m2",
    areaPrecision: 2,
    color: "#3b82f6",
  },
  onUpdateMeasurementUnitSettings,
  onStartDistance,
  onStartChainDistance,
  onStartArea,
  onClearMeasurements,
  activePanelTab,
  onTogglePanelTab,
  layerPanelOpen,
  onToggleLayerPanel,
  snapPanelOpen,
  onToggleSnapPanel,
  snapEnabled = true,
  layersCount = 0,
  commentsCount = 0,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  saveStatus = "clean",
  onDownloadOriginal,
  onDownloadDxf,
  onOpenExportDialog,
}: CadStudioRibbonProps) {
  const [selectedShapeKind, setSelectedShapeKind] = useState<
    "shape_rect" | "shape_circle" | "shape_cloud"
  >("shape_rect");

  const isShapeActive =
    activeTool === "shape_rect" || activeTool === "shape_circle" || activeTool === "shape_cloud";

  const updateMarkup = (patch: Partial<CadActiveMarkupStyle>) => onUpdateMarkupStyle?.(patch);
  const updateMeasurement = (patch: Partial<CadMeasurementUnitSettings>) =>
    onUpdateMeasurementUnitSettings?.(patch);

  const markupMenu = (
    <div className="w-60 space-y-3">
      <CadColorControl
        colors={CAD_MARKUP_COLORS}
        value={markupStyle.color}
        onChange={(color) => updateMarkup({ color })}
      />
      <DropdownMenuSeparator />
      <CadLineWidthControl
        value={markupStyle.strokeWidth}
        options={CAD_STROKE_WIDTHS}
        onChange={(strokeWidth) => updateMarkup({ strokeWidth })}
      />
      <DropdownMenuSeparator />
      <CadLineStyleControl
        value={markupStyle.lineDash}
        options={CAD_LINE_STYLES}
        onChange={(lineDash) => updateMarkup({ lineDash })}
      />
    </div>
  );

  return (
    <div
      data-testid="cad-studio-ribbon"
      data-cad-studio-ribbon="true"
      className="relative z-20 flex h-14 w-full shrink-0 items-center justify-between gap-2 overflow-x-auto border-b border-border/80 bg-card/95 px-2 text-foreground shadow-sm backdrop-blur-xl scrollbar-none sm:px-3"
    >
      <div className="flex min-w-max items-center gap-1.5" data-testid="cad-left-quick-rail">
        <CadRibbonGroup label="Gezinme">
          <CadRibbonButton
            icon={<MousePointer />}
            label="Seç"
            active={activeTool === "select"}
            onClick={() => onSelectTool("select")}
            tooltip="Seç"
            shortcut="Nesne seçimi · V"
            data-testid="cad-tool-select"
          />
          <CadRibbonButton
            icon={<Hand />}
            label="Kaydır"
            active={activeTool === "pan" || activeTool === null}
            onClick={onPan}
            tooltip="Kaydır"
            shortcut="Görünümü kaydır · P"
            data-testid="cad-tool-pan"
          />
          <CadRibbonButton
            icon={<Maximize />}
            iconOnly
            onClick={onFitView}
            tooltip="Ekrana Sığdır"
            shortcut="Tüm çizimi göster · F"
            data-testid="cad-tool-fit"
          />
        </CadRibbonGroup>

        <CadRibbonGroup label="Görünüm">
          <CadRibbonButton
            icon={<Eye />}
            label="Gerçek"
            active={displayMode === "source"}
            onClick={() => onSelectDisplayMode("source")}
            tooltip="Gerçek Renkler"
            data-testid="cad-display-source"
          />
          <CadRibbonButton
            label="S/B"
            active={displayMode === "monochrome"}
            onClick={() => onSelectDisplayMode("monochrome")}
            tooltip="Siyah-Beyaz Modu"
            data-testid="cad-display-monochrome"
          />
          <CadRibbonButton
            icon={<CadLineWeightIcon />}
            iconOnly
            active={lineWeightVisible}
            onClick={onToggleLineWeight}
            tooltip="Kaynak Çizgi Kalınlıkları"
            data-testid="cad-display-lineweight"
          />
          <CadToolPopover
            trigger={
              <CadRibbonButton
                icon={<BackgroundSwatch value={backgroundColor} />}
                iconOnly
                tooltip="Arka Plan Rengi"
                data-testid="cad-tool-view-settings"
              />
            }
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">Arka Plan Rengi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onSelectBackgroundColor("autocad")} data-testid="cad-bg-autocad">
              <BackgroundSwatch value="autocad" /> AutoCAD Koyu
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onSelectBackgroundColor("black")} data-testid="cad-bg-black">
              <BackgroundSwatch value="black" /> Tam Siyah
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onSelectBackgroundColor("white")} data-testid="cad-bg-white">
              <BackgroundSwatch value="white" /> Beyaz
            </DropdownMenuItem>
          </CadToolPopover>
        </CadRibbonGroup>

        <CadRibbonGroup label="Ölçüm">
          <CadRibbonButton
            icon={<Ruler />}
            label="Mesafe"
            active={activeTool === "distance"}
            onClick={onStartDistance}
            tooltip="Mesafe"
            shortcut="İki nokta arası ölç · T"
            indicatorColor={measurementUnitSettings.color}
            data-testid="cad-tool-distance"
          />
          {onStartChainDistance ? (
            <CadRibbonButton
              icon={<Split />}
              iconOnly
              active={activeTool === "chain_distance"}
              onClick={onStartChainDistance}
              tooltip="Zincir Mesafe"
              indicatorColor={measurementUnitSettings.color}
              data-testid="cad-tool-chain-distance"
            />
          ) : null}
          <CadRibbonButton
            icon={<CadAreaIcon />}
            label="Alan"
            active={activeTool === "area"}
            onClick={onStartArea}
            tooltip="Alan"
            shortcut="Çokgen alanı ölç · A"
            indicatorColor={measurementUnitSettings.color}
            data-testid="cad-tool-area"
          />
          <CadToolPopover
            className="w-64"
            trigger={
              <CadRibbonButton
                label={`${measurementUnitSettings.unit} ${measurementUnitSettings.precision === 0 ? "0" : `0.${"0".repeat(measurementUnitSettings.precision)}`}`}
                tooltip="Ölçüm Birimi ve Hassasiyet"
                indicatorColor={measurementUnitSettings.color}
                data-testid="cad-tool-measure-settings"
              />
            }
          >
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
            />
          </CadToolPopover>
          <CadRibbonButton
            icon={<Trash2 />}
            iconOnly
            onClick={onClearMeasurements}
            tooltip="Ölçümleri Temizle"
            className="hover:bg-destructive/10 hover:text-destructive"
            data-testid="cad-tool-clear"
          />
        </CadRibbonGroup>

        <CadRibbonGroup label="İşaretleme">
          <CadSplitToolButton
            label="Pin"
            icon={<Pin />}
            active={activeTool === "comment_pin"}
            onActivate={() => onSelectTool("comment_pin")}
            menu={
              <div className="w-56 space-y-3">
                <CadColorControl
                  colors={CAD_MARKUP_COLORS}
                  value={markupStyle.color}
                  onChange={(color) => updateMarkup({ color })}
                />
                <DropdownMenuSeparator />
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold text-muted-foreground">Durum göstergeleri</div>
                  {CAD_PIN_STATUSES.map((status) => (
                    <div key={status.value} className="flex h-7 items-center gap-2 rounded-md px-2 text-xs text-muted-foreground">
                      <span className="size-2 rounded-full" style={{ backgroundColor: status.color }} />
                      {status.label}
                    </div>
                  ))}
                </div>
              </div>
            }
            tooltip="Yorum Pini"
            indicatorColor={markupStyle.color}
            testId="cad-tool-pin"
            menuTestId="cad-tool-pin-style-trigger"
          />
          <CadSplitToolButton
            label="Kalem"
            icon={<Pencil />}
            active={activeTool === "stroke"}
            onActivate={() => onSelectTool("stroke")}
            menu={markupMenu}
            tooltip="Kalem"
            shortcut="Serbest işaretleme · P"
            indicatorColor={markupStyle.color}
            testId="cad-tool-stroke"
            menuTestId="cad-tool-stroke-style-trigger"
          />
          <CadSplitToolButton
            label="Şekil"
            icon={<ShapeIcon kind={selectedShapeKind} />}
            active={isShapeActive}
            onActivate={() => onSelectTool(selectedShapeKind)}
            indicatorColor={markupStyle.color}
            testId="cad-tool-shapes"
            menuTestId="cad-tool-shapes-dropdown"
            menu={
              <div className="w-60 space-y-3">
                <div className="grid grid-cols-3 gap-1">
                  {([
                    ["shape_rect", "Kare", <Square key="rect" />],
                    ["shape_circle", "Daire", <Circle key="circle" />],
                    ["shape_cloud", "Bulut", <Cloud key="cloud" />],
                  ] as const).map(([kind, label, icon]) => (
                    <button
                      key={kind}
                      type="button"
                      aria-pressed={selectedShapeKind === kind}
                      data-testid={`cad-tool-shape-${kind === "shape_rect" ? "rect" : kind === "shape_circle" ? "circle" : "cloud"}`}
                      className="flex h-9 items-center justify-center gap-1 rounded-md border border-border px-2 text-xs outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary/40 aria-pressed:bg-primary/10"
                      onClick={() => {
                        setSelectedShapeKind(kind);
                        onSelectTool(kind);
                      }}
                    >
                      <span className="[&_svg]:size-3.5">{icon}</span>
                      {label}
                    </button>
                  ))}
                </div>
                <DropdownMenuSeparator />
                {markupMenu}
              </div>
            }
          />
          <CadSplitToolButton
            label="Callout"
            icon={<MessageSquare />}
            active={activeTool === "callout"}
            onActivate={() => onSelectTool("callout")}
            menu={markupMenu}
            indicatorColor={markupStyle.color}
            testId="cad-tool-callout"
            menuTestId="cad-tool-callout-style-trigger"
          />
          <CadSplitToolButton
            label="Metin"
            icon={<Type />}
            active={activeTool === "text"}
            onActivate={() => onSelectTool("text")}
            menu={
              <div className="w-56 space-y-3">
                <CadColorControl
                  colors={CAD_MARKUP_COLORS}
                  value={markupStyle.color}
                  onChange={(color) => updateMarkup({ color })}
                />
                <DropdownMenuSeparator />
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-muted-foreground">Yazı Boyutu</div>
                  <div className="grid grid-cols-5 gap-1">
                    {CAD_TEXT_SIZES.map((size) => (
                      <button
                        key={size.value}
                        type="button"
                        onClick={() => updateMarkup({ fontSize: size.value })}
                        aria-pressed={(markupStyle.fontSize ?? 16) === size.value}
                        className="h-8 rounded-md border border-border text-[10px] outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary/40 aria-pressed:bg-primary/10"
                      >
                        {size.value}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            }
            indicatorColor={markupStyle.color}
            testId="cad-tool-text"
            menuTestId="cad-tool-text-style-trigger"
          />
          <CadRibbonButton
            icon={<Eraser />}
            iconOnly
            active={activeTool === "eraser"}
            onClick={() => onSelectTool("eraser")}
            tooltip="İşaret Silgisi"
            data-testid="cad-tool-eraser"
          />
        </CadRibbonGroup>

        <CadRibbonGroup label="Çalışma Alanı">
          <CadRibbonButton
            icon={<Layers />}
            label={layersCount > 0 ? `Katmanlar ${layersCount}` : "Katmanlar"}
            active={layerPanelOpen}
            onClick={onToggleLayerPanel}
            tooltip="Katmanlar"
            data-testid="cad-tool-layers"
          />
          <CadRibbonButton
            icon={<Magnet />}
            label="Osnap"
            active={snapPanelOpen}
            disabled={!snapEnabled}
            onClick={onToggleSnapPanel}
            tooltip="Nesne Yakalama"
            data-testid="cad-tool-snap-settings"
          />
          <CadRibbonButton
            icon={<Search />}
            iconOnly
            active={activePanelTab === "search"}
            onClick={() => onTogglePanelTab("search")}
            tooltip="Çizim İçi Metin Ara"
            shortcut="Arama · /"
            data-testid="cad-tool-search-panel"
          />
          <CadRibbonButton
            icon={<MessageSquare />}
            label={commentsCount > 0 ? `Yorumlar ${commentsCount}` : "Yorumlar"}
            active={activePanelTab === "comments"}
            onClick={() => onTogglePanelTab("comments")}
            tooltip="Yorumlar ve Notlar"
            data-testid="cad-tool-comments-panel"
          />
        </CadRibbonGroup>
      </div>

      <div className="ml-auto flex min-w-max items-center gap-1.5">
        <CadRibbonGroup label="Geçmiş ve Dışa Aktar">
          {onUndo ? (
            <CadRibbonButton
              icon={<Undo2 />}
              iconOnly
              onClick={onUndo}
              disabled={!canUndo}
              tooltip="Geri Al"
              shortcut="Ctrl/Cmd+Z"
              data-testid="cad-tool-undo"
            />
          ) : null}
          {onRedo ? (
            <CadRibbonButton
              icon={<Redo2 />}
              iconOnly
              onClick={onRedo}
              disabled={!canRedo}
              tooltip="Yinele"
              shortcut="Ctrl/Cmd+Y"
              data-testid="cad-tool-redo"
            />
          ) : null}

          <div
            className="flex h-9 items-center gap-1.5 rounded-md px-2 text-[10px] font-medium text-muted-foreground"
            data-testid="cad-save-status"
            aria-label={
              saveStatus === "saving"
                ? "Değişiklikler kaydediliyor"
                : saveStatus === "dirty"
                  ? "Kaydedilmemiş değişiklikler var"
                  : "Tüm değişiklikler kaydedildi"
            }
          >
            <span
              className={`size-2 rounded-full ${
                saveStatus === "saving"
                  ? "animate-pulse bg-amber-500"
                  : saveStatus === "dirty"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
            />
            <span>{saveStatus === "saving" ? "Kaydediliyor" : saveStatus === "dirty" ? "Kaydedilmedi" : "Kaydedildi"}</span>
          </div>

          <CadToolPopover
            align="end"
            className="w-64"
            trigger={
              <CadRibbonButton
                icon={<Download />}
                label="İndir"
                tooltip="İndirme ve Dışa Aktarma"
                data-testid="cad-tool-download-dropdown"
              />
            }
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">Dosya İşlemleri</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {onDownloadDxf ? (
              <DropdownMenuItem onSelect={onDownloadDxf} data-testid="cad-download-dxf-rev">
                <FileCode />
                <div className="flex flex-col">
                  <span>Revizyonlu DXF İndir</span>
                  <span className="text-[10px] text-muted-foreground">Çizim ve review öğeleri</span>
                </div>
              </DropdownMenuItem>
            ) : null}
            {onDownloadOriginal ? (
              <DropdownMenuItem onSelect={onDownloadOriginal} data-testid="cad-download-original">
                <Download />
                <div className="flex flex-col">
                  <span>Orijinal Çizimi İndir</span>
                  <span className="text-[10px] text-muted-foreground">Kaynak DWG/DXF</span>
                </div>
              </DropdownMenuItem>
            ) : null}
            {onOpenExportDialog ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={onOpenExportDialog} data-testid="cad-open-export-dialog">
                  <Share2 /> Dışa Aktarma Merkezi (PNG/PDF)
                </DropdownMenuItem>
              </>
            ) : null}
          </CadToolPopover>
        </CadRibbonGroup>
      </div>
    </div>
  );
}

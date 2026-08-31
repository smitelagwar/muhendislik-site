import type {
  CadReviewDocument,
  CadReviewItem,
  CadReviewLineDash,
} from "./schema";

export type CadReviewTool =
  | "select"
  | "distance"
  | "chain_distance"
  | "area"
  | "comment_pin"
  | "text"
  | "callout"
  | "shape_rect"
  | "shape_circle"
  | "shape_cloud"
  | "stroke"
  | "eraser";

export interface CadActiveMarkupStyle {
  color: string;
  strokeWidth: number;
  lineDash: CadReviewLineDash;
  fillColor?: string;
  opacity: number;
  fontSize?: number;
}

export type CadMeasurementLengthUnit = "m" | "cm" | "mm";
export type CadMeasurementAreaUnit = "m2" | "cm2" | "mm2";

/**
 * Backwards-compatible measurement settings contract.
 * `unit` and `precision` remain the public Ribbon fields while area settings are
 * explicit so area math never accidentally reuses a linear scale.
 */
export interface CadMeasurementUnitSettings {
  unit: CadMeasurementLengthUnit;
  precision: number;
  areaUnit?: CadMeasurementAreaUnit;
  areaPrecision?: number;
  color: string;
}

export interface CadResolvedMeasurementUnitSettings {
  unit: CadMeasurementLengthUnit;
  precision: number;
  areaUnit: CadMeasurementAreaUnit;
  areaPrecision: number;
  color: string;
}

export const CAD_DEFAULT_MEASUREMENT_UNIT_SETTINGS: CadResolvedMeasurementUnitSettings = {
  unit: "m",
  precision: 2,
  areaUnit: "m2",
  areaPrecision: 2,
  color: "#3b82f6",
};

let currentMeasurementUnitSettings: CadResolvedMeasurementUnitSettings = {
  ...CAD_DEFAULT_MEASUREMENT_UNIT_SETTINGS,
};

function normalizePrecision(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(6, Math.trunc(value!)));
}

export function resolveCadMeasurementUnitSettings(
  settings?: CadMeasurementUnitSettings | null
): CadResolvedMeasurementUnitSettings {
  return {
    unit: settings?.unit ?? CAD_DEFAULT_MEASUREMENT_UNIT_SETTINGS.unit,
    precision: normalizePrecision(
      settings?.precision,
      CAD_DEFAULT_MEASUREMENT_UNIT_SETTINGS.precision
    ),
    areaUnit: settings?.areaUnit ?? CAD_DEFAULT_MEASUREMENT_UNIT_SETTINGS.areaUnit,
    areaPrecision: normalizePrecision(
      settings?.areaPrecision,
      CAD_DEFAULT_MEASUREMENT_UNIT_SETTINGS.areaPrecision
    ),
    color: settings?.color || CAD_DEFAULT_MEASUREMENT_UNIT_SETTINGS.color,
  };
}

/**
 * Overlay components are siblings of the Ribbon and historically received no
 * measurement settings props. This read-only snapshot keeps those renderers on
 * the same session contract until the Stage 2 Ribbon component refactor can pass
 * the settings explicitly without duplicating state.
 */
export function getCurrentCadMeasurementUnitSettings(): CadResolvedMeasurementUnitSettings {
  return { ...currentMeasurementUnitSettings };
}

function isMeasurementItem(item: CadReviewItem): boolean {
  return item.type === "distance" || item.type === "chain_distance" || item.type === "area";
}

export interface CadReviewSessionState {
  activeTool: CadReviewTool;
  selectedItemIds: Set<string>;
  hoveredItemId: string | null;
  statusFilter: "all" | "open" | "question" | "answered" | "closed";
  activeLayoutId: string | null;
  activeMarkupStyle: CadActiveMarkupStyle;
  measurementUnitSettings: CadMeasurementUnitSettings;
}

export interface CadReviewDraftState {
  activeTool: CadReviewTool | null;
  draftItem: Partial<CadReviewItem> | null;
}

export interface CadReviewCommand {
  name: string;
  execute(): void;
  undo(): void;
}

export type CadReviewStoreListener = () => void;

export class CadReviewStore {
  // 1. Committed Document State (persisted/syncable)
  private document: CadReviewDocument;
  private isDirty = false;

  // 2. Session UI State (ephemeral, not saved to server)
  private session: CadReviewSessionState = {
    activeTool: "select",
    selectedItemIds: new Set<string>(),
    hoveredItemId: null,
    statusFilter: "all",
    activeLayoutId: null,
    activeMarkupStyle: {
      color: "#ff3b30",
      strokeWidth: 2,
      lineDash: "continuous",
      opacity: 1,
      fontSize: 16,
    },
    measurementUnitSettings: {
      ...CAD_DEFAULT_MEASUREMENT_UNIT_SETTINGS,
    },
  };

  // 3. Transient Gesture Draft State (never enters undo stack or server)
  private draft: CadReviewDraftState = {
    activeTool: null,
    draftItem: null,
  };

  // Command History (Undo / Redo)
  private undoStack: CadReviewCommand[] = [];
  private redoStack: CadReviewCommand[] = [];
  private readonly maxHistoryLength = 50;

  // Event Listeners
  private readonly listeners = new Set<CadReviewStoreListener>();

  constructor(initialDocument: CadReviewDocument) {
    this.document = {
      ...initialDocument,
      items: [...initialDocument.items],
    };
    currentMeasurementUnitSettings = resolveCadMeasurementUnitSettings(
      this.session.measurementUnitSettings
    );
  }

  // --- State Getters ---

  getDocument(): Readonly<CadReviewDocument> {
    return this.document;
  }

  getItems(): readonly CadReviewItem[] {
    return this.document.items;
  }

  getSession(): Readonly<CadReviewSessionState> {
    return this.session;
  }

  getDraft(): Readonly<CadReviewDraftState> {
    return this.draft;
  }

  getDirty(): boolean {
    return this.isDirty;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  // --- Session Mutations ---

  setActiveTool(tool: CadReviewTool): void {
    if (this.session.activeTool === tool) return;
    this.session.activeTool = tool;
    this.session.selectedItemIds.clear();
    this.clearDraft();
    this.notify();
  }

  setSelectedItems(ids: Iterable<string>): void {
    this.session.selectedItemIds = new Set(ids);
    this.notify();
  }

  setHoveredItem(id: string | null): void {
    if (this.session.hoveredItemId === id) return;
    this.session.hoveredItemId = id;
    this.notify();
  }

  setStatusFilter(filter: CadReviewSessionState["statusFilter"]): void {
    if (this.session.statusFilter === filter) return;
    this.session.statusFilter = filter;
    this.notify();
  }

  setActiveLayoutId(layoutId: string | null): void {
    if (this.session.activeLayoutId === layoutId) return;
    this.session.activeLayoutId = layoutId;
    this.notify();
  }

  getActiveMarkupStyle(): Readonly<CadActiveMarkupStyle> {
    return this.session.activeMarkupStyle;
  }

  setActiveMarkupStyle(style: Partial<CadActiveMarkupStyle>): void {
    this.session.activeMarkupStyle = {
      ...this.session.activeMarkupStyle,
      ...style,
    };
    this.notify();
  }

  getMeasurementUnitSettings(): Readonly<CadMeasurementUnitSettings> {
    return this.session.measurementUnitSettings;
  }

  setMeasurementUnitSettings(settings: Partial<CadMeasurementUnitSettings>): void {
    const previousColor = this.session.measurementUnitSettings.color;
    this.session.measurementUnitSettings = {
      ...this.session.measurementUnitSettings,
      ...settings,
    };
    currentMeasurementUnitSettings = resolveCadMeasurementUnitSettings(
      this.session.measurementUnitSettings
    );

    // Measurement color is one shared contract: existing review-based chain
    // measurements follow the same color as native distance/area overlays.
    if (settings.color && settings.color !== previousColor) {
      let changedDocument = false;
      for (const item of this.document.items) {
        if (!isMeasurementItem(item)) continue;
        item.style = { ...item.style, color: settings.color };
        changedDocument = true;
      }
      if (changedDocument) {
        this.document.updatedAt = new Date().toISOString();
        this.isDirty = true;
      }
    }

    this.notify();
  }

  // --- Transient Draft Mutations ---

  setDraft(tool: CadReviewTool, draftItem: Partial<CadReviewItem> | null): void {
    this.draft = {
      activeTool: tool,
      draftItem,
    };
    this.notify();
  }

  clearDraft(): void {
    if (!this.draft.activeTool && !this.draft.draftItem) return;
    this.draft = {
      activeTool: null,
      draftItem: null,
    };
    this.notify();
  }

  // --- Command Execution & Undo/Redo ---

  executeCommand(command: CadReviewCommand): void {
    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistoryLength) {
      this.undoStack.shift();
    }
    // New action strictly clears the redo stack
    this.redoStack = [];
    this.clearDraft();
    this.isDirty = true;
    this.notify();
  }

  undo(): boolean {
    const command = this.undoStack.pop();
    if (!command) return false;
    command.undo();
    this.redoStack.push(command);
    this.clearDraft();
    this.isDirty = true;
    this.notify();
    return true;
  }

  redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) return false;
    command.execute();
    this.undoStack.push(command);
    this.clearDraft();
    this.isDirty = true;
    this.notify();
    return true;
  }

  // --- High-Level Document Actions (via Commands) ---

  addItem(item: CadReviewItem): void {
    const itemToAdd = isMeasurementItem(item)
      ? ({
          ...item,
          style: {
            ...item.style,
            color: currentMeasurementUnitSettings.color,
          },
        } as CadReviewItem)
      : item;

    const command: CadReviewCommand = {
      name: `Add Item (${itemToAdd.type})`,
      execute: () => {
        this.document.items.push(itemToAdd);
        this.document.updatedAt = new Date().toISOString();
      },
      undo: () => {
        const idx = this.document.items.findIndex((i) => i.id === itemToAdd.id);
        if (idx !== -1) {
          this.document.items.splice(idx, 1);
          this.document.updatedAt = new Date().toISOString();
        }
      },
    };
    this.executeCommand(command);
  }

  removeItem(itemId: string): void {
    const existingIndex = this.document.items.findIndex((i) => i.id === itemId);
    if (existingIndex === -1) return;
    const existingItem = this.document.items[existingIndex]!;

    const command: CadReviewCommand = {
      name: `Remove Item (${existingItem.type})`,
      execute: () => {
        const idx = this.document.items.findIndex((i) => i.id === itemId);
        if (idx !== -1) {
          this.document.items.splice(idx, 1);
          this.session.selectedItemIds.delete(itemId);
          this.document.updatedAt = new Date().toISOString();
        }
      },
      undo: () => {
        this.document.items.splice(existingIndex, 0, existingItem);
        this.document.updatedAt = new Date().toISOString();
      },
    };
    this.executeCommand(command);
  }

  updateItem(itemId: string, patch: Partial<CadReviewItem>): void {
    const existing = this.document.items.find((i) => i.id === itemId);
    if (!existing) return;
    const previousSnapshot = { ...existing } as CadReviewItem;

    const command: CadReviewCommand = {
      name: `Update Item (${existing.type})`,
      execute: () => {
        const target = this.document.items.find((i) => i.id === itemId);
        if (target) {
          Object.assign(target, patch, { updatedAt: new Date().toISOString() });
        }
      },
      undo: () => {
        const target = this.document.items.find((i) => i.id === itemId);
        if (target) {
          Object.assign(target, previousSnapshot);
        }
      },
    };
    this.executeCommand(command);
  }

  // Mark clean after successful save/sync with server
  markClean(revision: number): void {
    this.isDirty = false;
    this.document.revision = revision;
    this.notify();
  }

  // --- Subscriptions ---

  subscribe(listener: CadReviewStoreListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // listener failure should not break store notification
      }
    }
  }
}

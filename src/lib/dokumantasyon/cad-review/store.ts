import type {
  CadReviewDocument,
  CadReviewItem,
  CadReviewLineDash,
  CadMeasurementContext,
} from "./schema";
import { cadReviewItemSchema, cadReviewDocumentSchema, MAX_REVIEW_ITEMS_PER_DRAWING } from "./schema";

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

export interface CadMeasurementUnitSettings {
  unit: "m" | "cm" | "mm";
  areaUnit: "m2" | "cm2" | "mm2";
  precision: number;
  areaPrecision: number;
  color: string;
}

export const CAD_DEFAULT_MEASUREMENT_UNIT_SETTINGS: Readonly<CadMeasurementUnitSettings> = Object.freeze({
  unit: "m",
  areaUnit: "m2",
  precision: 2,
  areaPrecision: 2,
  color: "#3b82f6",
});

function isMeasurementItem(item: CadReviewItem): boolean {
  return item.type === "distance" || item.type === "chain_distance" || item.type === "area";
}

/** Deep-clone world geometry and freeze the per-measurement context. */
function copyItem(item: CadReviewItem): CadReviewItem {
  const clone = JSON.parse(JSON.stringify(item)) as CadReviewItem;
  if (isMeasurementItem(clone) && "measurementContext" in clone && clone.measurementContext) {
    Object.freeze(clone.measurementContext);
  }
  return clone;
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
    measurementUnitSettings: { ...CAD_DEFAULT_MEASUREMENT_UNIT_SETTINGS },
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
      items: initialDocument.items.map(copyItem),
    };
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

  /**
   * The server may return after the UI and controllers subscribed to this store.
   * Adopt that document only when still empty/pristine; NEVER swap the store instance
   * or overwrite in-flight locally edited review data.
   */
  hydrateFromServerIfPristine(candidate: CadReviewDocument): boolean {
    if (this.isDirty || this.document.items.length > 0 ||
        this.undoStack.length > 0 || this.redoStack.length > 0 ||
        candidate.fileId !== this.document.fileId ||
        candidate.sourceVersionKey !== this.document.sourceVersionKey) return false;
    const parsed = cadReviewDocumentSchema.safeParse(candidate);
    if (!parsed.success) return false;
    this.document = {
      ...parsed.data,
      items: parsed.data.items.map(copyItem),
    };
    this.notify();
    return true;
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
    this.resetDraftWithoutNotify();
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
    const previous = this.session.measurementUnitSettings;
    const next = { ...previous, ...settings };
    if (!["m", "cm", "mm"].includes(next.unit) ||
        !["m2", "cm2", "mm2"].includes(next.areaUnit) ||
        ![next.precision, next.areaPrecision].every((p) =>
          Number.isSafeInteger(p) && p >= 0 && p <= 6) ||
        typeof next.color !== "string" || next.color.length < 1 || next.color.length > 32) return;
    if (Object.keys(next).every((key) =>
      next[key as keyof CadMeasurementUnitSettings] === previous[key as keyof CadMeasurementUnitSettings]
    )) return;

    // Display unit/precision is session-only. Color is a persistent style change:
    // group all existing measurements in ONE undoable transaction.
    this.session.measurementUnitSettings = next;
    if (next.color !== previous.color && this.document.items.some(isMeasurementItem)) {
      const oldColors = new Map<string, string>();
      for (const item of this.document.items) {
        if (isMeasurementItem(item)) oldColors.set(item.id, item.style.color);
      }
      this.executeCommand({
        name: "Update Measurement Color",
        execute: () => {
          for (const item of this.document.items) {
            if (isMeasurementItem(item)) item.style = { ...item.style, color: next.color };
          }
          this.document.updatedAt = new Date().toISOString();
        },
        undo: () => {
          for (const item of this.document.items) {
            const color = oldColors.get(item.id);
            if (color !== undefined) item.style = { ...item.style, color };
          }
          this.document.updatedAt = new Date().toISOString();
        },
      });
      return;
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

  private resetDraftWithoutNotify(): void {
    this.draft = { activeTool: null, draftItem: null };
  }

  clearDraft(): void {
    if (!this.draft.activeTool && !this.draft.draftItem) return;
    this.resetDraftWithoutNotify();
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
    this.resetDraftWithoutNotify();
    this.isDirty = true;
    this.notify();
  }

  undo(): boolean {
    const command = this.undoStack.pop();
    if (!command) return false;
    command.undo();
    this.redoStack.push(command);
    this.resetDraftWithoutNotify();
    this.isDirty = true;
    this.notify();
    return true;
  }

  redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) return false;
    command.execute();
    this.undoStack.push(command);
    this.resetDraftWithoutNotify();
    this.isDirty = true;
    this.notify();
    return true;
  }

  // --- High-Level Document Actions (via Commands) ---

  /** A complete gesture commits exactly one validated history entry. */
  addItem(item: CadReviewItem): boolean {
    if (this.document.items.length >= MAX_REVIEW_ITEMS_PER_DRAWING ||
        this.document.items.some((existing) => existing.id === item.id)) return false;
    const candidate: CadReviewItem = isMeasurementItem(item) &&
      this.session.measurementUnitSettings.color !== CAD_DEFAULT_MEASUREMENT_UNIT_SETTINGS.color
      ? { ...item, style: { ...item.style, color: this.session.measurementUnitSettings.color } }
      : item;
    const validated = cadReviewItemSchema.safeParse(candidate);
    if (!validated.success) return false;
    if (validated.data.type === "chain_distance" &&
        validated.data.segmentDistances.length !== validated.data.points.length - 1) return false;
    const saved = copyItem(validated.data);
    this.executeCommand({
      name: "Add Item (" + saved.type + ")",
      execute: () => {
        this.document.items.push(saved);
        this.document.updatedAt = new Date().toISOString();
      },
      undo: () => {
        const index = this.document.items.findIndex((existing) => existing.id === saved.id);
        if (index !== -1) {
          this.document.items.splice(index, 1);
          this.document.updatedAt = new Date().toISOString();
        }
      },
    });
    return true;
  }

  /** Explicit, immutable source/display/calibration context for new measurements. */
  addMeasuredItem(
    item: Extract<CadReviewItem, { type: "distance" | "chain_distance" | "area" }>,
    context: CadMeasurementContext
  ): boolean {
    return this.addItem({ ...item, measurementContext: context });
  }


  /** Clear measurements as one undoable operation; comments/markup are untouched. */
  clearMeasurements(): boolean {
    const removed = this.document.items
      .map((item, index) => ({ item: copyItem(item), index }))
      .filter(({ item }) => isMeasurementItem(item));
    if (removed.length === 0) return false;
    const ids = new Set(removed.map(({ item }) => item.id));
    this.executeCommand({
      name: "Clear Measurements",
      execute: () => {
        this.document.items = this.document.items.filter((item) => !ids.has(item.id));
        for (const id of ids) this.session.selectedItemIds.delete(id);
        this.document.updatedAt = new Date().toISOString();
      },
      undo: () => {
        const restored = [...this.document.items];
        for (const { item, index } of removed) restored.splice(index, 0, copyItem(item));
        this.document.items = restored;
        this.document.updatedAt = new Date().toISOString();
      },
    });
    return true;
  }

  /** Multi-selection Delete is ONE undoable review-only transaction. */
  removeItems(itemIds: Iterable<string>): number {
    const requested = new Set(itemIds);
    const removed = this.document.items
      .map((item, index) => ({ item: copyItem(item), index }))
      .filter(({ item }) => requested.has(item.id));
    if (removed.length === 0) return 0;
    const ids = new Set(removed.map(({ item }) => item.id));
    this.executeCommand({
      name: "Remove Selected Review Items",
      execute: () => {
        this.document.items = this.document.items.filter(item => !ids.has(item.id));
        for (const id of ids) this.session.selectedItemIds.delete(id);
        this.document.updatedAt = new Date().toISOString();
      },
      undo: () => {
        const restored = [...this.document.items];
        for (const { item, index } of removed) {
          restored.splice(Math.min(index, restored.length), 0, copyItem(item));
        }
        this.document.items = restored;
        this.document.updatedAt = new Date().toISOString();
      },
    });
    return removed.length;
  }

  removeItem(itemId: string): void {
    const existingIndex = this.document.items.findIndex((i) => i.id === itemId);
    if (existingIndex === -1) return;
    const existingItem = copyItem(this.document.items[existingIndex]!);

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

  updateItem(itemId: string, patch: Partial<CadReviewItem>): boolean {
    const existing = this.document.items.find((item) => item.id === itemId);
    if (!existing || (patch.id !== undefined && patch.id !== itemId) ||
        (patch.type !== undefined && patch.type !== existing.type) ||
        // No silent recalibration: a new context requires an explicit future remeasure command.
        "measurementContext" in patch) return false;

    const before = copyItem(existing);
    const proposed = { ...existing, ...patch } as CadReviewItem;
    if (JSON.stringify(proposed) === JSON.stringify(existing)) return false;

    // Some historic v1 IDs are non-UUID: preserve them when editing valid content.
    const validationId = "00000000-0000-4000-8000-000000000001";
    const parsed = cadReviewItemSchema.safeParse({
      ...proposed,
      id: validationId,
      updatedAt: new Date().toISOString(),
    });
    if (!parsed.success) return false;
    const after = copyItem({ ...proposed, ...parsed.data, id: itemId } as CadReviewItem);

    this.executeCommand({
      name: "Update Item (" + existing.type + ")",
      execute: () => {
        const index = this.document.items.findIndex((item) => item.id === itemId);
        if (index !== -1) this.document.items[index] = copyItem(after);
        this.document.updatedAt = new Date().toISOString();
      },
      undo: () => {
        const index = this.document.items.findIndex((item) => item.id === itemId);
        if (index !== -1) this.document.items[index] = copyItem(before);
        this.document.updatedAt = new Date().toISOString();
      },
    });
    return true;
  }



  // Mark clean after successful save/sync with server
  markClean(revision: number): void {
    this.isDirty = false;
    this.document.revision = revision;
    this.notify();
  }

  /** Attach a verified source SHA and remote revision without altering existing review geometry. */
  bindRemoteSource(sha256: string, revision: number, pendingUpload = false): boolean {
    if (!/^[a-f0-9]{64}$/i.test(sha256) || !Number.isSafeInteger(revision) || revision < 0) return false;
    this.document = { ...this.document, sourceSha256: sha256.toLowerCase(), revision };
    this.isDirty = pendingUpload;
    this.notify();
    return true;
  }

  /** Acknowledge the sent snapshot; edits made while PUT was in flight remain dirty. */
  acknowledgeRemoteSave(revision: number, sentItemsJson: string): boolean {
    if (!Number.isSafeInteger(revision) || revision < 0) return false;
    this.document.revision = revision;
    const identical = JSON.stringify(this.document.items) === sentItemsJson;
    this.isDirty = !identical;
    this.notify();
    return identical;
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
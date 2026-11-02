function generateReviewId(): string {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return "rev-" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

import type {
  CadPoint2d,
  CadReviewItem,
  CadReviewItemStatus,
  CadReviewItemStyle,
  cadReviewPinItemSchema,
  cadReviewShapeItemSchema,
  cadReviewCalloutItemSchema,
  cadReviewTextItemSchema,
  cadReviewStrokeItemSchema,
} from "./schema";
import type { CadReviewStore } from "./store";
import { findHitReviewItem } from "./hit-test";
import type { z } from "zod";

export type CadReviewPinItem = z.infer<typeof cadReviewPinItemSchema>;
export type CadReviewShapeItem = z.infer<typeof cadReviewShapeItemSchema>;
export type CadReviewCalloutItem = z.infer<typeof cadReviewCalloutItemSchema>;
export type CadReviewTextItem = z.infer<typeof cadReviewTextItemSchema>;
export type CadReviewStrokeItem = z.infer<typeof cadReviewStrokeItemSchema>;

/** Translation applies only to independent review annotations, never to CAD source entities. */
export function translateMarkupItem(item: CadReviewItem, dx: number, dy: number): CadReviewItem | null {
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || Math.abs(dx) > 1e9 || Math.abs(dy) > 1e9) return null;
  const add = (p: CadPoint2d): CadPoint2d => ({ x: p.x + dx, y: p.y + dy });
  switch (item.type) {
    case "shape": return { ...item, p1: add(item.p1), p2: add(item.p2) };
    case "callout": return { ...item, tip: add(item.tip), anchor: add(item.anchor) };
    case "comment_pin": return { ...item, position: add(item.position) };
    case "text": return { ...item, position: add(item.position) };
    case "stroke": return { ...item, points: item.points.map(add) };
    default: return null;
  }
}

export class CadMarkupFacade {

  constructor(private readonly store: CadReviewStore) {}

  getNextPinIndex(): number {
    let maxIdx = 0;
    for (const item of this.store.getItems()) {
      if (item.type === "comment_pin" && typeof item.pinIndex === "number") {
        if (item.pinIndex > maxIdx) maxIdx = item.pinIndex;
      }
    }
    return maxIdx + 1;
  }

  addCommentPin(params: {
    position: CadPoint2d;
    comment: string;
    title?: string;
    author?: string;
    status?: CadReviewItemStatus;
    style?: Partial<CadReviewItemStyle>;
    layoutId?: string;
  }): CadReviewPinItem {
    const commentTrimmed = params.comment.trim();
    if (!commentTrimmed) {
      throw new Error("Yorum metni boş bırakılamaz.");
    }

    const now = new Date().toISOString();
    const pinIndex = this.getNextPinIndex();
    const id = generateReviewId();

    const item: CadReviewPinItem = {
      id,
      type: "comment_pin",
      position: { x: params.position.x, y: params.position.y },
      pinIndex,
      title: params.title?.trim() || `Yorum #${pinIndex}`,
      comment: commentTrimmed,
      author: params.author?.trim() || "Admin",
      status: params.status ?? "open",
      layoutId: params.layoutId,
      createdAt: now,
      updatedAt: now,
      style: {
        color: params.style?.color ?? "#ff3b30",
        strokeWidth: params.style?.strokeWidth ?? 2,
        opacity: params.style?.opacity ?? 1,
        fontSize: params.style?.fontSize,
        fillColor: params.style?.fillColor,
      },
    };

    if (!this.store.addItem(item)) throw new Error("Review öğesi doğrulanamadı veya kayıt sınırına ulaşıldı.");
    this.store.setSelectedItems([id]);
    return item;
  }

  addShape(params: {
    shapeKind: "rect" | "circle" | "cloud";
    p1: CadPoint2d;
    p2: CadPoint2d;
    radius?: number;
    comment?: string;
    author?: string;
    style?: Partial<CadReviewItemStyle>;
    layoutId?: string;
  }): CadReviewShapeItem {
    const now = new Date().toISOString();
    const id = generateReviewId();

    const item: CadReviewShapeItem = {
      id,
      type: "shape",
      shapeKind: params.shapeKind,
      p1: { x: params.p1.x, y: params.p1.y },
      p2: { x: params.p2.x, y: params.p2.y },
      radius: params.radius,
      comment: params.comment?.trim() || "",
      author: params.author?.trim() || "Admin",
      status: "open",
      layoutId: params.layoutId,
      createdAt: now,
      updatedAt: now,
      style: {
        color: params.style?.color ?? "#007aff",
        strokeWidth: params.style?.strokeWidth ?? 2,
        lineDash: params.style?.lineDash ?? "continuous",
        opacity: params.style?.opacity ?? 1,
        fillColor: params.style?.fillColor,
      },
    };

    if (!this.store.addItem(item)) throw new Error("Review öğesi doğrulanamadı veya kayıt sınırına ulaşıldı.");
    this.store.setSelectedItems([id]);
    return item;
  }

  addCallout(params: {
    tip: CadPoint2d;
    anchor: CadPoint2d;
    text: string;
    comment?: string;
    author?: string;
    style?: Partial<CadReviewItemStyle>;
    layoutId?: string;
  }): CadReviewCalloutItem {
    const textTrimmed = params.text.trim();
    if (!textTrimmed) {
      throw new Error("Callout metni boş bırakılamaz.");
    }

    const now = new Date().toISOString();
    const id = generateReviewId();

    const item: CadReviewCalloutItem = {
      id,
      type: "callout",
      tip: { x: params.tip.x, y: params.tip.y },
      anchor: { x: params.anchor.x, y: params.anchor.y },
      text: textTrimmed,
      comment: params.comment?.trim() || "",
      author: params.author?.trim() || "Admin",
      status: "open",
      layoutId: params.layoutId,
      createdAt: now,
      updatedAt: now,
      style: {
        color: params.style?.color ?? "#ff9500",
        strokeWidth: params.style?.strokeWidth ?? 2,
        opacity: params.style?.opacity ?? 1,
        fontSize: params.style?.fontSize ?? 14,
        fillColor: params.style?.fillColor,
      },
    };

    if (!this.store.addItem(item)) throw new Error("Review öğesi doğrulanamadı veya kayıt sınırına ulaşıldı.");
    this.store.setSelectedItems([id]);
    return item;
  }

  addText(params: {
    position: CadPoint2d;
    text: string;
    rotationDeg?: number;
    comment?: string;
    author?: string;
    style?: Partial<CadReviewItemStyle>;
    layoutId?: string;
  }): CadReviewTextItem {
    const textTrimmed = params.text.trim();
    if (!textTrimmed) {
      throw new Error("Metin içeriği boş bırakılamaz.");
    }

    const now = new Date().toISOString();
    const id = generateReviewId();

    const item: CadReviewTextItem = {
      id,
      type: "text",
      position: { x: params.position.x, y: params.position.y },
      text: textTrimmed,
      rotationDeg: params.rotationDeg ?? 0,
      comment: params.comment?.trim() || "",
      author: params.author?.trim() || "Admin",
      status: "open",
      layoutId: params.layoutId,
      createdAt: now,
      updatedAt: now,
      style: {
        color: params.style?.color ?? "#34c759",
        strokeWidth: params.style?.strokeWidth ?? 2,
        opacity: params.style?.opacity ?? 1,
        fontSize: params.style?.fontSize ?? 16,
        fillColor: params.style?.fillColor,
      },
    };

    if (!this.store.addItem(item)) throw new Error("Review öğesi doğrulanamadı veya kayıt sınırına ulaşıldı.");
    this.store.setSelectedItems([id]);
    return item;
  }

  updateItemStatus(id: string, newStatus: CadReviewItemStatus): boolean {
    const current = this.store.getItems().find((i) => i.id === id);
    if (!current) return false;

    return this.store.updateItem(id, { status: newStatus });
  }

  updateItemComment(id: string, comment: string, title?: string): boolean {
    const current = this.store.getItems().find((i) => i.id === id);
    if (!current) return false;

    const trimmed = comment.trim();
    const patch: Partial<CadReviewItem> = { comment: trimmed };
    if (title !== undefined && current.type === "comment_pin") {
      (patch as { title?: string }).title = title.trim();
    }

    return this.store.updateItem(id, patch);
  }

  updateItemStyle(id: string, style: Partial<CadReviewItemStyle>): boolean {
    const current = this.store.getItems().find((i) => i.id === id);
    if (!current) return false;

    return this.store.updateItem(id, {
      style: {
        ...current.style,
        ...style,
      },
    });
  }

  addStroke(params: {
    points: CadPoint2d[];
    style?: Partial<CadReviewItemStyle>;
    smooth?: boolean;
    comment?: string;
    author?: string;
    layoutId?: string;
  }): CadReviewStrokeItem {
    if (params.points.length < 2) {
      throw new Error("Çizgi en az 2 noktadan oluşmalıdır.");
    }

    const now = new Date().toISOString();
    const id = generateReviewId();

    const item: CadReviewStrokeItem = {
      id,
      type: "stroke",
      points: params.points.map((p) => ({ x: p.x, y: p.y })),
      smooth: params.smooth ?? true,
      comment: params.comment?.trim() || "",
      author: params.author?.trim() || "Admin",
      status: "open",
      layoutId: params.layoutId,
      createdAt: now,
      updatedAt: now,
      style: {
        color: params.style?.color ?? "#ff3b30",
        strokeWidth: params.style?.strokeWidth ?? 2,
        lineDash: params.style?.lineDash ?? "continuous",
        opacity: params.style?.opacity ?? 1,
        fillColor: params.style?.fillColor,
      },
    };

    if (!this.store.addItem(item)) throw new Error("Çizgi doğrulanamadı veya kayıt sınırına ulaşıldı.");
    return item;
  }

  eraseItemAtPoint(
    screenPoint: { x: number; y: number },
    projectWorldToScreen: (p: CadPoint2d) => { x: number; y: number } | null
  ): boolean {
    const hit = findHitReviewItem(this.store.getItems(), screenPoint, {
      tolerancePx: 16,
      projectWorldToScreen,
      activeLayoutId: this.store.getSession().activeLayoutId,
      isVisible: (item) => ["shape", "callout", "comment_pin", "text", "stroke"].includes(item.type),
    });

    if (hit) {
      this.deleteItem(hit.id);
      return true;
    }
    return false;
  }

  deleteItem(id: string): boolean {
    const current = this.store.getItems().find((i) => i.id === id);
    if (!current) return false;

    this.store.removeItem(id);
    return true;
  }

  moveItem(id: string, dx: number, dy: number): boolean {
    const item = this.store.getItems().find((value) => value.id === id);
    if (!item || item.status === "closed" || (dx === 0 && dy === 0)) return false;
    const translated = translateMarkupItem(item, dx, dy);
    if (!translated) return false;
    return this.store.updateItem(id, translated);
  }

  toggleItemSelection(id: string): void {
    const selected = new Set(this.store.getSession().selectedItemIds);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    this.store.setSelectedItems(selected);
  }

  selectItem(id: string): void {
    this.store.setSelectedItems([id]);
  }

  deselectItem(id: string): void {
    const current = new Set(this.store.getSession().selectedItemIds);
    current.delete(id);
    this.store.setSelectedItems(current);
  }

  clearSelection(): void {
    this.store.setSelectedItems([]);
  }
}
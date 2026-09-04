// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — PRAGMATIC DRAG AND DROP (PDD) ENHANCEMENT
// ============================================================================

import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import { BulkItem } from "./bulk-operations";

export interface DraggedItemData {
  [key: string]: unknown;
  type: "drive-items";
  items: BulkItem[];
  primaryId: string;
}

export function registerDraggableItem({
  element,
  item,
  selectedIds,
  allSelectedItems,
  onSelectSingle,
}: {
  element: HTMLElement;
  item: BulkItem;
  selectedIds: Set<string>;
  allSelectedItems: BulkItem[];
  onSelectSingle?: (id: string) => void;
}): () => void {
  return draggable({
    element,
    getInitialData: (): DraggedItemData => {
      const isSelected = selectedIds.has(item.id);
      if (isSelected && allSelectedItems.length > 0) {
        return {
          type: "drive-items",
          items: allSelectedItems,
          primaryId: item.id,
        };
      }

      // Unselected item drag -> replace selection with this single item
      onSelectSingle?.(item.id);
      return {
        type: "drive-items",
        items: [item],
        primaryId: item.id,
      };
    },
  });
}

export function registerFolderDropTarget({
  element,
  targetFolderId,
  invalidTargetFolderIds,
  onDropItems,
  onDragStateChange,
}: {
  element: HTMLElement;
  targetFolderId: string;
  invalidTargetFolderIds?: Set<string>;
  onDropItems: (items: BulkItem[], targetFolderId: string) => void;
  onDragStateChange?: (isOver: boolean) => void;
}): () => void {
  return dropTargetForElements({
    element,
    canDrop: ({ source }) => {
      const data = source.data as unknown as DraggedItemData;
      if (!data || data.type !== "drive-items" || !data.items?.length) {
        return false;
      }

      // Cannot drop inside any item being dragged
      const draggedIds = new Set(data.items.map((i) => i.id));
      if (draggedIds.has(targetFolderId)) return false;

      // Cannot drop inside descendants of dragged folders (cycle prevention)
      if (invalidTargetFolderIds && invalidTargetFolderIds.has(targetFolderId)) {
        return false;
      }

      return true;
    },
    onDragEnter: () => onDragStateChange?.(true),
    onDragLeave: () => onDragStateChange?.(false),
    onDrop: ({ source }) => {
      onDragStateChange?.(false);
      const data = source.data as unknown as DraggedItemData;
      if (data && data.type === "drive-items" && data.items?.length) {
        onDropItems(data.items, targetFolderId);
      }
    },
  });
}

export function registerContainerAutoScroll(containerElement: HTMLElement): () => void {
  return autoScrollForElements({
    element: containerElement,
  });
}

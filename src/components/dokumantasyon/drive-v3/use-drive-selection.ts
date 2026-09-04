// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — USE DRIVE SELECTION HOOK (VIRTUAL MARQUEE + KEYBOARD)
// ============================================================================

"use client";

import { useReducer, useRef, useCallback, useEffect, useState } from "react";
import {
  selectionReducer,
  INITIAL_SELECTION_STATE,
  DriveSelectionState,
} from "./selection-reducer";
import {
  getBoundingBox,
  intersects,
  hitTestList,
  hitTestGrid,
  calculateAutoScrollDelta,
  Rect,
} from "./marquee-geometry";
import {
  DRIVE_MARQUEE_START_THRESHOLD,
  GridMetrics,
} from "./drive-metrics";

export type UseDriveSelectionOptions = {
  visibleOrderedIds: string[];
  viewMode: "list" | "grid";
  gridMetrics: GridMetrics;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
};

export function useDriveSelection({
  visibleOrderedIds,
  viewMode,
  gridMetrics,
  scrollContainerRef,
}: UseDriveSelectionOptions) {
  const [state, dispatch] = useReducer(selectionReducer, INITIAL_SELECTION_STATE);

  // Marquee UI State (in container client coordinates for rendering the SVG/div rectangle)
  const [marqueeBox, setMarqueeBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const isMarqueeActiveRef = useRef(false);
  const pointerStartRef = useRef<{
    clientX: number;
    clientY: number;
    contentX: number;
    contentY: number;
    isAdditive: boolean;
    initialSelection: Set<string>;
  } | null>(null);

  const latestPointerRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const updateMarqueeFrameRef = useRef<() => void>(() => {});

  // Reconcile selection when visible universe changes
  useEffect(() => {
    dispatch({ type: "RECONCILE", visibleOrderedIds });
  }, [visibleOrderedIds]);

  // Click handler on individual items
  const handleItemClick = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      dispatch({
        type: "CLICK_ITEM",
        id,
        isCtrl,
        isShift,
        visibleOrderedIds,
      });
    },
    [visibleOrderedIds]
  );

  // Right-click handler on individual items
  const handleItemContextMenu = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch({ type: "RIGHT_CLICK_ITEM", id });
    },
    []
  );

  // Toggle single item selection
  const toggleItemSelection = useCallback((id: string) => {
    dispatch({ type: "TOGGLE_SELECT", id });
  }, []);

  // Select all
  const selectAll = useCallback(() => {
    dispatch({ type: "SELECT_ALL", visibleOrderedIds });
  }, [visibleOrderedIds]);

  // Clear selection
  const clearSelection = useCallback(() => {
    dispatch({ type: "CLEAR_SELECTION" });
  }, []);

  // Replace selection
  const replaceSelection = useCallback((ids: string[]) => {
    dispatch({ type: "REPLACE_SELECTION", ids });
  }, []);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Ignore if user is typing in an input / textarea / contenteditable
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        selectAll();
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        clearSelection();
        return;
      }

      const navKeys = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
        "PageUp",
        "PageDown",
        "Space",
      ] as const;

      const matchedKey = navKeys.find((k) => k === (e.key === " " ? "Space" : e.key));
      if (matchedKey) {
        e.preventDefault();
        const columnCount = viewMode === "grid" ? gridMetrics.columnCount : 1;
        dispatch({
          type: "KEYBOARD_NAV",
          key: matchedKey,
          isShift: e.shiftKey,
          isCtrl: e.ctrlKey || e.metaKey,
          visibleOrderedIds,
          columnCount,
        });
      }
    },
    [selectAll, clearSelection, viewMode, gridMetrics.columnCount, visibleOrderedIds]
  );

  // ============================================================================
  // ============================================================================
  // VIRTUAL MARQUEE POINTER GESTURE ENGINE
  // ============================================================================

  const updateMarqueeFrame = useCallback(() => {
    const container = scrollContainerRef.current;
    const start = pointerStartRef.current;
    const latest = latestPointerRef.current;

    if (!container || !start || !latest) return;

    const rect = container.getBoundingClientRect();
    const currentScrollTop = container.scrollTop;
    const currentScrollLeft = container.scrollLeft;

    // Content space current coordinate
    const currentContentX = latest.clientX - rect.left + currentScrollLeft;
    const currentContentY = latest.clientY - rect.top + currentScrollTop;

    // Selection bbox in content space
    const contentBbox: Rect = getBoundingBox(
      start.contentX,
      start.contentY,
      currentContentX,
      currentContentY
    );

    // Update visual marquee rect (in container content coordinates)
    setMarqueeBox({
      left: contentBbox.left,
      top: contentBbox.top,
      width: Math.max(0, contentBbox.right - contentBbox.left),
      height: Math.max(0, contentBbox.bottom - contentBbox.top),
    });

    // Source-of-Truth: Content-space virtual geometry (virtualization-aware, includes offscreen items)
    let geometryHits: string[] = [];
    if (viewMode === "list") {
      geometryHits = hitTestList(
        contentBbox,
        visibleOrderedIds,
        undefined,
        undefined,
        0,
        container.clientWidth
      );
    } else {
      geometryHits = hitTestGrid(contentBbox, visibleOrderedIds, gridMetrics);
    }

    // Optional mounted element union: Ensures mounted items along visual edges are included
    // without ever dropping offscreen items from the virtual geometry selection
    const hitSet = new Set<string>(geometryHits);
    const renderedElements = container.querySelectorAll<HTMLElement>(
      "[data-folder-id], [data-file-id]"
    );

    if (renderedElements && renderedElements.length > 0) {
      const marqueeViewport: Rect = {
        left: Math.min(start.clientX, latest.clientX),
        right: Math.max(start.clientX, latest.clientX),
        top: Math.min(start.clientY, latest.clientY),
        bottom: Math.max(start.clientY, latest.clientY),
      };

      renderedElements.forEach((el) => {
        const elRect = el.getBoundingClientRect();
        if (intersects(marqueeViewport, elRect)) {
          const id = el.dataset.folderId || el.dataset.fileId;
          if (id) hitSet.add(id);
        }
      });
    }

    const hitIds = visibleOrderedIds.filter((id) => hitSet.has(id));

    dispatch({
      type: "MARQUEE_UPDATE",
      hitIds,
      isAdditive: start.isAdditive,
      initialSelection: start.initialSelection,
    });

    // Auto-scroll calculation
    const scrollDelta = calculateAutoScrollDelta(
      latest.clientY,
      rect.top,
      rect.bottom
    );
    if (scrollDelta !== 0) {
      container.scrollTop += scrollDelta;
      if (isMarqueeActiveRef.current) {
        rafIdRef.current = requestAnimationFrame(() => updateMarqueeFrameRef.current());
      }
    }
  }, [scrollContainerRef, viewMode, visibleOrderedIds, gridMetrics]);

  useEffect(() => {
    updateMarqueeFrameRef.current = updateMarqueeFrame;
  });

  // Coordinate with native / PDD drag: cancel marquee if HTML5 drag begins
  useEffect(() => {
    const handleNativeDragStart = () => {
      if (isMarqueeActiveRef.current || pointerStartRef.current) {
        isMarqueeActiveRef.current = false;
        pointerStartRef.current = null;
        latestPointerRef.current = null;
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        setMarqueeBox(null);
      }
    };

    window.addEventListener("dragstart", handleNativeDragStart, { capture: true });
    return () => {
      window.removeEventListener("dragstart", handleNativeDragStart, { capture: true });
    };
  }, []);

  // Window-level safety: release marquee if pointer is released outside container
  useEffect(() => {
    const handleWindowPointerUp = () => {
      if (isMarqueeActiveRef.current) {
        isMarqueeActiveRef.current = false;
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        setMarqueeBox(null);
        pointerStartRef.current = null;
        latestPointerRef.current = null;
      }
    };

    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);
    return () => {
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
    };
  }, []);

  const handleContainerPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Only primary mouse button (left click)
      if (e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Ignore interactive controls (buttons, links, inputs, dropdown triggers)
      if (
        target.closest(
          "button, a, input, select, textarea, [data-no-marquee]"
        )
      ) {
        return;
      }

      const container = scrollContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const contentX = e.clientX - rect.left + container.scrollLeft;
      const contentY = e.clientY - rect.top + container.scrollTop;

      const isAdditive = e.ctrlKey || e.metaKey;

      pointerStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        contentX,
        contentY,
        isAdditive,
        initialSelection: new Set(state.selectedIds),
      };
      latestPointerRef.current = { clientX: e.clientX, clientY: e.clientY };
      isMarqueeActiveRef.current = false;
    },
    [scrollContainerRef, state.selectedIds]
  );

  const handleContainerPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const start = pointerStartRef.current;
      if (!start) return;

      latestPointerRef.current = { clientX: e.clientX, clientY: e.clientY };

      if (!isMarqueeActiveRef.current) {
        const dx = e.clientX - start.clientX;
        const dy = e.clientY - start.clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance >= DRIVE_MARQUEE_START_THRESHOLD) {
          isMarqueeActiveRef.current = true;
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {}
          dispatch({ type: "MARQUEE_START", isAdditive: start.isAdditive });
          updateMarqueeFrame();
        }
      } else {
        updateMarqueeFrame();
      }
    },
    [updateMarqueeFrame]
  );

  const handleContainerPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const start = pointerStartRef.current;
      if (!start) return;

      if (isMarqueeActiveRef.current) {
        isMarqueeActiveRef.current = false;
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
          rafIdRef.current = null;
        }
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {}
        setMarqueeBox(null);
      } else {
        // Did not cross drag threshold -> If clicked on empty whitespace, clear selection
        const target = e.target as HTMLElement | null;
        const isItem = target?.closest(
          "[data-folder-id], [data-file-id], [data-testid='dok-folder-row'], [data-testid='dok-file-row'], [data-testid='dok-folder-card'], [data-testid='dok-file-card']"
        );
        if (!isItem) {
          clearSelection();
        }
      }

      pointerStartRef.current = null;
      latestPointerRef.current = null;
    },
    [clearSelection]
  );

  const handleContainerPointerCancel = useCallback(() => {
    isMarqueeActiveRef.current = false;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setMarqueeBox(null);
    pointerStartRef.current = null;
    latestPointerRef.current = null;
  }, []);

  const setSelectedIds = useCallback(
    (idsOrUpdater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
      if (typeof idsOrUpdater === "function") {
        const next = idsOrUpdater(state.selectedIds);
        dispatch({ type: "REPLACE_SELECTION", ids: Array.from(next) });
      } else {
        dispatch({ type: "REPLACE_SELECTION", ids: Array.from(idsOrUpdater) });
      }
    },
    [state.selectedIds]
  );

  return {
    selectedIds: state.selectedIds,
    setSelectedIds,
    toggleSelectedId: toggleItemSelection,
    anchorId: state.anchorId,
    focusedId: state.focusedId,
    interactionMode: state.interactionMode,
    isMarqueeActive: Boolean(marqueeBox),
    marqueeBox,
    handleItemClick,
    handleItemContextMenu,
    toggleItemSelection,
    selectAll,
    clearSelection,
    replaceSelection,
    handleKeyDown,
    containerPointerHandlers: {
      onPointerDown: handleContainerPointerDown,
      onPointerMove: handleContainerPointerMove,
      onPointerUp: handleContainerPointerUp,
      onPointerCancel: handleContainerPointerCancel,
    },
  };
}

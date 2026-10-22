"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type React from "react";
import {
  DOCUMENT_STUDIO_PREFIXES,
  INITIAL_FOCUS_STATE,
  buildFieldIdMap,
  isBelgePreviewControl,
  reduceFieldFocus,
  resolveFocusedFieldKey,
  type FieldFocusSelection,
} from "@/lib/belge-field-focus";
import type { BelgeDocumentId } from "@/lib/belge-studio-inline-field-map";

export type { FieldFocusSelection };

export type UseBelgeFieldFocusOptions = {
  documentId: BelgeDocumentId;
  prefix?: string;
  studioRootRef?: React.RefObject<HTMLElement | null>;
};

export type UseBelgeFieldFocusReturn = {
  fieldKey: string | null;
  lastFocusedFieldKey: string | null;
  focusEventId: number;
  selection: FieldFocusSelection;
  containerProps: {
    onFocusCapture: (event: React.FocusEvent<HTMLElement>) => void;
    onBlurCapture: (event: React.FocusEvent<HTMLElement>) => void;
    onKeyDownCapture: (event: React.KeyboardEvent<HTMLElement>) => void;
  };
  clearSelection: () => void;
  setFocusedField: (fieldKey: string | null) => void;
};

/**
 * Custom hook managing form focus tracking and PDF highlight state synchronization.
 *
 * Architecture rules:
 * - Event delegation: `containerProps` is attached only to the form's main scroll container.
 * - Monotonic `focusEventId`: Increments ONLY when genuine new field focus occurs.
 * - 120 ms blur debounce window: Prevents `null` flicker when Tab-navigating between fields (A -> B).
 * - Contextual preview toolbar exception: If focus moves to zoom/fit/page tools, active highlight is preserved.
 * - Strict cancellation: `clearSelection` (Esc, Reset, Clear) wipes both active and mobile last focused fields.
 * - Complete unmount and document change cleanup without leaking timers.
 */
export function useBelgeFieldFocus({
  documentId,
  prefix,
  studioRootRef,
}: UseBelgeFieldFocusOptions): UseBelgeFieldFocusReturn {
  const activePrefix = prefix ?? DOCUMENT_STUDIO_PREFIXES[documentId] ?? "";

  const idMap = useMemo(
    () => buildFieldIdMap(documentId, activePrefix),
    [documentId, activePrefix]
  );

  const [state, dispatch] = useReducer(reduceFieldFocus, INITIAL_FOCUS_STATE);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelBlurTimer = useCallback(() => {
    if (blurTimerRef.current !== null) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
  }, []);

  // Reset state when switching document templates
  useEffect(() => {
    cancelBlurTimer();
    dispatch({ type: "DOCUMENT_CHANGE", documentId });
  }, [documentId, cancelBlurTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      cancelBlurTimer();
    };
  }, [cancelBlurTimer]);

  const clearSelection = useCallback(() => {
    cancelBlurTimer();
    dispatch({ type: "CLEAR_SELECTION" });
  }, [cancelBlurTimer]);

  const setFocusedField = useCallback(
    (fieldKey: string | null) => {
      cancelBlurTimer();
      dispatch({ type: "SET_FIELD", fieldKey });
    },
    [cancelBlurTimer]
  );

  const handleFocusCapture = useCallback(
    (event: React.FocusEvent<HTMLElement>) => {
      cancelBlurTimer();
      const resolvedKey = resolveFocusedFieldKey(idMap, event.target);
      if (resolvedKey) {
        dispatch({ type: "FOCUS", fieldKey: resolvedKey });
      }
    },
    [idMap, cancelBlurTimer]
  );

  const handleBlurCapture = useCallback(
    (event: React.FocusEvent<HTMLElement>) => {
      cancelBlurTimer();

      // If focus moved to preview controls (zoom, fit, page navigation, canvas), keep highlight visible
      if (isBelgePreviewControl(event.relatedTarget)) {
        return;
      }

      // If focus moved to a reset/clear button, clear immediately
      const related = event.relatedTarget as HTMLElement | null;
      if (
        related &&
        (related.getAttribute("data-testid")?.includes("reset") ||
          related.getAttribute("data-belge-reset") === "true")
      ) {
        clearSelection();
        return;
      }

      // Standard blur: start 120ms debounce window to prevent Tab A->B flicker
      blurTimerRef.current = setTimeout(() => {
        dispatch({ type: "BLUR_TIMEOUT" });
        blurTimerRef.current = null;
      }, 120);
    },
    [cancelBlurTimer, clearSelection]
  );

  const handleKeyDownCapture = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "Escape") {
        clearSelection();
      }
    },
    [clearSelection]
  );

  // Catch Escape globally within studio root if provided
  useEffect(() => {
    const root = studioRootRef?.current;
    if (!root) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        clearSelection();
      }
    };

    root.addEventListener("keydown", handleKeyDown);
    return () => {
      root.removeEventListener("keydown", handleKeyDown);
    };
  }, [studioRootRef, clearSelection]);

  const selection: FieldFocusSelection = useMemo(
    () => ({
      documentId,
      fieldKey: state.fieldKey,
      lastFocusedFieldKey: state.lastFocusedFieldKey,
      focusEventId: state.focusEventId,
    }),
    [documentId, state.fieldKey, state.lastFocusedFieldKey, state.focusEventId]
  );

  const containerProps = useMemo(
    () => ({
      onFocusCapture: handleFocusCapture,
      onBlurCapture: handleBlurCapture,
      onKeyDownCapture: handleKeyDownCapture,
    }),
    [handleFocusCapture, handleBlurCapture, handleKeyDownCapture]
  );

  return {
    fieldKey: state.fieldKey,
    lastFocusedFieldKey: state.lastFocusedFieldKey,
    focusEventId: state.focusEventId,
    selection,
    containerProps,
    clearSelection,
    setFocusedField,
  };
}

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
        dispatch({ type: "FORM_BLUR" });
        return;
      }

      // If focus moved to a reset/clear button, clear immediately
      const related = event.relatedTarget as HTMLElement | null;
      if (
        related &&
        (related.getAttribute("data-testid")?.includes("reset") ||
          related.getAttribute("data-testid")?.includes("clear") ||
          related.getAttribute("data-belge-reset") === "true")
      ) {
        clearSelection();
        return;
      }

      // Mark form as blurred
      dispatch({ type: "FORM_BLUR" });

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

  // Catch Escape globally within studio root and monitor focus shifts between preview toolbar and outside actions
  useEffect(() => {
    const root = studioRootRef?.current;
    if (!root) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (
          root &&
          document.activeElement &&
          document.activeElement !== document.body &&
          !root.contains(document.activeElement)
        ) {
          return;
        }
        clearSelection();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // If target is a form input, handleFocusCapture handles it; cancel blur timer
      const resolvedKey = resolveFocusedFieldKey(idMap, target);
      if (resolvedKey) {
        cancelBlurTimer();
        return;
      }

      // If target is inside preview controls (toolbar, canvas), retain highlight and cancel blur timer
      if (isBelgePreviewControl(target)) {
        cancelBlurTimer();
        return;
      }

      // If target is a reset or clear action, clear selection immediately
      const testId = target.getAttribute("data-testid") ?? "";
      if (
        testId.includes("reset") ||
        testId.includes("clear") ||
        target.getAttribute("data-belge-reset") === "true"
      ) {
        clearSelection();
        return;
      }

      // Focus moved to an unrelated studio button (e.g. Yazdır, İndir, header buttons):
      // Schedule 120ms blur debounce window so highlight is cleared without instant flicker
      cancelBlurTimer();
      blurTimerRef.current = setTimeout(() => {
        dispatch({ type: "BLUR_TIMEOUT" });
        blurTimerRef.current = null;
      }, 120);
    };

    const handleFocusOut = (event: FocusEvent) => {
      const nextTarget = event.relatedTarget as HTMLElement | null;
      // Zoom sınırında odaklı düğmenin disabled olması odağı body'ye düşürür.
      // Kullanıcının PDF aracı seçimi sürerken rehberi bu teknik blur ile silme.
      if (!nextTarget && event.target instanceof HTMLButtonElement &&
        event.target.disabled && isBelgePreviewControl(event.target)) {
        return;
      }
      // If focus is leaving the studio root entirely (or browser window blur):
      if (!nextTarget || !root.contains(nextTarget)) {
        cancelBlurTimer();
        blurTimerRef.current = setTimeout(() => {
          dispatch({ type: "BLUR_TIMEOUT" });
          blurTimerRef.current = null;
        }, 120);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    root.addEventListener("focusin", handleFocusIn);
    root.addEventListener("focusout", handleFocusOut);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      root.removeEventListener("focusin", handleFocusIn);
      root.removeEventListener("focusout", handleFocusOut);
    };
  }, [studioRootRef, idMap, cancelBlurTimer, clearSelection]);

  const selection: FieldFocusSelection = useMemo(
    () => ({
      documentId,
      fieldKey: state.fieldKey,
      lastFocusedFieldKey: state.lastFocusedFieldKey,
      focusEventId: state.focusEventId,
      clearEventId: state.clearEventId ?? 0,
    }),
    [documentId, state.fieldKey, state.lastFocusedFieldKey, state.focusEventId, state.clearEventId]
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

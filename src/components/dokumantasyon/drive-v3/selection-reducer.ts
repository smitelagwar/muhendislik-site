// ============================================================================
// DÖKÜMANTASYON DRIVE V3.1 — SELECTION REDUCER & INTERACTION STATE MACHINE
// ============================================================================

export type DriveSelectionState = {
  selectedIds: Set<string>;
  anchorId: string | null;
  focusedId: string | null;
  interactionMode: "pointer" | "keyboard" | "marquee";
};

export type DriveSelectionAction =
  | {
      type: "CLICK_ITEM";
      id: string;
      isCtrl: boolean;
      isShift: boolean;
      visibleOrderedIds: string[];
    }
  | {
      type: "RIGHT_CLICK_ITEM";
      id: string;
    }
  | {
      type: "SELECT_ALL";
      visibleOrderedIds: string[];
    }
  | {
      type: "CLEAR_SELECTION";
    }
  | {
      type: "TOGGLE_SELECT";
      id: string;
    }
  | {
      type: "REPLACE_SELECTION";
      ids: string[];
    }
  | {
      type: "RECONCILE";
      visibleOrderedIds: string[];
    }
  | {
      type: "MARQUEE_START";
      isAdditive: boolean;
    }
  | {
      type: "MARQUEE_UPDATE";
      hitIds: string[];
      isAdditive: boolean;
      initialSelection: Set<string>;
    }
  | {
      type: "KEYBOARD_NAV";
      key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Home" | "End" | "PageUp" | "PageDown" | "Space";
      isShift: boolean;
      isCtrl: boolean;
      visibleOrderedIds: string[];
      columnCount: number;
    };

export const INITIAL_SELECTION_STATE: DriveSelectionState = {
  selectedIds: new Set<string>(),
  anchorId: null,
  focusedId: null,
  interactionMode: "pointer",
};

export function selectionReducer(
  state: DriveSelectionState,
  action: DriveSelectionAction
): DriveSelectionState {
  switch (action.type) {
    case "CLICK_ITEM": {
      const { id, isCtrl, isShift, visibleOrderedIds } = action;

      if (isShift && state.anchorId && visibleOrderedIds.includes(state.anchorId) && visibleOrderedIds.includes(id)) {
        const anchorIdx = visibleOrderedIds.indexOf(state.anchorId);
        const targetIdx = visibleOrderedIds.indexOf(id);
        const minIdx = Math.min(anchorIdx, targetIdx);
        const maxIdx = Math.max(anchorIdx, targetIdx);
        const rangeIds = visibleOrderedIds.slice(minIdx, maxIdx + 1);

        const nextSelection = isCtrl ? new Set(state.selectedIds) : new Set<string>();
        for (const rId of rangeIds) {
          nextSelection.add(rId);
        }

        return {
          ...state,
          selectedIds: nextSelection,
          focusedId: id,
          interactionMode: "pointer",
        };
      }

      if (isCtrl) {
        const nextSelection = new Set(state.selectedIds);
        if (nextSelection.has(id)) {
          nextSelection.delete(id);
        } else {
          nextSelection.add(id);
        }
        return {
          selectedIds: nextSelection,
          anchorId: id,
          focusedId: id,
          interactionMode: "pointer",
        };
      }

      return {
        selectedIds: new Set([id]),
        anchorId: id,
        focusedId: id,
        interactionMode: "pointer",
      };
    }

    case "RIGHT_CLICK_ITEM": {
      if (state.selectedIds.has(action.id)) {
        // Multi-selection is preserved on right-clicking an already selected item
        return {
          ...state,
          focusedId: action.id,
          interactionMode: "pointer",
        };
      }
      // Right-clicking an unselected item replaces selection
      return {
        selectedIds: new Set([action.id]),
        anchorId: action.id,
        focusedId: action.id,
        interactionMode: "pointer",
      };
    }

    case "SELECT_ALL": {
      return {
        ...state,
        selectedIds: new Set(action.visibleOrderedIds),
        interactionMode: "keyboard",
      };
    }

    case "CLEAR_SELECTION": {
      return {
        selectedIds: new Set<string>(),
        anchorId: null,
        focusedId: null,
        interactionMode: "pointer",
      };
    }

    case "TOGGLE_SELECT": {
      const nextSelection = new Set(state.selectedIds);
      if (nextSelection.has(action.id)) {
        nextSelection.delete(action.id);
      } else {
        nextSelection.add(action.id);
      }
      return {
        ...state,
        selectedIds: nextSelection,
        anchorId: action.id,
        focusedId: action.id,
        interactionMode: "pointer",
      };
    }

    case "REPLACE_SELECTION": {
      return {
        ...state,
        selectedIds: new Set(action.ids),
        anchorId: action.ids[0] || null,
        focusedId: action.ids[action.ids.length - 1] || null,
        interactionMode: "pointer",
      };
    }

    case "RECONCILE": {
      const visibleSet = new Set(action.visibleOrderedIds);
      const nextSelection = new Set<string>();
      for (const id of state.selectedIds) {
        if (visibleSet.has(id)) {
          nextSelection.add(id);
        }
      }
      const validAnchor = state.anchorId && visibleSet.has(state.anchorId) ? state.anchorId : null;
      const validFocus = state.focusedId && visibleSet.has(state.focusedId) ? state.focusedId : null;

      return {
        ...state,
        selectedIds: nextSelection,
        anchorId: validAnchor,
        focusedId: validFocus,
      };
    }

    case "MARQUEE_START": {
      return {
        ...state,
        interactionMode: "marquee",
      };
    }

    case "MARQUEE_UPDATE": {
      const { hitIds, isAdditive, initialSelection } = action;
      let nextSelection: Set<string>;

      if (isAdditive) {
        nextSelection = new Set(initialSelection);
        for (const id of hitIds) {
          nextSelection.add(id);
        }
      } else {
        nextSelection = new Set(hitIds);
      }

      return {
        ...state,
        selectedIds: nextSelection,
        interactionMode: "marquee",
      };
    }

    case "KEYBOARD_NAV": {
      const { key, isShift, isCtrl, visibleOrderedIds, columnCount } = action;
      if (visibleOrderedIds.length === 0) return state;

      const currentIdx = state.focusedId ? visibleOrderedIds.indexOf(state.focusedId) : -1;
      let nextIdx = currentIdx;

      switch (key) {
        case "ArrowDown":
          nextIdx = currentIdx === -1 ? 0 : Math.min(visibleOrderedIds.length - 1, currentIdx + columnCount);
          break;
        case "ArrowUp":
          nextIdx = currentIdx === -1 ? visibleOrderedIds.length - 1 : Math.max(0, currentIdx - columnCount);
          break;
        case "ArrowRight":
          nextIdx = currentIdx === -1 ? 0 : Math.min(visibleOrderedIds.length - 1, currentIdx + 1);
          break;
        case "ArrowLeft":
          nextIdx = currentIdx === -1 ? 0 : Math.max(0, currentIdx - 1);
          break;
        case "Home":
          nextIdx = 0;
          break;
        case "End":
          nextIdx = visibleOrderedIds.length - 1;
          break;
        case "PageDown":
          nextIdx = currentIdx === -1 ? 0 : Math.min(visibleOrderedIds.length - 1, currentIdx + columnCount * 4);
          break;
        case "PageUp":
          nextIdx = currentIdx === -1 ? 0 : Math.max(0, currentIdx - columnCount * 4);
          break;
        case "Space":
          if (currentIdx !== -1) {
            const focusedId = visibleOrderedIds[currentIdx];
            if (isCtrl) {
              const nextSelection = new Set(state.selectedIds);
              if (nextSelection.has(focusedId)) {
                nextSelection.delete(focusedId);
              } else {
                nextSelection.add(focusedId);
              }
              return {
                ...state,
                selectedIds: nextSelection,
                anchorId: focusedId,
                interactionMode: "keyboard",
              };
            } else {
              return {
                ...state,
                selectedIds: new Set([focusedId]),
                anchorId: focusedId,
                interactionMode: "keyboard",
              };
            }
          }
          return state;
      }

      if (nextIdx === -1 || nextIdx >= visibleOrderedIds.length) return state;
      const targetId = visibleOrderedIds[nextIdx];

      if (isShift) {
        const anchor = state.anchorId || (currentIdx !== -1 ? visibleOrderedIds[currentIdx] : targetId);
        const anchorIdx = visibleOrderedIds.indexOf(anchor);
        const minIdx = Math.min(anchorIdx, nextIdx);
        const maxIdx = Math.max(anchorIdx, nextIdx);
        const rangeIds = visibleOrderedIds.slice(minIdx, maxIdx + 1);

        return {
          selectedIds: new Set(rangeIds),
          anchorId: anchor,
          focusedId: targetId,
          interactionMode: "keyboard",
        };
      }

      if (isCtrl) {
        // Ctrl+Arrow navigates focus without changing selection
        return {
          ...state,
          focusedId: targetId,
          interactionMode: "keyboard",
        };
      }

      return {
        selectedIds: new Set([targetId]),
        anchorId: targetId,
        focusedId: targetId,
        interactionMode: "keyboard",
      };
    }

    default:
      return state;
  }
}

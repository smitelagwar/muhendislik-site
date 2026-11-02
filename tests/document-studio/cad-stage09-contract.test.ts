import test from "node:test";
import assert from "node:assert/strict";
import { cadReviewStatusCopy } from "../../src/components/dokumantasyon/preview/cad-review-status-line";
import { attachCadReviewKeyboardShortcuts } from "../../src/components/dokumantasyon/preview/cad-review-shortcuts";

test("stage09 status never mislabels unknown source as metres and distinguishes snap modes", () => {
  const unknown = cadReviewStatusCopy("area", "unitless", "m2", false);
  assert.equal(unknown.tool, "Alan");
  assert.match(unknown.units, /belirsiz/);
  assert.equal(unknown.snap, "OSNAP kapalı");
  const known = cadReviewStatusCopy("distance", "mm", "m", true, "endpoint");
  assert.equal(known.units, "Kaynak mm · gösterim m");
  assert.match(known.snap, /Uç/);
  assert.equal(cadReviewStatusCopy("chain_distance", "cm", "cm", true).tool, "Zincir mesafe");
});

test("stage09 shortcuts never commit/delete on focused text inputs, dialogs or modified keys", () => {
  const prev = (globalThis as { window?: unknown }).window;
  const listeners = new Map<string, (event: KeyboardEvent) => void>();
  (globalThis as { window?: unknown }).window = {
    addEventListener: (key: string, fn: (event: KeyboardEvent) => void) => listeners.set(key, fn),
    removeEventListener: (key: string) => listeners.delete(key),
  };
  const calls: string[] = [];
  try {
    const detach = attachCadReviewKeyboardShortcuts({
      onEscape: () => calls.push("escape"),
      onEnter: () => calls.push("enter"),
      onDelete: () => calls.push("delete"),
      onUndo: () => calls.push("undo"),
      onSearch: () => calls.push("search"),
    });
    const send = (key: string, target: string, extra: Record<string, unknown> = {}) => {
      listeners.get("keydown")?.({ key, target: { tagName: target, isContentEditable: target === "EDITABLE" }, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false, preventDefault() {}, ...extra } as unknown as KeyboardEvent);
    };
    send("Escape", "INPUT"); send("Enter", "TEXTAREA"); send("Delete", "EDITABLE");
    send("Backspace", "SELECT"); send("Enter", "BUTTON", { ctrlKey: true });
    send("Escape", "BUTTON", { defaultPrevented: true });
    assert.deepEqual(calls, []);
    send("Escape", "CANVAS"); send("Enter", "CANVAS");
    send("Delete", "CANVAS"); send("z", "CANVAS", { ctrlKey: true });
    send("f", "CANVAS", { ctrlKey: true });
    assert.deepEqual(calls, ["escape","enter","delete","undo","search"]);
    detach(); assert.equal(listeners.has("keydown"), false);
  } finally { (globalThis as { window?: unknown }).window = prev; }
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { CadMobileGestureGuard } from "../src/lib/dokumantasyon/cad-upstream/mobile-gesture-guard";

type Listener = (event: PointerEvent) => void;

class TestPointerHost {
  private readonly listeners = new Map<string, Set<Listener>>();

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    const callback = listener as Listener;
    const entries = this.listeners.get(type) ?? new Set<Listener>();
    entries.add(callback);
    this.listeners.set(type, entries);
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    this.listeners.get(type)?.delete(listener as Listener);
  }

  emit(type: string, pointerId: number, pointerType: string): void {
    const event = { pointerId, pointerType } as PointerEvent;
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

async function main(): Promise<void> {
  const host = new TestPointerHost();
  let multiTouchStarts = 0;
  const guard = new CadMobileGestureGuard(host as unknown as HTMLElement, {
    onMultiTouchStart: () => {
      multiTouchStarts += 1;
    },
  });

  host.emit("pointerdown", 1, "touch");
  assert.equal(
    multiTouchStarts,
    0,
    "one touch must remain a single-pointer gesture"
  );
  assert.equal(guard.isMultiTouchActive, false);

  host.emit("pointerdown", 90, "mouse");
  assert.equal(
    multiTouchStarts,
    0,
    "mouse pointers must not join the mobile gesture set"
  );

  host.emit("pointerdown", 2, "touch");
  assert.equal(
    multiTouchStarts,
    1,
    "the second touch must start multi-touch exactly once"
  );
  assert.equal(guard.isMultiTouchActive, true);

  host.emit("pointerdown", 3, "touch");
  assert.equal(
    multiTouchStarts,
    1,
    "additional fingers must not repeatedly cancel a command"
  );
  assert.equal(guard.isMultiTouchActive, true);

  host.emit("pointerup", 2, "touch");
  assert.equal(
    guard.isMultiTouchActive,
    true,
    "two remaining touches must keep the multi-touch gesture active"
  );

  host.emit("pointercancel", 3, "touch");
  assert.equal(
    guard.isMultiTouchActive,
    false,
    "dropping below two touches must end the multi-touch gesture"
  );

  host.emit("pointerdown", 4, "touch");
  assert.equal(
    multiTouchStarts,
    2,
    "a later second touch must start a new multi-touch gesture"
  );
  assert.equal(guard.isMultiTouchActive, true);

  host.emit("lostpointercapture", 4, "touch");
  assert.equal(
    guard.isMultiTouchActive,
    false,
    "lost capture must clean up touch state"
  );

  guard.destroy();
  host.emit("pointerdown", 5, "touch");
  assert.equal(multiTouchStarts, 2, "destroy must detach every pointer listener");

  const adapter = await readFile(
    resolve(process.cwd(), "src/lib/dokumantasyon/cad-upstream/adapter.ts"),
    "utf8"
  );

  for (const token of [
    "activeMeasurementCommand",
    "configureMobileGestureGuard",
    "abortMeasurementForMultiTouch",
    "onMultiTouchStart",
    "this.manager.commandManager.cancelActive()",
    "this.restorePanMode()",
  ]) {
    assert.ok(
      adapter.includes(token),
      `adapter gesture contract token missing: ${token}`
    );
  }

  console.log(
    "GATE: PASS — mobile single-pointer measurement and two-finger pinch are isolated."
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { CoalescedHostUiUpdates } from "../../src/lib/cad-v2/render/coalesced-host-ui-updates";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function createFakeClock() {
  let now = 0;
  let nextId = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();
  return {
    timers: {
      setTimeout(callback: () => void, delayMs: number) {
        const id = ++nextId;
        timers.set(id, { at: now + delayMs, callback });
        return id;
      },
      clearTimeout(handle: unknown) {
        timers.delete(handle as number);
      },
    },
    advance(ms: number) {
      const target = now + ms;
      while (true) {
        const due = [...timers.entries()].filter(([, timer]) => timer.at <= target)
          .sort((left, right) => left[1].at - right[1].at)[0];
        if (!due) break;
        now = due[1].at;
        timers.delete(due[0]);
        due[1].callback();
      }
      now = target;
    },
    pendingCount: () => timers.size,
  };
}

function run() {
  const clock = createFakeClock();
  const published: Array<{ progress?: string; entityCount?: number }> = [];
  const updates = new CoalescedHostUiUpdates((update) => published.push(update), 100, clock.timers);

  for (let index = 0; index < 20_000; index++) {
    updates.schedule({ progress: `chunk-${index}`, entityCount: index });
  }
  assert(published.length === 0, "chunk event bursts should not synchronously rerender the host");
  assert(clock.pendingCount() === 1, "chunk event bursts should share one trailing timer");
  clock.advance(100);
  assert(published.length === 1, "the burst should publish one React state update");
  assert(published[0]?.progress === "chunk-19999" && published[0]?.entityCount === 19_999,
    "the coalesced update should keep the latest progress and entity count");

  updates.schedule({ progress: "stale" });
  updates.cancelPending();
  clock.advance(100);
  assert(published.length === 1, "cancelled generation progress must not publish later");

  updates.schedule({ progress: "final" });
  updates.flush();
  assert(published.length === 2 && published[1]?.progress === "final",
    "completion should flush the last progress immediately");
  assert(clock.pendingCount() === 0, "flush should clear its scheduled timer");

  updates.schedule({ entityCount: 20_001 });
  updates.dispose();
  clock.advance(100);
  assert(published.length === 2, "dispose should cancel pending React updates");
  console.log("PASS: 20,000 chunk telemetry events coalesce into one latest React update");
  console.log("PASS: cancellation, final flush, and dispose keep generation state current");
}

run();

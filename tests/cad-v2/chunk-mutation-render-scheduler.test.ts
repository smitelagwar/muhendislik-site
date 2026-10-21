import { ChunkMutationRenderScheduler } from "../../src/lib/cad-v2/render/chunk-mutation-render-scheduler";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function createFakeClock() {
  let now = 0;
  let nextId = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();
  return {
    now: () => now,
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
  let invalidations = 0;
  const scheduler = new ChunkMutationRenderScheduler(
    () => invalidations++,
    100,
    clock.now,
    clock.timers,
  );
  const endBatch = scheduler.begin();

  for (let index = 0; index < 10_000; index++) scheduler.request();
  assert(invalidations === 1, "the first visible chunk should schedule an immediate frame");
  assert(clock.pendingCount() === 1, "many pending chunk mutations should share one timer");

  clock.advance(99);
  for (let index = 0; index < 10_000; index++) scheduler.request();
  assert(invalidations === 1, "chunk ingestion must not request another frame before the interval");
  clock.advance(1);
  assert(invalidations === 2, "the trailing chunk mutations should produce a frame at the interval");

  endBatch();
  endBatch();
  assert(invalidations === 3, "ending the final batch should flush the latest scene once");
  assert(clock.pendingCount() === 0, "batch completion should leave no scheduled timer");

  scheduler.begin();
  scheduler.request();
  scheduler.dispose();
  assert(clock.pendingCount() === 0, "dispose should clear an outstanding timer");
  const beforeDisposedRequest = invalidations;
  scheduler.request();
  assert(invalidations === beforeDisposedRequest, "disposed scheduler should ignore chunk mutations");

  console.log("PASS: 20,000 chunk mutations coalesce to bounded frames and batch completion flushes once");
  console.log("PASS: dispose clears the pending render timer and blocks later invalidations");
}

run();

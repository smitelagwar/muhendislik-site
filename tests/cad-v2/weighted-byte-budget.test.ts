import { WeightedByteBudget } from "../../src/lib/cad-v2/worker/weighted-byte-budget";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`PASS: ${message}`);
}

async function runWeightedByteBudgetTests(): Promise<void> {
  const budget = new WeightedByteBudget(16);
  const releaseFirst = await budget.acquire(12);
  assert(releaseFirst !== null && budget.getReservedBytes() === 12, "acquire reserves the requested byte weight");

  let waitingReservation: (() => void) | null | undefined;
  const waiting = budget.acquire(8).then((release) => { waitingReservation = release; });
  await Promise.resolve();
  assert(waitingReservation === undefined, "reservation waits while the combined weight exceeds the cap");

  releaseFirst?.();
  releaseFirst?.();
  await waiting;
  assert(typeof waitingReservation === "function" && budget.getReservedBytes() === 8, "release wakes the waiter and duplicate release is harmless");
  waitingReservation?.();
  assert(budget.getReservedBytes() === 0, "released capacity returns to zero");

  const releaseHeld = await budget.acquire(12);
  const abortController = new AbortController();
  const canceledReservation = budget.acquire(8, abortController.signal);
  abortController.abort();
  assert(await canceledReservation === null, "aborted waiter exits without taking capacity");
  releaseHeld?.();

  let oversizedRejected = false;
  try {
    await budget.acquire(17);
  } catch {
    oversizedRejected = true;
  }
  assert(oversizedRejected, "a single reservation larger than the cap is rejected");
  assert(budget.getReservedBytes() === 0, "failed and canceled acquisitions leave no reservation behind");
}

void runWeightedByteBudgetTests();

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { CadReviewPersistenceCoordinator } from "../src/lib/dokumantasyon/cad-review/persistence";
import type { CadReviewDocument } from "../src/lib/dokumantasyon/cad-review/schema";

const NOW = "2026-08-31T16:00:00.000Z";
const wait = (ms: number) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

function makeDocument(overrides: Partial<CadReviewDocument & { serverRevisionId?: string }> = {}) {
  return {
    schemaVersion: 1 as const,
    fileId: "00000000-0000-4000-8000-000000000001",
    sourceVersionKey: "rev-a",
    sourceSha256: "a".repeat(64),
    revision: 0,
    items: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  } as CadReviewDocument & { serverRevisionId?: string };
}

function response(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function offlineHydrateRetryGate() {
  let document = makeDocument();
  let getCalls = 0;
  const coordinator = new CadReviewPersistenceCoordinator({
    fileId: document.fileId,
    getDocument: () => document,
    applyServerDocument: (next) => { document = next; },
    acknowledgeServerSave: (next) => { document = { ...document, revision: next.revision, updatedAt: next.updatedAt }; },
    saveLocal: () => {},
    fetchImpl: async (_input, init) => {
      assert.equal(init?.method, "GET");
      getCalls += 1;
      if (getCalls === 1) return response(503, { error: "offline" });
      return response(200, {
        schemaVersion: 1,
        serverRevisionId: "rev-a",
        revision: 0,
        document: makeDocument({ serverRevisionId: "rev-a" }),
      });
    },
    debounceMs: 5,
  });

  await coordinator.hydrate();
  assert.equal(coordinator.getState().status, "error");
  coordinator.retry();
  await wait(20);
  assert.equal(getCalls, 2, "retry after an initial GET failure must re-run hydration");
  assert.equal(coordinator.getState().status, "clean");
  coordinator.dispose();
}

function finalSourceContractGate() {
  const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
  const persistence = source("src/lib/dokumantasyon/cad-review/persistence.ts");
  const activeStore = source("src/lib/dokumantasyon/cad-review/active-store.ts");
  const saveUi = source("src/lib/dokumantasyon/cad-review/save-state-ui.ts");

  assert.ok(persistence.includes("this.hydrated = false"));
  assert.ok(persistence.includes("this.changeVersion === saveStartVersion"));
  assert.ok(persistence.includes("private revisionBlocked = false"));
  assert.ok(saveUi.includes('CAD_REVIEW_SAVE_RETRY_EVENT = "cad:review-save-retry"'));
  assert.ok(saveUi.includes('indicator.dataset.cadSaveRetry = "true"'));
  assert.ok(saveUi.includes('event.key !== "Enter" && event.key !== " "'));
  assert.ok(activeStore.includes("window.addEventListener(CAD_REVIEW_SAVE_RETRY_EVENT, retryCurrentCadReviewSave)"));
  assert.ok(activeStore.includes("export function retryCurrentCadReviewSave"));
}

await offlineHydrateRetryGate();
finalSourceContractGate();
console.log("GATE: PASS — Stage 5 final retry/hydration and save-state interaction contract.");

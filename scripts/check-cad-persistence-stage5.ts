import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { CadReviewPersistenceCoordinator } from "../src/lib/dokumantasyon/cad-review/persistence";
import {
  CAD_STUDIO_UI_PREFERENCES_KEY,
  loadCadStudioUiPreferences,
  saveCadStudioUiPreferences,
} from "../src/lib/dokumantasyon/cad-review/ui-preferences";
import { isCadReviewServerRevisionCompatible } from "../src/lib/dokumantasyon/cad-review/server-contract";
import type { CadReviewDocument } from "../src/lib/dokumantasyon/cad-review/schema";

const wait = (ms: number) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
const now = "2026-08-31T16:00:00.000Z";

function makeDocument(overrides: Partial<CadReviewDocument & { serverRevisionId?: string }> = {}) {
  return {
    schemaVersion: 1 as const,
    fileId: "00000000-0000-4000-8000-000000000001",
    sourceVersionKey: "rev-a",
    sourceSha256: "a".repeat(64),
    revision: 0,
    items: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as CadReviewDocument & { serverRevisionId?: string };
}

function response(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function acknowledgeMetadata(current: CadReviewDocument, saved: CadReviewDocument): CadReviewDocument {
  return {
    ...current,
    revision: saved.revision,
    updatedAt: saved.updatedAt,
    sourceVersionKey: saved.sourceVersionKey,
    sourceSha256: saved.sourceSha256,
  };
}

async function queueGate() {
  let document = makeDocument({ serverRevisionId: "rev-a" });
  let patchCalls = 0;
  let inFlight = 0;
  let maxInFlight = 0;
  let serverRevision = 0;
  let lastPatchItems = 0;
  const localSnapshots: CadReviewDocument[] = [];

  const fetchImpl: typeof fetch = async (_input, init) => {
    if (!init || init.method === "GET") {
      return response(200, {
        schemaVersion: 1,
        serverRevisionId: "rev-a",
        revision: serverRevision,
        document: makeDocument({ revision: serverRevision, serverRevisionId: "rev-a" }),
      });
    }
    patchCalls += 1;
    inFlight += 1;
    maxInFlight = Math.max(maxInFlight, inFlight);
    await wait(8);
    const body = JSON.parse(String(init.body));
    assert.equal(body.serverRevisionId, "rev-a");
    assert.equal(body.expectedRevision, serverRevision);
    lastPatchItems = body.items.length;
    serverRevision += 1;
    inFlight -= 1;
    return response(200, {
      success: true,
      serverRevisionId: "rev-a",
      revision: serverRevision,
      savedAt: now,
      document: makeDocument({ revision: serverRevision, items: body.items, serverRevisionId: "rev-a" }),
    });
  };

  const coordinator = new CadReviewPersistenceCoordinator({
    fileId: document.fileId,
    getDocument: () => document,
    applyServerDocument: (next) => { document = next; },
    acknowledgeServerSave: (next) => { document = acknowledgeMetadata(document, next); },
    saveLocal: (next) => { localSnapshots.push(next); },
    fetchImpl,
    debounceMs: 12,
  });

  await coordinator.hydrate();
  assert.equal(coordinator.getState().status, "clean");

  for (let index = 0; index < 20; index += 1) {
    document = makeDocument({
      revision: serverRevision,
      serverRevisionId: "rev-a",
      items: Array.from({ length: index + 1 }, () => ({}) as never),
    });
    coordinator.markDocumentChanged();
  }
  await wait(45);
  assert.equal(patchCalls, 1, "rapid committed changes must collapse into one debounced PATCH");
  assert.equal(lastPatchItems, 20, "debounced save must send the latest snapshot");
  assert.equal(maxInFlight, 1, "save queue must never exceed one in-flight request");
  assert.equal(coordinator.getState().status, "clean");
  assert.ok(localSnapshots.length >= 20, "every committed change keeps immediate local recovery");

  document = makeDocument({ revision: serverRevision, serverRevisionId: "rev-a", items: [{ a: 1 } as never] });
  coordinator.markDocumentChanged();
  const firstFlush = coordinator.flushNow();
  await wait(2);
  document = makeDocument({ revision: serverRevision, serverRevisionId: "rev-a", items: [{ a: 1 } as never, { b: 2 } as never] });
  coordinator.markDocumentChanged();
  await firstFlush;
  await wait(35);
  assert.equal(maxInFlight, 1, "changes during save must wait behind the active request");
  assert.equal(lastPatchItems, 2, "queued save must eventually persist the latest snapshot");
  assert.equal(coordinator.getState().status, "clean");
  coordinator.dispose();
}

async function errorAndRetryGate() {
  let document = makeDocument({ serverRevisionId: "rev-a" });
  let shouldFail = true;
  let patches = 0;
  let localWrites = 0;
  const fetchImpl: typeof fetch = async (_input, init) => {
    if (!init || init.method === "GET") {
      return response(200, {
        serverRevisionId: "rev-a",
        revision: 0,
        document: makeDocument({ serverRevisionId: "rev-a" }),
      });
    }
    patches += 1;
    if (shouldFail) return response(500, { error: "simulated server failure" });
    const body = JSON.parse(String(init.body));
    return response(200, {
      serverRevisionId: "rev-a",
      revision: 1,
      savedAt: now,
      document: makeDocument({ revision: 1, items: body.items, serverRevisionId: "rev-a" }),
    });
  };
  const coordinator = new CadReviewPersistenceCoordinator({
    fileId: document.fileId,
    getDocument: () => document,
    applyServerDocument: (next) => { document = next; },
    acknowledgeServerSave: (next) => { document = acknowledgeMetadata(document, next); },
    saveLocal: () => { localWrites += 1; },
    fetchImpl,
    debounceMs: 5,
  });
  await coordinator.hydrate();
  document = makeDocument({ serverRevisionId: "rev-a", items: [{ x: 1 } as never] });
  coordinator.markDocumentChanged();
  await coordinator.flushNow();
  assert.equal(coordinator.getState().status, "error");
  assert.ok(localWrites > 0, "server failure must not discard local recovery");
  shouldFail = false;
  coordinator.retry();
  await wait(20);
  assert.equal(coordinator.getState().status, "clean", "retry must recover without losing latest local snapshot");
  assert.equal(patches, 2);
  coordinator.dispose();
}

async function revisionConflictGate() {
  let document = makeDocument({ serverRevisionId: "old-rev", items: [{ old: true } as never] });
  let patches = 0;
  const coordinator = new CadReviewPersistenceCoordinator({
    fileId: document.fileId,
    getDocument: () => document,
    applyServerDocument: (next) => { document = next; },
    acknowledgeServerSave: (next) => { document = acknowledgeMetadata(document, next); },
    saveLocal: () => {},
    fetchImpl: async (_input, init) => {
      if (!init || init.method === "GET") {
        return response(200, {
          serverRevisionId: "new-rev",
          revision: 0,
          document: makeDocument({ sourceVersionKey: "new-rev", serverRevisionId: "new-rev" }),
        });
      }
      patches += 1;
      return response(409, { error: "revision mismatch" });
    },
    debounceMs: 5,
  });
  await coordinator.hydrate();
  assert.equal(coordinator.getState().status, "error");
  document = makeDocument({ serverRevisionId: "old-rev", items: [{ old: true } as never, { edit: true } as never] });
  coordinator.markDocumentChanged();
  coordinator.retry();
  await wait(15);
  assert.equal(patches, 0, "mismatched local recovery must never auto-overwrite a new source revision");
  assert.equal(isCadReviewServerRevisionCompatible("old-rev", "new-rev"), false);
  assert.equal(isCadReviewServerRevisionCompatible("new-rev", "new-rev"), true);
  coordinator.dispose();
}

function preferencesGate() {
  const data = new Map<string, string>();
  const storage = {
    getItem(key: string) { return data.get(key) ?? null; },
    setItem(key: string, value: string) { data.set(key, value); },
    removeItem(key: string) { data.delete(key); },
    clear() { data.clear(); },
    key(index: number) { return [...data.keys()][index] ?? null; },
    get length() { return data.size; },
  } as Storage;

  saveCadStudioUiPreferences({
    displayMode: "monochrome",
    backgroundColor: "black",
    lineWeightVisible: true,
    sidePanel: "measurements",
    recentColors: ["#112233"],
  }, storage);
  const loaded = loadCadStudioUiPreferences(storage);
  assert.equal(loaded.displayMode, "monochrome");
  assert.equal(loaded.backgroundColor, "black");
  assert.equal(loaded.lineWeightVisible, true);
  assert.equal(loaded.sidePanel, "measurements");
  assert.deepEqual(loaded.recentColors, ["#112233"]);
  assert.ok(data.has(CAD_STUDIO_UI_PREFERENCES_KEY));
  const serialized = data.get(CAD_STUDIO_UI_PREFERENCES_KEY)!;
  assert.ok(!serialized.includes("activeTool"));
  assert.ok(!serialized.includes("hover"));
  assert.ok(!serialized.includes("draft"));
  assert.ok(!serialized.includes("popover"));
}

function sourceContractGate() {
  const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
  const route = source("src/app/api/dokumantasyon/files/[id]/review/route.ts");
  const persistence = source("src/lib/dokumantasyon/cad-review/persistence.ts");
  const activeStore = source("src/lib/dokumantasyon/cad-review/active-store.ts");
  const saveUi = source("src/lib/dokumantasyon/cad-review/save-state-ui.ts");
  const preferences = source("src/lib/dokumantasyon/cad-review/ui-preferences.ts");
  assert.ok(route.includes("export async function PATCH"));
  assert.ok(route.includes("status: 409"));
  assert.ok(route.includes("serverRevisionId"));
  assert.ok(persistence.includes("debounceMs ?? 600"));
  assert.ok(persistence.includes("private inFlight = false"));
  assert.ok(persistence.includes("private revisionBlocked = false"));
  assert.ok(persistence.includes("saveStartVersion"));
  assert.ok(activeStore.includes("markDocumentMutation"));
  assert.ok(saveUi.includes("Sunucuya kaydedildi"));
  assert.ok(saveUi.includes("Yerelde kaydedildi · Sunucu hatası"));
  assert.ok(preferences.includes("CAD_STUDIO_UI_PREFERENCES_KEY"));
  assert.ok(!preferences.includes("activeTool:"));
  assert.ok(!preferences.includes("hoveredItem"));
  assert.ok(!preferences.includes("draftItem"));
}

await queueGate();
await errorAndRetryGate();
await revisionConflictGate();
preferencesGate();
sourceContractGate();

console.log("GATE: PASS — Stage 5 persistence: debounce/latest queue, one in-flight PATCH, retry/local recovery, 409 revision lock, UI preference whitelist and truthful save-state contract.");

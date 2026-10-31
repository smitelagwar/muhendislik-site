import test from "node:test";
import assert from "node:assert/strict";

const store = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
  },
});
Object.defineProperty(globalThis, "window", {
  configurable: true, value: {
    dispatchEvent: () => true,
  },
});
Object.defineProperty(globalThis, "document", {
  configurable: true, value: {
    querySelectorAll: () => [{ src: "https://example.test/_next/static/chunks/main-app-abc.js" }],
  },
});

const {
  cancelBelgelerOfflinePreparation,
  isUserCancelled,
  readPreparationJournal,
  pausePreparationJournal,
} = await import("../../src/lib/belgeler-offline-client");

test("user cancellation stays durable and is not converted into a background pause", () => {
  store.clear();
  cancelBelgelerOfflinePreparation();
  const cancelled = readPreparationJournal();
  assert.equal(cancelled?.version, 4);
  assert.equal(cancelled?.status, "cancelled_by_user");
  assert.equal(isUserCancelled(), true);
  pausePreparationJournal("background");
  assert.equal(readPreparationJournal()?.status, "cancelled_by_user");
  pausePreparationJournal("network");
  assert.equal(readPreparationJournal()?.status, "cancelled_by_user");
});

test("interrupted v3 journal migrates safely to resumable v4 state", () => {
  store.clear();
  store.set("belgeler:pwa:preparation:v3", JSON.stringify({
    version: 3, status: "loading", completed: 13, total: 25,
    updatedAt: Date.now(),
    scripts: "/_next/static/chunks/main-app-abc.js",
  }));
  const value = readPreparationJournal();
  assert.equal(value?.version, 4);
  assert.equal(value?.completed, 13);
  assert.equal(value?.status, "paused");
  assert.equal(store.has("belgeler:pwa:preparation:v3"), false);
  assert.equal(store.has("belgeler:pwa:preparation:v4"), true);
  pausePreparationJournal("network");
  // A migrated paused journal does not fabricate a new in-flight task.
  assert.equal(readPreparationJournal()?.completed, 13);
});

test("corrupt journal cannot claim ready or start a phantom download", () => {
  store.clear();
  store.set("belgeler:pwa:preparation:v4", "{broken");
  assert.equal(readPreparationJournal(), null);
  assert.equal(isUserCancelled(), false);
});

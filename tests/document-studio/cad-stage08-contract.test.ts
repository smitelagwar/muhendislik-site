
import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { resolveReviewDxfInsunits, exportReviewToDxf } from "../../src/lib/dokumantasyon/cad-review/export-dxf";
import { pngToPdfBlob } from "../../src/lib/dokumantasyon/cad-review/export-image";
import { exportReviewToJson, importReviewFromJson } from "../../src/lib/dokumantasyon/cad-review/export-json";
import { loadLocalCadReview, localCadReviewStorageKey, saveLocalCadReview, type CadReviewDocument } from "../../src/lib/dokumantasyon/cad-review/schema";
import { sourceContextFromInsunits } from "../../src/lib/dokumantasyon/cad-review/units";
import { CadReviewStore } from "../../src/lib/dokumantasyon/cad-review/store";

const now = "2026-11-02T00:00:00.000Z";
const fileId = "11111111-1111-4111-8111-111111111111";
const makeDoc = (sourceVersionKey = "revision-1"): CadReviewDocument => ({
  schemaVersion: 1,
  fileId,
  sourceVersionKey,
  sourceSha256: "0".repeat(64),
  revision: 0,
  items: [],
  createdAt: now,
  updatedAt: now,
});
const marker = (id: string) => ({
  id,
  type: "comment_pin" as const,
  position: { x: 123, y: 456 },
  pinIndex: 1,
  title: "Kolon inceleme",
  author: "Mühendis",
  status: "open" as const,
  comment: "Şöför, Çiçek, Ağaç",
  style: { color: "#ef4444", strokeWidth: 2, opacity: 1 },
  createdAt: now,
  updatedAt: now,
});

test("DXF INSUNITS reflects real source world units; unknown/calibrated does not claim metre", () => {
  const doc = makeDoc();
  assert.equal(resolveReviewDxfInsunits(doc), 0);
  for (const [sourceCode, expected] of [[4,4],[5,5],[6,6],[1,1],[2,2],[0,0]] as const) {
    const dxf = exportReviewToDxf(doc, undefined, sourceContextFromInsunits(sourceCode));
    assert.equal(resolveReviewDxfInsunits(doc, sourceContextFromInsunits(sourceCode)), expected);
    assert.ok(dxf.includes("$INSUNITS\n 70\n" + expected + "\n"));
    assert.ok(!dxf.includes("DWG"));
  }
});

test("JSON round-trips Turkish Unicode and never mutates source or review item", () => {
  const doc = makeDoc();
  doc.items.push(marker("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"));
  const original = structuredClone(doc);
  const revived = importReviewFromJson(exportReviewToJson(doc));
  assert.deepEqual(revived, original);
  assert.deepEqual(doc, original);
});

test("server hydration never attaches a different revision to the local store", () => {
  const store = new CadReviewStore(makeDoc("revision-1"));
  assert.equal(store.hydrateFromServerIfPristine(makeDoc("revision-2")), false);
  assert.equal(store.getDocument().sourceVersionKey, "revision-1");
});

test("remote revision metadata never erases new in-flight edits", () => {
  const store = new CadReviewStore(makeDoc());
  assert.equal(store.bindRemoteSource("a".repeat(64), 4), true);
  store.addItem(marker("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"));
  const sent = JSON.stringify(store.getItems());
  store.addItem(marker("cccccccc-cccc-4ccc-8ccc-cccccccccccc"));
  assert.equal(store.acknowledgeRemoteSave(5, sent), false);
  assert.equal(store.getDocument().revision, 5);
  assert.equal(store.getItems().length, 2);
  assert.equal(store.getDirty(), true);
  assert.equal(store.acknowledgeRemoteSave(6, JSON.stringify(store.getItems())), true);
  assert.equal(store.getDirty(), false);
});

test("browser cache is revision-scoped; legacy items from another source are not silently reused", () => {
  const storage = new Map<string, string>();
  const existingWindow = (globalThis as { window?: unknown }).window;
  (globalThis as { window?: unknown }).window = { localStorage: {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => { storage.set(k, v); },
    removeItem: (k: string) => { storage.delete(k); },
  }};
  try {
    const doc = makeDoc("revision-1");
    doc.items.push(marker("dddddddd-dddd-4ddd-8ddd-dddddddddddd"));
    assert.equal(saveLocalCadReview(fileId, doc), true);
    assert.equal(loadLocalCadReview(fileId, "revision-1")?.items.length, 1);
    assert.equal(loadLocalCadReview(fileId, "revision-2"), null);
    assert.ok(storage.has(localCadReviewStorageKey(fileId, "revision-1")));
    assert.equal(storage.has(localCadReviewStorageKey(fileId, "revision-2")), false);
    storage.set("dok_cad_review_v1_" + fileId, JSON.stringify(doc));
    assert.equal(loadLocalCadReview(fileId, "revision-2"), null);
    storage.set(localCadReviewStorageKey(fileId,"revision-1"), "{invalid JSON");
    assert.equal(loadLocalCadReview(fileId, "revision-1"), null);
    assert.equal(storage.get(localCadReviewStorageKey(fileId,"revision-1")), "{invalid JSON");
  } finally {
    (globalThis as { window?: unknown }).window = existingWindow;
  }
});

test("PDF export is a valid PDF binary (not renamed PNG)", async () => {
  // Known 1x1 RGBA PNG; test runs without browser canvas.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL6dgAAAABJRU5ErkJggg==",
    "base64"
  );
  const pdfBlob = await pngToPdfBlob(new Blob([png], { type: "image/png" }));
  assert.equal(pdfBlob.type, "application/pdf");
  const bytes = Buffer.from(await pdfBlob.arrayBuffer());
  assert.equal(bytes.subarray(0, 5).toString("ascii"), "%PDF-");
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 1);
  assert.equal(pdf.getPage(0).getWidth(), pdf.getPage(0).getHeight());
});

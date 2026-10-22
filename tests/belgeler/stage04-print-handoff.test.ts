import test from "node:test";
import assert from "node:assert/strict";
import { printPdfFromBlobUrl } from "../../src/lib/belge-studio-pdf-actions";

test("D04 print handoff passes exact PDF blob to a new window and prints once", () => {
  const events = new Map<string, () => void>();
  let openCount = 0, focusCount = 0, printCount = 0, alertCount = 0;
  const pdfUrl = "blob:http://localhost:3005/known-pdf-blob-id";
  const popup = {
    closed: false, location: { href: "about:blank" },
    addEventListener(type: string, fn: () => void) { events.set(type, fn); },
    removeEventListener(type: string) { events.delete(type); },
    focus() { focusCount++; },
    print() { printCount++; }
  };
  const windowFake = {
    open(url:string, target:string) {
      assert.equal(url, ""); assert.equal(target, "_blank"); openCount++;
      return popup;
    },
    alert(_message:string) { alertCount++; },
    setTimeout(_fn:()=>void,_delay:number) { return 17; },
    clearTimeout(_id:number) {},
  };
  const g = globalThis as typeof globalThis & { window?: unknown };
  const prior = g.window;
  g.window = windowFake;
  try {
    printPdfFromBlobUrl({ blobUrl: pdfUrl, isReady: true });
    assert.equal(openCount, 1);
    assert.equal(popup.location.href, pdfUrl, "Print popup should navigate to exactly the READY PDF blob");
    assert.ok(events.has("load"), "Load listener must be attached before printing");
    events.get("load")?.();
    events.get("load")?.();
    assert.equal(focusCount, 1);
    assert.equal(printCount, 1, "Should not print twice on duplicate load events");
    assert.equal(alertCount, 0);
  } finally { g.window = prior; }
});
test("D04 print blocks not-ready and closed-popups safely", () => {
  let opens=0, alerts=0, prints=0;
  const g = globalThis as typeof globalThis & { window?: unknown };
  const prior = g.window;
  g.window = {
    open(){opens++;return null;},
    alert(){alerts++;},
    setTimeout(){return 1;},
    clearTimeout(){}
  };
  try {
    printPdfFromBlobUrl({ blobUrl: null, isReady: false });
    assert.equal(opens,0);
    assert.equal(alerts,1);
    printPdfFromBlobUrl({ blobUrl: "blob:http://localhost/a", isReady: true });
    assert.equal(opens,1);
    assert.equal(alerts,2);
    assert.equal(prints,0);
  } finally { g.window = prior; }
});

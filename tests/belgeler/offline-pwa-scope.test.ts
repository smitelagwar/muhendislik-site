import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");
test("PWA is scoped to Belgeler and never captures share/API/private routes", () => {
  const sw = read("public/belgeler-sw.js");
  const client = read("src/lib/belgeler-offline-client.ts");
  assert.match(client, /scope: "\/belgeler"/);
  assert.match(sw, /req\.method !== "GET"/);
  assert.match(sw, /\/api\//);
  assert.match(sw, /\/b\//);
  assert.match(sw, /req\.headers\.has\("range"\)/);
  assert.match(sw, /req\.headers\.has\("rsc"\)/);
  assert.match(sw, /(?:private\|no-store)/);
  assert.doesNotMatch(sw, /cache\.addAll\(/);
  assert.doesNotMatch(sw, /localStorage|indexedDB/);
  assert.match(sw, /skipWaiting/);
  assert.match(sw, /allowedPage/);
});
test("PWA manifest contains scoped start URL and installation icons", () => {
  const m = JSON.parse(read("public/belgeler-pwa.webmanifest"));
  assert.equal(m.scope, "/belgeler");
  assert.equal(m.start_url, "/belgeler");
  assert.equal(m.display, "standalone");
  assert.ok(m.icons.some((item: { sizes: string }) => item.sizes === "192x192"));
  assert.ok(m.icons.some((item: { sizes: string }) => item.sizes === "512x512"));
});
test("existing validated draft persistence remains unchanged", () => {
  const src = read("src/lib/belge-ux-config.ts");
  assert.match(src, /AUTOSAVE_DEBOUNCE_MS: 2000/);
  const hook = read("src/hooks/use-belge-auto-draft.ts");
  assert.match(hook, /pagehide/);
  assert.match(hook, /visibilitychange/);
  assert.match(hook, /persistSnapshotSync/);
});

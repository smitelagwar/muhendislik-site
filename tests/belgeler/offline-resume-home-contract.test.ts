import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=p=>readFileSync(p,"utf8");
test("root worker exclusively intercepts homepage navigation",()=>{
  const sw=src("public/belgeler-home-sw.js");
  assert.match(sw,/url\.pathname!=="\/"/);
  assert.match(sw,/req\.mode!=="navigate"/);
  assert.match(sw,/req\.method!=="GET"/);
  assert.doesNotMatch(sw,/cache\.addAll/);
  assert.ok(!sw.includes("skipWaiting()"));
});
test("Belgeler worker scope and data privacy remain unchanged",()=>{
  const sw=src("public/belgeler-sw.js");
  assert.match(sw,/belgeler-offline-v4/);
  assert.match(sw,/belgeler-offline-v3-pages/);
  assert.match(sw,/url\.pathname\.startsWith\("\/api\/"\)/);
  assert.match(sw,/url\.pathname\.startsWith\("\/b\/"\)/);
  const client=src("src/lib/belgeler-offline-client.ts");
  assert.match(client,/scope: "\/belgeler"/);
  assert.match(client,/cachedResource\(url,kind\)/);
  assert.match(client,/readPreparationJournal/);
  assert.match(client,/navigator\.onLine/);
  assert.match(client,/locks\.request/);
  assert.match(client,/openAndInspect\(path,true\)/);
});
test("PDF export and autosave mechanics stay untouched",()=>{
  const srcPdf=src("src/lib/pdf-engine.ts");
  assert.match(srcPdf,/downloadFilledBetonDokumPdf/);
  assert.match(src("src/lib/belge-ux-config.ts"),/AUTOSAVE_DEBOUNCE_MS: 2000/);
});

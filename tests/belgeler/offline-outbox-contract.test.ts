import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
test("outbox does not store personal draft values or bypass server replay-proof",()=>{
 const outbox=read("src/lib/belgeler-offline/outbox.ts");
 const hook=read("src/hooks/use-belge-share.ts");
 assert.ok(outbox.includes("snapshotFingerprint"));
 assert.ok(outbox.includes("schemaFingerprint"));
 assert.ok(outbox.includes("clientRequestId"));
 assert.ok(outbox.includes("replayProof"));
 assert.ok(!outbox.includes("values: Record<string, string>"));
 assert.ok(hook.includes("await getShareIntent(documentId).catch(() => null)"));
 assert.ok(hook.includes("await probeConnectivity()"));
 assert.ok(hook.includes('schemaFingerprint!==computeSchemaFingerprint'));
 assert.ok(hook.includes("claimShareIntent(documentId,token)"));
 assert.ok(hook.includes('"x-belge-share-replay-proof"'));
 assert.ok(hook.includes("pollOperationStatus"));
});
test("existing PDF engine and draft debounce were preserved",()=>{
 const c=read("src/lib/belge-ux-config.ts");
 assert.match(c,/AUTOSAVE_DEBOUNCE_MS: 2000/);
 assert.match(read("src/hooks/use-belge-auto-draft.ts"),/persistSnapshotSync/);
});

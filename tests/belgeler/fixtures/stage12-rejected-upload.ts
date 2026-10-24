import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { POST } from "../../../src/app/api/belgeler/paylasim/route";
import { POST as bootstrap } from "../../../src/app/api/belgeler/paylasim/kota/route";
import { MemoryBelgePaylasimRepository, setBelgePaylasimRepositoryForTest } from "../../../src/lib/belge-paylasim/repository";
import { MemoryBelgeBlobStore, setBelgeBlobStoreForTest } from "../../../src/lib/belge-paylasim/blob-store";

async function main() {
  try {
    const repo=new MemoryBelgePaylasimRepository(),store=new MemoryBelgeBlobStore();let puts=0;
    store.put=async()=>{puts++;throw new Error("Blob must not be opened for an invalid PDF");};
    setBelgePaylasimRepositoryForTest(repo);setBelgeBlobStoreForTest(store);
    const headers={host:"localhost:3000",origin:"http://localhost:3000"};
    const identity=await bootstrap(new Request("http://localhost:3000/api/belgeler/paylasim/kota",{method:"POST",headers}));
    const cookie=identity.headers.get("set-cookie")?.split(";")[0];assert.ok(cookie);
    const result=await POST(new Request("http://localhost:3000/api/belgeler/paylasim",{method:"POST",headers:{...headers,cookie,"content-type":"application/json","x-belge-share-replay-proof":Buffer.alloc(32,5).toString("base64url")},body:JSON.stringify({documentId:"beton-dokum-tutanagi",clientRequestId:createHash("sha256").update("isolated-rejected-template").digest("base64url"),values:{}})}));
    assert.equal(result.status,500);assert.equal(puts,0);assert.equal((await result.json()).code,"PDF_RENDER_FAILED");
    console.log("PASS: actual POST rejects malformed template before any Blob PUT");
  } finally {setBelgePaylasimRepositoryForTest(null);setBelgeBlobStoreForTest(null);}
}
void main().then(()=>process.exit(0)).catch(()=>{console.error("FAIL: isolated malformed-template POST");process.exit(1);});

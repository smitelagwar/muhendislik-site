// Yalnız bellek adaptörlerinde çalışır. Üretim DB/Blob erişimi yoktur.
import { writeFileSync } from 'node:fs';
import { MemoryBelgePaylasimRepository, setBelgePaylasimRepositoryForTest } from '../../src/lib/belge-paylasim/repository';
import { MemoryBelgeBlobStore, setBelgeBlobStoreForTest } from '../../src/lib/belge-paylasim/blob-store';
import { createShareReservation, finalizeShareReservation, failShareReservation, revokeShareByManageToken, getShareByViewToken } from '../../src/lib/belge-paylasim/service-core';
import { executeBelgePaylasimCleanup } from '../../src/lib/belge-paylasim/cleanup';
import { validateShareCreateRequest } from '../../src/lib/belge-paylasim/request-validation';
import { getStoredShareLinks } from '../../src/lib/belge-paylasim/local-link-registry';
import { GET as cronGet } from '../../src/app/api/cron/belge-paylasim-temizlik/route';
import { HEAD as pdfHead } from '../../src/app/api/belgeler/paylasim/[token]/pdf/route';

const results: Array<{id:string; observation: unknown}> = [];
function setup() {
  const repo = new MemoryBelgePaylasimRepository();
  const blob = new MemoryBelgeBlobStore();
  setBelgePaylasimRepositoryForTest(repo); setBelgeBlobStoreForTest(blob);
  return {repo, blob};
}
const params = (id:string, ip='192.0.2.1', values: Record<string,string>={}) => ({clientRequestId:id, creatorIp:ip, documentId:'beton-dokum-tutanagi' as const, values});
async function capture(id:string, f:()=>Promise<unknown>) { results.push({id, observation:await f()}); }
async function main() {
  await capture('N01-distinct-concurrency', async()=>{
    const {repo}=setup();
    const settled = await Promise.allSettled(Array.from({length:20},(_,i)=>createShareReservation(params(`parallel-${i}`))));
    return {configured15minLimit:3, accepted:settled.filter(x=>x.status==='fulfilled').length, rows:repo.getAllRecordsForTest().length};
  });
  await capture('N02-failed-retry',async()=>{
    setup(); const p=params('failed-retry'); const r=await createShareReservation(p);
    await failShareReservation(r.record!.id,'SYNTHETIC_FAIL');
    try { await createShareReservation(p); return {unexpectedSuccess:true}; }
    catch(e) { return {error:e instanceof Error?e.message:'unknown'}; }
  });
  await capture('N03-cross-client-replay',async()=>{
    setup(); const a=await createShareReservation(params('known-request-id','192.0.2.1'));
    await finalizeShareReservation(a.record!.id,100,'synthetic');
    const b=await createShareReservation(params('known-request-id','192.0.2.2'));
    return {sameManageToken:a.manageToken===b.manageToken, status:b.status};
  });
  await capture('REV2-F32-revoked-reason',async()=>{
    setup(); const r=await createShareReservation(params('revoke-reason'));
    await finalizeShareReservation(r.record!.id,100,'synthetic');
    await revokeShareByManageToken(r.manageToken!);
    const read=await getShareByViewToken(r.tokens!.viewToken);
    return {status:read.status, rowStatus:'record' in read?read.record.status:null};
  });
  await capture('N04-tombstone-token-reuse',async()=>{
    const {repo}=setup(); const r=await createShareReservation(params('old-request-reuse'));
    await finalizeShareReservation(r.record!.id,100,'synthetic'); await revokeShareByManageToken(r.manageToken!);
    // Test saati ilerletilerek 30 günlük mezar taşı saklama süresi aşılır.
    await repo.purgeOldTombstones(new Date(Date.now()+31*86400000),100);
    const next=await createShareReservation(params('old-request-reuse','192.0.2.1',{yer:'SENTETIK-YENI-ICERIK'}));
    await finalizeShareReservation(next.record!.id,100,'synthetic-different');
    return {sameViewToken:r.tokens!.viewToken===next.tokens!.viewToken, oldUrlStatus:(await getShareByViewToken(r.tokens!.viewToken)).status};
  });
  await capture('N05-failed-blob-retention',async()=>{
    const {repo,blob}=setup(); const r=await createShareReservation(params('failed-blob'));
    await blob.put(r.record!.blobPathname,new Uint8Array([1,2,3]));
    await failShareReservation(r.record!.id,'FINALIZE_FAILED');
    const stats=await executeBelgePaylasimCleanup({repository:repo,blobStore:blob,orphanGraceHours:0});
    return {blobRemains:blob.has(r.record!.blobPathname), cleanupErrors:stats.errorCount, countedBytes:(await repo.getActiveStats()).totalActiveBytes};
  });
  await capture('N06-storage-getter-throws',async()=>{
    const fakeWindow={}; Object.defineProperty(fakeWindow,'localStorage',{get(){throw new Error('SYNTHETIC_SECURITY_ERROR');}});
    Object.defineProperty(globalThis,'window',{value:fakeWindow,configurable:true});
    try {getStoredShareLinks();return {threw:false};} catch {return {threw:true};}
    finally {Reflect.deleteProperty(globalThis,'window');}
  });
  await capture('N07-cron-partial-success',async()=>{
    const {repo,blob}=setup(); const r=await createShareReservation(params('cron-error'));
    repo.updateExpiresAtForTest(r.record!.id,new Date(0));
    blob.del=async()=>{throw new Error('SYNTHETIC_DELETE_ERROR');};
    process.env.CRON_SECRET='synthetic-local-only-cron-secret';
    const response=await cronGet(new Request('http://localhost/api/cron/belge-paylasim-temizlik',{headers:{authorization:`Bearer ${process.env.CRON_SECRET}`}}));
    const data=await response.json();
    return {http:response.status, success:data.success, errorCount:data.stats.errorCount};
  });
  await capture('N08-head-fetches-blob',async()=>{
    const {blob}=setup(); const r=await createShareReservation(params('head-fetch'));
    await finalizeShareReservation(r.record!.id,3,'synthetic'); await blob.put(r.record!.blobPathname,new Uint8Array([1,2,3]));
    let getCalls=0; const original=blob.get.bind(blob); blob.get=async p=>{getCalls++;return original(p);};
    const response=await pdfHead(new Request('http://localhost/api/test',{method:'HEAD'}),{params:Promise.resolve({token:r.tokens!.viewToken})});
    return {http:response.status, getCalls};
  });
  await capture('N09-missing-origin-extra-root-fields',async()=>{
    const input=await validateShareCreateRequest(new Request('http://localhost/api/belgeler/paylasim',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({clientRequestId:'abcdefgh',documentId:'beton-dokum-tutanagi',values:{},untrustedExtra:true})}));
    return {accepted:true, requestIdLength:input.clientRequestId.length, injectedLabelKeys:Object.keys(input.values).filter(k=>k.endsWith('_etiket')).length};
  });
  await capture('N10-cron-backlog',async()=>{
    const {repo,blob}=setup();
    // Farklı IP ile kota denetimine bağlı olmadan depo seviyesinde fixture oluştur.
    for(let i=0;i<120;i++) {const r=await createShareReservation(params(`backlog-${i}`,`192.0.2.${i}`));repo.updateExpiresAtForTest(r.record!.id,new Date(0));}
    const stats=await executeBelgePaylasimCleanup({repository:repo,blobStore:blob});
    return {expiredBefore:120, purged:stats.purgedCount, expiredLeft:repo.getAllRecordsForTest().filter(r=>r.status!=='purged').length};
  });
  await capture('N11-late-finalize-after-purge',async()=>{
    const {repo}=setup();const r=await createShareReservation(params('late-finalize'));
    await repo.markPurged(r.record!.id);
    await finalizeShareReservation(r.record!.id,100,'late-writer');
    return {statusAfterLateFinalize:(await getShareByViewToken(r.tokens!.viewToken)).status};
  });
  await capture('N12-stream-limit-after-read',async()=>{
    let chunksRead=0;
    const body=new ReadableStream<Uint8Array>({pull(c){if(chunksRead===20){c.close();return;}chunksRead++;c.enqueue(new Uint8Array(16384).fill(32));}});
    const request=new Request('http://localhost/api/belgeler/paylasim',{method:'POST',headers:{'content-type':'application/json'},body,duplex:'half'} as RequestInit);
    try{await validateShareCreateRequest(request);return {unexpectedSuccess:true};}catch(e){return {chunksRead,totalAvailable:20,error:e instanceof Error?e.name:'unknown'};}
  });
  writeFileSync(new URL('./probe-results.json',import.meta.url),JSON.stringify({scope:'memory-only, no production access',results},null,2));
  console.log(JSON.stringify(results,null,2));
}
const timeout=setTimeout(()=>{console.error('AUDIT_TIMEOUT');process.exit(124);},30000);
main().then(()=>{clearTimeout(timeout);process.exit(0);}).catch(e=>{clearTimeout(timeout);console.error(e instanceof Error?e.message:'AUDIT_ERROR');process.exit(1);});

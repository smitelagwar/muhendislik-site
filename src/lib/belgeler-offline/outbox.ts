/** A durable, PII-free share *intent*. The user's validated draft remains in the existing draft engine.
 *  IndexedDB transactions, not BroadcastChannel, serialize competing tabs.
 */
export interface OfflineShareIntent {
  documentId: string;
  snapshotFingerprint: string;
  schemaFingerprint: string;
  clientRequestId: string;
  replayProof: string;
  createdAt: string;
  status: "queued" | "sending" | "retryable" | "blocked";
  attempts: number;
  nextRetryAt: number;
  leaseToken?: string;
  leaseUntil?: number;
  lastError?: "network" | "server" | "identity" | "mismatch" | "limit" | "unknown";
}
const DB_NAME = "belgeler-offline-share-v1";
const STORE = "intents";
const SECRET = /^[A-Za-z0-9_-]{43}$/;
const VALID_DOCS = new Set(["beton-dokum-tutanagi","santiye-sefi-taahhutnamesi","santiye-sefi-istifa-dilekcesi","insaat-ruhsati-dilekcesi","santiye-sefi-sozlesmesi"]);
function valid(v: unknown): v is OfflineShareIntent {
  if (!v || typeof v !== "object") return false;
  const x = v as OfflineShareIntent;
  return VALID_DOCS.has(x.documentId) && SECRET.test(x.clientRequestId) &&
    SECRET.test(x.replayProof) && SECRET.test(x.snapshotFingerprint) &&
    typeof x.schemaFingerprint === "string" && x.schemaFingerprint.startsWith("v1:") &&
    !isNaN(Date.parse(x.createdAt)) && Number.isSafeInteger(x.attempts) &&
    x.attempts >= 0 && Number.isFinite(x.nextRetryAt) &&
    ["queued","sending","retryable","blocked"].includes(x.status);
}
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve,reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("Kalıcı paylaşım kuyruğu desteklenmiyor. PDF'yi indirin."));
    let request: IDBOpenDBRequest;
    try { request = indexedDB.open(DB_NAME,1); }
    catch { return reject(new Error("Tarayıcı depolamasına erişilemiyor. PDF'yi indirin.")); }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, {keyPath:"documentId"});
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Kalıcı paylaşım kuyruğu açılamadı. PDF'yi indirin."));
    request.onblocked = () => reject(new Error("Başka sekme depolama yükseltmesini engelledi."));
  });
}
async function transaction<T>(mode: IDBTransactionMode,
  perform: (store: IDBObjectStore,finish:(value:T)=>void,abort:(error:Error)=>void)=>void): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve,reject) => {
    let settled = false;
    let answer:T | undefined;
    let problem:Error | null = null;
    let tx:IDBTransaction;
    try { tx = db.transaction(STORE,mode); } catch { db.close(); reject(new Error("Paylaşım veritabanı kullanılamıyor.")); return; }
    const abort=(e:Error)=>{problem=e;try{tx.abort()}catch{/* closed */}};
    const finish=(value:T)=>{answer=value};
    tx.oncomplete=()=>{settled=true; db.close();resolve(answer as T)};
    tx.onabort=tx.onerror=()=>{if(settled)return;settled=true;db.close();reject(problem??new Error("Paylaşım kuyruğu kaydedilemedi; bağlantı gönderilmedi."))};
    try{perform(tx.objectStore(STORE),finish,abort)}catch(e){abort(e instanceof Error?e:new Error("Kuyruk işlem hatası"))}
  });
}
function typedGet(store: IDBObjectStore, doc:string, done:(value:OfflineShareIntent|null)=>void,fail:(error:Error)=>void) {
  const req=store.get(doc);
  req.onsuccess=()=>{const raw:unknown=req.result;done(valid(raw)?raw:null)};
  req.onerror=()=>fail(new Error("Bekleyen paylaşım kaydı okunamadı."));
}
export async function getShareIntent(documentId:string):Promise<OfflineShareIntent|null> {
  return transaction("readonly",(store,finish,abort)=>typedGet(store,documentId,finish,abort));
}
export async function enqueueShareIntent(input:OfflineShareIntent):Promise<OfflineShareIntent> {
  if(!valid(input)) throw new Error("Geçersiz paylaşım niyeti.");
  return transaction("readwrite",(store,finish,abort)=>{
    typedGet(store,input.documentId,(old)=>{
      if(old){
        if(old.snapshotFingerprint!==input.snapshotFingerprint || old.schemaFingerprint!==input.schemaFingerprint)
          return abort(new Error("Bu belge için başka bir paylaşım bekliyor. Önce onu iptal edin."));
        finish(old); return; // idempotent double tap, same ID/proof
      }
      const request=store.add(input);
      request.onsuccess=()=>finish(input);
      request.onerror=()=>abort(new Error("Paylaşım kuyruğa kaydedilemedi. PDF'yi indirin."));
    },abort);
  });
}
export async function cancelShareIntent(documentId:string, clientRequestId?:string):Promise<void> {
  return transaction("readwrite",(store,finish,abort)=>{
    typedGet(store,documentId,(item)=>{
      if(item && (!clientRequestId || item.clientRequestId===clientRequestId)){
        const req=store.delete(documentId);
        req.onsuccess=()=>finish(undefined);
        req.onerror=()=>abort(new Error("Bekleyen paylaşım silinemedi."));
      } else finish(undefined);
    },abort);
  });
}
export async function claimShareIntent(documentId:string,token:string,now=Date.now()):Promise<OfflineShareIntent|null>{
  return transaction("readwrite",(store,finish,abort)=>{
    typedGet(store,documentId,(item)=>{
      if(!item || item.status==="blocked" || item.nextRetryAt>now ||
        (item.leaseUntil && item.leaseUntil>now && item.leaseToken!==token)){
        finish(null);return;
      }
      const updated:OfflineShareIntent={...item,status:"sending",leaseToken:token,leaseUntil:now+90_000};
      const req=store.put(updated);
      req.onsuccess=()=>finish(updated);
      req.onerror=()=>abort(new Error("Paylaşım işlemi kilitlenemedi."));
    },abort);
  });
}
export async function releaseShareIntent(documentId:string,token:string,
  status:"retryable"|"blocked",error:OfflineShareIntent["lastError"]="network",
  immediate=false):Promise<void>{
  return transaction("readwrite",(store,finish,abort)=>{
    typedGet(store,documentId,(item)=>{
      if(!item || item.leaseToken!==token){finish(undefined);return}
      const attempts=item.attempts+1;
      const backoff=Math.min(3600000,30000*Math.pow(2,Math.min(6,attempts-1)))+Math.floor(Math.random()*2500);
      const terminal=status==="blocked" || attempts>=6;
      const next:OfflineShareIntent={...item,status:terminal?"blocked":"retryable",attempts,
        nextRetryAt:terminal?0:immediate?Date.now():Date.now()+backoff,lastError:error,
        leaseToken:undefined,leaseUntil:undefined};
      const req=store.put(next);
      req.onsuccess=()=>finish(undefined);
      req.onerror=()=>abort(new Error("Paylaşım işlemi durumu kaydedilemedi."));
    },abort);
  });
}
export async function markShareIntentBlocked(documentId:string,error:OfflineShareIntent["lastError"]="mismatch"):Promise<void>{
  return transaction("readwrite",(store,finish,abort)=>{
    typedGet(store,documentId,(item)=>{
      if(!item){finish(undefined);return}
      const req=store.put({...item,status:"blocked",nextRetryAt:0,lastError:error,leaseToken:undefined,leaseUntil:undefined});
      req.onsuccess=()=>finish(undefined);
      req.onerror=()=>abort(new Error("Paylaşım güvenlik durumu kaydedilemedi."));
    },abort);
  });
}
export async function resetShareIntentRetry(documentId:string):Promise<void>{
  return transaction("readwrite",(store,finish,abort)=>{
    typedGet(store,documentId,(item)=>{
      if(!item){finish(undefined);return}
      if(item.status==="blocked" || (item.leaseUntil && item.leaseUntil>Date.now())){finish(undefined);return}
      const req=store.put({...item,status:"retryable",nextRetryAt:0,leaseToken:undefined,leaseUntil:undefined});
      req.onsuccess=()=>finish(undefined);
      req.onerror=()=>abort(new Error("Yeniden deneme kaydedilemedi."));
    },abort);
  });
}
export function shareQueueStorageName(): string {return DB_NAME}

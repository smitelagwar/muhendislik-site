/** Lightweight, cache-bypassing connectivity probe. SW does not intercept /belgeler-connectivity.txt */
export type Connectivity = "checking"|"online"|"weak"|"offline";
const URL_PATH="/belgeler-connectivity.txt";
const EXPECTED="belgeler-online-v1";
export async function probeConnectivity():Promise<Connectivity>{
  if(typeof navigator!=="undefined" && navigator.onLine===false) return "offline";
  let worst=0;
  for(let i=0;i<2;i++){
    const abort=new AbortController();
    const timer=setTimeout(()=>abort.abort(),4000);
    const started=performance.now();
    try{
      const res=await fetch(URL_PATH+"?v="+Date.now()+"-"+i,{cache:"no-store",signal:abort.signal,redirect:"manual",credentials:"same-origin"});
      if(!res.ok || res.redirected || (await res.text()).trim()!==EXPECTED) return "offline";
      worst=Math.max(worst,performance.now()-started);
    }catch{return "offline"}finally{clearTimeout(timer)}
  }
  const conn=(navigator as Navigator & {connection?:{effectiveType?:string}}).connection;
  return worst>2500 || conn?.effectiveType==="2g" || conn?.effectiveType==="slow-2g"?"weak":"online";
}

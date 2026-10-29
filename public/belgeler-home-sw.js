/* Belgeler home-offline gateway: root-scoped but intercepts ONLY exact homepage navigation.
 * No other site route, API, private data or response is ever cached or rewritten.
 */
"use strict";
const HOME_CACHE="belgeler-home-offline-v1";
const HOME_FALLBACK="/belgeler-home-offline.html";
self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const response=await fetch(HOME_FALLBACK,{cache:"no-store"});
    if(!response.ok || !(response.headers.get("content-type")||"").includes("text/html"))
      throw new Error("Home offline gateway unavailable");
    await (await caches.open(HOME_CACHE)).put(HOME_FALLBACK,response);
  })());
  // Do not force reload of active editors.
});
self.addEventListener("activate",event=>{event.waitUntil(self.clients.claim())});
self.addEventListener("fetch",event=>{
  const req=event.request;
  const url=new URL(req.url);
  if(req.method!=="GET" || req.mode!=="navigate" ||
     url.origin!==self.location.origin || url.pathname!=="/" || url.search) return;
  if(req.headers.has("rsc") || req.headers.has("next-router-prefetch") ||
     req.headers.has("next-router-state-tree"))return;
  event.respondWith((async()=>{
    try{return await fetch(req)}catch{
      return await (await caches.open(HOME_CACHE)).match(HOME_FALLBACK) ||
        new Response("Çevrimdışı. Belgeler: /belgeler",{status:503,
          headers:{"Content-Type":"text/plain; charset=utf-8"}});
    }
  })());
});

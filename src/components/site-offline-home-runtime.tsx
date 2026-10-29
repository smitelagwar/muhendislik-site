"use client";
import {useEffect} from "react";

/** Register a deliberately narrow root scope for offline '/' only.
 * The existing /belgeler worker stays the most-specific handler.
 */
export function SiteOfflineHomeRuntime(){
  useEffect(()=>{
    if(!("serviceWorker" in navigator)||!window.isSecureContext ||
      process.env.NODE_ENV!=="production")return;
    const script=new URL("/belgeler-home-sw.js",location.origin).href;
    const scope=new URL("/",location.origin).href;
    const start=async()=>{
      try{
        const registrations=await navigator.serviceWorker.getRegistrations();
        const existing=registrations.find(item=>item.scope===scope);
        if(existing){
          const current=existing.active?.scriptURL||existing.installing?.scriptURL||existing.waiting?.scriptURL;
          if(current && current!==script)return; // Never overwrite another portal's root worker.
        }
        if(process.env.NEXT_PUBLIC_BELGELER_OFFLINE_PWA==="0"){
          if(existing?.active?.scriptURL===script)await existing.unregister();
          return;
        }
        await navigator.serviceWorker.register("/belgeler-home-sw.js",{scope:"/",updateViaCache:"none"});
      }catch{/* PWA unavailable; online site must remain unaffected */}
    };
    if(document.readyState==="complete")void start();
    else window.addEventListener("load",start,{once:true});
    return()=>window.removeEventListener("load",start);
  },[]);
  return null;
}

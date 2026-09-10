"use client";
import React, { useState, useRef } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Menu, ChevronLeft, Search, Plus, MoreVertical, X, Upload, FolderPlus, Folder, RefreshCw, CheckSquare, Settings2, Eye, Download, Share2, Edit3, Move, Star, Trash2, Info } from "lucide-react";
import { OverlayPortal } from "./drive-v3/overlay-portal";
import type { DokFile, DokFolder, DokBreadcrumbItem } from "@/lib/dokumantasyon/types";
import type { WorkspaceFilters } from "./workspace-filter-sheet";
import { mobileMetadata } from "./mobile-explorer";
import s from "./mobile-workspace.module.css";
export type MobileSurface = "create" | "more" | "settings" | "drawer" | null;
export type ViewSettings = { view: "list" | "grid"; sortBy: "name" | "date" | "size" | "type"; sortOrder: "asc" | "desc"; groupBy: "none" | "type" | "date" | "size"; filters: WorkspaceFilters };
export function MobileWorkspaceBar({ title, hasParent, selection, count, allSelected, onBack, onDrawer, onSearch, onSurface, onSelectAll, onExit, moreRef }: {
 title:string; hasParent:boolean; selection:boolean; count:number; allSelected:boolean;
 onBack:()=>void; onDrawer:()=>void; onSearch:()=>void; onSurface:(s:MobileSurface)=>void; onSelectAll:()=>void; onExit:()=>void; moreRef:React.RefObject<HTMLButtonElement|null>;
}) {
 return <div className={s.bar} data-testid="dok-phone-appbar">
  {selection ? <><button className={s.icon} data-testid="dok-selection-mode" aria-label="Seçim modundan çık" onClick={onExit}><X size={20}/></button><span className={s.title} data-testid="dok-selection-count">{count} öğe seçildi</span><button className={s.icon} data-testid="dok-select-all" onClick={onSelectAll} aria-label={allSelected ? "Tüm seçimleri kaldır" : "Tümünü seç"}>Tümü</button></> : <>
  <button className={s.icon} aria-label={hasParent ? "Üst klasöre git" : "Dosya gezintisini aç"} onClick={hasParent ? onBack : onDrawer}>{hasParent ? <ChevronLeft size={20}/> : <Menu size={20}/>}</button>
  <button className={s.title} onClick={onDrawer} aria-label={`${title}, dosya gezintisini aç`}>{title}{hasParent ? " ▾" : ""}</button>
  <button className={s.icon} aria-label="Dosya ara" onClick={onSearch}><Search size={20}/></button>
  <button className={`${s.icon} ${s.primary}`} aria-label="Yeni oluştur" onClick={()=>onSurface("create")}><Plus size={20}/></button>
  <button ref={moreRef} className={s.icon} data-testid="dok-phone-more" aria-label="Görünüm ve diğer seçenekler" onClick={()=>onSurface("more")}><MoreVertical size={20}/></button>
  </>}
 </div>;
}
export function MobileWorkspacePanel({surface,onSurface,onUpload,onFolderUpload,onNewFolder,onSelect,onRefresh,settings,onApply,children,moreRef}:{surface:MobileSurface;onSurface:(s:MobileSurface)=>void;onUpload:()=>void;onFolderUpload?:()=>void;onNewFolder:()=>void;onSelect:()=>void;onRefresh:()=>void;settings:ViewSettings;onApply:(v:ViewSettings)=>void;children:React.ReactNode;moreRef:React.RefObject<HTMLButtonElement|null>}) {
 const act=(fn:()=>void)=>()=>{onSurface(null);fn();};
 const title=surface==="create"?"Yeni":surface==="settings"?"Görünüm ve düzen":surface==="drawer"?"Dosya gezintisi":"Diğer seçenekler";
 return <OverlayPortal isOpen={surface!==null} onClose={()=>onSurface(null)} title={title} presentation={surface==="drawer"?"drawer":"sheet"} returnFocusRef={moreRef}>
 <div className={s.panel}><h2>{title}</h2>
 {surface==="create"&&<><button className={s.action} onClick={act(onUpload)}><Upload size={20}/>Dosya yükle</button>{onFolderUpload&&<button className={s.action} onClick={act(onFolderUpload)}><Folder size={20}/>Klasör yükle</button>}<button className={s.action} onClick={act(onNewFolder)}><FolderPlus size={20}/>Yeni klasör</button></>}
 {surface==="more"&&<><button className={s.action} data-testid="dok-selection-mode" onClick={act(onSelect)}><CheckSquare size={20}/>Öğeleri seç</button><button className={s.action} onClick={()=>onSurface("settings")}><Settings2 size={20}/>Görünüm ve düzen</button><button className={s.action} onClick={act(onRefresh)}><RefreshCw size={20}/>Yenile</button></>}
 {surface==="settings"&&<SettingsForm initial={settings} onApply={v=>{onApply(v);onSurface(null);}} onCancel={()=>onSurface(null)}/>}
 {surface==="drawer"&&children}
 </div></OverlayPortal>;
}
function SettingsForm({initial,onApply,onCancel}:{initial:ViewSettings;onApply:(v:ViewSettings)=>void;onCancel:()=>void}) {
 const [draft,setDraft]=useState(initial);
 const setFilter=<K extends keyof WorkspaceFilters>(key:K,value:WorkspaceFilters[K])=>setDraft(d=>({...d,filters:{...d.filters,[key]:value}}));
 return <form onSubmit={e=>{e.preventDefault();onApply(draft);}}>
 <label className={s.field}>Görünüm<select aria-label="Görünüm" value={draft.view} onChange={e=>setDraft({...draft,view:e.target.value as ViewSettings["view"]})}><option value="list">Liste</option><option value="grid">Kart</option></select></label>
 <label className={s.field}>Sırala<select value={`${draft.sortBy}:${draft.sortOrder}`} onChange={e=>{const [sortBy,sortOrder]=e.target.value.split(":");setDraft({...draft,sortBy:sortBy as ViewSettings["sortBy"],sortOrder:sortOrder as ViewSettings["sortOrder"]});}}><option value="name:asc">İsim A–Z</option><option value="name:desc">İsim Z–A</option><option value="date:desc">En yeni</option><option value="date:asc">En eski</option><option value="size:desc">Büyükten küçüğe</option><option value="size:asc">Küçükten büyüğe</option><option value="type:asc">Tür</option></select></label>
 <label className={s.field}>Grupla<select value={draft.groupBy} onChange={e=>setDraft({...draft,groupBy:e.target.value as ViewSettings["groupBy"]})}><option value="none">Yok</option><option value="type">Tür</option><option value="date">Tarih</option><option value="size">Boyut</option></select></label>
 <label className={s.field}>Dosya türü<select value={draft.filters.type} onChange={e=>setFilter("type",e.target.value as WorkspaceFilters["type"])}><option value="all">Tüm türler</option><option value="cad">CAD</option><option value="pdf">PDF</option><option value="image">Görsel</option><option value="other">Diğer</option></select></label>
 <label className={s.field}>Tarih<select value={draft.filters.date} onChange={e=>setFilter("date",e.target.value as WorkspaceFilters["date"])}><option value="all">Tüm zamanlar</option><option value="today">Son 24 saat</option><option value="week">Son 7 gün</option><option value="month">Son 30 gün</option></select></label>
 <label className={s.field}>Boyut<select value={draft.filters.size} onChange={e=>setFilter("size",e.target.value as WorkspaceFilters["size"])}><option value="all">Tüm boyutlar</option><option value="small">5 MB altı</option><option value="medium">5–100 MB</option><option value="large">100 MB üstü</option></select></label>
 <label className={s.field}>Kapsam<select value={draft.filters.scope} onChange={e=>setFilter("scope",e.target.value as WorkspaceFilters["scope"])}><option value="current">Bu klasör</option><option value="all">Tüm klasörler</option></select></label>
 <label className={s.action}><input type="checkbox" checked={draft.filters.starredOnly} onChange={e=>setFilter("starredOnly",e.target.checked)}/>Yalnız yıldızlı öğeler</label>
 <div className={s.actions}><button type="button" className={s.action} onClick={onCancel}>Vazgeç</button><button className={`${s.action} ${s.primary}`} type="submit">Uygula</button></div></form>;
}
export function MobileItemPanel({item,onClose,onAction}:{item:DokFile|DokFolder|null;onClose:()=>void;onAction:(action:string,item:DokFile|DokFolder)=>void}) {
 const heading=useRef<HTMLHeadingElement>(null);
 if(!item)return null;
 const name="parent_id" in item?item.name:item.display_name;
 const actions=[{id:"open",label:"Aç",icon:Eye},...("parent_id" in item?[]:[{id:"download",label:"İndir",icon:Download}]),{id:"share",label:"Paylaş",icon:Share2},{id:"rename",label:"Yeniden adlandır",icon:Edit3},{id:"move",label:"Taşı",icon:Move},{id:"star",label:item.starred_at?"Yıldızı kaldır":"Yıldızla",icon:Star},{id:"details",label:"Detaylar",icon:Info},{id:"trash",label:"Çöp kutusuna taşı",icon:Trash2}];
 return <OverlayPortal isOpen onClose={onClose} title={`${name} işlemleri`} presentation="sheet" initialFocusRef={heading}><div className={s.panel}><h2 ref={heading} tabIndex={-1}>{name}</h2><p className={s.meta}>{mobileMetadata(item)}</p>{actions.map(a=><button key={a.id} className={`${s.action} ${a.id==="trash"?s.danger:""}`} onClick={()=>{onClose();onAction(a.id,item);}}><a.icon size={20} aria-hidden/>{a.label}</button>)}</div></OverlayPortal>;
}
export function MobileSiteLinks({breadcrumbs,onNavigate}:{breadcrumbs:DokBreadcrumbItem[];onNavigate:(id:string|null)=>void}) {
 const {resolvedTheme,setTheme}=useTheme();
 return <div className="border-t border-border mt-3 pt-3"><nav aria-label="Klasör yolu">{breadcrumbs.map((b,i)=><button className={s.action} key={b.id||i} onClick={()=>onNavigate(b.id)}>{i===0?"Dosyalar":b.name}</button>)}</nav><Link href="/" className={s.action}>İnşa Blog · Ana siteye dön</Link><button className={s.action} role="switch" aria-checked={resolvedTheme==="dark"} onClick={()=>setTheme(resolvedTheme==="dark"?"light":"dark")}>Koyu tema</button></div>;
}

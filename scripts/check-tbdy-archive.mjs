// Node.js 20+; generated data coverage only, not mathematical accuracy.
import { readFileSync } from "node:fs";
import { resolve,join } from "node:path";
const root=resolve("content/regulations/tbdy-2018");
const manifest=JSON.parse(readFileSync(join(root,"manifest.json"),"utf8"));
const pages=JSON.parse(readFileSync(join(root,"page-index.json"),"utf8"));
if(manifest.sections.length!==17||pages.length!==395||manifest.published!==false)throw new Error("Archive size/publication status mismatch");
for(let i=0;i<pages.length;i++)if(pages[i].pdfPage!==i+22||pages[i].printedPage!==i+1)throw new Error("Page mapping failed at "+(i+22));
for(const section of manifest.sections){
 const data=readFileSync(join(root,section.file),"utf8");
 if(!data.includes("validationStatus: extracted-unverified"))throw new Error("No validation flag: "+section.file);
 for(let page=section.pdfPageStart;page<=section.pdfPageEnd;page++){
  if(!data.includes("## PDF sayfa "+page+" · Basılı sayfa "+(page-21)))throw new Error("Missing page "+page);
 }
}
console.log("PASS: 17 chapters, 395 contiguous body pages, draft status retained.");

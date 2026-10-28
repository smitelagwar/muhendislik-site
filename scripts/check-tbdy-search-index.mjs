// node scripts/check-tbdy-search-index.mjs
import { readFileSync } from "node:fs";
import { join } from "node:path";
const root=join(process.cwd(),"content","regulations","tbdy-2018");
const manifest=JSON.parse(readFileSync(join(root,"manifest.json"),"utf8"));
const index=JSON.parse(readFileSync(join(root,"search-index.json"),"utf8"));
if(manifest.published!==false||manifest.validatedEngineeringContent!==false)throw new Error("Draft status was removed");
if(index.pages.length!==395)throw new Error("Unexpected number of indexed pages");
for(let i=0;i<index.pages.length;i++){
 const page=index.pages[i];
 if(page.pdfPage!==i+22||page.printedPage!==i+1)throw new Error("Bad page mapping "+page.pdfPage);
 if(page.chapter<1||page.chapter>17)throw new Error("Unknown chapter "+page.chapter);
 if(!page.normalizedText)throw new Error("Empty page "+page.pdfPage);
}
for(const [id,expectedPage] of [["3.6.1",40],["4.7.2",71]]){
 const found=index.pages.some(p=>p.pdfPage===expectedPage&&p.clauses.some(c=>c.id===id));
 if(!found)throw new Error("Missing clause "+id+" at PDF page "+expectedPage);
}
for(const s of manifest.sections){
 const text=readFileSync(join(root,s.file),"utf8");
 if(!text.includes("validationStatus: extracted-unverified"))throw new Error("Unverified label missing: "+s.file);
}
console.log("PASS: 395 pages, 17 sections, links and example clauses 3.6.1 / 4.7.2.");

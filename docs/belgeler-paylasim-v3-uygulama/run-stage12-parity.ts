import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import { generateBelgeDocument } from "../../src/lib/pdf-engine";
import { renderFlattenedPdf } from "../../src/lib/belge-paylasim/server-pdf";
import { stage12Cases, stage12Documents } from "../../tests/belgeler/fixtures/stage12-cases";

const evidence=dirname(fileURLToPath(import.meta.url));
const root=resolve(evidence,"../..");
const output=resolve(evidence,"ASAMA_12_pdfs");
const rows: object[]=[];
const goldens: object[]=[];
const started=Date.now();
let fatal: string|null=null;
const hash=(bytes:Uint8Array)=>createHash("sha256").update(bytes).digest("hex");
const masks=[{x:143,y:328.65,width:225,height:54.35},{x:68,y:310,width:208,height:38},{x:68,y:293,width:214,height:38}];
async function pixels(path:string){const image=await loadImage(path);const c=createCanvas(image.width,image.height);const ctx=c.getContext("2d");ctx.drawImage(image,0,0);return ctx.getImageData(0,0,image.width,image.height);}
async function compare(a:string,b:string,allowContact=false){
  const left=await pixels(a),right=await pixels(b);assert.equal(left.width,right.width);assert.equal(left.height,right.height);
  let changed=0,allowed=0;
  for(let y=0;y<left.height;y++)for(let x=0;x<left.width;x++){
    const offset=(y*left.width+x)*4;
    if(![0,1,2].some(channel=>Math.abs(left.data[offset+channel]-right.data[offset+channel])>12))continue;
    const masked=allowContact&&masks.some(r=>x>=r.x*2-2&&x<=(r.x+r.width)*2+2&&y>=left.height-(r.y+r.height)*2-2&&y<=left.height-r.y*2+2);
    if(masked)allowed++;else changed++;
  }
  return {changed,allowed,width:left.width,height:left.height,changedRatio:changed/(left.width*left.height)};
}
function render(pdf:string,prefix:string){execFileSync("pdftoppm.exe",["-r","144","-png",pdf,prefix],{cwd:root,timeout:15000,stdio:"pipe",windowsHide:true});}
async function main(){
  const watchdog=setTimeout(()=>{writeFileSync(resolve(evidence,"ASAMA_12_parity.json"),JSON.stringify({result:"FAIL",error:"TIMEOUT",rows,goldens}));process.exit(124);},180000);
  try{
    GlobalFonts.registerFromPath(resolve(root,"public/fonts/Arial-Regular.ttf"),"Stage12");
    mkdirSync(output,{recursive:true});
    for(const document of stage12Documents){
      const beforeGolden=Object.fromEntries(Array.from({length:document.pages},(_,i)=>{const path=resolve(root,`tests/fixtures/belgeler-approved/${document.name}-${i+1}.png`);return[path,hash(readFileSync(path))];}));
      for(const fixture of stage12Cases(document)){
        const editable=await generateBelgeDocument(document.id,fixture.values);
        const flattened=await renderFlattenedPdf(document.id,fixture.values);
        const prefix=resolve(output,`${document.name}_${fixture.name}`);
        writeFileSync(prefix+"_editable.pdf",editable.bytes);writeFileSync(prefix+"_shared.pdf",flattened.pdfBytes);
        render(prefix+"_editable.pdf",prefix+"_editable");render(prefix+"_shared.pdf",prefix+"_shared");
        const text=(variant:string)=>execFileSync("pdftotext.exe",[prefix+`_${variant}.pdf`,"-"],{cwd:root,timeout:10000,stdio:"pipe",windowsHide:true}).toString().replace(/\s+/g," ").trim();
        assert.equal(text("editable"),text("shared"),`${document.name}/${fixture.name}: text parity`);
        for(let page=1;page<=document.pages;page++){
          const parity=await compare(prefix+`_editable-${page}.png`,prefix+`_shared-${page}.png`);
          // Poppler can rasterize the same text a few pixels differently through Widget vs page XObject.
          // Keep a 0.01% pixel bound in addition to exact extracted-text and canonical field checks.
          assert.ok(parity.changedRatio<=0.0001,`${document.name}/${fixture.name}/${page}: editable and shared render mismatch (${parity.changed} pixels)`);
          rows.push({document:document.name,fixture:fixture.name,page,...parity,editableSha256:hash(editable.bytes),sharedSha256:flattened.pdfSha256,sharedBytes:flattened.sizeBytes,
            minimumFieldFontSize:Math.min(...Object.values(editable.layouts).map(l=>l.fontSize))});
          if(fixture.name==="sample"){
            const goldenPath=resolve(root,`tests/fixtures/belgeler-approved/${document.name}-${page}.png`);
            const golden=await compare(goldenPath,prefix+`_editable-${page}.png`,document.name==="istifa");
            assert.equal(golden.changed,0,`${document.name}/${page}: approved render changed outside existing contact masks`);
            goldens.push({document:document.name,page,...golden,approvedSha256:hash(readFileSync(goldenPath))});
          }
        }
      }
      // A long-value render must not contaminate the next blank document via cached template/AP/DV.
      const blank=stage12Cases(document)[0];const after=await generateBelgeDocument(document.id,blank.values);
      const temp=resolve(output,`${document.name}_ghost-check`);writeFileSync(temp+".pdf",after.bytes);render(temp+".pdf",temp);
      for(let page=1;page<=document.pages;page++){
        const ghost=await compare(resolve(output,`${document.name}_blank_editable-${page}.png`),temp+`-${page}.png`);
        assert.equal(ghost.changed,0,`${document.name}/${page}: ghost appearance after long -> blank`);
        rmSync(temp+`-${page}.png`);
      }
      rmSync(temp+".pdf");
      for(const [path,digest]of Object.entries(beforeGolden))assert.equal(hash(readFileSync(path)),digest,"approved fixture was modified");
      console.log(`PASS: ${document.name} 3 cases, ${document.pages} page(s), rendered parity + unchanged approved fixture + ghost check`);
    }
    const sheet=createCanvas(1560,1170),ctx=sheet.getContext("2d");ctx.fillStyle="#e5e7eb";ctx.fillRect(0,0,1560,1170);
    for(const [row,fixture]of ["blank","sample","turkish-long"].entries()){
      let column=0;
      for(const document of stage12Documents)for(let page=1;page<=document.pages;page++){
        const image=await loadImage(resolve(output,`${document.name}_${fixture}_shared-${page}.png`));
        ctx.fillStyle="#111827";ctx.font="13px Stage12";ctx.fillText(`${document.name} / ${fixture} / ${page}`,column*260+5,row*390+19);
        ctx.drawImage(image,column*260+5,row*390+28,250,354);column++;
      }
    }
    writeFileSync(resolve(evidence,"ASAMA_12_visual-sheet.png"),sheet.toBuffer("image/png"));
  }catch(error){fatal=error instanceof Error?error.message:String(error);process.exitCode=1;}
  finally{
    clearTimeout(watchdog);
    const report={result:fatal?"FAIL":"PASS",passed:rows.length,goldenPages:goldens.length,ghostPages:6,failed:fatal?1:0,skipped:0,durationMs:Date.now()-started,renderer:"Poppler pdftoppm.exe 144 DPI; channel difference >12; pair <=0.01% + exact extracted text; approved/ghost exact zero outside existing istifa contact masks",rows,goldens,error:fatal};
    writeFileSync(resolve(evidence,"ASAMA_12_parity.json"),JSON.stringify(report,null,2)+"\n");
    console.log(JSON.stringify({result:report.result,parityPages:rows.length,goldenPages:goldens.length,failed:report.failed,durationMs:report.durationMs,error:fatal}));process.exit(process.exitCode??0);
  }
}
void main();

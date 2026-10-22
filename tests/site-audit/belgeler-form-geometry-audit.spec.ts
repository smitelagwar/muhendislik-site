import { expect, test } from "@playwright/test";

const docs = ["santiye-sefi-sozlesmesi","santiye-sefi-istifa-dilekcesi","santiye-sefi-taahhutnamesi","insaat-ruhsati-dilekcesi","beton-dokum-tutanagi"];
const widths = [1023,1024,1025,1093,1366,1536,1920];

for (const doc of docs) {
  test("DENETIM03 geometry " + doc, async ({page}, info) => {
    test.setTimeout(240000);
    await page.setViewportSize({width:1920,height:768});
    await page.goto("/belgeler/" + doc,{waitUntil:"domcontentloaded",timeout:30000});
    const toolbar=page.getByTestId("belge-studio-preview-toolbar");
    await expect(toolbar).toBeVisible({timeout:8000});
    const results=[];
    for (const width of widths) {
      await page.setViewportSize({width,height:768});
      const r=await toolbar.evaluate((el,width) => {
        const rect=el.getBoundingClientRect();
        const controls=Array.from(el.querySelectorAll("button,a")).filter(x=>{
          const b=x.getBoundingClientRect();
          return b.width>0 && b.height>0 && getComputedStyle(x).visibility!=="hidden";
        }).map(x=>{
          const b=x.getBoundingClientRect();
          return {name:x.getAttribute("aria-label") || x.textContent?.trim().slice(0,35) || x.tagName,
            left:b.left,right:b.right,top:b.top,bottom:b.bottom};
        });
        const collisions=[],outside=[];
        controls.forEach((a,i)=>{
          if(a.left<rect.left-1||a.right>rect.right+1||a.top<rect.top-1||a.bottom>rect.bottom+1)outside.push(a.name);
          for(const b of controls.slice(i+1)){
            if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 &&
               Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)
               collisions.push(a.name+" × "+b.name);
          }
        });
        return {width,toolbarWidth:rect.width,toolbarHeight:rect.height,collisions,outside,controls,
          NOTE:"CSS reflow proxy, NOT native Chrome zoom"};
      },width);
      results.push(r);
      if(width===1024||width===1536){
        await info.attach(doc+"-"+width+".png",{body:await page.screenshot({animations:"disabled"}),contentType:"image/png"});
      }
    }
    await info.attach(doc+"-geometry.json",{body:Buffer.from(JSON.stringify(results,null,2)),contentType:"application/json"});
    const failures=results.flatMap(r=>r.collisions.concat(r.outside).map(s=>r.width+": "+s));
    expect(failures,JSON.stringify(failures,null,2)).toEqual([]);
  });
}
for (const doc of ["santiye-sefi-sozlesmesi","beton-dokum-tutanagi"]) {
  test("DENETIM03 fit " + doc,async ({page},info)=>{
    test.setTimeout(160000);
    await page.setViewportSize({width:1920,height:1080});
    await page.goto("/belgeler/"+doc,{waitUntil:"domcontentloaded",timeout:30000});
    const el=page.locator('[data-belge-form-content="true"]').first();
    await expect(el).toBeVisible({timeout:8000});
    const results=[];
    for(const vp of [{width:1920,height:1080},{width:1366,height:768},{width:1024,height:768}]){
      await page.setViewportSize(vp);
      await page.getByTestId("belge-studio-form-view-trigger").first().click({timeout:8000});
      await page.getByTestId("form-view-fit").click({timeout:8000});
      await expect.poll(()=>el.getAttribute("data-fit-status"),{timeout:8000})
        .toMatch(/^(fitted|limited|unavailable)$/);
      results.push(await el.evaluate((content,vp)=>{
        const sc=content.closest('[data-testid="belge-studio-form-scroll"]');
        const boxes=Array.from(content.children).filter(x=>x.getBoundingClientRect().height>0)
          .map(x=>x.getBoundingClientRect());
        const parent=sc.getBoundingClientRect();
        return {vp,status:content.getAttribute("data-fit-status"),scale:Number(content.getAttribute("data-scale")),
          styleZoom:content.style.zoom,computedZoom:getComputedStyle(content).zoom,
          scrollWidth:sc.scrollWidth,clientWidth:sc.clientWidth,
          scrollHeight:sc.scrollHeight,clientHeight:sc.clientHeight,
          firstTop:boxes[0]?.top-parent.top,lastBottom:boxes[boxes.length-1]?.bottom-parent.top,
          NOTE:"CSS reflow proxy, NOT native Chrome zoom"};
      },vp));
    }
    await info.attach(doc+"-fit.json",{body:Buffer.from(JSON.stringify(results,null,2)),contentType:"application/json"});
    for(const r of results){
      const zoom=r.styleZoom===""?1:Number(r.styleZoom);
      expect(Math.abs(zoom-r.scale),JSON.stringify(r)).toBeLessThan(0.011);
      if(r.status==="fitted"){
        expect(r.scrollWidth,JSON.stringify(r)).toBeLessThanOrEqual(r.clientWidth+2);
        expect(r.scrollHeight,JSON.stringify(r)).toBeLessThanOrEqual(r.clientHeight+2);
        expect(r.lastBottom,JSON.stringify(r)).toBeLessThanOrEqual(r.clientHeight+2);
      }
    }
  });
}

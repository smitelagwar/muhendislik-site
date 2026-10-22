import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const AUDIT_DIR = "audit-artifacts-stage03-gaps";
mkdirSync(AUDIT_DIR, { recursive: true });
const docs = [
  "santiye-sefi-sozlesmesi",
  "santiye-sefi-istifa-dilekcesi",
  "santiye-sefi-taahhutnamesi",
  "insaat-ruhsati-dilekcesi",
  "beton-dokum-tutanagi",
];
const save = (name: string, data: unknown) =>
  writeFileSync(AUDIT_DIR + "/" + name + ".json", JSON.stringify(data, null, 2));

async function inspect(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const studio = document.querySelector('[data-studio-locked="true"]') as HTMLElement;
    const toolbars = Array.from(studio.querySelectorAll('[data-testid="belge-studio-preview-toolbar"]'));
    const visible = toolbars.filter(x => {
      const r = x.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(x).visibility !== "hidden";
    });
    const form = studio.querySelector('[data-belge-form-content="true"]') as HTMLElement;
    const tb = visible.at(0);
    const rect = tb?.getBoundingClientRect();
    const controls = Array.from(tb?.querySelectorAll("button,a") ?? []).filter(node => {
      const r = node.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(node).visibility !== "hidden";
    }).map(node => {
      const r = node.getBoundingClientRect();
      return { name: node.getAttribute("aria-label") || node.textContent?.trim() || "", left: r.left,
        top: r.top, right: r.right, bottom: r.bottom };
    });
    const collisions: Array<{a:string,b:string,dx:number,dy:number}> = [];
    for (let i = 0; i < controls.length; i++) for (let j=i+1;j<controls.length;j++) {
      const a=controls[i],b=controls[j];
      const dx=Math.min(a.right,b.right)-Math.max(a.left,b.left);
      const dy=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);
      if (dx>1&&dy>1) collisions.push({a:a.name,b:b.name,dx,dy});
    }
    const toolbarParent=tb?.parentElement;
    const zoomGroup=tb?.querySelector(".belge-preview-zoom");
    const utils=tb?.querySelector(".belge-preview-utilities");
    return {
      viewport:{width:window.innerWidth,height:window.innerHeight,dpr:window.devicePixelRatio},
      readyText:studio.querySelector('[role="status"]')?.textContent,
      toolbarsInDOM: toolbars.length, visibleToolbarCount:visible.length,
      multipage:tb?.getAttribute("data-multipage"), toolbarWidth:rect?.width,
      panelWidth:toolbarParent?.getBoundingClientRect().width,
      gridTemplate:tb?getComputedStyle(tb).gridTemplateColumns:null,
      zoomWidth:zoomGroup?.getBoundingClientRect().width,
      utilitiesWidth:utils?.getBoundingClientRect().width,
      formMode:form?.getAttribute("data-mode"), formStatus:form?.getAttribute("data-fit-status"),
      formStyleZoom:form?.style.zoom,
      controls,collisions,
      rootScrollWidth:document.documentElement.scrollWidth,rootClientWidth:document.documentElement.clientWidth,
    };
  });
}

for (const doc of docs) {
  test("DENETIM03 loading vs ready breakpoint " + doc, async ({page},info) => {
    test.setTimeout(140000);
    await page.setViewportSize({width:1024,height:768});
    const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
    await page.goto("/belgeler/"+doc,{waitUntil:"domcontentloaded",timeout:30000});
    const root=page.locator('[data-studio-locked="true"]:visible').first();
    await expect(root).toBeVisible({timeout:8000});
    const before=await inspect(page);
    await expect(root.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.",{timeout:45000});
    await page.waitForTimeout(160);
    const ready1024=await inspect(page);
    const more=[];
    for(const width of [1023,1025,1093]){
      await page.setViewportSize({width,height:768});
      await page.waitForTimeout(170);
      more.push(await inspect(page));
    }
    await page.setViewportSize({width:1024,height:768});
    await page.waitForTimeout(170);
    const repeat1024=await inspect(page);
    await page.screenshot({path:AUDIT_DIR+"/"+doc+"-ready1024.png",animations:"disabled"});
    const record={doc,before,ready1024,more,repeat1024,errors};
    save(doc+"-breakpoint",record);
    console.log("STAGE03_BREAKPOINT",JSON.stringify({doc,before:before.collisions,ready:ready1024.collisions,repeat:repeat1024.collisions,multipage:repeat1024.multipage}));
    expect(errors).toEqual([]);
    const bad=[ready1024,...more,repeat1024].flatMap(x=>x.collisions.map(c=>x.viewport.width+":"+c.a+" × "+c.b));
    expect(bad,JSON.stringify(record,null,2)).toEqual([]);
  });
}

for(const doc of docs){
  test("DENETIM03 320 390 430 mobile menu " + doc, async ({page})=>{
    test.setTimeout(140000);
    await page.setViewportSize({width:390,height:844});
    const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
    await page.goto("/belgeler/"+doc,{waitUntil:"domcontentloaded",timeout:30000});
    const root=page.locator('[data-studio-locked="true"]:visible').first();
    await expect(root).toBeVisible({timeout:8000});
    const states=[];
    for(const width of [320,390,430]){
      await page.setViewportSize({width,height:800});
      const actions=root.getByTestId("belge-studio-mobile-actions");
      await expect(actions).toBeVisible({timeout:8000});
      const edit=actions.getByRole("button",{name:"Formu Düzenle"});
      if(await edit.isVisible()) await edit.click({timeout:8000});
      const form=root.getByRole("region",{name:"Belge form alanları"});
      await expect(form).toBeVisible({timeout:8000});
      await actions.getByRole("button",{name:"Diğer belge işlemleri"}).click({timeout:8000});
      await page.getByTestId("belge-mobile-form-view-trigger").click({timeout:8000});
      await page.getByTestId("belge-mobile-form-view-fit").click({timeout:8000});
      const content=form.locator('[data-belge-form-content="true"]');
      await expect(content).toHaveAttribute("data-mode","fit",{timeout:8000});
      await expect.poll(()=>content.getAttribute("data-fit-status"),{timeout:8000})
        .toMatch(/^(fitted|limited|unavailable)$/);
      const row=await page.evaluate(() => ({
        width:innerWidth, overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
        status:document.querySelector('[data-studio-locked="true"] [data-belge-form-content]')?.getAttribute("data-fit-status"),
        visibleButtons:Array.from(document.querySelectorAll('[data-testid="belge-studio-mobile-actions"] button'))
          .filter(x=>x.getBoundingClientRect().width>0).length
      }));
      states.push(row);
      await page.screenshot({path:AUDIT_DIR+"/"+doc+"-mobile-"+width+".png",animations:"disabled"});
      expect(row.overflow,"Mobile page overflow at "+width).toBeLessThanOrEqual(2);
    }
    save(doc+"-mobile",{doc,states,errors});
    expect(errors).toEqual([]);
  });
}

test("DENETIM03 keyboard focus/menu + saved preferences",async({page})=>{
  test.setTimeout(90000);
  await page.setViewportSize({width:1366,height:768});
  await page.goto("/belgeler/santiye-sefi-sozlesmesi",{waitUntil:"domcontentloaded"});
  const root=page.locator('[data-studio-locked="true"]:visible').first();
  const trigger=root.getByTestId("belge-studio-form-view-trigger");
  await expect(trigger).toBeVisible({timeout:8000});
  await trigger.focus();await page.keyboard.press("Enter");
  await expect(page.getByTestId("belge-studio-form-view-menu")).toBeVisible({timeout:8000});
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();await page.getByTestId("form-view-scale-125").click();
  const content=root.locator('[data-belge-form-content="true"]');
  await expect(content).toHaveAttribute("data-scale","1.25");
  await page.reload({waitUntil:"domcontentloaded"});
  await expect(root.locator('[data-belge-form-content="true"]')).toHaveAttribute("data-scale","1.25",{timeout:8000});
  save("keyboard-preference",{focusedAfterEscape:true,scaleAfterReload:await root.locator('[data-belge-form-content="true"]').getAttribute("data-scale")});
});

import { test, expect } from "@playwright/test";

const PATH="/kategori/araclar/duzensizlik-simulatoru";
const IDs=["A1","A2","A3","B1","B2","B3"] as const;

test.describe("TBDY 3B stüdyo kalite kapısı",()=>{
  test.beforeEach(async ({page})=>{
    await page.goto(PATH,{waitUntil:"domcontentloaded"});
    await expect(page.getByTestId("irregularity-studio")).toHaveAttribute("data-interactive","true");
  });

  test("Altı senaryo, ölçeksiz 2B anlatım ve sade öğretici panel",async ({page})=>{
    await page.getByTestId("irregularity-mode").click();
    await expect(page.getByTestId("irregularity-2d-diagram")).toBeVisible();
    for(const id of IDs){
      await page.getByTestId("irregularity-scenario-"+id).click();
      await expect(page.getByTestId("irregularity-scenario-"+id)).toHaveAttribute("aria-pressed","true");
      await expect(page.getByTestId("irregularity-2d-diagram")).toBeVisible();
    }
    const toggle=page.getByTestId("irregularity-toggle-panel");
    if(await toggle.getAttribute("aria-expanded")==="false")await toggle.click();
    await expect(page.getByTestId("irregularity-guide-copy")).toBeVisible();
    await page.getByTestId("irregularity-lesson-1").click();
    await expect(page.getByTestId("irregularity-guide-copy")).not.toBeEmpty();
    await page.getByTestId("irregularity-lesson-2").click();
    await expect(page.getByTestId("irregularity-guide-copy")).not.toBeEmpty();
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded","false");
    await page.getByTestId("irregularity-mode").click();
    await expect(page.getByRole("button",{name:"2B çizime geç"})).toBeVisible();
  });

  test("Kamera, animasyon, katman, hız ve sıfırlama düğmeleri",async ({page})=>{
    for(const preset of ["front","side","left","top","perspective"]){
      await page.getByTestId("irregularity-camera-"+preset).click();
      await page.getByTestId("irregularity-camera-"+preset).click();
      await expect(page.getByTestId("irregularity-camera-"+preset)).toHaveAttribute("aria-pressed","true");
    }
    await page.getByTestId("irregularity-playback").click();
    await expect(page.getByTestId("irregularity-playback")).toHaveAttribute("aria-pressed","true");
    await page.getByTestId("irregularity-playback").click();
    await expect(page.getByTestId("irregularity-playback")).toHaveAttribute("aria-pressed","false");
    await page.getByTestId("irregularity-settings").click();
    await page.getByTestId("irregularity-speed").selectOption("1.5");
    await expect(page.getByTestId("irregularity-speed")).toHaveValue("1.5");
    for(const layer of ["showSlabs","showMembers","showHighlights"]){
      const checkbox=page.getByTestId("irregularity-layer-"+layer);
      await checkbox.uncheck();
      await expect(checkbox).not.toBeChecked();
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    }
    await page.getByTestId("irregularity-reset").click();
    await expect(page.getByTestId("irregularity-playback")).toHaveAttribute("aria-pressed","false");
    await expect(page.getByTestId("irregularity-camera-perspective")).toHaveAttribute("aria-pressed","true");
    await page.getByTestId("irregularity-settings").click();
    await expect(page.getByTestId("irregularity-speed")).toHaveValue("1");
  });

  test("Tam ekran, üst banner yok, mobil taşma yok, mod geçişinde tek canvas",async ({page})=>{
    await expect(page.getByTestId("irregularity-app-shell")).toBeVisible();
    await expect(page.getByRole("link",{name:"Araçlara geri dön"})).toHaveAttribute("href","/kategori/araclar");
    await page.getByTestId("irregularity-mode").click();
    await page.getByTestId("irregularity-mode").click();
    for(let i=0;i<4;i++) {
      await page.getByTestId("irregularity-scenario-"+IDs[i]).click();
      await page.getByTestId("irregularity-mode").click();
      await page.getByTestId("irregularity-mode").click();
    }
    // A WebGL-capable browser must not leak canvases across repeated mode changes.
    expect(await page.locator('[data-testid="irregularity-three-canvas"] canvas').count()).toBeLessThanOrEqual(1);
    const d=await page.evaluate(()=>({
      w:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      h:document.documentElement.scrollHeight-window.innerHeight,
    }));
    expect(d.w).toBeLessThanOrEqual(2);
    expect(d.h).toBeLessThanOrEqual(4);
    if((page.viewportSize()?.width??1200)<1024){
      await expect(page.getByTestId("irregularity-toggle-panel")).toHaveAttribute("aria-expanded","false");
      await page.getByTestId("irregularity-toggle-panel").click();
      await expect(page.getByTestId("irregularity-guide-copy")).toBeVisible();
      await page.keyboard.press("Escape");
    }
  });
  test("3B sahne kanıt ekran görüntüleri",async ({page},testInfo)=>{
    if(!["chromium-desktop-1366","chromium-mobile-390","webkit-mobile-390"].includes(testInfo.project.name))return;
    for(const id of ["A1","A2","A3","B2","B3"]){
      await page.getByTestId("irregularity-scenario-"+id).click();
      await expect(page.getByTestId("irregularity-scenario-"+id)).toHaveAttribute("aria-pressed","true");
      await page.waitForTimeout(450);
      await testInfo.attach(id+"-"+testInfo.project.name,{
        body:await page.screenshot({animations:"disabled"}),
        contentType:"image/png",
      });
    }
  });


  test("A1–B3 bağlamsal kartı, gerçek 3B odak ve 2B anlatımı eşleşiyor",async ({page})=>{
    const card=page.getByTestId("irregularity-why-card");
    await expect(card).toBeVisible();
    for(const [id,excerpt,count] of [
      ["A1","karşılıklı kenarlarda",2],
      ["A2","döşeme boşluğu",1],
      ["A3","iç köşesinde",1],
      ["B1","dayanımı",1],
      ["B2","göreli yatay ötelenme",1],
      ["B3","iki uçtan mesnetli",1],
    ] as const){
      await page.getByTestId("irregularity-scenario-"+id).click();
      await expect(card).toHaveAttribute("data-scenario",id);
      await expect(page.getByTestId("irregularity-why-copy")).toContainText(excerpt);
      const root=page.getByTestId("irregularity-three-canvas");
      if(await root.locator("canvas").count()){
        await expect(root).toHaveAttribute("data-focus-count",String(count));
        await expect(root).toHaveAttribute("data-focus-visible","true");
        await expect(root).toHaveAttribute("data-focus-world",/^-?[\d.]+,-?[\d.]+,-?[\d.]+$/);
      }
    }
    await page.getByTestId("irregularity-why-close").click();
    await expect(card).not.toBeVisible();
    await page.getByTestId("irregularity-why-open").click();
    await expect(card).toBeVisible();
    await page.getByTestId("irregularity-why-details").click();
    await expect(page.getByTestId("irregularity-lesson-2")).toHaveAttribute("aria-pressed","true");
    await expect(page.getByTestId("irregularity-guide-copy")).not.toBeEmpty();
    const rect=await card.boundingBox(),vp=page.viewportSize();
    if(rect&&vp){
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.x+rect.width).toBeLessThanOrEqual(vp.width+2);
      expect(rect.y+rect.height).toBeLessThanOrEqual(vp.height+2);
    }
    await page.keyboard.press("Escape");
    await page.getByTestId("irregularity-mode").click();
    await expect(page.getByTestId("irregularity-2d-diagram")).toBeVisible();
    await expect(card).toContainText("iki uçtan mesnetli");
  });

  test("3B odak işaretleri katman anahtarıyla birlikte gizlenip açılıyor",async ({page})=>{
    const root=page.getByTestId("irregularity-three-canvas");
    if(!(await root.locator("canvas").count()))return;
    await expect(root).toHaveAttribute("data-focus-visible","true");
    await page.getByTestId("irregularity-settings").click();
    await page.getByTestId("irregularity-layer-showHighlights").uncheck();
    await expect(root).toHaveAttribute("data-focus-visible","false");
    await expect(page.getByTestId("irregularity-why-card")).toContainText("İşaretler kapalı");
    await page.getByTestId("irregularity-layer-showHighlights").check();
    await expect(root).toHaveAttribute("data-focus-visible","true");
  });

  test("Kamera presetleri görsel kamerayı değiştirir ve hareketli odak yer değiştirir",async ({page},testInfo)=>{
    // In 2B fallback there is intentionally no camera. Only WebGL-capable
    // browsers can assert real camera and animation positions.
    if(testInfo.project.name!=="chromium-desktop-1366")return;
    const root=page.getByTestId("irregularity-three-canvas");
    await expect(root.locator("canvas")).toHaveCount(1);
    await expect(root).toHaveAttribute("data-camera-position",/^-?[\d.]+,-?[\d.]+,-?[\d.]+$/);
    const start=await root.getAttribute("data-camera-position");
    await page.getByTestId("irregularity-camera-top").click();
    await expect.poll(()=>root.getAttribute("data-camera-position")).not.toBe(start);
    await page.waitForTimeout(500);
    const top=await root.getAttribute("data-camera-position");
    await page.getByTestId("irregularity-camera-front").click();
    await expect.poll(()=>root.getAttribute("data-camera-position")).not.toBe(top);
    await page.waitForTimeout(500);
    const atRest=await root.getAttribute("data-focus-world");
    await page.getByTestId("irregularity-playback").click();
    await expect.poll(()=>root.getAttribute("data-focus-world")).not.toBe(atRest);
    await page.getByTestId("irregularity-playback").click();
    await expect(root).toHaveAttribute("data-renderer-geometries",/^\d+$/);
  });

  test("Dar ekranlarda neden kartı çalışma alanı ve kamera düğmelerini taşırmıyor",async ({page},testInfo)=>{
    if(!["chromium-mobile-320","chromium-mobile-390","webkit-mobile-390"].includes(testInfo.project.name))return;
    const card=page.getByTestId("irregularity-why-card");
    const panel=page.getByTestId("irregularity-scene-area");
    const cameras=page.getByRole("group",{name:"Kamera görünümleri"});
    await expect(card).toBeVisible();
    const box=await card.boundingBox(),area=await panel.boundingBox(),ctl=await cameras.boundingBox();
    expect(box&&area&&ctl).toBeTruthy();
    if(box&&area&&ctl){
      expect(box.x).toBeGreaterThanOrEqual(area.x);
      expect(box.x+box.width).toBeLessThanOrEqual(area.x+area.width+2);
      expect(box.y).toBeGreaterThanOrEqual(area.y);
      expect(box.y+box.height).toBeLessThanOrEqual(ctl.y+2);
    }
    await page.getByTestId("irregularity-why-details").click();
    await expect(page.locator('#irregularity-learning-panel button[aria-label="Paneli kapat"]')).toBeFocused();
    await page.keyboard.press("Escape");
    await page.getByTestId("irregularity-camera-top").click();
    await expect(page.getByTestId("irregularity-camera-top")).toHaveAttribute("aria-pressed","true");
  });
  test("Azaltılmış hareket, oynatma durumunda yanıltıcı davranmıyor",async ({page})=>{
    await page.emulateMedia({reducedMotion:"reduce"});
    await expect(page.getByTestId("irregularity-playback")).toBeDisabled();
    await expect(page.getByTestId("irregularity-playback")).toContainText("Hareket kapalı");
    await page.getByTestId("irregularity-mode").click();
    await expect(page.getByTestId("irregularity-2d-diagram")).toBeVisible();
  });
  test("WebGL sağlanamazsa 2B yedek eğitim ekranı açılır",async ({browser})=>{
    const context=await browser.newContext();
    await context.addInitScript(()=>{
      const get=HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(kind,...args){
        if(kind==="webgl"||kind==="webgl2"||kind==="experimental-webgl")return null;
        return get.call(this,kind,...args);
      };
    });
    try {
      const page=await context.newPage();
      await page.goto(PATH,{waitUntil:"domcontentloaded"});
      await expect(page.getByTestId("irregularity-2d-diagram")).toBeVisible();
      await expect(page.getByTestId("irregularity-retry")).toBeVisible();
    } finally { await context.close(); }
  });
});

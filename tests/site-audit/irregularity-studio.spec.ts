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
    for(const preset of ["front","side","top","perspective"]){
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

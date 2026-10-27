import {test,expect} from "@playwright/test";

const URL="/kategori/araclar/duzensizlik-simulatoru";
test("Responsive comparisons retain full-size models and a single canvas",async ({page},info)=>{
  await page.goto(URL,{waitUntil:"domcontentloaded",timeout:45000});
  const canvas=page.getByTestId("irregularity-three-canvas");
  await expect(canvas.locator("canvas")).toHaveCount(1);
  const compare=page.getByTestId("irregularity-compare-toggle");
  await compare.click();
  await expect(compare).toHaveAttribute("aria-pressed","true");
  const compact=await page.getByTestId("irregularity-compare-mobile").isVisible().catch(()=>false);
  if(compact){
    const regular=page.getByTestId("irregularity-compare-side-reference");
    const irregular=page.getByTestId("irregularity-compare-side-irregular");
    await regular.click();
    await expect(regular).toHaveAttribute("aria-pressed","true");
    await expect(canvas).toHaveAttribute("data-compare-mode","reference");
    await irregular.click();
    await expect(canvas).toHaveAttribute("data-compare-mode","irregular");
  }else{
    await expect(canvas).toHaveAttribute("data-compare-mode","dual");
  }
  for(const id of ["A1","A2","A3","B1","B2","B3"]){
    await page.getByTestId("irregularity-scenario-"+id).click();
    await expect(canvas).toHaveAttribute("data-teaching-scenario",id);
    await expect(page.getByTestId("irregularity-three-canvas").locator("canvas")).toHaveCount(1);
  }
  await page.getByTestId("irregularity-playback").click();
  await expect(page.getByTestId("irregularity-playback")).toHaveAttribute("aria-pressed","true");
  await page.getByTestId("irregularity-intensity-light").click();
  await page.getByTestId("irregularity-intensity-extreme").click();
  await expect(page.getByTestId("irregularity-intensity-extreme")).toHaveAttribute("aria-pressed","true");
  await page.getByTestId("irregularity-playback").click();
  await page.getByTestId("irregularity-camera-top").click();
  await expect(page.getByTestId("irregularity-camera-top")).toHaveAttribute("aria-pressed","true");
  await compare.click();
  await expect(canvas).toHaveAttribute("data-compare-mode","single");
  await page.getByTestId("irregularity-mode").click();
  await expect(page.getByTestId("irregularity-2d-diagram")).toBeVisible();
  await page.getByTestId("irregularity-mode").click();
  await expect(page.getByTestId("irregularity-three-canvas").locator("canvas")).toHaveCount(1);
  const metrics=await page.evaluate(()=>({
    overflowX:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    overflowY:document.documentElement.scrollHeight-window.innerHeight,
    scene:document.querySelector('[data-testid="irregularity-scene-area"]')?.getBoundingClientRect().height??0,
  }));
  expect(metrics.overflowX,info.project.name).toBeLessThanOrEqual(2);
  expect(metrics.overflowY,info.project.name).toBeLessThanOrEqual(4);
  expect(metrics.scene).toBeGreaterThan(130);
});
test("A compact comparison card can be closed and reopened",async ({page})=>{
  await page.goto(URL,{waitUntil:"domcontentloaded",timeout:45000});
  await page.getByTestId("irregularity-compare-toggle").click();
  const close=page.getByTestId("irregularity-why-close");
  if(await close.isVisible())await close.click();
  await page.getByTestId("irregularity-why-open").click();
  await expect(page.getByTestId("irregularity-compare-teaching")).toBeVisible();
  await expect(page.getByTestId("irregularity-compare-teaching")).toContainText("Düzenli:");
  await expect(page.getByTestId("irregularity-compare-teaching")).toContainText("Düzensiz:");
  await close.click();
  await expect(page.getByTestId("irregularity-why-open")).toBeVisible();
});

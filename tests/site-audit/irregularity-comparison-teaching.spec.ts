import { test, expect } from "@playwright/test";

const route="/kategori/araclar/duzensizlik-simulatoru";
const scenarios=[
  {id:"A1",cues:5,word:"dön"},
  {id:"A2",cues:5,word:"döşeme"},
  {id:"A3",cues:3,word:"köşe"},
  {id:"B1",cues:2,word:"dayanım"},
  {id:"B2",cues:4,word:"ötelenme"},
  {id:"B3",cues:6,word:"yük"},
] as const;

test("Comparison teaches six distinct irregularities with synchronized 3D guides",async ({page})=>{
  await page.goto(route,{waitUntil:"domcontentloaded",timeout:45000});
  const canvas=page.getByTestId("irregularity-three-canvas");
  const compare=page.getByTestId("irregularity-compare-toggle");
  await expect(compare).toBeVisible();
  if(await compare.isDisabled() || !(await canvas.locator("canvas").count()))test.skip(true,"WebGL not available in this environment");
  await compare.click();
  await expect(compare).toHaveAttribute("aria-pressed","true");
  await expect(canvas).toHaveAttribute("data-compare-mode","dual");

  for(const scenario of scenarios){
    await page.getByTestId("irregularity-scenario-"+scenario.id).click();
    const open=page.getByTestId("irregularity-why-open");
    if(await open.isVisible())await open.click();
    const teaching=page.getByTestId("irregularity-compare-teaching");
    await expect(teaching).toHaveAttribute("data-scenario",scenario.id);
    await expect(teaching).toContainText(scenario.word);
    await expect(teaching).toContainText("Düzenli:");
    await expect(teaching).toContainText("Düzensiz:");
    await expect(canvas).toHaveAttribute("data-teaching-scenario",scenario.id);
    await expect(canvas).toHaveAttribute("data-teaching-cue-count",String(scenario.cues));
    await expect(canvas).toHaveAttribute("data-compare-mode",compact?"irregular":"dual");
  }

  // A shared animation clock, existing intensity picker and camera remain operable.
  await page.getByTestId("irregularity-intensity-extreme").click();
  await page.getByTestId("irregularity-playback").click();
  await expect(page.getByTestId("irregularity-playback")).toHaveAttribute("aria-pressed","true");
  await expect.poll(()=>canvas.getAttribute("data-compare-phase"),{timeout:5000}).not.toBe("0.0000");
  await page.getByTestId("irregularity-playback").click();
  await page.getByTestId("irregularity-camera-top").click();
  await expect(page.getByTestId("irregularity-camera-top")).toHaveAttribute("aria-pressed","true");
  await compare.click();
  await expect(canvas).toHaveAttribute("data-compare-mode","single");
  await expect(page.getByTestId("irregularity-compare-teaching")).toHaveCount(0);
});

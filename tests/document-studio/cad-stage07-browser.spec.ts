import { expect, test } from "@playwright/test";
import {
  signInAdmin, uploadCadPreviewV2Fixture, cleanupUploadedCadFixtures,
} from "./cad-test-helpers";

test.describe("CAD V1 ASAMA_07 — review-only notes, freehand and eraser", () => {
  test.afterEach(async ({page}) => cleanupUploadedCadFixtures(page));

  test("Pin/Text dialog: blank disabled, safe save, cancel, undo and F5 without source mutation", async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), "Desktop coordinate oracle; separate touch test runs below");
    await signInAdmin(page);
    const {fileId} = await uploadCadPreviewV2Fixture(page,"known-geometry-measurements");
    await page.goto("/dokumantasyon/dosya/"+fileId);
    const host=page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state","ready",{timeout:30000});
    const canvas=host.locator("canvas").first();
    await expect(canvas).toBeVisible();
    const bounds=await canvas.boundingBox();
    expect(bounds).not.toBeNull();
    const xy={x:bounds!.x+bounds!.width*0.65,y:bounds!.y+bounds!.height*0.65};
    console.log("[CAD STEP] Pin blank-input validation and save");
    const initialEntityCount=await page.evaluate(()=>(
      window as Window & {__cadAdapter?:{getRenderReadinessSnapshot:()=>{entityCount:number}}}
    ).__cadAdapter?.getRenderReadinessSnapshot().entityCount??null);

    await page.locator('[data-testid="cad-tool-pin"]').first().click();
    await page.mouse.click(xy.x,xy.y);
    const dialog=page.getByTestId("cad-review-input-dialog");
    await expect(dialog).toBeVisible();
    const input=page.getByTestId("cad-review-input-text");
    await input.fill("   ");
    await expect(page.getByTestId("cad-review-input-save")).toBeDisabled();
    await input.fill("  <b>Yorum</b>  ");
    await page.getByTestId("cad-review-input-save").click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('[data-review-type="comment_pin"]')).toHaveCount(1);

    console.log("[CAD STEP] Pin cancellation preserves the saved pin");
    await page.mouse.click(xy.x+100,xy.y-60);
    await expect(dialog).toBeVisible();
    await page.getByTestId("cad-review-input-cancel").click();
    await expect(page.locator('[data-review-type="comment_pin"]')).toHaveCount(1);

    console.log("[CAD STEP] Text save and revision-scoped localStorage read");
    await page.locator('[data-testid="cad-tool-text"]').first().click();
    await page.mouse.click(xy.x+105,xy.y+30);
    await expect(dialog).toBeVisible();
    await input.fill("  300x500 Kiriş  ");
    await page.getByTestId("cad-review-input-save").click();
    await expect(page.locator('[data-review-type="text"]')).toHaveCount(1);

    const items=await page.evaluate((id)=>{
      const key=Object.keys(localStorage).find(key => key.startsWith(`dok_cad_review_v1_${id}__`));
      const raw=key ? localStorage.getItem(key) : null;
      return (raw?JSON.parse(raw).items:[]) as {type:string;comment?:string;text?:string}[];
    },fileId);
    expect(items.find(x=>x.type==="comment_pin")?.comment).toBe("bYorum/b");
    expect(items.find(x=>x.type==="text")?.text).toBe("300x500 Kiriş");
    const afterCount=await page.evaluate(()=>(
      window as Window & {__cadAdapter?:{getRenderReadinessSnapshot:()=>{entityCount:number}}}
    ).__cadAdapter?.getRenderReadinessSnapshot().entityCount??null);
    expect(afterCount).toBe(initialEntityCount);

    console.log("[CAD STEP] Undo and redo text item");
    await page.locator('[data-testid="cad-tool-undo"]').first().click();
    await expect(page.locator('[data-review-type="text"]')).toHaveCount(0);
    await page.locator('[data-testid="cad-tool-redo"]').first().click();
    await expect(page.locator('[data-review-type="text"]')).toHaveCount(1);
    console.log("[CAD STEP] F5 persistence reload and readiness");
    await page.reload();
    await expect(host).toHaveAttribute("data-cad-upstream-state","ready",{timeout:30000});
    await expect(page.locator('[data-review-type="comment_pin"]')).toHaveCount(1);
    await expect(page.locator('[data-review-type="text"]')).toHaveCount(1);
  });

  test("real DXF stroke & review eraser: one gesture, Undo/Redo, source unchanged",async({page,isMobile})=>{
    test.skip(Boolean(isMobile),"Desktop drag oracle; touch event coverage is in stage07 contracts");
    await signInAdmin(page);
    const {fileId}=await uploadCadPreviewV2Fixture(page,"known-geometry-measurements");
    await page.goto("/dokumantasyon/dosya/"+fileId);
    const host=page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state","ready",{timeout:30000});
    const canvas=host.locator("canvas").first();
    await expect(canvas).toBeVisible();
    const b=await canvas.boundingBox();
    expect(b).not.toBeNull();
    const from={x:b!.x+b!.width*.23,y:b!.y+b!.height*.42};
    const middle={x:from.x+80,y:from.y+45};
    const to={x:from.x+165,y:from.y+75};
    const before=await page.evaluate(()=>(
      window as Window & {__cadAdapter?:{getRenderReadinessSnapshot:()=>{entityCount:number}}}
    ).__cadAdapter?.getRenderReadinessSnapshot().entityCount??null);

    await page.locator('[data-testid="cad-tool-stroke"]').first().click();
    await page.mouse.move(from.x,from.y);
    await page.mouse.down();
    await page.mouse.move(middle.x,middle.y,{steps:8});
    await page.mouse.move(to.x,to.y,{steps:8});
    await page.mouse.up();
    await expect(page.locator('[data-review-type="stroke"]')).toHaveCount(1);
    const raw=await page.evaluate(id => {
      const key=Object.keys(localStorage).find(key => key.startsWith(`dok_cad_review_v1_${id}__`));
      return key ? localStorage.getItem(key) : null;
    },fileId);
    const strokes=JSON.parse(raw??"{}").items?.filter((x:{type:string})=>x.type==="stroke");
    expect(strokes).toHaveLength(1);
    expect(strokes[0].points.length).toBeGreaterThanOrEqual(2);

    await page.locator('[data-testid="cad-tool-eraser"]').first().click();
    await page.mouse.click(middle.x,middle.y);
    await expect(page.locator('[data-review-type="stroke"]')).toHaveCount(0);
    await page.locator('[data-testid="cad-tool-undo"]').first().click();
    await expect(page.locator('[data-review-type="stroke"]')).toHaveCount(1);
    await page.locator('[data-testid="cad-tool-redo"]').first().click();
    await expect(page.locator('[data-review-type="stroke"]')).toHaveCount(0);

    const after=await page.evaluate(()=>(
      window as Window & {__cadAdapter?:{getRenderReadinessSnapshot:()=>{entityCount:number}}}
    ).__cadAdapter?.getRenderReadinessSnapshot().entityCount??null);
    expect(after).toBe(before);
    await page.reload();
    await expect(host).toHaveAttribute("data-cad-upstream-state","ready",{timeout:30000});
    await expect(page.locator('[data-review-type="stroke"]')).toHaveCount(0);
  });
});

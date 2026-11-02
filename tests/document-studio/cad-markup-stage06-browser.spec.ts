import { expect, test } from "@playwright/test";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";

test.describe("CAD V1 ASAMA_06 — real shape/selection overlay and source preservation", () => {
  test.afterEach(async ({page}) => cleanupUploadedCadFixtures(page));

  test("Rect reverse drag, selected move grip, single undo, F5; source CAD stays unchanged",async ({page,isMobile})=>{
    test.skip(Boolean(isMobile),"Mouse drag and Shift selection require desktop variant");
    await signInAdmin(page);
    const {fileId}=await uploadCadPreviewV2Fixture(page,"known-geometry-measurements");
    await page.goto("/dokumantasyon/dosya/"+fileId);
    const host=page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state","ready",{timeout:30000});
    const canvas=host.locator("canvas").first();
    await expect(canvas).toBeVisible();
    const projected=await page.evaluate(()=>{
      const adapter=(window as Window & {
        __cadAdapter?: {
          projectWorldPoint:(p:{x:number;y:number})=>{x:number;y:number}|null;
          getRenderReadinessSnapshot?:()=>{entityCount:number};
        };
      }).__cadAdapter;
      return {
        high:adapter?.projectWorldPoint?.({x:2500,y:3000})??null,
        low:adapter?.projectWorldPoint?.({x:500,y:500})??null,
        before:adapter?.getRenderReadinessSnapshot?.().entityCount??null,
      };
    });
    expect(projected.high).not.toBeNull();
    expect(projected.low).not.toBeNull();
    const box=await canvas.boundingBox();
    expect(box).not.toBeNull();
    const hi={x:box!.x+projected.high!.x,y:box!.y+projected.high!.y};
    const lo={x:box!.x+projected.low!.x,y:box!.y+projected.low!.y};

    // The primary Shapes tool defaults to a rectangle. Avoid drawing through
    // a still-open popover that would intercept viewport pointer events.
    await page.locator('[data-testid="cad-tool-shapes"]').first().click();
    await page.mouse.move(hi.x,hi.y);
    await page.mouse.down();
    await page.mouse.move(lo.x,lo.y,{steps:8});
    await expect(page.locator('[data-cad-review-overlay="true"]')).toBeAttached();
    await page.mouse.up();
    const shape=page.locator('[data-review-type="shape_rect"]').first();
    await expect(shape).toBeVisible();
    await expect(page.locator('[data-review-type="shape_rect"]')).toHaveCount(1);

    const fromLocal=async () => page.evaluate((id)=>{
      const raw=window.localStorage.getItem("dok_cad_review_v1_"+id);
      const doc=raw?JSON.parse(raw):null;
      return doc?.items?.filter((item:{type?:string})=>item.type==="shape")??[];
    },fileId);
    let items=await fromLocal() as Array<{id:string;p1:{x:number;y:number};p2:{x:number;y:number}}>;
    expect(items).toHaveLength(1);
    // Browser CSS-pixel rounding produces sub-0.001 world-unit inverse error.
    expect(items[0]?.p1.x).toBeCloseTo(2500, 3);
    expect(items[0]?.p1.y).toBeCloseTo(3000, 3);
    expect(items[0]?.p2.x).toBeCloseTo(500, 3);
    expect(items[0]?.p2.y).toBeCloseTo(500, 3);
    const original=items[0]!;

    await page.locator('[data-testid="cad-tool-select"]').first().click();
    // Selected shape can be moved from an edge, not an inert UI-only handle.
    await page.mouse.move(hi.x,hi.y);
    await page.mouse.down();
    await page.mouse.move(hi.x+45,hi.y+24,{steps:5});
    await page.mouse.up();
    await expect(shape).toHaveAttribute("data-review-selected","true");
    items=await fromLocal() as typeof items;
    expect(items).toHaveLength(1);
    expect(items[0]?.p1.x).not.toBe(original.p1.x);
    await page.locator('[data-testid="cad-tool-undo"]').first().click();
    items=await fromLocal() as typeof items;
    expect(items[0]?.p1).toEqual(original.p1);
    await page.locator('[data-testid="cad-tool-redo"]').first().click();
    items=await fromLocal() as typeof items;
    expect(items[0]?.p1.x).not.toBe(original.p1.x);

    const count=await page.evaluate(()=>{
      const adapter=(window as Window & {
        __cadAdapter?: {getRenderReadinessSnapshot?:()=>{entityCount:number}};
      }).__cadAdapter;
      return adapter?.getRenderReadinessSnapshot?.().entityCount??null;
    });
    expect(count).toBe(projected.before);

    await page.reload();
    await expect(host).toHaveAttribute("data-cad-upstream-state","ready",{timeout:30000});
    await expect(page.locator('[data-review-type="shape_rect"]')).toHaveCount(1);
  });
});

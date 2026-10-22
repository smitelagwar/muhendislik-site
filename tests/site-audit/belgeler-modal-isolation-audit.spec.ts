import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("audit-artifacts-stage03-gaps",{recursive:true});
test("DENETIM03 two simultaneous modal instances isolation and global command",async({page})=>{
  test.setTimeout(120000);
  await page.setViewportSize({width:1920,height:1080});
  await page.goto("/__audit/belgeler-form-view",{waitUntil:"domcontentloaded",timeout:30000});
  const a=page.getByTestId("audit-modal-a"),b=page.getByTestId("audit-modal-b");
  const av=a.locator('[data-belge-form-content="true"]'),bv=b.locator('[data-belge-form-content="true"]');
  await expect(av).toBeVisible({timeout:8000});await expect(bv).toBeVisible({timeout:8000});
  await a.getByTestId("belge-studio-form-view-trigger").click({timeout:8000});
  await page.getByTestId("form-view-scale-90").click({timeout:8000});
  await expect(av).toHaveAttribute("data-scale","0.9",{timeout:8000});
  await expect(bv).toHaveAttribute("data-scale","1",{timeout:8000});
  const before=await page.evaluate(()=>[...document.querySelectorAll('[data-belge-form-content="true"]')]
    .map(x=>({scale:x.getAttribute("data-scale"),mode:x.getAttribute("data-mode")})));
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent("belge-form-view:command",{detail:{command:"scale",scale:1.25}})));
  const after=await page.evaluate(()=>[...document.querySelectorAll('[data-belge-form-content="true"]')]
    .map(x=>({scale:x.getAttribute("data-scale"),mode:x.getAttribute("data-mode")})));
  const record={before,after,globalBroadcastTouchesBoth:after.filter(x=>x.scale==="1.25").length===2};
  writeFileSync("audit-artifacts-stage03-gaps/modal-instance.json",JSON.stringify(record,null,2));
  console.log("STAGE03_MODAL",JSON.stringify(record));
  expect(record.globalBroadcastTouchesBoth).toBe(false);
});

import {expect,test} from "@playwright/test";
import fs from "node:fs/promises";
import {smallSlab} from "../hsyncad-structural/report-fixtures";
test("unknown reviews -> reason validation -> save/download/reopen -> revision invalidation",async({page},info)=>{
 const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto("/kategori/araclar/hsyncad");await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready","true");
 await page.getByTestId("hsyncad-import").setInputFiles({name:"global.hsyncad",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(smallSlab()))});
 const open=async()=>{await page.getByRole("textbox",{name:"Komut ara",exact:true}).fill("Analiz Ayarları Raporu");await page.getByRole("button",{name:/^Analiz Ayarları Raporu/}).first().click();await expect(page.getByTestId("global-engineering-reviews")).toBeVisible();};
 await open();for(const id of ["A2","A3","B3"])await expect(page.getByTestId(`review-${id}-present`)).toHaveValue("unknown");
 await page.getByTestId("review-A2-present").selectOption("absent");await page.getByTestId("save-project-settings").click();await expect(page.getByTestId("review-A2-reason")).toBeFocused();
 await page.getByTestId("review-A2-reviewer").fill("Yerel test mühendisi");await page.getByTestId("review-A2-reason").fill("Örnek planın aktarım koşulları incelendi; bina onayı değildir.");
 await page.getByTestId("review-B3-present").selectOption("present");await page.getByTestId("review-B3-reviewer").fill("Yerel test mühendisi");await page.getByTestId("review-B3-reason").fill("Kiriş üstü kolon örneği, düşey hesap bekliyor.");await page.getByTestId("review-B3-transfer").selectOption("column_on_simple_beam");
 await page.getByTestId("save-project-settings").click();await expect(page.getByTestId("project-analysis-settings")).toHaveCount(0);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("hsyncad.model.v1")!));expect(saved.structural.revision).toBe(1);expect(saved.structural.engineeringReviews.A3.present).toBe(null);expect(saved.structural.coefficients.r.used).toBe(null);
 const download=page.waitForEvent("download",{timeout:8000});await page.getByRole("button",{name:"Çalışmayı kaydet · .hsyncad",exact:true}).click();const output=info.outputPath("P08-reviews.hsyncad");await(await download).saveAs(output);const bytes=await fs.readFile(output);expect(JSON.parse(bytes.toString())).toEqual(saved);
 await page.getByTestId("hsyncad-import").setInputFiles({name:"reopen.hsyncad",mimeType:"application/json",buffer:bytes});await open();await expect(page.getByTestId("review-A2-present")).toHaveValue("absent");await expect(page.getByTestId("review-B3-transfer")).toHaveValue("column_on_simple_beam");await expect(page.getByTestId("review-A3-present")).toHaveValue("unknown");
 await page.setViewportSize({width:390,height:844});await page.getByTestId("review-B3").scrollIntoViewIfNeeded();await page.screenshot({path:info.outputPath("P08-reviews-mobile.png")});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByTestId("review-A2-reason").fill("İkinci değerlendirme revizyonu");await page.getByTestId("save-project-settings").click();await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem("hsyncad.model.v1")!).structural.revision)).toBe(2);expect(errors).toEqual([]);
});

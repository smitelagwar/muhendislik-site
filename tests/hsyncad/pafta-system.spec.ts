import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";

test.describe("hsynCAD ideCAD-Style Paftalama System", () => {
  test("opens professional pafta viewer, switches sheets/formats, edits metadata and exports AutoCAD DXF", async ({ page }) => {
    // 1. Open hsynCAD workbench
    await page.goto("/kategori/araclar/hsyncad");
    await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");

    // 2. Load 7-storey commercial building plaza model (1536 m2 per floor)
    await page.getByTestId("bottom-load-seven-storey").click();
    await expect(page.getByTestId("hsyncad-message")).toContainText("7 Katlı Plaza");

    // 3. Switch to Pafta View via desktop workspace tools button
    const paftaTabBtn = page.getByTestId("desktop-pafta-toggle");
    await expect(paftaTabBtn).toBeVisible();
    await paftaTabBtn.click();

    // 4. Verify PaftaViewer is rendered
    const paftaViewer = page.getByTestId("hsyncad-pafta-viewer");
    await expect(paftaViewer).toBeVisible();

    // 5. Verify Sheet selector contains all 5 engineering sheets
    const sheetSelect = page.getByTestId("pafta-sheet-select");
    await expect(sheetSelect).toBeVisible();
    const options = await sheetSelect.locator("option").allTextContents();
    expect(options.length).toBe(5);
    expect(options[0]).toContain("S-100");
    expect(options[1]).toContain("S-01");
    expect(options[2]).toContain("S-02");
    expect(options[3]).toContain("S-03");
    expect(options[4]).toContain("S-04");

    // 6. Switch to Foundation Sheet (S-01: Radye Temel Aplikasyon & Donatı Planı)
    await sheetSelect.selectOption("1");
    await expect(sheetSelect).toHaveValue("1");
    await expect(paftaViewer.locator("svg text").filter({ hasText: "RADYE TEMEL" }).first()).toBeVisible();

    // 7. Change sheet format to Süheyla Kara standard roll (Roll-90x210)
    const formatSelect = page.getByTestId("pafta-format-select");
    await formatSelect.selectOption("Roll-90x210");

    // 8. Test Antet Metadata Editor
    await page.getByTestId("pafta-edit-antet").click();
    await expect(page.getByText("Antet ve Proje Bilgilerini Düzenle")).toBeVisible();
    await page.getByTestId("antet-project-name").fill("SÜHEYLA KARA TİCARET MERKEZİ");
    await page.getByTestId("antet-submit").click();

    // Verify edited title appears on sheet antet
    await expect(paftaViewer.locator("svg text").filter({ hasText: "SÜHEYLA KARA TİCARET MERKEZİ" }).first()).toBeVisible();

    // 9. Download DXF and verify file contents
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("pafta-download-dxf").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.dxf$/i);

    const tempFilePath = await download.path();
    if (tempFilePath) {
      const dxfContent = await fs.readFile(tempFilePath, "utf8");
      expect(dxfContent).toContain("SECTION\r\n2\r\nHEADER");
      expect(dxfContent).toContain("SECTION\r\n2\r\nTABLES");
      expect(dxfContent).toContain("LAYER\r\n2\r\nANTET");
      expect(dxfContent).toContain("LAYER\r\n2\r\nAKSLAR");
      expect(dxfContent).toContain("LAYER\r\n2\r\nKOLONLAR");
      expect(dxfContent).toContain("LAYER\r\n2\r\nPERDELER");
      expect(dxfContent).toContain("LAYER\r\n2\r\nSINIR_CIZGILERI");
      expect(dxfContent).toContain("T.C. İSTANBUL VALİLİĞİ");
      expect(dxfContent).toContain("SÜHEYLA KARA TİCARET MERKEZİ");
      expect(dxfContent).toContain("EOF");
    }

    // 10. Close Pafta view and return to 2D model view
    await page.getByTestId("pafta-close").click();
    await expect(page.getByTestId("hsyncad-plan")).toBeVisible();
  });
});

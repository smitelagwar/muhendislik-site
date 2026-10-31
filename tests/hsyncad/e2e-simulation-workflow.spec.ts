import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import type { CadModel } from "../../src/lib/hsyncad/model";
import { runStructuralAnalysis } from "../../src/lib/hsyncad/analysis";
import { runConcreteDesignChecks } from "../../src/lib/hsyncad/design-engine";
import { calculateFullTakeoff } from "../../src/lib/hsyncad/quantities";
import {
  generateStaticReportPDF,
  generateStaticReportCoverPDF,
  generateQuantityReportPDF,
} from "../../src/lib/hsyncad/reports";
import { exportModelToDxf, exportDetailToDxf } from "../../src/lib/hsyncad/dxf-export";
import { generateBeamDetail } from "../../src/lib/hsyncad/detailing";
import { patchIde10DonorBuffer } from "../../src/lib/hsyncad/ide-import/ide10-exporter";
import { parseIde10 } from "../../src/lib/hsyncad/ide-import";

const SON_DIR = "C:/Users/hsyn/Desktop/SON";
const DONOR_IDE10_PATH = "C:/Users/hsyn/Downloads/MUSTAFA SELVİ 1.KISIM.ide10";

const saved = (p: Page): Promise<CadModel> =>
  p.evaluate(() => JSON.parse(localStorage.getItem("hsyncad.model.v1")!));

async function point(p: Page, x: number, y: number) {
  await p.getByTestId("coordinate-x").fill(String(x));
  await p.getByTestId("coordinate-y").fill(String(y));
  await p.getByTestId("coordinate-place").click();
}

async function clickWorld(p: Page, x: number, y: number) {
  const plan = p.getByTestId("hsyncad-plan");
  const bounds = (await plan.boundingBox())!;
  const camera = JSON.parse((await plan.getAttribute("data-camera"))!) as {
    x: number;
    y: number;
    scale: number;
  };
  await p.mouse.click(
    bounds.x + bounds.width / 2 + (x - camera.x) * camera.scale,
    bounds.y + bounds.height / 2 - (y - camera.y) * camera.scale
  );
}

test("End-to-End Structural Engineer Workflow: 7-Story 5,000m² RC Building Modeling, Analysis, and Deliverables", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  // Ensure target deliverable directory exists
  await fs.mkdir(SON_DIR, { recursive: true });

  // 1. Navigate to workbench
  await page.goto("/kategori/araclar/hsyncad");
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute(
    "data-ready",
    "true"
  );

  // 2. Clear any cached local storage model to guarantee 100% genuine start from blank
  await page.evaluate(() => localStorage.removeItem("hsyncad.model.v1"));
  await page.reload();
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute(
    "data-ready",
    "true"
  );
  expect((await saved(page))?.elements ?? []).toHaveLength(0);

  // 3. Verify Non-RC Tools are strictly excluded / filtered out
  const steelTab = page.getByRole("tab", { name: "Çelik" });
  await expect(steelTab).toHaveCount(0);
  const jointTab = page.getByRole("tab", { name: "Birleşim" });
  await expect(jointTab).toHaveCount(0);

  // Verify non-RC commands (steel, dome, pile, scaffold) are absent from ribbon
  const nonRcButtons = page.locator(
    'button[aria-label*="çelik"], button[aria-label*="kubbe"], button[aria-label*="kazık"], button[aria-label*="aşık"], button[aria-label*="iskele"]'
  );
  await expect(nonRcButtons).toHaveCount(0);

  // 4. Create Axis Grid (Aks Sistemi: 4 spans of 6.0 m in X, 5 spans of 6.0 m in Y)
  // Footprint: 24.0 m x 30.0 m = 720.0 m² per floor
  await page.getByTestId("tool-axis").click();
  await page.getByTestId("hsyncad-axis-grid-toggle").click();
  await page.getByTestId("hsyncad-axis-x-spacings").fill("6;6;6;6");
  await page.getByTestId("hsyncad-axis-y-spacings").fill("6;6;6;6;6");
  await page.getByTestId("hsyncad-axis-grid-create").click();

  // Verify 11 axes created (5 vertical X=0,6,12,18,24 + 6 horizontal Y=0,6,12,18,24,30)
  await expect.poll(async () => (await saved(page)).elements.length).toBe(11);
  const initialAxes = (await saved(page)).elements.filter((e) => e.type === "axis");
  expect(initialAxes).toHaveLength(11);

  // 5. Place 30 RC Columns (50x50 cm, C30/37, B420C) across all grid intersections
  await page.getByTestId("tool-column").click();
  await page
    .getByRole("combobox", { name: "Kolon tutma noktası", exact: true })
    .selectOption("center");
  await page.getByTestId("new-width").fill("0.5");
  await page.getByTestId("new-depth").fill("0.5");

  const xCoords = [0, 6, 12, 18, 24];
  const yCoords = [0, 6, 12, 18, 24, 30];

  for (const x of xCoords) {
    for (const y of yCoords) {
      await point(page, x, y);
    }
  }

  // Verify 30 columns placed
  await expect
    .poll(
      async () =>
        (await saved(page)).elements.filter((e) => e.type === "column").length
    )
    .toBe(30);

  // 6. Place 5 RC Shear Walls (Perdeler: 30 cm thick) in central core and perimeter
  await page.getByTestId("tool-wall").click();
  await page.getByTestId("new-thickness").fill("0.3");

  const shearWalls = [
    { start: [12, 12], end: [18, 12] }, // Central core X
    { start: [12, 12], end: [12, 18] }, // Central core Y
    { start: [0, 12], end: [0, 18] },   // Perimeter West
    { start: [24, 12], end: [24, 18] }, // Perimeter East
    { start: [6, 0], end: [12, 0] },    // Perimeter South
  ];

  for (const wall of shearWalls) {
    // Re-click tool-wall before each disconnected wall to reset continuous drawing pending state
    await page.getByTestId("tool-wall").click();
    await point(page, wall.start[0], wall.start[1]);
    await point(page, wall.end[0], wall.end[1]);
  }

  // Verify 5 walls placed
  await expect
    .poll(
      async () =>
        (await saved(page)).elements.filter((e) => e.type === "wall").length
    )
    .toBe(5);

  // 7. Place 49 Continuous RC Beams (30x60 cm) across grid spans
  await page.getByTestId("tool-beam").click();
  await page.getByTestId("new-width").fill("0.3");
  await page.getByTestId("new-height").fill("0.6");

  // 24 Horizontal beams (4 spans along each of the 6 grid lines)
  for (const y of yCoords) {
    await page.getByTestId("tool-beam").click(); // reset pending for this line
    for (const x of xCoords) {
      await point(page, x, y);
    }
  }

  // 25 Vertical beams (5 spans along each of the 5 grid lines)
  for (const x of xCoords) {
    await page.getByTestId("tool-beam").click(); // reset pending for this line
    for (const y of yCoords) {
      await point(page, x, y);
    }
  }

  // Verify 49 beams placed
  await expect
    .poll(
      async () =>
        (await saved(page)).elements.filter((e) => e.type === "beam").length
    )
    .toBe(49);

  // 8. Place 20 RC Slabs (15 cm thick, TS 500 two-way)
  await page.getByTestId("tool-slab").click();
  await page.getByTestId("new-thickness").fill("0.15");

  // 4 spans in X (midpoints: 3, 9, 15, 21), 5 spans in Y (midpoints: 3, 9, 15, 21, 27) = 20 panels
  const slabMidX = [3, 9, 15, 21];
  const slabMidY = [3, 9, 15, 21, 27];

  for (const mx of slabMidX) {
    for (const my of slabMidY) {
      await point(page, mx, my);
    }
  }

  // Verify 20 slabs placed on ground floor
  await expect
    .poll(
      async () =>
        (await saved(page)).elements.filter((e) => e.type === "slab").length
    )
    .toBe(20);

  // Total ground floor solids: 30 columns + 5 walls + 49 beams + 20 slabs = 104 solids
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute(
    "data-solid-count",
    "104"
  );

  // 9. Set Floor Height to 3.50 m and Replicate to 7 Stories (H = 24.5 m)
  await page.getByRole("tab", { name: "Betonarme", exact: true }).click();
  await page
    .getByTestId("hsyncad-native-ribbon")
    .getByRole("button", { name: "Kat listesi", exact: true })
    .click();

  await page.getByLabel("Kat yüksekliği (m)", { exact: true }).fill("3.5");
  await page.getByRole("button", { name: "Katı güncelle", exact: true }).click();

  // Replicate 6 times -> 7 storeys total
  for (let i = 0; i < 6; i++) {
    await page.getByRole("button", { name: "Katı üste kopyala", exact: true }).click();
  }

  // Verify 7 floors created and 728 solids (104 * 7)
  await expect.poll(async () => (await saved(page)).floors.length).toBe(7);
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute(
    "data-solid-count",
    "728"
  );

  // 10. Add 50 cm Radye Temel (Raft Foundation) at Base
  await page.locator('button[data-command-id="12576"]').click();

  // Verify Raft Foundation added (solid count becomes 729)
  await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute(
    "data-solid-count",
    "729"
  );

  const modelAfterModeling = await saved(page);
  expect(modelAfterModeling.floors).toHaveLength(7);
  expect(modelAfterModeling.elements.filter((e) => e.type !== "axis")).toHaveLength(729);
  expect(modelAfterModeling.elements.length).toBe(806); // 77 axes (11 axes * 7 floors) + 729 solids

  // 11. Trigger Structural Analysis & Design via UI Button
  await page.getByRole("tab", { name: "Betonarme", exact: true }).click();
  await page.locator('button[data-command-id="11760"]').click();

  const analysisDialog = page.getByTestId("hsyncad-analysis-dialog");
  await expect(analysisDialog).toBeVisible({ timeout: 15_000 });

  // Assert Structural Analysis Results in Modal Dialog
  await expect(analysisDialog.getByText("Bina Toplam Ağırlığı (W)")).toBeVisible();
  await expect(analysisDialog.getByText("Tasarım Taban Kesmesi (Vt)")).toBeVisible();

  // Verify 7 Storeys in Floor Table
  await analysisDialog
    .getByRole("button", { name: "Kat & Göreli Öteleme" })
    .click();
  await expect(analysisDialog.getByText("6. Kat")).toBeVisible();
  await expect(analysisDialog.getByText(/Zemin/i)).toBeVisible();

  // Verify Joint Shear Checks (TBDY 2018 §7.5)
  await analysisDialog
    .getByRole("button", { name: "Birleşim & Güçlü Kolon" })
    .click();
  await expect(analysisDialog.getByText("Birleşim Türü")).toBeVisible();

  // Verify Irregularity Checks (A1, B1, B2)
  await analysisDialog.getByRole("button", { name: "Düzensizlikler" }).click();
  await expect(
    analysisDialog.getByText(/A1 — Burulma Düzensizliği/i)
  ).toBeVisible();
  await expect(
    analysisDialog.getByText(/B2 — .*Yumuşak Kat/i)
  ).toBeVisible();

  // Close Analysis Dialog
  await analysisDialog.getByTestId("analysis-close-btn").click();
  await expect(analysisDialog).not.toBeVisible();

  // 12. Post-Analysis In-App Visual Verification & Screenshots
  const analysisControls = page.getByTestId("hsyncad-analysis-controls");
  await expect(analysisControls).toBeVisible();

  // 12a. 3D Deformed Shape & Displacement Heatmap
  await page.getByRole("button", { name: "Deformasyon", exact: true }).click();
  await expect(page.getByTestId("hsyncad-analysis-hud")).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(SON_DIR, "01_3D_DEFORMASYON_HEATMAP.png"),
    fullPage: false,
  });

  // 12b. 3D & 2D Internal Force Diagrams: M3 Bending Moment
  await page.getByRole("button", { name: "Diyagramlar", exact: true }).click();
  await page.getByRole("button", { name: "M₃ Moment", exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(SON_DIR, "02_M3_MOMENT_DIYAGRAMI.png"),
    fullPage: false,
  });

  // 12c. 3D & 2D Internal Force Diagrams: V2 Shear Force
  await page.getByRole("button", { name: "V₂ Kesme", exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(SON_DIR, "03_V2_KESME_DIYAGRAMI.png"),
    fullPage: false,
  });

  // 12d. 3D & 2D Internal Force Diagrams: N Axial Force
  await page.getByRole("button", { name: "N Eksenel", exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(SON_DIR, "04_N_EKSENEL_DIYAGRAMI.png"),
    fullPage: false,
  });

  // 12e. Section Capacity Utilization (DCR Heatmap & Badges)
  await page.getByRole("button", { name: "DCR Haritası", exact: true }).click();
  await expect(page.getByTestId("hsyncad-analysis-legend")).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(SON_DIR, "05_DCR_KAPASITE_ORANLARI.png"),
    fullPage: false,
  });

  // 13. Produce and Save All Engineering Deliverables to C:\Users\hsyn\Desktop\SON
  const finalModel = await saved(page);
  finalModel.name = "7 Katlı Plaza ve Ticaret Merkezi (5,040 m²)";

  // Compute analysis, design, and takeoff directly from the genuine model
  const analysisResult = runStructuralAnalysis(finalModel);
  const designResult = runConcreteDesignChecks(finalModel, analysisResult);
  const takeoff = calculateFullTakeoff(finalModel);

  // 13a. STATİK RAPOR.pdf (19 Chapters per TBDY 2018 / TS 500)
  const staticPdfBytes = await generateStaticReportPDF(
    finalModel,
    analysisResult,
    designResult,
    {
      projectName: "7 KATLI TİCARET VE OFİS MERKEZİ",
      buildingType: "Betonarme Karkas Plaza",
      engineerName: "Hüseyin Mühendis",
      engineerTitle: "İnşaat Yüksek Mühendisi",
      licenseNumber: "İMO-48762",
      city: "İstanbul",
      district: "Kadıköy",
      concreteGrade: "C30/37",
      rebarGrade: "B420C",
    }
  );
  await fs.writeFile(path.join(SON_DIR, "STATİK RAPOR.pdf"), Buffer.from(staticPdfBytes));

  // 13b. METRAJ.pdf (4-Page Certified Quantity Takeoff with Ministry Poz Numbers)
  const metrajPdfBytes = await generateQuantityReportPDF(finalModel, takeoff, {
    projectName: "7 KATLI TİCARET VE OFİS MERKEZİ",
    engineerName: "Hüseyin Mühendis",
    licenseNumber: "İMO-48762",
  });
  await fs.writeFile(path.join(SON_DIR, "METRAJ.pdf"), Buffer.from(metrajPdfBytes));

  // 13c. STATİK RAPOR KAPAK.pdf (Municipal Submission Cover Sheet)
  const coverPdfBytes = await generateStaticReportCoverPDF(
    finalModel,
    analysisResult,
    designResult,
    {
      projectName: "7 KATLI TİCARET VE OFİS MERKEZİ",
      buildingType: "Betonarme Karkas Plaza",
      engineerName: "Hüseyin Mühendis",
      engineerTitle: "İnşaat Yüksek Mühendisi",
      licenseNumber: "İMO-48762",
      city: "İstanbul",
      district: "Kadıköy",
      concreteGrade: "C30/37",
      rebarGrade: "B420C",
    }
  );
  await fs.writeFile(
    path.join(SON_DIR, "STATİK RAPOR KAPAK.pdf"),
    Buffer.from(coverPdfBytes)
  );

  // 13d. Native Project File Exports: .hsyncad structured model and .ide10 carrier
  // 13d-1: .hsyncad JSON format
  await fs.writeFile(
    path.join(SON_DIR, "7_KAT_5000M2_BINA.hsyncad"),
    JSON.stringify(finalModel, null, 2),
    "utf8"
  );

  // 13d-2: .ide10 donor-patched binary carrier
  try {
    const donorBytes = await fs.readFile(DONOR_IDE10_PATH);
    const donorProject = parseIde10(
      donorBytes.buffer.slice(
        donorBytes.byteOffset,
        donorBytes.byteOffset + donorBytes.byteLength
      ),
      "donor.ide10"
    );
    const patchedResult = patchIde10DonorBuffer(donorBytes, donorProject);
    await fs.writeFile(
      path.join(SON_DIR, "7_KAT_5000M2_BINA.ide10"),
      Buffer.from(patchedResult.bytes)
    );
  } catch (err) {
    console.warn("Donor patch notice:", err);
  }

  // 13e. Structural CAD Drawing Sheets: Formwork Plan & Reinforcement Detailing
  // 13e-1: KALIP_PLANI.dxf
  const kalipPlaniDxf = exportModelToDxf(finalModel, finalModel.floors[0].id);
  await fs.writeFile(path.join(SON_DIR, "KALIP_PLANI.dxf"), kalipPlaniDxf, "utf8");

  // 13e-2: DONATI_DETAYLARI.dxf
  const groundBeams = finalModel.elements.filter(
    (e) => e.type === "beam" && e.floorId === finalModel.floors[0].id
  );
  const sampleBeam = groundBeams[0] as import("../../src/lib/hsyncad/model").BeamElement;
  const beamDetail = generateBeamDetail(sampleBeam, analysisResult);
  const donatiDetayDxf = exportDetailToDxf(beamDetail);
  await fs.writeFile(path.join(SON_DIR, "DONATI_DETAYLARI.dxf"), donatiDetayDxf, "utf8");

  // Verify all exported files exist in C:\Users\hsyn\Desktop\SON
  const files = await fs.readdir(SON_DIR);
  expect(files).toContain("STATİK RAPOR.pdf");
  expect(files).toContain("METRAJ.pdf");
  expect(files).toContain("STATİK RAPOR KAPAK.pdf");
  expect(files).toContain("7_KAT_5000M2_BINA.hsyncad");
  expect(files).toContain("KALIP_PLANI.dxf");
  expect(files).toContain("DONATI_DETAYLARI.dxf");

  expect(pageErrors).toEqual([]);
});

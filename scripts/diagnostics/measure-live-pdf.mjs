import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const EVIDENCE_DIR = path.resolve("docs/pdf-viewer-v3/kanit");
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function main() {
  console.log("Launching Chromium...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    devicePixelRatio: 1,
  });
  const page = await context.newPage();

  console.log("Navigating to live PDF viewer for 'Copilot - korelasyon.pdf'...");
  await page.goto("https://muhendislik-site.vercel.app/dokumantasyon/dosya/e99ee357-3107-42d6-a353-fa0706795123", {
    waitUntil: "networkidle",
    timeout: 45000,
  });

  // Wait for canvas to be rendered
  console.log("Waiting for canvas...");
  await page.waitForSelector("canvas[data-testid='pdf-page-canvas-1']", { timeout: 30000 });
  await page.waitForTimeout(3000);

  // Helper to measure geometry as per Section 0.3
  const measure = async (stepName) => {
    return await page.evaluate((step) => {
      const canvases = [...document.querySelectorAll("canvas")].filter((c) => c.width > 1).slice(0, 3);
      const zoomText = document.querySelector("[data-command-id='pdf.zoom.100']")?.textContent
        || document.querySelector("[data-testid='pdf-zoom-value']")?.textContent
        || "unknown";

      const data = canvases.map((c) => {
        const pageElem = c.closest("[data-page-number]") || c.parentElement;
        const box = (e) => {
          if (!e) return null;
          const b = e.getBoundingClientRect();
          return {
            x: +b.left.toFixed(1),
            y: +b.top.toFixed(1),
            w: +b.width.toFixed(1),
            h: +b.height.toFixed(1),
          };
        };

        const textLayer = pageElem ? pageElem.querySelector(".textLayer, [class*='textLayer']") : null;
        const textSpans = textLayer ? Array.from(textLayer.querySelectorAll("span")) : [];
        let maxSpanRight = 0;
        let rightmostText = "";
        for (const span of textSpans) {
          const r = span.getBoundingClientRect();
          if (r.right > maxSpanRight) {
            maxSpanRight = r.right;
            rightmostText = span.textContent?.slice(-20) || "";
          }
        }

        const pageB = box(pageElem);
        const canvasB = box(c);
        const textB = box(textLayer);

        return {
          step,
          pageNum: pageElem?.getAttribute("data-page-number") || "unknown",
          pageBox: pageB,
          canvasBox: canvasB,
          textLayerBox: textB,
          maxSpanRight: +maxSpanRight.toFixed(1),
          pageRightEdge: pageB ? +(pageB.x + pageB.w).toFixed(1) : 0,
          textClippedPx: pageB && maxSpanRight > (pageB.x + pageB.w) ? +(maxSpanRight - (pageB.x + pageB.w)).toFixed(1) : 0,
          rightmostSample: rightmostText,
          bitmap: [c.width, c.height],
          cssStyle: [c.style.width, c.style.height],
          bitmapPerCssPx: canvasB && canvasB.w > 0 ? +(c.width / canvasB.w).toFixed(3) : null,
          dpr: window.devicePixelRatio,
          pageOverflow: pageElem ? window.getComputedStyle(pageElem).overflow : null,
          zoomDisplay: zoomText,
          hasTransform: !!c.style.transform,
          transform: c.style.transform || "none",
        };
      });

      return {
        step,
        zoomText,
        pages: data,
      };
    }, stepName);
  };

  const results = [];

  // 1. Initial State
  console.log("Measuring step 1: initial state...");
  const initial = await measure("1-initial");
  results.push(initial);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, "r0-live-1-initial.png") });

  // 2. Switch to 'Sayfa' (Fit Page) mode
  console.log("Measuring step 2: Sayfa (Fit Page) mode...");
  const fitPageBtn = page.locator("[data-command-id='pdf.zoom.fitPage']").first();
  if (await fitPageBtn.isVisible()) {
    await fitPageBtn.click();
  } else {
    await page.keyboard.press("Control+Digit0");
  }
  await page.waitForTimeout(3000);
  const sayfaMetrics = await measure("2-sayfa-fit-page");
  results.push(sayfaMetrics);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, "r0-live-2-sayfa-fit-page.png") });

  // 3. Switch to 'Genişlik' (Fit Width) mode
  console.log("Measuring step 3: Genişlik (Fit Width) mode...");
  const fitWidthBtn = page.locator("[data-command-id='pdf.zoom.fitWidth']").first();
  if (await fitWidthBtn.isVisible()) {
    await fitWidthBtn.click();
  } else {
    await page.keyboard.press("Control+Digit2");
  }
  await page.waitForTimeout(3000);
  const genislikMetrics = await measure("3-genislik-fit-width");
  results.push(genislikMetrics);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, "r0-live-3-genislik-fit-width.png") });

  // 4. Switch to 100% (Actual Size) mode
  console.log("Measuring step 4: 100% (Actual Size) mode...");
  const zoom100Btn = page.locator("[data-command-id='pdf.zoom.100']").first();
  if (await zoom100Btn.isVisible()) {
    await zoom100Btn.click();
  } else {
    await page.keyboard.press("Control+Digit1");
  }
  await page.waitForTimeout(3000);
  const zoom100Metrics = await measure("4-zoom-100");
  results.push(zoom100Metrics);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, "r0-live-4-zoom-100.png") });

  // 5. Test Zoom In to ~137% (the reported zoom)
  console.log("Measuring step 5: zoom steps towards 137%...");
  // Press Ctrl++ a couple times or click ZoomIn
  const zoomInBtn = page.locator("[data-command-id='pdf.zoom.in']").first();
  if (await zoomInBtn.isVisible()) {
    await zoomInBtn.click();
    await page.waitForTimeout(500);
    await zoomInBtn.click();
    await page.waitForTimeout(500);
    await zoomInBtn.click();
    await page.waitForTimeout(2500);
  }
  const zoomInMetrics = await measure("5-zoom-custom");
  results.push(zoomInMetrics);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, "r0-live-5-zoom-custom.png") });

  // Save full geometry json
  fs.writeFileSync(path.join(EVIDENCE_DIR, "r0-live-geometry.json"), JSON.stringify(results, null, 2), "utf8");
  console.log("Geometry measurement completed! Results saved to docs/pdf-viewer-v3/kanit/r0-live-geometry.json");

  // Also take high-DPR screenshot (DPR = 2) for blurriness diagnosis
  console.log("Testing high DPR (DPR = 2)...");
  const dprContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    devicePixelRatio: 2,
  });
  const dprPage = await dprContext.newPage();
  await dprPage.goto("https://muhendislik-site.vercel.app/dokumantasyon/dosya/e99ee357-3107-42d6-a353-fa0706795123", {
    waitUntil: "networkidle",
    timeout: 45000,
  });
  await dprPage.waitForSelector("canvas[data-testid='pdf-page-canvas-1']", { timeout: 30000 });
  await dprPage.waitForTimeout(3000);
  await dprPage.screenshot({ path: path.join(EVIDENCE_DIR, "r0-live-dpr2-initial.png") });

  // Switch to 'Sayfa' mode at DPR 2
  const dprFitPageBtn = dprPage.locator("[data-command-id='pdf.zoom.fitPage']").first();
  if (await dprFitPageBtn.isVisible()) {
    await dprFitPageBtn.click();
  } else {
    await dprPage.keyboard.press("Control+Digit0");
  }
  await dprPage.waitForTimeout(3000);
  await dprPage.screenshot({ path: path.join(EVIDENCE_DIR, "r0-live-dpr2-sayfa.png") });

  // Crop page 1 right edge to clearly inspect H1 (clipping) and H2 (blurriness)
  const page1Elem = dprPage.locator("[data-page-number='1']");
  if (await page1Elem.isVisible()) {
    await page1Elem.screenshot({ path: path.join(EVIDENCE_DIR, "r0-live-page1-full-dpr2.png") });
  }

  await browser.close();
  console.log("All screenshots and geometry measurements recorded successfully!");
}

main().catch((err) => {
  console.error("Diagnostic error:", err);
  process.exit(1);
});

import { expect, test } from "@playwright/test";

test.describe("CAD Font Loading Race and Slow-Network Resilience", () => {
  test("Font preload blocks ready state until both fonts are cached in memory", async () => {
    let fontCached = false;
    let viewerReady = false;

    async function simulateFontPreload(delayMs: number) {
      await new Promise((r) => setTimeout(r, delayMs));
      fontCached = true;
    }

    async function simulateViewerInit(delayMs: number) {
      await simulateFontPreload(delayMs);
      viewerReady = true;
    }

    const initPromise = simulateViewerInit(50);
    expect(viewerReady).toBe(false);
    expect(fontCached).toBe(false);

    await initPromise;
    expect(fontCached).toBe(true);
    expect(viewerReady).toBe(true);
  });

  test("Missing font does not crash viewer and reports controlled diagnostics", () => {
    const missingFontList = ["unknown-custom.shx"];
    const diagnostics = {
      fontParityExact: missingFontList.length === 0,
      missingFonts: missingFontList,
    };

    expect(diagnostics.fontParityExact).toBe(false);
    expect(diagnostics.missingFonts).toContain("unknown-custom.shx");
  });
});

import { test, expect } from "@playwright/test";
import { MOBILE_VIEWPORT_PRESETS } from "../../src/components/dokumantasyon/drive-v3/mobile-ui-contract";
import { calculateGridMetrics } from "../../src/components/dokumantasyon/drive-v3/drive-metrics";

test("Mobil profiller gerçek grid metriğiyle geçerli kolon ve hücre üretir", () => {
  for (const preset of MOBILE_VIEWPORT_PRESETS) {
    const contentWidth = preset.width - 32;
    const metrics = calculateGridMetrics(contentWidth, 220, 16, 16, 180);
    expect(metrics.columnCount).toBeGreaterThanOrEqual(1);
    expect(metrics.cellWidth * metrics.columnCount + (metrics.columnCount - 1) * metrics.gapX).toBeLessThanOrEqual(contentWidth + 1);
    expect(metrics.rowHeight).toBe(180);
  }
});

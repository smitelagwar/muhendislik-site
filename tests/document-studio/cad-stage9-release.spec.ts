import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  cleanupUploadedCadFixtures,
  signInAdmin,
  uploadCadPreviewV2Fixture,
} from "./cad-test-helpers";

function upstreamRuntime(page: Page): Locator {
  return page.locator('[data-cad-runtime="orchestrator"][data-cad-engine="upstream"]').first();
}

function upstreamHost(page: Page): Locator {
  return upstreamRuntime(page).locator('[data-cad-upstream-host="true"]').first();
}

async function entityCount(page: Page): Promise<number> {
  return upstreamHost(page).evaluate((el: HTMLElement) => {
    const adapter = (el as unknown as {
      __cadAdapter?: {
        manager?: {
          curDocument?: {
            database?: {
              tables?: { blockTable?: { modelSpace?: { newIterator?: () => Iterable<unknown> } } };
            };
          };
        };
      };
    }).__cadAdapter;
    const modelSpace = adapter?.manager?.curDocument?.database?.tables?.blockTable?.modelSpace;
    let count = 0;
    if (modelSpace?.newIterator) for (const item of modelSpace.newIterator()) if (item) count += 1;
    return count;
  });
}

async function project(page: Page, points: Array<{ x: number; y: number }>) {
  return upstreamHost(page).evaluate((el: HTMLElement, input) => {
    const viewport = el.querySelector<HTMLElement>('[aria-label$="CAD görünümü"]');
    const adapter = (el as unknown as {
      __cadAdapter?: {
        projectWorldPoint?: (p: { x: number; y: number }) => { x: number; y: number } | null;
      };
    }).__cadAdapter ?? (viewport as unknown as {
      __cadAdapter?: {
        projectWorldPoint?: (p: { x: number; y: number }) => { x: number; y: number } | null;
      };
    } | null)?.__cadAdapter;
    return input.map((point) => adapter?.projectWorldPoint?.(point) ?? null);
  }, points);
}

async function clickWorldPoints(page: Page, points: Array<{ x: number; y: number }>) {
  const host = upstreamHost(page);
  const canvas = host.locator("canvas").first();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  const projected = await project(page, points);
  for (const point of projected) {
    expect(point).not.toBeNull();
    await page.mouse.click(box!.x + point!.x, box!.y + point!.y);
    await page.waitForTimeout(70);
  }
}

async function openFixture(page: Page, fixtureId: string) {
  const { fileId } = await uploadCadPreviewV2Fixture(page, fixtureId);
  await page.goto(`/dokumantasyon/dosya/${fileId}`);
  const runtime = upstreamRuntime(page);
  const host = upstreamHost(page);
  await expect(runtime).toBeVisible({ timeout: 35_000 });
  await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 35_000 });
  await expect(host.locator("canvas").first()).toBeVisible();
  return { fileId, host };
}

test.describe("CAD Stage 9 — final release blockers", () => {
  test.setTimeout(90_000);

  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("Kalem Golden Path: stil, source immutability, silgi, undo/redo ve reload persistence", async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), "Final pen Golden Path masaüstü ribbon ile doğrulanır");
    await signInAdmin(page);
    const { host } = await openFixture(page, "known-geometry-measurements");
    const sourceCount = await entityCount(page);

    await page.locator('[data-testid="cad-tool-stroke-style-trigger"]').click();
    await page.locator('[data-testid="cad-pencil-color-preset-ef4444"]').click();
    await page.locator('[data-testid="cad-pencil-width-5"]').click();
    await page.locator('[data-testid="cad-pencil-line-dashed"]').click();
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="cad-tool-stroke-style-trigger-content"]')).toBeHidden();

    await page.locator('[data-testid="cad-tool-stroke"]').click();
    const canvas = host.locator("canvas").first();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + 120, box!.y + 150);
    await page.mouse.down();
    await page.mouse.move(box!.x + 260, box!.y + 180, { steps: 10 });
    await page.mouse.up();

    const strokes = page.locator('[data-cad-review-overlay="true"] [data-review-type="stroke"]');
    await expect(strokes).toHaveCount(1);
    const firstPath = strokes.first().locator("path");
    await expect(firstPath).toHaveAttribute("stroke", "#ef4444");
    await expect(firstPath).toHaveAttribute("stroke-width", "5");
    await expect(firstPath).toHaveAttribute("stroke-dasharray", "8 5");

    await page.locator('[data-testid="cad-tool-stroke-style-trigger"]').click();
    await page.locator('[data-testid="cad-pencil-color-preset-3b82f6"]').click();
    await page.keyboard.press("Escape");
    await page.mouse.move(box!.x + 120, box!.y + 260);
    await page.mouse.down();
    await page.mouse.move(box!.x + 260, box!.y + 290, { steps: 10 });
    await page.mouse.up();
    await expect(strokes).toHaveCount(2);
    await expect(strokes.nth(0).locator("path")).toHaveAttribute("stroke", "#ef4444");
    await expect(strokes.nth(1).locator("path")).toHaveAttribute("stroke", "#3b82f6");
    expect(await entityCount(page)).toBe(sourceCount);

    await page.locator('[data-testid="cad-tool-eraser"]').click();
    await page.mouse.click(box!.x + 190, box!.y + 275);
    await expect(strokes).toHaveCount(1);
    await page.locator('[data-testid="cad-tool-undo"]').click();
    await expect(strokes).toHaveCount(2);
    await page.locator('[data-testid="cad-tool-redo"]').click();
    await expect(strokes).toHaveCount(1);

    await expect(page.locator('[data-testid="cad-save-status"]')).toContainText("Kaydedildi", { timeout: 12_000 });
    await page.reload();
    await expect(upstreamRuntime(page)).toBeVisible({ timeout: 35_000 });
    await expect(upstreamHost(page)).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 35_000 });
    await expect(page.locator('[data-cad-review-overlay="true"] [data-review-type="stroke"]')).toHaveCount(1);
    expect(await entityCount(page)).toBe(sourceCount);
  });

  test("Alan Golden Path: 5 m × 4 m = 20,00 m² ve cm² dönüşümü", async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), "Final numeric oracle masaüstünde doğrulanır");
    await signInAdmin(page);
    await openFixture(page, "stage9-area-20m2");

    await page.locator('[data-testid="cad-tool-area"]').click();
    await clickWorldPoints(page, [
      { x: 0, y: 0 },
      { x: 5000, y: 0 },
      { x: 5000, y: 4000 },
      { x: 0, y: 4000 },
    ]);
    await page.keyboard.press("Enter");
    const overlay = page.locator('[data-cad-area-complete="true"]').first();
    await expect(overlay).toBeVisible();
    await expect(overlay.locator("text")).toContainText("20,00 m²");

    await page.locator('[data-testid="cad-tool-measure-settings"]').click();
    await page.getByRole("radio", { name: "cm²" }).click();
    await page.keyboard.press("Escape");
    await expect(overlay.locator("text")).toContainText("200.000,00 cm²");
  });

  test("Kalibrasyon Golden Path: 50 cm referans → 2,00 m mesafe ve 6,00 m² alan", async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), "Final calibration oracle masaüstünde doğrulanır");
    await signInAdmin(page);
    const { fileId } = await openFixture(page, "stage9-unitless-calibration");

    await page.locator('[data-testid="cad-tool-measure-settings"]').click();
    await page.locator('[data-testid="cad-calibration-start"]').click();
    await expect(page.locator('[data-testid="cad-calibration-overlay"]')).toHaveAttribute("data-cad-calibration-phase", "first");
    await clickWorldPoints(page, [{ x: 0, y: 0 }, { x: 100, y: 0 }]);
    await expect(page.locator('[data-testid="cad-calibration-distance-form"]')).toBeVisible();
    await page.locator('[data-testid="cad-calibration-distance"]').fill("50");
    await page.locator('[data-testid="cad-calibration-unit"]').selectOption("cm");
    await page.locator('[data-testid="cad-calibration-apply"]').click();
    await expect(page.locator('[data-testid="cad-calibration-saved"]')).toBeVisible();

    const calibration = await page.evaluate(
      (id) => JSON.parse(localStorage.getItem(`cad-calibration:${id}`) ?? "null"),
      fileId
    );
    expect(calibration?.mmPerWorldUnit).toBe(5);

    await page.locator('[data-testid="cad-tool-distance"]').click();
    await clickWorldPoints(page, [{ x: 0, y: 0 }, { x: 400, y: 0 }]);
    const distance = page.locator('[data-cad-distance-complete="true"]').first();
    await expect(distance.locator("text")).toContainText("2,00 m");

    await page.locator('[data-testid="cad-tool-area"]').click();
    await clickWorldPoints(page, [
      { x: 0, y: 0 },
      { x: 400, y: 0 },
      { x: 400, y: 600 },
      { x: 0, y: 600 },
    ]);
    await page.keyboard.press("Enter");
    const area = page.locator('[data-cad-area-complete="true"]').last();
    await expect(area.locator("text")).toContainText("6,00 m²");
  });
});

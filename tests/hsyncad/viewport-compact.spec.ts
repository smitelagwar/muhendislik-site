import { expect, test } from "@playwright/test";

const route = "/kategori/araclar/hsyncad";
const sizes = [
  { width: 320, height: 568 },
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
];

for (const size of sizes) {
  test(`compact layout ${size.width}x${size.height}: no page scroll, single pane, inspector`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: size, isMobile: size.width < 500, hasTouch: true });
    try {
      const page = await context.newPage();
      await page.goto(route);
      await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
      const plan = page.getByTestId("hsyncad-plan");
      const view3d = page.getByTestId("hsyncad-3d-viewport");
      await expect(plan).toBeVisible();
      await expect(view3d).toBeHidden();
      await expect(page.getByTestId("hsyncad-view-2d")).toHaveAttribute("aria-pressed", "true");
      const dimensions = async () => page.evaluate(() => {
        const root = document.scrollingElement!;
        const c = document.querySelector('[data-testid="hsyncad-workbench"]')!.getBoundingClientRect();
        return { vw: window.innerWidth, vh: window.innerHeight, height: root.scrollHeight, width: root.scrollWidth, clientHeight: root.clientHeight, clientWidth: root.clientWidth, scrollY: window.scrollY, rootHeight: c.height, rootBottom: c.bottom };
      });
      const m = await dimensions();
      expect(m.height).toBeLessThanOrEqual(m.clientHeight + 1);
      expect(m.width).toBeLessThanOrEqual(m.clientWidth + 1);
      expect(m.rootBottom).toBeLessThanOrEqual(m.vh + 1);
      await page.getByTestId("hsyncad-view-3d").click();
      await expect(view3d).toBeVisible();
      await expect(page.getByTestId("hsyncad-3d-canvas")).toBeVisible();
      await expect(plan).toBeHidden();
      await page.getByTestId("hsyncad-view-2d").click();
      await expect(plan).toBeVisible();
      const panelToggle = page.getByTestId("hsyncad-inspector-toggle");
      await panelToggle.click();
      const modal = page.getByRole("dialog", { name: "Metraj ve özellikler" });
      await expect(modal).toBeVisible();
      await expect(page.getByTestId("hsyncad-inspector-close")).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.getByTestId("hsyncad-inspector-toggle")).toBeFocused();
      await expect(modal).toHaveCount(0);
      await page.getByTestId("hsyncad-coordinate-toggle").click();
      await expect(page.getByTestId("coordinate-x")).toBeVisible();
      await page.getByTestId("hsyncad-coordinate-toggle").click();
      await page.keyboard.press("PageDown");
      expect((await dimensions()).scrollY).toBeLessThanOrEqual(1);
    } finally {
      await context.close();
    }
  });
}

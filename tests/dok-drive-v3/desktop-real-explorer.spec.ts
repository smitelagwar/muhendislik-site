import { test, expect } from "@playwright/test";
import { mockExplorerData } from "./explorer-fixture";

for (const view of ["list", "grid"] as const) {
  test(`Masaüstü ${view}: click, Ctrl, Shift, sağ tık, child double-click ve dock`, async ({ page: p }, info) => {
    await mockExplorerData(p); await p.goto("/dokumantasyon");
    await expect(p.getByTestId("dok-file-row").first()).toBeVisible();
    if (view === "grid") await p.getByRole("button", { name: "Kart (Grid) Görünümü", exact: true }).click();
    const a = p.locator('[data-file-id="file-000"]'), b = p.locator('[data-file-id="file-001"]');
    const initial = p.url();
    await a.click({ position: { x: 8, y: 8 } });
    await expect(a).toHaveAttribute("data-selected", "true"); expect(p.url()).toBe(initial);
    await b.click({ position: { x: 8, y: 8 }, modifiers: ["Control"] });
    await expect(p.locator('[data-selected="true"]')).toHaveCount(2);
    await a.click({ position: { x: 8, y: 8 }, button: "right" });
    await expect(p.locator('[data-selected="true"]')).toHaveCount(2);
    await p.locator('[data-file-id="file-002"]').click({ position: { x: 8, y: 8 }, modifiers: ["Shift"] });
    await expect(p.locator('[data-selected="true"]')).toHaveCount(2);
    await expect(b).toHaveAttribute("data-selected", "true");
    await expect(p.locator('[data-file-id="file-002"]')).toHaveAttribute("data-selected", "true");
    await a.locator("[data-selection-control]").dblclick(); expect(p.url()).toBe(initial);
    const viewport = (await p.getByTestId("dok-explorer-viewport").boundingBox())!;
    const dock = (await p.getByTestId("dok-mobile-selection-dock").boundingBox())!;
    expect(viewport.y + viewport.height).toBeLessThanOrEqual(dock.y + 1);
    await p.screenshot({ path: info.outputPath(`desktop-${view}.png`) });
    await a.dblclick({ position: { x: 8, y: 8 } });
    await expect(p).toHaveURL(/dokumantasyon\/dosya\/file-000/);
  });
}
test("Masaüstü mouse marquee korunur; geniş touch/pen contextmenu seçmez", async ({ page: p }) => {
  await mockExplorerData(p); await p.goto("/dokumantasyon");
  const a = p.locator('[data-file-id="file-000"]'); await expect(a).toBeVisible();
  for (const pointerType of ["touch", "pen"]) {
    await a.dispatchEvent("pointerdown", { pointerType, pointerId: 21, button: 0 });
    await a.dispatchEvent("contextmenu", { pointerType, button: 2 });
    await a.dispatchEvent("pointerup", { pointerType, pointerId: 21, button: 0 });
    await expect(p.locator('[data-selected="true"]')).toHaveCount(0);
  }
  const r = (await p.getByTestId("dok-explorer-viewport").boundingBox())!;
  await p.mouse.move(r.x + 3, r.y + 45); await p.mouse.down();
  await p.mouse.move(r.x + r.width / 2, r.y + 180, { steps: 8 });
  await expect(p.getByTestId("dok-marquee-box")).toBeVisible();
  await p.mouse.up();
  expect(await p.locator('[data-selected="true"]').count()).toBeGreaterThan(0);
});

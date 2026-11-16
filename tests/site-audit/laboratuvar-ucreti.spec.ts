import { expect, test } from "@playwright/test";

test.describe("Tahmini Laboratuvar Ücreti", () => {
  test("hesaplamalar vitrininde görünür ve direkt sade sonuç üretir", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/hesaplamalar", { waitUntil: "domcontentloaded", timeout: 25_000 });
    const cardLink = page.locator('a[href="/hesaplamalar/laboratuvar-ucreti"]').last();
    await expect(cardLink).toBeVisible();
    await cardLink.click();

    await page.waitForURL("**/hesaplamalar/laboratuvar-ucreti", { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Tahmini Laboratuvar Ücreti" })).toBeVisible();

    const totalEl = page.getByTestId("lab-total-gross");
    await expect(totalEl).toBeVisible();
    const initialTotal = await totalEl.innerText();
    expect(initialTotal).toContain("TL");

    // Alan ve beton sınıfı değişikliğinde anlık güncelleme
    const areaInput = page.getByTestId("lab-area-input");
    await areaInput.fill("2500");
    await page.getByTestId("grade-btn-high").click();
    const updatedTotal = await totalEl.innerText();
    expect(updatedTotal).not.toBe(initialTotal);

    // Gelişmiş özelleştirme açılıp ek karot eklenince sonuç artar
    await page.getByTestId("toggle-advanced-btn").click();
    await page.getByTestId("lab-karot-count").fill("4");
    const withKarotTotal = await totalEl.innerText();
    expect(withKarotTotal).not.toBe(updatedTotal);

    // Yatay taşma olmamalı
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(hasOverflow).toBe(false);
    expect(errors).toEqual([]);
  });
});

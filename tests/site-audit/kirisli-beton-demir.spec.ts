import { expect, test } from "@playwright/test";

test.describe("Kirişli Döşeme Beton & Demir Tahmini", () => {
  test("hesaplamalar vitrininde görünür, iki modda da anlık sonuç ve laboratuvar ücreti üretir", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/hesaplamalar", { waitUntil: "domcontentloaded", timeout: 25_000 });
    const cardLink = page.locator('a[href="/hesaplamalar/kirisli-beton-demir"]').last();
    await expect(cardLink).toBeVisible();
    await cardLink.click();

    await page.waitForURL("**/hesaplamalar/kirisli-beton-demir", { timeout: 15_000 });
    await expect(
      page.getByRole("heading", { name: "Kirişli Döşeme Beton & Demir" })
    ).toBeVisible();

    const concreteEl = page.getByTestId("kirisli-total-concrete");
    const rebarEl = page.getByTestId("kirisli-total-rebar");
    const labEl = page.getByTestId("kirisli-lab-fee");

    await expect(concreteEl).toBeVisible();
    const initialConcrete = await concreteEl.innerText();
    const initialRebar = await rebarEl.innerText();
    const initialLab = await labEl.innerText();

    expect(initialConcrete).toContain("m³");
    expect(initialRebar).toContain("ton");
    expect(initialLab).toContain("TL");

    // Sistem ve temel değişiminde anlık güncelleme
    await page.getByTestId("system-btn-sadecePerde").click();
    await page.getByTestId("foundation-btn-mutemadi").click();
    await page.getByTestId("basement-btn-0").click();
    const updatedConcrete = await concreteEl.innerText();
    expect(updatedConcrete).not.toBe(initialConcrete);

    // Parsel (TAKS / KAKS) moduna geçiş
    await page.getByTestId("mode-btn-parsel").click();
    await expect(page.getByTestId("kirisli-parcel-summary")).toBeVisible();
    await page.getByTestId("kirisli-parcel-input").fill("800");
    await page.getByTestId("kirisli-taks-input").fill("0.25");
    await page.getByTestId("kirisli-kaks-input").fill("1.50");
    const parcelConcrete = await concreteEl.innerText();
    expect(parcelConcrete).not.toBe(updatedConcrete);

    // Yatay taşma olmamalı
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(hasOverflow).toBe(false);
    expect(errors).toEqual([]);
  });
});

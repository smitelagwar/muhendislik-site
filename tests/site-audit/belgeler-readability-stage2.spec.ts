import { test, expect, type Page } from "@playwright/test";

const documents = [
  "santiye-sefi-istifa-dilekcesi",
  "santiye-sefi-taahhutnamesi",
  "santiye-sefi-sozlesmesi",
  "insaat-ruhsati-dilekcesi",
  "beton-dokum-tutanagi",
] as const;
const STORAGE_KEY = "belge-studio:readability:v1";

async function visit(page: Page, doc = documents[0]) {
  await page.goto("/belgeler/" + doc, { waitUntil: "domcontentloaded", timeout: 45_000 });
  const root = page.locator('[data-belge-readability-root]').first();
  await expect(root).toBeVisible({timeout: 20_000});
  await expect(root.locator('[data-testid="belge-studio-actions"]')).toBeVisible();
  // Interactions before React hydration and the first PDF/form state settlement
  // may be lost or superseded by initial draft recovery.
  await expect(root.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.", { timeout: 45_000 });
  await expect(root.locator('[data-testid="belge-studio-actions"] button').first()).toBeEnabled();
  return root;
}

async function setScale(page: Page, uiScale: number, textScale = 100) {
  await page.evaluate(({uiScale, textScale}) => {
    localStorage.setItem("belge-studio:readability:v1", JSON.stringify({
      version: 1, uiScale, textScale, highContrast: false,
      comfortableReading: false, largeTargets: false
    }));
    window.dispatchEvent(new Event("belge-readability:change"));
  }, {uiScale, textScale});
  const root = page.locator('[data-belge-readability-root]').first();
  if (uiScale >= 150 || textScale >= 150) await expect(root).toHaveAttribute("data-belge-ui-large", "true");
  else await expect(root).not.toHaveAttribute("data-belge-ui-large");
}

async function checkPrimaryControls(page: Page) {
  const root = page.locator('[data-belge-readability-root]').first();
  const footer = root.getByTestId("belge-studio-actions");
  const mobile = footer.getByTestId("belge-studio-mobile-actions");
  const desktop = footer.getByTestId("belge-studio-desktop-actions");
  if (await mobile.isVisible()) {
    await expect(mobile.getByRole("button", { name: /PDF İndir/i })).toBeVisible();
    await expect(mobile.getByRole("button", { name: /Formu Düzenle|Canlı PDF Önizle/ })).toBeVisible();
    await expect(mobile.getByTestId("belge-mobile-more-btn")).toBeVisible();
  } else {
    await expect(desktop.getByTestId("belge-readability-trigger")).toBeVisible();
    await expect(desktop.getByTestId("belge-studio-form-view-trigger")).toBeVisible();
    await expect(desktop.getByRole("button", { name: "PDF İndir" })).toBeVisible();
    await expect(desktop.getByRole("button", { name: "Yazdır" })).toBeVisible();
  }
  const overflow = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>("[data-belge-readability-root]")!;
    return {
      page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      root: root.scrollWidth - root.clientWidth,
      height: root.clientHeight,
    };
  });
  expect(overflow.page, "page horizontal overflow: " + JSON.stringify(overflow)).toBeLessThanOrEqual(2);
  expect(overflow.root, "root horizontal overflow: " + JSON.stringify(overflow)).toBeLessThanOrEqual(2);
  expect(overflow.height).toBeGreaterThan(200);
}

test.describe("Belgeler — Arayüz ve Okunabilirlik: Stage 2", () => {
  test("all five document types preserve accessible controls from 90% to 200%", async ({page}) => {
    await page.setViewportSize({width: 1366, height: 768});
    for (const doc of documents) {
      await visit(page, doc);
      for (const scale of [90, 100, 125, 150, 175, 200]) {
        await setScale(page, scale);
        await checkPrimaryControls(page);
      }
    }
  });

  test("scale choices and other settings persist; Form View remains independent", async ({page}) => {
    await page.setViewportSize({width: 1366, height: 768});
    await visit(page);
    const trigger = page.getByTestId("belge-readability-trigger");
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(page.getByTestId("belge-readability-menu")).toBeVisible();
    await page.getByTestId("belge-ui-scale-125").click();
    await expect(page.getByTestId("belge-ui-scale-value")).toHaveText("%125");
    await page.getByTestId("belge-readability-more").locator("summary").click();
    await page.getByRole("checkbox").first().check();
    await page.keyboard.press("Escape");
    const form = page.locator('[data-belge-form-content="true"]').first();
    await expect(form).toHaveAttribute("data-scale", "1");
    await expect(page.getByTestId("belge-studio-zoom-level")).toBeVisible();
    const zoom = await page.getByTestId("belge-studio-zoom-level").innerText();
    await page.reload({waitUntil: "domcontentloaded"});
    await expect(page.locator('[data-belge-readability-root]').first()).toHaveAttribute("data-belge-high-contrast", "true");
    await expect(page.locator('[data-belge-readability-root]').first()).toHaveAttribute("data-belge-readability-active", "true");
    await expect(page.getByTestId("belge-studio-zoom-level")).toHaveText(zoom);
    await expect(page.locator('[data-belge-form-content="true"]').first()).toHaveAttribute("data-scale", "1");
  });

  test("mobile 320/390 and tablet preserve drawer, edit, PDF, and reset", async ({page}) => {
    for (const viewport of [{width:320,height:700},{width:390,height:844},{width:768,height:1024}]) {
      await page.setViewportSize(viewport);
      await visit(page, documents[0]);
      for (const scale of [100,150,175,200]) {
        await setScale(page, scale, scale >= 175 ? 150 : 100);
        await checkPrimaryControls(page);
        const mobile = page.getByTestId("belge-studio-mobile-actions");
        await expect(mobile).toBeVisible();
        const formBtn = mobile.getByRole("button", {name: /Formu Düzenle|Canlı PDF Önizle/});
        await formBtn.click();
        const more = mobile.getByTestId("belge-mobile-more-btn");
        await more.click();
        const drawer = page.getByTestId("belge-mobile-actions-drawer");
        await expect(drawer).toBeVisible();
        await expect(drawer.getByTestId("belge-mobile-readability-section")).toBeVisible();
        await drawer.getByTestId("belge-mobile-readability-section").locator("summary").click();
        await expect(drawer.getByTestId("belge-readability-options")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(drawer).toBeHidden();
      }
    }
  });

  test("long form text, zoom controls, and PDF focus do not lose form data", async ({page}) => {
    await page.setViewportSize({width:1366,height:768});
    await visit(page, documents[0]);
    const input = page.locator('[data-testid="belge-studio-form-scroll"] textarea').first();
    await expect(input).toBeVisible();
    const value = ("Ankara Çankaya'da mühendislik çalışma açıklaması ve uzun adres. ").repeat(18);
    await input.fill(value);
    await expect(input).toHaveValue(value);
    await page.waitForTimeout(500);
    await expect(input).toHaveValue(value);
    await setScale(page, 175, 150);
    await expect(input).toHaveValue(value);
    const footer = page.getByTestId("belge-studio-mobile-actions");
    await expect(footer).toBeVisible();
    const drawerButton = footer.getByTestId("belge-mobile-more-btn");
    await drawerButton.click();
    await expect(page.getByTestId("belge-mobile-actions-drawer")).toBeVisible();
    await page.keyboard.press("Escape");
    await setScale(page, 100);
    await expect(input).toHaveValue(value);
    const focusToggle = page.getByTestId("belge-pdf-focus-toggle");
    if(await focusToggle.isVisible()) {
      await focusToggle.click();
      await focusToggle.click();
    }
    await expect(input).toHaveValue(value);
  });
});

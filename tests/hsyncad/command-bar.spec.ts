import { expect, test } from "@playwright/test";

const route = "/kategori/araclar/hsyncad";
const commands = ["axis", "column", "beam", "wall", "slab"];

test("desktop view ribbon changes all eight cameras while preserving model geometry", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(route);
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Dosya işlemleri", exact: true }).click();
  await page.getByTestId("load-demo").click();
  const viewport = page.getByTestId("hsyncad-3d-viewport");
  const canvas = page.getByTestId("hsyncad-3d-canvas");
  await expect(canvas).toBeVisible();
  const signature = await viewport.getAttribute("data-model-signature");
  await page.getByRole("tab", { name: "Görüntü", exact: true }).click();
  const ribbon = page.getByTestId("hsyncad-native-ribbon");
  const images: Buffer[] = [];
  for (const [label, mode] of [["Perspektif", "perspective"], ["Üst", "top"], ["Alt", "bottom"], ["Sol", "left"], ["Sağ", "right"], ["Ön", "front"], ["Arka", "back"], ["Aksonometrik", "iso"]]) {
    await ribbon.getByRole("button", { name: label, exact: true }).click();
    await expect(viewport).toHaveAttribute("data-view", mode);
    await expect(ribbon.getByRole("button", { name: label, exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(viewport).toHaveAttribute("data-model-signature", signature!);
    await expect(page.getByTestId("hsyncad-3d")).toHaveAttribute("data-solid-count", "10");
    if (images.length < 2) images.push(await canvas.screenshot());
  }
  expect(images[0].equals(images[1])).toBe(false);
  await page.screenshot({ path: testInfo.outputPath("goruntu-ribbon-1920.png") });
  const selected = page.getByRole("tab", { name: "Görüntü", exact: true });
  await selected.focus(); await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Analiz ve Tasarım", exact: true })).toBeFocused();
  await expect(page.getByRole("tab", { name: "Analiz ve Tasarım", exact: true })).toHaveAttribute("aria-selected", "true");
});

test("desktop native ribbon preserves the scoped tabs, dense groups and real main/subcommand relationships", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(route);
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  const header = page.getByTestId("hsyncad-command-bar");
  const bounds = (await header.boundingBox())!;
  expect(bounds.y).toBe(0);
  expect(bounds.height).toBeLessThanOrEqual(140);
  expect(bounds.height).toBeGreaterThanOrEqual(110);
  const tabs = ["Betonarme", "Objeler", "Değiştir", "Araçlar", "Ayarlar", "Görüntü", "Analiz ve Tasarım", "Analiz ve Tasarım Görüntüleme", "Raporlar", "Çizimler"];
  expect(await header.getByRole("tab").allTextContents()).toEqual(tabs);
  const ribbon = page.getByTestId("hsyncad-native-ribbon");
  expect(await ribbon.locator("[data-ribbon-panel]").evaluateAll(nodes => nodes.map(node => node.getAttribute("data-ribbon-panel")))).toEqual([
    "Proje Ayarları", "Aks", "Duvar", "Betonarme", "Temel - Zemin", "İskele Ayarları", "Tasarım", "Raporlar", "Çizim Oluştur", "Analiz ve Tasarım Görüntüleme", "Analiz",
  ]);
  expect(await ribbon.locator("[data-size='small']").count()).toBeGreaterThan(20);
  expect(await ribbon.locator("button:disabled").count()).toBeGreaterThan(20);
  const panels = await ribbon.locator("[data-ribbon-panel]").evaluateAll(nodes => nodes.map(node => { const b = node.getBoundingClientRect(); return { left: b.left, right: b.right }; }));
  for (let i = 1; i < panels.length; i++) expect(panels[i].left - panels[i - 1].right).toBeLessThanOrEqual(2);
  for (const command of commands) {
    const button = page.getByTestId(`tool-${command}`);
    await expect(button).toBeVisible();
    const box = (await button.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(46);
    expect(box.y + box.height).toBeLessThanOrEqual(bounds.y + bounds.height);
  }
  await page.getByRole("button", { name: "Aks alt komutları", exact: true }).click();
  const axisMenu = page.getByRole("menu", { name: "Aks alt komutları", exact: true });
  expect(await axisMenu.locator("button > span").allTextContents()).toEqual(["Kontur Hesapla", "Kontur Çizgileri", "Aks Etiketini Taşı", "Aks Ayarları"]);
  await expect(axisMenu.getByRole("menuitem", { name: "Kontur Hesapla Uygulanmadı", exact: true })).toBeDisabled();
  await axisMenu.getByRole("menuitem", { name: "Aks Ayarları", exact: true }).click();
  await expect(page.getByTestId("hsyncad-axis-options-slot")).toBeVisible();
  for (const tab of tabs.slice(1)) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    await expect(page.getByRole("tab", { name: tab, exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(header.getByRole("tab", { selected: true })).toHaveCount(1);
    expect(await ribbon.locator("[data-ribbon-panel]").count()).toBeGreaterThan(0);
  }
  await page.getByRole("tab", { name: "Betonarme", exact: true }).click();
  await page.getByTestId("tool-column").click();
  await expect(page.getByRole("tab", { name: "Betonarme", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("new-width")).toBeVisible();
  for (const command of commands) await expect(page.getByTestId(`tool-${command}`)).toHaveCount(1);
  await expect(ribbon.locator('[data-command-id="12820"]')).toHaveAttribute("aria-pressed", "true");
  await ribbon.locator('[data-command-id="12840"]').click();
  await expect(ribbon.locator('[data-command-id="12840"]')).toHaveAttribute("aria-pressed", "true");
  await expect(ribbon.locator('[data-command-id="12820"]')).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Kolon alt komutları", exact: true }).click();
  await page.getByRole("menuitem", { name: "Kolon Ayarları", exact: true }).click();
  await expect(page.getByRole("dialog").getByLabel("Kesit biçimi", { exact: true })).toHaveValue("circle");
  await page.getByRole("button", { name: "Ayarları kapat", exact: true }).click();
  const context = (await page.getByTestId("hsyncad-context-bar").boundingBox())!;
  expect(context.y + context.height).toBeLessThanOrEqual(230);
  await expect(page.getByRole("button", { name: "JSON kaydet", exact: true })).toBeVisible();
  const plan = (await page.getByTestId("hsyncad-plan").boundingBox())!;
  const scene = (await page.getByTestId("hsyncad-3d-viewport").boundingBox())!;
  expect(plan.height).toBeGreaterThan(700); expect(scene.height).toBeGreaterThan(700);
  // The reference uses a slightly wider plan and a narrower perspective pane.
  expect(plan.width / (plan.width + scene.width)).toBeGreaterThanOrEqual(0.5);
  expect(plan.width / (plan.width + scene.width)).toBeLessThanOrEqual(0.56);
  await page.screenshot({ path: testInfo.outputPath("ribbon-desktop-1920.png") });
});

test("all primary commands fit a narrow phone and the compact file menu downloads the model", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(route);
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  for (const command of commands) {
    const button = page.getByTestId(`tool-${command}`);
    await button.scrollIntoViewIfNeeded();
    await expect(button).toBeInViewport();
    const box = (await button.boundingBox())!;
    expect(box.y).toBeLessThanOrEqual(55);
    expect(box.width).toBeGreaterThanOrEqual(40);
  }
  await page.getByLabel("Dosya işlemleri", { exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSON kaydet", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("hsyncad-model.json");
  await expect(page.getByRole("menu")).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("selecting from the element list reveals grouped properties and actual elevations", async ({ page }) => {
  await page.goto(route);
  await expect(page.getByTestId("hsyncad-workbench")).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "Ölçülü örnekle başla" }).click();
  await page.getByTestId("desktop-inspector-toggle").click();
  await page.locator(".hcad-element-list > summary").click();
  await page.getByTestId("element-S1").click();
  const inspector = page.locator(".hcad-inspector-content");
  await expect.poll(() => inspector.evaluate((el) => el.scrollTop)).toBeLessThanOrEqual(1);
  await expect(page.getByText("Kesit ve boyutlar", { exact: true })).toBeInViewport();
  expect(await page.locator(".hcad-property-section legend").allTextContents()).toEqual(expect.arrayContaining(["Kesit ve boyutlar", "Plan konumu", "Kotlar", "Kat ve malzeme"]));
  await expect(page.getByLabel("Alt ve üst kot")).toHaveText("Alt kot+0,000 mÜst kot+3,000 m");
});

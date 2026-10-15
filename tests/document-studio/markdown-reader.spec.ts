import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { signInAdmin } from "./cad-test-helpers";

const FIXTURE = readFileSync(
  resolve(process.cwd(), "tests/fixtures/markdown/engineering-reader-fixture.md"),
  "utf8"
);

async function uploadMarkdownFixture(page: Page, content = FIXTURE): Promise<string> {
  return page.evaluate(async ({ content }) => {
    const fileName = `markdown-reader-${crypto.randomUUID()}.md`;
    const formData = new FormData();
    formData.append(
      "file",
      new File([content], fileName, { type: "text/markdown" })
    );
    formData.append(
      "pathname",
      `dok_storage/markdown-reader-${crypto.randomUUID()}.md`
    );

    const response = await fetch("/api/dokumantasyon/upload/local", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();

    if (!response.ok || !payload.file?.id) {
      throw new Error(payload.error || "Markdown fixture upload failed");
    }

    return payload.file.id as string;
  }, { content });
}

async function openFixture(
  page: Page,
  content = FIXTURE,
  storedPreferences?: Record<string, unknown>
) {
  await signInAdmin(page);
  const fileId = await uploadMarkdownFixture(page, content);
  await page.evaluate((preferences) => {
    if (preferences) localStorage.setItem("dok-markdown-reader:v1", JSON.stringify(preferences));
    else localStorage.removeItem("dok-markdown-reader:v1");
  }, storedPreferences ?? null);
  await page.goto(`/dokumantasyon/dosya/${fileId}`);

  const reader = page.getByTestId("markdown-reader");
  await expect(reader).toBeVisible();
  return reader;
}

async function readAppearanceContrast(page: Page) {
  return page.evaluate(() => {
    const surfaceElement = document.querySelector<HTMLElement>('[data-testid="markdown-reader-surface"]');
    const readerElement = document.querySelector<HTMLElement>('[data-testid="markdown-reader"]');
    const paragraph = Array.from(readerElement?.querySelectorAll<HTMLElement>('[data-testid="markdown-paragraph"]') ?? [])
      .find((element) => element.textContent?.includes("Satır içi"));
    const link = readerElement?.querySelector("a[href='https://example.com']");
    const inlineCode = readerElement?.querySelector<HTMLElement>('[data-testid="markdown-inline-code"]');
    const codeBlock = readerElement?.querySelector<HTMLElement>('[data-testid="markdown-code-block"]');
    const codeText = codeBlock?.querySelector("code");
    if (!surfaceElement || !readerElement || !paragraph || !link || !inlineCode || !codeBlock || !codeText) {
      throw new Error("Appearance fixture elements are missing");
    }

    type Rgba = [number, number, number, number];
    const parseColor = (value: string): Rgba => {
      const oklab = value.match(/oklab\(\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/i);
      if (oklab) {
        const [lightness, a, b] = oklab.slice(1, 4).map(Number);
        const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
        const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
        const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
        const linear = [
          4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
          -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
          -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
        ];
        const channels = linear.map((channel) => {
          const clamped = Math.max(0, Math.min(1, channel));
          return (clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055) * 255;
        });
        return [...channels, Number(oklab[4] ?? 1)] as Rgba;
      }

      const values = value.match(/[\d.]+/g)?.map(Number) ?? [];
      const channels = value.includes("srgb") ? values.slice(0, 3).map((channel) => channel * 255) : values.slice(0, 3);
      return [...channels, values[3] ?? 1] as Rgba;
    };
    const luminance = (channels: number[]) => channels
      .map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      })
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const ratio = (first: string, second: string) => {
      const foreground = parseColor(first);
      const background = parseColor(second);
      const composite = foreground.slice(0, 3).map((channel, index) =>
        channel * foreground[3] + background[index] * (1 - foreground[3])
      );
      const values = [luminance(composite), luminance(background.slice(0, 3))].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    const canvas = getComputedStyle(readerElement.parentElement!).backgroundColor;
    const inlineStyle = getComputedStyle(inlineCode);
    const blockStyle = getComputedStyle(codeBlock);
    return {
      paragraph: ratio(getComputedStyle(paragraph).color, canvas),
      link: ratio(getComputedStyle(link).color, canvas),
      inlineCode: ratio(inlineStyle.color, inlineStyle.backgroundColor),
      fencedCode: ratio(getComputedStyle(codeText).color, blockStyle.backgroundColor),
    };
  });
}

async function waitForReaderBackground(page: Page, expected: string) {
  await expect.poll(() => page.getByTestId("markdown-reader-surface")
    .evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(expected);
  await expect.poll(() => page.getByTestId("markdown-reader")
    .evaluate((element) => getComputedStyle(element.parentElement!).backgroundColor)).toBe(expected);
}

test("markdown math, headings, fences, tables and long sections render safely", async ({ page }) => {
  const reader = await openFixture(page);

  await expect(reader.locator(".katex").first()).toBeVisible();
  await expect(reader.locator(".katex-display")).toHaveCount(5);

  const hasRawDisplayDelimiterOutsideCode = await reader.evaluate((root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const parent = node.parentElement;
      if (!parent?.closest("pre, code") && node.textContent?.includes("$$")) return true;
      node = walker.nextNode();
    }
    return false;
  });
  expect(hasRawDisplayDelimiterOutsideCode).toBe(false);

  await expect(reader.getByRole("heading", { name: /Kesme kuvveti/ })).toBeVisible();
  await expect(
    reader.getByRole("heading", { name: /Kesme kuvveti/ }).locator(".katex")
  ).toHaveCount(1);

  await expect(reader.getByText("Maliyet yaklaşık $120 olabilir.")).toBeVisible();

  const fakeHeadings = reader
    .locator("h1,h2,h3,h4,h5,h6")
    .filter({ hasText: /SAHTE KOD BAŞLIĞI|TILDE SAHTE BAŞLIK/ });
  await expect(fakeHeadings).toHaveCount(0);
  await expect(reader.locator("pre").filter({ hasText: "# SAHTE KOD BAŞLIĞI" })).toBeVisible();
  await expect(reader.locator("pre").filter({ hasText: "### TILDE SAHTE BAŞLIK" })).toBeVisible();

  await expect(reader.getByRole("table")).toBeVisible();
  await expect(reader.getByText("LONG_SECTION_END", { exact: true })).toBeVisible();

  const longHeading = reader.getByRole("heading", { name: "Uzun bölüm", exact: true });
  await longHeading.click();
  await expect(reader.getByText("LONG_SECTION_END", { exact: true })).toBeHidden();
  await longHeading.click();
  await expect(reader.getByText("LONG_SECTION_END", { exact: true })).toBeVisible();

  for (const viewport of [
    { width: 360, height: 800 },
    { width: 412, height: 915 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    const geometry = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(
      geometry.scrollWidth,
      `${viewport.width}px page-level horizontal overflow`
    ).toBeLessThanOrEqual(geometry.clientWidth);
  }
});

test("reader appearance colors stay readable and persist across reloads", async ({ page }) => {
  const appearanceFixture = [
    FIXTURE,
    "",
    "## Görünüm ayarları testi",
    "",
    "Satır içi `kesit kodu` ve [teknik bağlantı](https://example.com) görünür kalmalı.",
    "",
    "> Vurgulu alıntı okunaklı kalmalı.",
    "",
    "- Vurgulu liste işareti görünür kalmalı.",
  ].join("\n");
  await openFixture(page, appearanceFixture);
  const surface = page.getByTestId("markdown-reader-surface");
  const settingsTrigger = page.getByRole("button", { name: "Okuma görünümü ayarları" });
  const settings = page.getByTestId("markdown-reader-settings");

  await expect(surface).toHaveAttribute("data-md-background", "system");
  await expect(settingsTrigger).toBeVisible();
  await settingsTrigger.click();
  await expect(settings).toBeVisible();
  await expect(settings.getByRole("radio")).toHaveCount(5);
  await settings.getByRole("radio", { name: "Sistem" }).focus();
  await settings.getByRole("radio", { name: "Sistem" }).press("ArrowRight");
  await expect(settings.getByRole("radio", { name: "Siyah" })).toHaveAttribute("aria-checked", "true");
  await settings.getByRole("radio", { name: "Siyah" }).press("ArrowLeft");
  await expect(settings.getByRole("radio", { name: "Sistem" })).toHaveAttribute("aria-checked", "true");

  const backgrounds = [
    { id: "black", label: "Siyah", expected: "rgb(11, 13, 16)" },
    { id: "white", label: "Beyaz", expected: "rgb(255, 255, 255)" },
    { id: "sepia", label: "Sepya", expected: "rgb(244, 236, 216)" },
    { id: "autocad", label: "Teknik Lacivert", expected: "rgb(16, 26, 42)" },
  ];

  for (const background of backgrounds) {
    await settings.getByRole("radio", { name: background.label }).click();
    await expect(surface).toHaveAttribute("data-md-background", background.id);
    await waitForReaderBackground(page, background.expected);

    const contrast = await readAppearanceContrast(page);
    expect(contrast.paragraph, `${background.label}: body text contrast`).toBeGreaterThanOrEqual(4.5);
    expect(contrast.link, `${background.label}: link contrast`).toBeGreaterThanOrEqual(4.5);
    expect(contrast.inlineCode, `${background.label}: inline code contrast`).toBeGreaterThanOrEqual(4.5);
    expect(contrast.fencedCode, `${background.label}: fenced code contrast`).toBeGreaterThanOrEqual(4.5);
  }

  await settings.getByRole("radio", { name: "Sistem" }).click();
  await settings.getByRole("button", { name: "Vurgu rengi: Mavi" }).click();
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(localStorage.getItem("dok-markdown-reader:v1") || "{}").accent
  )).toBe("blue");

  const blueAccent = await surface.evaluate((element) => getComputedStyle(element).getPropertyValue("--md-accent"));
  await settings.getByTestId("markdown-custom-accent").fill("#00AA88");
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(localStorage.getItem("dok-markdown-reader:v1") || "{}").accent
  )).toBe("#00AA88");
  const customAccent = await surface.evaluate((element) => getComputedStyle(element).getPropertyValue("--md-accent"));
  expect(customAccent).not.toBe(blueAccent);

  for (const background of backgrounds) {
    await settings.getByRole("radio", { name: background.label }).click();
    await waitForReaderBackground(page, background.expected);
    const contrast = await readAppearanceContrast(page);
    expect(contrast.link, `${background.label}: custom link contrast`).toBeGreaterThanOrEqual(4.5);
    expect(contrast.inlineCode, `${background.label}: custom inline code contrast`).toBeGreaterThanOrEqual(4.5);
  }

  for (const accent of ["Turuncu", "Mavi", "Yeşil", "Mor", "Turkuaz", "Pembe"]) {
    await settings.getByRole("button", { name: `Vurgu rengi: ${accent}` }).click();
    for (const background of backgrounds) {
      await settings.getByRole("radio", { name: background.label }).click();
      await waitForReaderBackground(page, background.expected);
      const contrast = await readAppearanceContrast(page);
      expect(contrast.link, `${accent}/${background.label}: link contrast`).toBeGreaterThanOrEqual(4.5);
      expect(contrast.inlineCode, `${accent}/${background.label}: inline code contrast`).toBeGreaterThanOrEqual(4.5);
    }
  }

  await settings.getByTestId("markdown-custom-accent").fill("#00AA88");
  await settings.getByRole("radio", { name: "Sistem" }).click();
  await page.locator("html").evaluate((element) => element.classList.add("dark"));
  await waitForReaderBackground(page, "rgb(10, 10, 10)");
  const darkSystemContrast = await readAppearanceContrast(page);
  expect(darkSystemContrast.link, "dark system theme: custom link contrast").toBeGreaterThanOrEqual(4.5);
  expect(darkSystemContrast.inlineCode, "dark system theme: custom inline code contrast").toBeGreaterThanOrEqual(4.5);
  await page.locator("html").evaluate((element) => element.classList.remove("dark"));

  await settings.getByRole("radio", { name: "Teknik Lacivert" }).click();
  await page.getByRole("button", { name: "Ham Kaynak" }).click();
  await expect(surface).not.toHaveAttribute("data-md-background");
  await page.getByRole("button", { name: "Önizleme" }).click();
  await expect(surface).toHaveAttribute("data-md-background", "autocad");
  await settingsTrigger.click();
  await settings.getByRole("radio", { name: "Sistem" }).click();

  await page.reload();
  const reloadedSurface = page.getByTestId("markdown-reader-surface");
  await expect(reloadedSurface).toHaveAttribute("data-md-background", "system");
  await page.getByRole("button", { name: "Okuma görünümü ayarları" }).click();
  await expect(page.getByTestId("markdown-custom-accent")).toHaveValue("#00aa88");

  const geometry = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
});

test("older local preferences still load and receive appearance defaults", async ({ page }) => {
  const reader = await openFixture(page, FIXTURE, { fontScale: 1.1 });
  const surface = page.getByTestId("markdown-reader-surface");
  await expect(reader).toHaveAttribute("data-font-scale", "110");
  await expect(surface).toHaveAttribute("data-md-background", "system");

  const preferences = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("dok-markdown-reader:v1") || "{}")
  );
  expect(preferences).toMatchObject({ fontScale: 1.1, background: "system", accent: "amber" });
});

test("reader font controls scale only preview content and persist locally", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile reader contract");

  const reader = await openFixture(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await expect(reader).toHaveAttribute("data-font-scale", "100");

  const toolbarFontButton = page.getByRole("button", { name: "Okuma görünümü ayarları" });
  await expect(toolbarFontButton).toBeVisible();
  await toolbarFontButton.click();

  const settings = page.getByTestId("markdown-reader-settings");
  await expect(settings).toBeVisible();

  await settings.getByRole("button", { name: "Yazıyı büyüt" }).click();
  await expect(reader).toHaveAttribute("data-font-scale", "105");

  const persisted = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("dok-markdown-reader:v1") || "{}")
  );
  expect(persisted.fontScale).toBe(1.05);

  await page.reload();
  const reloadedReader = page.getByTestId("markdown-reader");
  await expect(reloadedReader).toBeVisible();
  await expect(reloadedReader).toHaveAttribute("data-font-scale", "105");

  await page.getByRole("button", { name: "Okuma görünümü ayarları" }).click();
  await page
    .getByTestId("markdown-reader-settings")
    .getByRole("button", { name: "Yazı boyutunu yüzde 100 yap" })
    .click();
  await expect(reloadedReader).toHaveAttribute("data-font-scale", "100");

  const copyButton = reloadedReader.getByRole("button", { name: "Kod bloğunu kopyala" }).first();
  await expect(copyButton).toBeVisible();

  const geometry = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
});

import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const FIXTURE = readFileSync(
  resolve(process.cwd(), "tests/fixtures/markdown/engineering-reader-fixture.md"),
  "utf8"
);

async function login(page: Page) {
  await page.goto("/dokumantasyon");
  await page.getByLabel("Kullanıcı Adı").fill("admin");
  await page.locator("input#password").fill("admin");

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/dokumantasyon/giris") &&
      response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  const response = await responsePromise;
  if (!response.ok()) throw new Error(`Admin login failed: ${response.status()}`);
  await expect(page.getByLabel("Kullanıcı Adı")).toBeHidden();
}

async function uploadMarkdownFixture(page: Page): Promise<string> {
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
  }, { content: FIXTURE });
}

async function openFixture(page: Page) {
  await login(page);
  const fileId = await uploadMarkdownFixture(page);
  await page.evaluate(() => localStorage.removeItem("dok-markdown-reader:v1"));
  await page.goto(`/dokumantasyon/dosya/${fileId}`);

  const reader = page.getByTestId("markdown-reader");
  await expect(reader).toBeVisible();
  return reader;
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
      if (!parent?.closest("pre, code") && node.textContent?.includes("$")) return true;
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
  await expect(reader.getByText("# SAHTE KOD BAŞLIĞI", { exact: true })).toBeVisible();
  await expect(reader.getByText("### TILDE SAHTE BAŞLIK", { exact: true })).toBeVisible();

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

test("reader font controls scale only preview content and persist locally", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobile reader contract");

  const reader = await openFixture(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await expect(reader).toHaveAttribute("data-font-scale", "100");

  const toolbarFontButton = page.getByRole("button", { name: "Yazı boyutu ayarları" });
  await expect(toolbarFontButton).toBeVisible();
  await toolbarFontButton.click();

  const settings = page.getByTestId("markdown-font-settings");
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

  await page.getByRole("button", { name: "Yazı boyutu ayarları" }).click();
  await page
    .getByTestId("markdown-font-settings")
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

import { expect, test } from "@playwright/test";

function createFixturePdfBase64(): string {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Length 39 >>\nstream\nBT /F1 18 Tf 45 100 Td (Studio QA) Tj ET\nendstream",
  ];
  let document = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(document, "utf8"));
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(document, "utf8");
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  document += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(document, "utf8").toString("base64");
}

function createPortraitFixturePdfBase64(): string {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 240 420] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Length 42 >>\nstream\nBT /F1 18 Tf 45 210 Td (Stage 6 QA) Tj ET\nendstream",
  ];
  let document = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(document, "utf8"));
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(document, "utf8");
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  document += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(document, "utf8").toString("base64");
}

test("same-tab studio inherits theme, fills the viewport, and preserves PDF pixels", async ({ page }) => {
  await page.goto("/dokumantasyon");
  await page.getByLabel("Kullanıcı Adı").fill("admin");
  await page.locator("input#password").fill("admin");
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(page.getByLabel("Kullanıcı Adı")).toBeHidden();

  const fileId = await page.evaluate(async (pdfBase64) => {
    const bytes = Uint8Array.from(atob(pdfBase64), (character) => character.charCodeAt(0));
    const formData = new FormData();
    formData.append("file", new File([bytes], "stage1-studio-fixture.pdf", { type: "application/pdf" }));
    formData.append("pathname", `stage1-${crypto.randomUUID()}.pdf`);
    const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok || !payload.file?.id) throw new Error(payload.error || "Fixture upload failed");
    return payload.file.id as string;
  }, createFixturePdfBase64());

  await page.reload();
  const fileLink = page.locator(`a[href="/dokumantasyon/dosya/${fileId}"]`).first();
  await expect(fileLink).toBeVisible();

  // Start light so the popup must inherit state from its opener.
  await page.getByTestId("theme-toggle").first().click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await fileLink.click();
  const studio = page;
  await expect(studio).toHaveURL(new RegExp(`/dokumantasyon/dosya/${fileId}$`));

  await expect(studio.locator('[data-testid="document-studio-shell"]')).toBeVisible();
  await expect(studio.locator('[data-testid="document-studio-topbar"]')).toBeVisible();
  await expect(studio.locator('[data-testid="pdf-viewer-toolbar"]').first()).toBeVisible();
  await expect(studio.locator("html")).not.toHaveClass(/dark/);
  await expect(studio.getByRole("navigation")).toHaveCount(0);
  await expect(studio.locator("footer")).toHaveCount(0);

  const shellBox = await studio.locator('[data-testid="document-studio-shell"]').boundingBox();
  const viewport = studio.viewportSize();
  expect(shellBox?.width).toBe(viewport?.width);
  expect(shellBox?.height).toBe(viewport?.height);

  const canvas = studio.locator("canvas").first();
  await expect(canvas).toBeVisible();
  await studio.waitForTimeout(750);
  const beforeThemeChange = await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  await studio.getByTestId("theme-toggle").click();
  await expect(studio.locator("html")).toHaveClass(/dark/);
  await studio.waitForTimeout(250);
  const afterThemeChange = await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  expect(afterThemeChange).toBe(beforeThemeChange);

  await studio.reload();
  await expect(studio.locator("html")).toHaveClass(/dark/);
  await expect(studio.locator('[data-testid="pdf-viewer-toolbar"]').first()).toBeVisible();
});

test("PDF overflow stays in its viewport and the compact toolbar does not wrap", async ({ page }) => {
  await page.goto("/dokumantasyon");
  await page.locator("input#username").fill("admin");
  await page.locator("input#password").fill("admin");
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  await expect(page.locator("input#username")).toBeHidden();

  const fileId = await page.evaluate(async (pdfBase64) => {
    const bytes = Uint8Array.from(atob(pdfBase64), (character) => character.charCodeAt(0));
    const formData = new FormData();
    formData.append("file", new File([bytes], "stage2-layout-fixture.pdf", { type: "application/pdf" }));
    formData.append("pathname", `stage2-${crypto.randomUUID()}.pdf`);
    const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok || !payload.file?.id) throw new Error(payload.error || "Fixture upload failed");
    return payload.file.id as string;
  }, createFixturePdfBase64());

  await page.reload();
  await page.locator(`a[href="/dokumantasyon/dosya/${fileId}"]`).first().click();
  const studio = page;
  await studio.setViewportSize({ width: 390, height: 844 });
  await expect(studio.locator("canvas").first()).toBeVisible();

  const toolbar = studio.locator('[data-testid="pdf-viewer-toolbar"]');
  await expect(toolbar).toBeVisible();
  expect(await toolbar.evaluate((element) => element.clientHeight)).toBeLessThanOrEqual(44);
  for (const commandId of ["pdf.page.previous", "pdf.page.next", "pdf.search.open", "pdf.zoom.out", "pdf.zoom.in"]) {
    await expect(studio.locator(`[data-command-id="${commandId}"]`)).toBeVisible();
  }
  await studio.getByRole("button", { name: "PDF ek işlemleri" }).click();
  await expect(studio.getByText("Genişliğe sığdır")).toBeVisible();
  await expect(studio.getByText("Sayfaya sığdır")).toBeVisible();
  await studio.keyboard.press("Escape");

  await studio.locator('[data-command-id="pdf.zoom.100"]').click();
  for (let i = 0; i < 20; i += 1) {
    await studio.locator('[data-command-id="pdf.zoom.in"]').click();
  }
  await expect(studio.locator('[data-command-id="pdf.zoom.100"]')).toHaveText("500%");

  const viewports = [
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ];

  for (const viewportSize of viewports) {
    await studio.setViewportSize(viewportSize);
    await studio.waitForTimeout(100);
    const geometry = await studio.evaluate(() => {
      const shell = document.querySelector<HTMLElement>('[data-testid="document-studio-shell"]');
      const viewport = document.querySelector<HTMLElement>('[data-testid="pdf-scroll-viewport"]');
      return {
        htmlScrollHeight: document.documentElement.scrollHeight,
        bodyScrollHeight: document.body.scrollHeight,
        viewportHeight: window.innerHeight,
        shellScrollWidth: shell?.scrollWidth,
        shellClientWidth: shell?.clientWidth,
        pdfScrollWidth: viewport?.scrollWidth,
        pdfClientWidth: viewport?.clientWidth,
        pdfScrollHeight: viewport?.scrollHeight,
        pdfClientHeight: viewport?.clientHeight,
      };
    });

    expect(geometry.htmlScrollHeight).toBe(geometry.viewportHeight);
    expect(geometry.bodyScrollHeight).toBe(geometry.viewportHeight);
    expect(geometry.shellScrollWidth).toBe(geometry.shellClientWidth);

    if (viewportSize.width === 390) {
      expect(geometry.pdfScrollWidth).toBeGreaterThan(geometry.pdfClientWidth ?? 0);
      expect(geometry.pdfScrollHeight).toBeGreaterThan(geometry.pdfClientHeight ?? 0);
    }
  }
});

test("Ctrl-wheel zoom is viewport-scoped, cursor-anchored, and preserves zoom modes", async ({ page }) => {
  await page.goto("/dokumantasyon");
  await page.locator("input#username").fill("admin");
  await page.locator("input#password").fill("admin");
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator("input#username")).toBeHidden();

  const fileId = await page.evaluate(async (pdfBase64) => {
    const bytes = Uint8Array.from(atob(pdfBase64), (character) => character.charCodeAt(0));
    const formData = new FormData();
    formData.append("file", new File([bytes], "stage3-zoom-fixture.pdf", { type: "application/pdf" }));
    formData.append("pathname", `stage3-${crypto.randomUUID()}.pdf`);
    const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok || !payload.file?.id) throw new Error(payload.error || "Fixture upload failed");
    return payload.file.id as string;
  }, createFixturePdfBase64());

  await page.reload();
  await page.locator(`a[href="/dokumantasyon/dosya/${fileId}"]`).first().click();
  const studio = page;
  await studio.setViewportSize({ width: 390, height: 844 });
  await expect(studio.locator("canvas").first()).toBeVisible();

  const zoomIn = studio.locator('[data-command-id="pdf.zoom.in"]');
  await studio.locator('[data-command-id="pdf.zoom.100"]').click();
  for (let i = 0; i < 10; i += 1) await zoomIn.click();
  await expect(studio.locator('[data-command-id="pdf.zoom.100"]')).toHaveText("300%");
  await expect(studio.locator('[data-zoom-mode="custom"]')).toHaveCount(1);

  const wheelResult = await studio.evaluate(() => {
    const viewport = document.querySelector<HTMLElement>('[data-testid="pdf-scroll-viewport"]');
    if (!viewport) throw new Error("PDF viewport missing");
    viewport.scrollLeft = 260;
    viewport.scrollTop = 280;
    const rect = viewport.getBoundingClientRect();
    const viewportX = Math.max(20, rect.width * 0.7);
    const viewportY = Math.max(20, rect.height * 0.7);
    const before = {
      x: (viewport.scrollLeft + viewportX) / 3,
      y: (viewport.scrollTop + viewportY) / 3,
    };
    const zoomEvent = new WheelEvent("wheel", {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + viewportX,
      clientY: rect.top + viewportY,
      ctrlKey: true,
      deltaY: -100,
    });
    viewport.dispatchEvent(zoomEvent);
    const normalEvent = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 100 });
    viewport.dispatchEvent(normalEvent);
    const outsideEvent = new WheelEvent("wheel", { bubbles: true, cancelable: true, ctrlKey: true, deltaY: -100 });
    document.body.dispatchEvent(outsideEvent);
    return { before, zoomPrevented: zoomEvent.defaultPrevented, normalPrevented: normalEvent.defaultPrevented, outsidePrevented: outsideEvent.defaultPrevented, viewportX, viewportY };
  });

  expect(wheelResult.zoomPrevented).toBe(true);
  expect(wheelResult.normalPrevented).toBe(false);
  expect(wheelResult.outsidePrevented).toBe(false);
  await expect(studio.locator('[data-command-id="pdf.zoom.100"]')).toHaveText("320%");
  await studio.waitForTimeout(150);

  const anchorDrift = await studio.evaluate(({ before, viewportX, viewportY }) => {
    const viewport = document.querySelector<HTMLElement>('[data-testid="pdf-scroll-viewport"]');
    if (!viewport) throw new Error("PDF viewport missing");
    return Math.max(
      Math.abs((viewport.scrollLeft + viewportX) / 3.2 - before.x),
      Math.abs((viewport.scrollTop + viewportY) / 3.2 - before.y),
    );
  }, wheelResult);
  expect(anchorDrift).toBeLessThan(20);

  const renderMetrics = await studio.locator("canvas").first().evaluate((canvas) => {
    const element = canvas as HTMLCanvasElement;
    return { backingPixels: element.width * element.height, textSelection: getComputedStyle(element.parentElement?.querySelector("span") || element).userSelect };
  });
  expect(renderMetrics.backingPixels).toBeLessThanOrEqual(16_000_000);
  expect(renderMetrics.textSelection).toBe("text");

  await studio.locator('[data-testid="pdf-viewer-toolbar"] button').last().click();
  await studio.getByRole("menuitem").nth(5).evaluate((element) => (element as HTMLElement).click());
  await expect(studio.locator('[data-zoom-mode="fit-width"]')).toHaveCount(1);
  const fitWidthBeforeResize = await studio.locator('[data-command-id="pdf.zoom.100"]').textContent();
  await studio.setViewportSize({ width: 768, height: 1024 });
  await expect(studio.locator('[data-command-id="pdf.zoom.100"]')).not.toHaveText(fitWidthBeforeResize ?? "");

  await zoomIn.click();
  await expect(studio.locator('[data-zoom-mode="custom"]')).toHaveCount(1);
  const customScale = await studio.locator('[data-command-id="pdf.zoom.100"]').textContent();
  await studio.setViewportSize({ width: 430, height: 932 });
  await expect(studio.locator('[data-command-id="pdf.zoom.100"]')).toHaveText(customScale ?? "");
});

test("Stage 6 controls preserve PDF-local scroll, rotation, pan, and fullscreen", async ({ page }) => {
  await page.goto("/dokumantasyon");
  await page.locator("input#username").fill("admin");
  await page.locator("input#password").fill("admin");
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator("input#username")).toBeHidden();

  const fileId = await page.evaluate(async (pdfBase64) => {
    const bytes = Uint8Array.from(atob(pdfBase64), (character) => character.charCodeAt(0));
    const formData = new FormData();
    formData.append("file", new File([bytes], "stage6-controls-fixture.pdf", { type: "application/pdf" }));
    formData.append("pathname", `stage6-${crypto.randomUUID()}.pdf`);
    const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok || !payload.file?.id) throw new Error(payload.error || "Fixture upload failed");
    return payload.file.id as string;
  }, createPortraitFixturePdfBase64());

  await page.reload();
  await page.locator(`a[href="/dokumantasyon/dosya/${fileId}"]`).first().click();
  const studio = page;
  await studio.setViewportSize({ width: 1024, height: 768 });
  await expect(studio.locator("canvas").first()).toBeVisible();

  const viewport = studio.locator('[data-testid="pdf-scroll-viewport"]');
  const zoomIn = studio.locator('[data-command-id="pdf.zoom.in"]');
  await studio.locator('[data-command-id="pdf.zoom.100"]').click();
  for (let i = 0; i < 10; i += 1) await zoomIn.click();
  await expect(studio.locator('[data-command-id="pdf.zoom.100"]')).toHaveText("300%");

  const viewportBox = await viewport.boundingBox();
  if (!viewportBox) throw new Error("PDF viewport box missing");
  await studio.mouse.move(viewportBox.x + viewportBox.width / 2, viewportBox.y + viewportBox.height / 2);
  await studio.mouse.wheel(0, 600);
  await expect.poll(() => viewport.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await studio.evaluate(() => document.scrollingElement?.scrollTop ?? 0)).toBe(0);

  await studio.locator('[data-command-id="pdf.sidebar.toggle"]').click();
  await expect(studio.locator("aside")).toBeVisible();
  await studio.locator('[data-testid="pdf-viewer-toolbar"] button').last().click();
  await studio.locator('[role="menuitem"]:visible').nth(0).click();
  await expect(studio.locator('[data-zoom-mode="fit-width"]')).toHaveCount(1);

  const pageRect = studio.locator('[data-page-number="1"]');
  for (const shouldBeLandscape of [true, false, true, false]) {
    await studio.keyboard.press("Control+r");
    await expect.poll(async () => {
      const box = await pageRect.boundingBox();
      return box ? box.width > box.height : false;
    }).toBe(shouldBeLandscape);
  }

  await studio.locator('[data-command-id="pdf.zoom.100"]').click();
  for (let i = 0; i < 20; i += 1) await zoomIn.click();
  await studio.locator('[data-command-id="pdf.tool.hand"]').click();
  await viewport.evaluate((element) => {
    element.scrollLeft = 180;
    element.scrollTop = 180;
  });
  const panBox = await viewport.boundingBox();
  if (!panBox) throw new Error("PDF viewport box missing for pan");
  await studio.mouse.move(panBox.x + panBox.width / 2, panBox.y + panBox.height / 2);
  await studio.mouse.down();
  await studio.mouse.move(panBox.x + panBox.width / 2 - 80, panBox.y + panBox.height / 2 - 80);
  await studio.mouse.up();
  await expect.poll(() => viewport.evaluate((element) => ({ left: element.scrollLeft, top: element.scrollTop }))).toEqual(
    expect.objectContaining({ left: expect.any(Number), top: expect.any(Number) })
  );
  const panPosition = await viewport.evaluate((element) => ({ left: element.scrollLeft, top: element.scrollTop }));
  expect(panPosition.left).toBeGreaterThan(180);
  expect(panPosition.top).toBeGreaterThan(180);

  const fullscreenButton = studio.locator('[data-command-id="studio.fullscreen"]');
  await expect(fullscreenButton).toBeVisible();
  await fullscreenButton.click();
  await expect.poll(() => studio.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await studio.keyboard.press("Escape");
  // Headless Chromium does not always route Escape through the browser-level
  // fullscreen handler, so keep an in-app exit path under test as well.
  if (await studio.evaluate(() => Boolean(document.fullscreenElement))) {
    await fullscreenButton.click();
  }
  await expect.poll(() => studio.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
});

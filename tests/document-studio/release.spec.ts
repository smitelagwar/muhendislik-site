import { expect, test, type Page, type TestInfo } from "@playwright/test";

const releaseViewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
];

const snapshotOptions = { animations: "disabled" as const, caret: "hide" as const, maxDiffPixelRatio: 0.01 };

async function login(page: Page) {
  await page.goto("/dokumantasyon");
  await page.getByLabel("Kullanıcı Adı").fill("admin");
  await page.locator("input#password").fill("admin");
  const response = await submitLogin(page);
  if (!response.ok()) throw new Error(`Admin login failed: ${response.status()} ${await response.text()}`);
  await expect(page.getByLabel("Kullanıcı Adı")).toBeHidden();
}

async function submitLogin(page: Page) {
  const responsePromise = page.waitForResponse((response) => response.url().includes("/api/dokumantasyon/giris") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Giriş Yap" }).click();
  return responsePromise;
}

function waitForDokGet(page: Page, pathname: string) {
  return page.waitForResponse((response) => response.url().includes(pathname) && response.request().method() === "GET");
}

async function expectNoPageOverflow(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  const geometry = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(geometry.scrollWidth, `${viewport.width}x${viewport.height} page-level horizontal overflow`).toBeLessThanOrEqual(geometry.clientWidth);
}

function observeRuntime(page: Page) {
  const violations: string[] = [];
  page.on("pageerror", (error) => violations.push(`uncaught: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") violations.push(`console: ${message.text()}`);
  });
  page.on("requestfailed", (request) => violations.push(`network: ${request.method()} ${request.url()} ${request.failure()?.errorText || "failed"}`));
  return () => expect(violations, `runtime violations: ${violations.join(" | ")}`).toEqual([]);
}

function snapshotItems() {
  const now = "2026-08-22T12:00:00.000Z";
  return {
    folder: null,
    breadcrumbs: [],
    folders: [{ id: "11111111-1111-4111-8111-111111111111", name: "Mimari", parent_id: null, created_at: now, updated_at: now, deleted_at: null, starred_at: null }],
    files: [
      { id: "22222222-2222-4222-8222-222222222222", folder_id: null, display_name: "Statik Plan.pdf", size_bytes: 2457600, mime_type: "application/pdf", extension: ".pdf", created_at: now, updated_at: now, starred_at: null, last_opened_at: null, preview_kind: "pdf" },
      { id: "33333333-3333-4333-8333-333333333333", folder_id: null, display_name: "Vaziyet Görünümü.png", size_bytes: 1024000, mime_type: "image/png", extension: ".png", created_at: now, updated_at: now, starred_at: "2026-08-22T11:00:00.000Z", last_opened_at: now, preview_kind: "image" },
    ],
    summary: { starredCount: 1 },
    filters: { collection: "none", type: "all", date: "all", size: "all", scope: "current" },
  };
}

async function mockItems(page: Page, items = snapshotItems()) {
  await page.route("**/api/dokumantasyon/items**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(items) });
  });
}

function createFixturePdfBase64(): string {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Length 39 >>\nstream\nBT /F1 18 Tf 45 100 Td (Release QA) Tj ET\nendstream",
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

async function uploadFixture(page: Page, name: string, type: string, content: string | Uint8Array) {
  return page.evaluate(async ({ name, type, content }) => {
    const bytes = typeof content === "string" ? Uint8Array.from(atob(content), (character) => character.charCodeAt(0)) : Uint8Array.from(content);
    const formData = new FormData();
    formData.append("file", new File([bytes], name, { type }));
    formData.append("pathname", `dok_storage/release-${crypto.randomUUID()}-${name}`);
    const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok || !payload.file?.id) throw new Error(payload.error || "Release fixture upload failed");
    return payload.file.id as string;
  }, { name, type, content: typeof content === "string" ? content : Array.from(content) });
}

test("release matrix: auth, runtime, network and seven viewport overflow gate", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const unauthenticated = await page.request.get("/api/dokumantasyon/items");
  expect(unauthenticated.status()).toBe(401);

  await page.goto("/dokumantasyon");
  const username = page.getByLabel("Kullanıcı Adı");
  if (testInfo.project.name.includes("webkit")) await username.pressSequentially("admin");
  else await username.fill("admin");
  await expect(username).toHaveValue("admin");
  if (testInfo.project.name === "chromium") {
    await page.locator("input#password").fill("wrong-password");
    expect((await submitLogin(page)).status()).toBe(401);
    await expect(page.getByRole("alert").filter({ hasText: "Kullanıcı adı veya şifre hatalı" })).toBeVisible();
  }

  await page.locator("input#password").fill("admin");
  const initialItems = waitForDokGet(page, "/api/dokumantasyon/items");
  const initialReadiness = waitForDokGet(page, "/api/dokumantasyon/readiness");
  const loginResponse = await submitLogin(page);
  if (!loginResponse.ok()) throw new Error(`Admin login failed: ${loginResponse.status()} ${await loginResponse.text()}`);
  expect((await initialItems).status()).toBe(200);
  expect((await initialReadiness).status()).toBe(200);
  await expect(page.getByLabel("Kullanıcı Adı")).toBeHidden();
  await page.waitForLoadState("networkidle");
  const assertRuntimeClean = observeRuntime(page);
  const reloadedItems = waitForDokGet(page, "/api/dokumantasyon/items");
  const reloadedReadiness = waitForDokGet(page, "/api/dokumantasyon/readiness");
  await page.reload();
  await expect(page.getByRole("button", { name: "Çıkış Yap" })).toBeVisible();
  expect((await reloadedItems).status()).toBe(200);
  expect((await reloadedReadiness).status()).toBe(200);
  await page.waitForLoadState("networkidle");

  for (const viewport of releaseViewports) await expectNoPageOverflow(page, viewport);
  assertRuntimeClean();

  await page.getByRole("button", { name: "Çıkış Yap" }).click();
  await expect(page.getByLabel("Kullanıcı Adı")).toBeVisible();
  expect((await page.request.get("/api/dokumantasyon/items")).status()).toBe(401);
});

test("release visual audit captures the documented workspace, modal and viewer states", async ({ page }, testInfo: TestInfo) => {
  test.setTimeout(120_000);
  test.skip(testInfo.project.name !== "chromium", "Visual baselines are captured once in deterministic Desktop Chromium.");
  await page.addInitScript(() => {
    localStorage.setItem("theme", "light");
    const freezeMotion = () => {
      if (document.getElementById("release-motion-freeze")) return;
      const style = document.createElement("style");
      style.id = "release-motion-freeze";
      style.textContent = "*, *::before, *::after { animation: none !important; transition: none !important; } nextjs-portal { display: none !important; }";
      document.head.append(style);
    };
    if (document.head) freezeMotion();
    else document.addEventListener("DOMContentLoaded", freezeMotion, { once: true });
  });
  await page.goto("/dokumantasyon");
  await expect(page).toHaveScreenshot("release-login-light.png", snapshotOptions);
  await page.getByTestId("theme-toggle").first().click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page).toHaveScreenshot("release-login-dark.png", snapshotOptions);

  await login(page);
  await mockItems(page, { ...snapshotItems(), folders: [], files: [] });
  await page.reload();
  await expect(page.getByText("Bu klasör boş.", { exact: true })).toBeVisible();
  await expect(page).toHaveScreenshot("release-explorer-empty.png", snapshotOptions);

  await page.unroute("**/api/dokumantasyon/items**");
  await mockItems(page);
  await page.reload();
  await expect(page.getByText("Statik Plan.pdf", { exact: true })).toBeVisible();
  await expect(page).toHaveScreenshot("release-explorer-list.png", snapshotOptions);
  await page.getByTitle("Kart (Grid) Görünümü").click();
  await expect(page).toHaveScreenshot("release-explorer-grid.png", snapshotOptions);
  await page.getByTitle("Liste Görünümü").click();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page).toHaveScreenshot("release-mobile-explorer.png", snapshotOptions);
  await page.getByRole("button", { name: "Dokümantasyon menüsünü aç" }).click();
  await expect(page).toHaveScreenshot("release-mobile-sidebar.png", snapshotOptions);
  await page.keyboard.press("Escape");
  await page.getByLabel("Dosya Seç").first().click();
  await expect(page).toHaveScreenshot("release-mobile-details-sheet.png", snapshotOptions);
  await page.getByRole("button", { name: "Detayları kapat" }).click();
  await expect(page).toHaveScreenshot("release-selection-mode.png", snapshotOptions);
  await page.getByRole("button", { name: "Link Oluştur", exact: true }).click();
  await expect(page).toHaveScreenshot("release-share-modal.png", snapshotOptions);
  await page.keyboard.press("Escape");

  await page.route("**/api/dokumantasyon/upload/intent", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Geçici yükleme hatası" }) }), { times: 1 });
  await page.locator('input[type="file"]').setInputFiles({ name: "release-upload.txt", mimeType: "text/plain", buffer: Buffer.from("release upload") });
  await expect(page.getByRole("button", { name: "Tekrar dene" })).toBeVisible();
  await expect(page).toHaveScreenshot("release-upload-queue.png", snapshotOptions);

  await page.unroute("**/api/dokumantasyon/items**");
  const pdfId = await uploadFixture(page, "release-qa.pdf", "application/pdf", createFixturePdfBase64());
  await page.reload();
  await page.locator(`a[href="/dokumantasyon/dosya/${pdfId}"]`).first().click();
  await expect(page.locator('[data-testid="pdf-viewer-toolbar"]').first()).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page).toHaveScreenshot("release-pdf-desktop.png", snapshotOptions);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page).toHaveScreenshot("release-pdf-mobile.png", snapshotOptions);

  await page.goto("/dokumantasyon");
  const imageId = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 800;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas context unavailable");
    context.fillStyle = "#0f172a";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#f59e0b";
    context.fillRect(100, 100, 1400, 600);
    const image = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG creation failed")), "image/png"));
    const formData = new FormData();
    formData.append("file", new File([image], "release-qa.png", { type: "image/png" }));
    formData.append("pathname", `dok_storage/release-${crypto.randomUUID()}.png`);
    const response = await fetch("/api/dokumantasyon/upload/local", { method: "POST", body: formData });
    const payload = await response.json();
    if (!response.ok || !payload.file?.id) throw new Error(payload.error || "Release image upload failed");
    return payload.file.id as string;
  });
  await page.reload();
  await page.locator(`a[href="/dokumantasyon/dosya/${imageId}"]`).first().click();
  await expect(page.getByTestId("image-viewer-viewport")).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page).toHaveScreenshot("release-image-desktop.png", snapshotOptions);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page).toHaveScreenshot("release-image-mobile.png", snapshotOptions);

  await page.goto("/p/not-a-real-release-token");
  await expect(page).toHaveScreenshot("release-public-share.png", snapshotOptions);
});

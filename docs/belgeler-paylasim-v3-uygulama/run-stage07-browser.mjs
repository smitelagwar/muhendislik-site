import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { createWriteStream, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { chromium } from "playwright";

const evidenceDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(evidenceDir, "../..");
const devLogPath = resolve(evidenceDir, "ASAMA_07_dev-server.log");
const reportPath = resolve(evidenceDir, "ASAMA_07_browser.json");
const timeoutMs = 240_000;
const checks = [];
const mockRequests = [];
let browser = null;
let server = null;
let serverLog = null;
let fatalError = null;
let port = 0;
let usedLinks = 0;
let reservedLinks = 0;
let nextToken = 1;
let browserApiRequests = 0;
let browserApiResponses = 0;
let createPostCount = 0;
let bootstrapMode = "normal";
let resetDelayMs = 24 * 60 * 60 * 1_000;
let nextCreateDelayMs = 0;
let nextCreateFailure = null;
let quotaGetCount = 0;
let nextCreateLostResponse = false;
let lostRequestId = null;
let lostOperationData = null;

function primaryContractorField(page) {
  return page.getByTestId("belge-section-content-taraflar").getByPlaceholder("ABC İNŞAAT");
}

async function editPrimaryContractorInline(page, value) {
  await page.locator('[data-testid="belge-inline-edit-toggle"]').click({ timeout: 8_000 });
  await page.locator('[data-testid="belge-inline-hotspot-muteahhit_unvan"]').click({ timeout: 8_000 });
  await page.locator('[data-testid="belge-inline-edit-input"]').fill(value, { timeout: 8_000 });
  await page.locator('[data-testid="belge-inline-edit-apply"]').click({ timeout: 8_000 });
}

function recordCheck(id, passed, detail = "") {
  checks.push({ id, result: passed ? "PASS" : "FAIL", detail });
  if (!passed) throw new Error(`${id} failed${detail ? `: ${detail}` : ""}`);
}

function sleep(milliseconds) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds));
}

async function getAvailablePort() {
  return new Promise((resolvePort, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const selected = typeof address === "object" && address ? address.port : 0;
      probe.close((error) => error ? reject(error) : resolvePort(selected));
    });
  });
}

function sanitizedEnvironment() {
  const env = { ...process.env, NODE_ENV: "development", NEXT_DIST_DIR: ".next-stage07", NEXT_TELEMETRY_DISABLED: "1" };
  for (const name of Object.keys(env)) {
    if (/DATABASE|POSTGRES|NEON|BLOB|VERCEL|BELGE_SHARE_SECRET|CRON_SECRET|SHARE_TOKEN_ENCRYPTION_KEY|NODE_OPTIONS|NODE_PATH/i.test(name)) {
      delete env[name];
    }
  }
  env.NODE_ENV = "development";
  env.NEXT_DIST_DIR = ".next-stage07";
  env.NEXT_TELEMETRY_DISABLED = "1";
  return env;
}

async function startDevServer() {
  port = await getAvailablePort();
  serverLog = createWriteStream(devLogPath);
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: projectRoot,
    env: sanitizedEnvironment(),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  server.stdout.pipe(serverLog, { end: false });
  server.stderr.pipe(serverLog, { end: false });
  const url = `http://127.0.0.1:${port}/belgeler/santiye-sefi-sozlesmesi`;
  const deadline = Date.now() + 75_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Next dev server exited early (${server.exitCode}).`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
      if (response.status < 500) return url;
    } catch {
      // The dev server is still compiling or opening its local listener.
    }
    await sleep(400);
  }
  throw new Error("Next dev server did not become ready within 75 seconds.");
}

async function installApiMocks(page) {
  await page.route("**/api/belgeler/paylasim**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    browserApiRequests += 1;

    if (url.pathname === "/api/belgeler/paylasim/kota") {
      if (method === "POST") {
        browserApiResponses += 1;
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: "cookie_existing" }) });
        return;
      }
      if (method === "GET") {
        quotaGetCount += 1;
        browserApiResponses += 1;
        if (bootstrapMode === "cookie-disabled") {
          await route.fulfill({ status: 428, contentType: "application/json", body: JSON.stringify({ error: "BROWSER_ID_REQUIRED" }) });
          return;
        }
        if (bootstrapMode === "waf-html") {
          await route.fulfill({ status: 403, contentType: "text/html", body: "<html>blocked</html>" });
          return;
        }
        const quotaDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
        const serverNow = new Date().toISOString();
        const tomorrow = new Date(Date.now() + resetDelayMs);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "ready",
            quota: {
              limit: 50,
              used: usedLinks,
              reserved: reservedLinks,
              remaining: Math.max(0, 50 - usedLinks - reservedLinks),
              quotaDay,
              serverNow,
              resetAt: tomorrow.toISOString(),
              timeZone: "Europe/Istanbul",
            },
          }),
        });
        return;
      }
    }

    if (url.pathname === "/api/belgeler/paylasim" && method === "POST") {
      browserApiResponses += 1;
      createPostCount += 1;
      const body = request.postDataJSON();
      const delayMs = nextCreateDelayMs;
      nextCreateDelayMs = 0;
      if (delayMs > 0) await sleep(delayMs);
      if (nextCreateFailure) {
        const failure = nextCreateFailure;
        nextCreateFailure = null;
        await route.fulfill({
          status: failure.status,
          contentType: failure.contentType,
          headers: failure.headers,
          body: failure.contentType === "text/html" ? failure.body : JSON.stringify(failure.body),
        });
        return;
      }
      const serializedValues = JSON.stringify(body.values ?? {});
      mockRequests.push({
        requestId: body.clientRequestId,
        documentId: body.documentId,
        values: body.values ?? {},
        valuesDigest: createHash("sha256").update(serializedValues).digest("hex"),
      });
      const bytes = Buffer.alloc(32, nextToken++);
      const token = bytes.toString("base64url");
      const manageToken = Buffer.alloc(32, nextToken++).toString("base64url");
      usedLinks += 1;
      const responseData = {
        status: "ready",
        documentId: body.documentId,
        viewToken: token,
        manageToken,
        url: `http://127.0.0.1:${port}/b/${token}`,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      };
      if (nextCreateLostResponse) {
        nextCreateLostResponse = false;
        lostRequestId = body.clientRequestId;
        lostOperationData = responseData;
        await route.abort("connectionreset");
        return;
      }
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(responseData),
      });
      return;
    }

    if (url.pathname.startsWith("/api/belgeler/paylasim/islem/") && method === "GET") {
      browserApiResponses += 1;
      const requestId = decodeURIComponent(url.pathname.split("/").at(-1) ?? "");
      if (requestId === lostRequestId && lostOperationData) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(lostOperationData) });
        return;
      }
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ code: "OPERATION_NOT_FOUND", message: "İşlem bulunamadı." }),
      });
      return;
    }

    if (/^\/api\/belgeler\/paylasim\/[A-Za-z0-9_-]+$/.test(url.pathname) && method === "DELETE") {
      browserApiResponses += 1;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ code: "MOCK_REVOKE_FAILURE", message: "SENTETIK_IPTAL_HATASI" }),
      });
      return;
    }

    await route.continue();
  });
}

async function waitForCreateEnabled(page) {
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-testid="belge-share-create-btn"]');
    return Boolean(button && !button.disabled);
  }, undefined, { timeout: 45_000 });
}

async function main() {
  const pageUrl = await startDevServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "light", reducedMotion: "reduce" });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => { throw new DOMException("Clipboard permission denied", "NotAllowedError"); } },
    });
  });
  const page = await context.newPage();
  await installApiMocks(page);
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.name));
  page.on("dialog", (dialog) => { void dialog.accept(); });

  await page.goto(pageUrl, { timeout: 45_000, waitUntil: "domcontentloaded" });
  const shareTrigger = page.locator('[data-testid="belge-mobile-share-btn"]');
  await shareTrigger.waitFor({ state: "visible", timeout: 8_000 });
  await page.locator('[data-testid="belge-studio-preview-canvas"]').waitFor({ state: "visible", timeout: 8_000 });

  await shareTrigger.click({ timeout: 8_000 });
  const dialog = page.locator('[data-testid="belge-share-dialog"]');
  await dialog.waitFor({ state: "visible", timeout: 8_000 });
  await page.getByTestId("belge-share-quota").getByText("Bugün 0 / 50").waitFor({ state: "visible", timeout: 8_000 });
  await waitForCreateEnabled(page);

  const sampleWarning = page.locator('[data-testid="belge-share-sample-warning"]');
  await sampleWarning.waitFor({ state: "visible", timeout: 8_000 });
  const sampleWarningText = await sampleWarning.innerText();
  recordCheck("F09_plain_data_warning", sampleWarningText.includes("doldurulmuş alanlar") && sampleWarningText.includes("görülebilir") && !/snapshot|flatten/i.test(sampleWarningText),
    "editable field values produce a plain Turkish visibility warning");

  const initialPostCount = createPostCount;
  nextCreateDelayMs = 500;
  await page.evaluate(() => {
    const button = document.querySelector('[data-testid="belge-share-create-btn"]');
    if (!(button instanceof HTMLButtonElement)) throw new Error("Share create button is missing.");
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-testid="belge-share-create-btn"]');
    return Boolean(button instanceof HTMLButtonElement && button.disabled);
  }, undefined, { timeout: 8_000 });
  await page.locator('[data-testid="belge-share-result"]').waitFor({ state: "visible", timeout: 8_000 });
  recordCheck("inflight_double_click", createPostCount === initialPostCount + 1 && mockRequests.length === 1,
    "two same-frame clicks create one request while the first response is delayed");
  await page.locator('[data-testid="belge-share-result"]').waitFor({ state: "visible", timeout: 8_000 });
  recordCheck("B02_first_link", mockRequests.length === 1, "first mock request created for current PDF revision");
  const sameSnapshotAction = await page.locator('[data-testid="belge-share-create-btn"]').innerText();
  recordCheck("same_snapshot_distinct_action", sameSnapshotAction.includes("Yeni ayrı bağlantı oluştur"), "an explicit new independent link action is visible for the same current form");

  await page.locator('[data-testid="belge-share-copy-btn"]').click({ timeout: 8_000 });
  await page.locator('[data-testid="belge-share-copy-fallback"]').waitFor({ state: "visible", timeout: 8_000 });
  await page.locator('[data-testid="belge-share-error"]').getByText("Panoya kopyalanamadı").waitFor({ state: "visible", timeout: 8_000 });
  const fallbackFocused = await page.locator('[data-testid="belge-share-copy-fallback"] textarea').evaluate((node) => document.activeElement === node && node.selectionStart === 0);
  recordCheck("clipboard_manual_fallback", fallbackFocused, "read-only link is selected and manual-copy help is visible");
  recordCheck("copy_is_free", mockRequests.length === 1, "copying an existing link sends no create request");

  await page.getByRole("button", { name: "Bu bağlantıyı iptal et" }).click({ timeout: 8_000 });
  await page.getByRole("button", { name: "Evet, bağlantıyı iptal et" }).click({ timeout: 8_000 });
  const visibleRevokeError = page.locator('[data-testid="belge-share-error"]');
  await visibleRevokeError.getByText("SENTETIK_IPTAL_HATASI").waitFor({ state: "visible", timeout: 8_000 });
  const revokeErrorIsLive = await visibleRevokeError.getAttribute("aria-live") === "assertive";
  recordCheck("B01_revoke_error", await visibleRevokeError.isVisible() && revokeErrorIsLive, "synthetic active-link revoke error remains in the dialog's shared assertive aria-live area");
  await page.getByRole("button", { name: "Vazgeç" }).click({ timeout: 8_000 });

  await page.getByRole("button", { name: /Bu cihazdaki bağlantılarım/ }).click({ timeout: 8_000 });
  const historyList = page.locator('[data-testid="belge-share-history-list"]');
  await historyList.waitFor({ state: "visible", timeout: 8_000 });
  await historyList.locator('[title="Bağlantıyı kopyala"]').first().click({ timeout: 8_000 });
  await page.locator('[data-testid="belge-share-error"]').getByText("Panoya kopyalanamadı").waitFor({ state: "visible", timeout: 8_000 });
  recordCheck("history_copy_error", await page.locator('[data-testid="belge-share-copy-fallback"]').isVisible(), "history copy failure uses the same live error and manual-copy field");
  await historyList.locator('[title="Bağlantıyı iptal et"]').first().click({ timeout: 8_000 });
  await historyList.getByRole("button", { name: "İptal et" }).click({ timeout: 8_000 });
  const historyRevokeErrorVisible = page.locator('[data-testid="belge-share-error"]');
  await historyRevokeErrorVisible.getByText("SENTETIK_IPTAL_HATASI").waitFor({ state: "visible", timeout: 8_000 });
  recordCheck("history_revoke_error", await historyRevokeErrorVisible.isVisible() && await historyRevokeErrorVisible.getAttribute("aria-live") === "assertive", "history revoke failure is visible in the same aria-live error area");

  const closeButton = page.locator('[data-testid="belge-share-close-btn"]');
  await closeButton.click({ timeout: 8_000 });
  await dialog.waitFor({ state: "hidden", timeout: 8_000 });
  const restoredFocus = await shareTrigger.evaluate((node) => document.activeElement === node);
  recordCheck("dialog_focus_restore", restoredFocus, "focus returns to the share trigger after close");

  await page.locator('[data-testid="belge-inline-edit-toggle"]').click({ timeout: 8_000 });
  const hotspot = page.locator('[data-testid="belge-inline-hotspot-muteahhit_unvan"]');
  await hotspot.waitFor({ state: "visible", timeout: 8_000 });
  await hotspot.click({ timeout: 8_000 });
  const inlineInput = page.locator('[data-testid="belge-inline-edit-input"]');
  await inlineInput.waitFor({ state: "visible", timeout: 8_000 });
  await inlineInput.fill("STAGE07 SENTETIK FIRM A", { timeout: 8_000 });
  await page.locator('[data-testid="belge-inline-edit-apply"]').click({ timeout: 8_000 });
  recordCheck("inline_draft_commit", await primaryContractorField(page).inputValue() === "STAGE07 SENTETIK FIRM A", "inline draft commit updates the live form");

  await shareTrigger.click({ timeout: 8_000 });
  await dialog.waitFor({ state: "visible", timeout: 8_000 });
  await waitForCreateEnabled(page);
  await page.locator('[data-testid="belge-share-outdated-warning"]').waitFor({ state: "visible", timeout: 8_000 });
  const createLabel = await page.locator('[data-testid="belge-share-create-btn"]').innerText();
  recordCheck("B02_current_revision_path", createLabel.includes("Güncel belge için yeni bağlantı oluştur"), "old link is labeled as a prior revision; current revision creation is available");

  await page.locator('[data-testid="belge-share-create-btn"]').click({ timeout: 8_000 });
  await page.locator('[data-testid="belge-share-result"]').waitFor({ state: "visible", timeout: 8_000 });
  await page.getByTestId("belge-share-quota").getByText("Bugün 2 / 50").waitFor({ state: "visible", timeout: 8_000 });
  const twoDistinctPayloads = mockRequests.length === 2 &&
    mockRequests[0].requestId !== mockRequests[1].requestId &&
    mockRequests[0].values.muteahhit_unvan !== mockRequests[1].values.muteahhit_unvan;
  recordCheck("first_to_second_link", twoDistinctPayloads, "two distinct request IDs carry different PDF field values");
  const formPreserved = await primaryContractorField(page).inputValue() === "STAGE07 SENTETIK FIRM A";
  recordCheck("success_keeps_form", formPreserved, "successful second link leaves the edited form intact");

  usedLinks = 7;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.getByTestId("belge-share-quota").getByText("Bugün 7 / 50").waitFor({ state: "visible", timeout: 8_000 });
  const historyButtonText = await page.getByRole("button", { name: /Bu cihazdaki bağlantılarım/ }).innerText();
  recordCheck("F24_quota_independent_of_history", historyButtonText.includes("2") && (await page.getByTestId("belge-share-quota").innerText()).includes("Bugün 7 / 50"),
    "server quota aggregate remains distinct from the two local history entries");
  usedLinks = 2;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.getByTestId("belge-share-quota").getByText("Bugün 2 / 50").waitFor({ state: "visible", timeout: 8_000 });

  nextCreateFailure = {
    status: 429,
    contentType: "application/json",
    headers: { "Retry-After": "60" },
    body: { code: "DAILY_BROWSER_QUOTA_EXCEEDED", message: "Günlük bağlantı hakkı doldu." },
  };
  await page.locator('[data-testid="belge-share-create-btn"]').click({ timeout: 8_000 });
  await page.locator('[data-testid="belge-share-error"]').getByText("Günlük bağlantı hakkı doldu.").waitFor({ state: "visible", timeout: 8_000 });
  recordCheck("daily_quota_error", (await page.locator('[data-testid="belge-share-error"]').innerText()).includes("Kota 1 dakika sonra yenilenecek"), "JSON daily quota response uses the server Retry-After value");

  nextCreateFailure = { status: 429, contentType: "text/html", body: "<html>blocked</html>" };
  await page.locator('[data-testid="belge-share-create-btn"]').click({ timeout: 8_000 });
  const wafMessage = await page.locator('[data-testid="belge-share-error"]').innerText();
  recordCheck("waf_quota_separation", wafMessage.includes("güvenlik filtresi") && !wafMessage.includes("Günlük bağlantı hakkı doldu"), "HTML 429 does not claim that the daily quota was exhausted");

  nextCreateFailure = {
    status: 503,
    contentType: "application/json",
    body: { code: "STORAGE_CAPACITY_UNAVAILABLE", message: "Saklama alanı geçici olarak dolu." },
  };
  await page.locator('[data-testid="belge-share-create-btn"]').click({ timeout: 8_000 });
  const capacityMessage = await page.locator('[data-testid="belge-share-error"]').innerText();
  recordCheck("capacity_error", capacityMessage.includes("Saklama alanı geçici olarak dolu"), "503 capacity response remains distinct from daily quota");

  usedLinks = 49;
  reservedLinks = 1;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.getByTestId("belge-share-quota").getByText("Bugün 49 / 50").waitFor({ state: "visible", timeout: 8_000 });
  await page.getByTestId("belge-share-quota").getByText(/1 bağlantı isteği sonuçlanmayı bekliyor/).waitFor({ state: "visible", timeout: 8_000 });
  recordCheck("reserved_quota_ui", await page.locator('[data-testid="belge-share-create-btn"]').isDisabled(), "reserved work is shown separately and does not claim 50 successes");

  usedLinks = 2;
  reservedLinks = 0;
  resetDelayMs = 750;
  const quotaReadsBeforeReset = quotaGetCount;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.getByTestId("belge-share-quota").getByText("Bugün 2 / 50").waitFor({ state: "visible", timeout: 8_000 });
  await sleep(2_000);
  recordCheck("quota_midnight_refresh", quotaGetCount > quotaReadsBeforeReset + 1, "reset timer re-reads the server after the mocked quota boundary");

  bootstrapMode = "cookie-disabled";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.getByTestId("belge-share-quota").getByText(/Tarayıcı çerezi kabul etmedi/).waitFor({ state: "visible", timeout: 8_000 });
  recordCheck("cookie_disabled", true, "missing browser identity is reported as cookie setup, not daily quota");

  bootstrapMode = "waf-html";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.getByTestId("belge-share-quota").getByText(/Kota bilgisi şu anda alınamıyor/).waitFor({ state: "visible", timeout: 8_000 });
  recordCheck("quota_waf_html", true, "HTML quota bootstrap denial is not shown as consumed daily links");

  bootstrapMode = "normal";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await page.getByTestId("belge-share-quota").getByText("Bugün 2 / 50").waitFor({ state: "visible", timeout: 8_000 });

  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden", timeout: 8_000 });
  recordCheck("dialog_escape", await shareTrigger.evaluate((node) => document.activeElement === node), "Escape closes and restores focus");

  await shareTrigger.click({ timeout: 8_000 });
  await dialog.waitFor({ state: "visible", timeout: 8_000 });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.waitForFunction(() => {
    const node = document.querySelector('[data-testid="belge-share-dialog"]');
    return Boolean(node && [...node.getAnimations()].every((animation) => animation.playState !== "running"));
  }, undefined, { timeout: 5_000 });
  await page.evaluate(() => new Promise((resolveFrame) => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
  const mobileLayout = await dialog.evaluate((node) => {
    const dialogRect = node.getBoundingClientRect();
    const copy = node.querySelector('[data-testid="belge-share-copy-btn"]');
    const copyRect = copy?.getBoundingClientRect();
    const buttons = [...node.querySelectorAll("button")]
      .filter((button) => button.getClientRects().length > 0)
      .map((button) => {
        const rect = button.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          label: button.getAttribute("aria-label") ?? button.innerText,
          title: button.getAttribute("title"),
        };
      });
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.clientWidth,
      computedWidth: getComputedStyle(node).width,
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
      dialogLeft: dialogRect.left,
      dialogRight: dialogRect.right,
      copyVisible: Boolean(copyRect && copyRect.width > 0 && copyRect.left >= 0 && copyRect.right <= window.innerWidth),
      allButtonsAtLeast44: buttons.every((button) => button.width >= 44 && button.height >= 44),
      buttonCount: buttons.length,
      buttons,
    };
  });
  recordCheck("B03_320px_layout", mobileLayout.clientWidth >= 300 && mobileLayout.scrollWidth <= mobileLayout.clientWidth && mobileLayout.copyVisible && mobileLayout.allButtonsAtLeast44,
    `320px layout: ${JSON.stringify(mobileLayout)}`);

  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  const darkReducedMotionLayout = await dialog.evaluate((node) => ({
    visible: node.getClientRects().length > 0,
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
    copyVisible: Boolean(node.querySelector('[data-testid="belge-share-copy-btn"]')?.getClientRects().length),
  }));
  recordCheck("dark_reduced_motion", darkReducedMotionLayout.visible && darkReducedMotionLayout.scrollWidth <= darkReducedMotionLayout.clientWidth && darkReducedMotionLayout.copyVisible,
    "dialog stays usable in dark mode with reduced motion enabled");

  await page.locator('[data-testid="belge-share-close-btn"]').click({ timeout: 8_000 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId("belge-draft-consent-device").click({ timeout: 8_000 });
  await page.getByTestId("belge-draft-status-badge").waitFor({ state: "visible", timeout: 8_000 });
  await page.waitForFunction(() => {
    const raw = localStorage.getItem("belgeler:ux:draft:device:v1:santiye-sefi-sozlesmesi");
    return raw && JSON.parse(raw).values?.muteahhit_unvan === "STAGE07 SENTETIK FIRM A";
  }, undefined, { timeout: 8_000 });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.getByTestId("belge-draft-restore-banner").waitFor({ state: "visible", timeout: 8_000 });
  await page.getByTestId("belge-draft-restore-confirm").click({ timeout: 8_000 });
  const restoredValue = await primaryContractorField(page).inputValue();
  recordCheck("draft_restore_transition", restoredValue === "STAGE07 SENTETIK FIRM A", "saved form restores before the share snapshot is read");

  await page.getByRole("button", { name: "Diğer belge işlemleri" }).click({ timeout: 8_000 });
  await page.getByRole("menuitem", { name: "Örnek verilere sıfırla" }).click({ timeout: 8_000 });
  const resetValue = await primaryContractorField(page).inputValue();
  recordCheck("reset_transition", resetValue === "ABC İNŞAAT", "reset replaces current form data and invalidates the previous PDF revision");
  await page.getByRole("button", { name: "Diğer belge işlemleri" }).click({ timeout: 8_000 });
  await page.getByRole("menuitem", { name: "Son işlemi geri al" }).click({ timeout: 8_000 });
  const undoValue = await primaryContractorField(page).inputValue();
  recordCheck("undo_transition", undoValue === "STAGE07 SENTETIK FIRM A", "undo restores the exact form values used by the edited revision");

  await page.waitForFunction(() => {
    const raw = localStorage.getItem("belgeler:ux:draft:device:v1:santiye-sefi-sozlesmesi");
    return raw && JSON.parse(raw).values?.muteahhit_unvan === "STAGE07 SENTETIK FIRM A";
  }, undefined, { timeout: 8_000 });
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-testid="belge-mobile-share-btn"]');
    return Boolean(button && !(button instanceof HTMLButtonElement && button.disabled));
  }, undefined, { timeout: 45_000 });
  await page.locator('[data-testid="belge-mobile-share-btn"]').click({ timeout: 8_000 });
  await dialog.waitFor({ state: "visible", timeout: 8_000 });
  await waitForCreateEnabled(page);
  const countBeforeLostResponse = mockRequests.length;
  nextCreateLostResponse = true;
  await page.locator('[data-testid="belge-share-create-btn"]').click({ timeout: 8_000 });
  await page.locator('[data-testid="belge-share-error"]').getByText("Paylaşım servisine ulaşılamadı").waitFor({ state: "visible", timeout: 8_000 });
  const recoveryRecordBeforeReload = await page.evaluate(() => sessionStorage.getItem("belge_paylasim_pending_v1:santiye-sefi-sozlesmesi"));
  const recoveryContainsNoForm = Boolean(recoveryRecordBeforeReload &&
    !recoveryRecordBeforeReload.includes("STAGE07 SENTETIK FIRM A") &&
    !recoveryRecordBeforeReload.includes('"values"') &&
    !recoveryRecordBeforeReload.includes('"muteahhit_unvan"'));
  recordCheck("recovery_record_has_no_form", recoveryContainsNoForm, "session recovery record stores only request proof, document ID, revision, digest, and time");

  await page.reload({ waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.getByTestId("belge-draft-restore-banner").waitFor({ state: "visible", timeout: 8_000 });
  await page.getByTestId("belge-draft-restore-confirm").click({ timeout: 8_000 });
  await primaryContractorField(page).waitFor({ state: "attached", timeout: 8_000 });
  await page.locator('[data-testid="belge-mobile-share-btn"]').click({ timeout: 45_000 });
  await dialog.waitFor({ state: "visible", timeout: 8_000 });
  await page.locator('[data-testid="belge-share-result"]').waitFor({ state: "visible", timeout: 18_000 });
  const recoveredWithoutSecondPost = mockRequests.length === countBeforeLostResponse + 1 && lostRequestId !== null;
  const recoveryRecordCleared = await page.evaluate(() => sessionStorage.getItem("belge_paylasim_pending_v1:santiye-sefi-sozlesmesi") === null);
  const recoveredCurrentLink = await page.locator('[data-testid="belge-share-outdated-warning"]').count() === 0;
  recordCheck("lost_response_recovery", recoveredWithoutSecondPost && recoveryRecordCleared && recoveredCurrentLink,
    "reload status lookup restores the ready link without a second POST; restored same form remains current");

  await page.locator('[data-testid="belge-share-close-btn"]').click({ timeout: 8_000 });
  await editPrimaryContractorInline(page, "STAGE07 SENTETIK FIRM B");
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-testid="belge-mobile-share-btn"]');
    return Boolean(button && !(button instanceof HTMLButtonElement && button.disabled));
  }, undefined, { timeout: 45_000 });
  await shareTrigger.click({ timeout: 8_000 });
  await dialog.waitFor({ state: "visible", timeout: 8_000 });
  await waitForCreateEnabled(page);
  const countBeforeChangedFormLoss = mockRequests.length;
  nextCreateLostResponse = true;
  await page.locator('[data-testid="belge-share-create-btn"]').click({ timeout: 8_000 });
  await page.locator('[data-testid="belge-share-error"]').getByText("Paylaşım servisine ulaşılamadı").waitFor({ state: "visible", timeout: 8_000 });
  const pendingDifferentFormRequest = mockRequests.at(-1);
  recordCheck("changed_form_pending_request", mockRequests.length === countBeforeChangedFormLoss + 1 && pendingDifferentFormRequest?.values.muteahhit_unvan === "STAGE07 SENTETIK FIRM B",
    "the second recoverable operation captured its own click-time form values");

  await page.locator('[data-testid="belge-share-close-btn"]').click({ timeout: 8_000 });
  await page.waitForFunction(() => {
    const raw = localStorage.getItem("belgeler:ux:draft:device:v1:santiye-sefi-sozlesmesi");
    return raw && JSON.parse(raw).values?.muteahhit_unvan === "STAGE07 SENTETIK FIRM B";
  }, undefined, { timeout: 8_000 });
  await page.evaluate(() => {
    const key = "belgeler:ux:draft:device:v1:santiye-sefi-sozlesmesi";
    const raw = localStorage.getItem(key);
    if (!raw) throw new Error("Saved form draft is missing.");
    const draft = JSON.parse(raw);
    draft.values.muteahhit_unvan = "STAGE07 SENTETIK FIRM C";
    localStorage.setItem(key, JSON.stringify(draft));
  });
  await page.reload({ waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.getByTestId("belge-draft-restore-banner").waitFor({ state: "visible", timeout: 8_000 });
  await page.getByTestId("belge-draft-restore-confirm").click({ timeout: 8_000 });
  const changedFormRestored = await primaryContractorField(page).inputValue() === "STAGE07 SENTETIK FIRM C";
  recordCheck("changed_form_restored", changedFormRestored, "a newer local draft restores while the previous request proof remains available");
  await shareTrigger.click({ timeout: 8_000 });
  await dialog.waitFor({ state: "visible", timeout: 8_000 });
  await waitForCreateEnabled(page);
  await page.locator('[data-testid="belge-share-outdated-warning"]').waitFor({ state: "visible", timeout: 8_000 });
  const countAfterChangedFormRecovery = mockRequests.length;
  recordCheck("changed_form_recovery_no_repost", countAfterChangedFormRecovery === countBeforeChangedFormLoss + 1,
    "status recovery resolves the old request without resending its ID with a changed form");
  await page.locator('[data-testid="belge-share-create-btn"]').click({ timeout: 8_000 });
  await page.locator('[data-testid="belge-share-result"]').waitFor({ state: "visible", timeout: 8_000 });
  const currentFormRequest = mockRequests.at(-1);
  recordCheck("changed_form_uses_new_request_id", mockRequests.length === countAfterChangedFormRecovery + 1 &&
    currentFormRequest?.requestId !== pendingDifferentFormRequest?.requestId &&
    currentFormRequest?.values.muteahhit_unvan === "STAGE07 SENTETIK FIRM C",
  "the changed form is sent only under a new request ID after recovering the previous form result");

  recordCheck("mock_api_only", browserApiRequests === browserApiResponses && browserApiResponses > 0, "share, quota, status, and revoke responses were intercepted by Playwright; no live API behavior is claimed");
  recordCheck("browser_runtime", pageErrors.length === 0, `${pageErrors.length} uncaught browser errors`);

  return {
    pageUrl: "/belgeler/santiye-sefi-sozlesmesi",
    browser: "Chromium headless via Playwright",
    viewportSizes: [390, 320],
    media: ["light", "dark", "reduced-motion"],
    browserApiMode: "Playwright route mocks; UI served by local Next dev; no live create/quota/revoke API or production data",
    mockedSuccessfulLinks: usedLinks,
    mockedQuota: { used: usedLinks, reserved: reservedLinks, limit: 50 },
    requestCount: mockRequests.length,
    requestIdsDistinct: new Set(mockRequests.map((request) => request.requestId)).size === mockRequests.length,
    differingPayloadDigestCount: new Set(mockRequests.map((request) => request.valuesDigest)).size,
    submittedFieldNames: [...new Set(mockRequests.flatMap((request) => Object.keys(request.values)))].sort(),
    confirmedDifferentFieldValues: mockRequests.length >= 2 && mockRequests[0].values.muteahhit_unvan !== mockRequests[1].values.muteahhit_unvan,
    browserApiRequests,
    browserApiResponses,
    checks,
    allChecksPassed: true,
    devLogPath,
  };
}

const startedAt = Date.now();
let report;
let timedOut = false;
const watchdog = setTimeout(() => {
  timedOut = true;
  fatalError = new Error(`Browser runner exceeded ${timeoutMs}ms watchdog.`);
}, timeoutMs);

try {
  report = await main();
} catch (error) {
  fatalError = error instanceof Error ? error : new Error(String(error));
  if (!checks.some((check) => check.result === "FAIL")) {
    checks.push({ id: "runner", result: "FAIL", detail: fatalError.message });
  }
} finally {
  clearTimeout(watchdog);
  if (browser) {
    try { await browser.close(); } catch { /* Close attempt is recorded via process cleanup. */ }
  }
  if (server?.pid) {
    if (process.platform === "win32") {
      await new Promise((resolveKill) => {
        const killer = spawn("taskkill.exe", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
        killer.once("close", () => resolveKill());
        killer.once("error", () => resolveKill());
        setTimeout(resolveKill, 4_000);
      });
    } else {
      server.kill("SIGTERM");
    }
  }
  if (serverLog) await new Promise((resolveLog) => serverLog.end(resolveLog));
  const finalReport = {
    ...(report ?? {}),
    result: fatalError ? "FAIL" : "PASS",
    timedOut,
    exitCode: fatalError || timedOut ? 1 : 0,
    durationMs: Date.now() - startedAt,
    error: fatalError?.message ?? null,
    checks,
    allChecksPassed: !fatalError && !timedOut && checks.every((check) => check.result === "PASS"),
    browserApiMode: "Playwright route mocks only; local UI browser run is not a live backend test",
    devLogPath,
  };
  writeFileSync(reportPath, `${JSON.stringify(finalReport, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(finalReport, null, 2));
  process.exit(fatalError || timedOut ? 1 : 0);
}

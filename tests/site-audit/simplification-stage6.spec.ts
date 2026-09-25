import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

type ViewportCase = {
  name: string;
  width: number;
  height: number;
  hasTouch: boolean;
  isMobile: boolean;
};

type RuntimeProbe = {
  consoleErrors: string[];
  reactWarnings: string[];
  pageErrors: string[];
  requestFailures: string[];
  badResponses: string[];
};

const VIEWPORT_MATRIX: ViewportCase[] = [
  { name: "küçük mobil", width: 320, height: 720, hasTouch: true, isMobile: true },
  { name: "standart Android", width: 390, height: 844, hasTouch: true, isMobile: true },
  { name: "büyük mobil", width: 430, height: 932, hasTouch: true, isMobile: true },
  { name: "tablet", width: 768, height: 1024, hasTouch: true, isMobile: false },
  { name: "küçük laptop / tablet landscape", width: 1024, height: 768, hasTouch: true, isMobile: false },
  { name: "desktop", width: 1366, height: 768, hasTouch: false, isMobile: false },
  { name: "geniş desktop", width: 1920, height: 1080, hasTouch: false, isMobile: false },
];

const RETIRED_ROUTES = [
  "/konu-haritasi",
  "/kaydedilenler",
  "/kategori/bina-asamalari",
  "/kategori/yapi-tasarimi",
  "/kategori/santiye",
] as const;

const CORE_ACCESSIBILITY_ROUTES = [
  "/",
  "/hesaplamalar/hizli-metraj",
  "/belgeler",
  "/rehber/proje-hazirlik",
  "/kategori/deprem-yonetmelik",
] as const;

function absolute(baseURL: string, pathname: string) {
  return new URL(pathname, baseURL).toString();
}

async function createContext(
  browser: Browser,
  viewport: ViewportCase,
  options?: { reducedMotion?: "reduce" | "no-preference" },
) {
  return browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    hasTouch: viewport.hasTouch,
    isMobile: viewport.isMobile,
    deviceScaleFactor: 1,
    locale: "tr-TR",
    colorScheme: "dark",
    reducedMotion: options?.reducedMotion ?? "no-preference",
  });
}

function attachRuntimeProbe(page: Page): RuntimeProbe {
  const probe: RuntimeProbe = {
    consoleErrors: [],
    reactWarnings: [],
    pageErrors: [],
    requestFailures: [],
    badResponses: [],
  };

  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error") {
      probe.consoleErrors.push(text);
    }
    if (
      message.type() === "warning" &&
      /react|hydration|validatedomnesting|each child in a list/i.test(text)
    ) {
      probe.reactWarnings.push(text);
    }
  });

  page.on("pageerror", (error) => {
    probe.pageErrors.push(error.message);
  });

  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "unknown";
    const url = request.url();
    if (failure === "net::ERR_ABORTED" && url.includes("_rsc=")) {
      return;
    }
    probe.requestFailures.push(failure + " :: " + url);
  });

  page.on("response", (response) => {
    if (response.status() >= 400) {
      probe.badResponses.push(response.status() + " :: " + response.url());
    }
  });

  return probe;
}

async function expectRuntimeClean(page: Page, probe: RuntimeProbe, label: string) {
  await page.waitForTimeout(150);
  expect(probe.consoleErrors, label + " console.error").toEqual([]);
  expect(probe.reactWarnings, label + " React/hydration warning").toEqual([]);
  expect(probe.pageErrors, label + " pageerror").toEqual([]);
  expect(probe.requestFailures, label + " failed request").toEqual([]);
  expect(probe.badResponses, label + " HTTP >= 400 response").toEqual([]);
}

async function gotoOk(page: Page, baseURL: string, pathname: string) {
  const response = await page.goto(absolute(baseURL, pathname), {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });
  expect(response, "Route response missing: " + pathname).not.toBeNull();
  expect(response?.status() ?? 500, "Route failed: " + pathname).toBeLessThan(400);
  await page.waitForTimeout(250);
}

async function seedDokumantasyonFixture(context: BrowserContext, baseURL: string) {
  const suffix = Date.now().toString(36);
  const headers = { Origin: new URL(baseURL).origin };
  const folderResponse = await context.request.post(absolute(baseURL, "/api/dokumantasyon/folders"), {
    headers,
    data: { name: "Stage6 UX Kabul " + suffix, parentId: null },
  });
  expect(folderResponse.status()).toBe(200);
  const folderPayload = await folderResponse.json();
  const folderId = String(folderPayload.folder?.id ?? "");
  expect(folderId).not.toBe("");

  const fileIds: string[] = [];
  for (const index of [1, 2]) {
    const fileName = "stage6-ux-" + suffix + "-" + index + ".txt";
    const uploadResponse = await context.request.post(absolute(baseURL, "/api/dokumantasyon/upload/local"), {
      headers,
      multipart: {
        file: { name: fileName, mimeType: "text/plain", buffer: Buffer.from("Stage 6 UX fixture " + index + "\n") },
        pathname: fileName,
        folderId,
      },
    });
    expect(uploadResponse.status()).toBe(200);
    const payload = await uploadResponse.json();
    const fileId = String(payload.file?.id ?? "");
    expect(fileId).not.toBe("");
    fileIds.push(fileId);
  }
  return { folderId, fileIds };
}
test.describe("Sadeleştirme Aşama 6 — gerçek kullanıcı akışları", () => {
  test("Senaryo A — Ana Sayfa → Hesaplamalar → araç kullan → geri", async ({ browser, baseURL }) => {
    test.setTimeout(90_000);
    expect(baseURL).toBeTruthy();

    const context = await createContext(browser, VIEWPORT_MATRIX[1]);
    const page = await context.newPage();
    const probe = attachRuntimeProbe(page);

    try {
      await gotoOk(page, baseURL!, "/");
      await page.locator('button[aria-controls="mobile-navigation-drawer"]:visible').click();
      await expect(page.locator("#mobile-navigation-drawer")).toBeVisible();
      await page.locator('#mobile-navigation-drawer a[href="/hesaplamalar"]').click();
      await expect(page).toHaveURL(/\/hesaplamalar$/);

      await page.locator('a[href="/hesaplamalar/hizli-metraj"]:visible').first().click();
      await expect(page).toHaveURL(/\/hesaplamalar\/hizli-metraj/);

      const concreteResult = page.locator('[data-testid="hizli-metraj-result-beton"]');
      await expect(concreteResult).toBeVisible();
      const before = (await concreteResult.textContent())?.trim() ?? "";

      const areaInput = page.locator('[data-testid="hizli-metraj-input-kat-alani"]');
      await areaInput.fill("525");
      await expect
        .poll(async () => (await concreteResult.textContent())?.trim() ?? "")
        .not.toBe(before);

      const backLink = page.locator('[data-testid="header-context-back-link"]');
      await expect(backLink).toHaveAttribute("href", "/hesaplamalar");
      await backLink.click();
      await expect(page).toHaveURL(/\/hesaplamalar$/);

      await expectRuntimeClean(page, probe, "Senaryo A");
    } finally {
      await context.close();
    }
  });

  test("Senaryo B — Ana Sayfa → Dokümantasyon → klasör → dosya → geri → başka dosya", async ({ browser, baseURL }) => {
    test.setTimeout(120_000);
    expect(baseURL).toBeTruthy();
    const context = await createContext(browser, VIEWPORT_MATRIX[5]);
    const fixture = await seedDokumantasyonFixture(context, baseURL!);
    const page = await context.newPage();
    const probe = attachRuntimeProbe(page);
    try {
      await gotoOk(page, baseURL!, "/");
      await page.locator('[data-testid="desktop-nav-item"][data-nav-id="dokumantasyon"]:visible').click();
      await expect(page).toHaveURL(/\/dokumantasyon$/);
      await expect(page.locator("[data-dok-shell]")).toBeVisible();
      const folder = page.locator('[data-folder-id="' + fixture.folderId + '"]:visible').first();
      await expect(folder).toBeVisible({ timeout: 15_000 });
      const before = page.url();
      await folder.dblclick();
      await expect.poll(() => page.url()).not.toBe(before);
      const first = page.locator('[data-file-id="' + fixture.fileIds[0] + '"] [data-testid="dok-file-name"]:visible').first();
      await expect(first).toBeVisible({ timeout: 15_000 });
      await first.click();
      await expect(page).toHaveURL(/\/dokumantasyon\/dosya\//);
      await page.goBack({ waitUntil: "domcontentloaded" });
      await expect(page.locator("[data-dok-shell]")).toBeVisible();
      const second = page.locator('[data-file-id="' + fixture.fileIds[1] + '"] [data-testid="dok-file-name"]:visible').first();
      await expect(second).toBeVisible({ timeout: 15_000 });
      await second.click();
      await expect(page).toHaveURL(/\/dokumantasyon\/dosya\//);
      expect(new URL(page.url()).pathname).toContain(fixture.fileIds[1]);
      await expectRuntimeClean(page, probe, "Senaryo B");
    } finally {
      await context.close();
    }
  });
  test("Senaryo C — Ana Sayfa → Belgeler → ara → belgeyi aç", async ({ browser, baseURL }) => {
    test.setTimeout(75_000);
    expect(baseURL).toBeTruthy();

    const context = await createContext(browser, VIEWPORT_MATRIX[1]);
    const page = await context.newPage();
    const probe = attachRuntimeProbe(page);

    try {
      await gotoOk(page, baseURL!, "/");
      await page.locator('[data-bottom-nav-item="belgeler"]:visible').click();
      await expect(page).toHaveURL(/\/belgeler$/);

      const search = page.locator('input[type="search"][placeholder*="Belge adı"]');
      await expect(search).toBeVisible();
      await search.fill("beton");

      const documentLink = page.locator('a[href="/belgeler/beton-dokum-tutanagi"]:visible').first();
      await expect(documentLink).toBeVisible();
      await documentLink.click();
      await expect(page).toHaveURL(/\/belgeler\/beton-dokum-tutanagi$/);
      await expect(page.locator("h1").first()).toBeVisible();

      await expectRuntimeClean(page, probe, "Senaryo C");
    } finally {
      await context.close();
    }
  });

  test("Senaryo D — global arama mobil ve masaüstü aynı akışı başlatır", async ({ browser, baseURL }) => {
    test.setTimeout(90_000);
    expect(baseURL).toBeTruthy();

    for (const viewport of [VIEWPORT_MATRIX[1], VIEWPORT_MATRIX[5]]) {
      const context = await createContext(browser, viewport);
      const page = await context.newPage();
      const probe = attachRuntimeProbe(page);

      try {
        await gotoOk(page, baseURL!, "/");

        if (viewport.width < 768) {
          await page.locator('[data-bottom-nav-item="search"]:visible').click();
        } else {
          await page.locator('[data-testid="navbar-live-search"]:visible').click();
        }

        const dialog = page.locator("#command-palette-dialog");
        await expect(dialog).toBeVisible();

        const input = page.locator('input[aria-label="Site içinde ara"]');
        await input.fill(viewport.width < 768 ? "donatı hesabı" : "TBDY 2018");

        const option = page.getByRole("option").first();
        await expect(option).toBeVisible();
        await option.click();
        await expect(dialog).toBeHidden();
        expect(new URL(page.url()).pathname).not.toBe("/");

        await expectRuntimeClean(page, probe, "Senaryo D / " + viewport.name);
      } finally {
        await context.close();
      }
    }
  });

  test("Senaryo E — Ana Sayfa / navigasyon → Mevzuat → ilgili içerik", async ({ browser, baseURL }) => {
    test.setTimeout(75_000);
    expect(baseURL).toBeTruthy();

    const context = await createContext(browser, VIEWPORT_MATRIX[1]);
    const page = await context.newPage();
    const probe = attachRuntimeProbe(page);

    try {
      await gotoOk(page, baseURL!, "/");
      await page.locator('button[aria-controls="mobile-navigation-drawer"]:visible').click();
      await page.locator('#mobile-navigation-drawer a[href="/kategori/deprem-yonetmelik"]').click();
      await expect(page).toHaveURL(/\/kategori\/deprem-yonetmelik$/);

      const articleLink = page.locator('#icerikler a[href^="/"]:has(h3)').first();
      await expect(articleLink).toBeVisible();
      const href = await articleLink.getAttribute("href");
      expect(href).toBeTruthy();
      await articleLink.click();
      await page.waitForURL((url) => url.pathname === href);
      expect(new URL(page.url()).pathname).toBe(href);

      await expectRuntimeClean(page, probe, "Senaryo E");
    } finally {
      await context.close();
    }
  });
});

test.describe("Sadeleştirme Aşama 6 — kaldırılmış özellik ve responsive matris", () => {
  test("Kaldırılmış yüzeyler 404 ve public navigasyonda görünmez", async ({ browser, baseURL }) => {
    test.setTimeout(75_000);
    expect(baseURL).toBeTruthy();

    const context = await createContext(browser, VIEWPORT_MATRIX[5]);
    for (const route of RETIRED_ROUTES) {
      const response = await context.request.get(absolute(baseURL!, route), { maxRedirects: 0 });
      expect(response.status(), "Kaldırılmış route 404 olmalı: " + route).toBe(404);
    }

    const legacyGuide = await context.request.get(
      absolute(baseURL!, "/kategori/bina-asamalari/proje-hazirlik/elektrik-projesi"),
      { maxRedirects: 0 },
    );
    expect([307, 308]).toContain(legacyGuide.status());
    expect(legacyGuide.headers().location).toBe("/rehber/proje-hazirlik/elektrik-projesi");

    const page = await context.newPage();
    try {
      await gotoOk(page, baseURL!, "/");
      const publicShellText = await page
        .locator('[data-site-header], [data-testid="global-bottom-nav"]')
        .allTextContents();
      const joined = publicShellText.join(" | ");
      for (const retiredLabel of ["Konu Haritası", "Bina Aşamaları", "Kaydedilenler"]) {
        expect(joined).not.toContain(retiredLabel);
      }
      await expect(
        page.locator(
          'a[href="/konu-haritasi"], a[href="/kaydedilenler"], a[href="/kategori/bina-asamalari"]',
        ),
      ).toHaveCount(0);
      await expect(page.getByRole("button", { name: /^Kaydet$/i })).toHaveCount(0);

      await page.locator('[data-testid="navbar-live-search"]:visible').click();
      const paletteText = await page.locator("#command-palette-dialog").innerText();
      expect(paletteText).not.toContain("Konu Haritası");
      expect(paletteText).not.toContain("Bina Aşamaları");
      expect(paletteText).not.toContain("Kaydedilenler");
    } finally {
      await context.close();
    }
  });

  test("320 / 390 / 430 / 768 / 1024 / 1366 / 1920 responsive kabul matrisi", async ({ browser, baseURL }) => {
    test.setTimeout(210_000);
    expect(baseURL).toBeTruthy();

    for (const viewport of VIEWPORT_MATRIX) {
      const context = await createContext(browser, viewport);
      const page = await context.newPage();
      const probe = attachRuntimeProbe(page);

      try {
        await gotoOk(page, baseURL!, "/");

        const shellState = await page.evaluate(() => {
          const header = document.querySelector("[data-site-header]");
          const headerRect = header?.getBoundingClientRect();
          const logo = document.querySelector("[data-home-navbar-logo]");
          const logoRect = logo?.getBoundingClientRect();
          const bottom = document.querySelector('[data-testid="global-bottom-nav"]');
          const spacer = document.querySelector('[data-testid="global-bottom-nav-spacer"]');
          return {
            overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
            header: headerRect
              ? { left: headerRect.left, right: headerRect.right, height: headerRect.height }
              : null,
            logoVisible:
              Boolean(logoRect) &&
              Number(logoRect?.width ?? 0) > 0 &&
              Boolean(logo) &&
              window.getComputedStyle(logo as Element).display !== "none",
            logo: logoRect ? { left: logoRect.left, right: logoRect.right } : null,
            bottomDisplay: bottom ? window.getComputedStyle(bottom).display : "missing",
            bottomHeight: bottom?.getBoundingClientRect().height ?? 0,
            spacerHeight: spacer?.getBoundingClientRect().height ?? 0,
          };
        });

        expect(shellState.overflow, viewport.name + " ana sayfa yatay taşma").toBe(false);
        expect(shellState.header).not.toBeNull();
        expect(shellState.header?.left ?? -1).toBeGreaterThanOrEqual(-1);
        expect(shellState.header?.right ?? viewport.width + 2).toBeLessThanOrEqual(viewport.width + 1);
        expect(shellState.header?.height ?? 0).toBeGreaterThan(40);

        if (shellState.logoVisible && shellState.logo) {
          expect(shellState.logo.left, viewport.name + " logo sol taşma").toBeGreaterThanOrEqual(-1);
          expect(shellState.logo.right, viewport.name + " logo sağ taşma").toBeLessThanOrEqual(viewport.width + 1);
        }

        if (viewport.width < 768) {
          expect(shellState.bottomDisplay).not.toBe("none");
          expect(shellState.spacerHeight).toBeGreaterThanOrEqual(shellState.bottomHeight - 2);

          const bottomState = await page.locator('[data-testid="global-bottom-nav"]').evaluate((nav) => {
            const items = Array.from(nav.querySelectorAll("[data-bottom-nav-item]"));
            return items.map((item) => {
              const label = item.querySelector("[data-bottom-nav-label]") as HTMLElement | null;
              return {
                text: label?.textContent?.trim() ?? "",
                overflow: label ? label.scrollWidth > label.clientWidth + 1 : true,
                width: item.getBoundingClientRect().width,
              };
            });
          });

          expect(bottomState.map((item) => item.text)).toEqual([
            "Ana Sayfa",
            "Ara",
            "Araçlar",
            "Belgeler",
            "Dokümantasyon",
          ]);
          expect(bottomState.filter((item) => item.overflow)).toEqual([]);
          const widths = bottomState.map((item) => item.width);
          expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(2);
        } else {
          expect(shellState.bottomDisplay).toBe("none");
        }

        const mobileMenuButton = page.locator(
          'button[aria-controls="mobile-navigation-drawer"]:visible',
        );
        const desktopNav = page.locator('[data-testid="desktop-nav-item"]:visible');

        if (viewport.width < 1280) {
          await expect(mobileMenuButton).toBeVisible();
          expect(await desktopNav.count()).toBe(0);

          await mobileMenuButton.click();
          const drawer = page.locator("#mobile-navigation-drawer");
          await expect(drawer).toBeVisible();

          const drawerState = await drawer.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            const theme = element.querySelector('[data-testid="theme-toggle"]');
            const themeRect = theme?.getBoundingClientRect();
            return {
              left: rect.left,
              right: rect.right,
              top: rect.top,
              bottom: rect.bottom,
              viewportWidth: window.innerWidth,
              viewportHeight: window.innerHeight,
              bodyOverflow: window.getComputedStyle(document.body).overflow,
              themeVisible: Boolean(themeRect && themeRect.width > 0 && themeRect.height > 0),
              themeInside:
                Boolean(themeRect) &&
                Number(themeRect?.left ?? -1) >= rect.left &&
                Number(themeRect?.right ?? rect.right + 1) <= rect.right + 1,
            };
          });

          expect(drawerState.left).toBeGreaterThanOrEqual(-1);
          expect(drawerState.right).toBeLessThanOrEqual(drawerState.viewportWidth + 1);
          expect(drawerState.top).toBeGreaterThanOrEqual(-1);
          expect(drawerState.bottom).toBeLessThanOrEqual(drawerState.viewportHeight + 1);
          expect(drawerState.bodyOverflow).toBe("hidden");
          expect(drawerState.themeVisible).toBe(true);
          expect(drawerState.themeInside).toBe(true);

          await drawer.locator('button[aria-label="Menüyü kapat"]').click();
          await expect(drawer).toBeHidden();
          const bodyOverflowAfter = await page.evaluate(
            () => window.getComputedStyle(document.body).overflow,
          );
          expect(bodyOverflowAfter).not.toBe("hidden");
        } else {
          expect(await mobileMenuButton.count()).toBe(0);
          expect(await desktopNav.count()).toBe(6);
        }

        await gotoOk(page, baseURL!, "/rehber/proje-hazirlik/elektrik-projesi");
        const guideState = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
          breadcrumbVisibleChildren: Array.from(
            document.querySelector('nav[aria-label="Sayfa konumu"]')?.children ?? [],
          ).filter((child) => {
            const style = window.getComputedStyle(child);
            return style.display !== "none" && style.visibility !== "hidden";
          }).length,
        }));
        expect(guideState.overflow, viewport.name + " rehber yatay taşma").toBe(false);
        if (viewport.width < 640) {
          expect(guideState.breadcrumbVisibleChildren).toBeLessThanOrEqual(3);
        }

        if (viewport.width < 768) {
          await page.evaluate(() =>
            window.scrollTo(0, Math.min(900, document.documentElement.scrollHeight)),
          );
          await page.waitForTimeout(250);
          const overlap = await page.evaluate(() => {
            const bottom = document.querySelector('[data-testid="global-bottom-nav"]');
            const topButton = document.querySelector('button[aria-label="Başa dön"]');
            if (!(bottom instanceof HTMLElement) || !(topButton instanceof HTMLElement)) {
              return false;
            }
            const bottomRect = bottom.getBoundingClientRect();
            const buttonRect = topButton.getBoundingClientRect();
            return buttonRect.bottom > bottomRect.top + 1;
          });
          expect(overlap, viewport.name + " sticky kontrol / bottom bar çakışması").toBe(false);
        }

        await expectRuntimeClean(page, probe, "Responsive " + viewport.name);
      } finally {
        await context.close();
      }
    }
  });
});

test.describe("Sadeleştirme Aşama 6 — accessibility ve runtime", () => {
  test("WCAG ciddi/kritik ihlal, semantik ikon butonu ve klavye focus problemi olmamalı", async ({ browser, baseURL }) => {
    test.setTimeout(180_000);
    expect(baseURL).toBeTruthy();

    for (const viewport of [VIEWPORT_MATRIX[1], VIEWPORT_MATRIX[5]]) {
      const context = await createContext(browser, viewport);
      const page = await context.newPage();

      try {
        for (const route of CORE_ACCESSIBILITY_ROUTES) {
          await gotoOk(page, baseURL!, route);

          const results = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
            .analyze();
          const serious = results.violations.filter(
            (violation) => violation.impact === "critical" || violation.impact === "serious",
          );
          expect(
            serious.map((violation) => ({
              id: violation.id,
              impact: violation.impact,
              nodes: violation.nodes.map((node) => node.target),
            })),
            viewport.name + " / " + route + " axe serious/critical",
          ).toEqual([]);

          const unlabeledIconButtons = await page.evaluate(() =>
            Array.from(document.querySelectorAll("button"))
              .filter((button) => {
                const rect = button.getBoundingClientRect();
                const style = window.getComputedStyle(button);
                return (
                  rect.width > 0 &&
                  rect.height > 0 &&
                  style.display !== "none" &&
                  style.visibility !== "hidden" &&
                  (button.textContent ?? "").trim() === "" &&
                  !button.getAttribute("aria-label") &&
                  !button.getAttribute("aria-labelledby") &&
                  !button.getAttribute("title")
                );
              })
              .map((button) => button.outerHTML.slice(0, 180)),
          );
          expect(
            unlabeledIconButtons,
            viewport.name + " / " + route + " etiketsiz ikon buton",
          ).toEqual([]);
        }

        await gotoOk(page, baseURL!, "/");
        let reachedSearch = false;
        for (let index = 0; index < 35; index += 1) {
          await page.keyboard.press("Tab");
          const controls = await page.evaluate(() => ({
            ariaControls: document.activeElement?.getAttribute("aria-controls") ?? "",
          }));
          if (controls.ariaControls === "command-palette-dialog") {
            reachedSearch = true;
            break;
          }
        }
        expect(reachedSearch, viewport.name + " klavye ile global aramaya erişim").toBe(true);

        const focusPaint = await page.evaluate(() => {
          const active = document.activeElement;
          if (!(active instanceof HTMLElement)) return false;
          const style = window.getComputedStyle(active);
          const outlineVisible =
            style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth || "0") > 0;
          const shadowVisible = style.boxShadow !== "none";
          return outlineVisible || shadowVisible;
        });
        expect(focusPaint, viewport.name + " focus görünürlüğü").toBe(true);
      } finally {
        await context.close();
      }
    }
  });

  test("Dokümantasyon dokunma hedefleri en az 40×40 ve reduced-motion tema animasyonlarını kapatır", async ({ browser, baseURL }) => {
    test.setTimeout(100_000);
    expect(baseURL).toBeTruthy();

    const touchContext = await createContext(browser, VIEWPORT_MATRIX[3]);
    await seedDokumantasyonFixture(touchContext, baseURL!);
    const touchPage = await touchContext.newPage();

    try {
      await gotoOk(touchPage, baseURL!, "/dokumantasyon");
      await expect(touchPage.locator("[data-dok-shell]")).toBeVisible();

      const controls = touchPage.locator(
        '[data-selection-control]:visible, ' +
          'button[aria-label="Yıldızla"]:visible, ' +
          'button[aria-label="Yıldızı kaldır"]:visible, ' +
          'button[aria-label="Klasör İşlemleri"]:visible, ' +
          'button[aria-label="Dosya İşlemleri"]:visible',
      );
      await expect(controls.first()).toBeVisible({ timeout: 15_000 });

      const undersized = await controls.evaluateAll((elements) =>
        elements
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              label: element.getAttribute("aria-label") ?? element.textContent?.trim() ?? "",
              width: rect.width,
              height: rect.height,
            };
          })
          .filter((item) => item.width < 39.5 || item.height < 39.5),
      );
      expect(undersized, "Dokümantasyon touch target < 40px").toEqual([]);
    } finally {
      await touchContext.close();
    }

    const reducedContext = await createContext(browser, VIEWPORT_MATRIX[1], {
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    try {
      await gotoOk(reducedPage, baseURL!, "/");
      await reducedPage.locator('button[aria-controls="mobile-navigation-drawer"]:visible').click();
      await expect(reducedPage.locator("#mobile-navigation-drawer")).toBeVisible();

      const motionState = await reducedPage.evaluate(() => {
        const wrapper = document.querySelector(".rgb-border-wrapper");
        const planet = document.querySelector(".animate-planet");
        const toggle = document.querySelector('[data-testid="theme-toggle"]');
        return {
          wrapperAnimation: wrapper ? window.getComputedStyle(wrapper).animationName : "missing",
          planetAnimation: planet ? window.getComputedStyle(planet).animationName : "missing",
          toggleTransition: toggle ? window.getComputedStyle(toggle).transitionDuration : "missing",
        };
      });

      expect(motionState.wrapperAnimation).toBe("none");
      expect(motionState.planetAnimation).toBe("none");
      const transitionDurations = motionState.toggleTransition
        .split(",")
        .map((value) => value.trim());
      expect(
        transitionDurations.every((value) => value === "0s" || value === "0.01ms"),
        `Reduced-motion transition süresi beklenmedik: ${motionState.toggleTransition}`,
      ).toBe(true);
    } finally {
      await reducedContext.close();
    }
  });
});

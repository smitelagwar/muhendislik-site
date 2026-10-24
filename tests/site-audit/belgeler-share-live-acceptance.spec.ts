import { chromium, expect, test, type Page } from "@playwright/test";

type ManagedShare = { viewToken: string; manageToken: string };

const sharedNatAddress = "198.51.100.84";

function sharedNatRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "x-forwarded-for": sharedNatAddress };
  // Protected Preview RCs need this header on every independently-created context.
  const trustedOidcToken = process.env.VERCEL_OIDC_TOKEN;
  if (trustedOidcToken) headers["x-vercel-trusted-oidc-idp-token"] = trustedOidcToken;
  return headers;
}

async function bootstrapIdentity(page: Page) {
  const result = await page.evaluate(async () => {
    const response = await fetch("/api/belgeler/paylasim/kota", { method: "POST" });
    return { status: response.status };
  });
  expect(result.status).toBe(200);
}

async function readQuota(page: Page) {
  return page.evaluate(async () => {
    const response = await fetch("/api/belgeler/paylasim/kota");
    const body = await response.json() as {
      quota?: { used: number; reserved: number; remaining: number };
    };
    return {
      status: response.status,
      used: body.quota?.used ?? null,
      reserved: body.quota?.reserved ?? null,
      remaining: body.quota?.remaining ?? null,
    };
  });
}

async function createShare(page: Page, values: Record<string, string>): Promise<ManagedShare> {
  const result = await page.evaluate(async (formValues) => {
    const makeSecret = () => {
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      let binary = "";
      for (const byte of bytes) binary += String.fromCharCode(byte);
      return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
    };
    const response = await fetch("/api/belgeler/paylasim", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-belge-share-replay-proof": makeSecret(),
      },
      body: JSON.stringify({
        clientRequestId: makeSecret(),
        documentId: "beton-dokum-tutanagi",
        values: formValues,
      }),
    });
    const body = await response.json() as {
      viewToken?: string;
      manageToken?: string;
      status?: string;
      code?: string;
    };
    return {
      status: response.status,
      ready: body.status === "ready",
      code: body.code ?? null,
      viewToken: body.viewToken ?? null,
      manageToken: body.manageToken ?? null,
    };
  }, values);

  expect(result.status, `share create returned ${result.status} (${result.code ?? "no code"})`).toBe(201);
  expect(result.ready).toBe(true);
  expect(result.viewToken).toBeTruthy();
  expect(result.manageToken).toBeTruthy();
  return { viewToken: result.viewToken!, manageToken: result.manageToken! };
}

async function readPdf(page: Page, viewToken: string) {
  return page.evaluate(async (token) => {
    const response = await fetch(`/api/belgeler/paylasim/${token}/pdf`);
    const bytes = await response.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    return {
      status: response.status,
      contentType: response.headers.get("content-type"),
      byteLength: bytes.byteLength,
      sha256: hash,
    };
  }, viewToken);
}

async function revokeShare(page: Page, share: ManagedShare) {
  return page.evaluate(async ({ viewToken, manageToken }) => {
    const response = await fetch(`/api/belgeler/paylasim/${viewToken}`, {
      method: "DELETE",
      headers: { "x-manage-token": manageToken },
    });
    return response.status;
  }, share);
}

test("ASAMA_13 K01/K02: changed PDF keeps first link stable; tabs share quota and separate browsers do not across one NAT", async ({
  page,
}) => {
  const shares: ManagedShare[] = [];
  let secondBrowser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  let secondBrowserPage: Page | undefined;

  try {
    await page.context().setExtraHTTPHeaders(sharedNatRequestHeaders());
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await bootstrapIdentity(page);
    expect(await readQuota(page)).toMatchObject({ status: 200, used: 0, reserved: 0, remaining: 50 });

    const first = await createShare(page, {
      tarih: "24.10.2026",
      yer: "K01 sentetik saha ilk",
      yibf: "7654321",
      olay_aciklamasi: "İlk paylaşım sözleşmesi",
    });
    shares.push(first);
    const firstPdfBeforeSecondLink = await readPdf(page, first.viewToken);

    const second = await createShare(page, {
      tarih: "24.10.2026",
      yer: "K01 sentetik saha ikinci",
      yibf: "7654321",
      olay_aciklamasi: "Değişen içerikle ikinci paylaşım sözleşmesi",
    });
    shares.push(second);
    const secondPdf = await readPdf(page, second.viewToken);
    const firstPdfAfterSecondLink = await readPdf(page, first.viewToken);

    for (const pdf of [firstPdfBeforeSecondLink, secondPdf, firstPdfAfterSecondLink]) {
      expect(pdf.status).toBe(200);
      expect(pdf.contentType).toContain("application/pdf");
      expect(pdf.byteLength).toBeGreaterThan(1000);
    }
    expect(secondPdf.sha256).not.toBe(firstPdfBeforeSecondLink.sha256);
    expect(firstPdfAfterSecondLink.sha256).toBe(firstPdfBeforeSecondLink.sha256);
    expect(await readQuota(page)).toMatchObject({ status: 200, used: 2, reserved: 0, remaining: 48 });

    const secondTab = await page.context().newPage();
    await secondTab.goto("/", { waitUntil: "domcontentloaded" });
    expect(await readQuota(secondTab)).toMatchObject({ status: 200, used: 2, reserved: 0, remaining: 48 });
    await secondTab.close();

    secondBrowser = await chromium.launch({ headless: true });
    const independentContext = await secondBrowser.newContext({
      extraHTTPHeaders: sharedNatRequestHeaders(),
    });
    secondBrowserPage = await independentContext.newPage();
    await secondBrowserPage.goto("/", { waitUntil: "domcontentloaded" });
    await bootstrapIdentity(secondBrowserPage);
    expect(await readQuota(secondBrowserPage)).toMatchObject({ status: 200, used: 0, reserved: 0, remaining: 50 });

    const otherBrowserShare = await createShare(secondBrowserPage, {
      tarih: "24.10.2026",
      yer: "K02 aynı NAT, ayrı browser",
      yibf: "7654321",
      olay_aciklamasi: "Ayrı browser kimliği",
    });
    shares.push(otherBrowserShare);
    expect(await readQuota(secondBrowserPage)).toMatchObject({ status: 200, used: 1, reserved: 0, remaining: 49 });
    expect(await readQuota(page)).toMatchObject({ status: 200, used: 2, reserved: 0, remaining: 48 });
  } finally {
    for (const share of shares) {
      const cleanupPage = secondBrowserPage ?? page;
      expect(await revokeShare(cleanupPage, share)).toBe(200);
    }
    await secondBrowser?.close();
  }
});

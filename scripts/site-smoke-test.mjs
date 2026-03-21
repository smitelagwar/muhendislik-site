import http from "http";
import next from "next";
import puppeteer from "puppeteer";

const port = Number(process.argv[2] ?? "3005");
const baseUrl = `http://127.0.0.1:${port}`;
const sitemapUrl = new URL("/sitemap.xml", baseUrl).toString();

function normalizeUrl(url) {
  const parsed = new URL(url);
  const base = new URL(baseUrl);
  parsed.protocol = base.protocol;
  parsed.host = base.host;
  return parsed.toString();
}

function isHtmlLikeRoute(url) {
  return !/\.(?:xml|txt|svg|png|jpg|jpeg|webp|avif|ico)$/i.test(new URL(url).pathname);
}

function unique(list) {
  return [...new Set(list)];
}

const app = next({
  dev: false,
  dir: process.cwd(),
  hostname: "127.0.0.1",
  port,
});

await app.prepare();

const handle = app.getRequestHandler();
const server = http.createServer((request, response) => handle(request, response));

await new Promise((resolve) => {
  server.listen(port, "127.0.0.1", resolve);
});

const sitemapResponse = await fetch(sitemapUrl);

if (!sitemapResponse.ok) {
  throw new Error(`Unable to load sitemap: ${sitemapResponse.status} ${sitemapResponse.statusText}`);
}

const sitemapText = await sitemapResponse.text();
const urls = unique(
  [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => normalizeUrl(match[1]))
    .filter((url) => isHtmlLikeRoute(url)),
);

const browser = await puppeteer.launch({ headless: true });
const results = [];

for (const url of urls) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const requestFailures = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("requestfailed", (request) => {
    requestFailures.push({
      url: request.url(),
      error: request.failure()?.errorText ?? "unknown",
    });
  });

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  try {
    const response = await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const metrics = await page.evaluate(() => {
      const navEntry = performance.getEntriesByType("navigation")[0];
      const fcpEntry = performance.getEntriesByName("first-contentful-paint")[0];
      const lcpEntry = performance.getEntriesByType("largest-contentful-paint").at(-1);

      return {
        domContentLoaded: navEntry ? Math.round(navEntry.domContentLoadedEventEnd) : null,
        load: navEntry ? Math.round(navEntry.loadEventEnd) : null,
        firstContentfulPaint: fcpEntry ? Math.round(fcpEntry.startTime) : null,
        largestContentfulPaint: lcpEntry ? Math.round(lcpEntry.startTime) : null,
      };
    });

    results.push({
      url,
      finalUrl: page.url(),
      status: response?.status() ?? null,
      consoleErrors,
      requestFailures,
      pageErrors,
      metrics,
    });
  } catch (error) {
    results.push({
      url,
      finalUrl: url,
      status: null,
      consoleErrors,
      requestFailures,
      pageErrors: [...pageErrors, error instanceof Error ? error.message : String(error)],
      metrics: {
        domContentLoaded: null,
        load: null,
        firstContentfulPaint: null,
        largestContentfulPaint: null,
      },
    });
  } finally {
    await page.close();
  }
}

await browser.close();
await new Promise((resolve, reject) => {
  server.close((error) => {
    if (error) {
      reject(error);
      return;
    }

    resolve();
  });
});

const failedStatuses = results.filter((result) => result.status !== 200);
const pagesWithErrors = results.filter(
  (result) => result.consoleErrors.length > 0 || result.requestFailures.length > 0 || result.pageErrors.length > 0,
);
const slowestPages = [...results]
  .filter((result) => typeof result.metrics.load === "number")
  .sort((left, right) => (right.metrics.load ?? 0) - (left.metrics.load ?? 0))
  .slice(0, 15)
  .map((result) => ({
    url: result.url,
    load: result.metrics.load,
    domContentLoaded: result.metrics.domContentLoaded,
    firstContentfulPaint: result.metrics.firstContentfulPaint,
    largestContentfulPaint: result.metrics.largestContentfulPaint,
  }));

console.log(
  JSON.stringify(
    {
      baseUrl,
      pagesCrawled: results.length,
      failedStatuses,
      pagesWithErrors,
      slowestPages,
    },
    null,
    2,
  ),
);

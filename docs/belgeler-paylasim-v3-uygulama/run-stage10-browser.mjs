import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { PDFDocument, rgb } from "pdf-lib";
import { chromium } from "playwright";

const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, "../..");
const reportPath = resolve(evidence, "ASAMA_10_browser.json");
const checks = [];
const errors = [];
const started = Date.now();
let browser;
let server;
let temporary;
let fatal;
let failNextHttp = true;
let abortedHttp = 0;
const watchdog = setTimeout(async () => {
  console.error("ASAMA_10 browser deadline exceeded");
  await browser?.close().catch(() => {});
  server?.closeAllConnections();
  process.exit(124);
}, 180_000);
const check = (id, detail) => checks.push({ id, result: "PASS", detail });
async function fixture(count) {
  const pdf = await PDFDocument.create();
  for (let n = 0; n < count; n += 1) {
    const size = n === 0 ? [400, 600] : [800, 400];
    const page = pdf.addPage(size);
    page.drawRectangle({ x: 12, y: 12, width: size[0] - 24, height: size[1] - 24, borderColor: rgb(0, 0, 0), borderWidth: 3 });
    page.drawRectangle({ x: 30, y: 30, width: 100, height: 100, color: rgb(0.1, 0.3, 0.8) });
    page.drawText(`Synthetic page ${n + 1} (${size.join("x")})`, { x: 30, y: size[1] - 55, size: 20 });
  }
  return Buffer.from(await pdf.save());
}
async function ready(page) {
  await page.waitForFunction(() => {
    const canvas = document.querySelector('[data-testid="viewer-canvas"]');
    return canvas && canvas.style.visibility === "visible" && canvas.width > 0;
  }, null, { timeout: 8_000 });
}
async function blank(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('[data-testid="viewer-canvas"]');
    const data = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    let ink = 0;
    for (let i = 0; i < data.length; i += 16) if (data[i] < 200 || data[i + 1] < 200 || data[i + 2] < 200) ink += 1;
    const landscape = canvas.width / canvas.height > 1;
    const x = Math.floor(canvas.width * 80 / (landscape ? 800 : 400));
    const y = Math.floor(canvas.height * (1 - 80 / (landscape ? 400 : 600)));
    const marker = canvas.getContext("2d").getImageData(x, y, 1, 1).data;
    return ink < 100 || !(marker[0] < 80 && marker[1] < 120 && marker[2] > 150 && marker[3] === 255);
  });
}
async function mount(page, token = "two") { await page.evaluate((value) => window.viewerHarness.mount(value), token); await ready(page); }
async function unmount(page) {
  await page.evaluate(() => window.viewerHarness.unmount());
  await page.waitForFunction(() => !document.querySelector('[data-testid="share-viewer"]') && window.viewerHarness.stats.tasks === 0 && window.viewerHarness.stats.renders === 0 && window.viewerHarness.stats.pendingPages === 0, null, { timeout: 8_000 });
}
async function geometry(page) {
  return page.evaluate(() => {
    const viewport = document.querySelector('[data-testid="viewer-viewport"]');
    const canvas = document.querySelector('[data-testid="viewer-canvas"]');
    const bounds = canvas.getBoundingClientRect();
    const view = viewport.getBoundingClientRect();
    const buttons = [...document.querySelectorAll("button")].map((node) => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height }));
    return { width: bounds.width, height: bounds.height, left: bounds.left - view.left, top: bounds.top - view.top,
      viewWidth: viewport.clientWidth, viewHeight: viewport.clientHeight, documentOverflow: document.documentElement.scrollWidth > innerWidth,
      pixels: canvas.width * canvas.height, label: document.querySelector('[data-testid="viewer-zoom"]').textContent, buttons };
  });
}

try {
  temporary = await mkdtemp(resolve(tmpdir(), "belge-viewer-stage10-"));
  await build({ absWorkingDir: root, entryPoints: ["tests/belgeler/fixtures/share-viewer-harness.tsx"], outfile: resolve(temporary, "bundle.js"), bundle: true,
    platform: "browser", format: "esm", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"' }, logLevel: "silent" });
  const css = await postcss([tailwind({ base: root, transformAssetUrls: false })]).process(await readFile(resolve(root, "src/app/globals.css"), "utf8"), { from: resolve(root, "src/app/globals.css") });
  await writeFile(resolve(temporary, "style.css"), css.css);
  const [one, two] = await Promise.all([fixture(1), fixture(2)]);
  const publicRoot = resolve(root, "public");
  server = createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, "http://localhost").pathname;
      if (pathname.startsWith("/api/")) {
        if (pathname.includes("/slow/")) {
          const timer = setTimeout(() => { response.writeHead(200, { "Content-Type": "application/pdf" }); response.end(two); }, 300);
          response.once("close", () => { clearTimeout(timer); if (!response.writableEnded) abortedHttp += 1; });
          return;
        }
        if (pathname.includes("fail-once") && failNextHttp) { failNextHttp = false; response.writeHead(503); response.end("private failure"); return; }
        response.writeHead(200, { "Content-Type": "application/pdf", "Cache-Control": "no-store" }); response.end(pathname.includes("/one/") ? one : two); return;
      }
      if (pathname === "/") { response.writeHead(200, { "Content-Type": "text/html" }); response.end('<!doctype html><html lang="tr"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body><div id="root"></div><script type="module" src="/bundle.js"></script></body></html>'); return; }
      const path = pathname.startsWith("/vendor/") ? resolve(publicRoot, "." + pathname) : resolve(temporary, "." + pathname);
      if (!path.startsWith(publicRoot + sep) && !path.startsWith(temporary + sep)) { response.writeHead(403); response.end(); return; }
      const mime = { ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".wasm": "application/wasm" }[extname(path)] || "application/octet-stream";
      response.writeHead(200, { "Content-Type": mime }); response.end(await readFile(path));
    } catch { response.writeHead(404); response.end(); }
  });
  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  const url = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
  for (const width of [320, 390, 768, 1366]) for (const dpr of [1, 2, 3]) {
    const context = await browser.newContext({ viewport: { width, height: 850 }, deviceScaleFactor: dpr, reducedMotion: "reduce" });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url, { timeout: 30_000 });
    await page.waitForFunction(() => !!window.viewerHarness, null, { timeout: 8_000 });
    await mount(page);
    let g = await geometry(page);
    assert.equal(g.documentOverflow, false);
    assert.ok(g.width <= g.viewWidth - 30);
    assert.ok(g.left >= 0 && g.top >= 0);
    assert.ok(g.buttons.every((button) => button.width >= 44 && button.height >= 44));
    assert.equal(await blank(page), false);
    assert.ok(Math.abs(parseInt(g.label) - g.width / 400 * 100) <= 1);
    if (width === 320 && dpr === 3) {
      await page.screenshot({ path: resolve(evidence, "ASAMA_10_320_light.png") });
      await page.locator("html").evaluate((node) => node.classList.add("dark"));
      await page.waitForTimeout(100); await ready(page);
      assert.equal(await blank(page), false, "dark canvas must keep the synthetic blue marker");
      await page.screenshot({ path: resolve(evidence, "ASAMA_10_320_dark.png") });
      await page.locator("html").evaluate((node) => node.classList.remove("dark"));
    }
    await page.getByRole("button", { name: "Sonraki Sayfa", exact: true }).click(); await ready(page);
    g = await geometry(page);
    assert.ok(Math.abs(g.width / g.height - 2) < 0.01);
    await page.getByRole("button", { name: "Sayfaya Sığdır", exact: true }).click(); await ready(page);
    g = await geometry(page);
    assert.ok(g.height <= g.viewHeight - 30 && g.width <= g.viewWidth - 30);
    await page.getByTestId("viewer-viewport").focus();
    for (let i = 0; i < 20; i += 1) await page.keyboard.press("+");
    await ready(page); g = await geometry(page);
    assert.ok(g.pixels <= 8_000_000);
    assert.ok(Math.abs(parseInt(g.label) - g.width / 800 * 100) <= 1);
    await page.getByTestId("viewer-viewport").evaluate((node) => { node.scrollTo(0, 0); });
    g = await geometry(page); assert.ok(g.left >= 0 && g.top >= 0, "top/left must remain reachable at high zoom");
    await page.getByRole("button", { name: "Genişliğe Sığdır", exact: true }).click(); await ready(page);
    await page.setViewportSize({ width: width < 768 ? 768 : 390, height: 650 }); await ready(page);
    await page.waitForTimeout(80); await ready(page);
    g = await geometry(page); assert.ok(g.width <= g.viewWidth - 30 && !g.documentOverflow);
    await page.locator("html").evaluate((node) => node.classList.add("dark"));
    await page.waitForTimeout(100); await ready(page);
    assert.equal(await blank(page), false);
    await unmount(page);
    check(`geometry-${width}-dpr${dpr}`, "real PDF.js: mixed page sizes, fit, zoom label, 44px controls, resize, dark, canvas budget");
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 3 });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url); await page.waitForFunction(() => !!window.viewerHarness, null, { timeout: 8_000 });
  await mount(page, "one"); assert.equal(await page.getByRole("button", { name: "Sonraki Sayfa", exact: true }).count(), 0);
  assert.match(await page.locator("time").textContent(), /30 Ekim 2026/);
  await page.screenshot({ path: resolve(evidence, "ASAMA_10_390_light.png") });
  check("one-page-expiry", "one-page PDF rendered; actual expiry is displayed");

  const cdp = await context.newCDPSession(page);
  const view = await page.getByTestId("viewer-viewport").boundingBox();
  const y = view.y + 160;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 140, y, id: 1 }, { x: 240, y, id: 2 }] });
  for (let n = 0; n < 6; n += 1) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 140 - n * 12, y, id: 1 }, { x: 240 + n * 12, y, id: 2 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await ready(page);
  let g = await geometry(page); assert.ok(g.width > g.viewWidth);
  const panBefore = await page.getByTestId("viewer-viewport").evaluate((node) => node.scrollLeft);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 270, y, id: 3 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 100, y: y - 50, id: 3 }] });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  assert.ok(await page.getByTestId("viewer-viewport").evaluate((node) => node.scrollLeft) > panBefore);
  check("real-touch-pinch-pan", "Chromium CDP touch events: scale grows and one-finger drag scrolls");
  await unmount(page);

  await cdp.send("HeapProfiler.collectGarbage");
  const beforeHeap = await cdp.send("Runtime.getHeapUsage");
  const beforeDom = await cdp.send("Memory.getDOMCounters");
  for (let i = 0; i < 30; i += 1) { await mount(page); await unmount(page); }
  await cdp.send("HeapProfiler.collectGarbage");
  const afterHeap = await cdp.send("Runtime.getHeapUsage");
  const afterDom = await cdp.send("Memory.getDOMCounters");
  const resources = await page.evaluate(async () => ({ ...window.viewerHarness.stats, sameWorker: await window.viewerHarness.sameWorker() }));
  assert.equal(resources.tasks, 0); assert.equal(resources.documents, 0); assert.equal(resources.renders, 0); assert.equal(resources.workerDestroyed, 0); assert.equal(resources.sameWorker, true);
  assert.ok(afterHeap.usedSize - beforeHeap.usedSize < 12 * 1024 * 1024, "30 cycles must stay within a 12MiB post-GC heap growth budget");
  assert.ok(afterDom.nodes - beforeDom.nodes < 100, "detached DOM must not accumulate per mount");
  check("30-mount-unmount", { ...resources, beforeHeap: beforeHeap.usedSize, afterHeap: afterHeap.usedSize, heapGrowthLimitBytes: 12 * 1024 * 1024, beforeDom, afterDom });
  const slowRequest = page.waitForRequest("**/api/belgeler/paylasim/slow/pdf");
  await page.evaluate(() => window.viewerHarness.mount("slow"));
  await slowRequest; await unmount(page);
  await page.waitForTimeout(50);
  assert.ok(abortedHttp > 0);
  check("unmount-fetch-abort", "real local HTTP request aborted before delayed PDF response");
  await mount(page);
  await page.evaluate(() => window.viewerHarness.update("one"));
  await page.waitForFunction(() => !document.querySelector('[aria-label="Sonraki Sayfa"]'), null, { timeout: 8_000 });
  await ready(page);
  assert.equal(await page.evaluate(() => window.viewerHarness.stats.tasks), 1);
  assert.equal(await blank(page), false);
  await unmount(page);
  check("same-canvas-token-change", "prior document teardown settles before replacement starts");
  await mount(page);
  await page.evaluate(() => { window.viewerHarness.fault.pageDelayMs = 30; });
  for (let n = 0; n < 20; n += 1) {
    await page.getByRole("button", { name: n % 2 ? "Önceki Sayfa" : "Sonraki Sayfa", exact: true }).click();
    await page.getByRole("button", { name: "Yakınlaştır", exact: true }).click();
  }
  await ready(page);
  assert.equal(await blank(page), false);
  assert.equal(await page.evaluate(() => window.viewerHarness.stats.maximumRenders), 1);
  check("20-rapid-page-zoom", "delayed getPage; no overlapping render and final canvas has ink");
  await page.evaluate(() => { window.viewerHarness.fault.renderOnce = true; });
  await page.getByRole("button", { name: "Genişliğe Sığdır", exact: true }).click();
  await page.getByRole("button", { name: "Sayfayı Yeniden Dene", exact: true }).waitFor({ timeout: 8_000 });
  await page.getByRole("button", { name: "Sayfayı Yeniden Dene", exact: true }).click(); await ready(page);
  assert.equal(await blank(page), false); check("render-failure-retry", "visible error and successful page retry");
  await unmount(page);
  await page.evaluate(() => window.viewerHarness.mount("fail-once"));
  await page.getByRole("button", { name: "Yeniden Dene", exact: true }).waitFor({ timeout: 8_000 });
  await page.getByRole("button", { name: "Yeniden Dene", exact: true }).click(); await ready(page);
  assert.equal(await blank(page), false); check("fetch-failure-retry", "HTTP503 visible; retry opens the actual fixture");
  await unmount(page);
  assert.deepEqual(errors, []);
  check("unhandled-errors", "zero page errors/unhandled rejections");
  await context.close();
} catch (error) { fatal = error instanceof Error ? error.stack : String(error); process.exitCode = 1; }
finally {
  await browser?.close().catch(() => {});
  if (server) await new Promise((resolveClose) => { server.closeAllConnections(); server.close(resolveClose); });
  if (temporary) {
    const expectedPrefix = resolve(tmpdir()) + sep + "belge-viewer-stage10-";
    if (!resolve(temporary).startsWith(expectedPrefix)) throw new Error("Unexpected temporary directory");
    await rm(temporary, { recursive: true, force: true });
  }
  clearTimeout(watchdog);
  const report = { environment: "isolated esbuild React harness using actual component, shared PDF.js 6.3.289 and synthetic local PDFs; no backend/DB/Blob calls", result: fatal ? "FAIL" : "PASS", checks, errors, fatal, durationMs: Date.now() - started, physicalPhones: "NOT_RUN" };
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  process.exit(process.exitCode || 0);
}

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";

const evidence = dirname(fileURLToPath(import.meta.url));
const root = resolve(evidence, "../..");
const baseline = process.argv.includes("--baseline");
const production = process.argv.includes("--production");
const build = process.argv.includes("--build") || production;
const mode = production ? "after-production" : `${baseline ? "before" : "after"}${build ? "-build" : ""}`;
const checks = [];
const names = ["ready", "unknown", "revoked", "expired", "pending", "db-down", "storage-null", "storage-throw", "purged-revoked", "error"];
const token = (name) => createHash("sha256").update(`isolated-stage11-${name}`).digest("base64url");
const scrub = (value) => names.reduce((text, name) => text.replaceAll(token(name), `[fixture:${name}]`), String(value));
const timeoutMs = build ? 240_000 : 180_000;
const started = Date.now();
let fixture, browser, child, fatal;
let output = "";
let report = {};
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" };
for (const name of Object.keys(env)) if (/DATABASE|POSTGRES|NEON|BLOB|VERCEL|BELGE_SHARE|CRON_SECRET|SHARE_TOKEN|NODE_OPTIONS|NODE_PATH|NEXT_DIST_DIR/i.test(name)) delete env[name];
function save(path, text) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text); }
function check(id, detail) { checks.push({ id, result: "PASS", detail }); }
function kill() {
  if (!child || child.exitCode !== null) return Promise.resolve();
  return new Promise((done) => {
    if (process.platform === "win32") {
      const killer = spawn("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
      killer.on("close", done); killer.on("error", done);
    } else { child.kill("SIGKILL"); child.once("close", done); }
  });
}
function launch(args) {
  child = spawn(process.execPath, [join(root, "node_modules/next/dist/bin/next"), ...args], { cwd: fixture, env: { ...env, NODE_ENV: build ? "production" : "development" }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  child.stdout.on("data", (chunk) => { output += scrub(chunk); });
  child.stderr.on("data", (chunk) => { output += scrub(chunk); });
  return child;
}
async function prepare() {
  fixture = mkdtempSync(join(tmpdir(), "belge-stage11-"));
  // Copy sources, never .env / credentials / existing build output. Only selected app routes are included.
  cpSync(join(root, "src"), join(fixture, "src"), { recursive: true, filter: (path) => path !== join(root, "src/app") });
  for (const path of ["layout.tsx", "globals.css", "home.css", "fonts", "error.tsx", "robots.ts", "opengraph-image.tsx", "b", "api/belgeler/paylasim/[token]/pdf"]) {
    cpSync(join(root, "src/app", path), join(fixture, "src/app", path), { recursive: true });
  }
  for (const path of ["next.config.ts", "postcss.config.mjs"]) cpSync(join(root, path), join(fixture, path));
  save(join(fixture, "package.json"), JSON.stringify({ name: "stage11-isolated-next-fixture", private: true, dependencies: { next: "16.4.2", react: "19.2.3", "react-dom": "19.2.3" } }));
  save(join(fixture, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2017", lib: ["dom", "dom.iterable", "esnext"], strict: true, allowJs: true, skipLibCheck: true, esModuleInterop: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, isolatedModules: true, jsx: "react-jsx", paths: { "@/*": ["./src/*"] } }, include: ["next-env.d.ts", "src/app/**/*.ts", "src/app/**/*.tsx", ".next/types/**/*.ts"], exclude: ["node_modules"] }));
  save(join(fixture, "tsconfig.next.json"), JSON.stringify({ extends: "./tsconfig.json" }));
  symlinkSync(join(root, "node_modules"), join(fixture, "node_modules"), "junction");
  cpSync(join(root, "public/vendor/pdfjs"), join(fixture, "public/vendor/pdfjs"), { recursive: true });
  const pdf = await PDFDocument.create(); pdf.addPage([400, 600]).drawText("Isolated stage 11");
  const bytes = await pdf.save();
  save(join(fixture, "stage11.pdf"), bytes);
  let fixtureData = readFileSync(join(root, "tests/belgeler/fixtures/stage11-data.ts"), "utf8").replace('../../../src/lib/belge-paylasim/types', './types');
  save(join(fixture, "src/lib/belge-paylasim/stage11-data.ts"), fixtureData);
  // Only the disposable copy installs adapters. Product factories retain their production guard.
  const repoFile = join(fixture, "src/lib/belge-paylasim/repository.ts");
  save(repoFile, readFileSync(repoFile, "utf8") + `\nimport {stage11Names, stage11Token, stage11Record} from './stage11-data';\nimport {readFileSync} from 'node:fs';\nimport {createHash} from 'node:crypto';\nconst stage11Repo = new MemoryBelgePaylasimRepository();\nconst stage11Size = readFileSync('stage11.pdf').byteLength;\nstage11Repo.findByTokenHash = async (hash) => { const name = stage11Names.find(n=>createHash('sha256').update(stage11Token(n)).digest('hex')===hash); if(name==='db-down') throw new Error('synthetic database outage'); if(!name || name==='unknown') return null; return stage11Record(name,stage11Size); };\nactiveRepository = stage11Repo;\n`);
  const blobFile = join(fixture, "src/lib/belge-paylasim/blob-store.ts");
  save(blobFile, readFileSync(blobFile, "utf8") + `\nimport {readFileSync} from 'node:fs';\nactiveBlobStore = { async get(path) { if(path.includes('storage-null')) return null; if(path.includes('storage-throw')) throw new Error('synthetic storage outage'); const b = readFileSync('stage11.pdf'); return new Response(b); }, async put(){throw new Error('writes forbidden');}, async del(){throw new Error('writes forbidden');}, async list(){return {blobs:[],hasMore:false};} };\n`);
  if (baseline) save(join(fixture, "src/app/layout.tsx"), readFileSync(join(evidence, "ASAMA_11_root-before.txt"), "utf8"));
  const middlewareSource = baseline ? join(evidence, "ASAMA_11_middleware-before.txt") : join(root, "src/middleware.ts");
  if (existsSync(middlewareSource)) cpSync(middlewareSource, join(fixture, "src/middleware.ts"));
  report.productSourceHashes = ["next.config.ts", "src/app/layout.tsx", "src/app/b/[token]/page.tsx", "src/app/b/[token]/layout.tsx", "src/app/b/[token]/error.tsx", "src/components/site-shell.tsx", "src/components/belge-paylasim/share-access-state.tsx", "src/app/api/belgeler/paylasim/[token]/pdf/route.ts", "src/lib/belge-paylasim/config.ts", "src/lib/belge-paylasim/service-core.ts"].filter(file=>existsSync(join(fixture,file))).map(file=>({file,sha256:createHash("sha256").update(readFileSync(join(fixture,file))).digest("hex")}));
  // Test driver uses Next's real router. It does not choose or change the shell.
  save(join(fixture, "src/components/stage11-driver.tsx"), `'use client';\nimport {useRouter} from 'next/navigation'; import {useEffect} from 'react';\nexport function Stage11Driver(){ const router=useRouter(); useEffect(()=>{Object.assign(window,{stage11Router:router,stage11Hydrated:true});},[router]); return null; }`);
  const layoutFile = join(fixture, "src/app/layout.tsx");
  save(layoutFile, `import {Stage11Driver} from '@/components/stage11-driver';\n` + readFileSync(layoutFile, "utf8").replace('<ThemeProvider attribute=', '<Stage11Driver /><ThemeProvider attribute='));
  // Footer currently returns null: instrument its mount in the copy so exclusion can be asserted.
  const footerFile = join(fixture, "src/components/footer.tsx");
  save(footerFile, readFileSync(footerFile, "utf8").replace('return null;', 'return <span data-testid="stage11-footer-mounted" hidden />;'));
  for (const path of ["page.tsx", "stage11-normal/page.tsx"]) save(join(fixture, "src/app", path), `export default function Page(){ return <h1>Stage 11 normal site fixture</h1>; }`);
  // Deliberate server render fault, only in disposable fixture, exercises the actual route boundary.
  const pageFile = join(fixture, "src/app/b/[token]/page.tsx");
  save(pageFile, readFileSync(pageFile, "utf8").replace('const { token } = await params;', `const { token } = await params; if(token === '${token("error")}') throw new Error('isolated render fault');`));
}
async function availablePort() {
  return new Promise((done, reject) => { const probe = createServer(); probe.once("error", reject); probe.listen(0, "127.0.0.1", () => { const port = probe.address().port; probe.close(() => done(port)); }); });
}
async function main() {
  const watchdog = setTimeout(async () => {
    fatal = "TIMEOUT";
    save(join(evidence,`ASAMA_11_next-${mode}.json`),JSON.stringify({result:"FAIL",mode,checks,timedOut:true,timeoutMs,durationMs:Date.now()-started})+"\n");
    // A second timer also bounds teardown if the browser or taskkill stops responding.
    const hardStop = setTimeout(()=>process.exit(124),5000);
    await kill(); if(browser) await browser.close().catch(()=>{});
    clearTimeout(hardStop); process.exit(124);
  }, timeoutMs);
  try {
    await prepare();
    if (build) {
      const proc = launch(["build", "--webpack"]);
      const code = await new Promise((done) => { proc.on("error", () => done(1)); proc.on("close", done); });
      assert.equal(code, 0, output.slice(-3000));
      const manifest = JSON.parse(readFileSync(join(fixture, ".next/prerender-manifest.json"), "utf8"));
      report.prerendered = Object.keys(manifest.routes);
      report.dynamic = Object.keys(manifest.dynamicRoutes);
      check("representative-next-build", { normalPrerendered: !!manifest.routes["/stage11-normal"], rootHeaders: baseline });
      assert.equal(!!manifest.routes["/stage11-normal"], !baseline);
      if (!production) return;
    }
    const port = await availablePort();
    const origin = `http://127.0.0.1:${port}`;
    launch([...(production ? ["start"] : ["dev", "--webpack"]), "--hostname", "127.0.0.1", "--port", String(port)]);
    for (let attempts=0; attempts<100; attempts++) {
      try { const r=await fetch(origin, { signal: AbortSignal.timeout(1500) }); if(r.ok) break; } catch { /* compilation */ }
      assert.equal(child.exitCode, null, "server exited early");
      await new Promise(done=>setTimeout(done,200));
    }
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.setDefaultTimeout(8000); page.setDefaultNavigationTimeout(45000);
    const errors=[]; page.on("pageerror", (error)=>errors.push(scrub(error.message)));
    const leakedReferrers=[];
    page.on("request", (request)=>{const referrer=request.headers().referer??""; if(names.some(name=>referrer.includes(token(name)))) leakedReferrers.push(scrub(referrer));});
    await page.goto(origin + "/stage11-normal"); await page.waitForFunction(()=>window.stage11Hydrated);
    await page.locator("[data-site-header]").waitFor(); await page.locator("#dok-overlay-root").waitFor({state:"attached"});
    check("normal-direct", "Navbar and overlays mounted; Footer mount instrumented in copy");
    await page.evaluate((url)=>window.stage11Router.prefetch(url), "/b/"+token("unknown"));
    await page.evaluate((url)=>window.stage11Router.push(url), "/b/"+token("unknown"));
    await page.getByRole("heading",{name:"Belge Bulunamadı"}).waitFor();
    const shell = await page.evaluate(()=>({navbar:!!document.querySelector("[data-site-header]"),overlays:!!document.querySelector("#dok-overlay-root"),footer:!!document.querySelector('[data-testid="stage11-footer-mounted"]')}));
    if (baseline) {
      assert.ok(shell.navbar && shell.overlays && shell.footer, "baseline defect must be observed");
      check("F07-reproduced", shell);
      await page.goto(origin+"/b/"+token("unknown")); await page.waitForFunction(()=>window.stage11Hydrated);
      await page.evaluate(()=>window.stage11Router.push("/stage11-normal"));
      await page.getByRole("heading",{name:"Stage 11 normal site fixture"}).waitFor();
      assert.equal(await page.locator("[data-site-header]").count(),0);
      check("F07-reverse-reproduced", "normal site loses chrome after direct viewer -> client navigation");
      return;
    }
    assert.deepEqual(shell,{navbar:false,overlays:false,footer:false});
    check("prefetch-client-entry-isolated", shell);
    const isolated = async () => { assert.equal(await page.locator("[data-site-header],#dok-overlay-root,[data-testid=stage11-footer-mounted]").count(),0); };
    const normal = async () => { await page.locator("[data-site-header]").waitFor(); assert.equal(await page.locator("#dok-overlay-root,[data-testid=stage11-footer-mounted]").count(),2); };
    await page.goBack(); await page.getByRole("heading",{name:"Stage 11 normal site fixture"}).waitFor(); await normal(); check("back-normal");
    await page.goForward(); await page.getByRole("heading",{name:"Belge Bulunamadı"}).waitFor(); await isolated(); check("forward-isolated");
    await page.reload(); await page.getByRole("heading",{name:"Belge Bulunamadı"}).waitFor(); await isolated(); check("reload-isolated");
    await page.waitForFunction(()=>window.stage11Hydrated); await page.evaluate(()=>window.stage11Router.push("/stage11-normal"));
    await page.getByRole("heading",{name:"Stage 11 normal site fixture"}).waitFor(); await normal(); check("viewer-to-normal-client");
    const expected = {ready:null,unknown:"Belge Bulunamadı",revoked:"Bağlantı İptal Edildi",expired:"Süre Doldu",pending:"Belge Hazırlanıyor","db-down":"Belgeye Şu Anda Erişilemiyor","purged-revoked":"Bağlantı İptal Edildi"};
    const http=[];
    for(const [name,title] of Object.entries(expected)) {
      const response=await page.goto(origin+"/b/"+token(name));
      assert.equal(response.status(),200,"HTML state is a deliberate 200 status screen");
      const headers=response.headers();
      for(const [key,pattern] of Object.entries({"cache-control":/private.*no-store/,"referrer-policy":/^no-referrer$/,"x-robots-tag":/noindex.*noarchive/,"x-content-type-options":/^nosniff$/})) assert.match(headers[key]??"",pattern);
      if(title) await page.getByRole("heading",{name:title}).waitFor();
      else { await page.getByTestId("share-viewer").waitFor(); await page.waitForFunction(()=>{const c=document.querySelector('[data-testid="viewer-canvas"]');return c?.width>0&&c?.height>0&&getComputedStyle(c).visibility==="visible";}); }
      await isolated();
      assert.equal(await page.locator('meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"]').count(),0);
      assert.equal(await page.locator('meta[name="referrer"]').getAttribute("content"),"no-referrer");
      assert.match(await page.locator('meta[name="robots"]').getAttribute("content"),/noarchive/);
      assert.ok(!(await page.evaluate(()=>JSON.stringify({...sessionStorage}))).includes(token(name)));
      http.push({name,status:response.status(),headers:{"cache-control":headers["cache-control"],"referrer-policy":headers["referrer-policy"],"x-robots-tag":headers["x-robots-tag"],"x-content-type-options":headers["x-content-type-options"]}});
      check(`html-${name}-state-headers-metadata`);
      if(name==="db-down") await page.screenshot({path:join(evidence,"ASAMA_11_unavailable_mobile.png"),fullPage:true});
      if(name==="pending" || name==="db-down") assert.ok(await page.getByRole("button",{name:"Yeniden dene"}).isVisible());
      const head=await fetch(origin+"/b/"+token(name),{method:"HEAD",signal:AbortSignal.timeout(10000)});
      assert.equal(head.status,200);assert.equal((await head.arrayBuffer()).byteLength,0);assert.match(head.headers.get("cache-control"),/private.*no-store/);
    }
    report.html=http;
    const beforeErrorCount=errors.length;
    const errorResponse=await page.goto(origin+"/b/"+token("error"));
    await page.getByRole("heading",{name:"Belge Görüntülenemedi"}).waitFor(); await isolated();
    assert.match(errorResponse.headers()["cache-control"],/private.*no-store/);
    assert.equal(errorResponse.headers()["referrer-policy"],"no-referrer");
    assert.match(errorResponse.headers()["x-robots-tag"],/noindex.*noarchive/);
    check("server-error-boundary-isolated",{status:errorResponse.status(),expectedFaults:errors.length-beforeErrorCount});
    await page.screenshot({path:join(evidence,"ASAMA_11_error_boundary.png"),fullPage:true});
    await page.goto(origin+"/stage11-normal");await page.waitForFunction(()=>window.stage11Hydrated);
    for(const [name,title] of Object.entries(expected)) {
      await page.evaluate((url)=>window.stage11Router.prefetch(url),"/b/"+token(name));
      await page.evaluate((url)=>window.stage11Router.push(url),"/b/"+token(name));
      if(title) await page.getByRole("heading",{name:title}).waitFor(); else await page.getByTestId("share-viewer").waitFor();
      await isolated();check(`client-state-${name}-isolated`);
    }
    // Real HTTP route handlers + real service lifecycle, in-memory adapters in the copied tree.
    const api=[];
    for(const [name,status] of Object.entries({ready:200,unknown:404,revoked:410,expired:410,pending:425,"db-down":503,"storage-null":502,"storage-throw":502,"purged-revoked":410})) {
      for(const method of ["GET","HEAD"]) {
        const r=await fetch(origin+"/api/belgeler/paylasim/"+token(name)+"/pdf",{method,signal:AbortSignal.timeout(10000)});
        const expectedStatus=method==="HEAD" && name.startsWith("storage-") ? 200 : status;
        assert.equal(r.status,expectedStatus,`${name} ${method}`);
        for(const [key,pattern] of Object.entries({"cache-control":/private.*no-store/,"referrer-policy":/^no-referrer$/,"x-robots-tag":/noindex.*noarchive/,"x-content-type-options":/^nosniff$/})) assert.match(r.headers.get(key)??"",pattern);
        if(method==="HEAD") assert.equal((await r.arrayBuffer()).byteLength,0);
        else await r.arrayBuffer();
        api.push({name,method,status:r.status});
      }
      check(`http-get-head-${name}`);
    }
    const range=await fetch(origin+"/api/belgeler/paylasim/"+token("ready")+"/pdf",{headers:{Range:"bytes=0-10"},signal:AbortSignal.timeout(10000)});
    assert.equal(range.status,200);assert.equal(range.headers.get("accept-ranges"),null);assert.equal(range.headers.get("content-range"),null);
    assert.ok((await range.arrayBuffer()).byteLength>11);check("range-full200-no-range-promise");
    for(const [method,path,status] of [["GET","/b/invalid/extra",404],["GET","/api/belgeler/paylasim/bad/pdf",400],["POST","/api/belgeler/paylasim/"+token("ready")+"/pdf",405],["OPTIONS","/api/belgeler/paylasim/"+token("ready")+"/pdf",204]]) {
      const r=await fetch(origin+path,{method,signal:AbortSignal.timeout(10000)});
      assert.equal(r.status,status);
      assert.match(r.headers.get("cache-control"),/private.*no-store/);assert.equal(r.headers.get("referrer-policy"),"no-referrer");
      assert.match(r.headers.get("x-robots-tag"),/noindex.*noarchive/);assert.equal(r.headers.get("x-content-type-options"),"nosniff");
      await r.arrayBuffer();check(`additional-http-${status}-security`);
    }
    report.api=api;
    const robots=await fetch(origin+"/robots.txt",{signal:AbortSignal.timeout(10000)});assert.match(await robots.text(),/Disallow: \/b\//);check("robots-disallow");
    assert.equal(beforeErrorCount,0,errors.join("\n"));check("no-unexpected-browser-errors");
    assert.deepEqual(leakedReferrers,[]);check("no-token-referrer-on-browser-requests");
  } catch(error) { fatal=scrub(error.stack??error); process.exitCode=1; }
  finally {
    if(browser) await browser.close().catch(()=>{});
    await kill();
    clearTimeout(watchdog);
    // Verify absolute temp containment before recursive cleanup. Never remove the node_modules junction target.
    if(fixture && fixture.startsWith(join(resolve(tmpdir()),"belge-stage11-"))) {
      rmSync(join(fixture,"node_modules"),{force:true}); rmSync(fixture,{recursive:true,force:true,maxRetries:3});
    }
    save(join(evidence,`ASAMA_11_next-${mode}.log`),scrub(output));
    report={...report,result:fatal?"FAIL":"PASS",mode,scope:"real Next HTTP/router + copied product sources, isolated memory read/Blob adapters; no real DB/Blob",checks,passed:checks.length,failed:fatal?1:0,skipped:0,timeoutMs,durationMs:Date.now()-started,error:fatal??null};
    save(join(evidence,`ASAMA_11_next-${mode}.json`),JSON.stringify(report,null,2)+"\n");
    console.log(JSON.stringify({result:report.result,mode,passed:report.passed,failed:report.failed,skipped:report.skipped,durationMs:report.durationMs,error:report.error},null,2));
    process.exit(process.exitCode??0);
  }
}
await main();

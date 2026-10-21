# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cad-v2-l11-browser-release.spec.ts >> CAD V2 L11 browser release — R002/R003/R004 >> cold host open + warm host reopen, 30 interactions and settled raster
- Location: tests\document-studio\cad-v2-l11-browser-release.spec.ts:354:7

# Error details

```
Error: R003 cold 0 produced no nonempty canvas raster within 600000 ms: {"firstViewerDrawEpochMs":1792410917187.6,"drawCalls":64006852,"progress":"DWG Motor V2 Hazırlanıyorİndirilen 17764/19529 · Doğrulanan 17764/19529 · Görünür 17764/19527 · Çizilen 0/19529İptal Et","hostEventCount":40564,"acceptedChunkCount":20274,"rejectedChunkCount":0}
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - link "Ana içeriğe atla" [ref=e3] [cursor=pointer]:
      - /url: "#main-content"
    - banner [ref=e4]:
      - generic [ref=e7]:
        - generic [ref=e8]:
          - link [ref=e10] [cursor=pointer]:
            - /url: /
            - img "İnşa Blog" [ref=e11]
          - navigation "Ana navigasyon" [ref=e12]:
            - link "Ana Sayfa" [ref=e13] [cursor=pointer]:
              - /url: /
            - link "Mevzuat" [ref=e18] [cursor=pointer]:
              - /url: /kategori/deprem-yonetmelik
            - link "Hesaplamalar" [ref=e24] [cursor=pointer]:
              - /url: /hesaplamalar
            - link "Araçlar" [ref=e28] [cursor=pointer]:
              - /url: /kategori/araclar
            - link "Belgeler" [ref=e32] [cursor=pointer]:
              - /url: /belgeler
            - link "Dokümantasyon" [ref=e38] [cursor=pointer]:
              - /url: /dokumantasyon
        - generic [ref=e44]:
          - button "İçerik, araç veya konu ara" [ref=e45] [cursor=pointer]:
            - generic [ref=e49]: İçerik, araç veya konu ara...
            - generic [ref=e50]: Ctrl K
          - button "İçeriği paylaş" [ref=e52] [cursor=pointer]: Paylaş
          - switch "Tema görünümünü değiştir" [checked] [ref=e56]
    - main [ref=e70]:
      - generic [ref=e72]:
        - generic [ref=e73]:
          - generic [ref=e79]:
            - generic [ref=e80]:
              - heading "Dokümantasyon Modülü" [level=1] [ref=e81]
              - generic [ref=e82]: Admin
              - generic [ref=e83]: Yerel Geliştirme (Local)
            - paragraph [ref=e87]: Özel dosya depolama, klasörleme ve süreli link paylaşım paneli
          - generic [ref=e88]: admin
        - generic [ref=e95]:
          - status [ref=e96]
          - complementary [ref=e98]:
            - generic [ref=e99]:
              - button "Yeni Dosya Yükle" [ref=e100] [cursor=pointer]
              - button "Yeni Klasör Oluştur" [ref=e102] [cursor=pointer]
            - generic [ref=e104]:
              - text: Gezinti
              - button "Tüm Dosyalarım 0" [ref=e105]:
                - generic [ref=e106]: Tüm Dosyalarım
                - generic [ref=e110]: "0"
              - button "Son Açılanlar" [ref=e111]
              - button "Yıldızlı Dosyalar" [ref=e117]
            - generic [ref=e122]:
              - text: Kategori Filtresi
              - button "AutoCAD (DWG / DXF)" [ref=e123]
              - button "PDF Dokümanları" [ref=e129]
              - button "Görseller & Fotoğraflar" [ref=e135]
            - generic [ref=e142]:
              - text: Yönetim
              - button "Aktif Paylaşımlar" [ref=e143]
              - button "Çöp Kutusu" [ref=e151]
            - generic [ref=e157]:
              - generic [ref=e158]:
                - generic [ref=e159]: Depolama
                - generic [ref=e165]: 0 B
              - generic [ref=e166]:
                - generic [ref=e167]: 0 klasör
                - generic [ref=e168]: •
                - generic [ref=e169]: 0 dosya
          - generic [ref=e170]:
            - generic [ref=e171]:
              - button "Kök Dizin" [ref=e173]
              - generic [ref=e178]:
                - button "Sırala" [ref=e179] [cursor=pointer]
                - button "Grupla" [ref=e181] [cursor=pointer]
                - button "Ara... /" [ref=e183] [cursor=pointer]:
                  - generic [ref=e184]: Ara...
                  - generic [ref=e185]: /
                - button "Dosya filtreleri" [ref=e186] [cursor=pointer]:
                  - generic [ref=e187]: Filtre
                - button "Dosya yükle" [ref=e188] [cursor=pointer]:
                  - generic [ref=e189]: Yükle
                - button "Klasör yükle" [ref=e190] [cursor=pointer]:
                  - generic [ref=e191]: Klasör
                - button "Yeni Klasör" [ref=e192] [cursor=pointer]
                - generic [ref=e194]:
                  - button "Liste Görünümü" [ref=e195]
                  - button "Kart (Grid) Görünümü" [ref=e197]
                - button "Öğe Bilgi ve Detay Çekmecesi" [ref=e203] [cursor=pointer]
            - generic [ref=e205]:
              - heading "Bu Klasör Henüz Boş" [level=3] [ref=e209]
              - paragraph [ref=e210]: Bu klasöre yeni dosya yükleyebilir veya alt klasör oluşturabilirsiniz.
              - generic [ref=e211]:
                - button "Dosya Yükle" [ref=e212] [cursor=pointer]
                - button "Yeni Klasör" [ref=e214] [cursor=pointer]
  - region "Notifications alt+T"
  - alert [ref=e216]
```

# Test source

```ts
  493 |           failedChunkRequestCount: 0,
  494 |         };
  495 |         state.activeRun = run;
  496 |         state.runStartedAtMs = performance.now();
  497 |         const rendererIssueStart = state.rendererIssues.length;
  498 |         const startedAt = performance.now();
  499 |         const startedAtEpochMs = Date.now();
  500 |         const rasterSamples: Array<{
  501 |           elapsedMs: number;
  502 |           raster: ReturnType<typeof measureRaster>;
  503 |           sha256: string;
  504 |           screenshot?: Buffer;
  505 |         }> = [];
  506 |         if (label === "cold") {
  507 |           const cacheSession = await page.context().newCDPSession(page);
  508 |           try {
  509 |             await cacheSession.send("Network.clearBrowserCache");
  510 |           } finally {
  511 |             await cacheSession.detach();
  512 |           }
  513 |         }
  514 |         const prepareResponsePromise = page.waitForResponse((response) => {
  515 |           if (response.request().method() !== "POST") return false;
  516 |           try { return new URL(response.url()).pathname === "/api/dokumantasyon/cad-v2/prepare"; } catch { return false; }
  517 |         }, { timeout: settledHostTimeoutMs });
  518 |         if (reopen) await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
  519 |         else await page.goto(fileUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
  520 |         const prepareResponse = await prepareResponsePromise;
  521 |         run.prepareResponseStatus = prepareResponse.status();
  522 |         const prepareBody = await prepareResponse.json() as { status?: unknown; sceneId?: unknown };
  523 |         run.prepareJobStatus = typeof prepareBody.status === "string" ? prepareBody.status : "unknown";
  524 |         expect(prepareResponse.ok(), `${sourceId} ${label} ${repeat} actual prepare API must succeed`).toBe(true);
  525 |         expect(run.prepareJobStatus, `${sourceId} ${label} ${repeat} prepare must report a known service state`)
  526 |           .toMatch(/^(ready|preparing)$/);
  527 |         if (typeof prepareBody.sceneId === "string") {
  528 |           run.sceneId = prepareBody.sceneId;
  529 |           state.sceneId = prepareBody.sceneId;
  530 |         }
  531 |         await expect.poll(() => run.prepareDurationsMs.length, { timeout: 10_000 }).toBe(1);
  532 |         const input = page.getByLabel("CAD V2 Çizim Etkileşim Alanı");
  533 |         await expect(input).toBeVisible({ timeout: 60_000 });
  534 |         const canvas = page.locator("#document-studio-shell canvas").first();
  535 |         await expect(canvas).toBeVisible({ timeout: 60_000 });
  536 |         if (!canvasCaptureOverlayProbePassed) {
  537 |           await assertCanvasCaptureExcludesUiOverlay(page, canvas);
  538 |           canvasCaptureOverlayProbePassed = true;
  539 |         }
  540 |         const captureRasterSample = async () => {
  541 |           const screenshot = await captureCanvasWithoutUiOverlays(page, canvas);
  542 |           const raster = measureRaster(screenshot);
  543 |           const sample = {
  544 |             elapsedMs: performance.now() - startedAt,
  545 |             raster,
  546 |             sha256: sha256(screenshot),
  547 |             ...(repeat <= 1 ? { screenshot } : {}),
  548 |           };
  549 |           rasterSamples.push(sample);
  550 |           if (raster.foregroundPixelCount > 0 && raster.occupiedCellCount > 0 && run.firstNonemptyRasterMs === undefined) {
  551 |             run.firstNonemptyRasterMs = sample.elapsedMs;
  552 |             run.firstNonemptyRaster = raster;
  553 |             if (repeat === 0 || repeat === 1) {
  554 |               const sampleName = repeat === 0 ? "seed" : "repeat-1";
  555 |               await testInfo.attach(`l11-first-nonempty-raster-${sourceId}-${sampleName}-${label}.png`, {
  556 |                 body: screenshot,
  557 |                 contentType: "image/png",
  558 |               });
  559 |             }
  560 |           }
  561 |           return sample;
  562 |         };
  563 |         const firstRasterDeadline = Date.now() + firstUsefulRasterTimeoutMs;
  564 |         while (Date.now() < firstRasterDeadline && run.firstNonemptyRasterMs === undefined) {
  565 |           const drawState = await page.evaluate(() => {
  566 |             const metrics = (window as any).__cadL11;
  567 |             return {
  568 |               firstViewerDrawEpochMs: metrics.firstViewerDrawEpochMs as number | null,
  569 |             };
  570 |           });
  571 |           if (drawState.firstViewerDrawEpochMs !== null && run.firstWebglDrawMs === undefined) {
  572 |             run.firstWebglDrawMs = drawState.firstViewerDrawEpochMs - startedAtEpochMs;
  573 |           }
  574 |           await page.waitForTimeout(250);
  575 |           await captureRasterSample();
  576 |         }
  577 |         if (run.firstNonemptyRasterMs === undefined || !run.firstNonemptyRaster) {
  578 |           const diagnostic = await page.evaluate(() => {
  579 |             const metrics = (window as any).__cadL11;
  580 |             return {
  581 |               firstViewerDrawEpochMs: metrics.firstViewerDrawEpochMs,
  582 |               drawCalls: metrics.drawCalls,
  583 |               progress: document.querySelector('[data-testid="cad-v2-blocking-loading-overlay"]')?.textContent ?? null,
  584 |               hostEventCount: metrics.hostEvents.length,
  585 |               acceptedChunkCount: metrics.hostEvents.filter((event: ResourceEvent) => event.type === "chunk-load-outcome" && event.status === "accepted").length,
  586 |               rejectedChunkCount: metrics.hostEvents.filter((event: ResourceEvent) => event.type === "chunk-load-outcome" && event.status === "rejected").length,
  587 |             };
  588 |           });
  589 |           await testInfo.attach(`l11-first-raster-timeout-${sourceId}-${label}-${repeat}.json`, {
  590 |             body: JSON.stringify(diagnostic, null, 2),
  591 |             contentType: "application/json",
  592 |           });
> 593 |           throw new Error(`${sourceId} ${label} ${repeat} produced no nonempty canvas raster within ${firstUsefulRasterTimeoutMs} ms: ${JSON.stringify(diagnostic)}`);
      |                 ^ Error: R003 cold 0 produced no nonempty canvas raster within 600000 ms: {"firstViewerDrawEpochMs":1792410917187.6,"drawCalls":64006852,"progress":"DWG Motor V2 Hazırlanıyorİndirilen 17764/19529 · Doğrulanan 17764/19529 · Görünür 17764/19527 · Çizilen 0/19529İptal Et","hostEventCount":40564,"acceptedChunkCount":20274,"rejectedChunkCount":0}
  594 |         }
  595 |         const footer = page.locator("footer").filter({ hasText: "MOTOR V2" });
  596 |         await expect(footer).toBeVisible({ timeout: settledHostTimeoutMs });
  597 |         await expect(page.locator('button[title="Yakınlaştır (+)"]')).toBeVisible({ timeout: 60_000 });
  598 | 
  599 |         let previousCount = -1;
  600 |         let stableSamples = 0;
  601 |         const settledDeadline = Date.now() + settledHostTimeoutMs;
  602 |         let nextRasterSampleAt = Date.now() + 500;
  603 |         while (Date.now() < settledDeadline && stableSamples < 5) {
  604 |           const host = await page.evaluate(() => {
  605 |             const events = (window as unknown as { __cadL11: { hostEvents: ResourceEvent[] } }).__cadL11.hostEvents;
  606 |             const started = new Set(events.filter((event) => event.type === "chunk-load-start" && typeof event.loadId === "number")
  607 |               .map((event) => event.loadId!));
  608 |             const completed = new Set(events.filter((event) => event.type === "chunk-load-outcome" && typeof event.loadId === "number")
  609 |               .map((event) => event.loadId!));
  610 |             return { pending: Array.from(started).filter((loadId) => !completed.has(loadId)).length };
  611 |           });
  612 |         if (run.chunkIds.length === previousCount && run.pendingChunkResponses === 0 && host.pending === 0) stableSamples++;
  613 |           else stableSamples = 0;
  614 |           previousCount = run.chunkIds.length;
  615 |           if (Date.now() >= nextRasterSampleAt) {
  616 |             await captureRasterSample();
  617 |             nextRasterSampleAt = Date.now() + 500;
  618 |           }
  619 |           await page.waitForTimeout(100);
  620 |         }
  621 |         if (stableSamples !== 5) {
  622 |           const diagnostic = await page.evaluate(() => {
  623 |             const events = (window as unknown as { __cadL11: { hostEvents: ResourceEvent[] } }).__cadL11.hostEvents;
  624 |             const starts = new Set(events.filter((event) => event.type === "chunk-load-start" && typeof event.loadId === "number")
  625 |               .map((event) => event.loadId!));
  626 |             const completed = new Set(events.filter((event) => event.type === "chunk-load-outcome" && typeof event.loadId === "number")
  627 |               .map((event) => event.loadId!));
  628 |             return { pendingHostLoads: Array.from(starts).filter((loadId) => !completed.has(loadId)).length, eventCount: events.length };
  629 |           });
  630 |           throw new Error(`${sourceId} ${label} ${repeat} host chunks did not settle within ${settledHostTimeoutMs} ms: ${JSON.stringify(diagnostic)}`);
  631 |         }
  632 |         const events = await page.evaluate(() => (window as unknown as { __cadL11: { hostEvents: ResourceEvent[] } }).__cadL11.hostEvents);
  633 |         const starts = events.filter((event) => event.type === "chunk-load-start");
  634 |         const outcomes = events.filter((event) => event.type === "chunk-load-outcome");
  635 |         expect(run.chunkIds.length, `${sourceId} ${label} ${repeat} must fetch source chunks`).toBeGreaterThan(0);
  636 |         expect(run.failedChunkRequestCount,
  637 |           `${sourceId} ${label} ${repeat} actual chunk API requests must all succeed`).toBe(0);
  638 |         if (run.prepareDurationsMs.length !== 1) {
  639 |           const diagnostic = {
  640 |             sourceId,
  641 |             label,
  642 |             repeat,
  643 |             prepareDurationsMs: run.prepareDurationsMs,
  644 |             apiCalls: run.apiCallDiagnostics,
  645 |             hostLifecycleMessages: run.hostLifecycleMessages,
  646 |             sceneId: run.sceneId ?? null,
  647 |             fetchedChunkCount: run.chunkIds.length,
  648 |             failedChunkRequestCount: run.failedChunkRequestCount,
  649 |             pendingChunkResponses: run.pendingChunkResponses,
  650 |             firstUsefulRasterMs: run.firstUsefulRasterMs ?? null,
  651 |           };
  652 |           await testInfo.attach(`l11-prepare-api-diagnostics-${sourceId}-${label}-${repeat}.json`, {
  653 |             body: JSON.stringify(diagnostic, null, 2),
  654 |             contentType: "application/json",
  655 |           });
  656 |           console.log(`[L11_PREPARE_API_DIAGNOSTICS_${sourceId}] ${JSON.stringify(diagnostic)}`);
  657 |         }
  658 |         expect(run.prepareDurationsMs.length,
  659 |           `${sourceId} ${label} ${repeat} must have one actual prepare API duration`).toBe(1);
  660 |         expect(run.sceneId, `${sourceId} ${label} ${repeat} must resolve an actual persisted scene ID`).toBeTruthy();
  661 |         expect(outcomes.length, `${sourceId} ${label} ${repeat} every host load must have a terminal outcome`).toBe(starts.length);
  662 |         const warning = await page.getByTestId("cad-v2-quality-warning").textContent().catch(() => null);
  663 |         const initialChunkIds = [...run.chunkIds];
  664 |         const requestedChunkIds = new Set(initialChunkIds);
  665 |         const rejectedVisibleChunkEvents = outcomes
  666 |           .filter((event) => event.status === "rejected" && event.chunkId && requestedChunkIds.has(event.chunkId));
  667 |         const rejectedVisibleChunkIds = [...new Set(rejectedVisibleChunkEvents.map((event) => event.chunkId!))];
  668 |         if (rejectedVisibleChunkEvents.length > 0) {
  669 |           const reasonCounts = rejectedVisibleChunkEvents.flatMap((event) => event.rejectionResources ?? [])
  670 |             .reduce<Record<string, number>>((counts, resource) => {
  671 |               counts[resource] = (counts[resource] ?? 0) + 1;
  672 |               return counts;
  673 |             }, {});
  674 |           console.log(`[L11_RESOURCE_${sourceId}_${label}_${repeat}] ${JSON.stringify({
  675 |             requestedVisibleChunkCount: requestedChunkIds.size,
  676 |             rejectedVisibleChunkCount: rejectedVisibleChunkIds.length,
  677 |             reasonCounts,
  678 |             rejected: rejectedVisibleChunkEvents.slice(0, 20).map((event) => ({
  679 |               chunkId: event.chunkId,
  680 |               resources: event.rejectionResources,
  681 |               cpu: event.cpuResidentBytes,
  682 |               cpuCandidate: event.candidateCpuBytes,
  683 |               geometryCpuBytesAdded: event.geometryCpuBytesAdded,
  684 |               incomingUnpackedCpuBytes: event.incomingUnpackedCpuBytes,
  685 |               sharedRendererSourceBytes: event.sharedRendererSourceBytes,
  686 |               candidateRetainedSourceBytes: event.retainedRefinementSourceBytesIfAccepted,
  687 |               releasedUnusedPathDistanceBytes: event.releasedUnusedPathDistanceBytes,
  688 |               positionCodecErrorWorld: event.positionCodecErrorWorld,
  689 |               positionCodecErrorCssPixels: event.positionCodecErrorCssPixels,
  690 |               cpuLimit: event.cpuBudgetBytes,
  691 |               gpu: event.gpuBufferBytesEstimate,
  692 |               gpuCandidate: event.candidateGpuBufferBytes,
  693 |               gpuLimit: event.gpuBudgetBytes,
```
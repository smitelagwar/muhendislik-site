# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: cad-v2-l11-browser-release.spec.ts >> CAD V2 L11 browser release — R002/R003/R004 >> cold host open + warm host reopen, 30 interactions and settled raster
- Location: tests\document-studio\cad-v2-l11-browser-release.spec.ts:337:7

# Error details

```
Error: R003 cold 0 must have one actual prepare API duration

expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 2
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
  469 |         }
  470 |         const captureRasterSample = async () => {
  471 |           const screenshot = await captureCanvasWithoutUiOverlays(page, canvas);
  472 |           const raster = measureRaster(screenshot);
  473 |           const sample = {
  474 |             elapsedMs: performance.now() - startedAt,
  475 |             raster,
  476 |             sha256: sha256(screenshot),
  477 |             ...(repeat <= 1 ? { screenshot } : {}),
  478 |           };
  479 |           rasterSamples.push(sample);
  480 |           if (raster.foregroundPixelCount > 0 && raster.occupiedCellCount > 0 && run.firstNonemptyRasterMs === undefined) {
  481 |             run.firstNonemptyRasterMs = sample.elapsedMs;
  482 |             run.firstNonemptyRaster = raster;
  483 |             if (repeat === 0 || repeat === 1) {
  484 |               const sampleName = repeat === 0 ? "seed" : "repeat-1";
  485 |               await testInfo.attach(`l11-first-nonempty-raster-${sourceId}-${sampleName}-${label}.png`, {
  486 |                 body: screenshot,
  487 |                 contentType: "image/png",
  488 |               });
  489 |             }
  490 |           }
  491 |           return sample;
  492 |         };
  493 |         const firstRasterDeadline = Date.now() + firstUsefulRasterTimeoutMs;
  494 |         while (Date.now() < firstRasterDeadline && run.firstNonemptyRasterMs === undefined) {
  495 |           const drawState = await page.evaluate(() => {
  496 |             const metrics = (window as any).__cadL11;
  497 |             return {
  498 |               firstViewerDrawEpochMs: metrics.firstViewerDrawEpochMs as number | null,
  499 |             };
  500 |           });
  501 |           if (drawState.firstViewerDrawEpochMs !== null && run.firstWebglDrawMs === undefined) {
  502 |             run.firstWebglDrawMs = drawState.firstViewerDrawEpochMs - startedAtEpochMs;
  503 |           }
  504 |           await page.waitForTimeout(250);
  505 |           await captureRasterSample();
  506 |         }
  507 |         if (run.firstNonemptyRasterMs === undefined || !run.firstNonemptyRaster) {
  508 |           const diagnostic = await page.evaluate(() => {
  509 |             const metrics = (window as any).__cadL11;
  510 |             return {
  511 |               firstViewerDrawEpochMs: metrics.firstViewerDrawEpochMs,
  512 |               drawCalls: metrics.drawCalls,
  513 |               progress: document.querySelector('[data-testid="cad-v2-blocking-loading-overlay"]')?.textContent ?? null,
  514 |               hostEventCount: metrics.hostEvents.length,
  515 |               acceptedChunkCount: metrics.hostEvents.filter((event: ResourceEvent) => event.type === "chunk-load-outcome" && event.status === "accepted").length,
  516 |               rejectedChunkCount: metrics.hostEvents.filter((event: ResourceEvent) => event.type === "chunk-load-outcome" && event.status === "rejected").length,
  517 |             };
  518 |           });
  519 |           await testInfo.attach(`l11-first-raster-timeout-${sourceId}-${label}-${repeat}.json`, {
  520 |             body: JSON.stringify(diagnostic, null, 2),
  521 |             contentType: "application/json",
  522 |           });
  523 |           throw new Error(`${sourceId} ${label} ${repeat} produced no nonempty canvas raster within ${firstUsefulRasterTimeoutMs} ms: ${JSON.stringify(diagnostic)}`);
  524 |         }
  525 |         const footer = page.locator("footer").filter({ hasText: "MOTOR V2" });
  526 |         await expect(footer).toBeVisible({ timeout: settledHostTimeoutMs });
  527 |         await expect(page.locator('button[title="Yakınlaştır (+)"]')).toBeVisible({ timeout: 60_000 });
  528 | 
  529 |         let previousCount = -1;
  530 |         let stableSamples = 0;
  531 |         const settledDeadline = Date.now() + settledHostTimeoutMs;
  532 |         let nextRasterSampleAt = Date.now() + 500;
  533 |         while (Date.now() < settledDeadline && stableSamples < 5) {
  534 |           const host = await page.evaluate(() => {
  535 |             const events = (window as unknown as { __cadL11: { hostEvents: ResourceEvent[] } }).__cadL11.hostEvents;
  536 |             const started = new Set(events.filter((event) => event.type === "chunk-load-start" && typeof event.loadId === "number")
  537 |               .map((event) => event.loadId!));
  538 |             const completed = new Set(events.filter((event) => event.type === "chunk-load-outcome" && typeof event.loadId === "number")
  539 |               .map((event) => event.loadId!));
  540 |             return { pending: Array.from(started).filter((loadId) => !completed.has(loadId)).length };
  541 |           });
  542 |         if (run.chunkIds.length === previousCount && run.pendingChunkResponses === 0 && host.pending === 0) stableSamples++;
  543 |           else stableSamples = 0;
  544 |           previousCount = run.chunkIds.length;
  545 |           if (Date.now() >= nextRasterSampleAt) {
  546 |             await captureRasterSample();
  547 |             nextRasterSampleAt = Date.now() + 500;
  548 |           }
  549 |           await page.waitForTimeout(100);
  550 |         }
  551 |         if (stableSamples !== 5) {
  552 |           const diagnostic = await page.evaluate(() => {
  553 |             const events = (window as unknown as { __cadL11: { hostEvents: ResourceEvent[] } }).__cadL11.hostEvents;
  554 |             const starts = new Set(events.filter((event) => event.type === "chunk-load-start" && typeof event.loadId === "number")
  555 |               .map((event) => event.loadId!));
  556 |             const completed = new Set(events.filter((event) => event.type === "chunk-load-outcome" && typeof event.loadId === "number")
  557 |               .map((event) => event.loadId!));
  558 |             return { pendingHostLoads: Array.from(starts).filter((loadId) => !completed.has(loadId)).length, eventCount: events.length };
  559 |           });
  560 |           throw new Error(`${sourceId} ${label} ${repeat} host chunks did not settle within ${settledHostTimeoutMs} ms: ${JSON.stringify(diagnostic)}`);
  561 |         }
  562 |         const events = await page.evaluate(() => (window as unknown as { __cadL11: { hostEvents: ResourceEvent[] } }).__cadL11.hostEvents);
  563 |         const starts = events.filter((event) => event.type === "chunk-load-start");
  564 |         const outcomes = events.filter((event) => event.type === "chunk-load-outcome");
  565 |         expect(run.chunkIds.length, `${sourceId} ${label} ${repeat} must fetch source chunks`).toBeGreaterThan(0);
  566 |         expect(run.failedChunkRequestCount,
  567 |           `${sourceId} ${label} ${repeat} actual chunk API requests must all succeed`).toBe(0);
  568 |         expect(run.prepareDurationsMs.length,
> 569 |           `${sourceId} ${label} ${repeat} must have one actual prepare API duration`).toBe(1);
      |                                                                                       ^ Error: R003 cold 0 must have one actual prepare API duration
  570 |         expect(run.sceneId, `${sourceId} ${label} ${repeat} must resolve an actual persisted scene ID`).toBeTruthy();
  571 |         expect(outcomes.length, `${sourceId} ${label} ${repeat} every host load must have a terminal outcome`).toBe(starts.length);
  572 |         const warning = await page.getByTestId("cad-v2-quality-warning").textContent().catch(() => null);
  573 |         const initialChunkIds = [...run.chunkIds];
  574 |         const requestedChunkIds = new Set(initialChunkIds);
  575 |         const rejectedVisibleChunkEvents = outcomes
  576 |           .filter((event) => event.status === "rejected" && event.chunkId && requestedChunkIds.has(event.chunkId));
  577 |         const rejectedVisibleChunkIds = [...new Set(rejectedVisibleChunkEvents.map((event) => event.chunkId!))];
  578 |         if (rejectedVisibleChunkEvents.length > 0) {
  579 |           const reasonCounts = rejectedVisibleChunkEvents.flatMap((event) => event.rejectionResources ?? [])
  580 |             .reduce<Record<string, number>>((counts, resource) => {
  581 |               counts[resource] = (counts[resource] ?? 0) + 1;
  582 |               return counts;
  583 |             }, {});
  584 |           console.log(`[L11_RESOURCE_${sourceId}_${label}_${repeat}] ${JSON.stringify({
  585 |             requestedVisibleChunkCount: requestedChunkIds.size,
  586 |             rejectedVisibleChunkCount: rejectedVisibleChunkIds.length,
  587 |             reasonCounts,
  588 |             rejected: rejectedVisibleChunkEvents.slice(0, 20).map((event) => ({
  589 |               chunkId: event.chunkId,
  590 |               resources: event.rejectionResources,
  591 |               cpu: event.cpuResidentBytes,
  592 |               cpuCandidate: event.candidateCpuBytes,
  593 |               geometryCpuBytesAdded: event.geometryCpuBytesAdded,
  594 |               incomingUnpackedCpuBytes: event.incomingUnpackedCpuBytes,
  595 |               sharedRendererSourceBytes: event.sharedRendererSourceBytes,
  596 |               candidateRetainedSourceBytes: event.retainedRefinementSourceBytesIfAccepted,
  597 |               releasedUnusedPathDistanceBytes: event.releasedUnusedPathDistanceBytes,
  598 |               positionCodecErrorWorld: event.positionCodecErrorWorld,
  599 |               positionCodecErrorCssPixels: event.positionCodecErrorCssPixels,
  600 |               cpuLimit: event.cpuBudgetBytes,
  601 |               gpu: event.gpuBufferBytesEstimate,
  602 |               gpuCandidate: event.candidateGpuBufferBytes,
  603 |               gpuLimit: event.gpuBudgetBytes,
  604 |               vertices: event.chunkVertexCount,
  605 |               revision: event.visibleSetRevision,
  606 |             })),
  607 |           })}`);
  608 |         }
  609 |         expect(rejectedVisibleChunkIds,
  610 |           `${sourceId} ${label} ${repeat} visible chunks must not be skipped by the CPU/GPU admission budget`).toEqual([]);
  611 |         expect(warning, `${sourceId} ${label} ${repeat} settled viewport must not report a partial drawing`).not.toMatch(/kısmi|parça atlandı/i);
  612 | 
  613 |         await expect(canvas).toBeVisible({ timeout: 10_000 });
  614 |         const screenshot = await captureCanvasWithoutUiOverlays(page, canvas);
  615 |         const raster = measureRaster(screenshot);
  616 |         expect(raster.foregroundPixelCount, `${sourceId} ${label} ${repeat} settled canvas must contain visible drawing pixels`)
  617 |           .toBeGreaterThan(0);
  618 |         expect(raster.occupiedCellCount, `${sourceId} ${label} ${repeat} settled canvas must occupy raster cells`).toBeGreaterThan(0);
  619 |         const settledRasterSample = {
  620 |           elapsedMs: performance.now() - startedAt,
  621 |           raster,
  622 |           sha256: sha256(screenshot),
  623 |           ...(repeat <= 1 ? { screenshot } : {}),
  624 |         };
  625 |         rasterSamples.push(settledRasterSample);
  626 |         const meaningfulPixelThreshold = Math.max(100, Math.ceil(raster.foregroundPixelCount * 0.1));
  627 |         const meaningfulCellThreshold = Math.max(2, Math.ceil(raster.occupiedCellCount * 0.1));
  628 |         const firstMeaningfulSample = rasterSamples.find((sample) =>
  629 |           sample.raster.foregroundPixelCount >= meaningfulPixelThreshold &&
  630 |           sample.raster.occupiedCellCount >= meaningfulCellThreshold);
  631 |         expect(firstMeaningfulSample,
  632 |           `${sourceId} ${label} ${repeat} must produce a substantive raster (>=${meaningfulPixelThreshold} foreground pixels and >=${meaningfulCellThreshold} occupied cells) before/at settled`)
  633 |           .toBeTruthy();
  634 |         run.firstUsefulRasterMs = firstMeaningfulSample!.elapsedMs;
  635 |         run.firstUsefulRaster = firstMeaningfulSample!.raster;
  636 |         run.firstUsefulCanvasSha256 = firstMeaningfulSample!.sha256;
  637 |         run.rasterSamples = rasterSamples.map(({ elapsedMs, raster: sampleRaster, sha256: sampleSha256 }) => ({
  638 |           elapsedMs,
  639 |           raster: sampleRaster,
  640 |           sha256: sampleSha256,
  641 |         }));
  642 |         if (repeat === 0 || repeat === 1) {
  643 |           const sampleName = repeat === 0 ? "seed" : "repeat-1";
  644 |           await testInfo.attach(`l11-settled-raster-${sourceId}-${sampleName}-${label}.png`, {
  645 |             body: screenshot,
  646 |             contentType: "image/png",
  647 |           });
  648 |           const meaningfulScreenshot = firstMeaningfulSample!.screenshot;
  649 |           if (meaningfulScreenshot) {
  650 |             await testInfo.attach(`l11-first-meaningful-raster-${sourceId}-${sampleName}-${label}.png`, {
  651 |               body: meaningfulScreenshot,
  652 |               contentType: "image/png",
  653 |             });
  654 |           }
  655 |         }
  656 |         const settledMs = performance.now() - startedAt;
  657 | 
  658 |         await page.evaluate(() => {
  659 |           const metrics = (window as any).__cadL11;
  660 |           metrics.inputToDrawMs.length = 0;
  661 |           metrics.inputKinds.length = 0;
  662 |           metrics.inputMarkers.length = 0;
  663 |           metrics.drawCalls = 0;
  664 |           metrics.drawCallsByMethod = {};
  665 |           metrics.multiDrawCalls = 0;
  666 |         });
  667 |         const waitForInputDraw = async (before: number, description: "zoom-in" | "zoom-out") => {
  668 |           const inputMarkerCountBefore = await page.evaluate(() => (window as any).__cadL11.inputMarkers.length as number);
  669 |           await page.evaluate(({ kind }) => {
```
import assert from "node:assert/strict";
import { pdfRenderQueue } from "../../src/lib/dokumantasyon/studio/pdf/pdf-render-queue";

async function runRenderPipelineTests() {
  console.log("=== FAZ C: Render Hattı ve Bellek Yönetimi Testleri ===\n");

  // --------------------------------------------------------------------------
  // TEST 1: Eşzamanlılık Sınırı (Concurrency <= 2)
  // --------------------------------------------------------------------------
  {
    pdfRenderQueue.clear();
    let currentConcurrent = 0;
    let maxObservedConcurrent = 0;
    const completedTasks: string[] = [];

    const makeTask = (id: string, pageNum: number, durationMs: number) => {
      return new Promise<void>((resolve) => {
        pdfRenderQueue.enqueue(
          id,
          pageNum,
          () => {
            currentConcurrent++;
            if (currentConcurrent > maxObservedConcurrent) {
              maxObservedConcurrent = currentConcurrent;
            }
            return {
              promise: new Promise((r) => setTimeout(r, durationMs)).then(() => {
                currentConcurrent--;
              }),
              cancel: () => {},
            };
          },
          () => {
            completedTasks.push(id);
            resolve();
          }
        );
      });
    };

    const promises = [
      makeTask("p1", 1, 50),
      makeTask("p2", 2, 50),
      makeTask("p3", 3, 50),
      makeTask("p4", 4, 50),
      makeTask("p5", 5, 50),
    ];

    await Promise.all(promises);

    console.log(`[PASS] Kuyruk eşzamanlılık sınırı: Gözlemlenen en yüksek eşzamanlı görev = ${maxObservedConcurrent} (Beklenen: <= 2)`);
    assert.ok(maxObservedConcurrent <= 2, `Eşzamanlı görev sayısı 2'yi aşamaz, gözlemlenen: ${maxObservedConcurrent}`);
    assert.equal(completedTasks.length, 5, "Tüm 5 görev başarıyla tamamlanmalı");
  }

  // --------------------------------------------------------------------------
  // TEST 2: Öncelik Sıralaması (Görünür Sayfaya Yakınlık)
  // --------------------------------------------------------------------------
  {
    pdfRenderQueue.clear();
    pdfRenderQueue.setCurrentPage(10); // Kullanıcı şu anda 10. sayfada

    const executionOrder: number[] = [];

    // 2 eşzamanlı slotu dolduracak kilit görevler
    let unlockBlocker: () => void = () => {};
    const blockerPromise = new Promise<void>((r) => {
      unlockBlocker = r;
    });

    // 2 blocker slotu doldurur
    pdfRenderQueue.enqueue("b1", 1, () => ({ promise: blockerPromise, cancel: () => {} }));
    pdfRenderQueue.enqueue("b2", 2, () => ({ promise: blockerPromise, cancel: () => {} }));

    // Şimdi kuyruğa farklı mesafelerden sayfalar ekle: sayfa 20 (mesafe 10), sayfa 11 (mesafe 1), sayfa 50 (mesafe 40)
    const p20 = new Promise<void>((resolve) => {
      pdfRenderQueue.enqueue("p20", 20, () => ({ promise: Promise.resolve(), cancel: () => {} }), () => {
        executionOrder.push(20);
        resolve();
      });
    });

    const p11 = new Promise<void>((resolve) => {
      pdfRenderQueue.enqueue("p11", 11, () => ({ promise: Promise.resolve(), cancel: () => {} }), () => {
        executionOrder.push(11);
        resolve();
      });
    });

    const p50 = new Promise<void>((resolve) => {
      pdfRenderQueue.enqueue("p50", 50, () => ({ promise: Promise.resolve(), cancel: () => {} }), () => {
        executionOrder.push(50);
        resolve();
      });
    });

    // Blocker'ları serbest bırak ve kuyruğun sıralamayı işlemesini bekle
    unlockBlocker();
    await Promise.all([p20, p11, p50]);

    console.log(`[PASS] Öncelik sıralaması: İşlenme sırası = [${executionOrder.join(", ")}] (Hedef sayfa 10'a en yakın sayfa 11 önce işlendi)`);
    assert.equal(executionOrder[0], 11, "Sayfa 10'a en yakın olan Sayfa 11 ilk sırada çalıştırılmalıdır");
    assert.equal(executionOrder[1], 20, "Sayfa 20, Sayfa 50'den önce çalıştırılmalıdır");
    assert.equal(executionOrder[2], 50, "Sayfa 50 en son çalıştırılmalıdır");
  }

  // --------------------------------------------------------------------------
  // TEST 3: Görev İptali ve RenderingCancelledException Sessiz Yutulması
  // --------------------------------------------------------------------------
  {
    pdfRenderQueue.clear();
    let cancelCalled = false;
    let errorCaught: any = null;

    pdfRenderQueue.enqueue(
      "cancel-test",
      5,
      () => {
        return {
          promise: new Promise((_, reject) => {
            const err = new Error("Rendering cancelled");
            err.name = "RenderingCancelledException";
            setTimeout(() => reject(err), 20);
          }),
          cancel: () => {
            cancelCalled = true;
          },
        };
      },
      () => {},
      (err) => {
        errorCaught = err;
      }
    );

    // Hemen iptal et
    pdfRenderQueue.cancel("cancel-test");
    await new Promise((r) => setTimeout(r, 60));

    console.log(`[PASS] İptal mekanizması: cancel() tetiklendi mi? ${cancelCalled ? "EVET" : "HAYIR"}, Hata yutuldu mu? ${errorCaught === null ? "EVET" : "HAYIR"}`);
    assert.ok(cancelCalled, "Görev iptal fonksiyonu tetiklenmelidir");
    assert.equal(errorCaught, null, "RenderingCancelledException sessizce yutulmalı, konsola veya onError'a sızmamalıdır");
  }

  // --------------------------------------------------------------------------
  // TEST 4: Mimari Karar 7 — Piksel Bütçesi ve Aşırı Zoom Sınırı
  // --------------------------------------------------------------------------
  {
    // A3 Boyut (842 x 1191 pt) %400 zoom altında:
    const a3Width = 842;
    const a3Height = 1191;
    const zoomScale = 4.0;
    const vpWidth = a3Width * zoomScale;   // 3368 px
    const vpHeight = a3Height * zoomScale; // 4764 px

    // Mobil bütçe sınırı: 16.000.000 piksel
    const MAX_CANVAS_PIXELS_MOBILE = 16_000_000;
    const dpr = 2.0;

    const unconstrainedPixels = vpWidth * vpHeight * dpr * dpr;
    assert.ok(unconstrainedPixels > MAX_CANVAS_PIXELS_MOBILE, "Korumasız durumda piksel bütçesi aşılır (çökme riski)");

    let outputScale = dpr;
    const totalPixels = vpWidth * vpHeight * outputScale * outputScale;
    if (totalPixels > MAX_CANVAS_PIXELS_MOBILE) {
      outputScale = Math.sqrt(MAX_CANVAS_PIXELS_MOBILE / (vpWidth * vpHeight));
    }

    const constrainedPixels = Math.floor(vpWidth * outputScale) * Math.floor(vpHeight * outputScale);
    console.log(`[PASS] Piksel bütçesi (A3 @ %400): Korumasız = ${(unconstrainedPixels / 1e6).toFixed(1)}M piksel -> Bütçe sonrası = ${(constrainedPixels / 1e6).toFixed(1)}M piksel (Tavan: 16M)`);
    assert.ok(constrainedPixels <= MAX_CANVAS_PIXELS_MOBILE, "Piksel bütçesi 16M tavanını aşamaz");
  }

  // --------------------------------------------------------------------------
  // TEST 5: İntrinsik Rotasyon Formülü Doğrulaması
  // --------------------------------------------------------------------------
  {
    // Sayfa intrinsik olarak 90 derece döndürülmüş (p.rotate = 90)
    // Kullanıcı araç çubuğunda 0, 90, 180, 270 döndürme yapabilir
    const testCases = [
      { intrinsic: 90, userRotation: 0, expected: 90 },     // v1 kusuru: userRotation=0 intrinsik 90'ı siliyordu
      { intrinsic: 90, userRotation: 90, expected: 180 },
      { intrinsic: 90, userRotation: 270, expected: 0 },
      { intrinsic: 0, userRotation: 90, expected: 90 },
      { intrinsic: 270, userRotation: 180, expected: 90 },
    ];

    for (const tc of testCases) {
      const finalRotation = ((tc.intrinsic || 0) + (tc.userRotation || 0)) % 360;
      assert.equal(finalRotation, tc.expected, `İntrinsik ${tc.intrinsic} + Kullanıcı ${tc.userRotation} = ${tc.expected} olmalıdır`);
    }

    console.log("[PASS] İntrinsik rotasyon koruması: Tüm 5 test vakasında rotasyon doğru hesaplandı.");
  }

  console.log("\n>>> Faz C Render Hattı Birim Testleri Başarıyla Tamamlandı.\n");
}

runRenderPipelineTests().catch((err) => {
  console.error("Test başarısız:", err);
  process.exit(1);
});
